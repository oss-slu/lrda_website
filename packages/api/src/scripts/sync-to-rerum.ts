/**
 * D1 to RERUM Sync Script (Reverse Sync)
 *
 * This script syncs new data created in D1 back to RERUM,
 * so the mobile app can still read it while being migrated.
 *
 * Usage:
 *   pnpm sync:to-rerum           # Dry-run (preview only, no writes)
 *   pnpm sync:to-rerum --yolo    # Actually write to RERUM
 *   pnpm sync:to-rerum --watch   # Continuous sync (every 30s)
 *
 * Flags can be combined:
 *   pnpm sync:to-rerum --yolo --watch
 *
 * Environment variables:
 *   RERUM_API_URL - RERUM API base URL
 *   D1_DB_PATH    - (optional) Override path to local D1 SQLite file
 */

import { gt } from 'drizzle-orm';
import * as schema from '../db/schema';
import { openLocalDb } from './local-db';

// Configuration
const RERUM_API_URL = process.env.RERUM_API_URL || process.env.NEXT_PUBLIC_RERUM_PREFIX || '';
const SYNC_INTERVAL_MS = 30_000; // 30 seconds

// Runtime flags (set by CLI)
// DRY_RUN is true by default for safety - use --yolo to actually write to RERUM
let DRY_RUN = true;

// Initialize database
const { db, pool } = openLocalDb();

function log(level: 'info' | 'warn' | 'error', message: string, data?: unknown) {
  const ts = new Date().toISOString();
  const prefix = `[${ts}] [REVERSE-SYNC] [${level.toUpperCase()}]`;
  if (data) {
    console.log(prefix, message, JSON.stringify(data, null, 2));
  } else {
    console.log(prefix, message);
  }
}

