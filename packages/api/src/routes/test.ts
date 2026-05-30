import { Hono } from 'hono';
import { db } from '../db';
import { env } from '../env';
import { sql } from 'drizzle-orm';
import { lastDevEmailUrl, getDevEmailUrl } from '../lib/email';

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
 * GET /api/test/auth-url?email=<email>&type=<verification|reset-password>
 * Returns the most recent dev-mode email URL for a specific recipient + type.
 * 404 while not yet captured -- e2e helper retries.
 */
testRoutes.get('/auth-url', c => {
  const email = c.req.query('email');
  const type = c.req.query('type');
  if (!email || !type) {
    return c.json({ error: 'Missing email or type query param' }, 400);
  }
  const url = getDevEmailUrl(email, type);
  if (!url) {
    return c.json({ error: 'No URL captured for that email/type yet' }, 404);
  }
  return c.json({ url }, 200);
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

// ============================================
// Firebase test helpers (for password sync e2e)
// ============================================

async function getFirebaseAuth() {
  const { getApps, initializeApp, cert } = await import('firebase-admin/app');
  const { getAuth } = await import('firebase-admin/auth');

  if (getApps().length === 0) {
    const credPath = env.FIREBASE_SERVICE_ACCOUNT_PATH;
    const credJson = env.FIREBASE_SERVICE_ACCOUNT;
    if (!credPath && !credJson) throw new Error('Firebase credentials not configured');

    let serviceAccount;
    if (credPath) {
      const fs = await import('node:fs');
      serviceAccount = JSON.parse(fs.readFileSync(credPath, 'utf-8'));
    } else {
      serviceAccount = JSON.parse(credJson!);
    }
    initializeApp({ credential: cert(serviceAccount) });
  }

  return getAuth();
}

testRoutes.post('/firebase/create-user', async c => {
  try {
    const { email, password } = (await c.req.json()) as { email: string; password: string };
    const auth = await getFirebaseAuth();
    const user = await auth.createUser({ email, password });
    return c.json({ uid: user.uid }, 200);
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : String(error) }, 500);
  }
});

testRoutes.post('/firebase/verify-password', async c => {
  try {
    const { email, password } = (await c.req.json()) as { email: string; password: string };
    const auth = await getFirebaseAuth();
    const { credential } = auth.app.options;
    const accessToken = await (credential as any).getAccessToken();
    const projectId = auth.app.options.projectId
      ?? (auth.app.options.credential as any)?.projectId;

    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken.access_token}`,
        },
        body: JSON.stringify({ email, password, returnSecureToken: false }),
      },
    );
    return c.json({ valid: res.ok }, 200);
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : String(error) }, 500);
  }
});

testRoutes.delete('/firebase/user', async c => {
  try {
    const email = c.req.query('email');
    if (!email) return c.json({ error: 'Missing email' }, 400);
    const auth = await getFirebaseAuth();
    const user = await auth.getUserByEmail(email);
    await auth.deleteUser(user.uid);
    return c.json({ success: true }, 200);
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : String(error) }, 500);
  }
});

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
