import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import * as ReactDOM from 'react-dom/client';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { Note } from '@/app/types';
import { createPopupClass, PopupInstance } from '../components/map/MapPopup';
import NoteCard from '../components/note_card';

interface UseMapMarkersProps {
  mapRef: React.MutableRefObject<google.maps.Map | null>;
  isMapsApiLoaded: boolean;
  filteredNotes: Note[];
  isPanelOpen: boolean;
  setActiveNote: (note: Note | null) => void;
  setHoveredNoteId: (noteId: string | null) => void;
  setIsLoading: (loading: boolean) => void;
  scrollToNoteTile: (noteId: string) => void;
}

/**
 * Hook to manage map markers and their interactions.
 *
 * Uses diff-based updates: only adds/removes markers that changed,
 * instead of destroying and recreating all markers on every render.
 */
export function useMapMarkers({
  mapRef,
  isMapsApiLoaded,
  filteredNotes,
  isPanelOpen,
  setActiveNote,
  setHoveredNoteId,
  setIsLoading,
  scrollToNoteTile,
}: UseMapMarkersProps) {
  const queryClient = useQueryClient();

  // --- Refs for values that change but should NOT trigger marker rebuilds ---
  const queryClientRef = useRef(queryClient);
  queryClientRef.current = queryClient;

  const isPanelOpenRef = useRef(isPanelOpen);
  isPanelOpenRef.current = isPanelOpen;

  const setActiveNoteRef = useRef(setActiveNote);
  setActiveNoteRef.current = setActiveNote;

  const setHoveredNoteIdRef = useRef(setHoveredNoteId);
  setHoveredNoteIdRef.current = setHoveredNoteId;

  const scrollToNoteTileRef = useRef(scrollToNoteTile);
  scrollToNoteTileRef.current = scrollToNoteTile;

  const navigate = useNavigate();
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;

  const markerClustererRef = useRef<MarkerClusterer | null>(null);
  const currentPopupRef = useRef<PopupInstance | null>(null);
  const currentPopupNoteIdRef = useRef<string | null>(null);
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);
  const markerHoveredRef = useRef(false);
  const popupHoveredRef = useRef(false);
  const markersRef = useRef(new Map<string, google.maps.marker.AdvancedMarkerElement>());
  const mapClickListenerRef = useRef<google.maps.MapsEventListener | null>(null);
  const popupClassRef = useRef<ReturnType<typeof createPopupClass> | null>(null);

  // Start popup close timer with delay
  const startPopupCloseTimer = useCallback(() => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
    }

    hoverTimerRef.current = setTimeout(() => {
      if (!markerHoveredRef.current && !popupHoveredRef.current && currentPopupRef.current) {
        currentPopupRef.current.setMap(null);
        currentPopupRef.current = null;
        currentPopupNoteIdRef.current = null;
        setHoveredNoteIdRef.current(null);
        setActiveNoteRef.current(null);
      }
    }, 300);
  }, []);

  const startPopupCloseTimerRef = useRef(startPopupCloseTimer);
  startPopupCloseTimerRef.current = startPopupCloseTimer;

  // Handle map click to close popup
  const handleMapClick = useCallback(() => {
    if (currentPopupRef.current) {
      currentPopupRef.current.setMap(null);
    }
    currentPopupRef.current = null;
    currentPopupNoteIdRef.current = null;
    setActiveNoteRef.current(null);
  }, []);

  // Create marker icon element
  const createMarkerIcon = useCallback((): HTMLElement => {
    const div = document.createElement('div');
    div.classList.add('custom-marker');
    div.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="40" height="40" class="marker-svg">
        <path class="marker-body" fill="#4285F4" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
        <circle class="marker-center" fill="white" cx="12" cy="9" r="2.5"/>
      </svg>
    `;
    return div;
  }, []);

  // Create a single marker and attach events. Uses refs for all callbacks
  // so marker event handlers never go stale.
  const createMarker = useCallback(
    (note: Note, map: google.maps.Map): google.maps.marker.AdvancedMarkerElement => {
      const position = new google.maps.LatLng(note.latitude!, note.longitude!);
      const iconNode = createMarkerIcon();
      const marker = new google.maps.marker.AdvancedMarkerElement({
        position,
        map,
        content: iconNode,
        title: note.title || '',
      });

      // Click -> navigate to note page
      iconNode.addEventListener('click', e => {
        e.stopPropagation();
        if (currentPopupRef.current) {
          currentPopupRef.current.setMap(null);
          currentPopupRef.current = null;
          currentPopupNoteIdRef.current = null;
        }
        navigateRef.current({ to: `/notes/${note.id}` });
      });

      // Hover -> show popup
      iconNode.addEventListener('mouseenter', () => {
        if (currentPopupRef.current && currentPopupRef.current.isClickPopup) {
          return;
        }
        if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
        markerHoveredRef.current = true;

        // Open popup if not already showing for this note
        if (currentPopupNoteIdRef.current !== note.id || !currentPopupRef.current) {
          if (currentPopupRef.current) {
            currentPopupRef.current.setMap(null);
          }

          if (!popupClassRef.current) return;

          const popupContent = document.createElement('div');
          const root = ReactDOM.createRoot(popupContent);
          root.render(
            <QueryClientProvider client={queryClientRef.current}>
              <NoteCard note={note} />
            </QueryClientProvider>,
          );

          const popup = new popupClassRef.current(
            new google.maps.LatLng(note.latitude!, note.longitude!),
            popupContent,
            false,
          );

          currentPopupRef.current = popup;
          currentPopupNoteIdRef.current = note.id;
          popup.setMap(map);
        }

        setHoveredNoteIdRef.current(note.id);
        if (isPanelOpenRef.current) scrollToNoteTileRef.current(note.id);
        setActiveNoteRef.current(note);
      });

      iconNode.addEventListener('mouseleave', () => {
        markerHoveredRef.current = false;
        startPopupCloseTimerRef.current();
      });

      return marker;
    },
    [createMarkerIcon],
  );

  // One-time setup: map click listener and Popup class
  useEffect(() => {
    if (!isMapsApiLoaded || !mapRef.current) return;

    const map = mapRef.current;

    // Create Popup class once
    popupClassRef.current = createPopupClass({
      popupHoveredRef,
      hoverTimerRef,
      startPopupCloseTimer: startPopupCloseTimerRef.current,
    });

    // Map click listener -- set up once
    mapClickListenerRef.current = map.addListener('click', () => {
      if (currentPopupRef.current) {
        currentPopupRef.current.setMap(null);
        currentPopupRef.current = null;
        currentPopupNoteIdRef.current = null;
      }
      setActiveNoteRef.current(null);
    });

    return () => {
      if (mapClickListenerRef.current) {
        google.maps.event.removeListener(mapClickListenerRef.current);
        mapClickListenerRef.current = null;
      }
    };
  }, [isMapsApiLoaded, mapRef]);

  // Diff-based marker sync: only add/remove markers that changed
  useEffect(() => {
    if (!isMapsApiLoaded || !mapRef.current) return;

    const map = mapRef.current;
    const currentMarkers = markersRef.current;

    // Build set of note IDs that should have markers
    const desiredIds = new Set<string>();
    for (const n of filteredNotes) {
      if (n.latitude != null && n.longitude != null) {
        desiredIds.add(n.id);
      }
    }

    // Remove markers for notes no longer in the set
    const toRemove: string[] = [];
    for (const id of Array.from(currentMarkers.keys())) {
      if (!desiredIds.has(id)) {
        toRemove.push(id);
      }
    }
    for (const id of toRemove) {
      const marker = currentMarkers.get(id)!;
      markerClustererRef.current?.removeMarker(marker);
      marker.map = null;
      currentMarkers.delete(id);
    }

    // Add markers for newly visible notes
    const toAdd: google.maps.marker.AdvancedMarkerElement[] = [];
    for (const note of filteredNotes) {
      if (note.latitude == null || note.longitude == null) continue;
      if (currentMarkers.has(note.id)) continue;

      const marker = createMarker(note, map);
      currentMarkers.set(note.id, marker);
      toAdd.push(marker);
    }

    // Update clusterer
    if (!markerClustererRef.current) {
      // First run: create clusterer with all current markers
      markerClustererRef.current = new MarkerClusterer({
        markers: Array.from(currentMarkers.values()),
        map,
      });
    } else {
      if (toAdd.length > 0) {
        markerClustererRef.current.addMarkers(toAdd, true);
      }
      if (toAdd.length > 0 || toRemove.length > 0) {
        markerClustererRef.current.render();
      }
    }

    setIsLoading(false);
  }, [isMapsApiLoaded, filteredNotes, mapRef, createMarker, setIsLoading]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (markerClustererRef.current) {
        markerClustererRef.current.clearMarkers();
        markerClustererRef.current = null;
      }
      markersRef.current.forEach(marker => {
        marker.map = null;
      });
      markersRef.current.clear();
    };
  }, []);

  return {
    markersRef,
    handleMapClick,
    currentPopupRef,
    startPopupCloseTimer,
    hoverTimerRef,
    markerHoveredRef,
    popupHoveredRef,
  };
}
