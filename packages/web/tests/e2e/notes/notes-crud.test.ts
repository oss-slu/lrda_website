import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createSession } from '../helpers/auth';
import {
  authenticatedGet,
  authenticatedPost,
  authenticatedPatch,
  authenticatedDelete,
} from '../helpers/client';
import { seedTestData, resetTestData, TEST_USER_ID, TEST_NOTE_PUBLISHED_ID } from '../helpers/db-seed';

describe('Notes CRUD operations', () => {
  let userCookie: string;
  let createdNoteId: string;

  beforeAll(async () => {
    await seedTestData();
    userCookie = await createSession(TEST_USER_ID);
  });

  afterAll(async () => {
    await resetTestData();
  });

  it('creates a note and returns it with an ID', async () => {
    const res = await authenticatedPost(
      '/api/notes',
      {
        title: 'CRUD Test Note',
        text: 'Created during e2e CRUD test.',
        isPublished: false,
        latitude: 38.627,
        longitude: -90.199,
        tags: [{ label: 'test', origin: 'user' }],
      },
      userCookie,
    );

    expect(res.status).toBe(201);
    const note = await res.json();
    expect(note.id).toBeDefined();
    expect(note.title).toBe('CRUD Test Note');
    expect(note.text).toBe('Created during e2e CRUD test.');
    expect(note.isPublished).toBe(false);
    createdNoteId = note.id;
  });

  it('reads the created note by ID', async () => {
    expect(createdNoteId, 'create test must pass first').toBeDefined();
    const res = await authenticatedGet(`/api/notes/${createdNoteId}`, userCookie);
    expect(res.status).toBe(200);
    const note = await res.json();
    expect(note.id).toBe(createdNoteId);
    expect(note.title).toBe('CRUD Test Note');
  });

  it('updates the note title and text', async () => {
    expect(createdNoteId, 'create test must pass first').toBeDefined();
    const res = await authenticatedPatch(
      `/api/notes/${createdNoteId}`,
      { title: 'Updated CRUD Note', text: 'Updated text.' },
      userCookie,
    );

    expect(res.status).toBe(200);
    const note = await res.json();
    expect(note.title).toBe('Updated CRUD Note');
    expect(note.text).toBe('Updated text.');
  });

  it('updates the note publish status', async () => {
    expect(createdNoteId, 'create test must pass first').toBeDefined();
    const res = await authenticatedPatch(
      `/api/notes/${createdNoteId}`,
      { isPublished: true },
      userCookie,
    );

    expect(res.status).toBe(200);
    const note = await res.json();
    expect(note.isPublished).toBe(true);
  });

  it('deletes the note', async () => {
    expect(createdNoteId, 'create test must pass first').toBeDefined();
    const res = await authenticatedDelete(`/api/notes/${createdNoteId}`, userCookie);
    expect(res.status).toBe(204);
  });

  it('returns 404 for the deleted note', async () => {
    expect(createdNoteId, 'create test must pass first').toBeDefined();
    const res = await authenticatedGet(`/api/notes/${createdNoteId}`, userCookie);
    expect(res.status).toBe(404);
  });

  it('lists notes with pagination', async () => {
    const res = await authenticatedGet('/api/notes?limit=5&offset=0', userCookie);
    expect(res.status).toBe(200);
    const notes = await res.json();
    expect(Array.isArray(notes)).toBe(true);
  });

  it('filters to only published notes when published=true', async () => {
    const res = await authenticatedGet('/api/notes?published=true', userCookie);
    expect(res.status).toBe(200);
    const notes = await res.json();
    // All returned notes should be published
    for (const n of notes) {
      expect(n.isPublished).toBe(true);
    }
  });

  it('filters notes by search term', async () => {
    const res = await authenticatedGet(
      `/api/notes?search=Published+Note&published=true`,
      userCookie,
    );
    expect(res.status).toBe(200);
    const notes = await res.json();
    expect(notes.length).toBeGreaterThan(0);
    expect(
      notes.some((n: { title: string }) => n.title.includes('Published Note')),
    ).toBe(true);
  });

  it('returns summary mode with truncated fields', async () => {
    const res = await authenticatedGet('/api/notes?fields=summary&published=true', userCookie);
    expect(res.status).toBe(200);
    const notes = await res.json();
    // Seeded data guarantees at least one published note
    expect(notes.length).toBeGreaterThan(0);
    // Summary mode strips text and limits media to 1
    expect(notes[0].text).toBe('');
    expect(notes[0].media.length).toBeLessThanOrEqual(1);
  });
});
