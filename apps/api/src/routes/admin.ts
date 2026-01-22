import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { eq, isNotNull, and, ne } from "drizzle-orm";
import { db } from "../db";
import { user } from "../db/schema";
import { requireAuth, requireAdmin } from "../middleware/auth";
import type { AppEnv } from "../types";

// Schemas
const AdminUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  image: z.string().nullable().optional(),
  role: z.string().nullable().optional(),
  isInstructor: z.boolean(),
  pendingInstructorDescription: z.string().nullable().optional(),
  createdAt: z.string().or(z.date()),
});

const PendingApplicationSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  description: z.string(),
  createdAt: z.string().or(z.date()),
});

const StatsSchema = z.object({
  totalUsers: z.number(),
  totalAdmins: z.number(),
  totalInstructors: z.number(),
  pendingApplications: z.number(),
});

const ErrorSchema = z.object({
  error: z.string(),
});

const SuccessSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
});

// Routes
const getAllUsersRoute = createRoute({
  method: "get",
  path: "/users",
  tags: ["Admin"],
  middleware: [requireAuth, requireAdmin],
  responses: {
    200: {
      content: { "application/json": { schema: z.array(AdminUserSchema) } },
      description: "List of all users",
    },
    401: {
      content: { "application/json": { schema: ErrorSchema } },
      description: "Unauthorized",
    },
    403: {
      content: { "application/json": { schema: ErrorSchema } },
      description: "Forbidden - Admin access required",
    },
  },
});

const getPendingApplicationsRoute = createRoute({
  method: "get",
  path: "/pending-instructors",
  tags: ["Admin"],
  middleware: [requireAuth, requireAdmin],
  responses: {
    200: {
      content: {
        "application/json": { schema: z.array(PendingApplicationSchema) },
      },
      description: "List of pending instructor applications",
    },
    401: {
      content: { "application/json": { schema: ErrorSchema } },
      description: "Unauthorized",
    },
    403: {
      content: { "application/json": { schema: ErrorSchema } },
      description: "Forbidden - Admin access required",
    },
  },
});

const getStatsRoute = createRoute({
  method: "get",
  path: "/stats",
  tags: ["Admin"],
  middleware: [requireAuth, requireAdmin],
  responses: {
    200: {
      content: { "application/json": { schema: StatsSchema } },
      description: "Admin statistics",
    },
    401: {
      content: { "application/json": { schema: ErrorSchema } },
      description: "Unauthorized",
    },
    403: {
      content: { "application/json": { schema: ErrorSchema } },
      description: "Forbidden - Admin access required",
    },
  },
});

const approveInstructorRoute = createRoute({
  method: "post",
  path: "/approve-instructor/{id}",
  tags: ["Admin"],
  middleware: [requireAuth, requireAdmin],
  request: {
    params: z.object({
      id: z.string(),
    }),
  },
  responses: {
    200: {
      content: { "application/json": { schema: SuccessSchema } },
      description: "Application approved",
    },
    401: {
      content: { "application/json": { schema: ErrorSchema } },
      description: "Unauthorized",
    },
    403: {
      content: { "application/json": { schema: ErrorSchema } },
      description: "Forbidden - Admin access required",
    },
    404: {
      content: { "application/json": { schema: ErrorSchema } },
      description: "User not found or no pending application",
    },
  },
});

const rejectInstructorRoute = createRoute({
  method: "post",
  path: "/reject-instructor/{id}",
  tags: ["Admin"],
  middleware: [requireAuth, requireAdmin],
  request: {
    params: z.object({
      id: z.string(),
    }),
    body: {
      content: {
        "application/json": {
          schema: z.object({
            reason: z.string().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: SuccessSchema } },
      description: "Application rejected",
    },
    401: {
      content: { "application/json": { schema: ErrorSchema } },
      description: "Unauthorized",
    },
    403: {
      content: { "application/json": { schema: ErrorSchema } },
      description: "Forbidden - Admin access required",
    },
    404: {
      content: { "application/json": { schema: ErrorSchema } },
      description: "User not found or no pending application",
    },
  },
});

// Create router
export const adminRoutes = new OpenAPIHono<AppEnv>()
  // GET /admin/users - list all users
  .openapi(getAllUsersRoute, async (c) => {
    const users = await db.query.user.findMany({
      columns: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        isInstructor: true,
        pendingInstructorDescription: true,
        createdAt: true,
      },
      orderBy: (user, { desc }) => [desc(user.createdAt)],
    });

    return c.json(users, 200);
  })

  // GET /admin/pending-instructors - list pending applications
  .openapi(getPendingApplicationsRoute, async (c) => {
    const pending = await db.query.user.findMany({
      where: and(
        isNotNull(user.pendingInstructorDescription),
        ne(user.pendingInstructorDescription, ""),
        eq(user.isInstructor, false)
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

    const applications = pending.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      description: u.pendingInstructorDescription || "",
      createdAt: u.createdAt,
    }));

    return c.json(applications, 200);
  })

  // GET /admin/stats - get statistics
  .openapi(getStatsRoute, async (c) => {
    const users = await db.query.user.findMany({
      columns: {
        role: true,
        isInstructor: true,
        pendingInstructorDescription: true,
      },
    });

    const stats = {
      totalUsers: users.length,
      totalAdmins: users.filter((u) => u.role === "admin").length,
      totalInstructors: users.filter((u) => u.isInstructor).length,
      pendingApplications: users.filter(
        (u) => u.pendingInstructorDescription && !u.isInstructor
      ).length,
    };

    return c.json(stats, 200);
  })

  // POST /admin/approve-instructor/:id - approve application
  .openapi(approveInstructorRoute, async (c) => {
    const { id } = c.req.valid("param");

    // Find user with pending application
    const targetUser = await db.query.user.findFirst({
      where: eq(user.id, id),
    });

    if (!targetUser) {
      return c.json({ error: "User not found" }, 404);
    }

    if (!targetUser.pendingInstructorDescription) {
      return c.json({ error: "No pending instructor application" }, 404);
    }

    if (targetUser.isInstructor) {
      return c.json({ error: "User is already an instructor" }, 404);
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

    return c.json(
      { success: true, message: "Instructor application approved" },
      200
    );
  })

  // POST /admin/reject-instructor/:id - reject application
  .openapi(rejectInstructorRoute, async (c) => {
    const { id } = c.req.valid("param");

    // Find user with pending application
    const targetUser = await db.query.user.findFirst({
      where: eq(user.id, id),
    });

    if (!targetUser) {
      return c.json({ error: "User not found" }, 404);
    }

    if (!targetUser.pendingInstructorDescription) {
      return c.json({ error: "No pending instructor application" }, 404);
    }

    // Reject - clear pending description
    await db
      .update(user)
      .set({
        pendingInstructorDescription: null,
        updatedAt: new Date(),
      })
      .where(eq(user.id, id));

    return c.json(
      { success: true, message: "Instructor application rejected" },
      200
    );
  });
