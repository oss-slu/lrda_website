/**
 * Helpers for the auth-page UI specs: capture the dev-mode verification/reset
 * email URL, extract its token, verify it, and clean up created users.
 */
import { queryOne, execute } from '../../../tests/e2e/helpers/db-seed';

const API_URL = process.env.__TEST_API_URL || 'http://localhost:3002';

/** URL from the most recent dev-mode email (verification or reset). */
export async function getLastEmailUrl(): Promise<string | null> {
  const res = await fetch(`${API_URL}/api/test/last-email-url`);
  if (!res.ok) return null;
  const data = (await res.json()) as { url?: string };
  return data.url ?? null;
}

/** Extract a query parameter from a URL string. */
export function extractToken(emailUrl: string, param = 'token'): string | null {
  try {
    return new URL(emailUrl).searchParams.get(param);
  } catch {
    return null;
  }
}

/** Verify an email via the real API endpoint using a captured token. */
export async function verifyEmailToken(token: string): Promise<Response> {
  return fetch(`${API_URL}/api/auth/verify-email?token=${encodeURIComponent(token)}`);
}

/** Delete all data for a user by email (test cleanup). */
export async function cleanupByEmail(email: string): Promise<void> {
  const row = await queryOne<{ id: string }>(`SELECT id FROM "user" WHERE email = $1`, email);
  if (!row) return;
  await execute(`DELETE FROM "session" WHERE user_id = $1`, row.id);
  await execute(`DELETE FROM "account" WHERE user_id = $1`, row.id);
  await execute(`DELETE FROM "verification" WHERE identifier = $1`, email);
  await execute(`DELETE FROM "user" WHERE id = $1`, row.id);
}
