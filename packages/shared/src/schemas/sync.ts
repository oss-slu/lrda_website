import { z } from 'zod';

export const SyncStatusSchema = z.object({
  running: z.boolean(),
  lastRunAt: z.string().or(z.date()).nullable(),
  lastRunStatus: z.string().nullable(),
  nextRunAt: z.string().or(z.date()).nullable(),
  intervalMs: z.number(),
});

export const SyncRunSchema = z.object({
  id: z.string(),
  startedAt: z.string().or(z.date()),
  finishedAt: z.string().or(z.date()).nullable(),
  durationMs: z.number().nullable(),
  status: z.string(),
  notesCreated: z.number(),
  notesUpdated: z.number(),
  notesSkipped: z.number(),
  notesErrored: z.number(),
  error: z.string().nullable(),
  triggeredBy: z.string().nullable(),
});

export const SyncRunDetailSchema = z.object({
  id: z.string(),
  runId: z.string(),
  noteId: z.string(),
  action: z.string(),
  error: z.string().nullable(),
  createdAt: z.string().or(z.date()),
});

export const SyncRunWithDetailsSchema = SyncRunSchema.extend({
  details: z.array(SyncRunDetailSchema),
});

export const SyncLogResponseSchema = z.object({
  runs: z.array(SyncRunSchema),
  total: z.number(),
});

export const SyncUserResultSchema = z.object({
  created: z.number(),
  updated: z.number(),
  skipped: z.number(),
});
