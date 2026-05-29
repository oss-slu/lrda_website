import { useQuery, queryOptions } from '@tanstack/react-query';
import { fetchCreatorName } from '../../services';

export const usersKeys = {
  all: ['users'] as const,
  name: (userId: string) => [...usersKeys.all, userId, 'name'] as const,
};

/**
 * Query options for a creator's display name by ID.
 * TanStack Query dedupes concurrent requests for the same ID.
 */
export function creatorNameOptions(creatorId: string) {
  return queryOptions({
    queryKey: usersKeys.name(creatorId),
    queryFn: (): Promise<string> => fetchCreatorName(creatorId),
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
  });
}

/**
 * Hook for fetching creator name by ID.
 * Uses TanStack Query's built-in caching and deduplication to avoid N+1 requests.
 * Multiple components requesting the same creator ID will share the cached result.
 */
export function useCreatorName(creatorId: string | null) {
  return useQuery({
    ...creatorNameOptions(creatorId ?? ''),
    enabled: !!creatorId,
  });
}
