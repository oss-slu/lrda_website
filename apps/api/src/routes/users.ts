import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { user } from '../db/schema';
import { requireAuth } from '../middleware/auth';
import type { AppEnv } from '../types';

// Schemas
const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  image: z.string().nullable().optional(),
  isInstructor: z.boolean(),
  createdAt: z.string().or(z.date()),
});

const UserDetailSchema = UserSchema.extend({
  instructorId: z.string().nullable().optional(),
  pendingInstructorDescription: z.string().nullable().optional(),
  updatedAt: z.string().or(z.date()),
  instructor: z
    .object({
      id: z.string(),
      name: z.string(),
      email: z.string(),
    })
    .nullable()
    .optional(),
});

const ErrorSchema = z.object({
  error: z.string(),
});

// Routes

const getMeRoute = createRoute({
  method: 'get',
  path: '/me',
  tags: ['Users'],
  middleware: [requireAuth],
  responses: {
    200: {
      content: { 'application/json': { schema: UserDetailSchema } },
      description: 'Current authenticated user',
    },
    401: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Unauthorized',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'User not found',
    },
  },
});

const getUserRoute = createRoute({
  method: 'get',
  path: '/{id}',
  tags: ['Users'],
  request: {
    params: z.object({
      id: z.string(),
    }),
  },
  responses: {
    200: {
      content: { 'application/json': { schema: UserSchema } },
      description: 'User by ID',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'User not found',
    },
  },
});

const updateMeRoute = createRoute({
  method: 'patch',
  path: '/me',
  tags: ['Users'],
  middleware: [requireAuth],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            name: z.string().optional(),
            image: z.string().nullable().optional(),
            isInstructor: z.boolean().optional(),
            pendingInstructorDescription: z.string().nullable().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: UserDetailSchema } },
      description: 'Updated user',
    },
    401: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Unauthorized',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'User not found',
    },
  },
});

const getInstructorsRoute = createRoute({
  method: 'get',
  path: '/instructors',
  tags: ['Users'],
  responses: {
    200: {
      content: { 'application/json': { schema: z.array(UserSchema) } },
      description: 'List of instructors',
    },
  },
});

const getStudentsRoute = createRoute({
  method: 'get',
  path: '/{id}/students',
  tags: ['Users'],
  middleware: [requireAuth],
  request: {
    params: z.object({
      id: z.string(),
    }),
  },
  responses: {
    200: {
      content: { 'application/json': { schema: z.array(UserSchema) } },
      description: 'List of students for instructor',
    },
    401: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Unauthorized',
    },
    403: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Forbidden - can only view own students',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Instructor not found',
    },
  },
});

const assignInstructorRoute = createRoute({
  method: 'post',
  path: '/me/instructor',
  tags: ['Users'],
  middleware: [requireAuth],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            instructorId: z.string(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            id: z.string(),
            name: z.string(),
            instructorId: z.string().nullable(),
          }),
        },
      },
      description: 'Updated user with instructor assignment',
    },
    401: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Unauthorized',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Instructor not found',
    },
  },
});

// Create router
export const userRoutes = new OpenAPIHono<AppEnv>()
  // GET /users/me - requires auth
  .openapi(getMeRoute, async c => {
    const authUser = c.get('user') as NonNullable<AppEnv['Variables']['user']>;

    const result = await db.query.user.findFirst({
      where: eq(user.id, authUser.id),
      with: {
        instructor: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!result) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json(
      {
        id: result.id,
        name: result.name,
        email: result.email,
        image: result.image,
        isInstructor: result.isInstructor,
        instructorId: result.instructorId,
        pendingInstructorDescription: result.pendingInstructorDescription,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
        instructor: result.instructor,
      },
      200,
    );
  })

  // PATCH /users/me - requires auth
  .openapi(updateMeRoute, async c => {
    const authUser = c.get('user') as NonNullable<AppEnv['Variables']['user']>;
    const body = c.req.valid('json');

    const [updated] = await db
      .update(user)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(user.id, authUser.id))
      .returning();

    if (!updated) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json(
      {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        image: updated.image,
        isInstructor: updated.isInstructor,
        instructorId: updated.instructorId,
        pendingInstructorDescription: updated.pendingInstructorDescription,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      },
      200,
    );
  })

  // POST /users/me/instructor - requires auth
  .openapi(assignInstructorRoute, async c => {
    const authUser = c.get('user') as NonNullable<AppEnv['Variables']['user']>;
    const body = c.req.valid('json');

    // Verify the instructor exists and is actually an instructor
    const instructor = await db.query.user.findFirst({
      where: eq(user.id, body.instructorId),
    });

    if (!instructor) {
      return c.json({ error: 'Instructor not found' }, 404);
    }

    if (!instructor.isInstructor) {
      return c.json({ error: 'User is not an instructor' }, 404);
    }

    // Update the current user's instructor
    const [updated] = await db
      .update(user)
      .set({
        instructorId: body.instructorId,
        updatedAt: new Date(),
      })
      .where(eq(user.id, authUser.id))
      .returning();

    return c.json(
      {
        id: updated.id,
        name: updated.name,
        instructorId: updated.instructorId,
      },
      200,
    );
  })

  // GET /users/instructors - public
  .openapi(getInstructorsRoute, async c => {
    const instructors = await db.query.user.findMany({
      where: eq(user.isInstructor, true),
      columns: {
        id: true,
        name: true,
        email: true,
        image: true,
        isInstructor: true,
        createdAt: true,
      },
    });

    return c.json(instructors, 200);
  })

  // GET /users/:id - public
  .openapi(getUserRoute, async c => {
    const { id } = c.req.valid('param');

    const result = await db.query.user.findFirst({
      where: eq(user.id, id),
      columns: {
        id: true,
        name: true,
        email: true,
        image: true,
        isInstructor: true,
        createdAt: true,
      },
    });

    if (!result) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json(result, 200);
  })

  // GET /users/:id/students - requires auth
  .openapi(getStudentsRoute, async c => {
    const { id } = c.req.valid('param');
    const authUser = c.get('user') as NonNullable<AppEnv['Variables']['user']>;

    // First verify the instructor exists and is actually an instructor
    const instructor = await db.query.user.findFirst({
      where: eq(user.id, id),
    });

    if (!instructor) {
      return c.json({ error: 'Instructor not found' }, 404);
    }

    if (!instructor.isInstructor) {
      return c.json({ error: 'User is not an instructor' }, 404);
    }

    // Only allow instructors to view their own students
    if (authUser.id !== id) {
      return c.json({ error: 'You can only view your own students' }, 403);
    }

    const students = await db.query.user.findMany({
      where: eq(user.instructorId, id),
      columns: {
        id: true,
        name: true,
        email: true,
        image: true,
        isInstructor: true,
        createdAt: true,
      },
    });

    return c.json(students, 200);
  });
