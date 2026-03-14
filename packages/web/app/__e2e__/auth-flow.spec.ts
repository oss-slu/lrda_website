import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import type { Page } from 'playwright';
import { newPage, url } from './helpers/pw';

describe('Auth Flow - Login', () => {
  let page: Page;

  beforeAll(async () => {
    page = await newPage();
  });

  afterAll(async () => {
    await page.context().close();
  });

  test('login form shows error for bad credentials', async () => {
    await page.goto(url('/login'));
    await page.waitForLoadState('networkidle');

    await page.locator('#email').fill('nonexistent@example.com');
    await page.locator('#password').fill('WrongPassword1!');
    // Submit via Enter on password field (reliable across SSR hydration)
    await page.locator('#password').press('Enter');

    // Wait for the submit button to become enabled again (request completed)
    await page.locator('button[type="submit"]:enabled').waitFor({ timeout: 10000 });

    // Should still be on the login page (not redirected to /map)
    expect(page.url()).toMatch(/\/login/);
    expect(page.url()).not.toMatch(/\/map/);

    // Verify an error message is shown to the user
    await page.getByText(/invalid|incorrect|error/i).waitFor({ state: 'visible', timeout: 5000 });
  });

  test('login form has all expected fields and links', async () => {
    await page.goto(url('/login'));

    await page.locator('#email').waitFor({ state: 'visible' });
    await page.locator('#password').waitFor({ state: 'visible' });
    await page.locator('button[type="submit"]').waitFor({ state: 'visible' });
    await page.getByText('Forgot your password?').waitFor({ state: 'visible' });
    await page.getByRole('link', { name: 'Sign up', exact: true }).waitFor({ state: 'visible' });
  });
});

describe('Auth Flow - Signup', () => {
  let page: Page;

  beforeAll(async () => {
    page = await newPage();
  });

  afterAll(async () => {
    await page.context().close();
  });

  test('signup form displays all required fields', async () => {
    await page.goto(url('/signup'));

    await page.getByLabel('First Name').waitFor({ state: 'visible' });
    await page.getByLabel('Last Name').waitFor({ state: 'visible' });
    await page.getByLabel('Email').waitFor({ state: 'visible' });
    await page.getByLabel('Password', { exact: true }).waitFor({ state: 'visible' });
    await page.getByLabel('Confirm Password').waitFor({ state: 'visible' });
    await page.locator('button[type="submit"]').waitFor({ state: 'visible' });
  });

  test('signup form shows password strength indicator on input', async () => {
    await page.goto(url('/signup'));

    const passwordField = page.getByLabel('Password', { exact: true });
    await passwordField.click();
    await passwordField.pressSequentially('weak', { delay: 50 });

    // Strength indicator shows requirement text items
    await page.getByText('At least 8 characters').waitFor({ state: 'visible', timeout: 5000 });
    await page.getByText('One uppercase letter').waitFor({ state: 'visible' });
  });

  test('signup form has role selector with options', async () => {
    await page.goto(url('/signup'));

    const roleSelect = page.locator('button[role="combobox"]').first();
    await roleSelect.waitFor({ state: 'visible' });

    // Wait for the combobox to render its selected value
    await expect
      .poll(() => roleSelect.textContent(), { timeout: 5000 })
      .toContain('None');
  });
});

describe('Auth Flow - Forgot Password', () => {
  let page: Page;

  beforeAll(async () => {
    page = await newPage();
  });

  afterAll(async () => {
    await page.context().close();
  });

  test('forgot password form submits and shows confirmation', async () => {
    await page.goto(url('/forgot-password'));
    await page.waitForLoadState('networkidle');

    await page.locator('#email').fill('test@example.com');
    // Submit via Enter (reliable across SSR hydration)
    await page.locator('#email').press('Enter');

    // After the API responds, the success view shows "Check your email"
    await page.getByText('Check your email').waitFor({ state: 'visible', timeout: 10000 });
  });

  test('forgot password page has back to login link', async () => {
    await page.goto(url('/forgot-password'));
    await page.getByText('Back to login').waitFor({ state: 'visible' });
  });
});

describe('Auth Flow - Reset Password', () => {
  let page: Page;

  beforeAll(async () => {
    page = await newPage();
  });

  afterAll(async () => {
    await page.context().close();
  });

  test('reset password page shows error without token', async () => {
    await page.goto(url('/reset-password'));

    // The page displays "Invalid reset link" when no token is present
    await page.getByText('Invalid reset link').waitFor({ state: 'visible', timeout: 5000 });
    await page.getByText('Back to login').waitFor({ state: 'visible' });
  });

  test('reset password page shows form when token is present', async () => {
    await page.goto(url('/reset-password?token=fake-token-for-testing'));

    // When a token is provided, the page renders the reset form
    // (validation happens on submit, not on page load)
    await page.getByText('Reset your password').waitFor({ state: 'visible', timeout: 5000 });
    await page.locator('#password').waitFor({ state: 'visible' });
    await page.locator('#confirmPassword').waitFor({ state: 'visible' });
  });
});
