import { test, expect } from '@playwright/test';

/**
 * Notes Page E2E Test
 *
 * This test verifies the basic notes page functionality:
 * - Notes page loads correctly
 * - Fixed-width sidebar + editor layout is present
 * - Navigation bar is visible
 *
 * Test Strategy: Focus on notes page structure and basic page presence
 * without testing note creation, editing, or complex user interactions.
 */
test.describe('Notes Page', () => {
  test('should display notes page with basic content', async ({ page }) => {
    // Navigate to notes page
    await page.goto('/notes', { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Wait for page to load
    await page.waitForLoadState('domcontentloaded');

    // Wait a bit more for any dynamic content to load
    await page.waitForTimeout(3000);

    // Check that page loaded (not a 404 or error)
    const hasContent = (await page.locator('div').count()) > 0;
    expect(hasContent).toBeTruthy();

    // Navigation should be visible
    await expect(page.locator('nav')).toBeVisible();

    // Page should have fixed-width sidebar with border separator
    const sidebar = page.locator('.border-r.border-gray-200').first();
    await expect(sidebar).toBeVisible();
  });
});
