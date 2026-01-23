/**
 * RERUM to PostgreSQL Sync Script
 *
 * This script continuously syncs data from RERUM (MongoDB) to PostgreSQL.
 * Run as a cron job or background process during the migration period.
 *
 * Usage:
 *   bun run src/scripts/sync-from-rerum.ts           # Dry-run (preview only, no writes)
 *   bun run src/scripts/sync-from-rerum.ts --yolo    # Actually write to database
 *   bun run src/scripts/sync-from-rerum.ts --watch   # Continuous sync (every 30s)
 *   bun run src/scripts/sync-from-rerum.ts --full    # Full re-sync (ignore last sync time)
 *
 * Flags can be combined:
 *   bun run src/scripts/sync-from-rerum.ts --yolo --full --watch
 *
 * Environment variables:
 *   RERUM_API_URL - RERUM API base URL (e.g., https://lived-religion-dev.rerum.io/deer-lr/v1/)
 *   DATABASE_URL  - PostgreSQL connection string
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { eq, sql } from 'drizzle-orm';
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { initializeApp, cert, getApps, type ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import * as fs from 'fs';
import * as schema from '../db/schema';
import type { Tag } from '../db/types';

// Configuration
const RERUM_API_URL = process.env.RERUM_API_URL || process.env.NEXT_PUBLIC_RERUM_PREFIX || '';
const DATABASE_URL = process.env.DATABASE_URL || '';
const SERVICE_ACCOUNT_PATH = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || '';
const SERVICE_ACCOUNT_JSON = process.env.FIREBASE_SERVICE_ACCOUNT || '';
const SYNC_INTERVAL_MS = 30_000; // 30 seconds
const BATCH_SIZE = 100;

// Runtime flags (set by CLI)
// DRY_RUN is true by default for safety - use --yolo to actually write to database
let DRY_RUN = true;

// Sync state table (tracks last sync time)
const syncState = pgTable('sync_state', {
  id: text('id').primaryKey(),
  lastSyncAt: timestamp('last_sync_at').notNull(),
  lastNotesSyncAt: timestamp('last_notes_sync_at'),
  lastCommentsSyncAt: timestamp('last_comments_sync_at'),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Initialize database connection
const pool = new Pool({ connectionString: DATABASE_URL });
const db = drizzle(pool, { schema: { ...schema, syncState } });

// Initialize Firebase Admin SDK (optional - for looking up user emails)
let firebaseInitialized = false;
function initializeFirebase(): boolean {
  if (getApps().length > 0) {
    firebaseInitialized = true;
    return true;
  }

  try {
    let serviceAccount: ServiceAccount;

    if (SERVICE_ACCOUNT_PATH && fs.existsSync(SERVICE_ACCOUNT_PATH)) {
      const fileContent = fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf-8');
      serviceAccount = JSON.parse(fileContent) as ServiceAccount;
    } else if (SERVICE_ACCOUNT_JSON) {
      serviceAccount = JSON.parse(SERVICE_ACCOUNT_JSON) as ServiceAccount;
    } else {
      return false;
    }

    initializeApp({ credential: cert(serviceAccount) });
    firebaseInitialized = true;
    return true;
  } catch {
    return false;
  }
}

// Look up user email from Firebase by UID
async function getFirebaseUserEmail(uid: string): Promise<string | null> {
  if (!firebaseInitialized) return null;
  try {
    const user = await getAuth().getUser(uid);
    return user.email || null;
  } catch {
    return null;
  }
}

// Logger with timestamps
function log(level: 'info' | 'warn' | 'error', message: string, data?: unknown) {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
  if (data) {
    // Handle Error objects specially since JSON.stringify doesn't serialize them
    if (data instanceof Error) {
      console.log(prefix, message, data.message, data.stack);
    } else {
      console.log(prefix, message, JSON.stringify(data, null, 2));
    }
  } else {
    console.log(prefix, message);
  }
}

// Fetch from RERUM API
async function rerumQuery<T>(queryObj: object, limit = 500, skip = 0): Promise<T[]> {
  const url = `${RERUM_API_URL}query?limit=${limit}&skip=${skip}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(queryObj),
  });

  if (!response.ok) {
    throw new Error(`RERUM query failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Fetch all pages from RERUM
async function rerumQueryAll<T>(queryObj: object): Promise<T[]> {
  const allResults: T[] = [];
  let skip = 0;

  while (true) {
    const results = await rerumQuery<T>(queryObj, BATCH_SIZE, skip);
    if (results.length === 0) break;

    allResults.push(...results);
    skip += results.length;

    if (results.length < BATCH_SIZE) break;
  }

  return allResults;
}

// Extract ID from RERUM @id URL
function extractId(rerumId: string): string {
  if (!rerumId) return '';
  const match = rerumId.match(/\/id\/([^\/\?]+)/);
  return match ? match[1] : rerumId;
}

// Normalize creator ID (handle both UID and RERUM URL formats)
function normalizeCreatorId(creator: unknown): string {
  if (!creator) return '';
  // Handle case where creator is an object (e.g., { "@id": "...", "name": "..." })
  if (typeof creator === 'object' && creator !== null) {
    const creatorObj = creator as Record<string, unknown>;
    if (typeof creatorObj['@id'] === 'string') {
      return extractId(creatorObj['@id']);
    }
    if (typeof creatorObj.id === 'string') {
      return creatorObj.id;
    }
    return '';
  }
  if (typeof creator !== 'string') return '';
  if (creator.includes('/')) {
    return extractId(creator);
  }
  return creator;
}

// RERUM note structure
interface RerumNote {
  '@id': string;
  type: string;
  title?: string;
  BodyText?: string;
  text?: string;
  creator: string | Record<string, unknown>;
  latitude?: string;
  longitude?: string;
  published?: boolean;
  approvalRequested?: boolean;
  tags?: Array<{ label: string; origin: string }>;
  media?: Array<{
    type: string;
    uri: string;
    thumbnail?: string;
    uuid?: string;
  }>;
  audio?: Array<{
    uri: string;
    name?: string;
    duration?: string;
    uuid?: string;
  }>;
  time?: string;
  isArchived?: boolean;
  __rerum?: {
    createdAt?: string;
    modifiedAt?: string;
  };
}

// RERUM comment structure
interface RerumComment {
  '@id': string;
  type: string;
  noteId: string;
  text: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  position?: { from: number; to: number };
  threadId?: string;
  parentId?: string;
  resolved?: boolean;
  archived?: boolean;
  __rerum?: {
    createdAt?: string;
    modifiedAt?: string;
  };
}

// Ensure sync_state table exists
async function ensureSyncStateTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sync_state (
      id TEXT PRIMARY KEY,
      last_sync_at TIMESTAMPTZ NOT NULL,
      last_notes_sync_at TIMESTAMPTZ,
      last_comments_sync_at TIMESTAMPTZ,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

// Get last sync time
async function getLastSyncTime(type: 'notes' | 'comments'): Promise<Date | null> {
  const result = await db.select().from(syncState).where(eq(syncState.id, 'main')).limit(1);

  if (result.length === 0) return null;

  const state = result[0];
  if (type === 'notes') return state.lastNotesSyncAt;
  if (type === 'comments') return state.lastCommentsSyncAt;
  return state.lastSyncAt;
}

// Update last sync time
async function updateLastSyncTime(type: 'notes' | 'comments', time: Date) {
  if (DRY_RUN) {
    log('info', `[DRY RUN] Would update last ${type} sync time to: ${time.toISOString()}`);
    return;
  }

  const updateData: Record<string, unknown> = {
    updatedAt: new Date(),
    lastSyncAt: time,
  };

  if (type === 'notes') updateData.lastNotesSyncAt = time;
  if (type === 'comments') updateData.lastCommentsSyncAt = time;

  await db
    .insert(syncState)
    .values({
      id: 'main',
      lastSyncAt: time,
      lastNotesSyncAt: type === 'notes' ? time : undefined,
      lastCommentsSyncAt: type === 'comments' ? time : undefined,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: syncState.id,
      set: updateData,
    });
}

// Sync notes from RERUM to PostgreSQL
async function syncNotes(fullSync = false) {
  log('info', 'Starting notes sync...');

  const lastSync = fullSync ? null : await getLastSyncTime('notes');
  const syncStartTime = new Date();

  // Build query - fetch all non-deleted notes
  const queryObj: Record<string, unknown> = {
    type: 'message',
  };

  // Note: RERUM doesn't support querying by modifiedAt directly
  // For incremental sync, we fetch all and filter client-side
  // This could be optimized with RERUM-specific features if available

  const rerumNotes = await rerumQueryAll<RerumNote>(queryObj);
  log('info', `Fetched ${rerumNotes.length} notes from RERUM`);

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const rerumNote of rerumNotes) {
    try {
      // Skip archived/deleted notes
      if (rerumNote.isArchived) {
        skipped++;
        continue;
      }

      const noteId = extractId(rerumNote['@id']);
      if (!noteId) {
        log('warn', 'Skipping note with no ID', rerumNote);
        skipped++;
        continue;
      }

      const creatorId = normalizeCreatorId(rerumNote.creator);
      if (!creatorId) {
        log('warn', 'Skipping note with no creator', {
          id: noteId,
          title: rerumNote.title || '(no title)',
          rawCreator: rerumNote.creator,
        });
        skipped++;
        continue;
      }

      // Check if user exists (foreign key constraint)
      const userExists = await db.query.user.findFirst({
        where: eq(schema.user.id, creatorId),
      });

      if (!userExists) {
        const creatorEmail = await getFirebaseUserEmail(creatorId);
        log('warn', `Skipping note - creator not found in users table`, {
          noteId,
          title: rerumNote.title || '(no title)',
          creatorId,
          creatorEmail: creatorEmail || '(not found in Firebase)',
        });
        skipped++;
        continue;
      }

      const modifiedAt =
        rerumNote.__rerum?.modifiedAt ? new Date(rerumNote.__rerum.modifiedAt) : new Date();

      // Skip if not modified since last sync (incremental mode)
      if (lastSync && modifiedAt <= lastSync) {
        skipped++;
        continue;
      }

      // Prepare note data
      const noteData = {
        id: noteId,
        title: rerumNote.title || null,
        text: rerumNote.BodyText || rerumNote.text || '',
        creatorId,
        latitude: rerumNote.latitude || null,
        longitude: rerumNote.longitude || null,
        // Validate booleans - some RERUM data has corrupted values (e.g., React events stored as published)
        isPublished: rerumNote.published === true,
        approvalRequested: rerumNote.approvalRequested === true,
        tags: (rerumNote.tags || []).map(t => ({
          label: t.label,
          origin: (t.origin === 'ai' ? 'ai' : 'user') as 'user' | 'ai',
        })) as Tag[],
        time: rerumNote.time ? new Date(rerumNote.time) : new Date(),
        createdAt:
          rerumNote.__rerum?.createdAt ? new Date(rerumNote.__rerum.createdAt) : new Date(),
        updatedAt: modifiedAt,
      };

      // Upsert note
      const existing = await db.query.note.findFirst({
        where: eq(schema.note.id, noteId),
      });

      if (DRY_RUN) {
        // In dry-run mode, just count what would happen
        if (existing) {
          log('info', `[DRY RUN] Would update note: ${noteId}`);
          updated++;
        } else {
          log('info', `[DRY RUN] Would create note: ${noteId}`);
          created++;
        }
      } else {
        if (existing) {
          await db.update(schema.note).set(noteData).where(eq(schema.note.id, noteId));
          updated++;
        } else {
          await db.insert(schema.note).values(noteData);
          created++;
        }

        // Sync media (delete and re-insert for simplicity)
        await db.delete(schema.media).where(eq(schema.media.noteId, noteId));
        if (rerumNote.media?.length) {
          await db.insert(schema.media).values(
            rerumNote.media.map(m => ({
              noteId,
              type: m.type || 'image',
              uri: m.uri,
              thumbnailUri: m.thumbnail || null,
              uuid: m.uuid || null,
            })),
          );
        }

        // Sync audio (delete and re-insert for simplicity)
        await db.delete(schema.audio).where(eq(schema.audio.noteId, noteId));
        if (rerumNote.audio?.length) {
          await db.insert(schema.audio).values(
            rerumNote.audio.map(a => ({
              noteId,
              uri: a.uri,
              name: a.name || null,
              duration: a.duration || null,
              uuid: a.uuid || null,
            })),
          );
        }
      }
    } catch (error) {
      log('error', `Failed to sync note ${rerumNote['@id']}`, error);
    }
  }

  await updateLastSyncTime('notes', syncStartTime);
  log('info', `Notes sync complete: ${created} created, ${updated} updated, ${skipped} skipped`);

  return { created, updated, skipped };
}

// Sync comments from RERUM to PostgreSQL
async function syncComments(fullSync = false) {
  log('info', 'Starting comments sync...');

  const lastSync = fullSync ? null : await getLastSyncTime('comments');
  const syncStartTime = new Date();

  const queryObj = { type: 'comment' };
  const rerumComments = await rerumQueryAll<RerumComment>(queryObj);
  log('info', `Fetched ${rerumComments.length} comments from RERUM`);

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const rerumComment of rerumComments) {
    try {
      // Skip archived comments
      if (rerumComment.archived) {
        skipped++;
        continue;
      }

      const commentId = extractId(rerumComment['@id']);
      if (!commentId) {
        log('warn', 'Skipping comment with no ID');
        skipped++;
        continue;
      }

      const noteId = extractId(rerumComment.noteId);
      if (!noteId) {
        log('warn', `Skipping comment ${commentId} - no noteId`);
        skipped++;
        continue;
      }

      // Check if note exists (foreign key constraint)
      const noteExists = await db.query.note.findFirst({
        where: eq(schema.note.id, noteId),
      });

      if (!noteExists) {
        log('warn', `Skipping comment ${commentId} - note ${noteId} not found`);
        skipped++;
        continue;
      }

      // Check if author exists
      const authorId = rerumComment.authorId;
      const authorExists = await db.query.user.findFirst({
        where: eq(schema.user.id, authorId),
      });

      if (!authorExists) {
        log('warn', `Skipping comment ${commentId} - author ${authorId} not found`);
        skipped++;
        continue;
      }

      const modifiedAt =
        rerumComment.__rerum?.modifiedAt ?
          new Date(rerumComment.__rerum.modifiedAt)
        : new Date(rerumComment.createdAt);

      // Skip if not modified since last sync (incremental mode)
      if (lastSync && modifiedAt <= lastSync) {
        skipped++;
        continue;
      }

      // Handle parentId - extract if it's a RERUM URL
      let parentId = rerumComment.parentId ? extractId(rerumComment.parentId) : null;

      // Verify parent exists if provided
      if (parentId) {
        const parentExists = await db.query.comment.findFirst({
          where: eq(schema.comment.id, parentId),
        });
        if (!parentExists) {
          // Parent doesn't exist yet - might be synced later
          parentId = null;
        }
      }

      const commentData = {
        id: commentId,
        noteId,
        authorId,
        authorName: rerumComment.authorName || 'Unknown',
        text: rerumComment.text,
        position: rerumComment.position || null,
        threadId: rerumComment.threadId || null,
        parentId,
        isResolved: rerumComment.resolved || false,
        createdAt: new Date(rerumComment.createdAt),
        updatedAt: modifiedAt,
      };

      // Upsert comment
      const existing = await db.query.comment.findFirst({
        where: eq(schema.comment.id, commentId),
      });

      if (DRY_RUN) {
        // In dry-run mode, just count what would happen
        if (existing) {
          log('info', `[DRY RUN] Would update comment: ${commentId}`);
          updated++;
        } else {
          log('info', `[DRY RUN] Would create comment: ${commentId}`);
          created++;
        }
      } else {
        if (existing) {
          await db.update(schema.comment).set(commentData).where(eq(schema.comment.id, commentId));
          updated++;
        } else {
          await db.insert(schema.comment).values(commentData);
          created++;
        }
      }
    } catch (error) {
      log('error', `Failed to sync comment ${rerumComment['@id']}`, error);
    }
  }

  await updateLastSyncTime('comments', syncStartTime);
  log('info', `Comments sync complete: ${created} created, ${updated} updated, ${skipped} skipped`);

  return { created, updated, skipped };
}

// Main sync function
async function runSync(fullSync = false) {
  log('info', `Starting ${fullSync ? 'full' : 'incremental'} sync...`);

  try {
    await ensureSyncStateTable();

    const notesResult = await syncNotes(fullSync);
    const commentsResult = await syncComments(fullSync);

    log('info', 'Sync completed successfully', {
      notes: notesResult,
      comments: commentsResult,
    });

    return { notes: notesResult, comments: commentsResult };
  } catch (error) {
    log('error', 'Sync failed', error);
    throw error;
  }
}

// Watch mode - continuous sync
async function runWatchMode() {
  log('info', `Starting watch mode (sync every ${SYNC_INTERVAL_MS / 1000}s)...`);

  // Initial full sync
  await runSync(true);

  // Then incremental syncs
  setInterval(async () => {
    try {
      await runSync(false);
    } catch (error) {
      log('error', 'Watch mode sync failed', error);
    }
  }, SYNC_INTERVAL_MS);
}

// CLI entry point
async function main() {
  const args = process.argv.slice(2);
  const watchMode = args.includes('--watch');
  const fullSync = args.includes('--full');
  const yoloMode = args.includes('--yolo');

  // --yolo disables dry-run mode
  if (yoloMode) {
    DRY_RUN = false;
  }

  if (!RERUM_API_URL) {
    console.error(
      'Error: RERUM_API_URL or NEXT_PUBLIC_RERUM_PREFIX environment variable is required',
    );
    process.exit(1);
  }

  if (!DATABASE_URL) {
    console.error('Error: DATABASE_URL environment variable is required');
    process.exit(1);
  }

  log('info', 'RERUM Sync Script starting...');
  log('info', `RERUM API: ${RERUM_API_URL}`);
  log('info', `Mode: ${watchMode ? 'watch' : 'one-time'}, Full sync: ${fullSync}`);
  log(
    'info',
    DRY_RUN ?
      'DRY RUN MODE - No changes will be written to database'
    : 'YOLO MODE - Changes WILL be written to database',
  );

  // Initialize Firebase for email lookups (optional)
  if (initializeFirebase()) {
    log('info', 'Firebase initialized - will show creator emails for missing users');
  } else {
    log('info', 'Firebase not configured - creator emails will not be shown');
  }

  try {
    if (watchMode) {
      await runWatchMode();
    } else {
      await runSync(fullSync);
      await pool.end();
      process.exit(0);
    }
  } catch (error) {
    log('error', 'Fatal error', error);
    await pool.end();
    process.exit(1);
  }
}

// Export for programmatic use
export { runSync, syncNotes, syncComments };

// Run if called directly
main();
