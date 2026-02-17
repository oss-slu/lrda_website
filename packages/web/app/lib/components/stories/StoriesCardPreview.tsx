import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Note, Tag } from '@/app/types';
import { CalendarDays, UserCircle, Clock3, ImageIcon, MapPin } from 'lucide-react';
import { fetchCreatorName } from '../../services';
import { getCachedLocation } from '../../utils/location_cache';
import { StoryMapPopover } from './StoryMapPopover';

interface StoriesCardPreviewProps {
  note: Note;
  onClick?: () => void;
}

/**
 * Extracts the first few sentences from a string of HTML content.
 */
const getBodyPreview = (bodyText: string, sentenceCount = 2): string => {
  if (typeof document === 'undefined') return '';
  if (!bodyText || typeof bodyText !== 'string') return '';

  try {
    const tempDiv = document.createElement('div');
    let cleanedBodyText = bodyText;

    // Remove blob and data URLs
    cleanedBodyText = cleanedBodyText.replace(
      /<img[^>]*src=["'](blob:|data:)[^"']*["'][^>]*>/gi,
      '',
    );
    cleanedBodyText = cleanedBodyText.replace(/href=["'](blob:|data:|javascript:)[^"']*["']/gi, '');

    tempDiv.innerHTML = cleanedBodyText;
    const plainText = tempDiv.textContent || tempDiv.innerText || '';
    const sentences = plainText.split(/(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\?)\s/);
    return sentences.slice(0, sentenceCount).join(' ');
  } catch (error) {
    console.warn('Error extracting body preview:', error);
    return '';
  }
};

// Utility function to format the date
function formatDate(date: string | number | Date) {
  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) return 'Invalid Date';
  return parsedDate.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
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

export const StoriesCardPreview: React.FC<StoriesCardPreviewProps> = ({ note, onClick }) => {
  const [creator, setCreator] = useState<string>('Loading...');
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [location, setLocation] = useState<string>('');

  const bodyPreview = getBodyPreview(note.text || '');
  const coverImage = note.media?.[0]?.uri;
  const isValidImageUrl =
    coverImage && !coverImage.startsWith('blob:') && !coverImage.startsWith('data:');

  const hasValidCoordinates =
    note.latitude &&
    note.longitude &&
    !isNaN(Number(note.latitude)) &&
    !isNaN(Number(note.longitude));

  // Fetch creator name
  useEffect(() => {
    if (note.creator) {
      fetchCreatorName(note.creator).then(name => {
        setCreator(name);
      });
    }
  }, [note.creator]);

  // Fetch location using reverse geocoding
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

  return (
    <div
      className='flex h-full w-full cursor-pointer flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-md transition-all duration-300 hover:scale-[1.02] hover:shadow-xl'
      onClick={onClick}
    >
      {/* Cover Image - Reduced height */}
      {isValidImageUrl ?
        <div className='relative h-40 w-full flex-shrink-0'>
          {isImageLoading && (
            <div className='absolute inset-0 z-10 flex items-center justify-center bg-gray-100'>
              <div className='h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600' />
            </div>
          )}
          <Image
            src={coverImage}
            alt='Note Cover'
            fill
            sizes='(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
            className={`object-cover ${isImageLoading ? 'opacity-0' : 'opacity-100 transition-opacity duration-300'}`}
            priority={false}
            onLoad={() => setIsImageLoading(false)}
            onError={() => setIsImageLoading(false)}
          />
        </div>
      : <div className='flex h-40 w-full flex-shrink-0 items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200'>
          <ImageIcon
            aria-label='No photo present'
            className='text-gray-400'
            size={48}
            strokeWidth={1}
          />
        </div>
      }

      {/* Card Content */}
      <div className='flex flex-1 flex-col p-3 sm:p-4'>
        {/* Title */}
        <div className='mb-2 line-clamp-2 text-base font-bold text-gray-900'>
          {note.title || 'Untitled'}
        </div>

        {/* Creator */}
        <div className='mb-2 flex items-center text-xs text-gray-600'>
          <UserCircle size={14} className='mr-1.5 flex-shrink-0' />
          <span className='truncate text-sm'>{creator}</span>
        </div>

        {/* Date - Compact */}
        <div className='mb-2 flex items-center gap-2 text-xs text-gray-500'>
          <CalendarDays size={12} className='flex-shrink-0' />
          <span className='truncate'>{formatDate(note.time)}</span>
          <Clock3 size={12} className='flex-shrink-0' />
          <span className='truncate'>{formatTime(note.time)}</span>
        </div>

        {/* Location - Clickable Popover */}
        {hasValidCoordinates && location && (
          <div className='mb-2 flex items-center text-xs text-gray-500'>
            <StoryMapPopover
              location={location}
              latitude={note.latitude}
              longitude={note.longitude}
            >
              <button
                type='button'
                className='flex items-center gap-1 transition-colors hover:text-gray-700'
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                }}
              >
                <MapPin size={12} className='flex-shrink-0' />
                <span className='truncate text-xs'>{location}</span>
              </button>
            </StoryMapPopover>
          </div>
        )}

        {/* Body Preview */}
        {bodyPreview && <p className='mt-auto line-clamp-2 text-xs text-gray-600'>{bodyPreview}</p>}
      </div>
    </div>
  );
};

export default StoriesCardPreview;
