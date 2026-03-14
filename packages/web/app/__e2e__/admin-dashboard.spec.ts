import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import type { Page } from 'playwright';
import { newPage, url } from './helpers/pw';

describe('Admin Dashboard', () => {
  let page: Page;

  beforeAll(async () => {
    page = await newPage();
  });

  afterAll(async () => {
    await page.context().close();
  });

  test('unauthenticated users are redirected from /admin to home', async () => {
    await page.goto(url('/admin'));

    // Wait for the redirect to land on the home page specifically
    await page.waitForURL(url('/'));
    expect(page.url()).toBe(url('/'));

    // Verify we landed on a real page (home)
    await page.locator('nav').waitFor({ state: 'visible' });
  });

  test('user dropdown is not rendered for unauthenticated users', async () => {
    await page.goto(url('/'));
    await page.waitForLoadState('networkidle');

    // When unauthenticated, the user dropdown (which contains the Admin link)
    // is not rendered at all. The Login link is shown instead.
    await page.getByRole('link', { name: 'Login' }).waitFor({ state: 'visible' });
    // No user dropdown trigger should exist
    const userDropdown = page.locator('nav button[data-testid="user-menu"], nav [aria-haspopup="menu"]');
    expect(await userDropdown.count()).toBe(0);
  });
});
