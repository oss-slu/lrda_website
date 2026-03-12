import { createStart, createMiddleware } from '@tanstack/react-start'
import { setResponseHeader } from '@tanstack/react-start/server'

/**
 * Cache policies for SSR responses.
 *
 * - Public pages get CDN-level caching via s-maxage (Cloudflare respects this).
 * - Authenticated/dynamic pages get no-store to prevent leaking user data.
 * - stale-while-revalidate lets Cloudflare serve stale content while
 *   revalidating in the background, so users rarely see a cold-cache miss.
 */
const CACHE_POLICIES: Record<string, string> = {
  // Static content -- cache for 24 hours
  '/resources': 'public, s-maxage=86400, stale-while-revalidate=86400',
  '/wheres-religion': 'public, s-maxage=86400, stale-while-revalidate=86400',

  // Landing page -- cache for 1 hour
  '/': 'public, s-maxage=3600, stale-while-revalidate=86400',

  // Stories listing -- cache for 5 minutes (content changes more often)
  '/stories': 'public, s-maxage=300, stale-while-revalidate=86400',

  // Auth forms -- cache for 1 hour (static HTML forms, no user data)
  '/login': 'public, s-maxage=3600, stale-while-revalidate=86400',
  '/signup': 'public, s-maxage=3600, stale-while-revalidate=86400',
  '/forgot-password': 'public, s-maxage=3600, stale-while-revalidate=86400',
  '/reset-password': 'public, s-maxage=3600, stale-while-revalidate=86400',
}

/** Paths (prefixes) that must never be cached by CDN. */
const NO_STORE_PREFIXES = ['/notes', '/map', '/admin', '/instructor-dashboard']

const cacheHeadersMiddleware = createMiddleware().server(
  async ({ next, request }) => {
    const url = new URL(request.url)
    const path = url.pathname

    const exactPolicy = CACHE_POLICIES[path]
    if (exactPolicy) {
      setResponseHeader('Cache-Control', exactPolicy)
    } else if (NO_STORE_PREFIXES.some((prefix) => path.startsWith(prefix))) {
      setResponseHeader('Cache-Control', 'private, no-store')
    }

    return next()
  },
)

export default createStart(() => ({
  requestMiddleware: [cacheHeadersMiddleware],
}))
