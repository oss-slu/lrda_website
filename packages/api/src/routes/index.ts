import { OpenAPIHono } from '@hono/zod-openapi';
import { healthRoutes } from './health';
import { userRoutes } from './users';
import { adminRoutes } from './admin';
import { noteRoutes } from './notes';
import { commentRoutes } from './comments';
import type { AppBindings } from '../types';

export const routes = new OpenAPIHono<AppBindings>()
  .route('/', healthRoutes)
  .route('/users', userRoutes)
  .route('/admin', adminRoutes)
  .route('/notes', noteRoutes)
  .route('/comments', commentRoutes);
