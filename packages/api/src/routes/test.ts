import { Hono } from 'hono';
import { db } from '../db';
import { env } from '../env';
import { sql } from 'drizzle-orm';
import { lastDevEmailUrl } from '../lib/email';

/**
 * Dev-only test endpoint for e2e tests.
 * Provides raw SQL access and session creation for test data.
 * NEVER registered in production.
 */
export const testRoutes = new Hono();

// Defense-in-depth: reject all requests if somehow mounted in production.
// The primary guard is in index.ts, but this prevents accidental exposure.
testRoutes.use('*', async (c, next) => {
  if (env.ENVIRONMENT === 'production') {
    return c.json({ error: 'Not available' }, 404);
  }
  return next();
});

// POST /api/test?action=query|execute -- raw SQL
testRoutes.post('/', async c => {
  const action = c.req.query('action');

  if (!action || !['query', 'execute'].includes(action)) {
    return c.json({ error: 'Invalid action. Use ?action=query or ?action=execute' }, 400);
  }

  try {
    const body = await c.req.json();
    const { sql: sqlText, params = [] } = body as {
      sql: string;
      params?: unknown[];
    };

    if (!sqlText) {
      return c.json({ error: 'Missing sql field' }, 400);
    }

    const built =
      params.length > 0
        ? sql`${sql.raw(buildParameterized(sqlText, params))}`
        : sql.raw(sqlText);

    if (action === 'query') {
      const result = await db.execute(built);
      return c.json({ rows: result.rows ?? result }, 200);
    }

    await db.execute(built);
    return c.json({ success: true }, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

/**
 * GET /api/test/last-email-url
 * Returns the URL from the most recent dev-mode email (verification or reset).
 * Used by e2e tests to retrieve JWT tokens without parsing server logs.
 */
testRoutes.get('/last-email-url', c => {
  return c.json({ url: lastDevEmailUrl }, 200);
});

/**
 * POST /api/test/create-session
 * Creates a session row in the DB for the given userId, signs the token
 * using the server's BETTER_AUTH_SECRET, and returns the cookie string.
 */
testRoutes.post('/create-session', async c => {
  try {
    const { userId } = (await c.req.json());
    if (!userId) {
      return c.json({ error: 'Missing userId' }, 400);
    }

    const sessionId = crypto.randomUUID();
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Insert session row
    await db.execute(
      sql`INSERT INTO "session" (id, token, user_id, expires_at, created_at, updated_at)
          VALUES (${sessionId}, ${token}, ${userId}, ${expiresAt}, NOW(), NOW())`,
    );

    // Sign the token matching better-call's signCookieValue:
    // 1. HMAC-SHA256 -> btoa (regular base64 with padding, 44 chars)
    // 2. Concatenate: value.signature
    // 3. encodeURIComponent the whole thing
    const signature = await hmacSign(token, env.BETTER_AUTH_SECRET);
    const signedValue = encodeURIComponent(`${token}.${signature}`);
    const cookie = `better-auth.session_token=${signedValue}`;

    return c.json({ cookie }, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

/**
 * HMAC-SHA256 sign a value, returning regular base64 WITH padding.
 * Matches better-call's makeSignature() exactly:
 *   btoa(String.fromCharCode(...new Uint8Array(signature)))
 * This produces a 44-char base64 string ending with '='.
 */
async function hmacSign(value: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(value));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

/**
 * Build a SQL string with inline-escaped parameters.
 * Only for dev/test use -- never in production.
 */
function buildParameterized(sqlText: string, params: unknown[]): string {
  return sqlText.replace(/\$(\d+)/g, (_match, num) => {
    const idx = Number(num) - 1;
    const val = params[idx];
    if (val === null || val === undefined) return 'NULL';
    if (typeof val === 'number') return String(val);
    if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
    return `'${String(val).replace(/'/g, "''")}'`;
  });
}
