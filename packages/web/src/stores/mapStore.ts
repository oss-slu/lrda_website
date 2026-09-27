import { create } from 'zustand';
import { Note } from '@/types';
import type { Location } from '@/utils/mapUtils';
import { DEFAULT_PANEL_WIDTH } from '@/utils/mapConstants';

interface MapState {
  // Map viewport state
  mapCenter: Location;
  mapZoom: number;
  mapBounds: google.maps.LatLngBounds | null;
  locationFound: boolean;

  // UI state
  isPanelOpen: boolean;
  /** Notes panel width in pixels (desktop only -- user-resizable) */
  panelWidth: number;
  isLoading: boolean;

  // Note interaction state
  activeNote: Note | null;
  hoveredNoteId: string | null;
  detailNoteId: string | null;
  isNoteSelectedFromSearch: boolean;

  // Search state
  searchQuery: string;

  // Global/personal toggle
  isGlobalView: boolean;

  // Actions
  setMapCenter: (center: Location) => void;
  setMapZoom: (zoom: number) => void;
  setMapBounds: (bounds: google.maps.LatLngBounds | null) => void;
  setLocationFound: (found: boolean) => void;
  setIsPanelOpen: (open: boolean) => void;
  setPanelWidth: (width: number) => void;
  setIsLoading: (loading: boolean) => void;
  setActiveNote: (note: Note | null) => void;
  setHoveredNoteId: (id: string | null) => void;
  setDetailNoteId: (id: string | null) => void;
  setIsNoteSelectedFromSearch: (selected: boolean) => void;
  setSearchQuery: (query: string) => void;
  setIsGlobalView: (global: boolean) => void;
}

const DEFAULT_CENTER: Location = { lat: 38.005984, lng: -24.334449 };
const DEFAULT_ZOOM = 2;

export const useMapStore = create<MapState>()(set => ({
  // Initial state
  mapCenter: DEFAULT_CENTER,
  mapZoom: DEFAULT_ZOOM,
  mapBounds: null,
  locationFound: false,
  isPanelOpen: true,
  panelWidth: DEFAULT_PANEL_WIDTH,
  isLoading: true,
  activeNote: null,
  hoveredNoteId: null,
  detailNoteId: null,
  isNoteSelectedFromSearch: false,
  searchQuery: '',
  isGlobalView: true,

  // Simple setters
  setMapCenter: center => set({ mapCenter: center }),
  setMapZoom: zoom => set({ mapZoom: zoom }),
  setMapBounds: bounds => set({ mapBounds: bounds }),
  setLocationFound: found => set({ locationFound: found }),
  setIsPanelOpen: open => set({ isPanelOpen: open }),
  setPanelWidth: width => set({ panelWidth: width }),
  setIsLoading: loading => set({ isLoading: loading }),
  setActiveNote: note => set({ activeNote: note }),
  setHoveredNoteId: id => set({ hoveredNoteId: id }),
  setDetailNoteId: id => set({ detailNoteId: id }),
  setIsNoteSelectedFromSearch: selected => set({ isNoteSelectedFromSearch: selected }),
  setSearchQuery: query => set({ searchQuery: query }),
  setIsGlobalView: global => set({ isGlobalView: global }),
}));
