import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestApp, request, createAuthenticatedUser, cleanupUser } from './helpers';
import { db } from '../db';
import { note } from '../db/schema';
import { eq } from 'drizzle-orm';

describe('Security: Note Access Control (H1, H2)', () => {
  let app: ReturnType<typeof createTestApp>;
  let userA: Awaited<ReturnType<typeof createAuthenticatedUser>>;
  let userB: Awaited<ReturnType<typeof createAuthenticatedUser>>;
  let publishedNoteId: string;
  let draftNoteId: string;

  beforeAll(async () => {
    app = createTestApp();
    userA = await createAuthenticatedUser(app, { name: 'User A' });
    userB = await createAuthenticatedUser(app, { name: 'User B' });

    // Create a published note by userA
    const pubRes = await request(app, 'POST', '/api/notes', {
      headers: userA.headers,
      body: {
        title: 'Published Note',
        text: 'This is published',
        isPublished: true,
      },
    });
    publishedNoteId = (pubRes.json as { id: string }).id;

    // Create a draft note by userA
    const draftRes = await request(app, 'POST', '/api/notes', {
      headers: userA.headers,
      body: {
        title: 'Draft Note',
        text: 'This is a draft',
        isPublished: false,
      },
    });
    draftNoteId = (draftRes.json as { id: string }).id;
  });

  afterAll(async () => {
    await db.delete(note).where(eq(note.id, publishedNoteId)).catch(() => {});
    await db.delete(note).where(eq(note.id, draftNoteId)).catch(() => {});
    await cleanupUser(userA.userId);
    await cleanupUser(userB.userId);
  });

  describe('H1: GET /notes/:id access control', () => {
    it('should return published note to unauthenticated user', async () => {
      const res = await request(app, 'GET', `/api/notes/${publishedNoteId}`);
      expect(res.status).toBe(200);
    });

    it('should return draft note to its creator', async () => {
      const res = await request(app, 'GET', `/api/notes/${draftNoteId}`, {
        headers: userA.headers,
      });
      expect(res.status).toBe(200);
    });

    it('should NOT return draft note to unauthenticated user', async () => {
      const res = await request(app, 'GET', `/api/notes/${draftNoteId}`);
      expect(res.status).toBe(404);
    });

    it('should NOT return draft note to a different authenticated user', async () => {
      const res = await request(app, 'GET', `/api/notes/${draftNoteId}`, {
        headers: userB.headers,
      });
      expect(res.status).toBe(404);
    });
  });

  describe('H2: GET /notes?creatorId access control', () => {
    it('should return only published notes when unauthenticated', async () => {
      const res = await request(app, 'GET', `/api/notes?creatorId=${userA.userId}`);
      expect(res.status).toBe(200);

      const notes = res.json as Array<{ id: string; isPublished: boolean }>;
      expect(notes.every(n => n.isPublished === true)).toBe(true);
      expect(notes.find(n => n.id === draftNoteId)).toBeUndefined();
      expect(notes.find(n => n.id === publishedNoteId)).toBeDefined();
    });

    it('should return all notes (including drafts) to the creator', async () => {
      const res = await request(app, 'GET', `/api/notes?creatorId=${userA.userId}`, {
        headers: userA.headers,
      });
      expect(res.status).toBe(200);

      const notes = res.json as Array<{ id: string }>;
      expect(notes.find(n => n.id === publishedNoteId)).toBeDefined();
      expect(notes.find(n => n.id === draftNoteId)).toBeDefined();
    });

    it('should return only published notes to a different authenticated user', async () => {
      const res = await request(app, 'GET', `/api/notes?creatorId=${userA.userId}`, {
        headers: userB.headers,
      });
      expect(res.status).toBe(200);

      const notes = res.json as Array<{ id: string; isPublished: boolean }>;
      expect(notes.every(n => n.isPublished === true)).toBe(true);
      expect(notes.find(n => n.id === draftNoteId)).toBeUndefined();
    });
  });
});
