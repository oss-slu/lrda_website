import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import {
  ErrorSchema,
  CommentSchema,
  CreateCommentInputSchema,
  UpdateCommentInputSchema,
} from '@lrda/shared';
import { eq, and, desc } from 'drizzle-orm';
import { comment, note, user } from '../db/schema';
import { requireAuth, authMiddleware } from '../middleware/auth';
import type { AppEnv } from '../types';
import { getDb } from './helpers';

/**
 * Who may view a note's comments. Published notes are public; unpublished notes
 * are visible to the creator, admins, and the creator's instructor (mirrors the
 * note access rules in notes.ts so instructors can review student drafts).
 */
async function canViewNoteComments(
  db: ReturnType<typeof getDb>,
  authUser: { id: string; role?: string | null; isInstructor?: boolean | null } | null | undefined,
  noteRow: { isPublished: boolean; creatorId: string },
): Promise<boolean> {
  if (noteRow.isPublished) return true;
  if (!authUser) return false;
  if (authUser.id === noteRow.creatorId) return true;
  if (authUser.role === 'admin') return true;
  if (authUser.isInstructor === true && noteRow.creatorId !== authUser.id) {
    const creator = await db.query.user.findFirst({
      where: eq(user.id, noteRow.creatorId),
      columns: { instructorId: true },
    });
    return creator?.instructorId === authUser.id;
  }
  return false;
}

// Routes

const listCommentsForNoteRoute = createRoute({
  method: 'get',
  path: '/note/{noteId}',
  tags: ['Comments'],
  middleware: [authMiddleware],
  request: {
    params: z.object({
      noteId: z.string(),
    }),
  },
  responses: {
    200: {
      content: { 'application/json': { schema: z.array(CommentSchema) } },
      description: 'List of comments for note',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Note not found',
    },
  },
});

const getCommentRoute = createRoute({
  method: 'get',
  path: '/{id}',
  tags: ['Comments'],
  middleware: [authMiddleware],
  request: {
    params: z.object({
      id: z.string(),
    }),
  },
  responses: {
    200: {
      content: { 'application/json': { schema: CommentSchema } },
      description: 'Comment details',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Comment not found',
    },
  },
});

const createCommentRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Comments'],
  middleware: [requireAuth],
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateCommentInputSchema,
        },
      },
    },
  },
  responses: {
    201: {
      content: { 'application/json': { schema: CommentSchema } },
      description: 'Created comment',
    },
    401: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Unauthorized',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Note not found',
    },
  },
});

const updateCommentRoute = createRoute({
  method: 'patch',
  path: '/{id}',
  tags: ['Comments'],
  middleware: [requireAuth],
  request: {
    params: z.object({
      id: z.string(),
    }),
    body: {
      content: {
        'application/json': {
          schema: UpdateCommentInputSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: CommentSchema } },
      description: 'Updated comment',
    },
    401: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Unauthorized',
    },
    403: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Forbidden - can only update own comments',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Comment not found',
    },
  },
});

const deleteCommentRoute = createRoute({
  method: 'delete',
  path: '/{id}',
  tags: ['Comments'],
  middleware: [requireAuth],
  request: {
    params: z.object({
      id: z.string(),
    }),
  },
  responses: {
    204: {
      description: 'Comment deleted',
    },
    401: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Unauthorized',
    },
    403: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Forbidden - can only delete own comments',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Comment not found',
    },
  },
});

const resolveThreadRoute = createRoute({
  method: 'post',
  path: '/thread/{threadId}/resolve',
  tags: ['Comments'],
  middleware: [requireAuth],
  request: {
    params: z.object({
      threadId: z.string(),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            updatedCount: z.number(),
          }),
        },
      },
      description: 'Thread resolved',
    },
    401: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Unauthorized',
    },
    403: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Forbidden - only instructors can resolve threads',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Thread not found',
    },
  },
});

