import { test, expect } from '@playwright/test';
import { anonPage } from './helpers/pw';
import { getAuthUrl, extractToken, verifyEmailToken, cleanupByEmail } from './helpers/auth-ui';
import { execute } from '../helpers/db-seed';

const PREFIX = `auth-ui-e2e-${Date.now()}`;
const STRONG_PASSWORD = 'TestStr0ng!Pass#1';
const NEW_PASSWORD = 'N3wStr0ng!Pass#2';

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
      await page.waitForLoadState('networkidle');
      await expect(page.getByText('Create an account')).toBeVisible();
      await page.getByLabel('First Name', { exact: true }).fill('UI');
      await page.getByLabel('Last Name', { exact: true }).fill('Tester');
      await page.getByLabel('Email', { exact: true }).fill(email);
      await page.getByLabel('Password', { exact: true }).fill(STRONG_PASSWORD);
      await page.getByLabel('Confirm Password').fill(STRONG_PASSWORD);
      await page.getByRole('button', { name: /^Sign Up$/ }).click();

      // Lands on the confirm page
      await expect(page).toHaveURL(/\/confirm/);

      // 2. Verify the email using the real token from the dev-mode capture
      const emailUrl = await getAuthUrl(email, 'verification');
      const token = extractToken(emailUrl);
      expect(token, 'verification token should be in the URL').toBeTruthy();
      const verifyRes = await verifyEmailToken(token!);
      expect(verifyRes.ok).toBe(true);

      // 3. Log in through the login form -> lands on /map
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      await page.locator('#email').fill(email);
      await page.locator('#password').fill(STRONG_PASSWORD);
      await page.getByRole('button', { name: /^Login$/ }).click();
      await expect(page).toHaveURL(/\/map/, { timeout: 15000 });

      await page.context().close();
    });
  });

  test.describe('migrated unverified user -> reset password + verify', () => {
    const email = `${PREFIX}-migrate@e2e.test`;
    const userId = `e2e-ui-migrate-${Date.now()}`;

    test.afterAll(async () => {
      await cleanupByEmail(email);
    });

    test('forces password reset then email verification before login', async ({ browser }) => {
      // Seed a pre-existing, UNVERIFIED user with no credential account (migrated state)
      await execute(
        `INSERT INTO "user" (id, name, email, email_verified, role, created_at, updated_at)
         VALUES ($1, $2, $3, FALSE, 'user', NOW(), NOW())`,
        userId,
        'Migrate UI User',
        email,
      );

      const page = await anonPage(browser);

      // 1. Login attempt (no password set) -> migration detected -> "set a new password"
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      await page.locator('#email').fill(email);
      await page.locator('#password').fill('placeholder-not-a-real-password');
      await page.getByRole('button', { name: /^Login$/ }).click();
      await expect(page.getByText('Welcome back!')).toBeVisible();
      await page.getByRole('button', { name: /Set up your password/i }).click();

      // 2. Routed to forgot-password (email prefilled) -> request the reset link
      await expect(page).toHaveURL(/\/forgot-password/);
      await page.getByRole('button', { name: /Send reset link/i }).click();
      await expect(page.getByRole('heading', { name: 'Check your email' })).toBeVisible();

      // 3. Set a new password via the reset form (token from the captured reset email)
      const resetUrl = await getAuthUrl(email, 'reset-password');
      const resetToken = extractToken(resetUrl);
      expect(resetToken, 'reset token should be in the URL').toBeTruthy();
      await page.goto(`/reset-password?token=${encodeURIComponent(resetToken!)}`);
      await page.waitForLoadState('networkidle');
      await page.locator('#password').fill(NEW_PASSWORD);
      await page.locator('#confirmPassword').fill(NEW_PASSWORD);
      await page.getByRole('button', { name: /^Reset password$/ }).click();
      await expect(page).toHaveURL(/\/login/);

      // 4. Login with the new password -> still unverified -> routed to /confirm
      await expect(page.getByRole('heading', { name: 'Login to your account' })).toBeVisible();
      await page.locator('#email').fill(email);
      await page.locator('#password').fill(NEW_PASSWORD);
      await page.getByRole('button', { name: /^Login$/ }).click();
      await expect(page).toHaveURL(/\/confirm/);
      await expect(page.getByRole('heading', { name: 'Verify your email' })).toBeVisible();

      // 5. Send + verify the email, then log in successfully -> /map
      // (/confirm with sent=false shows "Send verification email"; the
      // "Resend..." button only appears after the first send)
      await page.getByRole('button', { name: 'Send verification email', exact: true }).click();
      const verifyUrl = await getAuthUrl(email, 'verification');
      const verifyToken = extractToken(verifyUrl);
      expect(verifyToken, 'verification token should be in the URL').toBeTruthy();
      const verifyRes = await verifyEmailToken(verifyToken!);
      expect(verifyRes.ok).toBe(true);

      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      await page.locator('#email').fill(email);
      await page.locator('#password').fill(NEW_PASSWORD);
      await page.getByRole('button', { name: /^Login$/ }).click();
      await expect(page).toHaveURL(/\/map/, { timeout: 15000 });

      await page.context().close();
    });
  });

  test('login with wrong credentials does not authenticate', async ({ browser }) => {
    const page = await anonPage(browser);
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.locator('#email').fill('nobody@e2e.test');
    await page.locator('#password').fill('WrongPass#123');
    const signIn = page.waitForResponse(r => r.url().includes('/api/auth/sign-in'));
    await page.getByRole('button', { name: /^Login$/ }).click();
    await signIn;
    // A failed login must not navigate into the app -- stays on /login
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: 'Login to your account' })).toBeVisible();
    await page.context().close();
  });
});
