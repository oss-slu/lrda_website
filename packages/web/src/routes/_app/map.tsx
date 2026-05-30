import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useRef, useCallback, useDeferredValue } from 'react';
import { GoogleMap } from '@react-google-maps/api';
import { Note } from '@/types';
import { useAuthStore } from '@/stores/authStore';
import { useMapStore } from '@/stores/mapStore';
import { useShallow } from 'zustand/react/shallow';
import ClickableNote from '@/components/click_note_card';
import { MapControls, MapNotesPanel } from '@/components/map';
import { useInfiniteNotes, NOTES_PAGE_SIZE } from '@/hooks/useInfiniteNotes';
import { useGoogleMaps } from '@/utils/GoogleMapsContext';
import { Dialog } from '@/components/ui/dialog';
import { usePersonalMapNotes } from '@/hooks/queries/useNotes';
import { useViewportNotes } from '@/hooks/queries/useViewportNotes';
import { useMapLocation } from '@/hooks/useMapLocation';
import { useMapMarkers } from '@/hooks/useMapMarkers';
import { useMapIntro } from '@/hooks/useMapIntro';
import { MAP_WIDTH_WITH_PANEL } from '@/utils/mapConstants';

export const Route = createFileRoute('/_app/map')({
  ssr: false,
  head: () => ({
    meta: [{ title: "Map | Where's Religion?" }],
  }),
  component: MapPage,
});

interface Refs {
  [key: string]: HTMLElement | undefined;
}

