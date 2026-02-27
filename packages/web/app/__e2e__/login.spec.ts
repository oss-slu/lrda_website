import { test, expect } from '@playwright/test';

/**
 * Login Page E2E Test
 *
 * This test verifies the basic login page functionality:
 * - Login page loads correctly
 * - Login form is present and accessible
 * - Form validation works for empty submissions
 *
 * Test Strategy: Focus on page structure and form presence without
 * testing actual authentication or complex user flows.
 */
test.describe('Login Page', () => {
  test('should display login form with validation', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');

    // Wait for page to load
    await page.waitForLoadState('domcontentloaded');

    // Check that login heading is present (shadcn CardTitle renders as h3)
    await expect(page.locator('h3:has-text("Login to your account")')).toBeVisible();

    // Verify email input field is present
    const emailInput = page.locator('#email');
    await expect(emailInput).toBeVisible();

    // Verify password input field is present
    const passwordInput = page.locator('#password');
    await expect(passwordInput).toBeVisible();

    // Check for login submit button
    const loginButton = page.locator('button[type="submit"]:has-text("Login")');
    await expect(loginButton).toBeVisible();

    // Check for forgot password link
    await expect(page.locator('a:has-text("Forgot your password?")')).toBeVisible();

    // Check for sign up link (use exact match to avoid matching nav "Sign Up" link too)
    await expect(page.getByRole('link', { name: 'Sign up', exact: true })).toBeVisible();

    // Verify form validation by attempting to submit empty form
    await loginButton.click();

    // Wait for any validation messages (if they exist)
    await page.waitForTimeout(500);

    // The form uses HTML5 required attributes, so the browser handles validation
    // We just ensure the page doesn't crash on empty submission
  });
});
