import { useQuery } from '@tanstack/react-query';
import { fetchUserById, fetchCreatorName } from '../../services';
import { UserData } from '@/app/types';

// Query key factory for users
export const userKeys = {
  all: ['users'] as const,
  detail: (id: string) => [...userKeys.all, id] as const,
};

/**
 * Hook for fetching user data by ID
 */
export function useUserData(userId: string | null) {
  return useQuery({
    queryKey: userKeys.detail(userId ?? ''),
    queryFn: async (): Promise<UserData | null> => {
      if (!userId) return null;
      return await fetchUserById(userId);
    },
    enabled: !!userId,
  });
}

/**
 * Hook for fetching creator name by ID.
 * Uses TanStack Query's built-in caching and deduplication to avoid N+1 requests.
 * Multiple components requesting the same creator ID will share the cached result.
 */
export function useCreatorName(creatorId: string | null) {
  return useQuery({
    queryKey: [...userKeys.detail(creatorId ?? ''), 'name'],
    queryFn: async (): Promise<string> => {
      if (!creatorId) return 'Unknown';
      return await fetchCreatorName(creatorId);
    },
    enabled: !!creatorId,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
  });
}
