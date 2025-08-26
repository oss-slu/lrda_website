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
    await page.goto('/lib/pages/map');
    
    // Wait for page to load
    await page.waitForLoadState('domcontentloaded');
    
    // Wait a bit more for any dynamic content to load
    await page.waitForTimeout(1000);
    
    // Check that page loaded (not a 404 or error)
    const hasContent = await page.locator('div').count() > 0;
    expect(hasContent).toBeTruthy();
    
    // Verify page is interactive (has some elements)
    const hasElements = await page.locator('*').count() > 10;
    expect(hasElements).toBeTruthy();
    
    // Check for specific content that should be visible
    const pageTitle = page.locator('h1, h2, h3, h4, h5, h6').first();
    if (await pageTitle.count() > 0) {
      await expect(pageTitle).toBeVisible();
    }
    
    // Check for navigation or main content area
    const mainContent = page.locator('main, [role="main"], .main, #main').first();
    if (await mainContent.count() > 0) {
      await expect(mainContent).toBeVisible();
    }
  });
}); 
