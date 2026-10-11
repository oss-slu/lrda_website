/**
 * RERUM Sync Service
 *
 * Manages the RERUM -> PostgreSQL sync lifecycle within the API server.
 * Provides start/stop/trigger/status operations for admin endpoints,
 * and writes audit log entries for every sync run.
 */

import { eq } from 'drizzle-orm';
import { db, type Database } from '../db';
import * as schema from '../db/schema';
import { env } from '../env';
import type { Tag } from '../db/types';
import { reverseGeocode } from './geocode';

// RERUM API configuration
const SYNC_INTERVAL_MS = 600_000; // 10 minutes
const BATCH_SIZE = 100;

// Sync state
let intervalId: ReturnType<typeof setInterval> | undefined;
let syncInProgress = false;
let lastRunAt: Date | null = null;
let lastRunStatus: string | null = null;

// ============================================
// RERUM API helpers
// ============================================

function getRerumApiUrl(): string {
  // Check env singleton first, fall back to process.env (supports runtime override in tests)
  const url = env.RERUM_API_URL || process.env.RERUM_API_URL;
  if (!url) {
    throw new Error('RERUM_API_URL environment variable is not configured');
  }
  return url;
}

async function rerumQuery<T>(queryObj: object, limit = 500, skip = 0): Promise<T[]> {
  const url = `${getRerumApiUrl()}query?limit=${limit}&skip=${skip}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(queryObj),
  });

  if (!response.ok) {
    throw new Error(`RERUM query failed: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T[]>;
}

async function rerumQueryAll<T>(queryObj: object): Promise<T[]> {
  const allResults: T[] = [];
  let skip = 0;

  for (;;) {
    const results = await rerumQuery<T>(queryObj, BATCH_SIZE, skip);
    if (results.length === 0) break;

    allResults.push(...results);
    skip += results.length;

    if (results.length < BATCH_SIZE) break;
  }

  return allResults;
}

// ============================================
// RERUM data types
// ============================================

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
    uri: unknown;
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

// ============================================
// Data normalization helpers
// ============================================

function extractId(rerumId: string): string {
  if (!rerumId) return '';
  const match = rerumId.match(/\/id\/([^/?]+)/);
  return match ? match[1] : rerumId;
}

function normalizeCreatorId(creator: unknown): string {
  if (!creator) return '';
  if (typeof creator === 'object') {
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

// ============================================
// Fallback user
// ============================================

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
  }
}

// ============================================
// Sync state tracking
// ============================================

async function getLastNoteSyncTime(): Promise<Date | null> {
  const rows = await db
    .select({
      lastNotesSyncAt: schema.syncState.lastNotesSyncAt,
      lastSyncAt: schema.syncState.lastSyncAt,
    })
    .from(schema.syncState)
    .where(eq(schema.syncState.id, 'main'));
  const row = rows.at(0);
  if (!row) return null;
  return row.lastNotesSyncAt ?? row.lastSyncAt;
}

async function updateLastNoteSyncTime(time: Date) {
  await db
    .insert(schema.syncState)
    .values({
      id: 'main',
      lastSyncAt: time,
      lastNotesSyncAt: time,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: schema.syncState.id,
      set: {
        lastSyncAt: time,
        lastNotesSyncAt: time,
        updatedAt: new Date(),
      },
    });
}

// ============================================
// Core sync logic
// ============================================

interface SyncResult {
  runId?: string;
  created: number;
  updated: number;
  skipped: number;
  errored: number;
  durationMs: number;
  status: 'success' | 'failed';
  error?: string;
  logs?: string[];
}

