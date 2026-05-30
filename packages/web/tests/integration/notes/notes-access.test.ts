import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createSession } from '../../helpers/auth';
import {
  authenticatedGet,
  authenticatedPatch,
  authenticatedDelete,
  unauthenticatedGet,
} from '../../helpers/client';
import {
  seedTestData,
  resetTestData,
  TEST_USER_ID,
  TEST_USER_ID_2,
  TEST_ADMIN_ID,
  TEST_INSTRUCTOR_ID,
  TEST_NOTE_DRAFT_ID,
  TEST_NOTE_PUBLISHED_ID,
  TEST_NOTE_USER2_ID,
} from '../../helpers/db-seed';

describe('Note access control', () => {
  let user1Cookie: string;
  let user2Cookie: string;
  let adminCookie: string;
  let instructorCookie: string;

  beforeAll(async () => {
    await seedTestData();
    user1Cookie = await createSession(TEST_USER_ID);
    user2Cookie = await createSession(TEST_USER_ID_2);
    adminCookie = await createSession(TEST_ADMIN_ID);
    instructorCookie = await createSession(TEST_INSTRUCTOR_ID);
  });

  afterAll(async () => {
    await resetTestData();
  });

  // -- Draft note visibility --

  it('owner can read their own draft note', async () => {
    const res = await authenticatedGet(`/api/notes/${TEST_NOTE_DRAFT_ID}`, user1Cookie);
    expect(res.status).toBe(200);
    const note = await res.json();
    expect(note.title).toBe('Draft Note');
  });

  it('non-owner gets 404 for draft note', async () => {
    const res = await authenticatedGet(`/api/notes/${TEST_NOTE_DRAFT_ID}`, user2Cookie);
    expect(res.status).toBe(404);
  });

  it('unauthenticated user gets 404 for draft note', async () => {
    const res = await unauthenticatedGet(`/api/notes/${TEST_NOTE_DRAFT_ID}`);
    expect(res.status).toBe(404);
  });

  // -- Published note visibility --

  it('anyone can read a published note', async () => {
    const res = await unauthenticatedGet(`/api/notes/${TEST_NOTE_PUBLISHED_ID}`);
    expect(res.status).toBe(200);
    const note = await res.json();
    expect(note.title).toBe('Published Note');
  });

  it('non-owner can read a published note', async () => {
    const res = await authenticatedGet(`/api/notes/${TEST_NOTE_PUBLISHED_ID}`, user2Cookie);
    expect(res.status).toBe(200);
  });

  // -- Update permissions --

  it('owner can update their note', async () => {
    const res = await authenticatedPatch(
      `/api/notes/${TEST_NOTE_DRAFT_ID}`,
      { title: 'Updated Draft Note' },
      user1Cookie,
    );
    expect(res.status).toBe(200);
    const note = await res.json();
    expect(note.title).toBe('Updated Draft Note');
  });

  it('non-owner cannot update another users note', async () => {
    const res = await authenticatedPatch(
      `/api/notes/${TEST_NOTE_DRAFT_ID}`,
      { title: 'Hacked Title' },
      user2Cookie,
    );
    expect(res.status).toBe(403);
  });

  it('admin can update any note', async () => {
    const res = await authenticatedPatch(
      `/api/notes/${TEST_NOTE_DRAFT_ID}`,
      { title: 'Admin Updated' },
      adminCookie,
    );
    expect(res.status).toBe(200);
    const note = await res.json();
    expect(note.title).toBe('Admin Updated');
  });

  it('instructor can update their students note', async () => {
    // TEST_USER_ID_2 has TEST_INSTRUCTOR_ID as instructorId
    const res = await authenticatedPatch(
      `/api/notes/${TEST_NOTE_USER2_ID}`,
      { title: 'Instructor Updated' },
      instructorCookie,
    );
    expect(res.status).toBe(200);
    const note = await res.json();
    expect(note.title).toBe('Instructor Updated');
  });

  it('instructor cannot update non-student note', async () => {
    // TEST_USER_ID (user1) is NOT a student of TEST_INSTRUCTOR_ID
    const res = await authenticatedPatch(
      `/api/notes/${TEST_NOTE_DRAFT_ID}`,
      { title: 'Should Fail' },
      instructorCookie,
    );
    expect(res.status).toBe(403);
  });

  // -- Delete permissions --
  // NOTE: Delete tests MUST run last because they destroy seeded notes that
  // earlier tests depend on. resetTestData() in afterAll re-seeds for the
  // next test file, but within this describe block order matters.

  it('non-owner cannot delete another users note', async () => {
    const res = await authenticatedDelete(`/api/notes/${TEST_NOTE_DRAFT_ID}`, user2Cookie);
    expect(res.status).toBe(403);
  });

  it('admin can delete any note', async () => {
    const res = await authenticatedDelete(`/api/notes/${TEST_NOTE_USER2_ID}`, adminCookie);
    expect(res.status).toBe(204);
  });

  it('owner can delete their own note', async () => {
    const res = await authenticatedDelete(`/api/notes/${TEST_NOTE_PUBLISHED_ID}`, user1Cookie);
    expect(res.status).toBe(204);
  });
});
