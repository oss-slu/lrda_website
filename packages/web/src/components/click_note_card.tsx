import React, { useState, useEffect, useCallback } from 'react';
import { NoteContent } from '@/components/NoteContent';
import type { Tag, VideoMedia } from '@/types';
import { useCreatorName } from '@/hooks/queries/useUsers';
import {
  CircleUser,
  MapPin,
  ImageIcon,
  Film,
  FileAudio,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
} from 'lucide-react';
import { DialogContent, DialogClose, DialogTitle } from '@/components/ui/dialog';
import { useNoteDetail } from '@/hooks/queries/useNotes';
import { formatDate, format12hourTime } from '@/utils/data_conversion';

const convertOldTags = (tags: (Tag | string)[] | undefined): Tag[] => {
  if (!Array.isArray(tags)) return [];
  return tags.map(tag => (typeof tag === 'string' ? { label: tag, origin: 'user' } : tag));
};

const ClickableNote: React.FC<{ noteId: string }> = ({ noteId }) => {
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

  if (isPending || !note) {
    return (
      <DialogContent className='flex max-h-[85vh] max-w-3xl flex-col items-center justify-center gap-0 overflow-hidden rounded-2xl p-0 [&>button:last-child]:hidden'>
        <DialogTitle className='sr-only'>Loading note...</DialogTitle>
        <Loader2 className='text-muted-foreground h-8 w-8 animate-spin' />
      </DialogContent>
    );
  }

  const firstImage = note.media.find(m => m.type === 'image');
  const firstVideo = note.media.find(m => m.type === 'video') as VideoMedia | undefined;
  const heroSrc = firstImage?.uri ?? firstVideo?.thumbnail;
  const hasAttachments = note.media.length > 0 || note.audio.length > 0;
  const imageCount = note.media.filter(m => m.type === 'image').length;
  const videoCount = note.media.filter(m => m.type === 'video').length;

  return (
    <DialogContent className='flex max-h-[85vh] max-w-3xl flex-col gap-0 overflow-hidden rounded-2xl p-0 [&>button:last-child]:hidden'>
      {/* Hero */}
      <div
        className='relative shrink-0 overflow-hidden'
        style={{ height: heroSrc ? '13rem' : '7rem' }}
      >
        {heroSrc ? (
          <img src={heroSrc} className='h-full w-full object-cover' alt='' />
        ) : (
          <div className='h-full w-full bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900' />
        )}
        <div className='absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent' />

        <DialogClose className='absolute top-4 right-4 z-10 rounded-full bg-black/30 p-2 text-white backdrop-blur-sm transition hover:bg-black/50'>
          <X className='h-4 w-4' />
          <span className='sr-only'>Close</span>
        </DialogClose>

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

        <div className='absolute bottom-0 left-0 right-0 p-6 pb-5'>
          <DialogTitle className='text-2xl font-bold tracking-tight text-white drop-shadow-sm'>
            {note.title}
          </DialogTitle>
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
                  tag.origin === 'user'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-violet-100 text-violet-800'
                }`}
              >
                {tag.label}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Scrollable content */}
      <div className='min-h-0 flex-1 overflow-auto'>
        <div className='mx-auto max-w-2xl px-8 py-6'>
          {note.textJson ? (
            <NoteContent doc={note.textJson} className='note-content prose max-w-none' stripMedia />
          ) : (
            <p className='text-gray-500'>This Note has no content</p>
          )}
        </div>

        {hasAttachments && (
          <div className='border-t border-gray-100 bg-gray-50 px-8 py-4'>
            <p className='mb-3 text-xs font-medium uppercase tracking-wider text-gray-500'>
              Attachments
            </p>
            <div className='flex flex-wrap gap-3'>
              {note.media.map((media, index) => (
                <button
                  key={index}
                  type='button'
                  onClick={() => setLightboxIndex(index)}
                  className='relative h-20 w-20 overflow-hidden rounded-lg shadow-sm transition hover:ring-2 hover:ring-blue-400'
                >
                  {media.type === 'image' ? (
                    <img
                      src={media.uri}
                      className='h-full w-full object-cover'
                      alt=''
                      loading='lazy'
                    />
                  ) : (
                    <>
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
                  )}
                </button>
              ))}
              {note.audio.map((audio, index) => (
                <div
                  key={`audio-${index}`}
                  className='flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-lg border border-gray-200 bg-white p-2 shadow-sm'
                >
                  <FileAudio className='h-5 w-5 text-gray-400' />
                  <span className='max-w-full truncate text-[10px] text-gray-500'>
                    {audio.name || audio.duration}
                  </span>
                </div>
              ))}
            </div>
            {note.audio.length > 0 && (
              <div className='mt-3 space-y-2'>
                {note.audio.map((audio, index) => (
                  <div
                    key={index}
                    className='flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3'
                  >
                    <FileAudio className='h-4 w-4 shrink-0 text-gray-400' />
                    <span className='shrink-0 text-sm font-medium text-gray-600'>{audio.name}</span>
                    <audio
                      controls
                      src={audio.uri}
                      className='h-8 min-w-0 flex-1'
                      preload='metadata'
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
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
                {media.type === 'image' ? (
                  <img
                    src={media.uri}
                    className='max-h-[85vh] max-w-[90vw] object-contain'
                    alt=''
                  />
                ) : (
                  <video
                    controls
                    autoPlay
                    src={media.uri}
                    className='max-h-[85vh] max-w-[90vw]'
                  />
                )}
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
              className='absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white backdrop-blur-sm transition hover:bg-black/70'
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
              className='absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white backdrop-blur-sm transition hover:bg-black/70'
            >
              <ChevronRight className='h-6 w-6' />
            </button>
          )}
        </div>
      )}
    </DialogContent>
  );
};

export default React.memo(ClickableNote);
