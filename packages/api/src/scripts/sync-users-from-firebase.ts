/**
 * Firebase to PostgreSQL User Sync Script
 *
 * By default, reads from firebase-users-dump.json (local file).
 * With --remote, fetches live from Firebase Auth + Firestore instead.
 *
 * Usage:
 *   pnpm sync:users                    # Dry-run from local file
 *   pnpm sync:users --yolo             # Write to DB from local file
 *   pnpm sync:users --yolo --remote    # Fetch from Firebase API
 *
 * Environment variables (only needed with --remote):
 *   FIREBASE_SERVICE_ACCOUNT_PATH   - Path to service account JSON file
 *   OR
 *   FIREBASE_SERVICE_ACCOUNT        - Service account JSON as string (for CI/CD)
 */

import { initializeApp, cert, type ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema';
import * as fs from 'fs';
import { openLocalDb } from './local-db';

// Configuration
const SERVICE_ACCOUNT_PATH = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || '';
const SERVICE_ACCOUNT_JSON = process.env.FIREBASE_SERVICE_ACCOUNT || '';
const DUMP_PATH = new URL('../../firebase-users-dump.json', import.meta.url).pathname;

// Runtime flags
let DRY_RUN = true;
let USE_REMOTE = false;

// Initialize database connection
const { db, pool } = openLocalDb();

// Logger with timestamps
function log(level: 'info' | 'warn' | 'error', message: string, data?: unknown) {
  const ts = new Date().toISOString();
  const prefix = `[${ts}] [FIREBASE-SYNC] [${level.toUpperCase()}]`;
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

// Initialize Firebase Admin SDK
function initializeFirebase(): void {
  let serviceAccount: ServiceAccount;

  if (SERVICE_ACCOUNT_PATH) {
    const fileContent = fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf-8');
    serviceAccount = JSON.parse(fileContent) as ServiceAccount;
    log('info', `Loaded service account from: ${SERVICE_ACCOUNT_PATH}`);
  } else if (SERVICE_ACCOUNT_JSON) {
    serviceAccount = JSON.parse(SERVICE_ACCOUNT_JSON) as ServiceAccount;
    log('info', 'Loaded service account from environment variable');
  } else {
    throw new Error(
      'Firebase credentials required. Set FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_SERVICE_ACCOUNT',
    );
  }

  initializeApp({
    credential: cert(serviceAccount),
  });
}

// Fetch all users from Firebase Auth (paginated)
async function fetchAllFirebaseUsers() {
  const auth = getAuth();
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

    for (const user of listResult.users) {
      allUsers.push({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        emailVerified: user.emailVerified,
        photoURL: user.photoURL,
        createdAt: new Date(user.metadata.creationTime),
        customClaims: user.customClaims,
      });
    }

    nextPageToken = listResult.pageToken;
  } while (nextPageToken);

  return allUsers;
}

// Fetch Firestore user document (for fields not in Firebase Auth)
async function fetchFirestoreUser(uid: string): Promise<Record<string, unknown> | null> {
  try {
    const firestore = getFirestore();
    const doc = await firestore.collection('users').doc(uid).get();
    return doc.exists ? (doc.data() as Record<string, unknown>) : null;
  } catch (error) {
    log('warn', `Failed to fetch Firestore doc for ${uid}`, error);
    return null;
  }
}

// Dump file user structure
interface DumpUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
  photoURL: string | null;
  createdAt: string | null;
  lastSignIn: string | null;
  customClaims: Record<string, unknown> | null;
  firestore: Record<string, unknown> | null;
}

// Load users from local JSON dump file
async function loadUsersFromFile() {
  log('info', `Loading users from ${DUMP_PATH}...`);
  if (!fs.existsSync(DUMP_PATH)) {
    throw new Error(
      `Dump file not found: ${DUMP_PATH}\nRun with --remote to fetch from Firebase API instead.`,
    );
  }
  const dumpUsers: DumpUser[] = JSON.parse(fs.readFileSync(DUMP_PATH, 'utf-8'));
  log('info', `Loaded ${dumpUsers.length} users from file`);

  return dumpUsers.map(u => ({
    uid: u.uid,
    email: u.email ?? undefined,
    displayName: u.displayName ?? undefined,
    emailVerified: u.emailVerified,
    photoURL: u.photoURL ?? undefined,
    createdAt: u.createdAt ? new Date(u.createdAt) : new Date(),
    customClaims: u.customClaims ?? undefined,
    firestoreData: u.firestore,
  }));
}

