import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import type { Page } from 'playwright';
import { newAuthenticatedPage, url, TEST_USER_ID, TEST_ADMIN_ID } from './helpers/pw';
import { seedTestData, resetTestData } from '../../tests/e2e/helpers/db-seed';

// Seed test users once for all authenticated specs in this file
beforeAll(async () => {
  await seedTestData();
});

afterAll(async () => {
  await resetTestData();
});

/**
 * Helper: navigate to a page via client-side routing.
 * Direct page.goto() to authenticated routes triggers full SSR which hangs
 * in Vite dev mode due to browser-only dependencies (Tiptap, Google Maps).
 * Client-side navigation avoids SSR and mirrors real user behavior.
 */
async function navigateClientSide(page: Page, path: string): Promise<void> {
  await page.goto(url('/'));
  await page.waitForLoadState('networkidle');
  await page.locator('nav').waitFor({ state: 'visible' });

  if (path === '/notes') {
    await page.locator('nav a[href="/notes"]').click();
  } else if (path === '/admin') {
    // Admin link is in the user dropdown menu
    const userMenuTrigger = page.locator('nav').locator('button').filter({ hasText: /Test/ });
    await userMenuTrigger.waitFor({ state: 'visible', timeout: 10000 });
    await userMenuTrigger.click();
    await page.getByRole('menuitem', { name: /admin/i }).click();
  }

  await page.waitForURL(`**${path}**`, { timeout: 15000 });
}

describe('Authenticated - Notes page', () => {
  let page: Page;

  beforeAll(async () => {
    page = await newAuthenticatedPage(TEST_USER_ID);
  });

  afterAll(async () => {
    await page?.context().close();
  });

  test('authenticated user can navigate to /notes without redirect', async () => {
    await navigateClientSide(page, '/notes');

    // Should be on /notes (not redirected to /login)
    expect(page.url()).toContain('/notes');
  });

  test('notes page shows the user name in nav', async () => {
    // Already on /notes from previous test, but navigate fresh for isolation
    await navigateClientSide(page, '/notes');

    await page.locator('nav').waitFor({ state: 'visible' });
    const navText = await page.locator('nav').textContent();
    expect(navText).toContain('Test User');
  });

  test('notes page has a create note button', async () => {
    await navigateClientSide(page, '/notes');

    const createButton = page.getByTestId('add-note-button');
    await createButton.waitFor({ state: 'visible', timeout: 10000 });
    expect(await createButton.isVisible()).toBe(true);
  });
});

describe('Authenticated - Admin dashboard', () => {
  let page: Page;

  beforeAll(async () => {
    page = await newAuthenticatedPage(TEST_ADMIN_ID);
  });

  afterAll(async () => {
    await page?.context().close();
  });

  test('admin user can navigate to /admin without redirect', async () => {
    await navigateClientSide(page, '/admin');

    // Should be on /admin (not redirected to /)
    expect(page.url()).toContain('/admin');
  });

  test('admin dashboard displays stats', async () => {
    await navigateClientSide(page, '/admin');

    await page.getByText(/total users|users/i).first().waitFor({ state: 'visible', timeout: 10000 });
  });

  test('admin dashboard shows user management', async () => {
    await navigateClientSide(page, '/admin');

    // Switch to the Users tab (default is Applications)
    await page.getByRole('tab', { name: /users/i }).click();

    // Should have a users table with rows
    const userRows = page.locator('table tbody tr');
    await expect
      .poll(() => userRows.count(), { timeout: 10000 })
      .toBeGreaterThan(0);
  });
});

describe('Authenticated - Nav state', () => {
  let page: Page;

  beforeAll(async () => {
    page = await newAuthenticatedPage(TEST_USER_ID);
  });

  afterAll(async () => {
    await page?.context().close();
  });

  test('authenticated user sees Notes link in nav', async () => {
    await page.goto(url('/'));
    await page.waitForLoadState('networkidle');

    await page.locator('nav').waitFor({ state: 'visible' });
    const notesLink = page.locator('nav a[href="/notes"]');
    expect(await notesLink.count()).toBeGreaterThan(0);
  });

  test('authenticated user sees logout option in dropdown', async () => {
    await page.goto(url('/'));
    await page.waitForLoadState('networkidle');

    // Open the user dropdown
    const userMenuTrigger = page.locator('nav').locator('button').filter({ hasText: 'Test User' });
    await userMenuTrigger.waitFor({ state: 'visible', timeout: 10000 });
    await userMenuTrigger.click();

    // Logout option should be visible
    await page.getByText(/log\s?out|sign\s?out/i).waitFor({ state: 'visible', timeout: 5000 });
  });

  test('non-admin user does not see Admin link in dropdown', async () => {
    await page.goto(url('/'));
    await page.waitForLoadState('networkidle');

    // Open the user dropdown
    const userMenuTrigger = page.locator('nav').locator('button').filter({ hasText: 'Test User' });
    await userMenuTrigger.waitFor({ state: 'visible', timeout: 10000 });
    await userMenuTrigger.click();

    // Wait for the dropdown to open
    await page.getByText(/log\s?out|sign\s?out/i).waitFor({ state: 'visible', timeout: 5000 });

    // Admin link should NOT be present for a regular user
    const adminLink = page.getByRole('menuitem', { name: /admin/i });
    expect(await adminLink.count()).toBe(0);
  });
});
