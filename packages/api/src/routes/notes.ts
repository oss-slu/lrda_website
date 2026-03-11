import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import {
  ErrorSchema,
  NoteResponseSchema,
  CreateNoteInputSchema,
  UpdateNoteInputSchema,
} from '@lrda/shared';
import { eq, and, gte, lte, desc, inArray, or, like, asc } from 'drizzle-orm';
import { note, media, audio, user } from '../db/schema';
import { requireAuth, authMiddleware } from '../middleware/auth';
import type { AppEnv } from '../types';
import { getDb, getEnv } from './helpers';
import { reverseGeocode } from '../lib/geocode';

// Alias for backward compatibility in route definitions
const NoteWithRelationsSchema = NoteResponseSchema;

const ListNotesQuerySchema = z.object({
  published: z
    .string()
    .transform(v => v === 'true')
    .optional(),
  creatorId: z.string().optional(),
  search: z.string().optional(),
  sort: z.enum(['newest', 'oldest', 'alphabetical']).optional(),
  minLat: z.string().transform(Number).optional(),
  maxLat: z.string().transform(Number).optional(),
  minLng: z.string().transform(Number).optional(),
  maxLng: z.string().transform(Number).optional(),
  approvalRequested: z
    .string()
    .transform(v => v === 'true')
    .optional(),
  limit: z.string().transform(Number).default('20').pipe(z.number().int().positive().max(200)),
  offset: z.string().transform(Number).default('0').pipe(z.number().int().min(0)),
});

// Routes

const listNotesRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Notes'],
  middleware: [authMiddleware],
  request: {
    query: ListNotesQuerySchema,
  },
  responses: {
    200: {
      content: { 'application/json': { schema: z.array(NoteWithRelationsSchema) } },
      description: 'List of notes',
    },
  },
});

const getNoteRoute = createRoute({
  method: 'get',
  path: '/{id}',
  tags: ['Notes'],
  middleware: [authMiddleware],
  request: {
    params: z.object({
      id: z.string(),
    }),
  },
  responses: {
    200: {
      content: { 'application/json': { schema: NoteWithRelationsSchema } },
      description: 'Note details',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Note not found',
    },
  },
});

const createNoteRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Notes'],
  middleware: [requireAuth],
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateNoteInputSchema,
        },
      },
    },
  },
  responses: {
    201: {
      content: { 'application/json': { schema: NoteWithRelationsSchema } },
      description: 'Created note',
    },
    401: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Unauthorized',
    },
  },
});

const updateNoteRoute = createRoute({
  method: 'patch',
  path: '/{id}',
  tags: ['Notes'],
  middleware: [requireAuth],
  request: {
    params: z.object({
      id: z.string(),
    }),
    body: {
      content: {
        'application/json': {
          schema: UpdateNoteInputSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: NoteWithRelationsSchema } },
      description: 'Updated note',
    },
    401: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Unauthorized',
    },
    403: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Forbidden - can only update own notes',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Note not found',
    },
  },
});

const deleteNoteRoute = createRoute({
  method: 'delete',
  path: '/{id}',
  tags: ['Notes'],
  middleware: [requireAuth],
  request: {
    params: z.object({
      id: z.string(),
    }),
  },
  responses: {
    204: {
      description: 'Note deleted',
    },
    401: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Unauthorized',
    },
    403: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Forbidden - can only delete own notes',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Note not found',
    },
  },
});

const getStudentNotesRoute = createRoute({
  method: 'get',
  path: '/students/{instructorId}',
  tags: ['Notes'],
  middleware: [requireAuth],
  request: {
    params: z.object({
      instructorId: z.string(),
    }),
    query: z.object({
      approvalRequested: z
        .string()
        .transform(v => v === 'true')
        .optional(),
    }),
  },
  responses: {
    200: {
      content: { 'application/json': { schema: z.array(NoteWithRelationsSchema) } },
      description: 'Notes from instructor students',
    },
    401: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Unauthorized',
    },
    403: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Forbidden - can only view own students notes',
    },
  },
});

