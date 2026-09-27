import React, { forwardRef, useCallback } from 'react';
import { Note } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CircleAlert, ChevronLeft, ChevronRight, X, MapPin } from 'lucide-react';
import NoteCard from '@/components/note_card';
import NoteDetail from '@/components/NoteDetail';
import type { PanelFocus } from '@/stores/mapStore';
import { cn } from '@/lib/utils';

interface Refs {
  [key: string]: HTMLElement | undefined;
}

interface MapNotesPanelProps {
  focus: PanelFocus;
  isLoading: boolean;
  isError?: boolean;
  errorMessage?: string;
  visibleItems: Note[];
  hasMore: boolean;
  isLoadingMore: boolean;
  loaderRef: React.RefCallback<HTMLDivElement>;
  activeNoteId: string | null;
  selectedNoteId: string | null;
  noteRefs: React.MutableRefObject<Refs>;
  onNoteHover: (noteId: string | null) => void;
  onNoteClick: (noteId: string) => void;
  onNoteClose: () => void;
  onFocusChange: (focus: PanelFocus) => void;
}

// Layout buttons ride the panel's left edge. Docked shows both directions;
// either full-width layout only offers the way back to docked.
const TOGGLE_BUTTONS: Record<
  PanelFocus,
  { to: PanelFocus; label: string; icon: typeof ChevronLeft }[]
> = {
  split: [
    { to: 'notes', label: 'Expand notes to full width', icon: ChevronLeft },
    { to: 'map', label: 'Hide notes panel', icon: ChevronRight },
  ],
  notes: [{ to: 'split', label: 'Show map beside notes', icon: ChevronRight }],
  map: [{ to: 'split', label: 'Show notes panel', icon: ChevronLeft }],
};

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
      focus,
      isLoading,
      isError,
      errorMessage,
      visibleItems,
      hasMore,
      isLoadingMore,
      loaderRef,
      activeNoteId,
      selectedNoteId,
      noteRefs,
      onNoteHover,
      onNoteClick,
      onNoteClose,
      onFocusChange,
    },
    notesListRef,
  ) => {
    // Stable callback for clearing hover
    const handleMouseLeave = useCallback(() => onNoteHover(null), [onNoteHover]);

    return (
      <>
        {/* Slide/resize wrapper -- carries the layout buttons along with the panel on the
            same transform, so they never lag behind its edge */}
        <div
          className={cn(
            'absolute top-0 right-0 z-30 h-full w-full transition-[translate,width] duration-300 ease-in-out',
            // Only full-notes is full width -- the hidden state keeps the docked width so
            // showing the panel again is a pure slide, not a full-screen width sweep
            focus !== 'notes' && 'md:w-[34rem]',
            focus === 'map' ? 'translate-x-full' : 'translate-x-0',
          )}
        >
          {/* Layout buttons - just outside the panel's left edge; tucked inside it when the
            panel is full width. Hidden on mobile while the panel is open (it has its own close button) */}
          <div
            className={cn(
              'absolute top-1/2 right-full z-50 -translate-y-1/2 flex-col gap-2 transition-transform duration-300 ease-in-out',
              focus === 'notes' && 'translate-x-14',
              focus === 'map' && '-translate-x-4',
              focus === 'map' ? 'flex' : 'hidden md:flex',
            )}
          >
            {TOGGLE_BUTTONS[focus].map(({ to, label, icon: Icon }) => (
              <Button
                key={to}
                variant='secondary'
                size='icon'
                onClick={() => onFocusChange(to)}
                aria-label={label}
                title={label}
                className='h-10 w-10 rounded-full shadow-lg transition-shadow hover:shadow-xl'
              >
                <Icon className='h-5 w-5' />
              </Button>
            ))}
          </div>

          {/* Notes Panel */}
          <div
            className='bg-background relative h-full w-full overflow-hidden border-l'
            ref={notesListRef}
          >
            {/* Scrollable list -- kept mounted so scroll position is preserved when viewing a note */}
            <div className='h-full overflow-y-auto'>
              {/* Mobile header */}
              <div className='bg-card sticky top-0 z-10 flex items-center justify-between border-b p-4 md:hidden'>
                <h2 className='text-lg font-semibold'>Notes</h2>
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={() => onFocusChange('map')}
                  aria-label='Close notes panel'
                  className='h-8 w-8 rounded-full'
                >
                  <X className='h-4 w-4' />
                </Button>
              </div>

              {/* Fixed-width columns on desktop: a wider panel fits more cards rather than
                stretching them. 15rem fits two columns in the default 34rem panel even with
                a Windows scrollbar (~17px) showing, matching main's card size. Mobile keeps
                main's single column. */}
              <div className='grid grid-cols-1 content-start gap-1 p-4 md:grid-cols-[repeat(auto-fill,15rem)] md:justify-center'>
                {isLoading ?
                  // Loading skeletons with staggered pulse
                  skeletonIndices.map(index => <SkeletonCard key={index} index={index} />)
                : isError ?
                  // Error state
                  <div className='col-span-full flex flex-col items-center justify-center p-8 py-20'>
                    <div className='bg-destructive/10 mb-4 rounded-full p-4'>
                      <CircleAlert className='text-destructive h-8 w-8' />
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
                      className='animate-in fade-in cursor-pointer p-1 duration-200'
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

            {/* Note detail -- overlays the list, lightbox renders as its own full-screen layer */}
            {selectedNoteId && (
              <div className='bg-background absolute inset-0 z-40'>
                <NoteDetail variant='panel' noteId={selectedNoteId} onBack={onNoteClose} />
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
