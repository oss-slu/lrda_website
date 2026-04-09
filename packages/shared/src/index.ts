import type { z } from 'zod';

// Re-export all schemas
export * from './schemas';

// -- Inferred types from schemas --
// Do NOT define these manually.
// These are auto-derived from the imported Zod schemas above.

import type {
  TagSchema,
  MediaResponseSchema,
  AudioResponseSchema,
  NoteSchema,
  NoteResponseSchema,
  MediaInputSchema,
  AudioInputSchema,
  CreateNoteInputSchema,
  UpdateNoteInputSchema,
  CommentPositionSchema,
  CommentSchema,
  CreateCommentInputSchema,
  UpdateCommentInputSchema,
  UserSchema,
  PublicUserSchema,
  UserDetailSchema,
  AdminUserSchema,
  PendingApplicationSchema,
  StatsSchema,
  ContentStatsSchema,
  RecentActivityItemSchema,
  SyncStatusSchema,
  SyncRunSchema,
  SyncRunDetailSchema,
  SyncRunWithDetailsSchema,
  SyncLogResponseSchema,
  SyncUserResultSchema,
} from './schemas';

// Note types
export type Tag = z.infer<typeof TagSchema>;
export type MediaResponse = z.infer<typeof MediaResponseSchema>;
export type AudioResponse = z.infer<typeof AudioResponseSchema>;
export type NoteData = z.infer<typeof NoteSchema>;
export type NoteResponse = z.infer<typeof NoteResponseSchema>;
export type MediaInput = z.infer<typeof MediaInputSchema>;
export type AudioInput = z.infer<typeof AudioInputSchema>;
export type CreateNoteInput = z.infer<typeof CreateNoteInputSchema>;
export type UpdateNoteInput = z.infer<typeof UpdateNoteInputSchema>;

// Comment types
export type CommentPosition = z.infer<typeof CommentPositionSchema>;
export type CommentResponse = z.infer<typeof CommentSchema>;
export type CreateCommentInput = z.infer<typeof CreateCommentInputSchema>;
export type UpdateCommentInput = z.infer<typeof UpdateCommentInputSchema>;

// User types
export type User = z.infer<typeof UserSchema>;
export type PublicUser = z.infer<typeof PublicUserSchema>;
export type UserDetail = z.infer<typeof UserDetailSchema>;

// Admin types
export type AdminUser = z.infer<typeof AdminUserSchema>;
export type PendingApplication = z.infer<typeof PendingApplicationSchema>;
export type Stats = z.infer<typeof StatsSchema>;
export type ContentStats = z.infer<typeof ContentStatsSchema>;
export type RecentActivityItem = z.infer<typeof RecentActivityItemSchema>;

// Sync types
export type SyncStatus = z.infer<typeof SyncStatusSchema>;
export type SyncRun = z.infer<typeof SyncRunSchema>;
export type SyncRunDetail = z.infer<typeof SyncRunDetailSchema>;
export type SyncRunWithDetails = z.infer<typeof SyncRunWithDetailsSchema>;
export type SyncLogResponse = z.infer<typeof SyncLogResponseSchema>;
export type SyncUserResult = z.infer<typeof SyncUserResultSchema>;
