import React, { useState, useEffect } from 'react';
import { Note, Tag } from '@/types';
import { CalendarDays, UserCircle, Clock3, ImageIcon, MapPin } from 'lucide-react';
import { useCreatorName } from '@/hooks/queries/useUsers';
import { getCachedLocation } from '@/utils/location_cache';
import { StoryMapPopover } from './StoryMapPopover';
import { formatDateCompact, format12hourTime } from '@/utils/data_conversion';
import { extractTextFromHtml } from '@/utils/sanitize';

interface StoriesCardPreviewProps {
  note: Note;
  onClick?: () => void;
}

/**
 * Extracts the first few sentences from a string of HTML content.
 */
const getBodyPreview = (bodyText: string, sentenceCount = 2): string => {
  const plainText = extractTextFromHtml(bodyText);
  if (!plainText) return '';
  const sentences = plainText.split(/(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\?)\s/);
  return sentences.slice(0, sentenceCount).join(' ');
};

const formatDate = formatDateCompact;
const formatTime = format12hourTime;

/**
 * Safely extract a tag label from either a string or Tag object
 */
function getTagLabel(tag: Tag | string | undefined | null): string {
  if (!tag) return '';
  if (typeof tag === 'string') return tag;
  if (typeof tag === 'object' && 'label' in tag) return tag.label || '';
  return '';
}

/**
 * Normalize tags array, filtering out invalid entries
 */
function normalizeTags(tags: (Tag | string | null | undefined)[] | null | undefined): string[] {
  if (!Array.isArray(tags)) return [];
  return tags
    .map(tag => getTagLabel(tag))
    .filter((label): label is string => Boolean(label && label.trim()));
}

export const StoriesCardPreview: React.FC<StoriesCardPreviewProps> = ({ note, onClick }) => {
  const { data: creator = 'Loading...' } = useCreatorName(note.creator);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [location, setLocation] = useState<string>('');

  const bodyPreview = getBodyPreview(note.text || '');
  const coverImage = note.media[0]?.uri;
  const isValidImageUrl =
    coverImage && !coverImage.startsWith('blob:') && !coverImage.startsWith('data:');

  const hasValidCoordinates = note.latitude != null && note.longitude != null;

  // Normalize and parse tags
  const normalizedTags = normalizeTags(note.tags);
  const displayTags = normalizedTags.slice(0, 2);
  const remainingTagCount = Math.max(0, normalizedTags.length - 2);

  // Use stored location name or fall back to reverse geocoding
  useEffect(() => {
    if (note.locationName) {
      setLocation(note.locationName);
      return;
    }
    if (hasValidCoordinates) {
      const apiKey = import.meta.env.VITE_MAP_KEY;
      if (apiKey) {
        getCachedLocation(note.latitude!, note.longitude!, apiKey)
          .then(loc => setLocation(loc))
          .catch(() => setLocation('Location unavailable'));
      }
    }
  }, [note.latitude, note.longitude, note.locationName, hasValidCoordinates]);

  return (
    <div
      className='flex h-full w-full cursor-pointer flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-md transition-all duration-300 hover:scale-[1.02] hover:shadow-xl'
      onClick={onClick}
    >
      {/* Cover Image - Reduced height */}
      {isValidImageUrl ?
        <div className='relative h-40 w-full shrink-0'>
          {isImageLoading && (
            <div className='absolute inset-0 z-10 flex items-center justify-center bg-gray-100'>
              <div className='h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600' />
            </div>
          )}
          <img
            src={coverImage}
            alt='Note Cover'
            className={`h-full w-full object-cover ${isImageLoading ? 'opacity-0' : 'opacity-100 transition-opacity duration-300'}`}
            onLoad={() => setIsImageLoading(false)}
            onError={() => setIsImageLoading(false)}
          />
        </div>
      : <div className='flex h-40 w-full shrink-0 items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200'>
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
          <UserCircle size={14} className='mr-1.5 shrink-0' />
          <span className='truncate text-sm'>{creator}</span>
        </div>

        {/* Date - Compact */}
        <div className='mb-2 flex items-center gap-2 text-xs text-gray-500'>
          <CalendarDays size={12} className='shrink-0' />
          <span className='truncate' suppressHydrationWarning>
            {formatDate(note.time)}
          </span>
          <Clock3 size={12} className='shrink-0' />
          <span className='truncate' suppressHydrationWarning>
            {formatTime(note.time)}
          </span>
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
                <MapPin size={12} className='shrink-0' />
                <span className='truncate text-xs'>{location}</span>
              </button>
            </StoryMapPopover>
          </div>
        )}

        {/* Body Preview */}
        {bodyPreview && <p className='mt-auto line-clamp-2 text-xs text-gray-600'>{bodyPreview}</p>}

        {/* Tags - Display top 2 with overflow indicator */}
        {displayTags.length > 0 && (
          <div className='mt-3 flex flex-wrap gap-1.5'>
            {displayTags.map((tag, idx) => (
              <span
                key={idx}
                className='inline-block truncate rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700'
                title={tag}
              >
                {tag}
              </span>
            ))}
            {remainingTagCount > 0 && (
              <span className='inline-block px-2 py-1 text-xs font-medium text-gray-500'>
                +{remainingTagCount}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
