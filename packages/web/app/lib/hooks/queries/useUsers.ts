import { useQuery } from '@tanstack/react-query';
import { fetchCreatorName } from '../../services';

/**
 * Hook for fetching creator name by ID.
 * Uses TanStack Query's built-in caching and deduplication to avoid N+1 requests.
 * Multiple components requesting the same creator ID will share the cached result.
 */
export function useCreatorName(creatorId: string | null) {
  return useQuery({
    queryKey: ['users', creatorId ?? '', 'name'],
    queryFn: async (): Promise<string> => {
      if (!creatorId) return 'Unknown';
      return await fetchCreatorName(creatorId);
    },
    enabled: !!creatorId,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
  });
}