function MapPage() {
  // Map store for UI state
  const {
    mapCenter,
    mapZoom,
    mapBounds,
    locationFound,
    isPanelOpen,
    activeNote,
    modalNoteId,
    isGlobalView,
    setMapCenter,
    setMapZoom,
    setMapBounds,
    setLocationFound,
    setIsPanelOpen,
    setIsLoading,
    setActiveNote,
    setHoveredNoteId,
    setModalNoteId,
    setIsNoteSelectedFromSearch,
    setSearchQuery,
    setIsGlobalView,
  } = useMapStore(
    useShallow(state => ({
      mapCenter: state.mapCenter,
      mapZoom: state.mapZoom,
      mapBounds: state.mapBounds,
      locationFound: state.locationFound,
      isPanelOpen: state.isPanelOpen,
      activeNote: state.activeNote,
      modalNoteId: state.modalNoteId,
      isGlobalView: state.isGlobalView,
      setMapCenter: state.setMapCenter,
      setMapZoom: state.setMapZoom,
      setMapBounds: state.setMapBounds,
      setLocationFound: state.setLocationFound,
      setIsPanelOpen: state.setIsPanelOpen,
      setIsLoading: state.setIsLoading,
      setActiveNote: state.setActiveNote,
      setHoveredNoteId: state.setHoveredNoteId,
      setModalNoteId: state.setModalNoteId,
      setIsNoteSelectedFromSearch: state.setIsNoteSelectedFromSearch,
      setSearchQuery: state.setSearchQuery,
      setIsGlobalView: state.setIsGlobalView,
    })),
  );

  // Auth store
  const { user: authUser, isLoggedIn: authIsLoggedIn } = useAuthStore(
    useShallow(state => ({
      user: state.user,
      isLoggedIn: state.isLoggedIn,
    })),
  );

  const { isMapsApiLoaded } = useGoogleMaps();

  // TanStack Query for notes data
  // Global view: viewport-based fetching with summary mode (debounced, server-side filtering)
  const {
    data: viewportNotes = [],
    allNotes: allViewportNotes = [],
    isPending: isViewportPending,
    isFetching: isViewportFetching,
    isError: isViewportError,
    error: viewportError,
  } = useViewportNotes();

  // Personal view: viewport-based fetching with summary mode (debounced, server-side filtering)
  const {
    data: personalNotes = [],
    isPending: isPersonalPending,
    isFetching: isPersonalFetching,
    isError: isPersonalError,
    error: personalError,
  } = usePersonalMapNotes(authUser?.id ?? null);

  // Derived loading and error states based on current view
  const notesLoading = isGlobalView ? isViewportPending : isPersonalPending;
  const notesFetching = isGlobalView ? isViewportFetching : isPersonalFetching;
  const notesError = isGlobalView ? isViewportError : isPersonalError;
  const notesErrorMessage = isGlobalView ? viewportError?.message : personalError?.message;

  // Viewport-filtered notes for the panel list
  const filteredNotes = isGlobalView ? viewportNotes : personalNotes;
  // All accumulated notes for markers (keeps markers drawn beyond viewport)
  const markerNotes = isGlobalView ? allViewportNotes : personalNotes;

  // Refs
  const mapRef = useRef<google.maps.Map | null>(null);
  const noteRefs = useRef<Refs>({});
  const searchBarRef = useRef<HTMLDivElement | null>(null);
  const notesListRef = useRef<HTMLDivElement | null>(null);

  // Defer panel updates so they don't block map interactions (pan/zoom)
  const deferredFilteredNotes = useDeferredValue(filteredNotes);

  // Infinite scroll for notes panel
  const infinite = useInfiniteNotes<Note>({
    items: deferredFilteredNotes,
    pageSize: NOTES_PAGE_SIZE,
  });

  // Scroll to note tile in panel
  const scrollToNoteTile = useCallback((noteId: string) => {
    const noteTile = noteRefs.current[noteId];
    if (noteTile) {
      noteTile.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, []);

  // Location hook
  const { handleSetLocation } = useMapLocation({
    mapRef,
    locationFound,
    setMapCenter,
    setMapZoom,
    setLocationFound,
  });

  // Markers hook -- uses all accumulated notes so markers persist beyond viewport
  const { handleMapClick } = useMapMarkers({
    mapRef,
    isMapsApiLoaded,
    isMapReady: mapBounds !== null,
    filteredNotes: markerNotes,
    isPanelOpen,
    setActiveNote,
    setHoveredNoteId,
    setIsLoading,
    scrollToNoteTile,
  });

  // Intro tour hook
  useMapIntro({
    searchBarRef,
    notesListRef,
    noteRefs,
  });

  // Reset map-bound state on unmount so markers rebuild cleanly on re-visit
  useEffect(() => {
    return () => {
      setMapBounds(null);
      setIsLoading(true);
    };
  }, [setMapBounds, setIsLoading]);

  // Resize map when panel opens/closes
  useEffect(() => {
    if (mapRef.current) {
      const timer = setTimeout(() => {
        if (mapRef.current) {
          google.maps.event.trigger(mapRef.current, 'resize');
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isPanelOpen]);

  // Map load handler -- uses 'idle' event to batch drag+zoom into a single bounds update
  const onMapLoad = useCallback(
    (map: google.maps.Map) => {
      mapRef.current = map;

      const updateViewport = () => {
        const lat = map.getCenter()?.lat();
        const lng = map.getCenter()?.lng();
        const zoom = map.getZoom();

        if (typeof lat === 'number' && typeof lng === 'number') {
          setMapCenter({ lat, lng });
          setMapBounds(map.getBounds() ?? null);
        }
        if (typeof zoom === 'number') {
          setMapZoom(zoom);
        }
      };

      // 'idle' fires once after all pan/zoom/tile loading completes
      map.addListener('idle', updateViewport);

      // Initial bounds
      setTimeout(updateViewport, 100);
    },
    [setMapCenter, setMapBounds, setMapZoom],
  );

  // Search handlers
  const handleSearch = useCallback(
    (address: string, lat?: number, lng?: number, isNoteClick?: boolean) => {
      if (isNoteClick) {
        setIsNoteSelectedFromSearch(true);
      } else {
        setIsNoteSelectedFromSearch(false);
        // Only update search query for text searches, not coordinate pans
        if (lat === undefined && lng === undefined) {
          setSearchQuery(address);
        } else {
          setSearchQuery('');
        }
      }

      if (lat !== undefined && lng !== undefined) {
        const newCenter = { lat, lng };
        mapRef.current?.panTo(newCenter);
        mapRef.current?.setZoom(10);
      }
    },
    [setIsNoteSelectedFromSearch, setSearchQuery],
  );

  const handleNotesSearch = useCallback(
    (searchText: string) => {
      setIsNoteSelectedFromSearch(false);
      setSearchQuery(searchText);
    },
    [setSearchQuery, setIsNoteSelectedFromSearch],
  );

  // Toggle between global and personal view
  const toggleFilter = useCallback(() => {
    const newGlobal = !isGlobalView;
    setIsGlobalView(newGlobal);
    setSearchQuery('');
  }, [isGlobalView, setIsGlobalView, setSearchQuery]);

  return (
    <div className='relative h-full w-screen overflow-hidden'>
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
        onZoomIn={() => {
          const currentZoom = mapRef.current?.getZoom() ?? mapZoom;
          mapRef.current?.setZoom(Math.min(currentZoom + 1, 21));
        }}
        onZoomOut={() => {
          const currentZoom = mapRef.current?.getZoom() ?? mapZoom;
          mapRef.current?.setZoom(Math.max(currentZoom - 1, 1));
        }}
        onLocate={handleSetLocation}
      />

      {/* Map Container - full width on mobile (panel overlays), adjusted on desktop */}
      <div
        className='h-full w-full md:transition-all md:duration-300 md:ease-in-out'
        style={{
          width: isPanelOpen ? MAP_WIDTH_WITH_PANEL : '100%',
        }}
      >
        {isMapsApiLoaded && (
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
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
              mapId: import.meta.env.VITE_MAP_ID,
            }}
          />
        )}
      </div>

      {/* Notes Panel with toggle button */}
      <MapNotesPanel
        ref={notesListRef}
        isPanelOpen={isPanelOpen}
        isLoading={notesLoading || (notesFetching && deferredFilteredNotes.length === 0)}
        isError={notesError}
        errorMessage={notesErrorMessage}
        visibleItems={infinite.visibleItems}
        hasMore={infinite.hasMore}
        isLoadingMore={infinite.isLoading}
        loaderRef={infinite.loaderRef}
        activeNoteId={activeNote?.id ?? null}
        noteRefs={noteRefs}
        onNoteHover={setHoveredNoteId}
        onNoteClick={setModalNoteId}
        onTogglePanel={() => setIsPanelOpen(!isPanelOpen)}
      />

      {/* Note Detail Modal */}
      <Dialog
        open={modalNoteId !== null}
        onOpenChange={isOpen => {
          if (!isOpen) {
            setModalNoteId(null);
          }
        }}
      >
        {modalNoteId && <ClickableNote noteId={modalNoteId} />}
      </Dialog>
    </div>
  );
}
