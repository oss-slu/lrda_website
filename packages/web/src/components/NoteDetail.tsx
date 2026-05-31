import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { NoteContent } from '@/components/NoteContent';
import type { Tag } from '@/types';
import { useCreatorName } from '@/hooks/queries/useUsers';
import {
  CircleUser,
  MapPin,
  ImageIcon,
  Film,
  FileAudio,
  ChevronLeft,
  ChevronRight,
  Share2,
  X,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { DialogContent, DialogClose, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useNoteDetail } from '@/hooks/queries/useNotes';
import { formatDate, format12hourTime } from '@/utils/data_conversion';

const convertOldTags = (tags: (Tag | string)[] | undefined): Tag[] => {
  if (!Array.isArray(tags)) return [];
  return tags.map(tag => (typeof tag === 'string' ? { label: tag, origin: 'user' } : tag));
};

const NoteDetail: React.FC<{
  noteId: string;
  variant?: 'dialog' | 'panel' | 'page';
  onBack?: () => void;
  backLabel?: string;
}> = ({ noteId, variant = 'dialog', onBack, backLabel = 'Back to notes' }) => {
  const isDialog = variant === 'dialog';
  const isPanel = variant === 'panel';
  const isPage = variant === 'page';
  const { data: note, isPending } = useNoteDetail(noteId);
  const { data: creator = 'Loading...' } = useCreatorName(note?.creator ?? null);
  const tags: Tag[] = convertOldTags(note?.tags);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (lightboxIndex === null || !note) return;
      if (e.key === 'Escape') setLightboxIndex(null);
      if (e.key === 'ArrowLeft') setLightboxIndex(Math.max(0, lightboxIndex - 1));
      if (e.key === 'ArrowRight')
        setLightboxIndex(Math.min(note.media.length - 1, lightboxIndex + 1));
    },
    [lightboxIndex, note],
  );

  useEffect(() => {
    if (lightboxIndex === null) return;
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, handleKeyDown]);

  // In panel mode there is no Dialog to handle Escape, so map it to "back"
  useEffect(() => {
    if (!isPanel || !onBack) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && lightboxIndex === null) onBack();
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [isPanel, onBack, lightboxIndex]);

  // Share via the native share sheet when available, otherwise copy the link
  const handleShare = useCallback(async () => {
    const url = `${window.location.origin}/notes/${noteId}`;
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: note?.title ?? 'Note', url });
      } catch {
        // user dismissed the share sheet
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      toast('Link copied to clipboard');
    } catch {
      toast.error('Could not copy link');
    }
  }, [noteId, note?.title]);

  if (isPending || !note) {
    if (!isDialog) {
      return (
        <div className='flex h-full w-full items-center justify-center py-20'>
          <Loader2 className='text-muted-foreground h-8 w-8 animate-spin' />
        </div>
      );
    }
    return (
      <DialogContent className='flex max-h-[85vh] max-w-3xl flex-col items-center justify-center gap-0 overflow-hidden rounded-2xl p-0 [&>button:last-child]:hidden'>
        <DialogTitle className='sr-only'>Loading note...</DialogTitle>
        <Loader2 className='text-muted-foreground h-8 w-8 animate-spin' />
      </DialogContent>
    );
  }

  const firstImage = note.media.find(m => m.type === 'image');
  const firstVideo = note.media.find(m => m.type === 'video');
  const heroSrc = firstImage?.uri ?? firstVideo?.thumbnail;
  const hasAttachments = note.media.length > 0 || note.audio.length > 0;
  const imageCount = note.media.filter(m => m.type === 'image').length;
  const videoCount = note.media.filter(m => m.type === 'video').length;

  const body = (
    <>
      {/* Hero */}
      <div
        className='relative shrink-0 overflow-hidden'
        style={{ height: heroSrc ? '13rem' : '7rem' }}
      >
        {heroSrc ?
          <img src={heroSrc} className='h-full w-full object-cover' alt='' />
        : <div className='h-full w-full bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900' />
        }
        <div className='absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent' />

        <button
          type='button'
          onClick={handleShare}
          aria-label='Share note'
          className={`absolute top-4 z-10 rounded-full bg-black/30 p-2 text-white backdrop-blur-sm transition hover:bg-black/50 ${
            isDialog ? 'right-14' : 'right-4'
          }`}
        >
          <Share2 className='h-4 w-4' />
        </button>

        {isDialog && (
          <DialogClose className='absolute top-4 right-4 z-10 rounded-full bg-black/30 p-2 text-white backdrop-blur-sm transition hover:bg-black/50'>
            <X className='h-4 w-4' />
            <span className='sr-only'>Close</span>
          </DialogClose>
        )}

        {hasAttachments && (
          <div className='absolute top-4 left-4 flex gap-2'>
            {imageCount > 0 && (
              <span className='flex items-center gap-1.5 rounded-full bg-black/30 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm'>
                <ImageIcon className='h-3.5 w-3.5' />
                {imageCount} {imageCount === 1 ? 'photo' : 'photos'}
              </span>
            )}
            {videoCount > 0 && (
              <span className='flex items-center gap-1.5 rounded-full bg-black/30 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm'>
                <Film className='h-3.5 w-3.5' />
                {videoCount} {videoCount === 1 ? 'video' : 'videos'}
              </span>
            )}
            {note.audio.length > 0 && (
              <span className='flex items-center gap-1.5 rounded-full bg-black/30 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm'>
                <FileAudio className='h-3.5 w-3.5' />
                {note.audio.length} audio
              </span>
            )}
          </div>
        )}

        <div className='absolute right-0 bottom-0 left-0 p-6 pb-5'>
          {isDialog ?
            <DialogTitle className='text-2xl font-bold tracking-tight text-white drop-shadow-sm'>
              {note.title}
            </DialogTitle>
          : <h2 className='text-2xl font-bold tracking-tight text-white drop-shadow-sm'>
              {note.title}
            </h2>
          }
        </div>
      </div>

      {/* Info bar */}
      <div className='flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 bg-gray-50 px-6 py-3'>
        <div className='flex flex-wrap items-center gap-4 text-sm text-gray-600'>
          <span className='flex items-center gap-1.5 font-medium text-gray-900'>
            <span className='flex h-6 w-6 items-center justify-center rounded-full bg-blue-100'>
              <CircleUser className='h-3.5 w-3.5 text-blue-700' />
            </span>
            {creator}
          </span>
          <span className='text-gray-300'>|</span>
          <span>
            {formatDate(note.time)} at {format12hourTime(note.time)}
          </span>
          {note.locationName && (
            <>
              <span className='text-gray-300'>|</span>
              <span className='flex items-center gap-1'>
                <MapPin className='h-3.5 w-3.5' />
                {note.locationName}
              </span>
            </>
          )}
        </div>
        {tags.length > 0 && (
          <div className='flex flex-wrap gap-1.5'>
            {tags.map((tag, index) => (
              <span
                key={index}
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  tag.origin === 'user' ?
                    'bg-blue-100 text-blue-800'
                  : 'bg-violet-100 text-violet-800'
                }`}
              >
                {tag.label}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Content -- panel/dialog scroll internally; page flows with the document */}
      <div className={isPage ? '' : 'min-h-0 flex-1 overflow-auto'}>
        <div className='mx-auto max-w-2xl px-8 py-6'>
          {note.textJson ?
            <NoteContent doc={note.textJson} className='note-content prose max-w-none' stripMedia />
          : <p className='text-gray-500'>This Note has no content</p>}
        </div>

        {hasAttachments && (
          <div className='border-t border-gray-100 bg-gray-50 px-8 py-4'>
            <p className='mb-3 text-xs font-medium tracking-wider text-gray-500 uppercase'>
              Attachments
            </p>
            {note.media.length > 0 && (
              <div className='flex flex-wrap gap-3'>
                {note.media.map((media, index) => (
                  <button
                    key={index}
                    type='button'
                    onClick={() => setLightboxIndex(index)}
                    className='relative h-20 w-20 overflow-hidden rounded-lg shadow-sm transition hover:ring-2 hover:ring-blue-400'
                  >
                    {media.type === 'image' ?
                      <img
                        src={media.uri}
                        className='h-full w-full object-cover'
                        alt=''
                        loading='lazy'
                      />
                    : <>
                        {media.thumbnail && (
                          <img
                            src={media.thumbnail}
                            className='h-full w-full object-cover'
                            alt=''
                          />
                        )}
                        <div className='absolute inset-0 flex items-center justify-center bg-black/30'>
                          <Film className='h-6 w-6 text-white' />
                        </div>
                      </>
                    }
                  </button>
                ))}
              </div>
            )}
            {note.audio.length > 0 && (
              <div className='mt-3 space-y-2'>
                {note.audio.map((audio, index) => (
                  <div key={index} className='rounded-lg border border-gray-200 bg-white p-3'>
                    <div className='mb-2 flex items-center gap-2'>
                      <FileAudio className='h-4 w-4 shrink-0 text-gray-400' />
                      <span className='min-w-0 flex-1 truncate text-sm font-medium text-gray-600'>
                        {audio.name}
                      </span>
                    </div>
                    <audio controls src={audio.uri} className='h-8 w-full' preload='metadata' />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lightbox -- portaled to body so the panel's transform ancestor doesn't trap the fixed overlay */}
      {lightboxIndex !== null &&
        createPortal(
          <div
            className='fixed inset-0 z-[100] flex items-center justify-center bg-black/90'
            onClick={() => setLightboxIndex(null)}
          >
            <button
              type='button'
              onClick={e => {
                e.stopPropagation();
                setLightboxIndex(null);
              }}
              className='absolute top-4 right-4 rounded-full bg-black/50 p-2 text-white backdrop-blur-sm transition hover:bg-black/70'
            >
              <X className='h-5 w-5' />
            </button>

            <span className='absolute top-4 left-4 text-sm text-white/70'>
              {lightboxIndex + 1} / {note.media.length}
            </span>

            {(() => {
              const media = note.media[lightboxIndex];
              if (!media) return null;
              return (
                <div onClick={e => e.stopPropagation()}>
                  {media.type === 'image' ?
                    <img
                      src={media.uri}
                      className='max-h-[85vh] max-w-[90vw] object-contain'
                      alt=''
                    />
                  : <video
                      controls
                      autoPlay
                      src={media.uri}
                      className='max-h-[85vh] max-w-[90vw]'
                    />
                  }
                </div>
              );
            })()}

            {lightboxIndex > 0 && (
              <button
                type='button'
                onClick={e => {
                  e.stopPropagation();
                  setLightboxIndex(lightboxIndex - 1);
                }}
                className='absolute top-1/2 left-4 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white backdrop-blur-sm transition hover:bg-black/70'
              >
                <ChevronLeft className='h-6 w-6' />
              </button>
            )}
            {lightboxIndex < note.media.length - 1 && (
              <button
                type='button'
                onClick={e => {
                  e.stopPropagation();
                  setLightboxIndex(lightboxIndex + 1);
                }}
                className='absolute top-1/2 right-4 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white backdrop-blur-sm transition hover:bg-black/70'
              >
                <ChevronRight className='h-6 w-6' />
              </button>
            )}
          </div>,
          document.body,
        )}
    </>
  );

  if (isPage) {
    return <div className='flex w-full flex-col bg-white'>{body}</div>;
  }

  if (isPanel) {
    return (
      <div className='flex h-full w-full flex-col bg-white'>
        <div className='flex shrink-0 items-center border-b border-gray-200 bg-gray-50 px-2 py-2'>
          <Button variant='ghost' size='sm' onClick={onBack} className='gap-1 text-gray-600'>
            <ChevronLeft className='h-4 w-4' />
            {backLabel}
          </Button>
        </div>
        {body}
      </div>
    );
  }

  return (
    <DialogContent className='flex max-h-[85vh] max-w-3xl flex-col gap-0 overflow-hidden rounded-2xl p-0 [&>button:last-child]:hidden'>
      {body}
    </DialogContent>
  );
};

export default React.memo(NoteDetail);
