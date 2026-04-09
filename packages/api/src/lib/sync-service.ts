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

// RERUM API configuration
const SYNC_INTERVAL_MS = 30_000; // 30 seconds
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

  while (true) {
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
  const match = rerumId.match(/\/id\/([^\/\?]+)/);
  return match ? match[1] : rerumId;
}

function normalizeCreatorId(creator: unknown): string {
  if (!creator) return '';
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
// Sync state tracking (uses existing sync_state table)
// ============================================

async function ensureSyncStateTable() {
  // Use raw SQL since this table isn't in the Drizzle schema (shared with standalone script)
  await db.execute(
    `CREATE TABLE IF NOT EXISTS sync_state (
      id TEXT PRIMARY KEY,
      last_sync_at TIMESTAMP NOT NULL,
      last_notes_sync_at TIMESTAMP,
      last_comments_sync_at TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )`,
  );
}

async function getLastNoteSyncTime(): Promise<Date | null> {
  const result = await db.execute(`SELECT last_notes_sync_at, last_sync_at FROM sync_state WHERE id = 'main'`);
  const row = result.rows[0] as Record<string, unknown> | undefined;
  if (!row) return null;
  if (row.last_notes_sync_at != null) return new Date(row.last_notes_sync_at as string);
  return new Date(row.last_sync_at as string);
}

async function updateLastNoteSyncTime(time: Date) {
  await db.execute(
    `INSERT INTO sync_state (id, last_sync_at, last_notes_sync_at, updated_at)
     VALUES ('main', '${time.toISOString()}', '${time.toISOString()}', NOW())
     ON CONFLICT (id) DO UPDATE SET
       last_sync_at = EXCLUDED.last_sync_at,
       last_notes_sync_at = EXCLUDED.last_notes_sync_at,
       updated_at = NOW()`,
  );
}

// ============================================
// Core sync logic
// ============================================

interface SyncResult {
  runId: string;
  created: number;
  updated: number;
  skipped: number;
  errored: number;
  durationMs: number;
  status: 'success' | 'failed';
  error?: string;
}

async function syncNotes(triggeredBy: 'watch' | 'manual' | 'full'): Promise<SyncResult> {
  const fullSync = triggeredBy === 'full';
  const startTime = Date.now();
  const syncStartTime = new Date();

  // Create audit log run entry
  const [run] = await db
    .insert(schema.syncRun)
    .values({
      status: 'running',
      triggeredBy,
    })
    .returning({ id: schema.syncRun.id });

  const runId = run.id;

  let created = 0;
  let updated = 0;
  let skipped = 0;
  let errored = 0;

  try {
    await ensureSyncStateTable();
    await ensureFallbackUser();

    const lastSync = fullSync ? null : await getLastNoteSyncTime();

    // Fetch all notes from RERUM
    const rerumNotes = await rerumQueryAll<RerumNote>({ type: 'message' });

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

        // Skip if not modified since last sync (incremental mode)
        if (lastSync && modifiedAt <= lastSync) {
          skipped++;
          continue;
        }

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

        await db.transaction(async (tx) => {
          if (existing) {
            await tx.update(schema.note).set(noteData).where(eq(schema.note.id, noteId));
          } else {
            await tx.insert(schema.note).values(noteData);
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
          runId,
          noteId,
          action,
        });
      } catch (error) {
        errored++;
        const noteId = extractId(rerumNote['@id']);
        const errorMsg = error instanceof Error ? error.message : String(error);

        await db.insert(schema.syncRunDetail).values({
          runId,
          noteId: noteId || 'unknown',
          action: 'errored',
          error: errorMsg,
        });
      }
    }

    await updateLastNoteSyncTime(syncStartTime);

    const durationMs = Date.now() - startTime;

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
      .where(eq(schema.syncRun.id, runId));

    lastRunAt = new Date();
    lastRunStatus = 'success';

    return { runId, created, updated, skipped, errored, durationMs, status: 'success' };
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const errorMsg = error instanceof Error ? error.message : String(error);

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
      .where(eq(schema.syncRun.id, runId));

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

export function isSyncRunning(): boolean {
  return intervalId !== undefined;
}

export async function startSync(): Promise<{ started: boolean; message: string }> {
  if (intervalId !== undefined) {
    return { started: false, message: 'Sync is already running' };
  }

  if (!env.RERUM_API_URL && !process.env.RERUM_API_URL) {
    return { started: false, message: 'RERUM_API_URL environment variable is not configured' };
  }

  // Run initial full sync
  syncInProgress = true;
  try {
    await syncNotes('full');
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

  return { started: true, message: 'Sync started with initial full sync' };
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
    while (syncInProgress && Date.now() - start < maxWait) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  return { stopped: true, message: 'Sync stopped' };
}

export async function triggerSync(): Promise<SyncResult> {
  if (syncInProgress) {
    throw new Error('A sync is already in progress');
  }

  syncInProgress = true;
  try {
    return await syncNotes('manual');
  } finally {
    syncInProgress = false;
  }
}

export async function triggerFullSync(): Promise<SyncResult> {
  if (syncInProgress) {
    throw new Error('A sync is already in progress');
  }

  syncInProgress = true;
  try {
    return await syncNotes('full');
  } finally {
    syncInProgress = false;
  }
}

// ============================================
// Firebase user sync (re-runnable from admin)
// ============================================

export async function syncUsersFromFirebase(): Promise<{
  created: number;
  updated: number;
  skipped: number;
}> {
  // Dynamic import to avoid loading firebase-admin at startup
  const { initializeApp, cert, getApps } = await import('firebase-admin/app');
  const { getAuth } = await import('firebase-admin/auth');
  const { getFirestore } = await import('firebase-admin/firestore');

  if (getApps().length === 0) {
    const credPath = env.FIREBASE_SERVICE_ACCOUNT_PATH;
    const credJson = env.FIREBASE_SERVICE_ACCOUNT;

    if (!credPath && !credJson) {
      throw new Error(
        'Firebase credentials not configured. Set FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_SERVICE_ACCOUNT.',
      );
    }

    let serviceAccount;
    if (credPath) {
      const fs = await import('fs');
      serviceAccount = JSON.parse(fs.readFileSync(credPath, 'utf-8'));
    } else {
      serviceAccount = JSON.parse(credJson!);
    }

    initializeApp({ credential: cert(serviceAccount) });
  }

  const auth = getAuth();
  const firestore = getFirestore();

  // Fetch all Firebase Auth users
  const allUsers: Array<{
    uid: string;
    email: string | undefined;
    displayName: string | undefined;
    emailVerified: boolean;
    photoURL: string | undefined;
    createdAt: Date;
    customClaims: Record<string, unknown> | undefined;
  }> = [];

  let nextPageToken: string | undefined;
  do {
    const listResult = await auth.listUsers(1000, nextPageToken);
    for (const u of listResult.users) {
      allUsers.push({
        uid: u.uid,
        email: u.email,
        displayName: u.displayName,
        emailVerified: u.emailVerified,
        photoURL: u.photoURL,
        createdAt: new Date(u.metadata.creationTime),
        customClaims: u.customClaims,
      });
    }
    nextPageToken = listResult.pageToken;
  } while (nextPageToken);

  let created = 0;
  let updated = 0;
  let skipped = 0;
  const deferredInstructorIds: Array<{ uid: string; instructorId: string }> = [];

  for (const fbUser of allUsers) {
    try {
      if (!fbUser.email) {
        skipped++;
        continue;
      }

      // Fetch Firestore doc for extra metadata
      let firestoreData: Record<string, unknown> | null = null;
      try {
        const doc = await firestore.collection('users').doc(fbUser.uid).get();
        firestoreData = doc.exists ? (doc.data() as Record<string, unknown>) : null;
      } catch {
        // Firestore doc may not exist
      }

      const isInstructor =
        firestoreData?.isInstructor === true || fbUser.customClaims?.instructor === true;

      const firestoreRoles = firestoreData?.roles as Record<string, boolean> | undefined;
      const isAdmin = fbUser.customClaims?.admin === true || firestoreRoles?.administrator === true;

      const instructorId =
        typeof firestoreData?.parentInstructorId === 'string'
          ? firestoreData.parentInstructorId
          : null;

      const pendingInstructorDescription =
        typeof firestoreData?.pendingInstructorDescription === 'string'
          ? firestoreData.pendingInstructorDescription
          : null;

      const name =
        (typeof firestoreData?.name === 'string' && firestoreData.name) ||
        fbUser.displayName ||
        fbUser.email.split('@')[0];

      const userData = {
        id: fbUser.uid,
        name,
        email: fbUser.email,
        emailVerified: fbUser.emailVerified,
        image: fbUser.photoURL || null,
        createdAt: fbUser.createdAt,
        updatedAt: new Date(),
        role: isAdmin ? 'admin' : 'user',
        isInstructor,
        instructorId: null as string | null,
        pendingInstructorDescription,
      };

      const existing = await db.query.user.findFirst({
        where: eq(schema.user.id, fbUser.uid),
      });

      if (existing) {
        await db.update(schema.user).set(userData).where(eq(schema.user.id, fbUser.uid));
        updated++;
      } else {
        await db.insert(schema.user).values(userData);
        created++;
      }

      if (instructorId) {
        deferredInstructorIds.push({ uid: fbUser.uid, instructorId });
      }
    } catch (error) {
      console.error(`[sync-service] Failed to sync user ${fbUser.uid}:`, error);
      skipped++;
    }
  }

  // Second pass: set instructorId now that all users exist
  for (const { uid, instructorId } of deferredInstructorIds) {
    try {
      await db.update(schema.user).set({ instructorId }).where(eq(schema.user.id, uid));
    } catch (error) {
      console.error(`[sync-service] Failed to set instructorId for ${uid}:`, error);
    }
  }

  return { created, updated, skipped };
}
