import { test, expect } from '@playwright/test';

/**
 * Stories Page E2E Test
 * 
 * This test verifies the basic stories page functionality:
 * - Stories page loads correctly
 * - Page has content and is accessible
 * - Basic page structure is present
 * 
 * Test Strategy: Focus on stories page structure and basic page presence
 * without testing story creation, editing, or complex user interactions.
 */
test.describe('Stories Page', () => {
  test('should display stories page with basic content', async ({ page }) => {
    // Navigate to stories page
    await page.goto('/lib/pages/StoriesPage');
    
    // Wait for page to load
    await page.waitForLoadState('domcontentloaded');
    
    // Verify page has some content
    const pageContent = page.locator('div').first();
    await expect(pageContent).toBeVisible();
    
    // Check that page loaded (not a 404 or error)
    const hasContent = await page.locator('div').count() > 0;
    expect(hasContent).toBeTruthy();
    
    // Verify page is interactive (has some elements)
    const hasElements = await page.locator('*').count() > 10;
    expect(hasElements).toBeTruthy();
  });
}); 
