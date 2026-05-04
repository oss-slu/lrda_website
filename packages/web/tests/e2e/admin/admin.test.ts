import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createSession } from '../helpers/auth';
import { authenticatedGet, authenticatedPost, unauthenticatedGet } from '../helpers/client';
import {
  seedTestData,
  resetTestData,
  execute,
  TEST_USER_ID,
  TEST_USER_ID_2,
  TEST_ADMIN_ID,
} from '../helpers/db-seed';

describe('Admin API operations', () => {
  let adminCookie: string;
  let userCookie: string;

  beforeAll(async () => {
    await seedTestData();
    adminCookie = await createSession(TEST_ADMIN_ID);
    userCookie = await createSession(TEST_USER_ID);
  });

  afterAll(async () => {
    await resetTestData();
  });

  // -- Access control --

  it('returns 401 for unauthenticated admin requests', async () => {
    const res = await unauthenticatedGet('/api/admin/stats');
    expect(res.status).toBe(401);
  });

  it('returns 403 for non-admin user', async () => {
    const res = await authenticatedGet('/api/admin/stats', userCookie);
    expect(res.status).toBe(403);
  });

  // -- Stats --

  it('GET /api/admin/stats returns user counts', async () => {
    const res = await authenticatedGet('/api/admin/stats', adminCookie);
    expect(res.status).toBe(200);
    const stats = await res.json();
    expect(stats.totalUsers).toBeGreaterThanOrEqual(4); // at least our test users
    expect(typeof stats.totalAdmins).toBe('number');
    expect(typeof stats.totalInstructors).toBe('number');
    expect(typeof stats.pendingApplications).toBe('number');
  });

  // -- Content stats --

  it('GET /api/admin/content-stats returns note counts', async () => {
    const res = await authenticatedGet('/api/admin/content-stats', adminCookie);
    expect(res.status).toBe(200);
    const stats = await res.json();
    expect(typeof stats.totalNotes).toBe('number');
    expect(typeof stats.publishedNotes).toBe('number');
    expect(typeof stats.notesThisWeek).toBe('number');
    expect(typeof stats.notesThisMonth).toBe('number');
  });

  // -- Recent activity --

  it('GET /api/admin/recent-activity returns recent notes', async () => {
    const res = await authenticatedGet('/api/admin/recent-activity', adminCookie);
    expect(res.status).toBe(200);
    const activity = await res.json();
    expect(Array.isArray(activity)).toBe(true);
    // Seeded data guarantees at least one note exists
    expect(activity.length).toBeGreaterThan(0);
    expect(activity[0]).toHaveProperty('noteId');
    expect(activity[0]).toHaveProperty('title');
    expect(activity[0]).toHaveProperty('creatorName');
    expect(activity[0]).toHaveProperty('isPublished');
  });

  // -- Users list --

  it('GET /api/admin/users returns all users', async () => {
    const res = await authenticatedGet('/api/admin/users', adminCookie);
    expect(res.status).toBe(200);
    const users = await res.json();
    expect(Array.isArray(users)).toBe(true);
    expect(users.length).toBeGreaterThanOrEqual(4);
    // Check expected fields
    const testUser = users.find((u: { id: string }) => u.id === TEST_USER_ID);
    expect(testUser).toBeDefined();
    expect(testUser.name).toBe('Test User');
    expect(testUser.email).toBe('testuser@e2e.test');
  });

  // -- Instructor approval/rejection --

  it('approves an instructor application', async () => {
    // Set up a pending application on TEST_USER_ID_2
    await execute(
      `UPDATE "user" SET pending_instructor_description = $1 WHERE id = $2`,
      'I want to teach religion studies',
      TEST_USER_ID_2,
    );

    // Verify it shows in pending
    const pendingRes = await authenticatedGet('/api/admin/pending-instructors', adminCookie);
    expect(pendingRes.status).toBe(200);
    const pending = await pendingRes.json();
    const application = pending.find((p: { id: string }) => p.id === TEST_USER_ID_2);
    expect(application).toBeDefined();

    // Approve
    const approveRes = await authenticatedPost(
      `/api/admin/approve-instructor/${TEST_USER_ID_2}`,
      {},
      adminCookie,
    );
    expect(approveRes.status).toBe(200);
    const result = await approveRes.json();
    expect(result.success).toBe(true);

    // Reset for next test
    await execute(
      `UPDATE "user" SET is_instructor = FALSE, pending_instructor_description = NULL WHERE id = $1`,
      TEST_USER_ID_2,
    );
  });

  it('rejects an instructor application', async () => {
    // Set up a pending application
    await execute(
      `UPDATE "user" SET pending_instructor_description = $1 WHERE id = $2`,
      'Please approve me',
      TEST_USER_ID_2,
    );

    const rejectRes = await authenticatedPost(
      `/api/admin/reject-instructor/${TEST_USER_ID_2}`,
      { reason: 'Not qualified' },
      adminCookie,
    );
    expect(rejectRes.status).toBe(200);
    const result = await rejectRes.json();
    expect(result.success).toBe(true);

    // Verify application is cleared
    const pendingRes = await authenticatedGet('/api/admin/pending-instructors', adminCookie);
    const pending = await pendingRes.json();
    const cleared = pending.find((p: { id: string }) => p.id === TEST_USER_ID_2);
    expect(cleared).toBeUndefined();
  });

  it('returns 404 when approving user with no pending application', async () => {
    const res = await authenticatedPost(
      `/api/admin/approve-instructor/${TEST_USER_ID}`,
      {},
      adminCookie,
    );
    expect(res.status).toBe(404);
  });
});
