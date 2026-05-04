import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestApp, request, createAuthenticatedUser, cleanupUser } from './helpers';
import { db } from '../db';
import { user } from '../db/schema';
import { eq } from 'drizzle-orm';

describe('Security: Privilege Escalation (C1)', () => {
  let app: ReturnType<typeof createTestApp>;
  let authUser: Awaited<ReturnType<typeof createAuthenticatedUser>>;

  beforeAll(async () => {
    app = createTestApp();
    authUser = await createAuthenticatedUser(app, {
      name: 'Escalation Test User',
    });
  });

  afterAll(async () => {
    await cleanupUser(authUser.userId);
  });

  it('PATCH /users/me with isInstructor=true should NOT change isInstructor', async () => {
    const res = await request(app, 'PATCH', '/api/users/me', {
      headers: authUser.headers,
      body: { isInstructor: true },
    });

    // The API silently ignores disallowed fields and returns 200.
    // The security property is verified by the DB check below, not the status code.
    expect(res.status).toBe(200);

    const dbUser = await db.query.user.findFirst({
      where: eq(user.id, authUser.userId),
    });

    expect(dbUser?.isInstructor).toBe(false);
  });

  it('PATCH /users/me with normal fields should still work', async () => {
    const res = await request(app, 'PATCH', '/api/users/me', {
      headers: authUser.headers,
      body: { name: 'Updated Name' },
    });

    expect(res.status).toBe(200);

    const json = res.json as { name: string };
    expect(json.name).toBe('Updated Name');
  });
});
