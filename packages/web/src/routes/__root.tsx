/// <reference types="vite/client" />
import { HeadContent, Scripts, createRootRouteWithContext } from '@tanstack/react-router';
import type { QueryClient } from '@tanstack/react-query';
import * as React from 'react';

import globalsCss from '@/globals.css?url';

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
        content:
          'Document and map lived religion research with rich text, media, and geolocation.',
      },
      { name: 'robots', content: 'index,follow,max-image-preview:large' },
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: "Where's Religion?" },
      {
        property: 'og:title',
        content: "Where's Religion?",
      },
      {
        property: 'og:description',
        content:
          'Document and map lived religion research with rich text, media, and geolocation.',
      },
      { property: 'og:url', content: 'https://wheresreligion.org' },
      { property: 'og:image', content: 'https://wheresreligion.org/og-image.png' },
      { property: 'og:image:alt', content: "Where's Religion? landing page" },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { property: 'og:locale', content: 'en_US' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:image', content: 'https://wheresreligion.org/og-image.png' },
      { name: 'theme-color', content: '#ffffff' },
    ],
    links: [
      { rel: 'stylesheet', href: globalsCss },
      { rel: 'icon', href: '/favicon.ico' },
    ],
    scripts: [
      {
        type: 'application/ld+json',
        children: JSON.stringify({
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'Organization',
              name: "Where's Religion?",
              url: 'https://wheresreligion.org',
              logo: 'https://wheresreligion.org/LivedReligion.png',
            },
            {
              '@type': 'WebApplication',
              name: "Where's Religion?",
              url: 'https://wheresreligion.org',
              applicationCategory: 'EducationalApplication',
              applicationSubCategory: 'Research Tool',
              description:
                'Document and map lived religion research with rich text, media, and geolocation.',
              operatingSystem: 'Any',
              browserRequirements: 'Requires a modern web browser',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD',
                description: 'Free to use',
              },
            },
          ],
        }),
      },
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
      <body className='min-h-screen bg-white'>
        <AuthProvider>
          <GoogleMapsProvider>
            <TrackingWrapper>{children}</TrackingWrapper>
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

