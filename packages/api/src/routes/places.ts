import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import type { AppEnv } from '../types';
import { getEnv } from './helpers';
import { reverseGeocode } from '../lib/geocode';

// The Google Maps key never ships to the browser; these routes proxy the
// Places/Geocoding web services so the key can be locked to this server's IP.
// Per-IP rate limits bound the bill if someone scripts against the endpoints.

const rateWindows = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  if (rateWindows.size > 10_000) {
    for (const [k, w] of rateWindows) {
      if (now >= w.resetAt) rateWindows.delete(k);
    }
  }
  const w = rateWindows.get(key);
  if (!w || now >= w.resetAt) {
    rateWindows.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  w.count += 1;
  return w.count > limit;
}

function clientIp(headers: Headers): string {
  return (
    headers.get('cf-connecting-ip') ||
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  );
}

// Reverse-geocode results are stable per coordinate; cache to avoid paying
// for the same lookup across users. Insertion-order eviction keeps it bounded.
const geocodeCache = new Map<string, string | null>();
const GEOCODE_CACHE_MAX = 5000;

const ErrorSchema = z.object({ error: z.string() });

const autocompleteRoute = createRoute({
  method: 'get',
  path: '/autocomplete',
  tags: ['Places'],
  request: {
    query: z.object({
      input: z.string().min(3).max(200),
      sessiontoken: z.string().max(64).optional(),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            suggestions: z.array(z.object({ description: z.string(), place_id: z.string() })),
          }),
        },
      },
      description: 'Place predictions',
    },
    429: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Rate limited',
    },
    503: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Places proxy not configured',
    },
  },
});

const detailsRoute = createRoute({
  method: 'get',
  path: '/details',
  tags: ['Places'],
  request: {
    query: z.object({
      place_id: z.string().min(1).max(256),
      sessiontoken: z.string().max(64).optional(),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({ address: z.string(), lat: z.number(), lng: z.number() }),
        },
      },
      description: 'Place location',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Place not found',
    },
    429: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Rate limited',
    },
    503: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Places proxy not configured',
    },
  },
});

const geocodeRoute = createRoute({
  method: 'get',
  path: '/geocode',
  tags: ['Places'],
  request: {
    query: z.object({
      lat: z.coerce.number().min(-90).max(90),
      lng: z.coerce.number().min(-180).max(180),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': { schema: z.object({ address: z.string().nullable() }) },
      },
      description: 'Reverse-geocoded address, or null if none found',
    },
    429: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Rate limited',
    },
    503: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Places proxy not configured',
    },
  },
});

export const placesRoutes = new OpenAPIHono<AppEnv>()
  .openapi(autocompleteRoute, async c => {
    const apiKey = getEnv(c).GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return c.json({ error: 'Places proxy not configured' }, 503);
    }
    const ip = clientIp(c.req.raw.headers);
    if (isRateLimited(`ac:${ip}`, 60, 60_000)) {
      return c.json({ error: 'Too many requests' }, 429);
    }

    const { input, sessiontoken } = c.req.valid('query');
    // Places API (New) - the legacy autocomplete endpoint cannot be enabled
    // on this project anymore.
    const res = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
      method: 'POST',
      headers: { 'X-Goog-Api-Key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ input, ...(sessiontoken ? { sessionToken: sessiontoken } : {}) }),
    });
    if (!res.ok) {
      console.warn('places autocomplete failed', res.status, (await res.text()).slice(0, 200));
      return c.json({ suggestions: [] }, 200);
    }
    const data = (await res.json()) as {
      suggestions?: { placePrediction?: { placeId: string; text?: { text?: string } } }[];
    };
    const suggestions = (data.suggestions ?? [])
      .map(s => s.placePrediction)
      .filter((p): p is NonNullable<typeof p> => !!p)
      .map(p => ({ description: p.text?.text ?? '', place_id: p.placeId }));
    return c.json({ suggestions }, 200);
  })
  .openapi(detailsRoute, async c => {
    const apiKey = getEnv(c).GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return c.json({ error: 'Places proxy not configured' }, 503);
    }
    const ip = clientIp(c.req.raw.headers);
    if (isRateLimited(`det:${ip}`, 20, 60_000)) {
      return c.json({ error: 'Too many requests' }, 429);
    }

    const { place_id, sessiontoken } = c.req.valid('query');
    const params = new URLSearchParams();
    if (sessiontoken) params.set('sessionToken', sessiontoken);

    // The field mask keeps this in the cheapest Place Details billing tier.
    const res = await fetch(
      `https://places.googleapis.com/v1/places/${encodeURIComponent(place_id)}?${params}`,
      {
        headers: { 'X-Goog-Api-Key': apiKey, 'X-Goog-FieldMask': 'formattedAddress,location' },
      },
    );
    if (!res.ok) {
      return c.json({ error: 'Place not found' }, 404);
    }
    const data = (await res.json()) as {
      formattedAddress?: string;
      location?: { latitude: number; longitude: number };
    };
    if (!data.location) {
      return c.json({ error: 'Place not found' }, 404);
    }
    return c.json(
      {
        address: data.formattedAddress ?? '',
        lat: data.location.latitude,
        lng: data.location.longitude,
      },
      200,
    );
  })
  .openapi(geocodeRoute, async c => {
    const apiKey = getEnv(c).GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return c.json({ error: 'Places proxy not configured' }, 503);
    }
    const ip = clientIp(c.req.raw.headers);
    if (isRateLimited(`geo:${ip}`, 60, 60_000)) {
      return c.json({ error: 'Too many requests' }, 429);
    }

    const { lat, lng } = c.req.valid('query');
    const cacheKey = `${lat.toFixed(6)},${lng.toFixed(6)}`;
    if (geocodeCache.has(cacheKey)) {
      return c.json({ address: geocodeCache.get(cacheKey) ?? null }, 200);
    }

    const address = await reverseGeocode(lat, lng, apiKey);
    if (geocodeCache.size >= GEOCODE_CACHE_MAX) {
      const oldest = geocodeCache.keys().next().value;
      if (oldest !== undefined) geocodeCache.delete(oldest);
    }
    geocodeCache.set(cacheKey, address);
    return c.json({ address }, 200);
  });
