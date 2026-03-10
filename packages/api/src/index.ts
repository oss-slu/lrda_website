import { OpenAPIHono } from '@hono/zod-openapi';
import { apiReference } from '@scalar/hono-api-reference';
import { cors } from 'hono/cors';
import { createDb } from './db';
import { createAuth } from './auth';
import { setEmailEnv } from './lib/email';
import { dbMiddleware } from './middleware/auth';
import { routes } from './routes';
import type { AppBindings } from './types';

const app = new OpenAPIHono<AppBindings>();

// Database middleware - creates D1-backed db per request
app.use('*', dbMiddleware);

// CORS middleware
app.use(
  '*',
  async (c, next) => {
    const env = c.env;
    const isDev = env.ENVIRONMENT !== 'production';
    const corsMiddleware = cors({
      origin:
        isDev ?
          ['http://localhost:3000', 'http://localhost:8787']
        : (env.CORS_ORIGINS?.split(',') ?? []),
      credentials: true,
      allowHeaders: ['Content-Type', 'Authorization'],
    });
    return corsMiddleware(c, next);
  },
);

// Server-side password strength validation for reset-password requests.
// This checks the `newPassword` field and forwards the request to better-auth
// if it passes validation. Returning a 400 for weak/missing passwords.
// IMPORTANT: This MUST be registered before the catch-all auth handler so it
// is matched first for POST /api/auth/reset-password.
app.post('/api/auth/reset-password', async c => {
  try {
    const json = await c.req.json();
    const newPassword = json?.newPassword ?? json?.new_password ?? json?.password;

    if (!newPassword) {
      return c.json({ error: 'Missing newPassword' }, 400);
    }

    const strong = /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}/;
    if (!strong.test(newPassword)) {
      return c.json(
        {
          error: 'Password too weak',
          message:
            'Password must be at least 8 characters and include uppercase, lowercase, a number and a special character.',
        },
        400,
      );
    }

    // Forward validated request to better-auth. Recreate Request because body
    // has been consumed by c.req.json().
    const db = c.get('db');
    const auth = createAuth(c.env, db);
    const forwarded = new Request(c.req.raw.url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(json),
    });

    return auth.handler(forwarded);
  } catch (err) {
    return c.json({ error: 'Invalid request' }, 400);
  }
});

// Mount better-auth handler - use all() to catch all methods
app.all('/api/auth/*', async c => {
  const db = c.get('db');
  const auth = createAuth(c.env, db);
  const response = await auth.handler(
    new Request(c.req.raw.url, {
      method: c.req.method,
      headers: c.req.raw.headers,
      body: c.req.method !== 'GET' && c.req.method !== 'HEAD' ?
        c.req.raw.body :
        undefined,
    })
  );
  return response;
});

// Mount API routes
app.route('/api', routes);

// OpenAPI JSON spec
app.doc('/openapi.json', {
  openapi: '3.1.0',
  info: {
    title: 'LRDA API',
    version: '0.0.1',
    description: "Where's Religion? API Server",
  },
});

// Scalar API Reference UI
app.get(
  '/docs',
  apiReference({
    spec: {
      url: '/openapi.json',
    },
    theme: 'purple',
    layout: 'modern',
    defaultHttpClient: {
      targetKey: 'js',
      clientKey: 'fetch',
    },
  }),
);

// Global error handler
app.onError((err, c) => {
  console.error('Request error:', err.message);

  if ('statusCode' in err && typeof err.statusCode === 'number') {
    return c.json(
      { error: err.message, code: (err as { code?: string }).code },
      err.statusCode as 400,
    );
  }

  return c.json({ error: 'Internal server error' }, 500);
});

// 404 handler
app.notFound(c => {
  return c.json({ error: 'Not found' }, 404);
});

export default app;
