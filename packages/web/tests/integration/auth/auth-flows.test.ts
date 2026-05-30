import { describe, it, expect, afterAll } from 'vitest';
import { unauthenticatedPost, unauthenticatedGet } from '../../helpers/client';
import { queryOne, execute } from '../../helpers/db-seed';

// Unique prefix per test run to avoid email collisions
const PREFIX = `auth-e2e-${Date.now()}`;
const STRONG_PASSWORD = 'TestStr0ng!Pass#1';
const NEW_PASSWORD = 'N3wStr0ng!Pass#2';
const WEAK_PASSWORD = 'weak';

// Track emails for cleanup
const createdEmails: string[] = [];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function signup(email: string, password: string, name = 'E2E Auth Test') {
  createdEmails.push(email);
  return unauthenticatedPost('/api/auth/sign-up/email', { email, password, name });
}

async function signin(email: string, password: string) {
  return unauthenticatedPost('/api/auth/sign-in/email', { email, password });
}

/**
 * Get the URL from the most recent dev-mode email (verification or reset).
 * Better Auth uses JWT tokens passed via email URLs, not stored in the DB.
 * The test endpoint captures these in dev mode.
 */
async function getLastEmailUrl(): Promise<string | null> {
  const API_URL = process.env.__TEST_API_URL || 'http://localhost:3002';
  const res = await fetch(`${API_URL}/api/test/last-email-url`);
  if (!res.ok) return null;
  const data = await res.json();
  return data.url ?? null;
}

/** Extract a query parameter from a URL string. */
function extractToken(emailUrl: string, param = 'token'): string | null {
  try {
    const url = new URL(emailUrl);
    return url.searchParams.get(param);
  } catch {
    return null;
  }
}

async function verifyEmailViaUrl(emailUrl: string) {
  // The verification URL points to the web app, but the actual verification
  // happens via the API. Extract the token and call the API directly.
  const token = extractToken(emailUrl);
  if (!token) throw new Error('No token found in verification URL');
  return unauthenticatedGet(`/api/auth/verify-email?token=${encodeURIComponent(token)}`);
}

async function forgotPassword(email: string) {
  return unauthenticatedPost('/api/auth/request-password-reset', {
    email,
    redirectTo: 'http://localhost:3000/reset-password',
  });
}

async function resetPassword(token: string, newPassword: string) {
  return unauthenticatedPost('/api/auth/reset-password', { token, newPassword });
}

/**
 * Sign up and verify email via the actual verification URL.
 * Better Auth sends a JWT token in the verification email URL;
 * we capture it via the test endpoint.
 */
async function signupAndVerify(email: string, password = STRONG_PASSWORD) {
  const res = await signup(email, password);
  expect(res.status).toBe(200);

  const emailUrl = await getLastEmailUrl();
  expect(emailUrl, 'verification email URL should be captured').toBeTruthy();

  await verifyEmailViaUrl(emailUrl!);
}

/** Delete all data for a user by email. */
async function cleanupByEmail(email: string) {
  const row = await queryOne<{ id: string }>(`SELECT id FROM "user" WHERE email = $1`, email);
  if (!row) return;
  const id = row.id;
  await execute(`DELETE FROM "session" WHERE user_id = $1`, id);
  await execute(`DELETE FROM "account" WHERE user_id = $1`, id);
  await execute(`DELETE FROM "verification" WHERE identifier = $1`, email);
  await execute(`DELETE FROM "user" WHERE id = $1`, id);
}

afterAll(async () => {
  for (const email of createdEmails) {
    await cleanupByEmail(email).catch(() => {});
  }
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Full signup -> email verification -> login', () => {
  const email = `${PREFIX}-signup@e2e.test`;

  it('signup succeeds, login fails before verification, succeeds after', async () => {
    // 1. Sign up
    const signupRes = await signup(email, STRONG_PASSWORD);
    expect(signupRes.status).toBe(200);

    // 2. Login should fail -- email not verified
    const failRes = await signin(email, STRONG_PASSWORD);
    expect(failRes.ok).toBe(false);

    // 3. Grab verification URL from the dev-mode email capture
    const emailUrl = await getLastEmailUrl();
    expect(emailUrl, 'verification email URL should be captured').toBeTruthy();

    // 4. Verify email via the token in the URL
    await verifyEmailViaUrl(emailUrl!);

    // 5. Login succeeds now
    const successRes = await signin(email, STRONG_PASSWORD);
    expect(successRes.status).toBe(200);
    const body = await successRes.json();
    expect(body.user).toBeDefined();
    expect(body.user.email).toBe(email);
  });
});

