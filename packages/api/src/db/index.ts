import { drizzle } from 'drizzle-orm/d1';
import { sql } from 'drizzle-orm';
import type { DrizzleD1Database } from 'drizzle-orm/d1';
import * as schema from './schema';

export type Database = DrizzleD1Database<typeof schema>;

export function createDb(d1: D1Database): Database {
  return drizzle(d1, { schema });
}

export async function testConnection(db: Database): Promise<boolean> {
  try {
    await db.run(sql`SELECT 1`);
    return true;
  } catch {
    return false;
  }
}
