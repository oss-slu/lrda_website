import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query';
import { useState, lazy, Suspense } from 'react';

const ReactQueryDevtools = lazy(() =>
  import('@tanstack/react-query-devtools').then(mod => ({ default: mod.ReactQueryDevtools })),
);

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
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
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 30 * 60 * 1000, // 30 minutes
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {import.meta.env.DEV && (
        <Suspense fallback={null}>
          <ReactQueryDevtools initialIsOpen={false} />
        </Suspense>
      )}
    </QueryClientProvider>
  );
}
