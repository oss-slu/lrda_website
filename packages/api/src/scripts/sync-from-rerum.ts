/**
 * RERUM to PostgreSQL Sync Script
 *
 * By default, reads from rerum-notes-dump.json (local file).
 * With --remote, fetches live from the RERUM API instead.
 *
 * Usage:
 *   pnpm sync:from-rerum                    # Dry-run from local file
 *   pnpm sync:from-rerum --yolo             # Write to DB from local file
 *   pnpm sync:from-rerum --yolo --full      # Full re-sync from local file
 *   pnpm sync:from-rerum --yolo --remote    # Fetch from RERUM API
 *   pnpm sync:from-rerum --watch --remote   # Continuous sync from API
 *
 * Environment variables (only needed with --remote):
 *   RERUM_API_URL - RERUM API base URL
 */

import { eq } from 'drizzle-orm';
import { initializeApp, cert, getApps, type ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import * as fs from 'fs';
import * as schema from '../db/schema';
import type { Tag } from '../db/types';
import { openLocalDb } from './local-db';

// Configuration
const RERUM_API_URL = process.env.RERUM_API_URL || process.env.NEXT_PUBLIC_RERUM_PREFIX || '';
const SERVICE_ACCOUNT_PATH = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || '';
const SERVICE_ACCOUNT_JSON = process.env.FIREBASE_SERVICE_ACCOUNT || '';
const SYNC_INTERVAL_MS = 30_000; // 30 seconds
const BATCH_SIZE = 100;
const DUMP_PATH = new URL('../../rerum-notes-dump.json', import.meta.url).pathname;

// Runtime flags (set by CLI)
// DRY_RUN is true by default for safety - use --yolo to actually write to database
let DRY_RUN = true;
let USE_REMOTE = false;

// Initialize database connection
const { db, pool } = openLocalDb();

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
  const ts = new Date().toISOString();
  const prefix = `[${ts}] [${level.toUpperCase()}]`;
  if (data) {
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

// Normalize tags from RERUM (can be plain strings or {label, origin} objects)
function normalizeTags(tags?: RerumNote['tags']): Tag[] {
  if (!tags || tags.length === 0) return [];
  return tags
    .map((t): Tag | null => {
      if (typeof t === 'string') {
        return t.trim() ? { label: t.trim(), origin: 'user' } : null;
      }
      if (typeof t === 'object' && t.label) {
        return { label: t.label, origin: t.origin === 'ai' ? 'ai' : 'user' };
      }
      return null;
    })
    .filter((t): t is Tag => t !== null);
}

// Load notes from local JSON dump file
async function loadNotesFromFile(): Promise<RerumNote[]> {
  log('info', `Loading notes from ${DUMP_PATH}...`);
  if (!fs.existsSync(DUMP_PATH)) {
    throw new Error(
      `Dump file not found: ${DUMP_PATH}\nRun with --remote to fetch from RERUM API instead.`,
    );
  }
  const notes: RerumNote[] = JSON.parse(fs.readFileSync(DUMP_PATH, 'utf-8'));
  log('info', `Loaded ${notes.length} notes from file`);
  return notes;
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
  tags?: Array<string | { label?: string; origin?: string }>;
  media?: Array<{
    type: string;
    uri: string;
    thumbnail?: string;
    uuid?: string;
  }>;
  audio?: Array<{
    uri: unknown; // Can be string or empty object {} in dump
    name?: string;
    duration?: string;
    uuid?: string;
  }>;
  time?: string;
  isArchived?: boolean;
  __rerum?: {
    createdAt?: string;
    modifiedAt?: string;
    isOverwritten?: string;
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
      last_sync_at TIMESTAMP NOT NULL,
      last_notes_sync_at TIMESTAMP,
      last_comments_sync_at TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
}

// Get last sync time
async function getLastSyncTime(type: 'notes' | 'comments'): Promise<Date | null> {
  const { rows } = await pool.query('SELECT * FROM sync_state WHERE id = $1', ['main']);
  const row = rows[0];

  if (!row) return null;

  if (type === 'notes' && row.last_notes_sync_at != null) {
    return new Date(row.last_notes_sync_at);
  }
  if (type === 'comments' && row.last_comments_sync_at != null) {
    return new Date(row.last_comments_sync_at);
  }
  return new Date(row.last_sync_at);
}

// Update last sync time
async function updateLastSyncTime(type: 'notes' | 'comments', time: Date) {
  if (DRY_RUN) {
    log('info', `[DRY RUN] Would update last ${type} sync time to: ${time.toISOString()}`);
    return;
  }

  if (type === 'notes') {
    await pool.query(
      `
      INSERT INTO sync_state (id, last_sync_at, last_notes_sync_at, updated_at)
      VALUES ($1, $2, $2, NOW())
      ON CONFLICT (id) DO UPDATE SET
        last_sync_at = EXCLUDED.last_sync_at,
        last_notes_sync_at = EXCLUDED.last_notes_sync_at,
        updated_at = NOW()
    `,
      ['main', time.toISOString()],
    );
  } else {
    await pool.query(
      `
      INSERT INTO sync_state (id, last_sync_at, last_comments_sync_at, updated_at)
      VALUES ($1, $2, $2, NOW())
      ON CONFLICT (id) DO UPDATE SET
        last_sync_at = EXCLUDED.last_sync_at,
        last_comments_sync_at = EXCLUDED.last_comments_sync_at,
        updated_at = NOW()
    `,
      ['main', time.toISOString()],
    );
  }
}

// Fallback user for notes whose creators don't exist in the user table
const FALLBACK_USER_ID = 'rerum-orphan-user';
const FALLBACK_USER = {
  id: FALLBACK_USER_ID,
  name: 'Billy Joel',
  email: 'billy.joel@rerum.orphan',
  emailVerified: false,
  role: 'user',
  isInstructor: false,
};

async function ensureFallbackUser() {
  const exists = await db.query.user.findFirst({
    where: eq(schema.user.id, FALLBACK_USER_ID),
  });
  if (!exists) {
    await db.insert(schema.user).values(FALLBACK_USER);
    log('info', 'Created fallback user "Billy Joel" for orphaned notes');
  }
}

// Sync notes from RERUM to PostgreSQL
async function syncNotes(fullSync = false) {
  log('info', 'Starting notes sync...');

  const lastSync = fullSync ? null : await getLastSyncTime('notes');
  const syncStartTime = new Date();

  // Load notes from file or API
  let rerumNotes: RerumNote[];
  if (USE_REMOTE) {
    const queryObj: Record<string, unknown> = { type: 'message' };
    rerumNotes = await rerumQueryAll<RerumNote>(queryObj);
    log('info', `Fetched ${rerumNotes.length} notes from RERUM API`);
  } else {
    rerumNotes = await loadNotesFromFile();
  }

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

      const creatorId = normalizeCreatorId(rerumNote.creator) || FALLBACK_USER_ID;
      if (creatorId === FALLBACK_USER_ID) {
        log('info', 'Note has no creator, assigning to fallback user', {
          id: noteId,
          title: rerumNote.title || '(no title)',
        });
      }

      // Check if user exists -- assign to fallback user if not
      const userExists = await db.query.user.findFirst({
        where: eq(schema.user.id, creatorId),
      });

      const effectiveCreatorId = userExists ? creatorId : FALLBACK_USER_ID;
      if (!userExists) {
        log('info', `Assigning note to fallback user (original creator not found)`, {
          noteId,
          title: rerumNote.title || '(no title)',
          originalCreatorId: creatorId,
        });
      }

      const modifiedAt =
        rerumNote.__rerum?.modifiedAt ? new Date(rerumNote.__rerum.modifiedAt)
        : rerumNote.__rerum?.isOverwritten ? new Date(rerumNote.__rerum.isOverwritten)
        : new Date();

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
        creatorId: effectiveCreatorId,
        latitude: rerumNote.latitude ? parseFloat(rerumNote.latitude) || null : null,
        longitude: rerumNote.longitude ? parseFloat(rerumNote.longitude) || null : null,
        isPublished: rerumNote.published === true,
        approvalRequested: rerumNote.approvalRequested === true,
        tags: normalizeTags(rerumNote.tags),
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
        if (existing) {
          log('info', `[DRY RUN] Would update note: ${noteId}`);
          updated++;
        } else {
          log('info', `[DRY RUN] Would create note: ${noteId}`);
          created++;
        }
      } else {
        await db.transaction(async (tx) => {
          if (existing) {
            await tx.update(schema.note).set(noteData).where(eq(schema.note.id, noteId));
          } else {
            await tx.insert(schema.note).values(noteData);
          }

          // Sync media (delete and re-insert for simplicity)
          await tx.delete(schema.media).where(eq(schema.media.noteId, noteId));
          if (rerumNote.media?.length) {
            await tx.insert(schema.media).values(
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
          await tx.delete(schema.audio).where(eq(schema.audio.noteId, noteId));
          if (rerumNote.audio?.length) {
            const validAudio = rerumNote.audio.filter(a => typeof a.uri === 'string' && a.uri);
            if (validAudio.length) {
              await tx.insert(schema.audio).values(
                validAudio.map(a => ({
                  noteId,
                  uri: a.uri as string,
                  name: a.name || null,
                  duration: a.duration || null,
                  uuid: a.uuid || null,
                })),
              );
            }
          }
        });

        // Increment after transaction commits successfully
        if (existing) {
          updated++;
        } else {
          created++;
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
  if (!USE_REMOTE) {
    log('info', 'Skipping comments sync (only available in --remote mode)');
    return { created: 0, updated: 0, skipped: 0 };
  }

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
    if (!DRY_RUN) await ensureFallbackUser();

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

// Watch mode - continuous sync with graceful shutdown
async function runWatchMode() {
  log('info', `Starting watch mode (sync every ${SYNC_INTERVAL_MS / 1000}s)...`);

  let syncInProgress = false;
  let shutdownRequested = false;
  let intervalId: ReturnType<typeof setInterval> | undefined;

  async function shutdown(signal: string) {
    log('info', `Received ${signal}, shutting down...`);
    shutdownRequested = true;
    if (intervalId) clearInterval(intervalId);

    if (syncInProgress) {
      log('info', 'Waiting for in-flight sync to finish...');
      while (syncInProgress) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    log('info', 'Closing database connection...');
    await pool.end();
    log('info', 'Shutdown complete.');
    process.exit(0);
  }

  process.on('SIGTERM', () => {
    shutdown('SIGTERM').catch(err => { log('error', 'Shutdown failed', err); process.exit(1); });
  });
  process.on('SIGINT', () => {
    shutdown('SIGINT').catch(err => { log('error', 'Shutdown failed', err); process.exit(1); });
  });

  // Initial full sync
  syncInProgress = true;
  try {
    await runSync(true);
  } finally {
    syncInProgress = false;
  }

  // Then incremental syncs
  intervalId = setInterval(async () => {
    if (syncInProgress || shutdownRequested) return;
    syncInProgress = true;
    try {
      await runSync(false);
    } catch (error) {
      log('error', 'Watch mode sync failed', error);
    } finally {
      syncInProgress = false;
    }
  }, SYNC_INTERVAL_MS);
}

// CLI entry point
async function main() {
  const args = process.argv.slice(2);
  const watchMode = args.includes('--watch');
  const fullSync = args.includes('--full');
  const yoloMode = args.includes('--yolo');

  if (yoloMode) DRY_RUN = false;
  if (args.includes('--remote')) USE_REMOTE = true;

  if (USE_REMOTE && !RERUM_API_URL) {
    console.error(
      'Error: RERUM_API_URL or NEXT_PUBLIC_RERUM_PREFIX environment variable is required for --remote mode',
    );
    process.exit(1);
  }

  log('info', 'RERUM Sync Script starting...');
  log(
    'info',
    `Source: ${USE_REMOTE ? `RERUM API (${RERUM_API_URL})` : `Local file (${DUMP_PATH})`}`,
  );
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
