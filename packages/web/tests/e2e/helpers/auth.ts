import { execute } from './db-seed';

const API_URL = () => process.env.__TEST_API_URL || 'http://localhost:3002';

/**
 * Create a session for a test user via the server-side test endpoint.
 * The server signs the token with the real BETTER_AUTH_SECRET,
 * so the cookie is guaranteed to match what Better Auth expects.
 *
 * Returns a cookie string ready for use in request headers.
 */
export async function createSession(userId: string): Promise<string> {
  const res = await fetch(`${API_URL()}/api/test/create-session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to create session for ${userId}: ${text}`);
  }

  const { cookie } = (await res.json()) as { cookie: string };
  return cookie;
}

/**
 * Delete all sessions for a user (cleanup).
 */
export async function deleteSessionsForUser(userId: string): Promise<void> {
  await execute(`DELETE FROM "session" WHERE user_id = $1`, userId);
}
