import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { testConnection } from '../db';
import type { AppBindings } from '../types';
import { getDb, getEnv } from './helpers';

const HealthResponseSchema = z.object({
  status: z.enum(['healthy', 'unhealthy']),
  timestamp: z.string(),
  database: z.enum(['connected', 'disconnected']),
  environment: z.string(),
});

const getHealthRoute = createRoute({
  method: 'get',
  path: '/health',
  tags: ['Health'],
  responses: {
    200: {
      content: {
        'application/json': {
          schema: HealthResponseSchema,
        },
      },
      description: 'Service healthy',
    },
    503: {
      content: {
        'application/json': {
          schema: HealthResponseSchema,
        },
      },
      description: 'Service unhealthy',
    },
  },
});

export const healthRoutes = new OpenAPIHono<AppBindings>().openapi(getHealthRoute, async c => {
  const db = getDb(c);
  const env = getEnv(c);
  const dbConnected = await testConnection(db);
  const healthy = dbConnected;

  return c.json(
    {
      status: healthy ? ('healthy' as const) : ('unhealthy' as const),
      timestamp: new Date().toISOString(),
      database: dbConnected ? ('connected' as const) : ('disconnected' as const),
      environment: env.ENVIRONMENT ?? 'unknown',
    },
    healthy ? 200 : 503,
  );
});
