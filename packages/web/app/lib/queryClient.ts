import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';

/**
 * Creates a configured QueryClient.
 *
 * Called once per request on the server (via `getRouter()`) so cached data is
 * never shared across users, and once on the browser for a stable client.
 */
export function makeQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        console.error('[QueryCache] Query error:', {
          queryKey: query.queryKey,
          error: error instanceof Error ? error.message : error,
          stack: error instanceof Error ? error.stack : undefined,
        });
      },
    }),
    mutationCache: new MutationCache({
      onError: (error, variables, _context, mutation) => {
        console.error('[MutationCache] Mutation error:', {
          mutationKey: mutation.options.mutationKey,
          error: error instanceof Error ? error.message : error,
          stack: error instanceof Error ? error.stack : undefined,
          variables,
        });
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes -- also prevents an immediate refetch of SSR-hydrated data
        gcTime: 30 * 60 * 1000, // 30 minutes
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });
}
