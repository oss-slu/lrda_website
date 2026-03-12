import { OpenAPIHono } from '@hono/zod-openapi';
import { cors } from 'hono/cors';
import { eq } from 'drizzle-orm';
import { routes } from '../routes';
import { auth } from '../auth';
import { db } from '../db';
import { user, session, account, note } from '../db/schema';
import type { AppEnv } from '../types';

// Create a test app instance (without listening)
export function createTestApp() {
  const app = new OpenAPIHono<AppEnv>();

  // CORS middleware
  app.use(
    '*',
    cors({
      origin: '*',
      credentials: true,
      allowHeaders: ['Content-Type', 'Authorization'],
    }),
  );

  // Mount better-auth handler
  app.on(['POST', 'GET'], '/api/auth/*', c => {
    return auth.handler(c.req.raw);
  });

  // Mount API routes
  app.route('/api', routes);

  return app;
}

// Create a production-like app that mirrors the exact route setup from index.ts.
// This includes the reset-password validation route BEFORE the catch-all auth handler.
export function createProductionApp() {
  const app = new OpenAPIHono<AppEnv>();

  app.use(
    '*',
    cors({
      origin: '*',
      credentials: true,
      allowHeaders: ['Content-Type', 'Authorization'],
    }),
  );

  // Password validation for reset-password (MUST come before catch-all)
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

  // Catch-all auth handler
  app.all('/api/auth/*', async c => {
    const response = await auth.handler(
      new Request(c.req.raw.url, {
        method: c.req.method,
        headers: c.req.raw.headers,
        body: c.req.method !== 'GET' && c.req.method !== 'HEAD' ? c.req.raw.body : undefined,
      }),
    );
    return response;
  });

  // Mount API routes
  app.route('/api', routes);

  return app;
}

// Helper to make requests to the test app
export async function request(
  app: OpenAPIHono<AppEnv>,
  method: string,
  path: string,
  options: {
    body?: unknown;
    headers?: Record<string, string>;
  } = {},
) {
  const { body, headers = {} } = options;

  const req = new Request(`http://localhost${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const response = await app.fetch(req);
  const text = await response.text();

  let json: unknown = null;
  try {
    json = JSON.parse(text);
  } catch {
    // Not JSON
  }

  return {
    status: response.status,
    headers: response.headers,
    text,
    json,
  };
}

// Create an authenticated test user and return session cookies.
// Because requireEmailVerification is enabled, we must:
// 1. Sign up the user
// 2. Verify their email directly in the DB
// 3. Sign in to get a proper session cookie
export async function createAuthenticatedUser(
  app: OpenAPIHono<AppEnv>,
  options?: {
    email?: string;
    name?: string;
    password?: string;
  },
) {
  const email =
    options?.email ?? `test-${Date.now()}-${Math.random().toString(36).slice(2)}@test.com`;
  const name = options?.name ?? 'Test User';
  const password = options?.password ?? 'password123';

  // Step 1: Sign up
  const signUpRes = await request(app, 'POST', '/api/auth/sign-up/email', {
    body: { email, password, name },
  });

  if (signUpRes.status !== 200) {
    throw new Error(`Failed to create user: ${signUpRes.text}`);
  }

  const signUpJson = signUpRes.json as { user: { id: string } };

  // Step 2: Verify email in DB (bypass the email verification flow for tests)
  await db.update(user).set({ emailVerified: true }).where(eq(user.id, signUpJson.user.id));

  // Step 3: Sign in to get a proper session with cookie
  const signInRes = await request(app, 'POST', '/api/auth/sign-in/email', {
    body: { email, password },
  });

  if (signInRes.status !== 200) {
    throw new Error(`Failed to sign in user: ${signInRes.text}`);
  }

  // Extract session token from set-cookie header
  let sessionToken = '';

  // Try getSetCookie() first (Node 20+)
  const setCookieHeaders = signInRes.headers.getSetCookie?.() ?? [];
  for (const header of setCookieHeaders) {
    const match = header.match(/better-auth\.session_token=([^;]+)/);
    if (match) {
      sessionToken = match[1];
      break;
    }
  }

  // Fall back to parsing get('set-cookie')
  if (!sessionToken) {
    const rawSetCookie = signInRes.headers.get('set-cookie') || '';
    const match = rawSetCookie.match(/better-auth\.session_token=([^;,\s]+)/);
    if (match) {
      sessionToken = match[1];
    }
  }

  // Fall back to DB lookup
  if (!sessionToken) {
    const userSession = await db.query.session.findFirst({
      where: eq(session.userId, signUpJson.user.id),
    });
    if (userSession) {
      sessionToken = userSession.token;
    }
  }

  if (!sessionToken) {
    throw new Error('Could not capture session token for authenticated user');
  }

  const cookies = `better-auth.session_token=${sessionToken}`;

  return {
    userId: signUpJson.user.id,
    email,
    name,
    cookies,
    headers: { Cookie: cookies },
  };
}

// Clean up a test user and all related data
export async function cleanupUser(userId: string) {
  await db
    .delete(note)
    .where(eq(note.creatorId, userId))
    .catch(() => {});
  await db
    .delete(session)
    .where(eq(session.userId, userId))
    .catch(() => {});
  await db
    .delete(account)
    .where(eq(account.userId, userId))
    .catch(() => {});
  await db
    .delete(user)
    .where(eq(user.id, userId))
    .catch(() => {});
}
