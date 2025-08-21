import { test, expect } from '@playwright/test';

/**
 * Home Page E2E Test
 * 
 * This test verifies the basic functionality of the home page:
 * - Page loads successfully
 * - Main navigation elements are visible
 * - Key content sections are displayed
 * 
 * Test Strategy: Minimal, focused testing of core home page functionality
 * without complex user interactions or authentication requirements.
 */
test.describe('Home Page', () => {
  test('should display home page with main navigation and content', async ({ page }) => {
    // Navigate to home page
    await page.goto('/');
    
    // Wait for page to load completely
    await page.waitForLoadState('networkidle');
    
    // Check that main navigation elements are visible
    await expect(page.locator('nav')).toBeVisible();
    
    // Check for splash/hero image
    await expect(page.locator('img[alt="Background Image"]')).toBeVisible();
    
    // Verify main heading is present
    await expect(page.locator('h1:has-text("Where\'s Religion?")')).toBeVisible();
    
    // Check for navigation links
    await expect(page.locator('a:has-text("Home")')).toBeVisible();
    await expect(page.locator('a:has-text("Map")')).toBeVisible();
    await expect(page.locator('a:has-text("About")')).toBeVisible();
    await expect(page.locator('a:has-text("Stories")')).toBeVisible();
    
    // Check for login button
    await expect(page.locator('button:has-text("Login")')).toBeVisible();
    
    // Verify page has content (generic divs)
    const hasContent = await page.locator('div').count() > 0;
    expect(hasContent).toBeTruthy();
  });
});
