import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { createTestApp, request } from './helpers';
import { db } from '../db';
import { user } from '../db/schema';
import { eq } from 'drizzle-orm';

describe('User routes', () => {
  let app: ReturnType<typeof createTestApp>;

  beforeAll(() => {
    app = createTestApp();
  });

  describe('GET /api/users/instructors', () => {
    it('should return instructor list', async () => {
      const res = await request(app, 'GET', '/api/users/instructors');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.json)).toBe(true);
    });

    it('should return list of instructors', async () => {
      // Use unique IDs to avoid conflicts with stale data from prior runs
      const uniqueId = `test-instructor-${Date.now()}`;
      const testInstructor = {
        id: uniqueId,
        name: 'Test Instructor',
        email: `instructor-${Date.now()}@test.com`,
        emailVerified: true,
        isInstructor: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.insert(user).values(testInstructor).onConflictDoNothing();

      const res = await request(app, 'GET', '/api/users/instructors');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.json)).toBe(true);

      const instructors = res.json as Array<{ id: string; name: string }>;
      const found = instructors.find(i => i.id === testInstructor.id);
      expect(found).toBeDefined();
      expect(found?.name).toBe('Test Instructor');

      // Cleanup
      await db.delete(user).where(eq(user.id, testInstructor.id));
    });
  });

  describe('GET /api/users/me', () => {
    it('should return 401 when not authenticated', async () => {
      const res = await request(app, 'GET', '/api/users/me');

      expect(res.status).toBe(401);
      expect(res.json).toMatchObject({
        error: 'Unauthorized',
      });
    });
  });

  describe('GET /api/users/:id', () => {
    it('should return user by id', async () => {
      // Use unique IDs to avoid conflicts with stale data from prior runs
      const uniqueId = `test-user-${Date.now()}`;
      const testUser = {
        id: uniqueId,
        name: 'Test User',
        email: `testuser-${Date.now()}@test.com`,
        emailVerified: false,
        isInstructor: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.insert(user).values(testUser).onConflictDoNothing();

      const res = await request(app, 'GET', `/api/users/${uniqueId}`);

      expect(res.status).toBe(200);
      expect(res.json).toMatchObject({
        id: uniqueId,
        name: 'Test User',
      });

      // Verify email is NOT exposed on public endpoint
      expect(res.json).not.toHaveProperty('email');

      // Cleanup
      await db.delete(user).where(eq(user.id, testUser.id));
    });

    it('should return 404 for non-existent user', async () => {
      const res = await request(app, 'GET', '/api/users/non-existent-id');

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/users/me', () => {
    it('should return 401 when not authenticated', async () => {
      const res = await request(app, 'PATCH', '/api/users/me', {
        body: { name: 'New Name' },
      });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/users/:id/students', () => {
    it('should return 401 when not authenticated', async () => {
      const res = await request(app, 'GET', '/api/users/some-id/students');

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/users/me/instructor', () => {
    it('should return 401 when not authenticated', async () => {
      const res = await request(app, 'POST', '/api/users/me/instructor', {
        body: { instructorId: 'some-instructor-id' },
      });

      expect(res.status).toBe(401);
    });
  });
});
