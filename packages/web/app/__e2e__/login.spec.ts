import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
  test('displays login form with expected fields', async ({ page }) => {
    await page.goto('/login');

    await expect(page.locator('h3:has-text("Login to your account")')).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('button[type="submit"]:has-text("Login")')).toBeVisible();
    await expect(page.locator('a:has-text("Forgot your password?")')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sign up', exact: true })).toBeVisible();
  });
});
