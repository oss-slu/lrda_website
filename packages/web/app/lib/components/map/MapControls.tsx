'use client';

import React, { forwardRef } from 'react';
import { UserIcon, Plus, Minus, Users, Crosshair } from 'lucide-react';
import SearchBarMap from '../search_bar_map';
import { Note } from '@/app/types';
import { PANEL_WIDTH } from '../../constants/mapConstants';

interface MapControlsProps {
  // Search
  onSearch: (address: string, lat?: number, lng?: number, isNoteClick?: boolean) => void;
  onNotesSearch: (searchText: string) => void;
  isLoaded: boolean;
  filteredNotes: Note[];

  // View toggle
  isLoggedIn: boolean;
  isGlobalView: boolean;
  onToggleView: () => void;

  // Zoom
  mapZoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;

  // Location
  onLocate: () => void;

  // Panel state (for positioning)
  isPanelOpen: boolean;
}

const MapControls = forwardRef<HTMLDivElement, MapControlsProps>(
  (
    {
      onSearch,
      onNotesSearch,
      isLoaded,
      filteredNotes,
      isLoggedIn,
      isGlobalView,
      onToggleView,
      onZoomIn,
      onZoomOut,
      onLocate,
      isPanelOpen,
    },
    searchBarRef,
  ) => {
    return (
      <div className='pointer-events-none absolute z-40 mt-4 flex h-10 w-full flex-row justify-between'>
        {/* Left side - Search and view toggle */}
        <div className='pointer-events-auto left-0 z-40 m-5 flex w-[30vw] flex-row items-center gap-3'>
          <div className='min-w-[80px]' ref={searchBarRef}>
            <SearchBarMap
              onSearch={onSearch}
              onNotesSearch={onNotesSearch}
              isLoaded={isLoaded}
              filteredNotes={filteredNotes}
            />
          </div>
          {isLoggedIn && (
            <button
              onClick={onToggleView}
              title={isGlobalView ? 'Show my notes' : 'Show all notes'}
              className={`inline-flex h-10 w-10 items-center justify-center rounded-full bg-secondary shadow-lg transition-all duration-200 hover:bg-gray-200 hover:shadow-xl ${
                isGlobalView ? 'text-blue-600' : 'text-green-600'
              }`}
            >
              {isGlobalView ?
                <Users className='h-5 w-5' />
              : <UserIcon className='h-5 w-5' />}
            </button>
          )}
        </div>

        {/* Right side - Zoom and location controls */}
        <div
          className='pointer-events-auto mr-4 flex flex-row items-center gap-3 transition-all duration-300 ease-in-out md:mr-0'
          style={{
            marginRight: isPanelOpen ? `calc(${PANEL_WIDTH} + 1rem)` : undefined,
          }}
        >
          {/* Zoom controls grouped in a pill */}
          <div className='flex items-center gap-0.5 rounded-full bg-white p-1 shadow-lg'>
            <button
              onClick={onZoomOut}
              title='Zoom out'
              className='inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground'
            >
              <Minus className='h-4 w-4' />
            </button>
            <div className='h-4 w-px bg-border' />
            <button
              onClick={onZoomIn}
              title='Zoom in'
              className='inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground'
            >
              <Plus className='h-4 w-4' />
            </button>
          </div>

          {/* Location button */}
          <button
            onClick={onLocate}
            title='Find my location'
            className='inline-flex h-10 w-10 items-center justify-center rounded-full bg-secondary shadow-lg transition-all duration-200 hover:bg-gray-200 hover:shadow-xl'
          >
            <Crosshair className='h-5 w-5 text-muted-foreground' />
          </button>
        </div>
      </div>
    );
  },
);

MapControls.displayName = 'MapControls';

export default MapControls;
