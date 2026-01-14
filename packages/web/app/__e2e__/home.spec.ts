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

    // Check for splash/hero image (use a more flexible selector)
    const hasImage = (await page.locator('img').count()) > 0;
    expect(hasImage).toBeTruthy();

    // Verify main heading is present
    await expect(page.locator('h1:has-text("Where\'s Religion?")')).toBeVisible();

    // Check for navigation links (use first() to handle multiple matches)
    await expect(page.locator('nav a:has-text("Home")').first()).toBeVisible();
    await expect(page.locator('nav a:has-text("Map")').first()).toBeVisible();
    await expect(page.locator('nav a:has-text("Stories")').first()).toBeVisible();

    // Check for login button
    await expect(page.locator('button:has-text("Login")')).toBeVisible();

    // Verify page has content (generic divs)
    const hasContent = (await page.locator('div').count()) > 0;
    expect(hasContent).toBeTruthy();
  });
});