// Create router
export const noteRoutes = new OpenAPIHono<AppEnv>()
  // GET /notes - list notes with filters
  .openapi(listNotesRoute, async c => {
    const db = getDb(c);
    const query = c.req.valid('query');
    const authUser = c.get('user') as AppEnv['Variables']['user'];
    const conditions = [];

    // Determine if the authenticated user is the owner of the queried notes
    const isOwner = authUser && query.creatorId && authUser.id === query.creatorId;

    if (isOwner) {
      // Owners can optionally filter by published status to see their own drafts
      if (query.published !== undefined) {
        conditions.push(eq(note.isPublished, query.published));
      }
      // Otherwise show all their notes (published + drafts)
    } else {
      // Non-owners always see only published notes, regardless of query params
      conditions.push(eq(note.isPublished, true));
    }

    if (query.creatorId) {
      conditions.push(eq(note.creatorId, query.creatorId));
    }
    if (query.approvalRequested !== undefined) {
      conditions.push(eq(note.approvalRequested, query.approvalRequested));
    }
    if (query.minLat !== undefined && query.maxLat !== undefined) {
      conditions.push(gte(note.latitude, query.minLat));
      conditions.push(lte(note.latitude, query.maxLat));
    }
    if (query.minLng !== undefined && query.maxLng !== undefined) {
      conditions.push(gte(note.longitude, query.minLng));
      conditions.push(lte(note.longitude, query.maxLng));
    }

    // Handle search - search in title and text (not tags due to JSONB complexity)
    if (query.search) {
      const searchTerm = `%${query.search}%`;
      conditions.push(or(like(note.title, searchTerm), like(note.text, searchTerm)));
    }

    // Determine sort order
    let orderBy = desc(note.createdAt); // Default: newest first
    if (query.sort === 'oldest') {
      orderBy = asc(note.createdAt);
    } else if (query.sort === 'alphabetical') {
      orderBy = asc(note.title);
    }

    const results = await db.query.note.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: {
        media: true,
        audio: true,
      },
      limit: query.limit,
      offset: query.offset,
      orderBy: orderBy,
    });

    return c.json(results, 200);
  })

  // GET /notes/:id - get single note
  .openapi(getNoteRoute, async c => {
    const db = getDb(c);
    const { id } = c.req.valid('param');
    const authUser = c.get('user') as AppEnv['Variables']['user'];

    const result = await db.query.note.findFirst({
      where: eq(note.id, id),
      with: {
        media: true,
        audio: true,
        comments: true,
      },
    });

    if (!result) {
      return c.json({ error: 'Note not found' }, 404);
    }

    // Unpublished notes are only visible to their creator
    if (!result.isPublished && (!authUser || authUser.id !== result.creatorId)) {
      return c.json({ error: 'Note not found' }, 404);
    }

    return c.json(result, 200);
  })

  // POST /notes - create note
  .openapi(createNoteRoute, async c => {
    const db = getDb(c);
    const authUser = c.get('user') as NonNullable<AppEnv['Variables']['user']>;
    const body = c.req.valid('json');

    // Reverse geocode to get a human-readable address if coords are provided
    let computedLocation: string | null = null;
    if (body.latitude != null && body.longitude != null) {
      computedLocation = await reverseGeocode(body.latitude, body.longitude, getEnv(c).GOOGLE_MAPS_API_KEY);
    }
    if (!computedLocation && body.locationName) {
      computedLocation = body.locationName;
    }

    // Create the note
    const [createdNote] = await db
      .insert(note)
      .values({
        title: body.title || null,
        text: body.text,
        creatorId: authUser.id,
        latitude: body.latitude ?? null,
        longitude: body.longitude ?? null,
        locationName: computedLocation,
        isPublished: body.isPublished,
        approvalRequested: body.approvalRequested,
        tags: body.tags || [],
        time: body.time ? new Date(body.time) : new Date(),
      })
      .returning();

    // Insert media if provided
    if (body.media?.length) {
      await db.insert(media).values(
        body.media.map(m => ({
          noteId: createdNote.id,
          type: m.type,
          uri: m.uri,
          thumbnailUri: m.thumbnailUri || null,
          uuid: m.uuid || null,
        })),
      );
    }

    // Insert audio if provided
    if (body.audio?.length) {
      await db.insert(audio).values(
        body.audio.map(a => ({
          noteId: createdNote.id,
          uri: a.uri,
          name: a.name || null,
          duration: a.duration || null,
          uuid: a.uuid || null,
        })),
      );
    }

    // Fetch the note with relations
    const result = await db.query.note.findFirst({
      where: eq(note.id, createdNote.id),
      with: {
        media: true,
        audio: true,
      },
    });

    if (!result) {
      throw new Error('Failed to retrieve created note');
    }
    return c.json(result, 201);
  })

  // PATCH /notes/:id - update note
  .openapi(updateNoteRoute, async c => {
    const db = getDb(c);
    const authUser = c.get('user') as NonNullable<AppEnv['Variables']['user']>;
    const { id } = c.req.valid('param');
    const body = c.req.valid('json');

    // Check if note exists and user owns it
    const existingNote = await db.query.note.findFirst({
      where: eq(note.id, id),
    });

    if (!existingNote) {
      return c.json({ error: 'Note not found' }, 404);
    }

    // Allow update if user owns the note, is admin, or is the creator's instructor
    const isAdmin = authUser.role === 'admin';
    let isCreatorsInstructor = false;
    if (authUser.isInstructor === true && existingNote.creatorId !== authUser.id) {
      const noteCreator = await db.query.user.findFirst({
        where: eq(user.id, existingNote.creatorId),
        columns: { instructorId: true },
      });
      isCreatorsInstructor = noteCreator?.instructorId === authUser.id;
    }
    if (existingNote.creatorId !== authUser.id && !isAdmin && !isCreatorsInstructor) {
      return c.json({ error: 'You can only update your own notes' }, 403);
    }

    // Build update object
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (body.title !== undefined) updateData.title = body.title;
    if (body.text !== undefined) updateData.text = body.text;
    if (body.latitude !== undefined) updateData.latitude = body.latitude;
    if (body.longitude !== undefined) updateData.longitude = body.longitude;
    if (body.isPublished !== undefined) updateData.isPublished = body.isPublished;
    if (body.approvalRequested !== undefined) updateData.approvalRequested = body.approvalRequested;
    if (body.isReturned !== undefined) updateData.isReturned = body.isReturned;
    if (body.tags !== undefined) updateData.tags = body.tags;
    if (body.time !== undefined) updateData.time = new Date(body.time);

    // Re-geocode if coordinates changed
    if (body.latitude !== undefined || body.longitude !== undefined) {
      const lat = body.latitude ?? existingNote.latitude;
      const lng = body.longitude ?? existingNote.longitude;
      if (lat != null && lng != null) {
        updateData.locationName = await reverseGeocode(lat, lng, getEnv(c).GOOGLE_MAPS_API_KEY);
      } else {
        updateData.locationName = null;
      }
    }
    if (updateData.locationName == null && body.locationName) {
      updateData.locationName = body.locationName;
    }

    // Update the note
    await db.update(note).set(updateData).where(eq(note.id, id));

    // Handle media updates - replace all media if provided
    if (body.media !== undefined) {
      // Delete existing media
      await db.delete(media).where(eq(media.noteId, id));

      // Insert new media
      if (body.media.length > 0) {
        await db.insert(media).values(
          body.media.map(m => ({
            noteId: id,
            type: m.type,
            uri: m.uri,
            thumbnailUri: m.thumbnailUri || null,
            uuid: m.uuid || null,
          })),
        );
      }
    }

    // Handle audio updates - replace all audio if provided
    if (body.audio !== undefined) {
      // Delete existing audio
      await db.delete(audio).where(eq(audio.noteId, id));

      // Insert new audio
      if (body.audio.length > 0) {
        await db.insert(audio).values(
          body.audio.map(a => ({
            noteId: id,
            uri: a.uri,
            name: a.name || null,
            duration: a.duration || null,
            uuid: a.uuid || null,
          })),
        );
      }
    }

    // Fetch the updated note with relations
    const result = await db.query.note.findFirst({
      where: eq(note.id, id),
      with: {
        media: true,
        audio: true,
      },
    });

    if (!result) {
      throw new Error('Failed to retrieve updated note');
    }
    return c.json(result, 200);
  })

  // DELETE /notes/:id - delete note
  .openapi(deleteNoteRoute, async c => {
    const db = getDb(c);
    const authUser = c.get('user') as NonNullable<AppEnv['Variables']['user']>;
    const { id } = c.req.valid('param');

    // Check if note exists and user owns it
    const existingNote = await db.query.note.findFirst({
      where: eq(note.id, id),
    });

    if (!existingNote) {
      return c.json({ error: 'Note not found' }, 404);
    }

    // Allow delete if user owns the note, is admin, or is the creator's instructor
    const isAdmin = authUser.role === 'admin';
    let isCreatorsInstructor = false;
    if (authUser.isInstructor === true && existingNote.creatorId !== authUser.id) {
      const noteCreator = await db.query.user.findFirst({
        where: eq(user.id, existingNote.creatorId),
        columns: { instructorId: true },
      });
      isCreatorsInstructor = noteCreator?.instructorId === authUser.id;
    }
    if (existingNote.creatorId !== authUser.id && !isAdmin && !isCreatorsInstructor) {
      return c.json({ error: 'You can only delete your own notes' }, 403);
    }

    // Delete the note (cascade deletes media, audio, comments)
    await db.delete(note).where(eq(note.id, id));

    return c.body(null, 204);
  })

  // GET /notes/students/:instructorId - get notes from students of an instructor
  .openapi(getStudentNotesRoute, async c => {
    const db = getDb(c);
    const authUser = c.get('user') as NonNullable<AppEnv['Variables']['user']>;
    const { instructorId } = c.req.valid('param');
    const query = c.req.valid('query');

    // Only allow instructors to view their own students' notes
    if (authUser.id !== instructorId && authUser.role !== 'admin') {
      return c.json({ error: 'You can only view your own students notes' }, 403);
    }

    // Get student IDs for this instructor
    const students = await db.query.user.findMany({
      where: eq(user.instructorId, instructorId),
      columns: { id: true },
    });

    const studentIds = students.map(s => s.id);

    if (studentIds.length === 0) {
      return c.json([], 200);
    }

    // Build conditions
    const conditions = [inArray(note.creatorId, studentIds)];

    if (query.approvalRequested !== undefined) {
      conditions.push(eq(note.approvalRequested, query.approvalRequested));
    }

    const results = await db.query.note.findMany({
      where: and(...conditions),
      with: {
        media: true,
        audio: true,
      },
      orderBy: desc(note.createdAt),
    });

    return c.json(results, 200);
  });
