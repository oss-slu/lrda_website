import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestApp, request, createAuthenticatedUser, cleanupUser } from './helpers';
import { db } from '../db';
import { user } from '../db/schema';
import { eq } from 'drizzle-orm';

describe('Security: User Data Exposure (H3) and Limit Validation (M3)', () => {
  let app: ReturnType<typeof createTestApp>;
  let authUser: Awaited<ReturnType<typeof createAuthenticatedUser>>;
  let instructorId: string;

  beforeAll(async () => {
    app = createTestApp();
    authUser = await createAuthenticatedUser(app, { name: 'Data Test User' });

    // Create an instructor directly in the DB for the instructors endpoint test
    instructorId = `test-instructor-${Date.now()}`;
    await db
      .insert(user)
      .values({
        id: instructorId,
        name: 'Test Instructor',
        email: `instructor-${Date.now()}@test.com`,
        emailVerified: true,
        isInstructor: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoNothing();
  });

  afterAll(async () => {
    await cleanupUser(authUser.userId);
    await db.delete(user).where(eq(user.id, instructorId));
  });

  describe('H3: Email exposure on public endpoints', () => {
    it('GET /users/:id should NOT expose email to unauthenticated users', async () => {
      const res = await request(app, 'GET', `/api/users/${authUser.userId}`);
      expect(res.status).toBe(200);

      const json = res.json as Record<string, unknown>;
      expect(json).not.toHaveProperty('email');
      expect(json).toHaveProperty('name');
      expect(json).toHaveProperty('id');
    });

    it('GET /users/instructors should NOT expose email', async () => {
      const res = await request(app, 'GET', '/api/users/instructors');
      expect(res.status).toBe(200);

      const instructors = res.json as Array<Record<string, unknown>>;
      for (const instructor of instructors) {
        expect(instructor).not.toHaveProperty('email');
      }
    });

    it('GET /users/me should expose email to the authenticated user', async () => {
      const res = await request(app, 'GET', '/api/users/me', {
        headers: authUser.headers,
      });
      expect(res.status).toBe(200);

      const json = res.json as Record<string, unknown>;
      expect(json).toHaveProperty('email');
      expect(json.email).toBe(authUser.email);
    });
  });

  describe('M3: Limit/offset validation', () => {
    it('GET /notes?limit=999999 should be rejected', async () => {
      const res = await request(app, 'GET', '/api/notes?limit=999999');
      expect(res.status).toBe(400);
    });

    it('GET /notes?limit=abc should return 400', async () => {
      const res = await request(app, 'GET', '/api/notes?limit=abc');
      expect(res.status).toBe(400);
    });

    it('GET /notes?limit=-1 should return 400', async () => {
      const res = await request(app, 'GET', '/api/notes?limit=-1');
      expect(res.status).toBe(400);
    });

    it('GET /notes?limit=20 should work normally', async () => {
      const res = await request(app, 'GET', '/api/notes?limit=20');
      expect(res.status).toBe(200);
    });

    it('GET /notes without limit should use default and return 200', async () => {
      const res = await request(app, 'GET', '/api/notes');
      expect(res.status).toBe(200);
    });
  });
});
