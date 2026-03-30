import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import {
  ErrorSchema,
  SuccessSchema,
  AdminUserSchema,
  PendingApplicationSchema,
  StatsSchema,
  ContentStatsSchema,
  RecentActivityItemSchema,
  AnalyticsSummarySchema,
  AnalyticsTimeSeriesSchema,
} from '@lrda/shared';
import { eq, isNotNull, and, ne, desc, gte, sql, count } from 'drizzle-orm';
import { user, note, pageView } from '../db/schema';
import { requireAuth, requireAdmin } from '../middleware/auth';
import type { AppEnv } from '../types';
import { getDb } from './helpers';

// Routes
const getAllUsersRoute = createRoute({
  method: 'get',
  path: '/users',
  tags: ['Admin'],
  middleware: [requireAuth, requireAdmin],
  responses: {
    200: {
      content: { 'application/json': { schema: z.array(AdminUserSchema) } },
      description: 'List of all users',
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

const getPendingApplicationsRoute = createRoute({
  method: 'get',
  path: '/pending-instructors',
  tags: ['Admin'],
  middleware: [requireAuth, requireAdmin],
  responses: {
    200: {
      content: {
        'application/json': { schema: z.array(PendingApplicationSchema) },
      },
      description: 'List of pending instructor applications',
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

const getStatsRoute = createRoute({
  method: 'get',
  path: '/stats',
  tags: ['Admin'],
  middleware: [requireAuth, requireAdmin],
  responses: {
    200: {
      content: { 'application/json': { schema: StatsSchema } },
      description: 'Admin statistics',
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

const approveInstructorRoute = createRoute({
  method: 'post',
  path: '/approve-instructor/{id}',
  tags: ['Admin'],
  middleware: [requireAuth, requireAdmin],
  request: {
    params: z.object({
      id: z.string(),
    }),
  },
  responses: {
    200: {
      content: { 'application/json': { schema: SuccessSchema } },
      description: 'Application approved',
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
      description: 'User not found or no pending application',
    },
  },
});

const rejectInstructorRoute = createRoute({
  method: 'post',
  path: '/reject-instructor/{id}',
  tags: ['Admin'],
  middleware: [requireAuth, requireAdmin],
  request: {
    params: z.object({
      id: z.string(),
    }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            reason: z.string().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: SuccessSchema } },
      description: 'Application rejected',
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
      description: 'User not found or no pending application',
    },
  },
});

const getContentStatsRoute = createRoute({
  method: 'get',
  path: '/content-stats',
  tags: ['Admin'],
  middleware: [requireAuth, requireAdmin],
  responses: {
    200: {
      content: { 'application/json': { schema: ContentStatsSchema } },
      description: 'Content statistics',
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

const getRecentActivityRoute = createRoute({
  method: 'get',
  path: '/recent-activity',
  tags: ['Admin'],
  middleware: [requireAuth, requireAdmin],
  responses: {
    200: {
      content: {
        'application/json': { schema: z.array(RecentActivityItemSchema) },
      },
      description: 'Recent note activity',
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

const getAnalyticsSummaryRoute = createRoute({
  method: 'get',
  path: '/analytics/summary',
  tags: ['Admin'],
  middleware: [requireAuth, requireAdmin],
  request: {
    query: z.object({
      days: z.string().regex(/^\d+$/).optional().default('30'),
    }),
  },
  responses: {
    200: {
      content: { 'application/json': { schema: AnalyticsSummarySchema } },
      description: 'Analytics summary',
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

const getAnalyticsTimeSeriesRoute = createRoute({
  method: 'get',
  path: '/analytics/timeseries',
  tags: ['Admin'],
  middleware: [requireAuth, requireAdmin],
  request: {
    query: z.object({
      days: z.string().regex(/^\d+$/).optional().default('30'),
    }),
  },
  responses: {
    200: {
      content: { 'application/json': { schema: AnalyticsTimeSeriesSchema } },
      description: 'Analytics time series data',
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

// Create router
export const adminRoutes = new OpenAPIHono<AppEnv>()
  // GET /admin/users - list all users
  .openapi(getAllUsersRoute, async c => {
    const db = getDb(c);
    const users = await db.query.user.findMany({
      columns: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        isInstructor: true,
        banned: true,
        banReason: true,
        banExpires: true,
        pendingInstructorDescription: true,
        createdAt: true,
      },
      orderBy: (user, { desc }) => [desc(user.createdAt)],
    });

    return c.json(users, 200);
  })

  // GET /admin/pending-instructors - list pending applications
  .openapi(getPendingApplicationsRoute, async c => {
    const db = getDb(c);
    const pending = await db.query.user.findMany({
      where: and(
        isNotNull(user.pendingInstructorDescription),
        ne(user.pendingInstructorDescription, ''),
        eq(user.isInstructor, false),
      ),
      columns: {
        id: true,
        name: true,
        email: true,
        pendingInstructorDescription: true,
        createdAt: true,
      },
      orderBy: (user, { asc }) => [asc(user.createdAt)],
    });

    const applications = pending.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      description: u.pendingInstructorDescription || '',
      createdAt: u.createdAt,
    }));

    return c.json(applications, 200);
  })

  // GET /admin/stats - get statistics
  .openapi(getStatsRoute, async c => {
    const db = getDb(c);
    const users = await db.query.user.findMany({
      columns: {
        role: true,
        isInstructor: true,
        pendingInstructorDescription: true,
      },
    });

    const stats = {
      totalUsers: users.length,
      totalAdmins: users.filter(u => u.role === 'admin').length,
      totalInstructors: users.filter(u => u.isInstructor).length,
      pendingApplications: users.filter(u => u.pendingInstructorDescription && !u.isInstructor)
        .length,
    };

    return c.json(stats, 200);
  })

  // POST /admin/approve-instructor/:id - approve application
  .openapi(approveInstructorRoute, async c => {
    const db = getDb(c);
    const { id } = c.req.valid('param');

    // Find user with pending application
    const targetUser = await db.query.user.findFirst({
      where: eq(user.id, id),
    });

    if (!targetUser) {
      return c.json({ error: 'User not found' }, 404);
    }

    if (!targetUser.pendingInstructorDescription) {
      return c.json({ error: 'No pending instructor application' }, 404);
    }

    if (targetUser.isInstructor) {
      return c.json({ error: 'User is already an instructor' }, 404);
    }

    // Approve - set isInstructor to true and clear pending description
    await db
      .update(user)
      .set({
        isInstructor: true,
        pendingInstructorDescription: null,
        updatedAt: new Date(),
      })
      .where(eq(user.id, id));

    return c.json({ success: true, message: 'Instructor application approved' }, 200);
  })

  // POST /admin/reject-instructor/:id - reject application
  .openapi(rejectInstructorRoute, async c => {
    const db = getDb(c);
    const { id } = c.req.valid('param');

    // Find user with pending application
    const targetUser = await db.query.user.findFirst({
      where: eq(user.id, id),
    });

    if (!targetUser) {
      return c.json({ error: 'User not found' }, 404);
    }

    if (!targetUser.pendingInstructorDescription) {
      return c.json({ error: 'No pending instructor application' }, 404);
    }

    // Reject - clear pending description
    await db
      .update(user)
      .set({
        pendingInstructorDescription: null,
        updatedAt: new Date(),
      })
      .where(eq(user.id, id));

    return c.json({ success: true, message: 'Instructor application rejected' }, 200);
  })

  // GET /admin/content-stats - content statistics
  .openapi(getContentStatsRoute, async c => {
    const db = getDb(c);
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [result] = await db
      .select({
        totalNotes: count(),
        publishedNotes: count(sql`CASE WHEN ${note.isPublished} = true THEN 1 END`),
        notesThisWeek: count(sql`CASE WHEN ${note.createdAt} >= ${weekAgo} THEN 1 END`),
        notesThisMonth: count(sql`CASE WHEN ${note.createdAt} >= ${monthAgo} THEN 1 END`),
      })
      .from(note);

    return c.json(
      {
        totalNotes: Number(result.totalNotes),
        publishedNotes: Number(result.publishedNotes),
        notesThisWeek: Number(result.notesThisWeek),
        notesThisMonth: Number(result.notesThisMonth),
      },
      200,
    );
  })

  // GET /admin/recent-activity - recent note activity
  .openapi(getRecentActivityRoute, async c => {
    const db = getDb(c);
    const notes = await db.query.note.findMany({
      columns: {
        id: true,
        title: true,
        isPublished: true,
        createdAt: true,
        updatedAt: true,
      },
      with: {
        creator: {
          columns: { name: true },
        },
      },
      orderBy: (note, { desc }) => [desc(note.updatedAt)],
      limit: 20,
    });

    const activity = notes.map(n => ({
      noteId: n.id,
      title: n.title,
      creatorName: n.creator.name,
      createdAt: n.createdAt,
      updatedAt: n.updatedAt,
      isPublished: n.isPublished,
    }));

    return c.json(activity, 200);
  })

  // GET /admin/analytics/summary - analytics summary
  .openapi(getAnalyticsSummaryRoute, async c => {
    const db = getDb(c);
    const days = parseInt(c.req.valid('query').days || '30', 10);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Total views and unique visitors
    const [totals] = await db
      .select({
        totalViews: count(),
        uniqueVisitors: count(sql`DISTINCT ${pageView.sessionHash}`),
      })
      .from(pageView)
      .where(gte(pageView.createdAt, startDate));

    // Top pages
    const topPages = await db
      .select({
        path: pageView.path,
        title: sql<string>`MAX(${pageView.pageTitle})`.as('title'),
        views: count().as('views'),
        visitors: count(sql`DISTINCT ${pageView.sessionHash}`).as('visitors'),
      })
      .from(pageView)
      .where(gte(pageView.createdAt, startDate))
      .groupBy(pageView.path)
      .orderBy(t => desc(t.views))
      .limit(20);

    // Top referrers
    const topReferrers = await db
      .select({
        referrer: sql<string>`${pageView.referrer}`.as('referrer'),
        views: count().as('views'),
      })
      .from(pageView)
      .where(and(isNotNull(pageView.referrer), gte(pageView.createdAt, startDate)))
      .groupBy(pageView.referrer)
      .orderBy(t => desc(t.views))
      .limit(20);

    // UTM campaigns
    const topCampaigns = await db
      .select({
        utmSource: pageView.utmSource,
        utmMedium: pageView.utmMedium,
        utmCampaign: pageView.utmCampaign,
        views: count().as('views'),
        visitors: count(sql`DISTINCT ${pageView.sessionHash}`).as('visitors'),
      })
      .from(pageView)
      .where(and(isNotNull(pageView.utmSource), gte(pageView.createdAt, startDate)))
      .groupBy(pageView.utmSource, pageView.utmMedium, pageView.utmCampaign)
      .orderBy(t => desc(t.views))
      .limit(20);

    // Browsers
    const browsers = await db
      .select({
        browser: pageView.browser,
        views: count().as('views'),
      })
      .from(pageView)
      .where(gte(pageView.createdAt, startDate))
      .groupBy(pageView.browser)
      .orderBy(t => desc(t.views));

    // Devices
    const devices = await db
      .select({
        device: pageView.device,
        views: count().as('views'),
      })
      .from(pageView)
      .where(gte(pageView.createdAt, startDate))
      .groupBy(pageView.device)
      .orderBy(t => desc(t.views));

    // Screen widths
    const screenWidths = await db
      .select({
        screenWidth: pageView.screenWidth,
        views: count().as('views'),
      })
      .from(pageView)
      .where(gte(pageView.createdAt, startDate))
      .groupBy(pageView.screenWidth)
      .orderBy(t => desc(t.views));

    // Languages
    const languages = await db
      .select({
        language: pageView.language,
        views: count().as('views'),
      })
      .from(pageView)
      .where(gte(pageView.createdAt, startDate))
      .groupBy(pageView.language)
      .orderBy(t => desc(t.views))
      .limit(10);

    // Operating systems
    const operatingSystems = await db
      .select({
        os: pageView.os,
        views: count().as('views'),
      })
      .from(pageView)
      .where(gte(pageView.createdAt, startDate))
      .groupBy(pageView.os)
      .orderBy(t => desc(t.views));

    return c.json(
      {
        totalViews: Number(totals.totalViews || 0),
        uniqueVisitors: Number(totals.uniqueVisitors || 0),
        topPages: topPages.map(p => ({
          path: p.path,
          title: p.title,
          views: Number(p.views),
          visitors: Number(p.visitors),
        })),
        topReferrers: topReferrers.map(r => ({
          referrer: r.referrer,
          views: Number(r.views),
        })),
        topCampaigns: topCampaigns.map(c => ({
          utmSource: c.utmSource,
          utmMedium: c.utmMedium,
          utmCampaign: c.utmCampaign,
          views: Number(c.views),
          visitors: Number(c.visitors),
        })),
        browsers: browsers.map(b => ({
          browser: b.browser,
          views: Number(b.views),
        })),
        devices: devices.map(d => ({
          device: d.device,
          views: Number(d.views),
        })),
        screenWidths: screenWidths.map(s => ({
          screenWidth: s.screenWidth,
          views: Number(s.views),
        })),
        languages: languages.map(l => ({
          language: l.language,
          views: Number(l.views),
        })),
        operatingSystems: operatingSystems.map(o => ({
          os: o.os,
          views: Number(o.views),
        })),
      },
      200,
    );
  })

  // GET /admin/analytics/timeseries - analytics timeseries
  .openapi(getAnalyticsTimeSeriesRoute, async c => {
    const db = getDb(c);
    const days = parseInt(c.req.valid('query').days || '30', 10);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const timeseries = await db
      .select({
        date: sql<string>`DATE(${pageView.createdAt})`.as('date'),
        views: count().as('views'),
        visitors: count(sql`DISTINCT ${pageView.sessionHash}`).as('visitors'),
      })
      .from(pageView)
      .where(gte(pageView.createdAt, startDate))
      .groupBy(sql`DATE(${pageView.createdAt})`)
      .orderBy(sql`DATE(${pageView.createdAt})`);

    return c.json(
      timeseries.map(t => ({
        date: t.date,
        views: Number(t.views),
        visitors: Number(t.visitors),
      })),
      200,
    );
  });
