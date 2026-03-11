'use client';

import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query';
import { useState } from 'react';
import dynamic from 'next/dynamic';

const ReactQueryDevtools = dynamic(
  () => import('@tanstack/react-query-devtools').then(mod => mod.ReactQueryDevtools),
  { ssr: false },
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
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
