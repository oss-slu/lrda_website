import { z } from 'zod';

export const CommentPositionSchema = z.object({
  from: z.number(),
  to: z.number(),
});

export const CommentSchema = z.object({
  id: z.string(),
  noteId: z.string(),
  authorId: z.string(),
  authorName: z.string(),
  text: z.string(),
  position: CommentPositionSchema.nullable().optional(),
  threadId: z.string().nullable().optional(),
  parentId: z.string().nullable().optional(),
  isResolved: z.boolean(),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
});

export const CreateCommentInputSchema = z.object({
  noteId: z.string(),
  text: z.string(),
  position: CommentPositionSchema.nullable().optional(),
  threadId: z.string().nullable().optional(),
  parentId: z.string().nullable().optional(),
});

export const UpdateCommentInputSchema = z.object({
  text: z.string().optional(),
  isResolved: z.boolean().optional(),
});
