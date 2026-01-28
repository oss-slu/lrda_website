/**
 * Database Seed Script
 *
 * Populates the PostgreSQL database with hand-crafted fixture data
 * for local development. Safe to run multiple times (deletes and re-inserts).
 *
 * Usage:
 *   bun run src/scripts/seed.ts           # Dry-run (preview only)
 *   bun run src/scripts/seed.ts --yolo    # Actually write to database
 *
 * From project root:
 *   pnpm api:db:seed                      # Runs with --yolo
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { sql } from 'drizzle-orm';
import * as schema from '../db/schema';
import { users, notes, media, audio, comments } from './fixtures/seed-data';

const DATABASE_URL = process.env.DATABASE_URL || '';

let DRY_RUN = true;

function log(level: 'info' | 'warn' | 'error', message: string, data?: unknown) {
  const ts = new Date().toISOString();
  const prefix = `[${ts}] [${level.toUpperCase()}]`;
  if (data !== undefined) {
    if (data instanceof Error) {
      console.log(prefix, message, data.message, data.stack);
    } else {
      console.log(prefix, message, JSON.stringify(data, null, 2));
    }
  } else {
    console.log(prefix, message);
  }
}

async function seed() {
  const pool = new Pool({ connectionString: DATABASE_URL });
  const db = drizzle(pool, { schema });

  try {
    // Test connection
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    log('info', 'Database connection verified');

    if (DRY_RUN) {
      log('info', 'DRY RUN - No changes will be written');
      log('info', 'Would truncate ALL tables and insert:');
      log('info', `  Users:    ${users.length}`);
      log('info', `  Notes:    ${notes.length}`);
      log('info', `  Media:    ${media.length}`);
      log('info', `  Audio:    ${audio.length}`);
      log('info', `  Comments: ${comments.length}`);
      log('info', 'Run with --yolo to apply changes');
      return;
    }

    log('info', 'Truncating all tables...');

    // TRUNCATE CASCADE resets the entire database. This is a dev-only tool.
    await db.execute(
      sql`TRUNCATE TABLE "comment", "audio", "media", "note", "session", "account", "verification", "user" CASCADE`,
    );
    log('info', 'All tables truncated');

    // Insert in foreign-key order.
    // Users with instructorId references must be inserted after the
    // referenced instructor, so split into two batches.
    log('info', 'Inserting users...');
    const nonStudents = users.filter((u) => !u.instructorId);
    const students = users.filter((u) => u.instructorId);
    await db.insert(schema.user).values(nonStudents);
    if (students.length > 0) {
      await db.insert(schema.user).values(students);
    }
    log('info', `  Inserted ${users.length} users`);

    log('info', 'Inserting notes...');
    await db.insert(schema.note).values(notes);
    log('info', `  Inserted ${notes.length} notes`);

    log('info', 'Inserting media...');
    await db.insert(schema.media).values(media);
    log('info', `  Inserted ${media.length} media`);

    log('info', 'Inserting audio...');
    await db.insert(schema.audio).values(audio);
    log('info', `  Inserted ${audio.length} audio`);

    log('info', 'Inserting comments...');
    // Insert parent comments first (parentId is null), then replies
    const parents = comments.filter((c) => c.parentId === null);
    const replies = comments.filter((c) => c.parentId !== null);
    await db.insert(schema.comment).values(parents);
    if (replies.length > 0) {
      await db.insert(schema.comment).values(replies);
    }
    log('info', `  Inserted ${comments.length} comments (${parents.length} parents, ${replies.length} replies)`);

    log('info', 'Seed complete', {
      users: users.length,
      notes: notes.length,
      media: media.length,
      audio: audio.length,
      comments: comments.length,
    });
  } catch (error) {
    log('error', 'Seed failed', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--yolo')) {
    DRY_RUN = false;
  }

  if (!DATABASE_URL) {
    console.error('Error: DATABASE_URL environment variable is required');
    process.exit(1);
  }

  log('info', 'Seed script starting...');
  log(
    'info',
    DRY_RUN
      ? 'DRY RUN MODE - No changes will be written (use --yolo to write)'
      : 'YOLO MODE - Changes WILL be written to database',
  );

  await seed();
}

main();
