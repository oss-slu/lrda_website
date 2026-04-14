import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { PageViewTrackingSchema } from '@lrda/shared';
import { pageView } from '../db/schema';
import { createHash } from 'node:crypto';
import type { AppEnv } from '../types';
import { getDb } from './helpers';
import { env } from '../env';

// User-Agent parsing utilities
function parseBrowser(ua: string): string | null {
  if (!ua) return null;
  if (/Edg\//.test(ua)) return 'Edge';
  if (/Opera\/|OPR\//.test(ua)) return 'Opera';
  if (/CriOS\//.test(ua)) return 'Chrome';
  if (/FxiOS\//.test(ua)) return 'Firefox';
  if (/Chrome\//.test(ua) && !/Chromium\//.test(ua)) return 'Chrome';
  if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) return 'Safari';
  if (/Firefox\//.test(ua)) return 'Firefox';
  if (/MSIE|Trident/.test(ua)) return 'IE';
  return 'Other';
}

function parseOS(ua: string): string | null {
  if (!ua) return null;
  if (/iPhone|iPad|iPod/.test(ua)) return 'iOS';
  if (/Android/.test(ua)) return 'Android';
  if (/Windows/.test(ua)) return 'Windows';
  if (/Mac OS X/.test(ua)) return 'macOS';
  if (/Linux/.test(ua)) return 'Linux';
  return 'Other';
}

function parseDevice(ua: string): string | null {
  if (!ua) return null;
  if (/Tablet|iPad/.test(ua)) return 'tablet';
  if (/Mobile|iPhone|iPod|Opera Mini/.test(ua)) return 'mobile';
  if (/Android/.test(ua)) return /Mobile/.test(ua) ? 'mobile' : 'tablet';
  return 'desktop';
}

// Routes
const trackPageViewRoute = createRoute({
  method: 'post',
  path: '/pageview',
  tags: ['Analytics'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: PageViewTrackingSchema,
        },
      },
    },
  },
  responses: {
    202: {
      content: { 'application/json': { schema: z.object({ ok: z.boolean() }) } },
      description: 'Page view recorded',
    },
    400: {
      content: { 'application/json': { schema: z.object({ error: z.string() }) } },
      description: 'Invalid request',
    },
  },
});

export const analyticsRoutes = new OpenAPIHono<AppEnv>().openapi(trackPageViewRoute, async c => {
  const db = getDb(c);
  const body = c.req.valid('json');

  // Origin allowlist: in development accept any; otherwise require Origin in CORS_ORIGINS or WEB_URL
  const origin = c.req.header('origin');
  if (env.ENVIRONMENT !== 'development') {
    const allowed = env.CORS_ORIGINS?.split(',').map(o => o.trim()).filter(Boolean) ?? [
      env.WEB_URL,
    ];
    if (!origin || !allowed.includes(origin)) {
      return c.json({ error: 'Invalid origin' }, 400);
    }
  }

  // Path validation: must be a same-origin path, no control characters
  if (!body.path.startsWith('/') || /[\x00-\x1f\x7f]/.test(body.path)) {
    return c.json({ error: 'Invalid path' }, 400);
  }

  const ip = c.req.header('x-forwarded-for') || 'unknown';
  const ua = c.req.header('user-agent') || '';
  const today = new Date().toISOString().split('T')[0];

  // One-way hash for daily unique visitor approximation. Salted with BETTER_AUTH_SECRET
  // so raw IP+UA cannot be recovered via rainbow table even if the DB leaks.
  const sessionHash = createHash('sha256')
    .update(`${env.BETTER_AUTH_SECRET}:${ip}:${ua}:${today}`)
    .digest('hex')
    .slice(0, 16);

  // Parse User-Agent for browser/OS/device (simple regex, no library needed)
  const browser = parseBrowser(ua);
  const os = parseOS(ua);
  const device = parseDevice(ua);

  await db.insert(pageView).values({
    path: body.path,
    pageTitle: body.pageTitle || null,
    referrer: body.referrer || null,
    utmSource: body.utmSource || null,
    utmMedium: body.utmMedium || null,
    utmCampaign: body.utmCampaign || null,
    browser,
    os,
    device,
    screenWidth: body.screenWidth || null,
    language: body.language || null,
    sessionHash,
  });

  return c.json({ ok: true }, 202);
});
