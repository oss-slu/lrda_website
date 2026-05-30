import { useMemo, useRef, useCallback } from 'react';
import { useQuery, queryOptions, keepPreviousData } from '@tanstack/react-query';
import { notesService } from '../../services';
import { useMapStore } from '../../stores/mapStore';
import { useShallow } from 'zustand/react/shallow';
import { useDebounce } from '../useDebounce';
import { boundsToParams, snapBounds } from '../../utils/mapUtils';
import { notesKeys } from './useNotes';
import type { Note } from '@/types';

const DEBOUNCE_MS = 400;
const STALE_TIME = 60_000;

type SnappedBounds = ReturnType<typeof snapBounds> | null;

/**
 * Query options for published notes within a map viewport.
 * Takes already-resolved (debounced, snapped) search/bounds so it stays
 * usable outside React.
 */
export function viewportNotesOptions(params: { search?: string; bounds?: SnappedBounds }) {
  const { search, bounds } = params;
  const isSearchMode = !!search && search.length > 0;

  return queryOptions({
    queryKey:
      isSearchMode ?
        [...notesKeys.all, 'viewport', 'search', search]
      : [...notesKeys.all, 'viewport', bounds],
    queryFn: (): Promise<Note[]> => {
      if (isSearchMode) {
        return notesService.fetchViewport({ search });
      }
      if (!bounds) {
        return notesService.fetchViewport({});
      }
      return notesService.fetchViewport(bounds);
    },
    staleTime: STALE_TIME,
  });
}

/**
 * Accumulates notes across viewport fetches so panning back to a
 * previously visited area shows notes instantly from the local cache.
 *
 * - Each fetch adds new notes to an in-memory Map (deduped by ID).
 * - The returned array is filtered to the current viewport bounds.
 * - Snap-grid on bounds reduces how often we hit the server.
 * - Search mode bypasses accumulation (separate result set).
 */
export function useViewportNotes() {
  const { mapBounds, searchQuery } = useMapStore(
    useShallow(state => ({
      mapBounds: state.mapBounds,
      searchQuery: state.searchQuery,
    })),
  );

  const rawBounds = useMemo(() => boundsToParams(mapBounds), [mapBounds]);

  // Snap bounds for the query key so small pans hit the cache
  const snappedBounds = useMemo(() => (rawBounds ? snapBounds(rawBounds) : null), [rawBounds]);
  const debouncedBounds = useDebounce(snappedBounds, DEBOUNCE_MS);
  const debouncedSearch = useDebounce(searchQuery, DEBOUNCE_MS);

  const isSearchMode = debouncedSearch.length > 0;

  // Accumulated notes across all viewport fetches
  const accumulatedRef = useRef(new Map<string, Note>());

  const mergeNotes = useCallback((notes: Note[]) => {
    for (const note of notes) {
      accumulatedRef.current.set(note.id, note);
    }
  }, []);

  const query = useQuery({
    ...viewportNotesOptions({ search: debouncedSearch, bounds: debouncedBounds }),
    placeholderData: keepPreviousData,
  });

  // Merge fetched notes into the accumulated set
  if (query.data && !isSearchMode) {
    mergeNotes(query.data);
  }

  // Filter accumulated notes to current viewport
  const data = useMemo(() => {
    if (isSearchMode) return query.data ?? [];

    const bounds = rawBounds;
    if (!bounds) return Array.from(accumulatedRef.current.values());

    const visible: Note[] = [];
    for (const note of accumulatedRef.current.values()) {
      if (
        note.latitude != null &&
        note.longitude != null &&
        note.latitude >= bounds.minLat &&
        note.latitude <= bounds.maxLat &&
        note.longitude >= bounds.minLng &&
        note.longitude <= bounds.maxLng
      ) {
        visible.push(note);
      }
    }
    return visible;
  }, [rawBounds, query.data, isSearchMode]);

  // All accumulated notes (for markers -- keeps markers drawn beyond viewport)
  const allNotes = useMemo(() => {
    if (isSearchMode) return query.data ?? [];
    return Array.from(accumulatedRef.current.values());
  }, [query.data, isSearchMode]);

  return {
    ...query,
    /** Notes filtered to current viewport (for the panel list) */
    data,
    /** All accumulated notes across all fetches (for markers) */
    allNotes,
  };
}
