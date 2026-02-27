import { z } from '@hono/zod-openapi';

export const ErrorSchema = z.object({
  error: z.string(),
});
