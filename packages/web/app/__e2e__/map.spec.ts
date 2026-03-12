import { test, expect } from '@playwright/test';

test.describe('Map Page', () => {
  test('displays search bar and map controls', async ({ page }) => {
    await page.goto('/map');

    await expect(page.getByPlaceholder('Search notes...')).toBeVisible();
    await expect(page.locator('button[title="Zoom in"]')).toBeVisible();
    await expect(page.locator('button[title="Zoom out"]')).toBeVisible();
    await expect(page.locator('button[title="Find my location"]')).toBeVisible();
  });
});
