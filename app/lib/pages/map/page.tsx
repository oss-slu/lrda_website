"use client";

import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { GoogleMap } from "@react-google-maps/api";
import { Note } from "@/app/types";
import { useAuthStore } from "../../stores/authStore";
import { useMapStore } from "../../stores/mapStore";
import { useShallow } from "zustand/react/shallow";
import ClickableNote from "../../components/click_note_card";
import { MapControls, MapNotesPanel } from "../../components/map";
import { useInfiniteNotes, NOTES_PAGE_SIZE } from "../../hooks/useInfiniteNotes";
import { useGoogleMaps } from "../../utils/GoogleMapsContext";
import { Dialog } from "@/components/ui/dialog";
import { useGlobalMapNotes, usePersonalMapNotes } from "../../hooks/queries/useNotes";
import { useMapLocation } from "../../hooks/useMapLocation";
import { useMapMarkers } from "../../hooks/useMapMarkers";
import { useMapIntro } from "../../hooks/useMapIntro";
import { filterNotesByMapBounds, filterNotesByQuery, filterNotesByTitleAndTags, Location } from "../../utils/mapUtils";

interface Refs {
  [key: string]: HTMLElement | undefined;
}

const Page = () => {
  // Map store for UI state
  const {
    mapCenter,
    mapZoom,
    mapBounds,
    locationFound,
    isPanelOpen,
    isLoading,
    activeNote,
    hoveredNoteId,
    modalNote,
    isNoteSelectedFromSearch,
    isGlobalView,
    setMapCenter,
    setMapZoom,
    setMapBounds,
    setLocationFound,
    setIsPanelOpen,
    setIsLoading,
    setActiveNote,
    setHoveredNoteId,
    setModalNote,
    setIsNoteSelectedFromSearch,
    setIsGlobalView,
  } = useMapStore(
    useShallow((state) => ({
      mapCenter: state.mapCenter,
      mapZoom: state.mapZoom,
      mapBounds: state.mapBounds,
      locationFound: state.locationFound,
      isPanelOpen: state.isPanelOpen,
      isLoading: state.isLoading,
      activeNote: state.activeNote,
      hoveredNoteId: state.hoveredNoteId,
      modalNote: state.modalNote,
      isNoteSelectedFromSearch: state.isNoteSelectedFromSearch,
      isGlobalView: state.isGlobalView,
      setMapCenter: state.setMapCenter,
      setMapZoom: state.setMapZoom,
      setMapBounds: state.setMapBounds,
      setLocationFound: state.setLocationFound,
      setIsPanelOpen: state.setIsPanelOpen,
      setIsLoading: state.setIsLoading,
      setActiveNote: state.setActiveNote,
      setHoveredNoteId: state.setHoveredNoteId,
      setModalNote: state.setModalNote,
      setIsNoteSelectedFromSearch: state.setIsNoteSelectedFromSearch,
      setIsGlobalView: state.setIsGlobalView,
    }))
  );

  // Auth store
  const { user: authUser, isLoggedIn: authIsLoggedIn } = useAuthStore(
    useShallow((state) => ({
      user: state.user,
      isLoggedIn: state.isLoggedIn,
    }))
  );

  const { isMapsApiLoaded } = useGoogleMaps();

  // TanStack Query for notes data
  const { data: globalNotes = [] } = useGlobalMapNotes();
  const { data: personalNotes = [] } = usePersonalMapNotes(authUser?.uid ?? null);

  // Derived state - current notes based on global/personal view
  const notes = useMemo(() => {
    return isGlobalView ? globalNotes : personalNotes;
  }, [isGlobalView, globalNotes, personalNotes]);

  // Filtered notes based on map bounds - derived from notes and search state
  const [searchFilteredNotes, setSearchFilteredNotes] = useState<Note[] | null>(null);

  // Compute filtered notes - either from search or from map bounds
  const filteredNotes = useMemo(() => {
    // If search filter is active and not selecting a note from search, use it
    if (searchFilteredNotes !== null && !isNoteSelectedFromSearch) {
      return searchFilteredNotes;
    }
    // Otherwise filter by map bounds
    return filterNotesByMapBounds(mapBounds, notes);
  }, [searchFilteredNotes, mapBounds, notes, isNoteSelectedFromSearch]);

  // Refs
  const mapRef = useRef<google.maps.Map | null>(null);
  const noteRefs = useRef<Refs>({});
  const searchBarRef = useRef<HTMLDivElement | null>(null);
  const notesListRef = useRef<HTMLDivElement | null>(null);

  // Infinite scroll for notes panel
  const infinite = useInfiniteNotes<Note>({
    items: filteredNotes,
    pageSize: NOTES_PAGE_SIZE,
  });

  // Scroll to note tile in panel
  const scrollToNoteTile = useCallback((noteId: string) => {
    const noteTile = noteRefs.current[noteId];
    if (noteTile) {
      noteTile.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, []);

  // Location hook
  const { handleSetLocation, triggerMapResize } = useMapLocation({
    mapRef,
    locationFound,
    setMapCenter,
    setMapZoom,
    setLocationFound,
  });

  // Markers hook
  const { handleMapClick } = useMapMarkers({
    mapRef,
    isMapsApiLoaded,
    filteredNotes,
    isPanelOpen,
    setActiveNote,
    setHoveredNoteId,
    setModalNote,
    setIsLoading,
    scrollToNoteTile,
  });

  // Intro tour hook
  useMapIntro({
    searchBarRef,
    notesListRef,
    noteRefs,
  });

  // Resize map when panel opens/closes
  useEffect(() => {
    if (mapRef.current) {
      const timer = setTimeout(() => {
        if (mapRef.current) {
          google.maps.event.trigger(mapRef.current, "resize");
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isPanelOpen]);

  // Setup map click and drag listeners
  useEffect(() => {
    const map = mapRef.current;
    if (map) {
      const mapClickListener = map.addListener("click", () => {
        setActiveNote(null);
      });
      const mapDragListener = map.addListener("dragstart", () => {
        setActiveNote(null);
      });
      return () => {
        google.maps.event.removeListener(mapClickListener);
        google.maps.event.removeListener(mapDragListener);
      };
    }
  }, [setActiveNote]);

  // Set loading to false after initial render
  useEffect(() => {
    setIsLoading(false);
  }, [setIsLoading]);

  // Map load handler
  const onMapLoad = useCallback(
    (map: google.maps.Map) => {
      mapRef.current = map;

      const updateBounds = () => {
        const lat = map.getCenter()?.lat();
        const lng = map.getCenter()?.lng();

        if (typeof lat === "number" && typeof lng === "number") {
          setMapCenter({ lat, lng });
          setMapBounds(map.getBounds() ?? null);
        } else {
          console.warn("Map bounds update skipped: invalid center");
        }
      };

      map.addListener("dragend", updateBounds);
      map.addListener("zoom_changed", updateBounds);

      setTimeout(updateBounds, 100);
    },
    [setMapCenter, setMapBounds]
  );

  // Search handlers
  const handleSearch = useCallback(
    (address: string, lat?: number, lng?: number, isNoteClick?: boolean) => {
      if (isNoteClick) {
        setIsNoteSelectedFromSearch(true);
      } else {
        setIsNoteSelectedFromSearch(false);
        const filtered = filterNotesByQuery(notes, address);
        setSearchFilteredNotes(filtered);
      }

      if (lat !== undefined && lng !== undefined) {
        const newCenter = { lat, lng };
        mapRef.current?.panTo(newCenter);
        mapRef.current?.setZoom(10);
      }
    },
    [notes, setIsNoteSelectedFromSearch]
  );

  const handleNotesSearch = useCallback(
    (searchText: string) => {
      const filtered = filterNotesByTitleAndTags(notes, searchText);
      setSearchFilteredNotes(filtered);
    },
    [notes]
  );

  // Toggle between global and personal view
  const toggleFilter = useCallback(() => {
    const newGlobal = !isGlobalView;
    setIsGlobalView(newGlobal);
    // Clear search filter when toggling view
    setSearchFilteredNotes(null);
  }, [isGlobalView, setIsGlobalView]);

  return (
    <div className="w-screen h-full min-w-[600px] relative overflow-hidden">
      {/* Map Controls - Search, zoom, location buttons */}
      <MapControls
        ref={searchBarRef}
        isPanelOpen={isPanelOpen}
        isGlobalView={isGlobalView}
        isLoggedIn={authIsLoggedIn}
        isLoaded={isMapsApiLoaded}
        mapZoom={mapZoom}
        filteredNotes={filteredNotes}
        onSearch={handleSearch}
        onNotesSearch={handleNotesSearch}
        onToggleView={toggleFilter}
        onZoomIn={() => setMapZoom(Math.min(mapZoom + 1, 21))}
        onZoomOut={() => setMapZoom(Math.max(mapZoom - 1, 1))}
        onLocate={handleSetLocation}
      />

      {/* Map Container */}
      <div
        className="h-full transition-all duration-300 ease-in-out"
        style={{
          width: isPanelOpen ? "calc(100% - 34rem)" : "100%",
        }}
      >
        {isMapsApiLoaded && (
          <GoogleMap
            mapContainerStyle={{ width: "100%", height: "100%" }}
            center={mapCenter}
            zoom={mapZoom}
            onLoad={onMapLoad}
            onDragStart={handleMapClick}
            onClick={handleMapClick}
            options={{
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: false,
              disableDefaultUI: true,
              mapId: process.env.NEXT_PUBLIC_MAP_ID,
            }}
          />
        )}
      </div>

      {/* Notes Panel with toggle button */}
      <MapNotesPanel
        ref={notesListRef}
        isPanelOpen={isPanelOpen}
        isLoading={isLoading}
        visibleItems={infinite.visibleItems}
        hasMore={infinite.hasMore}
        isLoadingMore={infinite.isLoading}
        loaderRef={infinite.loaderRef}
        activeNoteId={activeNote?.id ?? null}
        noteRefs={noteRefs}
        onNoteHover={setHoveredNoteId}
        onNoteClick={setModalNote}
        onTogglePanel={() => setIsPanelOpen(!isPanelOpen)}
      />

      {/* Note Detail Modal */}
      <Dialog
        open={modalNote !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setModalNote(null);
          }
        }}
      >
        {modalNote && <ClickableNote note={modalNote} />}
      </Dialog>
    </div>
  );
};

export default Page;
