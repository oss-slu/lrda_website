import type { Context, MiddlewareHandler } from 'hono';
import { auth } from '../auth';
import type { AuthUser, AuthSession } from '../types';

/**
 * Optional auth middleware - sets user/session on context if present
 */
export const authMiddleware: MiddlewareHandler = async (c, next) => {
  try {
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });

    c.set('user', session?.user || null);
    c.set('session', session?.session || null);
  } catch (error) {
    console.error('Auth middleware error:', error);
    c.set('user', null);
    c.set('session', null);
  }

  await next();
};

/**
 * Required auth middleware - returns 401 if no valid session
 */
export const requireAuth: MiddlewareHandler = async (c, next) => {
  try {
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });

    if (!session?.user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    c.set('user', session.user);
    c.set('session', session.session);

    await next();
  } catch (error) {
    console.error('Auth verification error:', error);
    return c.json({ error: 'Unauthorized' }, 401);
  }
};

/**
 * Required admin middleware - returns 403 if user is not admin
 * Must be used after requireAuth
 */
export const requireAdmin: MiddlewareHandler = async (c, next) => {
  const user = c.get('user') as AuthUser | null;

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  if (user.role !== 'admin') {
    return c.json({ error: 'Forbidden - Admin access required' }, 403);
  }

  await next();
};

/**
 * Helper to get auth info from context
 */
export function getAuth(c: Context): {
  user: AuthUser | null;
  session: AuthSession | null;
} {
  return {
    user: c.get('user') as AuthUser | null,
    session: c.get('session') as AuthSession | null,
  };
}
