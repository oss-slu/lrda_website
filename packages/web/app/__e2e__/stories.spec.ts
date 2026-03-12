import { test, expect } from '@playwright/test';

test.describe('Stories Page', () => {
  test('displays search bar and filter controls', async ({ page }) => {
    await page.goto('/stories');

    await expect(page.getByPlaceholder('Search stories...')).toBeVisible();

    // At least one dropdown trigger should be present (sort order)
    const selectTriggers = page.locator('button[role="combobox"]');
    expect(await selectTriggers.count()).toBeGreaterThan(0);
  });

  test('does not make blob: or data: URL network requests', async ({ page }) => {
    const badRequests: string[] = [];
    page.on('requestfailed', request => {
      const url = request.url();
      if (url.startsWith('blob:') || url.startsWith('data:')) {
        badRequests.push(url);
      }
    });

    await page.goto('/stories');
    await page.waitForLoadState('networkidle');

    expect(badRequests.length).toBe(0);
  });
});
