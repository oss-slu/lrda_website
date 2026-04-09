import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import {
  ErrorSchema,
  SuccessSchema,
  SyncStatusSchema,
  SyncRunSchema,
  SyncRunWithDetailsSchema,
  SyncLogResponseSchema,
  SyncUserResultSchema,
} from '@lrda/shared';
import { desc, eq, count } from 'drizzle-orm';
import { syncRun, syncRunDetail } from '../db/schema';
import {
  getSyncStatus,
  startSync,
  stopSync,
  triggerSync,
  triggerFullSync,
  syncUsersFromFirebase,
} from '../lib/sync-service';
import { requireAuth, requireAdmin } from '../middleware/auth';
import type { AppEnv } from '../types';
import { getDb } from './helpers';

// ============================================
// Route definitions
// ============================================

const getStatusRoute = createRoute({
  method: 'get',
  path: '/status',
  tags: ['Sync'],
  middleware: [requireAuth, requireAdmin],
  responses: {
    200: {
      content: { 'application/json': { schema: SyncStatusSchema } },
      description: 'Current sync status',
    },
    401: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Unauthorized',
    },
    403: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Forbidden - Admin access required',
    },
  },
});

const startSyncRoute = createRoute({
  method: 'post',
  path: '/start',
  tags: ['Sync'],
  middleware: [requireAuth, requireAdmin],
  responses: {
    200: {
      content: { 'application/json': { schema: SuccessSchema } },
      description: 'Sync started',
    },
    400: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Sync could not be started',
    },
    401: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Unauthorized',
    },
    403: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Forbidden - Admin access required',
    },
  },
});

const stopSyncRoute = createRoute({
  method: 'post',
  path: '/stop',
  tags: ['Sync'],
  middleware: [requireAuth, requireAdmin],
  responses: {
    200: {
      content: { 'application/json': { schema: SuccessSchema } },
      description: 'Sync stopped',
    },
    400: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Sync could not be stopped',
    },
    401: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Unauthorized',
    },
    403: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Forbidden - Admin access required',
    },
  },
});

const triggerSyncRoute = createRoute({
  method: 'post',
  path: '/trigger',
  tags: ['Sync'],
  middleware: [requireAuth, requireAdmin],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            full: z.boolean().optional().default(false),
          }),
        },
      },
      required: false,
    },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: SyncRunSchema } },
      description: 'Sync completed',
    },
    400: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Sync could not be triggered',
    },
    401: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Unauthorized',
    },
    403: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Forbidden - Admin access required',
    },
    500: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Sync failed',
    },
  },
});

const getLogRoute = createRoute({
  method: 'get',
  path: '/log',
  tags: ['Sync'],
  middleware: [requireAuth, requireAdmin],
  request: {
    query: z.object({
      limit: z.coerce.number().min(1).max(100).optional().default(20),
      offset: z.coerce.number().min(0).optional().default(0),
    }),
  },
  responses: {
    200: {
      content: { 'application/json': { schema: SyncLogResponseSchema } },
      description: 'Paginated sync run log',
    },
    401: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Unauthorized',
    },
    403: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Forbidden - Admin access required',
    },
  },
});

const getRunDetailRoute = createRoute({
  method: 'get',
  path: '/log/{runId}',
  tags: ['Sync'],
  middleware: [requireAuth, requireAdmin],
  request: {
    params: z.object({
      runId: z.string(),
    }),
  },
  responses: {
    200: {
      content: { 'application/json': { schema: SyncRunWithDetailsSchema } },
      description: 'Sync run with per-note details',
    },
    401: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Unauthorized',
    },
    403: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Forbidden - Admin access required',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Run not found',
    },
  },
});

const syncUsersRoute = createRoute({
  method: 'post',
  path: '/users',
  tags: ['Sync'],
  middleware: [requireAuth, requireAdmin],
  responses: {
    200: {
      content: { 'application/json': { schema: SyncUserResultSchema } },
      description: 'User sync completed',
    },
    401: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Unauthorized',
    },
    403: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Forbidden - Admin access required',
    },
    500: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'User sync failed',
    },
  },
});

// ============================================
// Router
// ============================================

export const adminSyncRoutes = new OpenAPIHono<AppEnv>()
  .openapi(getStatusRoute, async c => {
    const status = getSyncStatus();
    return c.json(status, 200);
  })

  .openapi(startSyncRoute, async c => {
    const result = await startSync();
    if (!result.started) {
      return c.json({ error: result.message }, 400);
    }
    return c.json({ success: true, message: result.message }, 200);
  })

  .openapi(stopSyncRoute, async c => {
    const result = await stopSync();
    if (!result.stopped) {
      return c.json({ error: result.message }, 400);
    }
    return c.json({ success: true, message: result.message }, 200);
  })

  .openapi(triggerSyncRoute, async c => {
    try {
      const body = c.req.valid('json');
      const full = body?.full === true;
      const result = full ? await triggerFullSync() : await triggerSync();
      return c.json(
        {
          id: result.runId,
          startedAt: new Date().toISOString(),
          finishedAt: new Date().toISOString(),
          durationMs: result.durationMs,
          status: result.status,
          notesCreated: result.created,
          notesUpdated: result.updated,
          notesSkipped: result.skipped,
          notesErrored: result.errored,
          error: result.error || null,
          triggeredBy: full ? 'full' : 'manual',
        },
        200,
      );
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      return c.json({ error: msg }, 400);
    }
  })

  .openapi(getLogRoute, async c => {
    const db = getDb(c);
    const { limit, offset } = c.req.valid('query');

    const [runs, [totalResult]] = await Promise.all([
      db.query.syncRun.findMany({
        orderBy: (r, { desc }) => [desc(r.startedAt)],
        limit,
        offset,
      }),
      db.select({ total: count() }).from(syncRun),
    ]);

    return c.json(
      {
        runs: runs.map(r => ({
          id: r.id,
          startedAt: r.startedAt,
          finishedAt: r.finishedAt,
          durationMs: r.durationMs,
          status: r.status,
          notesCreated: r.notesCreated,
          notesUpdated: r.notesUpdated,
          notesSkipped: r.notesSkipped,
          notesErrored: r.notesErrored,
          error: r.error,
          triggeredBy: r.triggeredBy,
        })),
        total: Number(totalResult.total),
      },
      200,
    );
  })

  .openapi(getRunDetailRoute, async c => {
    const db = getDb(c);
    const { runId } = c.req.valid('param');

    const run = await db.query.syncRun.findFirst({
      where: eq(syncRun.id, runId),
      with: {
        details: {
          orderBy: (d, { asc }) => [asc(d.createdAt)],
        },
      },
    });

    if (!run) {
      return c.json({ error: 'Run not found' }, 404);
    }

    return c.json(
      {
        id: run.id,
        startedAt: run.startedAt,
        finishedAt: run.finishedAt,
        durationMs: run.durationMs,
        status: run.status,
        notesCreated: run.notesCreated,
        notesUpdated: run.notesUpdated,
        notesSkipped: run.notesSkipped,
        notesErrored: run.notesErrored,
        error: run.error,
        triggeredBy: run.triggeredBy,
        details: run.details.map(d => ({
          id: d.id,
          runId: d.runId,
          noteId: d.noteId,
          action: d.action,
          error: d.error,
          createdAt: d.createdAt,
        })),
      },
      200,
    );
  })

  .openapi(syncUsersRoute, async c => {
    try {
      const result = await syncUsersFromFirebase();
      return c.json(result, 200);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      return c.json({ error: msg }, 500);
    }
  });
