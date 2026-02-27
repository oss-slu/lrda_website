import { z } from 'zod';

// -- Value object schemas --

export const TagSchema = z.object({
  label: z.string(),
  origin: z.enum(['user', 'ai']),
});

// -- Response schemas (what the API returns) --

export const MediaResponseSchema = z.object({
  id: z.string(),
  noteId: z.string(),
  type: z.string(),
  uri: z.string(),
  thumbnailUri: z.string().nullable().optional(),
  uuid: z.string().nullable().optional(),
  createdAt: z.string().or(z.date()),
});

export const AudioResponseSchema = z.object({
  id: z.string(),
  noteId: z.string(),
  uri: z.string(),
  name: z.string().nullable().optional(),
  duration: z.string().nullable().optional(),
  uuid: z.string().nullable().optional(),
  createdAt: z.string().or(z.date()),
});

export const NoteSchema = z.object({
  id: z.string(),
  title: z.string().nullable().optional(),
  text: z.string(),
  creatorId: z.string(),
  latitude: z.string().nullable().optional(),
  longitude: z.string().nullable().optional(),
  isPublished: z.boolean(),
  approvalRequested: z.boolean(),
  tags: z.array(TagSchema).nullable().optional(),
  time: z.string().or(z.date()),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
});

export const NoteResponseSchema = NoteSchema.extend({
  media: z.array(MediaResponseSchema).optional(),
  audio: z.array(AudioResponseSchema).optional(),
});

// -- Input schemas (what the API accepts) --

export const MediaInputSchema = z.object({
  type: z.string(),
  uri: z.string(),
  thumbnailUri: z.string().optional(),
  uuid: z.string().optional(),
});

export const AudioInputSchema = z.object({
  uri: z.string(),
  name: z.string().optional(),
  duration: z.string().optional(),
  uuid: z.string().optional(),
});

export const CreateNoteInputSchema = z.object({
  title: z.string().optional(),
  text: z.string().default(''),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  isPublished: z.boolean().default(false),
  approvalRequested: z.boolean().default(false),
  tags: z.array(TagSchema).optional(),
  time: z.string().optional(),
  media: z.array(MediaInputSchema).optional(),
  audio: z.array(AudioInputSchema).optional(),
});

export const UpdateNoteInputSchema = z.object({
  title: z.string().optional(),
  text: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  isPublished: z.boolean().optional(),
  approvalRequested: z.boolean().optional(),
  tags: z.array(TagSchema).optional(),
  time: z.string().optional(),
  media: z
    .array(
      MediaInputSchema.extend({
        id: z.string().optional(),
      }),
    )
    .optional(),
  audio: z
    .array(
      AudioInputSchema.extend({
        id: z.string().optional(),
      }),
    )
    .optional(),
});
