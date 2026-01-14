import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import ApiService from '../utils/api_service';
import { getCachedLocation } from '../utils/location_cache';
import { Note, Tag } from '@/app/types';
// DOMPurify will be loaded dynamically
import { CalendarDays, UserCircle, Tags, Clock3, FileAudio, ImageIcon, MapPin } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { GoogleMap } from '@react-google-maps/api';
import { useGoogleMaps } from '../utils/GoogleMapsContext';
import AudioPicker from '@/app/lib/components/NoteEditor/NoteElements/AudioPicker';
import MediaViewer from './media_viewer';

/**
 * Safely checks if a URL belongs to a trusted domain by parsing the hostname
 * @param url - The URL to check
 * @param allowedDomains - Array of allowed domain names (e.g., ['youtube.com', 'vimeo.com'])
 * @returns true if the URL's hostname matches one of the allowed domains
 */
const isTrustedDomain = (url: string, allowedDomains: string[]): boolean => {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    return allowedDomains.some(domain => {
      const domainLower = domain.toLowerCase();
      return hostname === domainLower || hostname.endsWith('.' + domainLower);
    });
  } catch {
    return false;
  }
};

/**
 * Extracts the first few sentences from a string of HTML content.
 * @param {string} BodyText - The HTML content to extract from.
 * @param {number} sentenceCount - The number of sentences to extract.
 * @returns {string} The extracted sentences as plain text.
 */
const getBodyPreview = (bodyText: string, sentenceCount = 2): string => {
  if (typeof document === 'undefined') return ''; // SSR guard
  if (!bodyText || typeof bodyText !== 'string') return '';

  try {
    const tempDiv = document.createElement('div');
    // Clean up problematic URLs before setting innerHTML to prevent network errors
    let cleanedBodyText = bodyText;

    // Remove or fix blob: and data: URLs in img src attributes
    cleanedBodyText = cleanedBodyText.replace(
      /<img[^>]*src=["'](blob:|data:)[^"']*["'][^>]*>/gi,
      '',
    );

    // Remove or fix any other problematic URL schemes in href attributes
    cleanedBodyText = cleanedBodyText.replace(/href=["'](blob:|data:|javascript:)[^"']*["']/gi, '');

    tempDiv.innerHTML = cleanedBodyText;
    const plainText = tempDiv.textContent || tempDiv.innerText || '';
    const sentences = plainText.split(/(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\?)\s/);
    return sentences.slice(0, sentenceCount).join(' ');
  } catch (error) {
    // If there's any error processing the HTML, return empty string
    console.warn('Error extracting body preview:', error);
    return '';
  }
};

// Utility function to format the date
function formatDate(date: string | number | Date) {
  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) return 'Invalid Date';
  return parsedDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// Utility function to format time
