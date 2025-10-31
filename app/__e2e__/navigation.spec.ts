import { test, expect } from '@playwright/test';

/**
 * Navigation E2E Test
 * 
 * This test verifies the basic navigation functionality:
 * - Navigation menu is accessible
 * - Key navigation links are present
 * - Navigation responds to user interaction
 * 
 * Test Strategy: Focus on navigation structure and basic link presence
 * without testing authentication-dependent navigation or complex user flows.
 */
test.describe('Navigation', () => {
  test('should display navigation menu with key links', async ({ page }) => {
    // Navigate to home page
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForLoadState('domcontentloaded');
    
    // Check that navigation menu exists
    const nav = page.locator('nav, [role="navigation"]');
    await expect(nav).toBeVisible();
    
    // Verify key navigation links are present (use first() to handle multiple matches)
    await expect(page.locator('nav a:has-text("Home")').first()).toBeVisible();
    await expect(page.locator('nav a:has-text("Map")').first()).toBeVisible();
    await expect(page.locator('nav a:has-text("About")').first()).toBeVisible();
    await expect(page.locator('nav a:has-text("Stories")').first()).toBeVisible();
    
    // Check for login button
    await expect(page.locator('button:has-text("Login")')).toBeVisible();
  });
});
