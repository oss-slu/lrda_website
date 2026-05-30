import { test, expect } from '@playwright/test';
import { anonPage } from './helpers/pw';
import { getAuthUrl, extractToken, cleanupByEmail } from './helpers/auth-ui';
import { execute } from '../helpers/db-seed';

const API_URL = process.env.__TEST_API_URL || 'http://localhost:3002';
const PREFIX = `fb-sync-e2e-${Date.now()}`;
const INITIAL_PASSWORD = 'OldStr0ng!Pass#1';
const RESET_PASSWORD = 'N3wStr0ng!Pass#2';

async function fbCreateUser(email: string, password: string): Promise<string> {
  const res = await fetch(`${API_URL}/api/test/firebase/create-user`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`Firebase create-user failed: ${await res.text()}`);
  return ((await res.json()) as { uid: string }).uid;
}

async function fbVerifyPassword(email: string, password: string): Promise<boolean> {
  const res = await fetch(`${API_URL}/api/test/firebase/verify-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`Firebase verify-password failed: ${await res.text()}`);
  return ((await res.json()) as { valid: boolean }).valid;
}

async function fbDeleteUser(email: string): Promise<void> {
  await fetch(`${API_URL}/api/test/firebase/user?email=${encodeURIComponent(email)}`, {
    method: 'DELETE',
  });
}

test.describe('Firebase password sync on reset', () => {
  const email = `${PREFIX}@e2e.test`;
  const userId = `e2e-fb-sync-${Date.now()}`;

  test.afterAll(async () => {
    await cleanupByEmail(email);
    await fbDeleteUser(email);
  });

  test('password reset syncs the new password to Firebase', async ({ browser }) => {
    // 1. Create the user in Firebase with the initial password
    await fbCreateUser(email, INITIAL_PASSWORD);

    // 2. Verify the initial password works in Firebase
    const initialValid = await fbVerifyPassword(email, INITIAL_PASSWORD);
    expect(initialValid, 'Initial password should work in Firebase').toBe(true);

    // 3. Seed a matching PostgreSQL user (unverified, no credential account = migrated state)
    await execute(
      `INSERT INTO "user" (id, name, email, email_verified, role, created_at, updated_at)
       VALUES ($1, $2, $3, FALSE, 'user', NOW(), NOW())`,
      userId,
      'Firebase Sync Tester',
      email,
    );

    // 4. Request a password reset via the forgot-password page
    const page = await anonPage(browser);
    await page.goto('/forgot-password');
    await page.waitForLoadState('networkidle');
    await page.getByLabel('Email address').fill(email);
    await page.getByRole('button', { name: /Send reset link/i }).click();
    await expect(page.getByRole('heading', { name: 'Check your email' })).toBeVisible();

    // 5. Use the captured reset token to set the new password
    const resetUrl = await getAuthUrl(email, 'reset-password');
    const resetToken = extractToken(resetUrl);
    expect(resetToken, 'reset token should be in the URL').toBeTruthy();

    await page.goto(`/reset-password?token=${encodeURIComponent(resetToken!)}`);
    await page.waitForLoadState('networkidle');
    await page.locator('#password').fill(RESET_PASSWORD);
    await page.locator('#confirmPassword').fill(RESET_PASSWORD);
    await page.getByRole('button', { name: /^Reset password$/ }).click();
    await expect(page).toHaveURL(/\/login/);

    // 6. Verify the new password works in Firebase and the old one doesn't
    const newValid = await fbVerifyPassword(email, RESET_PASSWORD);
    expect(newValid, 'New password should work in Firebase after reset').toBe(true);

    const oldValid = await fbVerifyPassword(email, INITIAL_PASSWORD);
    expect(oldValid, 'Old password should no longer work in Firebase').toBe(false);

    await page.context().close();
  });
});