function formatTime(date: string | number | Date) {
  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) return 'Invalid Date';
  const hours = parsedDate.getHours();
  const minutes = parsedDate.getMinutes();
  const ampm = hours < 12 ? 'AM' : 'PM';
  return `${hours % 12 || 12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
}

// Convert old tags (strings) to the new format
const convertOldTags = (tags: (Tag | string)[] | undefined): Tag[] => {
  if (!Array.isArray(tags)) return [];
  return tags.map(tag => (typeof tag === 'string' ? { label: tag, origin: 'user' } : tag));
};

const EnhancedNoteCard: React.FC<{ note: Note }> = ({ note }) => {
  const [creator, setCreator] = useState<string>('Loading...');
  const [isImageLoading, setIsImageLoading] = useState(true); // Spinner state
  const [location, setLocation] = useState<string>('Fetching location...'); // State to store the exact location
  const [sanitizedText, setSanitizedText] = useState<string>('');
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const markerRef = React.useRef<any>(null);
  const locationButtonRef = React.useRef<HTMLButtonElement>(null);
  const { isMapsApiLoaded } = useGoogleMaps();
  const tags: Tag[] = convertOldTags(note.tags);

  // Get the body text - check both text and BodyText properties
  const noteText = note.text || (note as any).BodyText || '';

  // Load DOMPurify only on client side to avoid SSR issues
  useEffect(() => {
    if (typeof window !== 'undefined' && noteText) {
      import('dompurify')
        .then(DOMPurify => {
          // Clean problematic URLs BEFORE sanitizing to prevent network errors
          // Ensure cleanedText is always a string
          let cleanedText = String(noteText || '');

          // Remove blob: and data: URLs from img src attributes before processing
          // Use regex constructor to avoid parsing issues - matches img tags with blob: or data: URLs
          const imgBlobDataRegex = new RegExp(
            '<img[^>]*src\\s*=\\s*["\'](blob:|data:)[^"\']*["\'][^>]*>',
            'gi',
          );
          cleanedText = cleanedText.replace(imgBlobDataRegex, '');

          // Remove problematic URL schemes from href attributes
          const hrefBlobDataRegex = new RegExp(
            'href=["\'](blob:|data:|javascript:)[^"\']*["\']',
            'gi',
          );
          cleanedText = cleanedText.replace(hrefBlobDataRegex, '');

          let sanitized = DOMPurify.default.sanitize(cleanedText);

          // Process HTML content to handle images and videos
          if (typeof document !== 'undefined') {
            try {
              const tempDiv = document.createElement('div');
              // Additional safety: remove any remaining problematic URLs before setting innerHTML
              sanitized = sanitized.replace(/src=["'](blob:|data:)[^"']*["']/gi, '');
              sanitized = sanitized.replace(/href=["'](blob:|data:|javascript:)[^"']*["']/gi, '');

              tempDiv.innerHTML = sanitized;

              // Handle images
              const images = tempDiv.querySelectorAll('img');
              images.forEach(img => {
                const src = img.getAttribute('src');
                if (src && (src.startsWith('blob:') || src.startsWith('data:'))) {
                  // Remove the src attribute or replace with placeholder
                  img.removeAttribute('src');
                  img.setAttribute('alt', 'Image not available');
                  img.style.display = 'none'; // Hide broken images
                }
              });

              // Handle video links - convert to video elements
              const links = tempDiv.querySelectorAll('a');
              links.forEach(link => {
                const href = link.getAttribute('href');
                const linkText = link.textContent || '';

                // Check if this is a video link (contains video URL or "Video" text)
                if (
                  href &&
                  (href.match(/\.(mp4|webm|ogg|mov|avi|wmv|flv|mkv)(\?.*)?$/i) ||
                    linkText.toLowerCase().includes('video') ||
                    href.includes('video'))
                ) {
                  // Check if it's a valid video URL
                  const isDirectVideoFile = href.match(
                    /\.(mp4|webm|ogg|mov|avi|wmv|flv|mkv)(\?.*)?$/i,
                  );
                  const isTrustedVideoHost =
                    href.startsWith('http') &&
                    isTrustedDomain(href, [
                      'youtube.com',
                      'www.youtube.com',
                      'youtu.be',
                      'vimeo.com',
                      'player.vimeo.com',
                    ]);
                  const isVideoUrl = isDirectVideoFile || isTrustedVideoHost;

                  if (isVideoUrl) {
                    // Create a video element to replace the link
                    const videoWrapper = document.createElement('div');
                    videoWrapper.className = 'video-wrapper my-4';
                    videoWrapper.style.cssText =
                      'width: 100%; max-width: 100%; margin: 1rem auto; display: block;';

                    // Check if it's YouTube/Vimeo or direct video file
                    if (
                      isTrustedDomain(href, [
                        'youtube.com',
                        'www.youtube.com',
                        'youtu.be',
                        'vimeo.com',
                        'player.vimeo.com',
                      ])
                    ) {
                      const iframe = document.createElement('iframe');
                      let embedUrl = href;
                      try {
                        const urlObj = new URL(href);
                        const hostname = urlObj.hostname.toLowerCase();

                        if (hostname === 'www.youtube.com' || hostname === 'youtube.com') {
                          const videoId = urlObj.searchParams.get('v');
                          if (videoId) {
                            embedUrl = `https://www.youtube.com/embed/${videoId}`;
                          }
                        } else if (hostname === 'youtu.be') {
                          const videoId = urlObj.pathname.slice(1).split('?')[0];
                          if (videoId) {
                            embedUrl = `https://www.youtube.com/embed/${videoId}`;
                          }
                        } else if (hostname === 'vimeo.com' || hostname === 'www.vimeo.com') {
                          const videoId = urlObj.pathname.slice(1).split('?')[0];
                          if (videoId) {
                            embedUrl = `https://player.vimeo.com/video/${videoId}`;
                          }
                        }
                      } catch {
                        // If URL parsing fails, don't create iframe
                        return;
                      }
                      iframe.src = embedUrl;
                      iframe.frameBorder = '0';
                      iframe.allow =
                        'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
                      iframe.allowFullscreen = true;
                      iframe.style.cssText =
                        'width: 100%; max-width: 100%; aspect-ratio: 16/9; border-radius: 0.5rem; display: block;';
                      videoWrapper.appendChild(iframe);
                    } else {
                      const video = document.createElement('video');
                      video.src = href;
                      video.controls = true;
                      video.style.cssText =
                        'width: 100%; max-width: 100%; height: auto; max-height: 500px; border-radius: 0.5rem; display: block; object-fit: contain;';
                      video.className = 'w-full';
                      videoWrapper.appendChild(video);
                    }

                    link.parentNode?.replaceChild(videoWrapper, link);
                  }
                }
              });

              sanitized = tempDiv.innerHTML;
            } catch (error) {
              // If setting innerHTML fails due to network errors, use cleaned text without DOM manipulation
              console.warn('Error processing HTML content, using cleaned text:', error);
              sanitized = cleanedText;
            }
          } else {
            sanitized = cleanedText;
          }

          setSanitizedText(sanitized);
        })
        .catch(error => {
          console.error('Error loading DOMPurify:', error);
          // Fallback: use noteText directly if DOMPurify fails
          setSanitizedText(noteText);
        });
    } else if (noteText) {
      // Fallback for SSR or when window is undefined
      setSanitizedText(noteText);
    }
  }, [noteText]);

  // Fetch the creator's name based on the note's creator ID (same logic as map page)
  useEffect(() => {
    ApiService.fetchCreatorName(note.creator)
      .then(name => setCreator(name))
      .catch(error => {
        console.error('Error fetching creator name:', error, note.creator);
        setCreator('Unknown creator');
      });
  }, [note.creator]);

  // Get the body text preview
  const bodyPreview = getBodyPreview(noteText, 2);

  // Constrain images and process videos in the dialog content after render
  useEffect(() => {
    const processMedia = () => {
      const contentDiv = document.getElementById('note-content');
      if (contentDiv) {
        // Handle images
        const images = contentDiv.querySelectorAll('img');
        images.forEach(img => {
          const src = img.getAttribute('src');
          // Hide or remove images with blob URLs or data URIs
          if (src && (src.startsWith('blob:') || src.startsWith('data:'))) {
            img.style.display = 'none';
            img.removeAttribute('src');
            return;
          }

          img.style.maxWidth = '100%';
          img.style.height = 'auto';
          img.style.objectFit = 'contain';
          img.style.maxHeight = '500px';
          img.style.width = 'auto';
          img.style.display = 'block';
          img.style.margin = '1rem auto';
          img.style.borderRadius = '0.5rem';
        });

        // Handle video links - convert to video players
        const links = contentDiv.querySelectorAll('a');
        links.forEach(link => {
          const href = link.getAttribute('href');
          const linkText = link.textContent || '';

          // Check if this is a video link
          const isDirectVideoFile =
            href && href.match(/\.(mp4|webm|ogg|mov|avi|wmv|flv|mkv)(\?.*)?$/i);
          const isTrustedVideoHost =
            href &&
            href.startsWith('http') &&
            isTrustedDomain(href, [
              'youtube.com',
              'www.youtube.com',
              'youtu.be',
              'vimeo.com',
              'player.vimeo.com',
            ]);
          const isVideoLink =
            isDirectVideoFile ||
            isTrustedVideoHost ||
            (href && linkText.toLowerCase().includes('video'));

          if (isVideoLink) {
            // Check if already converted (has a video sibling or parent)
            if (
              link.parentElement?.querySelector('video') ||
              link.parentElement?.querySelector('iframe')
            ) {
              return;
            }

            // Create video wrapper
            const videoWrapper = document.createElement('div');
            videoWrapper.className = 'video-wrapper my-4';
            videoWrapper.style.cssText =
              'width: 100%; max-width: 100%; margin: 1rem auto; display: block;';

            // Check if it's a YouTube or Vimeo URL
            if (isTrustedVideoHost) {
              // Create iframe for YouTube/Vimeo
              const iframe = document.createElement('iframe');
              let embedUrl = href;
              try {
                const urlObj = new URL(href);
                const hostname = urlObj.hostname.toLowerCase();

                if (hostname === 'www.youtube.com' || hostname === 'youtube.com') {
                  const videoId = urlObj.searchParams.get('v');
                  if (videoId) {
                    embedUrl = `https://www.youtube.com/embed/${videoId}`;
                  }
                } else if (hostname === 'youtu.be') {
                  const videoId = urlObj.pathname.slice(1).split('?')[0];
                  if (videoId) {
                    embedUrl = `https://www.youtube.com/embed/${videoId}`;
                  }
                } else if (hostname === 'vimeo.com' || hostname === 'www.vimeo.com') {
                  const videoId = urlObj.pathname.slice(1).split('?')[0];
                  if (videoId) {
                    embedUrl = `https://player.vimeo.com/video/${videoId}`;
                  }
                }
              } catch {
                // If URL parsing fails, don't create iframe
                return;
              }
              iframe.src = embedUrl;
              iframe.frameBorder = '0';
              iframe.allow =
                'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
              iframe.allowFullscreen = true;
              iframe.style.cssText =
                'width: 100%; max-width: 100%; aspect-ratio: 16/9; border-radius: 0.5rem; display: block;';
              videoWrapper.appendChild(iframe);
            } else {
              // Direct video file
              const video = document.createElement('video');
              video.src = href;
              video.controls = true;
              video.style.cssText =
                'width: 100%; max-width: 100%; height: auto; max-height: 500px; border-radius: 0.5rem; display: block; object-fit: contain;';
              video.className = 'w-full';
              videoWrapper.appendChild(video);
            }

            // Replace the link with the video
            link.parentNode?.replaceChild(videoWrapper, link);
          }
        });
      }
    };

    // Run after a short delay to ensure content is rendered
    const timeoutId = setTimeout(processMedia, 100);

    // Also observe for dynamically loaded content
    const contentDiv = document.getElementById('note-content');
    let observer: MutationObserver | null = null;

    if (contentDiv && typeof window !== 'undefined') {
      observer = new MutationObserver(() => {
        processMedia();
      });

      observer.observe(contentDiv, {
        childList: true,
        subtree: true,
      });
    }

    return () => {
      clearTimeout(timeoutId);
      if (observer) {
        observer.disconnect();
      }
    };
  }, [sanitizedText, noteText]);

  // Fetch the exact location using reverse geocoding with caching
  useEffect(() => {
    const fetchLocation = async () => {
      const MAPS_API_KEY = process.env.NEXT_PUBLIC_MAP_KEY;

      // Check if we have valid coordinates before fetching
      if (note.latitude && note.longitude && MAPS_API_KEY) {
        const lat = parseFloat(note.latitude.toString());
        const lng = parseFloat(note.longitude.toString());

        // Use the shared location cache utility
        const location = await getCachedLocation(lat, lng, MAPS_API_KEY);
        setLocation(location);
      } else {
        // Set fallback based on whether coordinates exist
        setLocation(note.latitude && note.longitude ? 'Location not found' : '');
      }
    };

    fetchLocation();
  }, [note.latitude, note.longitude]);

  // Get the first image from the note.media array
  const coverImage = note.media?.find(media => media.type === 'image')?.uri;

  // Validate that coverImage is a valid URL string (exclude blob URLs and data URIs)
  const isValidImageUrl =
    coverImage &&
    typeof coverImage === 'string' &&
    coverImage.trim() !== '' &&
    !coverImage.startsWith('blob:') && // Exclude blob URLs
    !coverImage.startsWith('data:') && // Exclude data URIs
    (coverImage.startsWith('http://') ||
      coverImage.startsWith('https://') ||
      coverImage.startsWith('/'));

  // Get coordinates for the map
  const noteLat = note.latitude ? parseFloat(note.latitude.toString()) : null;
  const noteLng = note.longitude ? parseFloat(note.longitude.toString()) : null;
  const hasValidCoordinates =
    noteLat !== null && noteLng !== null && !isNaN(noteLat) && !isNaN(noteLng);

  // Create AdvancedMarkerElement when map is ready
  useEffect(() => {
    if (!isMapsApiLoaded || !mapInstance || !hasValidCoordinates || !isMapOpen) {
      return;
    }

    // Clean up previous marker
    if (markerRef.current) {
      markerRef.current.map = null;
      markerRef.current = null;
    }

    // Create new AdvancedMarkerElement
    if (typeof window !== 'undefined' && (window as any).google?.maps?.marker) {
      const google = (window as any).google;
      const position = new google.maps.LatLng(noteLat!, noteLng!);

      // Create a simple pin icon
      const pinElement = document.createElement('div');
      pinElement.innerHTML = `
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 0C10.477 0 6 4.477 6 10c0 8 10 22 10 22s10-14 10-22c0-5.523-4.477-10-10-10z" fill="#EA4335"/>
          <circle cx="16" cy="10" r="4" fill="white"/>
        </svg>
      `;
      pinElement.style.width = '32px';
      pinElement.style.height = '32px';
      pinElement.style.cursor = 'pointer';

      const marker = new google.maps.marker.AdvancedMarkerElement({
        position,
        map: mapInstance,
        content: pinElement,
        title: location,
      });

      markerRef.current = marker;
    }

    return () => {
      if (markerRef.current) {
        markerRef.current.map = null;
        markerRef.current = null;
      }
    };
  }, [isMapsApiLoaded, mapInstance, hasValidCoordinates, noteLat, noteLng, location, isMapOpen]);

  return (
    <Dialog
      open={isDialogOpen}
      onOpenChange={(open: boolean) => {
        // Don't open dialog if map popover is being opened
        if (!open || !isMapOpen) {
          setIsDialogOpen(open);
        }
      }}
    >
      <DialogTrigger asChild>
        <div className='flex h-full w-full cursor-pointer flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-md transition-all duration-300 hover:scale-[1.02] hover:shadow-xl'>
          {/* Image at the Top with Spinner or Placeholder */}
          {isValidImageUrl ?
            <div className='relative h-48 w-full flex-shrink-0 sm:h-56 md:h-64 lg:h-72'>
              {isImageLoading && (
                <div className='absolute inset-0 z-10 flex items-center justify-center bg-gray-100'>
                  <div className='spinner-border inline-block h-6 w-6 animate-spin rounded-full border-4 border-gray-300 border-t-gray-600 sm:h-8 sm:w-8' />
                </div>
              )}
              <Image
                src={coverImage}
                alt='Note Cover'
                fill
                sizes='(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
                className={`object-cover ${isImageLoading ? 'opacity-0' : 'opacity-100 transition-opacity duration-300'}`}
                priority
                onLoad={() => setIsImageLoading(false)}
                onError={() => setIsImageLoading(false)}
              />
            </div>
          : <div className='flex h-48 w-full flex-shrink-0 items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 sm:h-56 md:h-64 lg:h-72'>
              <ImageIcon
                aria-label='No photo present'
                className='text-gray-400'
                size={80}
                strokeWidth={1}
              />
            </div>
          }
          <div className='flex flex-1 flex-col p-4 sm:p-5'>
            {/* Title */}
            <div className='mb-3 line-clamp-2 min-h-[3rem] text-lg font-bold text-gray-900 sm:text-xl'>
              {note.title || 'Untitled'}
            </div>
            {/* Creator */}
            <div className='mb-3 flex items-center text-sm text-gray-600'>
              <UserCircle size={16} className='mr-2 flex-shrink-0' />
              <span className='truncate font-medium'>{creator}</span>
            </div>
            {/* Date and Time - More compact */}
            <div className='mb-3 space-y-1.5 text-xs text-gray-500 sm:text-sm'>
              <div className='flex items-center gap-2'>
                <CalendarDays size={14} className='flex-shrink-0' />
                <span className='truncate'>{formatDate(note.time)}</span>
              </div>
              <div className='flex items-center gap-2'>
                <Clock3 size={14} className='flex-shrink-0' />
                <span className='truncate'>
                  {note.time ? formatTime(note.time) : 'Unknown Time'}
                </span>
              </div>
            </div>
            {/* Location - Clickable to open map */}
            {location && location !== 'Fetching location...' && hasValidCoordinates && (
              <Popover open={isMapOpen} onOpenChange={setIsMapOpen}>
                <PopoverTrigger asChild>
                  <button
                    ref={locationButtonRef}
                    type='button'
                    className='relative z-10 mb-3 flex w-full cursor-pointer items-center text-left text-xs text-gray-500 transition-colors hover:text-gray-700 sm:text-sm'
                    onClick={(e: React.MouseEvent) => {
                      e.preventDefault();
                      e.stopPropagation(); // Prevent dialog from opening
                      if (!isMapOpen) {
                        setIsMapOpen(true);
                      }
                    }}
                    onMouseDown={(e: React.MouseEvent) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onPointerDown={(e: React.PointerEvent) => {
                      e.stopPropagation();
                    }}
                  >
                    <MapPin size={14} className='mr-2 flex-shrink-0' />
                    <span className='truncate'>{location}</span>
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  className='!z-[9999] h-[300px] w-[400px] p-0'
                  style={{ zIndex: 9999 }}
                  align='start'
                  onClick={(e: React.MouseEvent) => e.stopPropagation()}
                >
                  {isMapsApiLoaded && hasValidCoordinates ?
                    <GoogleMap
                      mapContainerStyle={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '8px',
                      }}
                      center={{ lat: noteLat!, lng: noteLng! }}
                      zoom={15}
                      options={{
                        streetViewControl: false,
                        mapTypeControl: false,
                        fullscreenControl: false,
                        zoomControl: true,
                        mapId: process.env.NEXT_PUBLIC_MAP_ID,
                        mapTypeId: 'satellite',
                      }}
                      onLoad={(map: any) => setMapInstance(map)}
                      onUnmount={() => {
                        if (markerRef.current) {
                          markerRef.current.map = null;
                          markerRef.current = null;
                        }
                        setMapInstance(null);
                      }}
                    />
                  : <div className='flex h-full w-full items-center justify-center rounded-lg bg-gray-100'>
                      <p className='text-gray-500'>Loading map...</p>
                    </div>
                  }
                </PopoverContent>
              </Popover>
            )}
            {location && location !== 'Fetching location...' && !hasValidCoordinates && (
              <div className='mb-3 flex items-center text-xs text-gray-500 sm:text-sm'>
                <ImageIcon size={14} className='mr-2 flex-shrink-0' />
                <span className='truncate'>{location}</span>
              </div>
            )}
            {/* Body Preview */}
            {bodyPreview && (
              <p className='mt-auto line-clamp-3 text-sm leading-relaxed text-gray-700'>
                {bodyPreview}
              </p>
            )}
          </div>
        </div>
      </DialogTrigger>
      <DialogContent className='flex h-[95vh] max-w-[98vw] flex-col p-0 sm:max-w-[95%] lg:max-w-[90%]'>
        <DialogHeader className='flex-shrink-0 px-6 pb-4 pt-6'>
          <DialogTitle className='text-3xl font-bold'>{note.title}</DialogTitle>
          <DialogDescription className='sr-only'>
            Note content by {creator} from {formatDate(note.time)}
          </DialogDescription>
          <div className='space-y-1 text-sm text-gray-500'>
            <div className='flex items-center gap-2'>
              <CalendarDays size={16} /> {formatDate(note.time)}
            </div>
            <div className='flex items-center gap-2'>
              <Clock3 size={16} />
              {note.time ? formatTime(note.time) : 'Unknown Time'}
            </div>
            <div className='flex items-center gap-2'>
              <UserCircle size={16} /> {creator}
            </div>
            {hasValidCoordinates ?
              <Popover open={isMapOpen} onOpenChange={setIsMapOpen}>
                <PopoverTrigger asChild>
                  <button
                    type='button'
                    className='relative z-10 flex cursor-pointer items-center gap-2 transition-colors hover:text-gray-700'
                    onClick={(e: React.MouseEvent) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsMapOpen(!isMapOpen);
                    }}
                    onMouseDown={(e: React.MouseEvent) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                  >
                    <MapPin size={16} /> {location}
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  className='!z-[9999] h-[300px] w-[400px] p-0'
                  style={{ zIndex: 9999 }}
                  align='start'
                  onClick={(e: React.MouseEvent) => e.stopPropagation()}
                >
                  {isMapsApiLoaded && hasValidCoordinates ?
                    <GoogleMap
                      mapContainerStyle={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '8px',
                      }}
                      center={{ lat: noteLat!, lng: noteLng! }}
                      zoom={15}
                      options={{
                        streetViewControl: false,
                        mapTypeControl: false,
                        fullscreenControl: false,
                        zoomControl: true,
                        mapId: process.env.NEXT_PUBLIC_MAP_ID,
                        mapTypeId: 'satellite',
                      }}
                      onLoad={(map: any) => setMapInstance(map)}
                      onUnmount={() => {
                        if (markerRef.current) {
                          markerRef.current.map = null;
                          markerRef.current = null;
                        }
                        setMapInstance(null);
                      }}
                    />
                  : <div className='flex h-full w-full items-center justify-center rounded-lg bg-gray-100'>
                      <p className='text-gray-500'>Loading map...</p>
                    </div>
                  }
                </PopoverContent>
              </Popover>
            : <div className='flex items-center gap-2'>
                <ImageIcon size={16} /> {location}
              </div>
            }
          </div>
          {tags.length > 0 && (
            <div className='mt-2 flex flex-wrap gap-2'>
              <Tags size={16} />
              {tags.map((tag, index) => (
                <span key={index} className='rounded bg-blue-100 px-2 py-1 text-sm text-blue-800'>
                  {tag.label}
                </span>
              ))}
            </div>
          )}
        </DialogHeader>
        <ScrollArea className='min-h-0 flex-1 px-6'>
          {/* Display BodyText content */}
          {noteText ?
            <div
              id='note-content'
              className='prose prose-sm mt-4 max-w-none pb-4 text-base [&_.video-wrapper]:my-4 [&_.video-wrapper]:block [&_.video-wrapper]:w-full [&_.video-wrapper]:max-w-full [&_iframe]:my-4 [&_iframe]:block [&_iframe]:aspect-video [&_iframe]:w-full [&_iframe]:max-w-full [&_iframe]:rounded-lg [&_img]:mx-auto [&_img]:my-4 [&_img]:block [&_img]:h-auto [&_img]:max-h-[500px] [&_img]:w-auto [&_img]:max-w-full [&_img]:rounded-lg [&_img]:object-contain [&_video]:my-4 [&_video]:block [&_video]:h-auto [&_video]:max-h-[500px] [&_video]:w-full [&_video]:max-w-full [&_video]:rounded-lg [&_video]:object-contain'
              dangerouslySetInnerHTML={{ __html: sanitizedText || noteText }}
            />
          : <p className='mt-4 pb-4 text-gray-500'>No content available.</p>}
        </ScrollArea>
        <DialogFooter className='flex flex-shrink-0 gap-4 border-t px-6 pb-6 pt-4'>
          {/* Audio Picker */}
          {note.audio.length > 0 && (
            <Popover>
              <PopoverTrigger>
                <div className='flex h-8 w-8 items-center justify-center rounded-full border bg-white p-1'>
                  <FileAudio size={20} />
                </div>
              </PopoverTrigger>
              <PopoverContent>
                <AudioPicker audioArray={note.audio} editable={false} />
              </PopoverContent>
            </Popover>
          )}
          {/* Media Viewer */}
          {note.media.length > 0 && (
            <Popover>
              <PopoverTrigger>
                <div className='flex h-8 w-8 items-center justify-center rounded-full border bg-white p-1'>
                  <ImageIcon size={20} />
                </div>
              </PopoverTrigger>
              <PopoverContent className='max-w-md p-4'>
                <MediaViewer mediaArray={note.media} />
              </PopoverContent>
            </Popover>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedNoteCard;