// Sync users to PostgreSQL
async function syncUsers() {
  log('info', 'Starting user sync...');

  let firebaseUsers: Array<{
    uid: string;
    email: string | undefined;
    displayName: string | undefined;
    emailVerified: boolean;
    photoURL: string | undefined;
    createdAt: Date;
    customClaims: Record<string, unknown> | undefined;
    firestoreData?: Record<string, unknown> | null;
  }>;

  if (USE_REMOTE) {
    const rawUsers = await fetchAllFirebaseUsers();
    firebaseUsers = rawUsers.map(u => ({ ...u, firestoreData: null }));
    log('info', `Fetched ${firebaseUsers.length} users from Firebase API`);
  } else {
    firebaseUsers = await loadUsersFromFile();
  }

  let created = 0;
  let updated = 0;
  let skipped = 0;

  // Collect user data with deferred instructorId references
  const deferredInstructorIds: Array<{ uid: string; instructorId: string }> = [];

  for (const fbUser of firebaseUsers) {
    try {
      if (!fbUser.email) {
        log('warn', `Skipping user ${fbUser.uid} - no email`);
        skipped++;
        continue;
      }

      const firestoreData =
        USE_REMOTE ? await fetchFirestoreUser(fbUser.uid) : (fbUser.firestoreData ?? null);

      const isInstructor =
        firestoreData?.isInstructor === true || fbUser.customClaims?.instructor === true;

      const firestoreRoles = firestoreData?.roles as Record<string, boolean> | undefined;
      const isAdmin = fbUser.customClaims?.admin === true || firestoreRoles?.administrator === true;

      const instructorId =
        typeof firestoreData?.parentInstructorId === 'string' ?
          firestoreData.parentInstructorId
        : null;

      const pendingInstructorDescription =
        typeof firestoreData?.pendingInstructorDescription === 'string' ?
          firestoreData.pendingInstructorDescription
        : null;

      const name =
        (typeof firestoreData?.name === 'string' && firestoreData.name) ||
        fbUser.displayName ||
        fbUser.email.split('@')[0];

      // First pass: insert/update without instructorId to avoid FK ordering issues
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

      if (DRY_RUN) {
        if (existing) {
          log('info', `[DRY RUN] Would update user: ${fbUser.uid} (${fbUser.email})`, {
            isInstructor,
            isAdmin,
            instructorId,
            pendingInstructorDescription: pendingInstructorDescription ? '(set)' : null,
          });
          updated++;
        } else {
          log('info', `[DRY RUN] Would create user: ${fbUser.uid} (${fbUser.email})`, {
            isInstructor,
            isAdmin,
            instructorId,
            pendingInstructorDescription: pendingInstructorDescription ? '(set)' : null,
          });
          created++;
        }
      } else {
        if (existing) {
          await db.update(schema.user).set(userData).where(eq(schema.user.id, fbUser.uid));
          updated++;
        } else {
          await db.insert(schema.user).values(userData);
          created++;
        }
      }

      // Defer instructorId assignment to second pass
      if (instructorId) {
        deferredInstructorIds.push({ uid: fbUser.uid, instructorId });
      }
    } catch (error) {
      log('error', `Failed to sync user ${fbUser.uid}`, error);
      skipped++;
    }
  }

  // Second pass: set instructorId now that all users exist
  if (deferredInstructorIds.length > 0) {
    log('info', `Setting instructorId for ${deferredInstructorIds.length} students...`);
    for (const { uid, instructorId } of deferredInstructorIds) {
      if (DRY_RUN) {
        log('info', `[DRY RUN] Would set instructorId=${instructorId} for user ${uid}`);
      } else {
        try {
          await db.update(schema.user).set({ instructorId }).where(eq(schema.user.id, uid));
        } catch (error) {
          log(
            'warn',
            `Failed to set instructorId for ${uid} (instructor ${instructorId} may not exist)`,
            error,
          );
        }
      }
    }
  }

  log('info', `User sync complete: ${created} created, ${updated} updated, ${skipped} skipped`);
  return { created, updated, skipped };
}

// CLI entry point
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--yolo')) DRY_RUN = false;
  if (args.includes('--remote')) USE_REMOTE = true;

  if (USE_REMOTE && !SERVICE_ACCOUNT_PATH && !SERVICE_ACCOUNT_JSON) {
    console.error(
      'Error: FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_SERVICE_ACCOUNT environment variable is required for --remote mode',
    );
    console.error('');
    console.error('To get a service account:');
    console.error('  1. Go to Firebase Console > Project Settings > Service Accounts');
    console.error('  2. Click "Generate new private key"');
    console.error('  3. Save the JSON file and set FIREBASE_SERVICE_ACCOUNT_PATH to its path');
    process.exit(1);
  }

  log('info', 'Firebase User Sync Script starting...');
  log('info', `Source: ${USE_REMOTE ? 'Firebase API' : `Local file (${DUMP_PATH})`}`);
  log(
    'info',
    DRY_RUN ?
      'DRY RUN MODE - No changes will be written to database'
    : 'YOLO MODE - Changes WILL be written to database',
  );

  try {
    if (USE_REMOTE) initializeFirebase();
    await syncUsers();
    await pool.end();
    process.exit(0);
  } catch (error) {
    log('error', 'Fatal error', error);
    await pool.end();
    process.exit(1);
  }
}

export { syncUsers };

main();
