import { db, type Database } from '../db';
import { env, type Env } from '../env';

/**
 * Get the database instance. Returns the singleton pg pool.
 * Accepts context arg for API compatibility with route handlers
 * (previously pulled from Hono context for Workers).
 */
export function getDb(_c: unknown): Database {
  return db;
}

/**
 * Get the environment config. Returns the singleton parsed env.
 * Accepts context arg for API compatibility with route handlers.
 */
export function getEnv(_c: unknown): Env {
  return env;
}
