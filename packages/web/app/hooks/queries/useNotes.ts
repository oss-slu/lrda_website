import { useMemo } from 'react';
import {
  useQuery,
  useInfiniteQuery,
  queryOptions,
  infiniteQueryOptions,
  keepPreviousData,
} from '@tanstack/react-query';
import { notesService } from '../../services';
import { Note } from '@/app/types';
import { useMapStore } from '../../stores/mapStore';
import { useShallow } from 'zustand/react/shallow';
import { useDebounce } from '../useDebounce';
import { boundsToParams } from '../../utils/mapUtils';

// Query key factory for notes
export const notesKeys = {
  all: ['notes'] as const,
  published: () => [...notesKeys.all, 'published'] as const,
  publishedPaginated: (limit: number) => [...notesKeys.published(), 'paginated', limit] as const,
  personal: (userId: string) => [...notesKeys.all, 'personal', userId] as const,
  personalMap: (userId: string) => [...notesKeys.all, 'personalMap', userId] as const,
  detail: (id: string) => [...notesKeys.all, 'detail', id] as const,
  pendingReview: (instructorId: string) =>
    [...notesKeys.all, 'pendingReview', instructorId] as const,
  pendingFeedback: (userId: string) => [...notesKeys.all, 'pendingFeedback', userId] as const,
};

type BoundsParams = ReturnType<typeof boundsToParams>;

/**
 * Query options for a user's personal notes.
 * Single source of truth for key + fetch, reusable in loaders.
 */
export function personalNotesOptions(userId: string, limit = 150, skip = 0) {
  return queryOptions({
    queryKey: notesKeys.personal(userId),
    queryFn: (): Promise<Note[]> => notesService.fetchUserNotes(userId, limit, skip),
  });
}

/**
 * Hook for fetching personal notes for a user
 */
export function usePersonalNotes(userId: string | null, limit = 150, skip = 0) {
  return useQuery({
    ...personalNotesOptions(userId ?? '', limit, skip),
    enabled: !!userId,
  });
}

const PERSONAL_MAP_DEBOUNCE_MS = 400;
const PERSONAL_MAP_STALE_TIME = 60_000;

/**
 * Query options for a user's personal notes scoped to a map viewport.
 * Takes already-resolved (debounced) search/bounds so it stays usable
 * outside React.
 */
export function personalMapNotesOptions(params: {
  userId: string;
  search?: string;
  bounds?: BoundsParams;
}) {
  const { userId, search, bounds } = params;
  const isSearchMode = !!search && search.length > 0;

  return queryOptions({
    queryKey:
      isSearchMode ?
        [...notesKeys.personalMap(userId), 'search', search]
      : [...notesKeys.personalMap(userId), bounds],
    queryFn: (): Promise<Note[]> => {
      if (isSearchMode) {
        return notesService.fetchViewport({ creatorId: userId, search });
      }
      if (!bounds) {
        return notesService.fetchViewport({ creatorId: userId });
      }
      return notesService.fetchViewport({ creatorId: userId, ...bounds });
    },
    staleTime: PERSONAL_MAP_STALE_TIME,
  });
}

/**
 * Hook for fetching personal notes for Map page using viewport-based
 * server-side filtering with summary mode.
 * Mirrors useViewportNotes but scoped to the authenticated user's notes.
 */
export function usePersonalMapNotes(userId: string | null) {
  const { mapBounds, searchQuery } = useMapStore(
    useShallow(state => ({
      mapBounds: state.mapBounds,
      searchQuery: state.searchQuery,
    })),
  );

  const boundsParams = useMemo(() => boundsToParams(mapBounds), [mapBounds]);
  const debouncedBounds = useDebounce(boundsParams, PERSONAL_MAP_DEBOUNCE_MS);
  const debouncedSearch = useDebounce(searchQuery, PERSONAL_MAP_DEBOUNCE_MS);

  return useQuery({
    ...personalMapNotesOptions({
      userId: userId ?? '',
      search: debouncedSearch,
      bounds: debouncedBounds,
    }),
    enabled: !!userId,
    placeholderData: keepPreviousData,
  });
}

/**
 * Query options for an instructor's students' notes (most recent first).
 */
export function studentNotesOptions(instructorId: string) {
  return queryOptions({
    queryKey: notesKeys.pendingReview(instructorId),
    queryFn: async (): Promise<Note[]> => {
      // Uses the dedicated backend endpoint that fetches all student notes in one DB query
      const allNotes = await notesService.fetchByStudents(instructorId);
      return allNotes.reverse();
    },
  });
}

/**
 * Hook for instructors to fetch their students' notes with polling
 * Used in review mode for the sidebar
 */
export function useStudentNotes(instructorId: string | null, isInstructor: boolean) {
  return useQuery({
    ...studentNotesOptions(instructorId ?? ''),
    enabled: !!instructorId && isInstructor,
    refetchInterval: 15000,
    refetchIntervalInBackground: false,
  });
}

/**
 * Query options for a single note's full details (text, all media, audio).
 */
export function noteDetailOptions(noteId: string) {
  return queryOptions({
    queryKey: notesKeys.detail(noteId),
    queryFn: () => notesService.fetchById(noteId),
    staleTime: 60_000,
  });
}

/**
 * Hook for fetching a single note's full details (text, all media, audio).
 * Used by the modal when a user clicks a note card.
 */
export function useNoteDetail(noteId: string | null) {
  return useQuery({
    ...noteDetailOptions(noteId ?? ''),
    enabled: !!noteId,
  });
}

type PublishedSort = 'newest' | 'oldest' | 'alphabetical';
interface PublishedNotesOptions {
  search?: string;
  creatorId?: string;
  sort?: PublishedSort;
}

/**
 * Infinite query options for published notes (StoriesPage).
 */
export function publishedNotesInfiniteOptions(pageSize = 20, options?: PublishedNotesOptions) {
  return infiniteQueryOptions({
    queryKey: [
      notesKeys.publishedPaginated(pageSize),
      options?.search ?? '',
      options?.creatorId ?? '',
      options?.sort ?? 'newest',
    ],
    queryFn: async ({
      pageParam,
    }): Promise<{
      data: Note[];
      nextCursor: number | undefined;
    }> => {
      const notes = await notesService.fetchPublished(pageSize, pageParam, {
        search: options?.search,
        creatorId: options?.creatorId,
        sort: options?.sort,
      });
      return {
        data: notes,
        nextCursor: notes.length === pageSize ? pageParam + pageSize : undefined,
      };
    },
    getNextPageParam: lastPage => lastPage.nextCursor,
    initialPageParam: 0,
  });
}

/**
 * Hook for infinite scroll of published notes (for StoriesPage)
 */
export function useInfinitePublishedNotes(pageSize = 20, options?: PublishedNotesOptions) {
  return useInfiniteQuery(publishedNotesInfiniteOptions(pageSize, options));
}
