/// <reference types="vite/client" />
import { HeadContent, Scripts, createRootRouteWithContext } from '@tanstack/react-router';
import type { QueryClient } from '@tanstack/react-query';
import * as React from 'react';

import globalsCss from '@/globals.css?url';

import Navbar from '@/components/navbar';
import { Toaster } from '@/components/ui/sonner';
import { GoogleMapsProvider } from '@/utils/GoogleMapsContext';
import { AuthProvider } from '@/components/AuthProvider';
import NotFound from '@/components/NotFound';
import RootError from '@/components/RootError';
import { usePageView } from '@/hooks/usePageView';

const TanStackRouterDevtools =
  import.meta.env.PROD ?
    () => null
  : React.lazy(() =>
      import('@tanstack/react-router-devtools').then(res => ({
        default: res.TanStackRouterDevtools,
      })),
    );

const ReactQueryDevtools =
  import.meta.env.PROD ?
    () => null
  : React.lazy(() =>
      import('@tanstack/react-query-devtools').then(res => ({
        default: res.ReactQueryDevtools,
      })),
    );

export interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: "Where's Religion?" },
      {
        name: 'description',
        content: 'Document and map lived religion research with rich text, media, and geolocation.',
      },
    ],
    links: [
      { rel: 'stylesheet', href: globalsCss },
      { rel: 'icon', href: '/favicon.ico' },
    ],
  }),
  shellComponent: RootDocument,
  notFoundComponent: NotFound,
  errorComponent: RootError,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en'>
      <head>
        <HeadContent />
      </head>
      <body className='flex h-screen flex-col'>
        <AuthProvider>
          <GoogleMapsProvider>
            <Navbar />
            <TrackingWrapper>
              <main className='flex-grow overflow-y-auto scroll-smooth'>{children}</main>
            </TrackingWrapper>
            <Toaster />
          </GoogleMapsProvider>
        </AuthProvider>
        <React.Suspense fallback={null}>
          <TanStackRouterDevtools position='bottom-right' />
          <ReactQueryDevtools initialIsOpen={false} />
        </React.Suspense>
        <Scripts />
      </body>
    </html>
  );
}

function TrackingWrapper({ children }: { children: React.ReactNode }) {
  usePageView();
  return <>{children}</>;
}
