import React, { useState, useEffect } from 'react';
import { Note, Tag } from '@/app/types';
import { CalendarDays, UserCircle, Clock3, ImageIcon, MapPin, FileAudio, Tags } from 'lucide-react';
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
import { fetchCreatorName } from '../../services';
import { getCachedLocation } from '../../utils/location_cache';
import AudioPicker from '@/app/lib/components/NoteEditor/NoteElements/AudioPicker';
import MediaViewer from '../media_viewer';
import { StoryMapPopover } from './StoryMapPopover';

interface StoryDetailDialogProps {
  note: Note;
  children: React.ReactNode;
}

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

/**
 * Safely checks if a URL belongs to a trusted domain
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

// Convert old tags (strings) to the new format
const convertOldTags = (tags: (Tag | string)[] | undefined): Tag[] => {
  if (!Array.isArray(tags)) return [];
  return tags.map(tag => (typeof tag === 'string' ? { label: tag, origin: 'user' } : tag));
};

export const StoryDetailDialog: React.FC<StoryDetailDialogProps> = ({ note, children }) => {
  const [creator, setCreator] = useState<string>('Loading...');
  const [location, setLocation] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [sanitizedText, setSanitizedText] = useState<string>('');

  const noteText = note.text || (note as any).BodyText || '';
  const hasValidCoordinates =
    note.latitude &&
    note.longitude &&
    !isNaN(Number(note.latitude)) &&
    !isNaN(Number(note.longitude));
  const tags: Tag[] = convertOldTags(note.tags);

  // Fetch creator name
  useEffect(() => {
    if (note.creator) {
      fetchCreatorName(note.creator).then(name => {
        setCreator(name);
      });
    }
  }, [note.creator]);

  // Fetch location
  useEffect(() => {
    if (hasValidCoordinates) {
      const apiKey = process.env.NEXT_PUBLIC_MAP_KEY;
      if (apiKey) {
        getCachedLocation(Number(note.latitude), Number(note.longitude), apiKey)
          .then(loc => setLocation(loc))
          .catch(() => setLocation('Location unavailable'));
      }
    }
  }, [note.latitude, note.longitude, hasValidCoordinates]);

  // Load and sanitize content
  useEffect(() => {
    if (typeof window !== 'undefined' && noteText) {
      import('dompurify')
        .then(DOMPurify => {
          let cleanedText = String(noteText || '');

          // Remove blob and data URLs
          const imgBlobDataRegex = new RegExp(
            '<img[^>]*src\\s*=\\s*["\'](blob:|data:)[^"\']*["\'][^>]*>',
            'gi',
          );
          cleanedText = cleanedText.replace(imgBlobDataRegex, '');

          const hrefBlobDataRegex = new RegExp(
            'href=["\'](blob:|data:|javascript:)[^"\']*["\']',
            'gi',
          );
          cleanedText = cleanedText.replace(hrefBlobDataRegex, '');

          let sanitized = DOMPurify.default.sanitize(cleanedText);

          // Process HTML content
          if (typeof document !== 'undefined') {
            try {
              const tempDiv = document.createElement('div');
              sanitized = sanitized.replace(/src=["'](blob:|data:)[^"']*["']/gi, '');
              sanitized = sanitized.replace(/href=["'](blob:|data:|javascript:)[^"']*["']/gi, '');
              tempDiv.innerHTML = sanitized;

              // Handle images
              const images = tempDiv.querySelectorAll('img');
              images.forEach(img => {
                const src = img.getAttribute('src');
                if (src && (src.startsWith('blob:') || src.startsWith('data:'))) {
                  img.removeAttribute('src');
                  img.setAttribute('alt', 'Image not available');
                  img.style.display = 'none';
                }
              });

              // Handle video links
              const links = tempDiv.querySelectorAll('a');
              links.forEach(link => {
                const href = link.getAttribute('href');
                const linkText = link.textContent || '';

                if (
                  href &&
                  (href.match(/\.(mp4|webm|ogg|mov|avi|wmv|flv|mkv)(\?.*)?$/i) ||
                    linkText.toLowerCase().includes('video') ||
                    href.includes('video'))
                ) {
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
                    const videoWrapper = document.createElement('div');
                    videoWrapper.className = 'video-wrapper my-4';
                    videoWrapper.style.cssText =
                      'width: 100%; max-width: 100%; margin: 1rem auto; display: block;';

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
                      videoWrapper.appendChild(video);
                    }

                    link.parentNode?.replaceChild(videoWrapper, link);
                  }
                }
              });

              sanitized = tempDiv.innerHTML;
            } catch (error) {
              console.warn('Error processing HTML content:', error);
            }
          }

          setSanitizedText(sanitized);
        })
        .catch(() => setSanitizedText(noteText));
    }
  }, [noteText]);

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className='flex h-[95vh] max-w-[98vw] flex-col p-0 sm:max-w-[95%] lg:max-w-[90%]'>
        <DialogHeader className='flex-shrink-0 px-6 pb-4 pt-6'>
          <DialogTitle className='text-3xl font-bold'>{note.title}</DialogTitle>
          <DialogDescription className='sr-only'>
            Note content by {creator} from {formatDate(note.time)}
          </DialogDescription>

          {/* Metadata */}
          <div className='mt-3 space-y-2 text-sm text-gray-600'>
            <div className='flex items-center gap-2'>
              <CalendarDays size={16} />
              <span>{formatDate(note.time)}</span>
            </div>
            <div className='flex items-center gap-2'>
              <Clock3 size={16} />
              <span>{note.time ? formatTime(note.time) : 'Unknown Time'}</span>
            </div>
            <div className='flex items-center gap-2'>
              <UserCircle size={16} />
              <span>{creator}</span>
            </div>

            {/* Location */}
            {hasValidCoordinates && location && (
              <StoryMapPopover
                location={location}
                latitude={note.latitude}
                longitude={note.longitude}
              >
                <button
                  type='button'
                  className='flex items-center gap-2 transition-colors hover:text-gray-700'
                  onClick={(e: React.MouseEvent) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  <MapPin size={16} />
                  <span>{location}</span>
                </button>
              </StoryMapPopover>
            )}
            {!hasValidCoordinates && location && (
              <div className='flex items-center gap-2'>
                <ImageIcon size={16} />
                <span>{location}</span>
              </div>
            )}
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className='mt-3 flex flex-wrap gap-2'>
              <Tags size={16} />
              {tags.map((tag, index) => (
                <span key={index} className='rounded bg-blue-100 px-2 py-1 text-xs text-blue-800'>
                  {tag.label}
                </span>
              ))}
            </div>
          )}
        </DialogHeader>

        {/* Content */}
        <ScrollArea className='min-h-0 flex-1 px-6'>
          {noteText ?
            <div
              id='note-content'
              className='prose prose-sm mt-4 max-w-none pb-4 text-base [&_.video-wrapper]:my-4 [&_.video-wrapper]:block [&_.video-wrapper]:w-full [&_.video-wrapper]:max-w-full [&_iframe]:my-4 [&_iframe]:block [&_iframe]:aspect-video [&_iframe]:w-full [&_iframe]:max-w-full [&_iframe]:rounded-lg [&_img]:mx-auto [&_img]:my-4 [&_img]:block [&_img]:h-auto [&_img]:max-h-[500px] [&_img]:w-auto [&_img]:max-w-full [&_img]:rounded-lg [&_img]:object-contain [&_video]:my-4 [&_video]:block [&_video]:h-auto [&_video]:max-h-[500px] [&_video]:w-full [&_video]:max-w-full [&_video]:rounded-lg [&_video]:object-contain'
              dangerouslySetInnerHTML={{ __html: sanitizedText || noteText }}
            />
          : <p className='mt-4 pb-4 text-gray-500'>No content available.</p>}
        </ScrollArea>

        {/* Footer - Media Controls */}
        <DialogFooter className='flex flex-shrink-0 gap-4 border-t px-6 pb-6 pt-4'>
          {note.audio.length > 0 && (
            <Popover>
              <PopoverTrigger>
                <div className='flex h-8 w-8 items-center justify-center rounded-full border bg-white p-1 hover:bg-gray-50'>
                  <FileAudio size={20} />
                </div>
              </PopoverTrigger>
              <PopoverContent>
                <AudioPicker audioArray={note.audio} editable={false} />
              </PopoverContent>
            </Popover>
          )}
          {note.media.length > 0 && (
            <Popover>
              <PopoverTrigger>
                <div className='flex h-8 w-8 items-center justify-center rounded-full border bg-white p-1 hover:bg-gray-50'>
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

export default StoryDetailDialog;
