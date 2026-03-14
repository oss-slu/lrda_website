import { z } from 'zod';

export const AdminUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  image: z.string().nullable().optional(),
  role: z.string().nullable().optional(),
  isInstructor: z.boolean(),
  banned: z.boolean().nullable().optional(),
  banReason: z.string().nullable().optional(),
  banExpires: z.string().or(z.date()).nullable().optional(),
  pendingInstructorDescription: z.string().nullable().optional(),
  createdAt: z.string().or(z.date()),
});

export const PendingApplicationSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  description: z.string(),
  createdAt: z.string().or(z.date()),
});

export const StatsSchema = z.object({
  totalUsers: z.number(),
  totalAdmins: z.number(),
  totalInstructors: z.number(),
  pendingApplications: z.number(),
});

export const ContentStatsSchema = z.object({
  totalNotes: z.number(),
  publishedNotes: z.number(),
  notesThisWeek: z.number(),
  notesThisMonth: z.number(),
});

export const RecentActivityItemSchema = z.object({
  noteId: z.string(),
  title: z.string().nullable(),
  creatorName: z.string(),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
  isPublished: z.boolean(),
});
