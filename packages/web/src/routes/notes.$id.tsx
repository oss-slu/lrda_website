import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react';
import { Note, Tag } from '@/app/types';
import { notesService } from '@/app/lib/services/notes.service';
import { fetchCreatorName } from '@/app/lib/services';
import { sanitizeHtml } from '@/app/lib/utils/sanitize';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { PopoverClose } from '@radix-ui/react-popover';
import AudioPicker from '@/app/lib/components/NoteEditor/NoteElements/AudioPicker';
import MediaViewer from '@/app/lib/components/media_viewer';
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  FileAudio,
  ImageIcon,
  Tags,
  UserCircle,
  X,
} from 'lucide-react';

export const Route = createFileRoute('/notes/$id')({
  head: () => ({
    meta: [{ title: "Note | Where's Religion?" }],
  }),
  component: NoteDetailPage,
})

function formatDate(date: string | number | Date) {
  const parsed = new Date(date);
  if (isNaN(parsed.getTime())) return 'Invalid Date';
  return parsed.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatTime(date: string | number | Date) {
  const parsed = new Date(date);
  if (isNaN(parsed.getTime())) return 'Invalid Date';
  const h = parsed.getHours();
  const m = parsed.getMinutes();
  const formattedH = h % 12 === 0 ? 12 : h % 12;
  const formattedM = m < 10 ? `0${m}` : m;
  return `${formattedH}:${formattedM} ${h < 12 ? 'AM' : 'PM'}`;
}

const convertOldTags = (tags: (Tag | string)[] | undefined): Tag[] => {
  if (!Array.isArray(tags)) return [];
  return tags.map(tag => (typeof tag === 'string' ? { label: tag, origin: 'user' as const } : tag));
};

function NoteDetailPage() {
  const { id: noteId } = Route.useParams();

  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creator, setCreator] = useState('Loading...');
  const [sanitizedContent, setSanitizedContent] = useState('');

  useEffect(() => {
    if (!noteId) {
      setError('Invalid note id');
      setLoading(false);
      return;
    }

    notesService
      .fetchById(noteId)
      .then((n: Note | null) => {
        if (n) {
          setNote(n);
          fetchCreatorName(n.creator)
            .then((name: string) => setCreator(name))
            .catch(() => setCreator('Unknown'));
          if (n.text) {
            sanitizeHtml(n.text, { allowVideo: true, allowAudio: true }).then(setSanitizedContent);
          }
        } else {
          setError('Note not found');
        }
      })
      .catch((err: unknown) => {
        console.error('fetchById error', err);
        setError('Failed to load note');
      })
      .finally(() => setLoading(false));
  }, [noteId]);

  if (loading) {
    return (
      <div className='flex h-screen items-center justify-center text-muted-foreground'>
        Loading...
      </div>
    );
  }

  if (error || !note) {
    return (
      <div className='flex h-screen flex-col items-center justify-center gap-4'>
        <p className='text-lg font-semibold text-destructive'>{error ?? 'Note not available'}</p>
        <Button onClick={() => window.history.back()}>
          <ArrowLeft className='mr-2 h-4 w-4' />
          Back to map
        </Button>
      </div>
    );
  }

  const tags = convertOldTags(note.tags);

  return (
    <div className='flex h-screen flex-col bg-background'>
      {/* Header */}
      <div className='border-b px-6 py-4'>
        <Button variant='ghost' size='sm' onClick={() => window.history.back()} className='mb-4 -ml-2'>
          <ArrowLeft className='mr-2 h-4 w-4' />
          Back to map
        </Button>

        <h1 className='text-3xl font-bold'>{note.title}</h1>

        <div className='mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground'>
          <span className='flex items-center gap-1'>
            <CalendarDays className='h-4 w-4' />
            {formatDate(note.time)}
          </span>
          <span className='flex items-center gap-1'>
            <Clock3 className='h-4 w-4' />
            {formatTime(note.time)}
          </span>
          <span className='flex items-center gap-1'>
            <UserCircle className='h-4 w-4' />
            {creator}
          </span>
        </div>

        {tags.length > 0 && (
          <div className='mt-3 flex flex-wrap items-center gap-2'>
            <Tags className='h-4 w-4 text-muted-foreground' />
            {tags.map((tag, i) => (
              <span
                key={i}
                className={`flex h-5 items-center rounded px-2 text-xs font-semibold ${
                  tag.origin === 'user'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-purple-200 text-purple-800'
                }`}
              >
                {tag.label}
              </span>
            ))}
          </div>
        )}

        <div className='mt-4 h-px w-full bg-border' />
      </div>

      {/* Scrollable content */}
      <ScrollArea className='flex-1'>
        <div className='px-6 py-4 pb-24'>
          {note.text && note.text.length > 0 ? (
            <div
              dangerouslySetInnerHTML={{ __html: sanitizedContent }}
              className='note-content prose max-w-none'
            />
          ) : (
            <p className='text-muted-foreground'>This note has no content.</p>
          )}
        </div>
      </ScrollArea>

      {/* Floating media/audio buttons */}
      {(note.audio.length > 0 || note.media.length > 0) && (
        <div className='absolute bottom-6 left-6 z-50 flex gap-2'>
          {note.audio.length > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <div className='flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border bg-white shadow-sm transition-transform hover:scale-105 hover:bg-gray-100 active:scale-95'>
                  <FileAudio className='h-5 w-5' />
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
                <div className='flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border bg-white shadow-sm transition-transform hover:scale-105 hover:bg-gray-100 active:scale-95'>
                  <ImageIcon className='h-5 w-5' />
                </div>
              </PopoverTrigger>
              <PopoverContent className='w-[450px] max-w-full overflow-auto rounded-lg bg-white px-16 shadow-lg'>
                <PopoverClose className='absolute right-4'>
                  <X />
                </PopoverClose>
                <MediaViewer mediaArray={note.media} />
              </PopoverContent>
            </Popover>
          )}
        </div>
      )}
    </div>
  );
}
