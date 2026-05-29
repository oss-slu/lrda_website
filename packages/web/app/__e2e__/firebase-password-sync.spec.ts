import { test, expect } from '@playwright/test';
import { anonPage } from './helpers/pw';
import { getAuthUrl, extractToken, cleanupByEmail } from './helpers/auth-ui';
import { execute } from '../../tests/e2e/helpers/db-seed';

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

async function fbPasswordHash(email: string): Promise<string | null> {
  const res = await fetch(
    `${API_URL}/api/test/firebase/password-hash?email=${encodeURIComponent(email)}`,
  );
  if (!res.ok) throw new Error(`Firebase password-hash failed: ${await res.text()}`);
  return ((await res.json()) as { passwordHash: string | null }).passwordHash;
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

    // 2. Seed a matching PostgreSQL user (unverified, no credential account = migrated state)
    await execute(
      `INSERT INTO "user" (id, name, email, email_verified, role, created_at, updated_at)
       VALUES ($1, $2, $3, FALSE, 'user', NOW(), NOW())`,
      userId,
      'Firebase Sync Tester',
      email,
    );

    // 3. Record the Firebase password hash before reset
    const hashBefore = await fbPasswordHash(email);
    expect(hashBefore, 'Firebase user should have a password hash').toBeTruthy();

    // 4. Request a password reset via the forgot-password page
    const page = await anonPage(browser);
    await page.goto('/forgot-password');
    await page.waitForLoadState('networkidle');
    await page.getByLabel('Email').fill(email);
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

    // 6. Verify that the Firebase password hash changed
    const hashAfter = await fbPasswordHash(email);
    expect(hashAfter, 'Firebase password hash should still exist').toBeTruthy();
    expect(hashAfter).not.toBe(hashBefore);

    await page.context().close();
  });
});
