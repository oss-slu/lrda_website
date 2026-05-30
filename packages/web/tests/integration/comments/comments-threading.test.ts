import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createSession } from '../helpers/auth';
import { authenticatedGet, authenticatedPost } from '../helpers/client';
import {
  seedTestData,
  resetTestData,
  execute,
  TEST_USER_ID,
  TEST_INSTRUCTOR_ID,
  TEST_NOTE_PUBLISHED_ID,
} from '../helpers/db-seed';

describe('Comment threading - parentId orphan bug', () => {
  let userCookie: string;
  let instructorCookie: string;

  beforeAll(async () => {
    await seedTestData();
    userCookie = await createSession(TEST_USER_ID);
    instructorCookie = await createSession(TEST_INSTRUCTOR_ID);
  });

  afterAll(async () => {
    // Clean up comments created during this test
    await execute(
      `DELETE FROM "comment" WHERE note_id = $1`,
      TEST_NOTE_PUBLISHED_ID,
    );
    await resetTestData();
  });

  it('root comment gets a threadId that differs from its id', async () => {
    const res = await authenticatedPost(
      '/api/comments',
      {
        noteId: TEST_NOTE_PUBLISHED_ID,
        text: 'Root comment for threading test',
      },
      instructorCookie,
    );

    expect(res.status).toBe(201);
    const root = await res.json();

    expect(root.id).toBeDefined();
    expect(root.threadId).toBeDefined();
    // The API generates a separate UUID for threadId -- it is NOT the comment id
    expect(root.threadId).not.toBe(root.id);
  });

  it('reply with parentId=rootComment.id appears in the thread (correct behavior)', async () => {
    // Create root comment
    const rootRes = await authenticatedPost(
      '/api/comments',
      {
        noteId: TEST_NOTE_PUBLISHED_ID,
        text: 'Root - correct reply test',
      },
      instructorCookie,
    );
    const root = await rootRes.json();

    // Reply correctly: parentId = root.id (what CommentSidebar does)
    const replyRes = await authenticatedPost(
      '/api/comments',
      {
        noteId: TEST_NOTE_PUBLISHED_ID,
        text: 'Correct reply',
        threadId: root.threadId,
        parentId: root.id,
      },
      userCookie,
    );

    expect(replyRes.status).toBe(201);
    const reply = await replyRes.json();
    expect(reply.parentId).toBe(root.id);
    expect(reply.threadId).toBe(root.threadId);

    // Fetch all comments for the note and simulate frontend grouping
    const listRes = await authenticatedGet(
      `/api/comments/note/${TEST_NOTE_PUBLISHED_ID}`,
      userCookie,
    );
    const comments = await listRes.json();

    // Frontend logic from CommentThreadList.tsx:31
    //   replies = comments.filter(r => r.parentId === root.id)
    const replies = comments.filter(
      (c: { parentId: string | null }) => c.parentId === root.id,
    );

    expect(replies.length).toBe(1);
    expect(replies[0].text).toBe('Correct reply');
  });

  it('reply with parentId=threadId fails with 500 due to FK constraint (InstructorStoriesCard bug)', async () => {
    // Create root comment
    const rootRes = await authenticatedPost(
      '/api/comments',
      {
        noteId: TEST_NOTE_PUBLISHED_ID,
        text: 'Root - orphan reply test',
      },
      instructorCookie,
    );
    const root = await rootRes.json();

    // Confirm threadId !== root.id (precondition for the bug to manifest)
    expect(root.threadId).not.toBe(root.id);

    // Reply the BUGGY way: parentId = threadId (what InstructorStoriesCard does)
    // The DB has a FK constraint: comment.parent_id references comment.id
    // Since threadId is NOT a comment id, this violates the FK and returns 500.
    const replyRes = await authenticatedPost(
      '/api/comments',
      {
        noteId: TEST_NOTE_PUBLISHED_ID,
        text: 'Orphaned reply',
        threadId: root.threadId,
        parentId: root.threadId, // BUG: should be root.id
      },
      userCookie,
    );

    // The reply fails entirely -- the user sees a toast error in the UI.
    // InstructorStoriesCard.tsx:125 sets parentId to threadId, which is
    // not a valid comment id, so the FK constraint rejects the insert.
    expect(replyRes.status).toBe(500);
  });

  it('correct parentId succeeds while buggy parentId fails in the same thread', async () => {
    // Create a thread with one correct reply and one buggy reply
    const rootRes = await authenticatedPost(
      '/api/comments',
      {
        noteId: TEST_NOTE_PUBLISHED_ID,
        text: 'Root - mixed replies test',
      },
      instructorCookie,
    );
    const root = await rootRes.json();

    // Correct reply (CommentSidebar style) -- succeeds
    const correctRes = await authenticatedPost(
      '/api/comments',
      {
        noteId: TEST_NOTE_PUBLISHED_ID,
        text: 'Visible reply',
        threadId: root.threadId,
        parentId: root.id,
      },
      userCookie,
    );
    expect(correctRes.status).toBe(201);

    // Buggy reply (InstructorStoriesCard style) -- fails with FK violation
    const buggyRes = await authenticatedPost(
      '/api/comments',
      {
        noteId: TEST_NOTE_PUBLISHED_ID,
        text: 'Invisible reply',
        threadId: root.threadId,
        parentId: root.threadId, // BUG: not a valid comment id
      },
      userCookie,
    );
    expect(buggyRes.status).toBe(500);

    // Fetch comments -- only the root and the correct reply exist
    const listRes = await authenticatedGet(
      `/api/comments/note/${TEST_NOTE_PUBLISHED_ID}`,
      userCookie,
    );
    const comments = await listRes.json();

    const threadComments = comments.filter(
      (c: { threadId: string | null }) => c.threadId === root.threadId,
    );

    // Only 2 comments: root + correct reply (buggy reply was rejected)
    expect(threadComments.length).toBe(2);

    const visibleReplies = threadComments.filter(
      (c: { parentId: string | null }) => c.parentId === root.id,
    );
    expect(visibleReplies.length).toBe(1);
    expect(visibleReplies[0].text).toBe('Visible reply');
  });
});
