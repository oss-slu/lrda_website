'use client';

import React, { forwardRef } from 'react';
import { Note } from '@/app/types';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import NoteCard from '../note_card';
import { PANEL_WIDTH } from '../../constants/mapConstants';

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
        {/* Toggle Button - hidden on mobile when panel is open (panel has close button) */}
        <button
          onClick={onTogglePanel}
          aria-label={isPanelOpen ? 'Close notes panel' : 'Open notes panel'}
          className={`absolute top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-md transition-all duration-300 ease-in-out hover:bg-gray-100 ${isPanelOpen ? 'hidden md:flex' : 'flex'}`}
          style={{
            right: isPanelOpen ? PANEL_WIDTH : '1rem',
          }}
        >
          {isPanelOpen ? '>' : '<'}
        </button>

        {/* Notes Panel - full width on mobile, fixed width on desktop */}
        <div
          className={`absolute right-0 top-0 z-30 h-full w-full overflow-y-auto bg-neutral-100 transition-transform duration-300 ease-in-out md:w-[34rem] ${isPanelOpen ? 'translate-x-0' : 'translate-x-full'}`}
          ref={notesListRef}
        >
          {/* Mobile close button */}
          <div className='sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white p-3 md:hidden'>
            <h2 className='text-lg font-semibold'>Notes</h2>
            <button
              onClick={onTogglePanel}
              aria-label='Close notes panel'
              className='rounded-full p-2 hover:bg-gray-100'
            >
              <svg
                xmlns='http://www.w3.org/2000/svg'
                width='20'
                height='20'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              >
                <line x1='18' y1='6' x2='6' y2='18'></line>
                <line x1='6' y1='6' x2='18' y2='18'></line>
              </svg>
            </button>
          </div>
          <div className='grid grid-cols-1 content-start gap-2 p-2 lg:grid-cols-2'>
            {isLoading ?
              // Loading state
              [...Array(6)].map((_, index) => (
                <Skeleton
                  key={index}
                  className='flex h-[300px] w-64 flex-col rounded-sm border border-gray-200'
                />
              ))
            : isError ?
              // Error state
              <div className='col-span-full flex flex-col items-center justify-center p-4 py-20 text-center'>
                <AlertCircle className='mb-4 h-12 w-12 text-red-500' />
                <h3 className='text-xl font-semibold text-gray-700'>Failed to Load Notes</h3>
                <p className='mt-2 text-gray-500'>
                  {errorMessage ||
                    'Something went wrong while loading notes. Please try again later.'}
                </p>
              </div>
            : visibleItems.length > 0 ?
              // Notes found
              visibleItems.map(note => (
                <div
                  key={note.id}
                  ref={el => {
                    if (el) noteRefs.current[note.id] = el;
                  }}
                  className={`max-h-[308px] max-w-[265px] cursor-pointer transition-transform duration-300 ease-in-out ${
                    note.id === activeNoteId ? 'active-note' : 'hover:bg-gray-100'
                  }`}
                  onMouseEnter={() => onNoteHover(note.id)}
                  onMouseLeave={() => onNoteHover(null)}
                  onClick={() => onNoteClick(note)}
                >
                  <NoteCard note={note} />
                </div>
              ))
              // Empty state
            : <div className='col-span-full flex flex-col items-center justify-center p-4 py-20 text-center'>
                <h3 className='mt-4 text-xl font-semibold text-gray-700'>No Results Found</h3>
                <p className='mt-2 text-gray-500'>
                  Sorry, there are no notes in this area. Try zooming out or moving the map.
                </p>
              </div>
            }

            {/* Infinite scroll loader */}
            <div className='col-span-full mt-4 flex min-h-10 justify-center'>
              {hasMore ?
                <div ref={loaderRef} className='flex h-10 w-full items-center justify-center'>
                  {isLoadingMore && (
                    <div
                      className='h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-primary'
                      aria-label='Loading more'
                    />
                  )}
                </div>
              : null}
            </div>
          </div>
        </div>
      </>
    );
  },
);

MapNotesPanel.displayName = 'MapNotesPanel';

export default MapNotesPanel;
