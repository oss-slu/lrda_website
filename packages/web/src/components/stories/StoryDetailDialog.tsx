import React, { useState, useEffect } from 'react';
import { Note, Tag } from '@/types';
import { CalendarDays, CircleUser, Clock3, ImageIcon, MapPin, FileAudio, Tags } from 'lucide-react';
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
import { useCreatorName } from '@/hooks/queries/useUsers';
import { getCachedLocation } from '@/utils/location_cache';
import AudioPicker from '@/components/NoteEditor/NoteElements/AudioPicker';
import MediaViewer from '@/components/media_viewer';
import { StoryMapPopover } from './StoryMapPopover';
import { NoteContent } from '@/components/NoteContent';
import { formatDate, format12hourTime } from '@/utils/data_conversion';

interface StoryDetailDialogProps {
  note: Note;
  children: React.ReactNode;
}

const formatTime = format12hourTime;

// Convert old tags (strings) to the new format
const convertOldTags = (tags: (Tag | string)[] | undefined): Tag[] => {
  if (!Array.isArray(tags)) return [];
  return tags.map(tag => (typeof tag === 'string' ? { label: tag, origin: 'user' } : tag));
};

export const StoryDetailDialog: React.FC<StoryDetailDialogProps> = ({ note, children }) => {
  const { data: creator = 'Loading...' } = useCreatorName(note.creator);
  const [location, setLocation] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const hasContent = note.textJson != null;
  const hasValidCoordinates = note.latitude != null && note.longitude != null;
  const tags: Tag[] = convertOldTags(note.tags);

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
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className='flex h-[95vh] max-w-[98vw] flex-col p-0 sm:max-w-[95%] lg:max-w-[90%]'>
        <DialogHeader className='shrink-0 px-6 pt-6 pb-4'>
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
              <span>{formatTime(note.time)}</span>
            </div>
            <div className='flex items-center gap-2'>
              <CircleUser size={16} />
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
          {hasContent ?
            <NoteContent
              doc={note.textJson}
              className='prose prose-sm mt-4 max-w-none pb-4 text-base [&_img]:mx-auto [&_img]:my-4 [&_img]:block [&_img]:h-auto [&_img]:max-h-[500px] [&_img]:w-auto [&_img]:max-w-full [&_img]:rounded-lg [&_img]:object-contain [&_video]:my-4 [&_video]:block [&_video]:h-auto [&_video]:max-h-[500px] [&_video]:w-full [&_video]:max-w-full [&_video]:rounded-lg [&_video]:object-contain'
            />
          : <p className='mt-4 pb-4 text-gray-500'>No content available.</p>}
        </ScrollArea>

        {/* Footer - Media Controls */}
        <DialogFooter className='flex shrink-0 gap-4 border-t px-6 pt-4 pb-6'>
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
