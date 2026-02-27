import { z } from 'zod';

export const ErrorSchema = z.object({
  error: z.string(),
});

export const SuccessSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
});