async function syncNotes(
  triggeredBy: 'watch' | 'manual',
  options: { dryRun?: boolean } = {},
): Promise<SyncResult> {
  const dryRun = options.dryRun ?? false;
  const startTime = Date.now();
  const syncStartTime = new Date();

  // Dry runs collect their log lines so the caller (e.g. the admin UI) can
  // display them, in addition to writing them to the server console.
  const dryRunLog: string[] = [];
  const logDry = (msg: string) => {
    console.log(msg);
    dryRunLog.push(msg);
  };

  // Create audit log run entry. Dry runs write nothing -- they only log what
  // they would do -- so the run/detail audit rows are skipped entirely.
  let runId: string | undefined;
  if (!dryRun) {
    const [run] = await db
      .insert(schema.syncRun)
      .values({
        status: 'running',
        triggeredBy,
      })
      .returning({ id: schema.syncRun.id });
    runId = run.id;
  } else {
    logDry('[sync dry-run] No changes will be written.');
  }

  let created = 0;
  let updated = 0;
  let skipped = 0;
  let errored = 0;

  try {
    if (!dryRun) await ensureFallbackUser();

    const lastSync = await getLastNoteSyncTime();

    // Build RERUM query -- for incremental syncs, filter server-side by modification date
    // RERUM passes queries directly to MongoDB, so $or/$gt operators work.
    // Timestamps use ISO 8601 without timezone suffix (e.g., "2026-04-09T00:00:00.000")
    let rerumQuery: Record<string, unknown> = { type: 'message' };
    if (lastSync) {
      const sinceTs = lastSync.toISOString().replace('Z', '');
      rerumQuery = {
        type: 'message',
        $or: [
          { '__rerum.isOverwritten': { $gt: sinceTs } },
          { '__rerum.createdAt': { $gt: sinceTs } },
        ],
      };
    }

    const rerumNotes = await rerumQueryAll<RerumNote>(rerumQuery);

    for (const rerumNote of rerumNotes) {
      try {
        // Skip archived/deleted notes
        if (rerumNote.isArchived) {
          skipped++;
          continue;
        }

        const noteId = extractId(rerumNote['@id']);
        if (!noteId) {
          skipped++;
          continue;
        }

        const creatorId = normalizeCreatorId(rerumNote.creator) || FALLBACK_USER_ID;

        // Check if user exists -- assign to fallback user if not
        const userExists = await db.query.user.findFirst({
          where: eq(schema.user.id, creatorId),
        });
        const effectiveCreatorId = userExists ? creatorId : FALLBACK_USER_ID;

        const modifiedAt =
          rerumNote.__rerum?.modifiedAt ? new Date(rerumNote.__rerum.modifiedAt)
          : rerumNote.__rerum?.isOverwritten ? new Date(rerumNote.__rerum.isOverwritten)
          : new Date();

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

        const existing = await db.query.note.findFirst({
          where: eq(schema.note.id, noteId),
        });

        if (dryRun) {
          if (existing) updated++;
          else created++;
          logDry(
            `[sync dry-run] would ${existing ? 'update' : 'create'} note ${noteId}` +
              (noteData.latitude != null && noteData.longitude != null
                ? ` @ (${noteData.latitude}, ${noteData.longitude})`
                : ''),
          );
          continue;
        }

        // RERUM does not store a human-readable location name, so reverse
        // geocode it here. Only call the Geocoding API when needed (new note,
        // changed coordinates, or a missing name) to limit quota usage, and
        // never overwrite an existing name with a failed (null) lookup.
        const { latitude: lat, longitude: lng } = noteData;
        let locationName = existing?.locationName ?? null;
        const coordsChanged =
          !!existing && (existing.latitude !== lat || existing.longitude !== lng);
        if (lat != null && lng != null && (!existing || coordsChanged || existing.locationName == null)) {
          const geocoded = await reverseGeocode(lat, lng, env.GOOGLE_MAPS_API_KEY);
          if (geocoded) locationName = geocoded;
        }

        const noteValues = { ...noteData, locationName };

        await db.transaction(async (tx) => {
          if (existing) {
            await tx.update(schema.note).set(noteValues).where(eq(schema.note.id, noteId));
          } else {
            await tx.insert(schema.note).values(noteValues);
          }

          // Sync media
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

          // Sync audio
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

        const action = existing ? 'updated' : 'created';
        if (existing) updated++;
        else created++;

        // Write per-note audit detail
        await db.insert(schema.syncRunDetail).values({
          runId: runId!,
          noteId,
          action,
        });
      } catch (error) {
        errored++;
        const noteId = extractId(rerumNote['@id']);
        const errorMsg = error instanceof Error ? error.message : String(error);

        if (dryRun) {
          logDry(`[sync dry-run] would error on note ${noteId || 'unknown'}: ${errorMsg}`);
        } else {
          await db.insert(schema.syncRunDetail).values({
            runId: runId!,
            noteId: noteId || 'unknown',
            action: 'errored',
            error: errorMsg,
          });
        }
      }
    }

    const durationMs = Date.now() - startTime;

    if (dryRun) {
      logDry(
        `[sync dry-run] complete: would create ${created}, update ${updated}, ` +
          `skip ${skipped}, error ${errored} (${durationMs}ms)`,
      );
      return { created, updated, skipped, errored, durationMs, status: 'success', logs: dryRunLog };
    }

    await updateLastNoteSyncTime(syncStartTime);

    // Update run summary
    await db
      .update(schema.syncRun)
      .set({
        finishedAt: new Date(),
        durationMs,
        status: 'success',
        notesCreated: created,
        notesUpdated: updated,
        notesSkipped: skipped,
        notesErrored: errored,
      })
      .where(eq(schema.syncRun.id, runId!));

    lastRunAt = new Date();
    lastRunStatus = 'success';

    return { runId, created, updated, skipped, errored, durationMs, status: 'success' };
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const errorMsg = error instanceof Error ? error.message : String(error);

    if (dryRun) {
      logDry(`[sync dry-run] failed: ${errorMsg}`);
      return {
        created,
        updated,
        skipped,
        errored,
        durationMs,
        status: 'failed',
        error: errorMsg,
        logs: dryRunLog,
      };
    }

    // Update run as failed
    await db
      .update(schema.syncRun)
      .set({
        finishedAt: new Date(),
        durationMs,
        status: 'failed',
        notesCreated: created,
        notesUpdated: updated,
        notesSkipped: skipped,
        notesErrored: errored,
        error: errorMsg,
      })
      .where(eq(schema.syncRun.id, runId!));

    lastRunAt = new Date();
    lastRunStatus = 'failed';

    return { runId, created, updated, skipped, errored, durationMs, status: 'failed', error: errorMsg };
  }
}

// ============================================
// Public API
// ============================================

export function getSyncStatus() {
  const running = intervalId !== undefined;
  return {
    running,
    lastRunAt,
    lastRunStatus,
    nextRunAt: running && lastRunAt ? new Date(lastRunAt.getTime() + SYNC_INTERVAL_MS) : null,
    intervalMs: SYNC_INTERVAL_MS,
  };
}

export async function startSync(): Promise<{ started: boolean; message: string }> {
  if (intervalId !== undefined) {
    return { started: false, message: 'Sync is already running' };
  }

  if (!env.RERUM_API_URL && !process.env.RERUM_API_URL) {
    return { started: false, message: 'RERUM_API_URL environment variable is not configured' };
  }

  // Run initial incremental sync (falls back to full if sync_state is empty)
  syncInProgress = true;
  try {
    await syncNotes('watch');
  } finally {
    syncInProgress = false;
  }

  // Start polling
  intervalId = setInterval(async () => {
    if (syncInProgress) return;
    syncInProgress = true;
    try {
      await syncNotes('watch');
    } catch (error) {
      console.error('[sync-service] Watch mode sync failed:', error);
    } finally {
      syncInProgress = false;
    }
  }, SYNC_INTERVAL_MS);

  return { started: true, message: 'Sync started' };
}

export async function stopSync(): Promise<{ stopped: boolean; message: string }> {
  if (intervalId === undefined) {
    return { stopped: false, message: 'Sync is not running' };
  }

  clearInterval(intervalId);
  intervalId = undefined;

  // Wait for in-flight sync if any
  if (syncInProgress) {
    const maxWait = 60_000;
    const start = Date.now();
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- syncInProgress is flipped by the concurrent watch loop
    while (syncInProgress && Date.now() - start < maxWait) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  return { stopped: true, message: 'Sync stopped' };
}

export async function triggerSync(options: { dryRun?: boolean } = {}): Promise<SyncResult> {
  if (syncInProgress) {
    throw new Error('A sync is already in progress');
  }

  syncInProgress = true;
  try {
    return await syncNotes('manual', options);
  } finally {
    syncInProgress = false;
  }
}
