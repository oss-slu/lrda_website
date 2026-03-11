/**
 * Local PostgreSQL database helper for scripts.
 *
 * Connects to the local PostgreSQL instance using the DATABASE_URL
 * from .env, giving scripts direct access to the same database
 * that the dev server uses.
 *
 * Usage:
 *   import { openLocalDb } from './local-db';
 *   const { db, pool } = openLocalDb();
 *   // db   = Drizzle ORM instance (same schema as the server)
 *   // pool = raw pg Pool (for raw queries, cleanup, etc.)
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../db/schema';

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      'DATABASE_URL not set.\n' +
      'Make sure packages/api/.env exists with DATABASE_URL=postgresql://...',
    );
  }
  return url;
}

export function openLocalDb() {
  const connectionString = getDatabaseUrl();
  console.log(`[local-db] Connecting to PostgreSQL...`);

  const pool = new Pool({ connectionString, max: 5 });
  const db = drizzle(pool, { schema });

  return { db, pool };
}
