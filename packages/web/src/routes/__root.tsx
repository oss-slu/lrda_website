/// <reference types="vite/client" />
import {
  HeadContent,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router'
import * as React from 'react'

import globalsCss from '@/app/globals.css?url'
import introjsCustomCss from '@/app/introjs-custom.css?url'
import introjsCss from 'intro.js/introjs.css?url'

import Navbar from '@/app/lib/components/navbar'
import { Toaster } from '@/components/ui/sonner'
import { GoogleMapsProvider } from '@/app/lib/utils/GoogleMapsContext'
import QueryProvider from '@/app/lib/components/QueryProvider'
import { AuthProvider } from '@/app/lib/components/AuthProvider'

const TanStackRouterDevtools = import.meta.env.PROD
  ? () => null
  : React.lazy(() =>
      import('@tanstack/react-router-devtools').then((res) => ({
        default: res.TanStackRouterDevtools,
      })),
    )

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    ],
    links: [
      { rel: 'stylesheet', href: globalsCss },
      { rel: 'stylesheet', href: introjsCustomCss },
      { rel: 'stylesheet', href: introjsCss },
      { rel: 'icon', href: '/favicon.ico' },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="flex h-screen flex-col">
        <QueryProvider>
          <AuthProvider>
            <GoogleMapsProvider>
              <Navbar />
              <div className="flex-grow overflow-y-auto scroll-smooth">
                {children}
              </div>
              <Toaster />
            </GoogleMapsProvider>
          </AuthProvider>
        </QueryProvider>
        <React.Suspense fallback={null}>
          <TanStackRouterDevtools position="bottom-right" />
        </React.Suspense>
        <Scripts />
      </body>
    </html>
  )
}
