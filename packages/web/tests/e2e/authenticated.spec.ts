import { test, expect, type Page } from '@playwright/test';
import { authedPage, TEST_USER_ID, TEST_ADMIN_ID } from './helpers/pw';
import { seedTestData, resetTestData } from '../helpers/db-seed';

// Seed test users once for all authenticated specs in this file
test.beforeAll(async () => {
  await seedTestData();
});

test.afterAll(async () => {
  await resetTestData();
});

/**
 * Navigate to a page via client-side routing.
 * Direct page.goto() to authenticated routes triggers the document SSR pass
 * which hangs in Vite dev mode (a browser-only dependency in the SSR path).
 * Client-side navigation avoids SSR and mirrors real user behavior (users
 * land on '/' first, then navigate).
 */
async function navigateClientSide(page: Page, path: string): Promise<void> {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('nav')).toBeVisible();

  if (path === '/notes') {
    await page.locator('nav a[href="/notes"]').click();
  } else if (path === '/admin') {
    // Admin link is in the user dropdown menu
    const userMenuTrigger = page.locator('nav').locator('button').filter({ hasText: /Test/ });
    await userMenuTrigger.click();
    await page.getByRole('menuitem', { name: /admin/i }).click();
  }

  await page.waitForURL(`**${path}**`);
}

test.describe('Authenticated - Notes page', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await authedPage(browser, TEST_USER_ID);
  });

  test.afterAll(async () => {
    await page?.context().close();
  });

  test('authenticated user can navigate to /notes without redirect', async () => {
    await navigateClientSide(page, '/notes');
    await expect(page).toHaveURL(/\/notes/);
  });

  test('notes page shows the user name in nav', async () => {
    await navigateClientSide(page, '/notes');
    await expect(page.locator('nav')).toContainText('Test User');
  });

  test('notes page has a create note button', async () => {
    await navigateClientSide(page, '/notes');
    await expect(page.getByTestId('add-note-button')).toBeVisible();
  });
});

test.describe('Authenticated - Admin dashboard', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await authedPage(browser, TEST_ADMIN_ID);
  });

  test.afterAll(async () => {
    await page?.context().close();
  });

  test('admin user can navigate to /admin without redirect', async () => {
    await navigateClientSide(page, '/admin');
    await expect(page).toHaveURL(/\/admin/);
  });

  test('admin dashboard displays stats', async () => {
    await navigateClientSide(page, '/admin');
    await expect(page.getByText(/total users|users/i).first()).toBeVisible();
  });

  test('admin dashboard shows user management', async () => {
    await navigateClientSide(page, '/admin');
    // Switch to the Users tab (default is Applications)
    await page.getByRole('tab', { name: /users/i }).click();
    await expect(page.locator('table tbody tr').first()).toBeVisible();
  });
});

test.describe('Authenticated - Nav state', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await authedPage(browser, TEST_USER_ID);
  });

  test.afterAll(async () => {
    await page?.context().close();
  });

  test('authenticated user sees Notes link in nav', async () => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('nav a[href="/notes"]')).toHaveCount(1);
  });

  test('authenticated user sees logout option in dropdown', async () => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('nav').locator('button').filter({ hasText: 'Test User' }).click();
    await expect(page.getByText(/log\s?out|sign\s?out/i)).toBeVisible();
  });

  test('non-admin user does not see Admin link in dropdown', async () => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('nav').locator('button').filter({ hasText: 'Test User' }).click();
    await expect(page.getByText(/log\s?out|sign\s?out/i)).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /admin/i })).toHaveCount(0);
  });
});
