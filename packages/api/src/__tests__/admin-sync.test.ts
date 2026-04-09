import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest';
import { eq } from 'drizzle-orm';
import { createTestApp, createAuthenticatedUser, cleanupUser, request } from './helpers';
import { db } from '../db';
import { user, syncRun, syncRunDetail } from '../db/schema';

// Mock global fetch to intercept RERUM API calls
const originalFetch = globalThis.fetch;

function mockRerumFetch(notes: object[] = []) {
  globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input.toString();

    if (url.includes('query')) {
      return new Response(JSON.stringify(notes), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return originalFetch(input);
  }) as typeof fetch;
}

// Sample RERUM notes for testing
const MOCK_RERUM_NOTES = [
  {
    '@id': 'https://lived-religion-dev.rerum.io/deer-lr/id/test-note-1',
    type: 'message',
    title: 'Test Note 1',
    BodyText: 'This is a test note from RERUM',
    creator: 'test-sync-admin',
    latitude: '38.6270',
    longitude: '-90.1994',
    published: false,
    tags: ['religion', 'test'],
    media: [],
    audio: [],
    time: '2026-01-15T12:00:00Z',
    __rerum: {
      createdAt: '2026-01-15T12:00:00Z',
      modifiedAt: '2026-04-01T12:00:00Z',
    },
  },
  {
    '@id': 'https://lived-religion-dev.rerum.io/deer-lr/id/test-note-2',
    type: 'message',
    title: 'Test Note 2',
    BodyText: 'Another test note with media',
    creator: 'test-sync-admin',
    latitude: '40.7128',
    longitude: '-74.0060',
    published: true,
    tags: [{ label: 'urban', origin: 'user' }, 'faith'],
    media: [
      {
        type: 'image',
        uri: 'https://example.com/photo.jpg',
        thumbnail: 'https://example.com/photo_thumb.jpg',
        uuid: 'media-uuid-1',
      },
    ],
    audio: [
      {
        uri: 'https://example.com/recording.m4a',
        name: 'Field Recording',
        duration: '120',
        uuid: 'audio-uuid-1',
      },
    ],
    time: '2026-02-20T15:30:00Z',
    __rerum: {
      createdAt: '2026-02-20T15:30:00Z',
      modifiedAt: '2026-04-01T13:00:00Z',
    },
  },
  {
    '@id': 'https://lived-religion-dev.rerum.io/deer-lr/id/test-note-archived',
    type: 'message',
    title: 'Archived Note',
    BodyText: 'This should be skipped',
    creator: 'test-sync-admin',
    isArchived: true,
    __rerum: {
      createdAt: '2026-01-01T00:00:00Z',
      modifiedAt: '2026-04-01T00:00:00Z',
    },
  },
];

