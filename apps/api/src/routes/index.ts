import { OpenAPIHono } from '@hono/zod-openapi';
import { healthRoutes } from './health';
import { userRoutes } from './users';
import { adminRoutes } from './admin';
import type { AppEnv } from '../types';

export const routes = new OpenAPIHono<AppEnv>()
  .route('/', healthRoutes)
  .route('/users', userRoutes)
  .route('/admin', adminRoutes);
