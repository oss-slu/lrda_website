import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createSession } from '../helpers/auth';
import {
  authenticatedGet,
  authenticatedPost,
  unauthenticatedGet,
  unauthenticatedPost,
  crossOriginPost,
} from '../helpers/client';
import {
  seedTestData,
  resetTestData,
  TEST_USER_ID,
  TEST_ADMIN_ID,
} from '../helpers/db-seed';

describe('Auth guards and CSRF protection', () => {
  let userCookie: string;
  let adminCookie: string;

  beforeAll(async () => {
    await seedTestData();
    userCookie = await createSession(TEST_USER_ID);
    adminCookie = await createSession(TEST_ADMIN_ID);
  });

  afterAll(async () => {
    await resetTestData();
  });

  // -- Auth guards --

  it('returns 401 for unauthenticated GET to /api/admin/stats', async () => {
    const res = await unauthenticatedGet('/api/admin/stats');
    expect(res.status).toBe(401);
  });

  it('returns 401 for unauthenticated POST to /api/notes', async () => {
    const res = await unauthenticatedPost('/api/notes', { text: 'test' });
    expect(res.status).toBe(401);
  });

  it('returns 401 for unauthenticated GET to /api/admin/users', async () => {
    const res = await unauthenticatedGet('/api/admin/users');
    expect(res.status).toBe(401);
  });

  it('allows authenticated GET to /api/notes', async () => {
    const res = await authenticatedGet('/api/notes', userCookie);
    expect(res.status).toBe(200);
  });

  it('allows authenticated POST to /api/notes', async () => {
    const res = await authenticatedPost(
      '/api/notes',
      { text: 'Auth guard test note', isPublished: false },
      userCookie,
    );
    expect(res.status).toBe(201);
  });

  // -- Admin access control --

  it('returns 403 for non-admin accessing /api/admin/stats', async () => {
    const res = await authenticatedGet('/api/admin/stats', userCookie);
    expect(res.status).toBe(403);
  });

  it('returns 403 for non-admin accessing /api/admin/users', async () => {
    const res = await authenticatedGet('/api/admin/users', userCookie);
    expect(res.status).toBe(403);
  });

  it('returns 403 for non-admin accessing /api/admin/content-stats', async () => {
    const res = await authenticatedGet('/api/admin/content-stats', userCookie);
    expect(res.status).toBe(403);
  });

  it('allows admin to access /api/admin/stats', async () => {
    const res = await authenticatedGet('/api/admin/stats', adminCookie);
    expect(res.status).toBe(200);
  });

  it('allows admin to access /api/admin/users', async () => {
    const res = await authenticatedGet('/api/admin/users', adminCookie);
    expect(res.status).toBe(200);
  });

  // -- CSRF protection --

  it('rejects cross-origin POST to auth endpoints', async () => {
    const res = await crossOriginPost(
      '/api/auth/sign-in/email',
      { email: 'test@test.com', password: 'test' },
      userCookie,
    );
    // Better Auth should reject cross-origin requests -- must not succeed
    expect(res.ok).toBe(false);
    expect(res.status).toBe(403);
  });

  it('accepts same-origin POST to /api/notes', async () => {
    const res = await authenticatedPost(
      '/api/notes',
      { text: 'Same-origin test', isPublished: false },
      userCookie,
    );
    expect(res.status).toBe(201);
  });
});
