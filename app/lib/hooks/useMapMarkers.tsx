"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as ReactDOM from "react-dom/client";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import { Note } from "@/app/types";
import { createPopupClass, PopupInstance } from "../components/map/MapPopup";
import NoteCard from "../components/note_card";

interface UseMapMarkersProps {
  mapRef: React.MutableRefObject<google.maps.Map | null>;
  isMapsApiLoaded: boolean;
  filteredNotes: Note[];
  isPanelOpen: boolean;
  setActiveNote: (note: Note | null) => void;
  setHoveredNoteId: (noteId: string | null) => void;
  setModalNote: (note: Note | null) => void;
  setIsLoading: (loading: boolean) => void;
  scrollToNoteTile: (noteId: string) => void;
}

/**
 * Hook to manage map markers and their interactions.
 */
export function useMapMarkers({
  mapRef,
  isMapsApiLoaded,
  filteredNotes,
  isPanelOpen,
  setActiveNote,
  setHoveredNoteId,
  setModalNote,
  setIsLoading,
  scrollToNoteTile,
}: UseMapMarkersProps) {
  const markerClustererRef = useRef<MarkerClusterer | null>(null);
  const currentPopupRef = useRef<PopupInstance | null>(null);
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);
  const markerHoveredRef = useRef(false);
  const popupHoveredRef = useRef(false);
  const [markers, setMarkers] = useState(
    new Map<string, google.maps.marker.AdvancedMarkerElement>()
  );

  // Start popup close timer with delay
  const startPopupCloseTimer = useCallback(() => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
    }

    hoverTimerRef.current = setTimeout(() => {
      if (
        !markerHoveredRef.current &&
        !popupHoveredRef.current &&
        currentPopupRef.current
      ) {
        currentPopupRef.current.setMap(null);
        currentPopupRef.current = null;
        setHoveredNoteId(null);
        setActiveNote(null);
      }
    }, 200);
  }, [setHoveredNoteId, setActiveNote]);

  // Handle map click to close popup
  const handleMapClick = useCallback(() => {
    if (currentPopupRef.current) {
      currentPopupRef.current.setMap(null);
    }
    currentPopupRef.current = null;
    setActiveNote(null);
  }, [setActiveNote]);

  // Create marker icon element
  const createMarkerIcon = useCallback((): HTMLElement => {
    const div = document.createElement("div");
    div.classList.add("custom-marker");
    div.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="40" height="40" class="marker-svg">
        <path class="marker-body" fill="#4285F4" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
        <circle class="marker-center" fill="white" cx="12" cy="9" r="2.5"/>
      </svg>
    `;
    return div;
  }, []);

  // Main effect to create/update markers
  useEffect(() => {
    if (!isMapsApiLoaded || !mapRef.current) return;

    const map = mapRef.current;

    // Clear existing markers
    if (markerClustererRef.current) {
      markerClustererRef.current.clearMarkers();
    }
    markers.forEach((marker) => {
      marker.map = null;
    });
    setMarkers(new Map());

    if (filteredNotes.length === 0) {
      return;
    }

    // Create Popup class with refs
    const Popup = createPopupClass({
      popupHoveredRef,
      hoverTimerRef,
      startPopupCloseTimer,
    });

    const tempMarkers = new Map<
      string,
      google.maps.marker.AdvancedMarkerElement
    >();

    const mapClickListener = map.addListener("click", () => {
      if (currentPopupRef.current) {
        currentPopupRef.current.setMap(null);
        currentPopupRef.current = null;
        setActiveNote(null);
      }
    });

    // Open popup helper
    const openPopup = (note: Note, isClick: boolean) => {
      if (currentPopupRef.current) {
        currentPopupRef.current.setMap(null);
      }

      if (isClick) {
        setModalNote(note);
        return;
      }

      const popupContent = document.createElement("div");
      const root = ReactDOM.createRoot(popupContent);
      root.render(<NoteCard note={note} />);

      const popup = new Popup(
        new google.maps.LatLng(
          parseFloat(note.latitude),
          parseFloat(note.longitude)
        ),
        popupContent,
        isClick
      );

      currentPopupRef.current = popup;
      popup.setMap(map);
    };

    // Handle marker click
    const handleMarkerClick = (note: Note) => {
      if (currentPopupRef.current) {
        currentPopupRef.current.setMap(null);
        currentPopupRef.current = null;
      }

      setModalNote(note);
      setActiveNote(note);

      if (isPanelOpen) {
        scrollToNoteTile(note.id);
      }
    };

    // Attach events to marker
    const attachMarkerEvents = (
      marker: google.maps.marker.AdvancedMarkerElement,
      note: Note
    ) => {
      const iconNode = marker.content as HTMLElement;

      iconNode.addEventListener("click", (e) => {
        e.stopPropagation();
        handleMarkerClick(note);
      });

      iconNode.addEventListener("mouseenter", () => {
        if (currentPopupRef.current && currentPopupRef.current.isClickPopup) {
          return;
        }

        if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
        markerHoveredRef.current = true;

        if (!currentPopupRef.current) {
          openPopup(note, false);
        }

        setHoveredNoteId(note.id);
        if (isPanelOpen) scrollToNoteTile(note.id);
        setActiveNote(note);
      });

      iconNode.addEventListener("mouseleave", () => {
        markerHoveredRef.current = false;
        startPopupCloseTimer();
      });
    };

    // Create markers for each note
    filteredNotes.forEach((note) => {
      const lat = parseFloat(note.latitude);
      const lng = parseFloat(note.longitude);

      if (isNaN(lat) || isNaN(lng)) {
        console.warn(`Skipping note ${note.id}: invalid coordinates`, note);
        return;
      }

      const position = new google.maps.LatLng(lat, lng);
      const iconNode = createMarkerIcon();
      const marker = new google.maps.marker.AdvancedMarkerElement({
        position,
        map,
        content: iconNode,
        title: note.title || "",
      });

      attachMarkerEvents(marker, note);
      tempMarkers.set(note.id, marker);
    });

    setMarkers(tempMarkers);

    markerClustererRef.current = new MarkerClusterer({
      markers: Array.from(tempMarkers.values()),
      map: mapRef.current,
    });

    setIsLoading(false);

    return () => {
      if (markerClustererRef.current) {
        markerClustererRef.current.clearMarkers();
      }
      google.maps.event.removeListener(mapClickListener);
    };
  }, [
    isMapsApiLoaded,
    filteredNotes,
    mapRef,
    isPanelOpen,
    setActiveNote,
    setHoveredNoteId,
    setModalNote,
    setIsLoading,
    scrollToNoteTile,
    startPopupCloseTimer,
    createMarkerIcon,
  ]);

  return {
    markers,
    handleMapClick,
    currentPopupRef,
    startPopupCloseTimer,
    hoverTimerRef,
    markerHoveredRef,
    popupHoveredRef,
  };
}
