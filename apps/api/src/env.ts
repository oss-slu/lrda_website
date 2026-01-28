import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3002),
  DATABASE_URL: z.string(),
  LOG_LEVEL: z.string().default('info'),
  BETTER_AUTH_SECRET: z.string(),
  BETTER_AUTH_URL: z.string().default('http://localhost:3002'),
  CORS_ORIGINS: z.string().optional(),
});

type Env = z.infer<typeof EnvSchema>;

function parseEnv(): Env {
  const result = EnvSchema.safeParse(process.env);

  if (!result.success) {
    console.error('Environment validation failed:');
    for (const issue of result.error.issues) {
      console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
    }
    process.exit(1);
  }

  return result.data;
}

export const env = parseEnv();
