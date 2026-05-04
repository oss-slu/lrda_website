import { create } from 'zustand';
import { Note } from '@/app/types';
import type { Location } from '@/app/lib/utils/mapUtils';

interface MapState {
  // Map viewport state
  mapCenter: Location;
  mapZoom: number;
  mapBounds: google.maps.LatLngBounds | null;
  locationFound: boolean;

  // UI state
  isPanelOpen: boolean;
  isLoading: boolean;

  // Note interaction state
  activeNote: Note | null;
  hoveredNoteId: string | null;
  modalNoteId: string | null;
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
  setIsLoading: (loading: boolean) => void;
  setActiveNote: (note: Note | null) => void;
  setHoveredNoteId: (id: string | null) => void;
  setModalNoteId: (id: string | null) => void;
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
  isLoading: true,
  activeNote: null,
  hoveredNoteId: null,
  modalNoteId: null,
  isNoteSelectedFromSearch: false,
  searchQuery: '',
  isGlobalView: true,

  // Simple setters
  setMapCenter: center => set({ mapCenter: center }),
  setMapZoom: zoom => set({ mapZoom: zoom }),
  setMapBounds: bounds => set({ mapBounds: bounds }),
  setLocationFound: found => set({ locationFound: found }),
  setIsPanelOpen: open => set({ isPanelOpen: open }),
  setIsLoading: loading => set({ isLoading: loading }),
  setActiveNote: note => set({ activeNote: note }),
  setHoveredNoteId: id => set({ hoveredNoteId: id }),
  setModalNoteId: id => set({ modalNoteId: id }),
  setIsNoteSelectedFromSearch: selected => set({ isNoteSelectedFromSearch: selected }),
  setSearchQuery: query => set({ searchQuery: query }),
  setIsGlobalView: global => set({ isGlobalView: global }),
}));
