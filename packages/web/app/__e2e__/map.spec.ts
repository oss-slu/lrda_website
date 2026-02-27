import { test, expect } from '@playwright/test';

/**
 * Map Page E2E Test
 *
 * This test verifies the basic map page functionality:
 * - Map page loads correctly
 * - Search bar is visible
 * - Map controls (zoom, location) are present
 *
 * Test Strategy: Focus on map page structure and control presence
 * without testing complex map interactions or location services.
 * Note: Google Maps API must be available for full rendering.
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

    // Check for search input
    const searchInput = page.getByPlaceholder('Search notes...');
    await expect(searchInput).toBeVisible();

    // Check for zoom controls (buttons with title attributes)
    const zoomInButton = page.locator('button[title="Zoom in"]');
    await expect(zoomInButton).toBeVisible();

    const zoomOutButton = page.locator('button[title="Zoom out"]');
    await expect(zoomOutButton).toBeVisible();

    // Check for location button
    const locationButton = page.locator('button[title="Find my location"]');
    await expect(locationButton).toBeVisible();
  });
});
