/**
 * Browser helpers for @playwright/test specs.
 * Specs receive the `browser` fixture from Playwright; these helpers build
 * isolated contexts (authenticated or anonymous) from it. Each context is
 * isolated to prevent cookie/session leakage between tests.
 */
import type { Browser, Page } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const API_URL = process.env.__TEST_API_URL || 'http://localhost:3002';

/**
 * Mint a Better Auth session cookie value for a user via the test endpoint.
 * The server signs it with the real BETTER_AUTH_SECRET, so it matches what
 * Better Auth expects.
 */
async function sessionCookieValue(userId: string): Promise<string> {
  const res = await fetch(`${API_URL}/api/test/create-session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) {
    throw new Error(`Failed to create session for ${userId}: ${await res.text()}`);
  }
  const { cookie } = (await res.json()) as { cookie: string };
  // cookie is "better-auth.session_token=<value>"
  const [, value] = cookie.split('=', 2);
  return value;
}

/** New page in an isolated context with an injected authenticated session. */
export async function authedPage(browser: Browser, userId: string): Promise<Page> {
  const value = await sessionCookieValue(userId);
  const context = await browser.newContext({ baseURL: BASE_URL });
  await context.addCookies([
    {
      name: 'better-auth.session_token',
      value,
      domain: new URL(BASE_URL).hostname,
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
    },
  ]);
  return context.newPage();
}

/** New page in a fresh, unauthenticated context. */
export async function anonPage(browser: Browser): Promise<Page> {
  const context = await browser.newContext({ baseURL: BASE_URL });
  return context.newPage();
}

/** Build a full URL from a path. */
export function url(path: string): string {
  return `${BASE_URL}${path}`;
}

export { TEST_USER_ID, TEST_ADMIN_ID } from '../../helpers/db-seed';
