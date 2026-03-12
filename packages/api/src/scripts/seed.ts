/**
 * Database Seed Script
 *
 * Populates the D1 (SQLite) database with hand-crafted fixture data.
 * Safe to run multiple times (deletes and re-inserts).
 *
 * Usage:
 *   pnpm db:seed                  # Dry-run (preview only)
 *   pnpm db:seed --yolo           # Write to LOCAL database
 *   pnpm db:seed --yolo --remote  # Write to REMOTE (production) D1
 *
 * From project root:
 *   pnpm api:db:seed                             # Local with --yolo
 *   pnpm api:db:seed:remote                      # Remote with --yolo --remote
 */

import { hashPassword } from 'better-auth/crypto';
import * as schema from '../db/schema';
import { users, notes, media, audio, comments, SEED_PASSWORD } from './fixtures/seed-data';
import { openLocalDb } from './local-db';

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

// --- SQL generation helpers ---

function esc(value: string): string {
  return value.replace(/'/g, "''");
}

function sqlVal(v: unknown): string {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (typeof v === 'number') return String(v);
  if (v instanceof Date) return `'${v.toISOString()}'`;
  if (typeof v === 'object') return `'${esc(JSON.stringify(v))}'`;
  return `'${esc(String(v))}'`;
}

async function generateSql(): Promise<string> {
  const hashedPassword = await hashPassword(SEED_PASSWORD);
  const lines: string[] = [];

  // Delete in reverse FK order (PostgreSQL cascades handle FK constraints)
  lines.push(
    'TRUNCATE "comment", "audio", "media", "note", "session", "account", "verification", "user" CASCADE;',
  );

  // Users (non-students first for FK order)
  const nonStudents = users.filter(u => !u.instructorId);
  const students = users.filter(u => u.instructorId);
  for (const u of [...nonStudents, ...students]) {
    lines.push(
      `INSERT INTO "user" (id, name, email, email_verified, role, is_instructor, instructor_id, created_at, updated_at) VALUES (${sqlVal(u.id)}, ${sqlVal(u.name)}, ${sqlVal(u.email)}, ${sqlVal(u.emailVerified)}, ${sqlVal(u.role)}, ${sqlVal(u.isInstructor)}, ${sqlVal((u as any).instructorId ?? null)}, ${sqlVal(u.createdAt)}, ${sqlVal(u.updatedAt)});`,
    );
  }

  // Account records
  for (const u of users) {
    lines.push(
      `INSERT INTO "account" (id, account_id, provider_id, user_id, password) VALUES (${sqlVal(`${u.id}-credential`)}, ${sqlVal(u.id)}, 'credential', ${sqlVal(u.id)}, ${sqlVal(hashedPassword)});`,
    );
  }

  // Notes
  for (const n of notes) {
    lines.push(
      `INSERT INTO "note" (id, title, text, creator_id, latitude, longitude, location_name, is_published, approval_requested, tags, time, created_at, updated_at) VALUES (${sqlVal(n.id)}, ${sqlVal(n.title)}, ${sqlVal(n.text)}, ${sqlVal(n.creatorId)}, ${sqlVal(n.latitude)}, ${sqlVal(n.longitude)}, ${sqlVal((n as any).locationName ?? null)}, ${sqlVal(n.isPublished)}, ${sqlVal(n.approvalRequested)}, ${sqlVal(n.tags)}, ${sqlVal(n.time)}, ${sqlVal(n.createdAt)}, ${sqlVal(n.updatedAt)});`,
    );
  }

  // Media
  for (const m of media) {
    lines.push(
      `INSERT INTO "media" (id, note_id, type, uri, thumbnail_uri) VALUES (${sqlVal(m.id)}, ${sqlVal(m.noteId)}, ${sqlVal(m.type)}, ${sqlVal(m.uri)}, ${sqlVal((m as any).thumbnailUri ?? null)});`,
    );
  }

  // Audio
  for (const a of audio) {
    lines.push(
      `INSERT INTO "audio" (id, note_id, uri, name, duration) VALUES (${sqlVal(a.id)}, ${sqlVal(a.noteId)}, ${sqlVal(a.uri)}, ${sqlVal(a.name)}, ${sqlVal(a.duration)});`,
    );
  }

  // Comments (parents first for FK order)
  const parents = comments.filter(c => c.parentId === null);
  const replies = comments.filter(c => c.parentId !== null);
  for (const c of [...parents, ...replies]) {
    lines.push(
      `INSERT INTO "comment" (id, note_id, author_id, author_name, text, position, thread_id, parent_id, is_resolved, created_at, updated_at) VALUES (${sqlVal(c.id)}, ${sqlVal(c.noteId)}, ${sqlVal(c.authorId)}, ${sqlVal(c.authorName)}, ${sqlVal(c.text)}, ${sqlVal(c.position)}, ${sqlVal(c.threadId)}, ${sqlVal(c.parentId)}, ${sqlVal(c.isResolved)}, ${sqlVal(c.createdAt)}, ${sqlVal(c.updatedAt)});`,
    );
  }

  return lines.join('\n');
}

// --- Local seed via Drizzle ORM ---

async function seedLocal() {
  const { db, pool } = openLocalDb();

  try {
    await pool.query('SELECT 1');
    log('info', 'Database connection verified');

    log('info', 'Deleting all rows...');
    await pool.query(
      'TRUNCATE "comment", "audio", "media", "note", "session", "account", "verification", "user" CASCADE',
    );
    log('info', 'All tables cleared');

    log('info', 'Inserting users...');
    const nonStudents = users.filter(u => !u.instructorId);
    const students = users.filter(u => u.instructorId);
    await db.insert(schema.user).values(nonStudents);
    if (students.length > 0) {
      await db.insert(schema.user).values(students);
    }
    log('info', `  Inserted ${users.length} users`);

    log('info', 'Creating account records (hashing password)...');
    const hashedPassword = await hashPassword(SEED_PASSWORD);
    const accounts = users.map(u => ({
      id: `${u.id}-credential`,
      accountId: u.id,
      providerId: 'credential',
      userId: u.id,
      password: hashedPassword,
    }));
    await db.insert(schema.account).values(accounts);
    log('info', `  Inserted ${accounts.length} account records (password: ${SEED_PASSWORD})`);

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
    const parents = comments.filter(c => c.parentId === null);
    const replies = comments.filter(c => c.parentId !== null);
    await db.insert(schema.comment).values(parents);
    if (replies.length > 0) {
      await db.insert(schema.comment).values(replies);
    }
    log(
      'info',
      `  Inserted ${comments.length} comments (${parents.length} parents, ${replies.length} replies)`,
    );

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

// --- Main ---

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--yolo')) {
    DRY_RUN = false;
  }

  log('info', 'Seed script starting...');
  log(
    'info',
    DRY_RUN ?
      'DRY RUN MODE - No changes will be written (use --yolo to write)'
    : 'YOLO MODE - Changes WILL be written to database',
  );

  if (DRY_RUN) {
    log('info', 'Would delete all rows and insert:');
    log('info', `  Users:    ${users.length} (with account records for login)`);
    log('info', `  Notes:    ${notes.length}`);
    log('info', `  Media:    ${media.length}`);
    log('info', `  Audio:    ${audio.length}`);
    log('info', `  Comments: ${comments.length}`);
    log('info', `  Shared password: ${SEED_PASSWORD}`);
    log('info', 'Run with --yolo to apply changes');
    return;
  }

  await seedLocal();
}

main();
