import type { Database } from '../db';

/**
 * Get the D1-backed database instance from Hono context.
 * OpenAPIHono's openapi() handler erases generic type info, making c typed
 * as Context<never>. These helpers bypass the type system to access runtime values.
 */
export function getDb(c: unknown): Database {
  return (c as any).get('db');
}

/**
 * Get the Cloudflare env bindings from Hono context.
 */
export function getEnv(c: unknown): Env {
  return (c as any).env;
}
