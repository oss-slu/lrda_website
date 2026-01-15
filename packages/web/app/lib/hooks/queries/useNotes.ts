import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { notesService, usersService } from '../../services';
import { Note } from '@/app/types';
import DataConversion from '../../utils/data_conversion';

// Query key factory for notes
export const notesKeys = {
  all: ['notes'] as const,
  published: () => [...notesKeys.all, 'published'] as const,
  publishedPaginated: (limit: number) => [...notesKeys.published(), 'paginated', limit] as const,
  personal: (userId: string) => [...notesKeys.all, 'personal', userId] as const,
  globalMap: () => [...notesKeys.all, 'globalMap'] as const,
  personalMap: (userId: string) => [...notesKeys.all, 'personalMap', userId] as const,
  detail: (id: string) => [...notesKeys.all, 'detail', id] as const,
  pendingReview: (instructorId: string) =>
    [...notesKeys.all, 'pendingReview', instructorId] as const,
  pendingFeedback: (userId: string) => [...notesKeys.all, 'pendingFeedback', userId] as const,
};

/**
 * Hook for fetching published notes (for StoriesPage)
 */
export function usePublishedNotes(limit = 150, skip = 0) {
  return useQuery({
    queryKey: notesKeys.published(),
    queryFn: async (): Promise<Note[]> => {
      const data = await notesService.fetchPublished(limit, skip);
      // Convert media types for all notes
      return DataConversion.convertMediaTypes(data);
    },
  });
}

/**
 * Hook for fetching personal notes for a user
 */
export function usePersonalNotes(userId: string | null, limit = 150, skip = 0) {
  return useQuery({
    queryKey: notesKeys.personal(userId ?? ''),
    queryFn: async (): Promise<Note[]> => {
      if (!userId) return [];
      const data = await notesService.fetchUserNotes(userId, limit, skip);
      return DataConversion.convertMediaTypes(data);
    },
    enabled: !!userId,
  });
}

/**
 * Hook for fetching global notes for Map page (published, non-archived, reversed)
 */
export function useGlobalMapNotes() {
  return useQuery({
    queryKey: notesKeys.globalMap(),
    queryFn: async (): Promise<Note[]> => {
      const data = await notesService.fetchPublished();
      return DataConversion.convertMediaTypes(data)
        .reverse()
        .filter(note => note.published === true && note.isArchived !== true);
    },
  });
}

/**
 * Hook for fetching personal notes for Map page (non-archived, reversed)
 */
export function usePersonalMapNotes(userId: string | null) {
  return useQuery({
    queryKey: notesKeys.personalMap(userId ?? ''),
    queryFn: async (): Promise<Note[]> => {
      if (!userId) return [];
      const data = await notesService.fetchUserNotes(userId);
      return DataConversion.convertMediaTypes(data)
        .reverse()
        .filter(note => note.isArchived !== true);
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

      // Fetch instructor data to get student list
      const instructorData = await usersService.fetchById(instructorId);
      if (!instructorData || !instructorData.isInstructor) {
        return [];
      }

      const studentUids = instructorData.students || [];
      if (studentUids.length === 0) {
        return [];
      }

      // Fetch all notes from students
      const allNotes = await notesService.fetchByStudents(studentUids);
      const converted = DataConversion.convertMediaTypes(allNotes).reverse();
      return converted.filter(n => !n.isArchived);
    },
    enabled: !!instructorId && isInstructor,
    refetchInterval: 15000, // Poll every 15 seconds
    refetchIntervalInBackground: false, // Pause when tab is hidden
  });
}

/**
 * Hook for infinite scroll of published notes (for StoriesPage)
 */
export function useInfinitePublishedNotes(pageSize = 50) {
  return useInfiniteQuery({
    queryKey: notesKeys.publishedPaginated(pageSize),
    queryFn: async ({
      pageParam = 0,
    }): Promise<{
      data: Note[];
      nextCursor: number | undefined;
    }> => {
      const data = await notesService.fetchPublished(pageSize, pageParam);
      const notes = DataConversion.convertMediaTypes(data);
      return {
        data: notes,
        nextCursor: data.length === pageSize ? pageParam + pageSize : undefined,
      };
    },
    getNextPageParam: lastPage => lastPage.nextCursor,
    initialPageParam: 0,
  });
}
