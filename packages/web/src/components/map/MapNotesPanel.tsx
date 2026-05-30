import React, { forwardRef, useCallback } from 'react';
import { Note } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertCircle, ChevronLeft, ChevronRight, X, MapPin } from 'lucide-react';
import NoteCard from '../note_card';
import { PANEL_WIDTH } from '../../utils/mapConstants';
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
  onNoteClick: (noteId: string) => void;
  onTogglePanel: () => void;
}

// Skeleton cards shown while notes are loading
const SKELETON_COUNT = 6;
const skeletonIndices = Array.from({ length: SKELETON_COUNT }, (_, i) => i);

function SkeletonCard({ index }: { index: number }) {
  return (
    <Card className='overflow-hidden' style={{ animationDelay: `${index * 75}ms` }}>
      <Skeleton className='aspect-[4/3] w-full' />
      <div className='space-y-2 p-3'>
        <Skeleton className='h-4 w-full' />
        <Skeleton className='h-3 w-2/3' />
      </div>
    </Card>
  );
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
    // Stable callback for clearing hover
    const handleMouseLeave = useCallback(() => onNoteHover(null), [onNoteHover]);

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
            'bg-background absolute top-0 right-0 z-30 h-full w-full overflow-y-auto border-l transition-transform duration-300 ease-in-out md:w-[34rem]',
            isPanelOpen ? 'translate-x-0' : 'translate-x-full',
          )}
          ref={notesListRef}
        >
          {/* Mobile header */}
          <div className='bg-card sticky top-0 z-10 flex items-center justify-between border-b p-4 md:hidden'>
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

          <div className='grid grid-cols-1 content-start gap-4 p-4 md:grid-cols-2'>
            {isLoading ?
              // Loading skeletons with staggered pulse
              skeletonIndices.map(index => <SkeletonCard key={index} index={index} />)
            : isError ?
              // Error state
              <div className='col-span-full flex flex-col items-center justify-center p-8 py-20'>
                <div className='bg-destructive/10 mb-4 rounded-full p-4'>
                  <AlertCircle className='text-destructive h-8 w-8' />
                </div>
                <h3 className='text-foreground text-xl font-semibold'>Failed to Load Notes</h3>
                <p className='text-muted-foreground mt-2 max-w-sm text-center text-sm'>
                  {errorMessage ||
                    'Something went wrong while loading notes. Please try again later.'}
                </p>
              </div>
            : visibleItems.length > 0 ?
              // Notes grid with content-visibility for off-screen cards
              visibleItems.map(note => (
                <div
                  key={note.id}
                  ref={el => {
                    if (el) noteRefs.current[note.id] = el;
                  }}
                  className='animate-in fade-in cursor-pointer duration-200'
                  style={{
                    contentVisibility: 'auto',
                    containIntrinsicSize: 'auto 280px',
                  }}
                  onMouseEnter={() => onNoteHover(note.id)}
                  onMouseLeave={handleMouseLeave}
                  onClick={() => onNoteClick(note.id)}
                >
                  <NoteCard note={note} isActive={note.id === activeNoteId} />
                </div>
              ))
              // Empty state
            : <div className='col-span-full flex flex-col items-center justify-center p-8 py-20'>
                <div className='bg-muted mb-4 rounded-full p-4'>
                  <MapPin className='text-muted-foreground h-8 w-8' />
                </div>
                <h3 className='text-foreground text-xl font-semibold'>No Notes Found</h3>
                <p className='text-muted-foreground mt-2 max-w-sm text-center text-sm'>
                  Try zooming out or moving the map to discover notes in other areas.
                </p>
              </div>
            }

            {/* Infinite scroll loader */}
            {hasMore && (
              <div className='col-span-full mt-4 flex min-h-10 justify-center'>
                <div ref={loaderRef} className='flex h-10 w-full items-center justify-center'>
                  {isLoadingMore && (
                    <div className='text-muted-foreground flex items-center gap-2'>
                      <div className='border-primary h-5 w-5 animate-spin rounded-full border-2 border-t-transparent' />
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
