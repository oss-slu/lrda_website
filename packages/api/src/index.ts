import { OpenAPIHono } from '@hono/zod-openapi';
import { apiReference } from '@scalar/hono-api-reference';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { env } from './env';
import { db, closePool } from './db';
import { user, account, verification } from './db/schema';
import { routes } from './routes';
import { auth } from './auth';
import { stashPassword } from './lib/pending-password-resets';
import { testRoutes } from './routes/test';
import type { AppEnv } from './types';

const app = new OpenAPIHono<AppEnv>();

// Security headers
app.use('*', secureHeaders());

// CORS middleware
app.use(
  '*',
  cors({
    origin:
      env.ENVIRONMENT === 'development' ?
        (origin) => origin
      : (env.CORS_ORIGINS?.split(',') ?? []),
    credentials: true,
    allowHeaders: ['Content-Type', 'Authorization'],
  }),
);

// Shared password strength check. Returns an error response if invalid, or null if OK.
const PASSWORD_REGEX = /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}/;
const PASSWORD_ERROR = {
  error: 'Password too weak',
  message:
    'Password must be at least 8 characters and include uppercase, lowercase, a number and a special character.',
};

function forwardToAuth(c: { req: { raw: Request } }, json: unknown) {
  const headers = new Headers(c.req.raw.headers);
  headers.set('content-type', 'application/json');
  return auth.handler(
    new Request(c.req.raw.url, {
      method: 'POST',
      headers,
      body: JSON.stringify(json),
    }),
  );
}

// Server-side password strength validation for signup requests.
// IMPORTANT: This MUST be registered before the catch-all auth handler so it
// is matched first for POST /api/auth/sign-up/email.
app.post('/api/auth/sign-up/email', async c => {
  try {
    const json = await c.req.json();
    const password = json?.password;

    if (!password || !PASSWORD_REGEX.test(password)) {
      return c.json(PASSWORD_ERROR, 400);
    }

    return forwardToAuth(c, json);
  } catch {
    return c.json({ error: 'Invalid request' }, 400);
  }
});

// Server-side password strength validation for reset-password requests.
// IMPORTANT: This MUST be registered before the catch-all auth handler so it
// is matched first for POST /api/auth/reset-password.
app.post('/api/auth/reset-password', async c => {
  try {
    const json = await c.req.json();
    const newPassword = json?.newPassword ?? json?.new_password ?? json?.password;

    if (!newPassword || !PASSWORD_REGEX.test(newPassword)) {
      return c.json(PASSWORD_ERROR, 400);
    }

    // Stash plaintext password so onPasswordReset can push it to Firebase.
    // Resolve token -> userId -> email via the verification table.
    const token = json?.token;
    if (token) {
      const [verif] = await db
        .select({ value: verification.value })
        .from(verification)
        .where(eq(verification.identifier, `reset-password:${token}`))
        .limit(1);
      if (verif) {
        const [usr] = await db
          .select({ email: user.email })
          .from(user)
          .where(eq(user.id, verif.value))
          .limit(1);
        if (usr) stashPassword(usr.email, newPassword);
      }
    }

    return forwardToAuth(c, json);
  } catch {
    return c.json({ error: 'Invalid request' }, 400);
  }
});

// Migration status check -- TEMPORARY, remove after Firebase migration is complete.
// Checks if a user was migrated from Firebase and needs to set a password.
// Returns { needsPasswordReset: false } for unknown emails to avoid account enumeration.
app.post('/api/auth/migration-status', async c => {
  try {
    const json = await c.req.json();
    const parsed = z.object({ email: z.email() }).safeParse(json);
    if (!parsed.success) {
      return c.json({ error: 'Invalid request' }, 400);
    }

    const { email: emailValue } = parsed.data;

    const result = await db
      .select({ userId: user.id, accountId: account.id })
      .from(user)
      .leftJoin(account, and(eq(account.userId, user.id), eq(account.providerId, 'credential')))
      .where(eq(user.email, emailValue))
      .limit(1);

    if (!result.length) {
      return c.json({ needsPasswordReset: false }, 200);
    }

    return c.json({ needsPasswordReset: result[0].accountId === null }, 200);
  } catch {
    return c.json({ error: 'Invalid request' }, 400);
  }
});

// Mount better-auth handler - use all() to catch all methods.
// We read the body and build a clean Request because passing c.req.raw.body
// (a ReadableStream) can fail in @hono/node-server, and forwarding hop-by-hop
// headers like Transfer-Encoding corrupts the body parser.
app.all('/api/auth/*', async c => {
  const hasBody = c.req.method !== 'GET' && c.req.method !== 'HEAD';
  const body = hasBody ? await c.req.text() : undefined;
  const headers = new Headers();
  // Forward only the headers Better Auth needs
  const ct = c.req.raw.headers.get('content-type');
  if (ct) headers.set('content-type', ct);
  const origin = c.req.raw.headers.get('origin');
  if (origin) headers.set('origin', origin);
  const cookie = c.req.raw.headers.get('cookie');
  if (cookie) headers.set('cookie', cookie);
  const authorization = c.req.raw.headers.get('authorization');
  if (authorization) headers.set('authorization', authorization);
  return auth.handler(
    new Request(c.req.url, {
      method: c.req.method,
      headers,
      body,
    }),
  );
});

// Dev-only test endpoint for e2e tests (raw SQL access)
if (env.ENVIRONMENT !== 'production') {
  app.route('/api/test', testRoutes);
}

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
  servers: [
    {
      url: env.BETTER_AUTH_URL,
      description:
        env.ENVIRONMENT === 'development' ?
          'Development'
        : env.ENVIRONMENT.charAt(0).toUpperCase() + env.ENVIRONMENT.slice(1),
    },
  ],
});

// Scalar API Reference UI
app.get(
  '/docs',
  apiReference({
    url: '/openapi.json',
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

// Start server
import { serve } from '@hono/node-server';

const server = serve({ fetch: app.fetch, port: env.PORT, hostname: '0.0.0.0' }, info => {
  console.log(`API server running at http://localhost:${info.port}`);
  console.log(`API docs available at http://localhost:${info.port}/docs`);
});

// Graceful shutdown
let shuttingDown = false;

async function gracefulShutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;

  console.log(`Received ${signal}, starting graceful shutdown...`);

  server.close();
  await closePool();

  console.log('Graceful shutdown complete.');
  process.exit(0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export { app };
