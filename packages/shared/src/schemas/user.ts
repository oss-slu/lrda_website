import { z } from 'zod';

export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  image: z.string().nullable().optional(),
  role: z.string(),
  isInstructor: z.boolean(),
  createdAt: z.string().or(z.date()),
});

export const PublicUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  image: z.string().nullable().optional(),
  isInstructor: z.boolean(),
  createdAt: z.string().or(z.date()),
});

export const UserDetailSchema = UserSchema.extend({
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
