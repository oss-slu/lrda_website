import { createFileRoute, useRouter } from '@tanstack/react-router';
import { useMemo } from 'react';
import { Tag } from '@/app/types';
import { sanitizeHtml, extractTextFromHtml } from '@/app/lib/utils/sanitize';
import { formatDate, format12hourTime } from '@/app/lib/utils/data_conversion';
import { useNoteDetail, noteDetailOptions } from '@/app/lib/hooks/queries/useNotes';
import { useCreatorName } from '@/app/lib/hooks/queries/useUsers';
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
  loader: ({ context: { queryClient }, params }) =>
    queryClient.ensureQueryData(noteDetailOptions(params.id)),
  head: ({ loaderData }) => {
    const title =
      loaderData?.title ? `${loaderData.title} | Where's Religion?` : "Note | Where's Religion?";
    const description =
      loaderData?.text ? extractTextFromHtml(loaderData.text).slice(0, 160) : undefined;
    return {
      meta: [
        { title },
        { property: 'og:title', content: loaderData?.title ?? 'Note' },
        { property: 'og:type', content: 'article' },
        { name: 'twitter:card', content: 'summary' },
        ...(description ?
          [
            { name: 'description', content: description },
            { property: 'og:description', content: description },
          ]
        : []),
      ],
    };
  },
  component: NoteDetailPage,
});

const formatTime = format12hourTime;

const convertOldTags = (tags: (Tag | string)[] | undefined): Tag[] => {
  if (!Array.isArray(tags)) return [];
  return tags.map(tag => (typeof tag === 'string' ? { label: tag, origin: 'user' as const } : tag));
};

function NoteDetailPage() {
  const { id: noteId } = Route.useParams();
  const router = useRouter();

  const { data: note, isLoading, error: queryError } = useNoteDetail(noteId);
  const { data: creatorName } = useCreatorName(note?.creator ?? null);

  const sanitizedContent = useMemo(
    () => (note?.text ? sanitizeHtml(note.text, { allowVideo: true, allowAudio: true }) : ''),
    [note?.text],
  );

  if (isLoading) {
    return (
      <div className='text-muted-foreground flex h-screen items-center justify-center'>
        Loading...
      </div>
    );
  }

  if (queryError || !note) {
    return (
      <div className='flex h-screen flex-col items-center justify-center gap-4'>
        <p className='text-destructive text-lg font-semibold'>
          {queryError ? 'Failed to load note' : 'Note not found'}
        </p>
        <Button onClick={() => router.history.back()}>
          <ArrowLeft className='mr-2 h-4 w-4' />
          Back to map
        </Button>
      </div>
    );
  }

  const tags = convertOldTags(note.tags);

  return (
    <div className='bg-background flex h-screen flex-col'>
      {/* Header */}
      <div className='border-b px-6 py-4'>
        <Button
          variant='ghost'
          size='sm'
          onClick={() => router.history.back()}
          className='mb-4 -ml-2'
        >
          <ArrowLeft className='mr-2 h-4 w-4' />
          Back to map
        </Button>

        <h1 className='text-3xl font-bold'>{note.title}</h1>

        <div className='text-muted-foreground mt-2 flex flex-wrap gap-4 text-sm'>
          <span className='flex items-center gap-1' suppressHydrationWarning>
            <CalendarDays className='h-4 w-4' />
            {formatDate(note.time)}
          </span>
          <span className='flex items-center gap-1' suppressHydrationWarning>
            <Clock3 className='h-4 w-4' />
            {formatTime(note.time)}
          </span>
          <span className='flex items-center gap-1'>
            <UserCircle className='h-4 w-4' />
            {creatorName ?? 'Loading...'}
          </span>
        </div>

        {tags.length > 0 && (
          <div className='mt-3 flex flex-wrap items-center gap-2'>
            <Tags className='text-muted-foreground h-4 w-4' />
            {tags.map((tag, i) => (
              <span
                key={i}
                className={`flex h-5 items-center rounded px-2 text-xs font-semibold ${
                  tag.origin === 'user' ?
                    'bg-blue-100 text-blue-800'
                  : 'bg-purple-200 text-purple-800'
                }`}
              >
                {tag.label}
              </span>
            ))}
          </div>
        )}

        <div className='bg-border mt-4 h-px w-full' />
      </div>

      {/* Scrollable content */}
      <ScrollArea className='flex-1'>
        <div className='px-6 py-4 pb-24'>
          {note.text && note.text.length > 0 ?
            <div
              dangerouslySetInnerHTML={{ __html: sanitizedContent }}
              className='note-content prose max-w-none'
            />
          : <p className='text-muted-foreground'>This note has no content.</p>}
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