describe('Weak password rejected at signup', () => {
  it('returns 400 for a weak password', async () => {
    const email = `${PREFIX}-weak@e2e.test`;
    const res = await signup(email, WEAK_PASSWORD);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Password too weak');
  });
});

describe('Forgot password -> reset -> login with new password', () => {
  const email = `${PREFIX}-reset@e2e.test`;

  it('resets password and authenticates with the new one', async () => {
    // Setup: create a verified user
    await signupAndVerify(email, STRONG_PASSWORD);

    // Confirm original password works
    const loginRes = await signin(email, STRONG_PASSWORD);
    expect(loginRes.status).toBe(200);

    // 1. Request password reset
    const forgotRes = await forgotPassword(email);
    expect(forgotRes.ok).toBe(true);

    // 2. Grab reset token from the dev-mode email capture
    const emailUrl = await getLastEmailUrl();
    expect(emailUrl, 'reset email URL should be captured').toBeTruthy();
    const token = extractToken(emailUrl!);
    expect(token, 'reset token should be in URL').toBeTruthy();

    // 3. Reset to new password
    const resetRes = await resetPassword(token!, NEW_PASSWORD);
    expect(resetRes.ok).toBe(true);

    // 4. Old password no longer works
    const oldRes = await signin(email, STRONG_PASSWORD);
    expect(oldRes.ok).toBe(false);

    // 5. New password works
    const newRes = await signin(email, NEW_PASSWORD);
    expect(newRes.status).toBe(200);
    const body = await newRes.json();
    expect(body.user).toBeDefined();
  });
});

describe('Firebase migration -> password setup', () => {
  const email = `${PREFIX}-migrate@e2e.test`;
  const userId = `e2e-migrate-${Date.now()}`;

  afterAll(async () => {
    await execute(`DELETE FROM "session" WHERE user_id = $1`, userId);
    await execute(`DELETE FROM "account" WHERE user_id = $1`, userId);
    await execute(`DELETE FROM "verification" WHERE identifier = $1`, email);
    await execute(`DELETE FROM "user" WHERE id = $1`, userId);
  });

  it('detects migrated user, sets password via reset, then logs in', async () => {
    // 1. Insert a Firebase-style user: verified email, no credential account
    await execute(
      `INSERT INTO "user" (id, name, email, email_verified, role, created_at, updated_at)
       VALUES ($1, $2, $3, TRUE, 'user', NOW(), NOW())`,
      userId,
      'Migration Test User',
      email,
    );
    createdEmails.push(email);

    // 2. Migration status returns needsPasswordReset: true
    const statusRes = await unauthenticatedPost('/api/auth/migration-status', { email });
    expect(statusRes.status).toBe(200);
    const status = await statusRes.json();
    expect(status.needsPasswordReset).toBe(true);

    // 3. Request forgot-password (this is the migration entry point)
    const forgotRes = await forgotPassword(email);
    expect(forgotRes.ok).toBe(true);

    // 4. Grab reset token from the dev-mode email capture
    const emailUrl = await getLastEmailUrl();
    expect(emailUrl, 'reset email URL should be captured for migrated user').toBeTruthy();
    const token = extractToken(emailUrl!);
    expect(token, 'reset token should be in URL').toBeTruthy();

    // 5. Set password
    const resetRes = await resetPassword(token!, STRONG_PASSWORD);
    expect(resetRes.ok).toBe(true);

    // 6. Login works
    const loginRes = await signin(email, STRONG_PASSWORD);
    expect(loginRes.status).toBe(200);
    const body = await loginRes.json();
    expect(body.user).toBeDefined();

    // 7. Migration status now returns false
    const statusRes2 = await unauthenticatedPost('/api/auth/migration-status', { email });
    const status2 = await statusRes2.json();
    expect(status2.needsPasswordReset).toBe(false);
  });
});

describe('Weak password rejected on reset', () => {
  const email = `${PREFIX}-weakreset@e2e.test`;

  it('returns 400 when resetting with a weak password', async () => {
    await signupAndVerify(email, STRONG_PASSWORD);

    const forgotRes = await forgotPassword(email);
    expect(forgotRes.ok).toBe(true);

    const emailUrl = await getLastEmailUrl();
    expect(emailUrl, 'reset email URL should be captured').toBeTruthy();
    const token = extractToken(emailUrl!);
    expect(token).toBeTruthy();

    const resetRes = await resetPassword(token!, WEAK_PASSWORD);
    expect(resetRes.status).toBe(400);
    const body = await resetRes.json();
    expect(body.error).toBe('Password too weak');
  });
});
