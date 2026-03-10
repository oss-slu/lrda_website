/**
 * Local D1 database helper for scripts.
 *
 * Connects to the local wrangler D1 SQLite file using bun:sqlite,
 * giving scripts direct access to the same database that `wrangler dev` uses.
 *
 * Usage:
 *   import { openLocalDb } from './local-db';
 *   const { db, sqlite } = openLocalDb();
 *   // db    = Drizzle ORM instance (same schema as the Worker)
 *   // sqlite = raw bun:sqlite Database (for CREATE TABLE, etc.)
 */

import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import * as path from 'path';
import * as fs from 'fs';
import * as schema from '../db/schema';

const API_ROOT = path.resolve(import.meta.dirname, '..', '..');

/**
 * Find the local D1 SQLite file that wrangler dev creates.
 * It lives at .wrangler/state/v3/d1/miniflare-D1DatabaseObject/<hash>.sqlite
 */
function findLocalD1Path(): string {
  // Allow explicit override via env var
  if (process.env.D1_DB_PATH) {
    return process.env.D1_DB_PATH;
  }

  const d1Dir = path.join(API_ROOT, '.wrangler', 'state', 'v3', 'd1', 'miniflare-D1DatabaseObject');

  if (!fs.existsSync(d1Dir)) {
    throw new Error(
      `D1 local directory not found at ${d1Dir}.\n` +
      'Run "pnpm dev:api" at least once to initialize the local D1 database, or set D1_DB_PATH.',
    );
  }

  const files = fs.readdirSync(d1Dir).filter(f => f.endsWith('.sqlite'));

  if (files.length === 0) {
    throw new Error(
      `No .sqlite files found in ${d1Dir}.\n` +
      'Run "pnpm dev:api" at least once to initialize the local D1 database.',
    );
  }

  if (files.length > 1) {
    console.warn(`[local-db] Multiple .sqlite files found, using first: ${files[0]}`);
  }

  return path.join(d1Dir, files[0]);
}

export function openLocalDb() {
  const dbPath = findLocalD1Path();
  console.log(`[local-db] Opening ${dbPath}`);

  const sqlite = new Database(dbPath);

  // Enable WAL mode and foreign keys (match D1 defaults)
  sqlite.exec('PRAGMA journal_mode = WAL');
  sqlite.exec('PRAGMA foreign_keys = ON');

  const db = drizzle(sqlite, { schema });

  return { db, sqlite, dbPath };
}
