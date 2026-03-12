import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { notesService } from '../../services';
import { Note } from '@/app/types';

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

/**
 * Fetch all pages of a paginated endpoint until exhausted.
 */
async function fetchAllPages(
  fetcher: (limit: number, offset: number) => Promise<Note[]>,
  pageSize = 200,
): Promise<Note[]> {
  const all: Note[] = [];
  let offset = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const page = await fetcher(pageSize, offset);
    all.push(...page);
    if (page.length < pageSize) break;
    offset += pageSize;
  }
  return all;
}

/**
 * Hook for fetching personal notes for Map page (non-archived, reversed)
 */
export function usePersonalMapNotes(userId: string | null) {
  return useQuery({
    queryKey: notesKeys.personalMap(userId ?? ''),
    queryFn: async (): Promise<Note[]> => {
      if (!userId) return [];
      const data = await fetchAllPages((limit, offset) =>
        notesService.fetchUserNotes(userId, limit, offset),
      );
      return data.reverse();
    },
    enabled: !!userId,
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
