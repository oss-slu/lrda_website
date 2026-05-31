import { useQuery, queryOptions } from '@tanstack/react-query';
import { fetchCreatorName } from '@/services/users.service';

export function creatorNameOptions(creatorId: string) {
  return queryOptions({
    queryKey: ['users', creatorId, 'name'],
    queryFn: (): Promise<string> => fetchCreatorName(creatorId),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

export function useCreatorName(creatorId: string | null) {
  return useQuery({
    ...creatorNameOptions(creatorId ?? ''),
    enabled: !!creatorId,
  });
}
