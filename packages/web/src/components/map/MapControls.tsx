import { forwardRef } from 'react';
import { UserIcon, Plus, Minus, Users, Crosshair } from 'lucide-react';
import SearchBarMap from '@/components/search_bar_map';
import { Note } from '@/types';
import { cn } from '@/lib/utils';
import type { PanelFocus } from '@/stores/mapStore';

interface MapControlsProps {
  // Search
  onSearch: (address: string, lat?: number, lng?: number, isNoteClick?: boolean) => void;
  onNotesSearch: (searchText: string) => void;
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

  // Panel state -- controls shift left of the docked panel, and hide when the map is covered
  panelFocus: PanelFocus;
}

const MapControls = forwardRef<HTMLDivElement, MapControlsProps>(
  (
    {
      onSearch,
      onNotesSearch,
      filteredNotes,
      isLoggedIn,
      isGlobalView,
      onToggleView,
      onZoomIn,
      onZoomOut,
      onLocate,
      panelFocus,
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
              filteredNotes={filteredNotes}
            />
          </div>
          {isLoggedIn && (
            <button
              onClick={onToggleView}
              aria-label={isGlobalView ? 'Show my notes' : 'Show all notes'}
              title={isGlobalView ? 'Show my notes' : 'Show all notes'}
              className={`bg-secondary inline-flex h-10 w-10 items-center justify-center rounded-full shadow-lg transition-all duration-200 hover:bg-accent hover:shadow-xl ${
                isGlobalView ? 'text-blue-600' : 'text-green-600'
              }`}
            >
              {isGlobalView ?
                <Users className='h-5 w-5' />
              : <UserIcon className='h-5 w-5' />}
            </button>
          )}
        </div>

        {/* Right side - Zoom and location controls (target the map, so hidden while it is) */}
        {panelFocus !== 'notes' && (
          <div
            className={cn(
              // Slides by transform on the panel's timing (docked width + 1rem gap) so it
              // moves in lockstep with the panel instead of lagging behind a margin animation
              'pointer-events-auto mr-4 flex flex-row items-center gap-3 transition-transform duration-300 ease-in-out md:mr-0',
              panelFocus === 'split' && '-translate-x-[35rem]',
            )}
          >
            {/* Zoom controls grouped in a pill */}
            <div className='bg-card flex items-center gap-0.5 rounded-full p-1 shadow-lg'>
              <button
                onClick={onZoomOut}
                aria-label='Zoom out'
                title='Zoom out'
                className='text-muted-foreground hover:bg-accent hover:text-foreground inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors'
              >
                <Minus className='h-4 w-4' />
              </button>
              <div className='bg-border h-4 w-px' />
              <button
                onClick={onZoomIn}
                aria-label='Zoom in'
                title='Zoom in'
                className='text-muted-foreground hover:bg-accent hover:text-foreground inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors'
              >
                <Plus className='h-4 w-4' />
              </button>
            </div>

            {/* Location button */}
            <button
              onClick={onLocate}
              aria-label='Find my location'
              title='Find my location'
              className='bg-secondary inline-flex h-10 w-10 items-center justify-center rounded-full shadow-lg transition-all duration-200 hover:bg-accent hover:shadow-xl'
            >
              <Crosshair className='text-muted-foreground h-5 w-5' />
            </button>
          </div>
        )}
      </div>
    );
  },
);

MapControls.displayName = 'MapControls';

export default MapControls;
