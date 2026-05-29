import { test, expect } from '@playwright/test';
import { anonPage } from './helpers/pw';
import { getLastEmailUrl, extractToken, verifyEmailToken, cleanupByEmail } from './helpers/auth-ui';

const PREFIX = `auth-ui-e2e-${Date.now()}`;
const STRONG_PASSWORD = 'TestStr0ng!Pass#1';

test.describe('Auth pages (UI)', () => {
  test('unauthenticated visit to a protected route redirects to /login', async ({ browser }) => {
    const page = await anonPage(browser);
    await page.goto('/notes');
    await expect(page).toHaveURL(/\/login/);
    await page.context().close();
  });

  test.describe('signup -> verify -> login through the UI', () => {
    const email = `${PREFIX}-signup@e2e.test`;

    test.afterAll(async () => {
      await cleanupByEmail(email);
    });

    test('completes the full flow', async ({ browser }) => {
      const page = await anonPage(browser);

      // 1. Sign up via the signup form (role defaults to 'none')
      await page.goto('/signup');
      await expect(page.getByText('Create an account')).toBeVisible();
      await page.getByPlaceholder('John').fill('UI');
      await page.getByPlaceholder('Doe').fill('Tester');
      await page.getByPlaceholder('john@example.com').fill(email);
      await page.getByPlaceholder('Enter password', { exact: true }).fill(STRONG_PASSWORD);
      await page.getByPlaceholder('Confirm password').fill(STRONG_PASSWORD);
      await page.getByRole('button', { name: /^Sign Up$/ }).click();

      // Lands on the confirm page
      await expect(page).toHaveURL(/\/confirm/);

      // 2. Verify the email using the real token from the dev-mode capture
      const emailUrl = await getLastEmailUrl();
      expect(emailUrl, 'verification email URL should be captured').toBeTruthy();
      const token = extractToken(emailUrl!);
      expect(token, 'verification token should be in the URL').toBeTruthy();
      const verifyRes = await verifyEmailToken(token!);
      expect(verifyRes.ok).toBe(true);

      // 3. Log in through the login form -> lands on /map
      await page.goto('/login');
      await page.locator('#email').fill(email);
      await page.locator('#password').fill(STRONG_PASSWORD);
      await page.getByRole('button', { name: /^Login$/ }).click();
      await expect(page).toHaveURL(/\/map/);

      await page.context().close();
    });
  });

  test('login with wrong credentials shows an error and stays on /login', async ({ browser }) => {
    const page = await anonPage(browser);
    await page.goto('/login');
    await page.locator('#email').fill('nobody@e2e.test');
    await page.locator('#password').fill('WrongPass#123');
    await page.getByRole('button', { name: /^Login$/ }).click();
    await expect(page.getByText(/invalid user credentials/i)).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
    await page.context().close();
  });
});
