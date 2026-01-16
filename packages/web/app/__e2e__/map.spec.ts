import { test, expect } from '@playwright/test';

/**
 * Map Page E2E Test
 *
 * This test verifies the basic map page functionality:
 * - Map page loads correctly
 * - Page has content and is accessible
 * - Basic page structure is present
 *
 * Test Strategy: Focus on map page structure and basic page presence
 * without testing complex map interactions or location services.
 */
test.describe('Map Page', () => {
  test('should display map page with basic content', async ({ page }) => {
    // Navigate to map page
    await page.goto('/map', { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Wait for page to load
    await page.waitForLoadState('domcontentloaded');

    // Wait a bit more for any dynamic content to load
    await page.waitForTimeout(3000);

    // Check that page loaded (not a 404 or error)
    const hasContent = (await page.locator('div').count()) > 0;
    expect(hasContent).toBeTruthy();

    // Verify page is interactive (has some elements)
    const hasElements = (await page.locator('*').count()) > 10;
    expect(hasElements).toBeTruthy();

    // Check for search input (key map page element)
    const searchInput = page.getByPlaceholder('Search places or notes...');
    await expect(searchInput).toBeVisible();

    // Check for map controls (zoom buttons)
    const zoomInButton = page.getByRole('button', { name: 'Zoom in' });
    await expect(zoomInButton).toBeVisible();

    // Check for location button
    const locationButton = page.getByRole('button', { name: 'Find my location' });
    await expect(locationButton).toBeVisible();
  });
});
