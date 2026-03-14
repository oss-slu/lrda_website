/**
 * Shared Playwright browser helpers for e2e specs.
 * Lazily launches a single Chromium instance shared across all spec files
 * (works because fileParallelism is disabled).
 * Each newPage() call creates an isolated browser context to prevent
 * cookie/session leakage between tests.
 */
import { chromium, type Browser, type Page } from 'playwright';

const BASE_URL = process.env.__TEST_WEB_URL || 'http://localhost:3000';

let browser: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browser) {
    browser = await chromium.launch({ headless: !process.env.HEADED });
  }
  return browser;
}

/** Close the shared browser instance. Safe to call multiple times. */
export async function closeBrowser(): Promise<void> {
  if (browser) {
    await browser.close();
    browser = null;
  }
}

// Close browser on process exit instead of using afterAll (which has
// non-deterministic ordering when multiple spec files register it).
process.on('beforeExit', () => {
  if (browser) {
    browser.close().catch(() => {});
    browser = null;
  }
});

/** Create a new page in a fresh, isolated browser context. */
export async function newPage(): Promise<Page> {
  const b = await getBrowser();
  const context = await b.newContext();
  return context.newPage();
}

const API_URL = process.env.__TEST_API_URL || 'http://localhost:3002';

/**
 * Create a new page with an authenticated session.
 * Uses the test API's create-session endpoint to get a signed cookie,
 * then injects it into the browser context before returning the page.
 */
export async function newAuthenticatedPage(userId: string): Promise<Page> {
  // Get a signed session cookie from the API
  const res = await fetch(`${API_URL}/api/test/create-session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to create session for ${userId}: ${text}`);
  }

  const { cookie } = (await res.json()) as { cookie: string };

  // Parse the cookie value from "better-auth.session_token=<value>"
  const [, cookieValue] = cookie.split('=', 2);

  const b = await getBrowser();
  const context = await b.newContext();

  // Inject the session cookie into the browser context
  await context.addCookies([
    {
      name: 'better-auth.session_token',
      value: cookieValue,
      domain: new URL(BASE_URL).hostname,
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
    },
  ]);

  return context.newPage();
}

/** Build a full URL from a path. */
export function url(path: string): string {
  return `${BASE_URL}${path}`;
}

/** Stable test user IDs (must match tests/e2e/helpers/db-seed.ts) */
export const TEST_USER_ID = '00000000-e2e0-4000-a000-000000000001';
export const TEST_ADMIN_ID = '00000000-e2e0-4000-a000-000000000003';
export const TEST_INSTRUCTOR_ID = '00000000-e2e0-4000-a000-000000000004';
