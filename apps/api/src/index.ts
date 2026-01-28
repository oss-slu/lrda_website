import { OpenAPIHono } from '@hono/zod-openapi';
import { apiReference } from '@scalar/hono-api-reference';
import { cors } from 'hono/cors';
import { env } from './env';
import { logger } from './lib/logger';
import { routes } from './routes';
import { auth } from './auth';
import type { AppEnv } from './types';

const app = new OpenAPIHono<AppEnv>();

// CORS middleware
// Note: credentials: true requires specific origins, not '*'
app.use(
  '*',
  cors({
    origin:
      env.NODE_ENV === 'development' ?
        ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002']
      : (env.CORS_ORIGINS?.split(',') ?? []),
    credentials: true,
    allowHeaders: ['Content-Type', 'Authorization'],
  }),
);

// Mount better-auth handler
app.on(['POST', 'GET'], '/api/auth/*', c => {
  return auth.handler(c.req.raw);
});

// Mount API routes
app.route('/api', routes);

// OpenAPI JSON spec
app.doc('/openapi.json', {
  openapi: '3.1.0',
  info: {
    title: 'LRDA API',
    version: '0.0.1',
    description: "Where's Religion? API Server",
  },
  servers: [
    {
      url: env.BETTER_AUTH_URL,
      description: env.NODE_ENV === 'production' ? 'Production' : 'Development',
    },
  ],
});

// Scalar API Reference UI
app.get(
  '/docs',
  apiReference({
    spec: {
      url: '/openapi.json',
    },
    theme: 'purple',
    layout: 'modern',
    defaultHttpClient: {
      targetKey: 'js',
      clientKey: 'fetch',
    },
  }),
);

// Global error handler
app.onError((err, c) => {
  logger.error({ error: err.message }, 'Request error');

  if ('statusCode' in err && typeof err.statusCode === 'number') {
    return c.json(
      { error: err.message, code: (err as { code?: string }).code },
      err.statusCode as 400,
    );
  }

  return c.json({ error: 'Internal server error' }, 500);
});

// 404 handler
app.notFound(c => {
  return c.json({ error: 'Not found' }, 404);
});

// Start server
const server = Bun.serve({
  port: env.PORT,
  fetch: app.fetch,
});

logger.info(`API server running at http://${server.hostname}:${server.port}`);
logger.info(`API docs available at http://${server.hostname}:${server.port}/docs`);

export { app };
