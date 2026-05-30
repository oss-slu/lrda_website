import React, { useState, useEffect, useMemo } from 'react';
import { fetchCreatorName } from '../services';
import { sanitizeHtml } from '../utils/sanitize';
import { Tag } from '@/types';
import {
  CalendarDays,
  UserCircle,
  Tags,
  Clock3,
  FileAudio,
  ImageIcon,
  X,
  Loader2,
} from 'lucide-react';
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import AudioPicker from './NoteEditor/NoteElements/AudioPicker';
import MediaViewer from './media_viewer';
import { PopoverClose } from '@radix-ui/react-popover';
import { useNoteDetail } from '../hooks/queries/useNotes';
import { formatDate, format12hourTime } from '../utils/data_conversion';

const formatTime = format12hourTime;

// Convert old tags (strings) to new format
const convertOldTags = (tags: (Tag | string)[] | undefined): Tag[] => {
  if (!Array.isArray(tags)) return [];
  return tags.map(tag => (typeof tag === 'string' ? { label: tag, origin: 'user' } : tag));
};

// ClickableNote component - fetches full note detail by ID
const ClickableNote: React.FC<{
  noteId: string;
}> = ({ noteId }) => {
  const { data: note, isPending } = useNoteDetail(noteId);
  const [creator, setCreator] = useState<string>('Loading...');
  const tags: Tag[] = convertOldTags(note?.tags);

  const sanitizedContent = useMemo(
    () => (note?.text ? sanitizeHtml(note.text, { allowVideo: true, allowAudio: true }) : ''),
    [note?.text],
  );

  // Fetch the creator's name based on the note's creator ID
  useEffect(() => {
    if (!note?.creator) return;
    fetchCreatorName(note.creator)
      .then((name: string) => setCreator(name))
      .catch((error: Error) => {
        console.error('Error fetching creator name:', error, note.creator);
        setCreator('Error loading name');
      });
  }, [note?.creator]);

  if (isPending || !note) {
    return (
      <DialogContent className='flex h-[100vh] flex-col items-center justify-center p-0 sm:max-w-[80%]'>
        <DialogHeader className='sr-only'>
          <DialogTitle>Loading note...</DialogTitle>
        </DialogHeader>
        <Loader2 className='text-muted-foreground h-8 w-8 animate-spin' />
      </DialogContent>
    );
  }

  return (
    <DialogContent className='flex h-[100vh] flex-col p-0 sm:max-w-[80%]'>
      {/* 2. This is the non-scrolling header */}
      <DialogHeader className='border-b p-6 pb-4'>
        <DialogTitle className='text-3xl'>{note.title}</DialogTitle>
        <DialogDescription className='flex flex-row items-center'>
          <CalendarDays className='h-5 w-5' />: {formatDate(note.time)}
        </DialogDescription>
        <DialogDescription className='flex flex-row items-center'>
          <Clock3 className='h-5 w-5' />: {formatTime(note.time)}
        </DialogDescription>
        <DialogDescription className='flex flex-row items-center'>
          <UserCircle className='h-5 w-5' />: {creator}
        </DialogDescription>

        {tags.length > 0 && (
          <DialogDescription>
            <div className='mb-2 flex flex-wrap items-center gap-2'>
              <Tags />
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className={`flex h-5 items-center justify-center rounded px-2 text-xs font-semibold ${
                    tag.origin === 'user' ?
                      'bg-blue-100 text-blue-800'
                    : 'bg-purple-200 text-purple-800'
                  }`}
                >
                  {tag.label}
                </span>
              ))}
            </div>
          </DialogDescription>
        )}

        <div className='h-1 w-full rounded-full bg-black/70' />
      </DialogHeader>

      {/* This is the scrollable main area */}
      <ScrollArea className='min-h-0 flex-1 overflow-auto'>
        <div className='pb-20'>
          {' '}
          {/* Padding at the bottom */}
          {note.text && note.text.length > 0 ?
            <div
              dangerouslySetInnerHTML={{ __html: sanitizedContent }}
              className='note-content mb-5 px-6'
            />
          : <div className='px-6 pb-6'>This Note has no content</div>}
        </div>
      </ScrollArea>

      {/* This is the floating footer */}
      <DialogFooter className='absolute bottom-6 left-6 z-50 m-0 bg-transparent p-0'>
        <div className='flex w-28 flex-row gap-2'>
          {note.audio.length > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <div className='border-border flex h-9 w-9 cursor-pointer flex-row items-center justify-center rounded-full border bg-white shadow-sm transition-transform duration-150 hover:scale-105 hover:bg-gray-100 active:scale-95'>
                  <FileAudio className='h-6 w-6 stroke-[1.75]' />
                </div>
              </PopoverTrigger>
              <PopoverContent>
                <AudioPicker audioArray={note.audio} editable={false} />
              </PopoverContent>
            </Popover>
          )}

          {note.media.length > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <div className='border-border flex h-9 w-9 cursor-pointer flex-row items-center justify-center rounded-full border bg-white shadow-sm transition-transform duration-150 hover:scale-105 hover:bg-gray-100 active:scale-95'>
                  <ImageIcon className='h-6 w-6 stroke-[1.75]' />
                </div>
              </PopoverTrigger>
              <PopoverContent className='w-[450px] max-w-full items-center justify-center overflow-auto rounded-lg bg-white px-16 align-middle shadow-lg'>
                <PopoverClose className='absolute right-4'>
                  <X />
                </PopoverClose>
                <MediaViewer mediaArray={note.media} />
              </PopoverContent>
            </Popover>
          )}
        </div>
      </DialogFooter>
    </DialogContent>
  );
};

export default React.memo(ClickableNote);