// Create router
export const commentRoutes = new OpenAPIHono<AppEnv>()
  // GET /comments/note/:noteId - list comments for note
  .openapi(listCommentsForNoteRoute, async c => {
    const db = getDb(c);
    const authUser = c.get('user');
    const { noteId } = c.req.valid('param');

    // Verify note exists
    const existingNote = await db.query.note.findFirst({
      where: eq(note.id, noteId),
    });

    if (!existingNote) {
      return c.json({ error: 'Note not found' }, 404);
    }

    // Unpublished notes: creator, admins, and the creator's instructor may view
    if (!(await canViewNoteComments(db, authUser, existingNote))) {
      return c.json({ error: 'Note not found' }, 404);
    }

    const results = await db.query.comment.findMany({
      where: eq(comment.noteId, noteId),
      orderBy: desc(comment.createdAt),
    });

    return c.json(results, 200);
  })

  // GET /comments/:id - get single comment
  .openapi(getCommentRoute, async c => {
    const db = getDb(c);
    const authUser = c.get('user');
    const { id } = c.req.valid('param');

    const result = await db.query.comment.findFirst({
      where: eq(comment.id, id),
    });

    if (!result) {
      return c.json({ error: 'Comment not found' }, 404);
    }

    const parentNote = await db.query.note.findFirst({
      where: eq(note.id, result.noteId),
    });

    if (!parentNote || !(await canViewNoteComments(db, authUser, parentNote))) {
      return c.json({ error: 'Comment not found' }, 404);
    }

    return c.json(result, 200);
  })

  // POST /comments - create comment
  .openapi(createCommentRoute, async c => {
    const db = getDb(c);
    const authUser = c.get('user') as NonNullable<AppEnv['Variables']['user']>;
    const body = c.req.valid('json');

    // Verify note exists
    const existingNote = await db.query.note.findFirst({
      where: eq(note.id, body.noteId),
    });

    if (!existingNote) {
      return c.json({ error: 'Note not found' }, 404);
    }

    // Generate threadId for new threads (when no threadId or parentId provided)
    let finalThreadId: string | null = body.threadId || null;

    if (!finalThreadId && !body.parentId) {
      // New thread - generate a threadId
      finalThreadId = crypto.randomUUID();
    } else if (body.parentId && !body.threadId) {
      // Reply to existing comment - get parent's threadId
      const parentComment = await db.query.comment.findFirst({
        where: eq(comment.id, body.parentId),
      });
      if (parentComment) {
        finalThreadId = parentComment.threadId;
      }
    }

    const [createdComment] = await db
      .insert(comment)
      .values({
        noteId: body.noteId,
        authorId: authUser.id,
        authorName: authUser.name,
        text: body.text,
        position: body.position || null,
        threadId: finalThreadId || null,
        parentId: body.parentId || null,
        isResolved: false,
      })
      .returning();

    return c.json(createdComment, 201);
  })

  // PATCH /comments/:id - update comment
  .openapi(updateCommentRoute, async c => {
    const db = getDb(c);
    const authUser = c.get('user') as NonNullable<AppEnv['Variables']['user']>;
    const { id } = c.req.valid('param');
    const body = c.req.valid('json');

    // Check if comment exists
    const existingComment = await db.query.comment.findFirst({
      where: eq(comment.id, id),
    });

    if (!existingComment) {
      return c.json({ error: 'Comment not found' }, 404);
    }

    const isAdmin = authUser.role === 'admin';
    let isCreatorsInstructor = false;
    if (authUser.isInstructor === true) {
      const noteRow = await db.query.note.findFirst({
        where: eq(note.id, existingComment.noteId),
        columns: { creatorId: true },
      });
      if (noteRow) {
        const noteCreator = await db.query.user.findFirst({
          where: eq(user.id, noteRow.creatorId),
          columns: { instructorId: true },
        });
        isCreatorsInstructor = noteCreator?.instructorId === authUser.id;
      }
    }
    if (existingComment.authorId !== authUser.id && !isAdmin && !isCreatorsInstructor) {
      return c.json({ error: 'You can only update your own comments' }, 403);
    }

    // Build update object
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (body.text !== undefined) updateData.text = body.text;
    if (body.isResolved !== undefined) updateData.isResolved = body.isResolved;

    const [updated] = await db
      .update(comment)
      .set(updateData)
      .where(eq(comment.id, id))
      .returning();

    return c.json(updated, 200);
  })

  // DELETE /comments/:id - delete comment
  .openapi(deleteCommentRoute, async c => {
    const db = getDb(c);
    const authUser = c.get('user') as NonNullable<AppEnv['Variables']['user']>;
    const { id } = c.req.valid('param');

    // Check if comment exists
    const existingComment = await db.query.comment.findFirst({
      where: eq(comment.id, id),
    });

    if (!existingComment) {
      return c.json({ error: 'Comment not found' }, 404);
    }

    const isAdmin = authUser.role === 'admin';
    let isCreatorsInstructor = false;
    if (authUser.isInstructor === true) {
      const noteRow = await db.query.note.findFirst({
        where: eq(note.id, existingComment.noteId),
        columns: { creatorId: true },
      });
      if (noteRow) {
        const noteCreator = await db.query.user.findFirst({
          where: eq(user.id, noteRow.creatorId),
          columns: { instructorId: true },
        });
        isCreatorsInstructor = noteCreator?.instructorId === authUser.id;
      }
    }
    if (existingComment.authorId !== authUser.id && !isAdmin && !isCreatorsInstructor) {
      return c.json({ error: 'You can only delete your own comments' }, 403);
    }

    // Delete the comment (cascade deletes replies)
    await db.delete(comment).where(eq(comment.id, id));

    return c.body(null, 204);
  })

  // POST /comments/thread/:threadId/resolve - resolve thread
  .openapi(resolveThreadRoute, async c => {
    const db = getDb(c);
    const authUser = c.get('user') as NonNullable<AppEnv['Variables']['user']>;
    const { threadId } = c.req.valid('param');

    const isAdmin = authUser.role === 'admin';
    const isInstructor = authUser.isInstructor === true;
    if (!isAdmin && !isInstructor) {
      return c.json({ error: 'Only instructors can resolve threads' }, 403);
    }

    const threadComments = await db.query.comment.findMany({
      where: eq(comment.threadId, threadId),
    });

    if (threadComments.length === 0) {
      return c.json({ error: 'Thread not found' }, 404);
    }

    // Instructors can only resolve threads on their own students' notes
    if (isInstructor && !isAdmin) {
      const noteRow = await db.query.note.findFirst({
        where: eq(note.id, threadComments[0].noteId),
        columns: { creatorId: true },
      });
      if (noteRow) {
        const noteCreator = await db.query.user.findFirst({
          where: eq(user.id, noteRow.creatorId),
          columns: { instructorId: true },
        });
        if (noteCreator?.instructorId !== authUser.id) {
          return c.json({ error: 'Only instructors can resolve threads' }, 403);
        }
      }
    }

    // Update all comments in the thread to resolved
    await db
      .update(comment)
      .set({ isResolved: true, updatedAt: new Date() })
      .where(eq(comment.threadId, threadId));

    return c.json({ success: true, updatedCount: threadComments.length }, 200);
  });
