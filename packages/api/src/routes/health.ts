import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { testConnection } from '../db';
import { isShuttingDown } from '../lib/shutdown-state';
import type { AppEnv } from '../types';

const HealthResponseSchema = z.object({
  status: z.enum(['healthy', 'unhealthy']),
  timestamp: z.string(),
  database: z.enum(['connected', 'disconnected']),
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
      description: 'Service unhealthy or shutting down',
    },
  },
});

export const healthRoutes = new OpenAPIHono<AppEnv>().openapi(getHealthRoute, async c => {
  const shuttingDown = isShuttingDown();
  const dbConnected = shuttingDown ? false : await testConnection();
  const healthy = dbConnected && !shuttingDown;

  return c.json(
    {
      status: healthy ? ('healthy' as const) : ('unhealthy' as const),
      timestamp: new Date().toISOString(),
      database: dbConnected ? ('connected' as const) : ('disconnected' as const),
    },
    healthy ? 200 : 503,
  );
});
