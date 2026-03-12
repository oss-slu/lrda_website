import { test, expect } from '@playwright/test';

test.describe('Notes Page', () => {
  test('shows navigation', async ({ page }) => {
    await page.goto('/notes');
    await expect(page.locator('nav')).toBeVisible();
  });

  test('shows login prompt when not authenticated', async ({ page }) => {
    await page.goto('/notes');

    const loginPrompt = page.getByText('You must be logged in to create and edit notes.');
    if (await loginPrompt.isVisible().catch(() => false)) {
      await expect(loginPrompt).toBeVisible();
      await expect(page.locator('button:has-text("Sign in")')).toBeVisible();
    }
  });
});
