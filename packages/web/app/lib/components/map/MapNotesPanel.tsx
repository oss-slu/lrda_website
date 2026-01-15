'use client';

import React, { forwardRef } from 'react';
import { Note } from '@/app/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertCircle, ChevronLeft, ChevronRight, X, MapPin } from 'lucide-react';
import NoteCard from '../note_card';
import { PANEL_WIDTH } from '../../constants/mapConstants';
import { cn } from '@/lib/utils';

interface Refs {
  [key: string]: HTMLElement | undefined;
}

interface MapNotesPanelProps {
  isPanelOpen: boolean;
  isLoading: boolean;
  isError?: boolean;
  errorMessage?: string;
  visibleItems: Note[];
  hasMore: boolean;
  isLoadingMore: boolean;
  loaderRef: React.RefCallback<HTMLDivElement>;
  activeNoteId: string | null;
  noteRefs: React.MutableRefObject<Refs>;
  onNoteHover: (noteId: string | null) => void;
  onNoteClick: (note: Note) => void;
  onTogglePanel: () => void;
}

const MapNotesPanel = forwardRef<HTMLDivElement, MapNotesPanelProps>(
  (
    {
      isPanelOpen,
      isLoading,
      isError,
      errorMessage,
      visibleItems,
      hasMore,
      isLoadingMore,
      loaderRef,
      activeNoteId,
      noteRefs,
      onNoteHover,
      onNoteClick,
      onTogglePanel,
    },
    notesListRef,
  ) => {
    return (
      <>
        {/* Toggle Button - hidden on mobile when panel is open */}
        <Button
          variant='secondary'
          size='icon'
          onClick={onTogglePanel}
          aria-label={isPanelOpen ? 'Close notes panel' : 'Open notes panel'}
          className={cn(
            'absolute top-1/2 z-20 h-10 w-10 -translate-y-1/2 rounded-full shadow-lg transition-all duration-300 hover:shadow-xl',
            isPanelOpen ? 'hidden md:flex' : 'flex',
          )}
          style={{
            right: isPanelOpen ? PANEL_WIDTH : '1rem',
          }}
        >
          {isPanelOpen ?
            <ChevronRight className='h-5 w-5' />
          : <ChevronLeft className='h-5 w-5' />}
        </Button>

        {/* Notes Panel */}
        <div
          className={cn(
            'absolute right-0 top-0 z-30 h-full w-full overflow-y-auto border-l bg-background transition-transform duration-300 ease-in-out md:w-[34rem]',
            isPanelOpen ? 'translate-x-0' : 'translate-x-full',
          )}
          ref={notesListRef}
        >
          {/* Mobile header */}
          <div className='sticky top-0 z-10 flex items-center justify-between border-b bg-card p-4 md:hidden'>
            <h2 className='text-lg font-semibold'>Notes</h2>
            <Button
              variant='ghost'
              size='icon'
              onClick={onTogglePanel}
              aria-label='Close notes panel'
              className='h-8 w-8 rounded-full'
            >
              <X className='h-4 w-4' />
            </Button>
          </div>

          <div className='grid grid-cols-1 content-start gap-4 p-4 lg:grid-cols-2'>
            {isLoading ?
              // Loading state with card-shaped skeletons
              [...Array(6)].map((_, index) => (
                <Card key={index} className='overflow-hidden'>
                  <Skeleton className='aspect-[4/3] w-full' />
                  <div className='space-y-2 p-3'>
                    <Skeleton className='h-4 w-full' />
                    <Skeleton className='h-3 w-2/3' />
                  </div>
                </Card>
              ))
            : isError ?
              // Error state
              <div className='col-span-full flex flex-col items-center justify-center p-8 py-20'>
                <div className='mb-4 rounded-full bg-destructive/10 p-4'>
                  <AlertCircle className='h-8 w-8 text-destructive' />
                </div>
                <h3 className='text-xl font-semibold text-foreground'>Failed to Load Notes</h3>
                <p className='mt-2 max-w-sm text-center text-sm text-muted-foreground'>
                  {errorMessage ||
                    'Something went wrong while loading notes. Please try again later.'}
                </p>
              </div>
            : visibleItems.length > 0 ?
              // Notes grid
              visibleItems.map(note => (
                <div
                  key={note.id}
                  ref={el => {
                    if (el) noteRefs.current[note.id] = el;
                  }}
                  className='cursor-pointer'
                  onMouseEnter={() => onNoteHover(note.id)}
                  onMouseLeave={() => onNoteHover(null)}
                  onClick={() => onNoteClick(note)}
                >
                  <NoteCard note={note} isActive={note.id === activeNoteId} />
                </div>
              ))
              // Empty state
            : <div className='col-span-full flex flex-col items-center justify-center p-8 py-20'>
                <div className='mb-4 rounded-full bg-muted p-4'>
                  <MapPin className='h-8 w-8 text-muted-foreground' />
                </div>
                <h3 className='text-xl font-semibold text-foreground'>No Notes Found</h3>
                <p className='mt-2 max-w-sm text-center text-sm text-muted-foreground'>
                  Try zooming out or moving the map to discover notes in other areas.
                </p>
              </div>
            }

            {/* Infinite scroll loader */}
            {hasMore && (
              <div className='col-span-full mt-4 flex min-h-10 justify-center'>
                <div ref={loaderRef} className='flex h-10 w-full items-center justify-center'>
                  {isLoadingMore && (
                    <div className='flex items-center gap-2 text-muted-foreground'>
                      <div className='h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent' />
                      <span className='text-sm'>Loading more...</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </>
    );
  },
);

MapNotesPanel.displayName = 'MapNotesPanel';

export default MapNotesPanel;
