import { useMemo } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { notesService } from '../../services';
import { useMapStore } from '../../stores/mapStore';
import { useShallow } from 'zustand/react/shallow';
import { useDebounce } from '../useDebounce';
import { boundsToParams } from '../../utils/mapUtils';
import { notesKeys } from './useNotes';

const DEBOUNCE_MS = 400;
const STALE_TIME = 60_000;

/**
 * Hook for fetching notes within the current map viewport in summary mode.
 * - Fetches globally on initial load (before map bounds are available).
 * - Debounces bounds changes by 400ms to avoid spamming the API during pan/zoom.
 * - Uses keepPreviousData so markers/panel never flash empty.
 * - When searchQuery is set, fetches globally (no bounds) for full-dataset search.
 * - Caches per-viewport with 60s staleTime.
 */
export function useViewportNotes() {
  const { mapBounds, searchQuery } = useMapStore(
    useShallow(state => ({
      mapBounds: state.mapBounds,
      searchQuery: state.searchQuery,
    })),
  );

  // Memoize to avoid resetting the debounce timer on unrelated re-renders
  const boundsParams = useMemo(() => boundsToParams(mapBounds), [mapBounds]);
  const debouncedBounds = useDebounce(boundsParams, DEBOUNCE_MS);
  const debouncedSearch = useDebounce(searchQuery, DEBOUNCE_MS);

  const isSearchMode = debouncedSearch.length > 0;

  return useQuery({
    queryKey: isSearchMode
      ? [...notesKeys.all, 'viewport', 'search', debouncedSearch]
      : [...notesKeys.all, 'viewport', debouncedBounds],
    queryFn: async () => {
      if (isSearchMode) {
        return notesService.fetchViewport({ search: debouncedSearch });
      }
      // Before map bounds are available, fetch without spatial filter
      if (!debouncedBounds) {
        return notesService.fetchViewport({});
      }
      return notesService.fetchViewport(debouncedBounds);
    },
    placeholderData: keepPreviousData,
    staleTime: STALE_TIME,
  });
}