describe('Admin Sync Endpoints', () => {
  let app: ReturnType<typeof createTestApp>;
  let adminAuth: Awaited<ReturnType<typeof createAuthenticatedUser>>;

  beforeAll(async () => {
    // Set RERUM_API_URL so the sync service doesn't reject requests
    process.env.RERUM_API_URL = 'https://mock-rerum.test/api/';

    app = createTestApp();

    // Create admin user
    adminAuth = await createAuthenticatedUser(app, {
      email: 'sync-admin@test.com',
      name: 'Sync Admin',
    });
    await db.update(user).set({ role: 'admin' }).where(eq(user.id, adminAuth.userId));

    // Ensure the sync_state table exists and RERUM_API_URL is set
    await db.execute(
      `CREATE TABLE IF NOT EXISTS sync_state (
        id TEXT PRIMARY KEY,
        last_sync_at TIMESTAMP NOT NULL,
        last_notes_sync_at TIMESTAMP,
        last_comments_sync_at TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )`,
    );
  });

  afterAll(async () => {
    // Clean up test data
    globalThis.fetch = originalFetch;

    await db.delete(syncRunDetail).where(eq(syncRunDetail.noteId, 'test-note-1')).catch(() => {});
    await db.delete(syncRunDetail).where(eq(syncRunDetail.noteId, 'test-note-2')).catch(() => {});
    await db.execute(`DELETE FROM sync_run_detail WHERE run_id IN (SELECT id FROM sync_run WHERE triggered_by IN ('manual', 'full'))`).catch(() => {});
    await db.execute(`DELETE FROM sync_run`).catch(() => {});
    await db.execute(`DELETE FROM audio WHERE note_id LIKE 'test-note-%'`).catch(() => {});
    await db.execute(`DELETE FROM media WHERE note_id LIKE 'test-note-%'`).catch(() => {});
    await db.execute(`DELETE FROM note WHERE id LIKE 'test-note-%'`).catch(() => {});
    await db.execute(`DELETE FROM sync_state WHERE id = 'main'`).catch(() => {});

    delete process.env.RERUM_API_URL;
    await cleanupUser(adminAuth.userId);
  });

  beforeEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('GET /admin/sync/status returns not-running state', async () => {
    const res = await request(app, 'GET', '/api/admin/sync/status', {
      headers: adminAuth.headers,
    });

    expect(res.status).toBe(200);
    const body = res.json as Record<string, unknown>;
    expect(body.running).toBe(false);
    expect(body.lastRunAt).toBeNull();
    expect(body.intervalMs).toBe(30000);
  });

  it('GET /admin/sync/status returns 401 without auth', async () => {
    const res = await request(app, 'GET', '/api/admin/sync/status');
    expect(res.status).toBe(401);
  });

  it('POST /admin/sync/trigger runs a sync and creates audit log', async () => {
    mockRerumFetch(MOCK_RERUM_NOTES);

    const res = await request(app, 'POST', '/api/admin/sync/trigger', {
      headers: adminAuth.headers,
      body: { full: true },
    });

    expect(res.status).toBe(200);
    const body = res.json as Record<string, unknown>;
    expect(body.status).toBe('success');
    expect(body.notesCreated).toBe(2); // 2 notes (1 archived = skipped)
    expect(body.notesSkipped).toBeGreaterThanOrEqual(1); // At least the archived note
    expect(body.notesErrored).toBe(0);
    expect(body.durationMs).toBeGreaterThan(0);
  });

  it('GET /admin/sync/log shows the completed run', async () => {
    const res = await request(app, 'GET', '/api/admin/sync/log?limit=5', {
      headers: adminAuth.headers,
    });

    expect(res.status).toBe(200);
    const body = res.json as { runs: Array<Record<string, unknown>>; total: number };
    expect(body.total).toBeGreaterThanOrEqual(1);
    expect(body.runs.length).toBeGreaterThanOrEqual(1);

    const latestRun = body.runs[0];
    expect(latestRun.status).toBe('success');
    expect(latestRun.notesCreated).toBe(2);
  });

  it('GET /admin/sync/log/:runId shows per-note details', async () => {
    // Get the latest run ID
    const logRes = await request(app, 'GET', '/api/admin/sync/log?limit=1', {
      headers: adminAuth.headers,
    });
    const runs = (logRes.json as { runs: Array<{ id: string }> }).runs;
    const runId = runs[0].id;

    const res = await request(app, 'GET', `/api/admin/sync/log/${runId}`, {
      headers: adminAuth.headers,
    });

    expect(res.status).toBe(200);
    const body = res.json as { details: Array<Record<string, unknown>> };
    expect(body.details.length).toBe(2); // 2 notes that were created

    const noteIds = body.details.map(d => d.noteId);
    expect(noteIds).toContain('test-note-1');
    expect(noteIds).toContain('test-note-2');

    for (const detail of body.details) {
      expect(detail.action).toBe('created');
      expect(detail.error).toBeNull();
    }
  });

  it('POST /admin/sync/trigger incremental sync skips unchanged notes', async () => {
    mockRerumFetch(MOCK_RERUM_NOTES);

    const res = await request(app, 'POST', '/api/admin/sync/trigger', {
      headers: adminAuth.headers,
      body: { full: false },
    });

    expect(res.status).toBe(200);
    const body = res.json as Record<string, unknown>;
    expect(body.status).toBe('success');
    // All notes should be skipped since modifiedAt hasn't changed
    expect(body.notesCreated).toBe(0);
    expect(body.notesUpdated).toBe(0);
    expect(body.notesSkipped).toBeGreaterThan(0);
  });

  it('tags are normalized correctly (strings and objects)', async () => {
    // Verify the synced notes have properly normalized tags
    const note1 = await db.query.note.findFirst({
      where: eq((await import('../db/schema')).note.id, 'test-note-1'),
    });
    expect(note1).toBeTruthy();
    expect(note1!.tags).toEqual([
      { label: 'religion', origin: 'user' },
      { label: 'test', origin: 'user' },
    ]);

    const note2 = await db.query.note.findFirst({
      where: eq((await import('../db/schema')).note.id, 'test-note-2'),
    });
    expect(note2).toBeTruthy();
    expect(note2!.tags).toEqual([
      { label: 'urban', origin: 'user' },
      { label: 'faith', origin: 'user' },
    ]);
  });

  it('media and audio are synced correctly', async () => {
    const note2 = await db.query.note.findFirst({
      where: eq((await import('../db/schema')).note.id, 'test-note-2'),
      with: { media: true, audio: true },
    });

    expect(note2).toBeTruthy();
    expect(note2!.media).toHaveLength(1);
    expect(note2!.media[0].uri).toBe('https://example.com/photo.jpg');
    expect(note2!.media[0].thumbnailUri).toBe('https://example.com/photo_thumb.jpg');

    expect(note2!.audio).toHaveLength(1);
    expect(note2!.audio[0].uri).toBe('https://example.com/recording.m4a');
    expect(note2!.audio[0].name).toBe('Field Recording');
  });

  it('GET /admin/sync/log/:runId returns 404 for unknown run', async () => {
    const res = await request(app, 'GET', '/api/admin/sync/log/nonexistent-run-id', {
      headers: adminAuth.headers,
    });
    expect(res.status).toBe(404);
  });
});
