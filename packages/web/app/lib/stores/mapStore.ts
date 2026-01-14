import { create } from 'zustand';
import { Note } from '@/app/types';

interface Location {
  lat: number;
  lng: number;
}

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
  modalNote: Note | null;
  isNoteSelectedFromSearch: boolean;

  // Global/personal toggle
  isGlobalView: boolean;

  // Actions
  setMapCenter: (center: Location) => void;
  setMapZoom: (zoom: number) => void;
  setMapBounds: (bounds: google.maps.LatLngBounds | null) => void;
  setLocationFound: (found: boolean) => void;
  setIsPanelOpen: (open: boolean) => void;
  togglePanel: () => void;
  setIsLoading: (loading: boolean) => void;
  setActiveNote: (note: Note | null) => void;
  setHoveredNoteId: (id: string | null) => void;
  setModalNote: (note: Note | null) => void;
  setIsNoteSelectedFromSearch: (selected: boolean) => void;
  setIsGlobalView: (global: boolean) => void;
  toggleGlobalView: () => void;

  // Compound actions
  resetMapState: () => void;
  updateMapViewport: (
    center: Location,
    zoom: number,
    bounds?: google.maps.LatLngBounds | null,
  ) => void;
}

const DEFAULT_CENTER: Location = { lat: 38.005984, lng: -24.334449 };
const DEFAULT_ZOOM = 2;

export const useMapStore = create<MapState>()((set, get) => ({
  // Initial state
  mapCenter: DEFAULT_CENTER,
  mapZoom: DEFAULT_ZOOM,
  mapBounds: null,
  locationFound: false,
  isPanelOpen: true,
  isLoading: true,
  activeNote: null,
  hoveredNoteId: null,
  modalNote: null,
  isNoteSelectedFromSearch: false,
  isGlobalView: true,

  // Simple setters
  setMapCenter: center => set({ mapCenter: center }),
  setMapZoom: zoom => set({ mapZoom: zoom }),
  setMapBounds: bounds => set({ mapBounds: bounds }),
  setLocationFound: found => set({ locationFound: found }),
  setIsPanelOpen: open => set({ isPanelOpen: open }),
  togglePanel: () => set(state => ({ isPanelOpen: !state.isPanelOpen })),
  setIsLoading: loading => set({ isLoading: loading }),
  setActiveNote: note => set({ activeNote: note }),
  setHoveredNoteId: id => set({ hoveredNoteId: id }),
  setModalNote: note => set({ modalNote: note }),
  setIsNoteSelectedFromSearch: selected => set({ isNoteSelectedFromSearch: selected }),
  setIsGlobalView: global => set({ isGlobalView: global }),
  toggleGlobalView: () => set(state => ({ isGlobalView: !state.isGlobalView })),

  // Compound actions
  resetMapState: () =>
    set({
      mapCenter: DEFAULT_CENTER,
      mapZoom: DEFAULT_ZOOM,
      mapBounds: null,
      activeNote: null,
      hoveredNoteId: null,
      modalNote: null,
      isNoteSelectedFromSearch: false,
    }),

  updateMapViewport: (center, zoom, bounds = null) =>
    set({
      mapCenter: center,
      mapZoom: zoom,
      mapBounds: bounds,
    }),
}));
