import { useMemo } from 'react';
import { useQuery, useInfiniteQuery, keepPreviousData } from '@tanstack/react-query';
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

/**
 * Hook for fetching personal notes for a user
 */
export function usePersonalNotes(userId: string | null, limit = 150, skip = 0) {
  return useQuery({
    queryKey: notesKeys.personal(userId ?? ''),
    queryFn: async (): Promise<Note[]> => {
      if (!userId) return [];
      return notesService.fetchUserNotes(userId, limit, skip);
    },
    enabled: !!userId,
  });
}

const PERSONAL_MAP_DEBOUNCE_MS = 400;
const PERSONAL_MAP_STALE_TIME = 60_000;

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

  const isSearchMode = debouncedSearch.length > 0;

  return useQuery({
    queryKey:
      isSearchMode
        ? [...notesKeys.personalMap(userId ?? ''), 'search', debouncedSearch]
        : [...notesKeys.personalMap(userId ?? ''), debouncedBounds],
    queryFn: async (): Promise<Note[]> => {
      if (!userId) return [];
      if (isSearchMode) {
        return notesService.fetchViewport({ creatorId: userId, search: debouncedSearch });
      }
      if (!debouncedBounds) {
        return notesService.fetchViewport({ creatorId: userId });
      }
      return notesService.fetchViewport({ creatorId: userId, ...debouncedBounds });
    },
    enabled: !!userId,
    placeholderData: keepPreviousData,
    staleTime: PERSONAL_MAP_STALE_TIME,
  });
}

/**
 * Hook for instructors to fetch their students' notes with polling
 * Used in review mode for the sidebar
 */
export function useStudentNotes(instructorId: string | null, isInstructor: boolean) {
  return useQuery({
    queryKey: notesKeys.pendingReview(instructorId ?? ''),
    queryFn: async (): Promise<Note[]> => {
      if (!instructorId) return [];

      // Uses the dedicated backend endpoint that fetches all student notes in one DB query
      const allNotes = await notesService.fetchByStudents(instructorId);
      return allNotes.reverse();
    },
    enabled: !!instructorId && isInstructor,
    refetchInterval: 15000,
    refetchIntervalInBackground: false,
  });
}

/**
 * Hook for fetching a single note's full details (text, all media, audio).
 * Used by the modal when a user clicks a note card.
 */
export function useNoteDetail(noteId: string | null) {
  return useQuery({
    queryKey: notesKeys.detail(noteId ?? ''),
    queryFn: () => notesService.fetchById(noteId!),
    enabled: !!noteId,
    staleTime: 60_000,
  });
}

/**
 * Hook for infinite scroll of published notes (for StoriesPage)
 */
export function useInfinitePublishedNotes(
  pageSize = 20,
  options?: {
    search?: string;
    creatorId?: string;
    sort?: 'newest' | 'oldest' | 'alphabetical';
  },
) {
  return useInfiniteQuery({
    queryKey: [
      notesKeys.publishedPaginated(pageSize),
      options?.search ?? '',
      options?.creatorId ?? '',
      options?.sort ?? 'newest',
    ],
    queryFn: async ({
      pageParam = 0,
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
