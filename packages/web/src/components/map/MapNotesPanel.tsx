import React, { forwardRef, useCallback, useRef } from 'react';
import { Note } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CircleAlert, X, MapPin, PanelLeft } from 'lucide-react';
import NoteCard from '@/components/note_card';
import NoteDetail from '@/components/NoteDetail';
import { MIN_PANEL_WIDTH, MIN_MAP_VISIBLE_WIDTH } from '@/utils/mapConstants';
import { cn } from '@/lib/utils';

interface Refs {
  [key: string]: HTMLElement | undefined;
}

interface MapNotesPanelProps {
  isPanelOpen: boolean;
  /** Current notes panel width in pixels (desktop only) */
  panelWidth: number;
  onPanelWidthChange: (width: number) => void;
  onResizeStart: () => void;
  onResizeEnd: () => void;
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
      panelWidth,
      onPanelWidthChange,
      onResizeStart,
      onResizeEnd,
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
      onTogglePanel,
    },
    notesListRef,
  ) => {
    // Stable callback for clearing hover
    const handleMouseLeave = useCallback(() => onNoteHover(null), [onNoteHover]);

    // Drag-to-resize on desktop -- pointer capture keeps move/up events
    // firing on this element even once the cursor leaves the thin handle.
    const isDraggingRef = useRef(false);

    const handleResizePointerDown = useCallback(
      (e: React.PointerEvent<HTMLDivElement>) => {
        isDraggingRef.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        onResizeStart();
      },
      [onResizeStart],
    );

    const handleResizePointerMove = useCallback(
      (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isDraggingRef.current) return;
        const maxWidth = Math.max(MIN_PANEL_WIDTH, window.innerWidth - MIN_MAP_VISIBLE_WIDTH);
        const nextWidth = Math.min(
          maxWidth,
          Math.max(MIN_PANEL_WIDTH, window.innerWidth - e.clientX),
        );
        onPanelWidthChange(nextWidth);
      },
      [onPanelWidthChange],
    );

    const handleResizePointerUp = useCallback(
      (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isDraggingRef.current) return;
        isDraggingRef.current = false;
        e.currentTarget.releasePointerCapture(e.pointerId);
        onResizeEnd();
      },
      [onResizeEnd],
    );

    return (
      <>
        {/* Mobile-only FAB -- desktop always shows the panel and resizes via the drag handle below */}
        <Button
          variant='secondary'
          size='icon'
          onClick={onTogglePanel}
          aria-label='Open notes panel'
          className={cn(
            'absolute top-1/2 right-4 z-20 h-10 w-10 -translate-y-1/2 rounded-full shadow-lg transition-all duration-300 hover:shadow-xl md:hidden',
            isPanelOpen ? 'hidden' : 'flex',
          )}
        >
          <PanelLeft className='h-5 w-5' />
        </Button>

        {/* Notes Panel */}
        <div
          className={cn(
            'bg-background absolute top-0 right-0 z-30 h-full w-full overflow-hidden border-l transition-transform duration-300 ease-in-out md:w-[var(--panel-width)]',
            isPanelOpen ? 'translate-x-0' : 'translate-x-full',
          )}
          style={{ '--panel-width': `${panelWidth}px` } as React.CSSProperties}
          ref={notesListRef}
        >
          {/* Drag handle -- resizes the panel on desktop; hit area is wider than the visible line.
              z-50 keeps it above the note detail overlay (z-40) so an open note can be resized too. */}
          <div
            role='separator'
            aria-orientation='vertical'
            aria-label='Resize notes panel'
            onPointerDown={handleResizePointerDown}
            onPointerMove={handleResizePointerMove}
            onPointerUp={handleResizePointerUp}
            onPointerCancel={handleResizePointerUp}
            className='group absolute top-0 left-0 z-50 hidden h-full w-2 -translate-x-1/2 cursor-col-resize touch-none md:block'
          >
            <div className='mx-auto h-full w-1 bg-transparent transition-colors group-hover:bg-blue-400' />
          </div>

          {/* Scrollable list -- kept mounted so scroll position is preserved when viewing a note */}
          <div className='h-full overflow-y-auto'>
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
      </>
    );
  },
);

MapNotesPanel.displayName = 'MapNotesPanel';

export default MapNotesPanel;