// Create object in RERUM
async function rerumCreate(data: object): Promise<{ '@id': string }> {
  const response = await fetch(`${RERUM_API_URL}create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`RERUM create failed: ${response.status}`);
  }

  return response.json();
}

// Update object in RERUM
async function rerumOverwrite(data: object): Promise<{ '@id': string }> {
  const response = await fetch(`${RERUM_API_URL}overwrite`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`RERUM overwrite failed: ${response.status}`);
  }

  return response.json();
}

// Ensure script-only tables exist
async function ensureTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS reverse_sync_state (
      id TEXT PRIMARY KEY,
      last_sync_at TIMESTAMP NOT NULL,
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS id_mapping (
      id TEXT PRIMARY KEY,
      rerum_id TEXT NOT NULL,
      type TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
}

// Get RERUM ID for a local ID
async function getRerumId(localId: string): Promise<string | null> {
  const { rows } = await pool.query('SELECT rerum_id FROM id_mapping WHERE id = $1', [localId]);
  return rows[0]?.rerum_id || null;
}

// Save ID mapping
async function saveIdMapping(localId: string, rerumId: string, type: string) {
  if (DRY_RUN) {
    log('info', `[DRY RUN] Would save ID mapping: ${localId} -> ${rerumId} (${type})`);
    return;
  }

  await pool.query(
    `
    INSERT INTO id_mapping (id, rerum_id, type) VALUES ($1, $2, $3)
    ON CONFLICT (id) DO UPDATE SET rerum_id = EXCLUDED.rerum_id
  `,
    [localId, rerumId, type],
  );
}

// Get last sync time
async function getLastSyncTime(): Promise<Date> {
  const { rows } = await pool.query('SELECT last_sync_at FROM reverse_sync_state WHERE id = $1', [
    'main',
  ]);
  return rows[0] ? new Date(rows[0].last_sync_at) : new Date(0);
}

// Update last sync time
async function updateLastSyncTime(time: Date) {
  if (DRY_RUN) {
    log('info', `[DRY RUN] Would update last sync time to: ${time.toISOString()}`);
    return;
  }

  await pool.query(
    `
    INSERT INTO reverse_sync_state (id, last_sync_at, updated_at) VALUES ($1, $2, NOW())
    ON CONFLICT (id) DO UPDATE SET last_sync_at = EXCLUDED.last_sync_at, updated_at = NOW()
  `,
    ['main', time.toISOString()],
  );
}

// Sync notes from D1 to RERUM
async function syncNotesToRerum() {
  log('info', 'Syncing notes to RERUM...');

  const lastSync = await getLastSyncTime();

  // Find notes updated since last sync
  const notes = await db.query.note.findMany({
    where: gt(schema.note.updatedAt, lastSync),
    with: {
      media: true,
      audio: true,
    },
  });

  log('info', `Found ${notes.length} notes to sync`);

  let created = 0;
  let updated = 0;
  let errors = 0;

  for (const note of notes) {
    try {
      const existingRerumId = await getRerumId(note.id);

      // Transform to RERUM format
      const rerumData: Record<string, unknown> = {
        type: 'message',
        title: note.title || '',
        BodyText: note.text,
        creator: note.creatorId,
        latitude: note.latitude != null ? String(note.latitude) : '',
        longitude: note.longitude != null ? String(note.longitude) : '',
        published: note.isPublished,
        approvalRequested: note.approvalRequested,
        tags: (note.tags || []).map(t => typeof t === 'string' ? t : t.label),
        time: note.time?.toISOString(),
        media: note.media?.map(m => ({
          type: m.type,
          uri: m.uri,
          thumbnail: m.thumbnailUri,
          uuid: m.uuid,
        })),
        audio: note.audio?.map(a => ({
          uri: a.uri,
          name: a.name,
          duration: a.duration,
          uuid: a.uuid,
        })),
      };

      if (DRY_RUN) {
        if (existingRerumId) {
          log('info', `[DRY RUN] Would update note in RERUM: ${note.id} -> ${existingRerumId}`);
          updated++;
        } else {
          log('info', `[DRY RUN] Would create note in RERUM: ${note.id}`);
          created++;
        }
      } else {
        if (existingRerumId) {
          rerumData['@id'] = existingRerumId;
          await rerumOverwrite(rerumData);
          updated++;
        } else {
          const result = await rerumCreate(rerumData);
          await saveIdMapping(note.id, result['@id'], 'note');
          created++;
        }
      }
    } catch (error) {
      log('error', `Failed to sync note ${note.id}`, error);
      errors++;
    }
  }

  log('info', `Notes sync complete: ${created} created, ${updated} updated, ${errors} errors`);
  return { created, updated, errors };
}

// Sync comments from D1 to RERUM
async function syncCommentsToRerum() {
  log('info', 'Syncing comments to RERUM...');

  const lastSync = await getLastSyncTime();

  const comments = await db.query.comment.findMany({
    where: gt(schema.comment.updatedAt, lastSync),
  });

  log('info', `Found ${comments.length} comments to sync`);

  let created = 0;
  let updated = 0;
  let errors = 0;

  for (const comment of comments) {
    try {
      const existingRerumId = await getRerumId(comment.id);

      // Get RERUM ID for the note
      let noteRerumId = await getRerumId(comment.noteId);
      if (!noteRerumId) {
        noteRerumId = comment.noteId;
      }

      const rerumData: Record<string, unknown> = {
        type: 'comment',
        noteId: noteRerumId,
        text: comment.text,
        authorId: comment.authorId,
        authorName: comment.authorName,
        createdAt: comment.createdAt.toISOString(),
        position: comment.position,
        threadId: comment.threadId,
        parentId: comment.parentId,
        resolved: comment.isResolved,
        archived: false,
      };

      if (DRY_RUN) {
        if (existingRerumId) {
          log(
            'info',
            `[DRY RUN] Would update comment in RERUM: ${comment.id} -> ${existingRerumId}`,
          );
          updated++;
        } else {
          log('info', `[DRY RUN] Would create comment in RERUM: ${comment.id}`);
          created++;
        }
      } else {
        if (existingRerumId) {
          rerumData['@id'] = existingRerumId;
          await rerumOverwrite(rerumData);
          updated++;
        } else {
          const result = await rerumCreate(rerumData);
          await saveIdMapping(comment.id, result['@id'], 'comment');
          created++;
        }
      }
    } catch (error) {
      log('error', `Failed to sync comment ${comment.id}`, error);
      errors++;
    }
  }

  log('info', `Comments sync complete: ${created} created, ${updated} updated, ${errors} errors`);
  return { created, updated, errors };
}

// Main sync function
async function runSync() {
  log('info', 'Starting reverse sync (D1 -> RERUM)...');

  try {
    await ensureTables();

    const syncStartTime = new Date();
    const notesResult = await syncNotesToRerum();
    const commentsResult = await syncCommentsToRerum();

    await updateLastSyncTime(syncStartTime);

    log('info', 'Reverse sync completed', {
      notes: notesResult,
      comments: commentsResult,
    });

    return { notes: notesResult, comments: commentsResult };
  } catch (error) {
    log('error', 'Reverse sync failed', error);
    throw error;
  }
}

// Watch mode
async function runWatchMode() {
  log('info', `Starting watch mode (sync every ${SYNC_INTERVAL_MS / 1000}s)...`);

  await runSync();

  setInterval(async () => {
    try {
      await runSync();
    } catch (error) {
      log('error', 'Watch mode sync failed', error);
    }
  }, SYNC_INTERVAL_MS);
}

// CLI entry point
async function main() {
  const args = process.argv.slice(2);
  const watchMode = args.includes('--watch');
  const yoloMode = args.includes('--yolo');

  if (yoloMode) {
    DRY_RUN = false;
  }

  if (!RERUM_API_URL) {
    console.error('Error: RERUM_API_URL environment variable is required');
    process.exit(1);
  }

  log('info', 'Reverse Sync Script starting...');
  log('info', `RERUM API: ${RERUM_API_URL}`);
  log(
    'info',
    DRY_RUN ?
      'DRY RUN MODE - No changes will be written to RERUM'
    : 'YOLO MODE - Changes WILL be written to RERUM',
  );

  try {
    if (watchMode) {
      await runWatchMode();
    } else {
      await runSync();
      await pool.end();
      process.exit(0);
    }
  } catch (error) {
    log('error', 'Fatal error', error);
    await pool.end();
    process.exit(1);
  }
}

export { runSync, syncNotesToRerum, syncCommentsToRerum };

main();
