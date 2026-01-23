/**
 * Firebase to PostgreSQL User Sync Script
 *
 * This script syncs users from Firebase Auth to PostgreSQL.
 * Run this BEFORE syncing notes/comments from RERUM.
 *
 * Usage:
 *   bun run src/scripts/sync-users-from-firebase.ts           # Dry-run (preview only)
 *   bun run src/scripts/sync-users-from-firebase.ts --yolo    # Actually write to database
 *
 * Environment variables:
 *   DATABASE_URL                    - PostgreSQL connection string
 *   FIREBASE_SERVICE_ACCOUNT_PATH   - Path to service account JSON file
 *   OR
 *   FIREBASE_SERVICE_ACCOUNT        - Service account JSON as string (for CI/CD)
 */

import { initializeApp, cert, type ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema';
import * as fs from 'fs';

// Configuration
const DATABASE_URL = process.env.DATABASE_URL || '';
const SERVICE_ACCOUNT_PATH = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || '';
const SERVICE_ACCOUNT_JSON = process.env.FIREBASE_SERVICE_ACCOUNT || '';

// Runtime flags
let DRY_RUN = true;

// Initialize database connection
const pool = new Pool({ connectionString: DATABASE_URL });
const db = drizzle(pool, { schema });

// Logger with timestamps
function log(level: 'info' | 'warn' | 'error', message: string, data?: unknown) {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [FIREBASE-SYNC] [${level.toUpperCase()}]`;
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
    // Load from file path
    const fileContent = fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf-8');
    serviceAccount = JSON.parse(fileContent) as ServiceAccount;
    log('info', `Loaded service account from: ${SERVICE_ACCOUNT_PATH}`);
  } else if (SERVICE_ACCOUNT_JSON) {
    // Load from environment variable (JSON string)
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

// Sync users to PostgreSQL
async function syncUsers() {
  log('info', 'Starting user sync from Firebase...');

  const firebaseUsers = await fetchAllFirebaseUsers();
  log('info', `Fetched ${firebaseUsers.length} users from Firebase`);

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const fbUser of firebaseUsers) {
    try {
      // Skip users without email (shouldn't happen but just in case)
      if (!fbUser.email) {
        log('warn', `Skipping user ${fbUser.uid} - no email`);
        skipped++;
        continue;
      }

      // Extract custom claims for instructor status
      const isInstructor = fbUser.customClaims?.instructor === true;
      const isAdmin = fbUser.customClaims?.admin === true;

      const userData = {
        id: fbUser.uid,
        name: fbUser.displayName || fbUser.email.split('@')[0],
        email: fbUser.email,
        emailVerified: fbUser.emailVerified,
        image: fbUser.photoURL || null,
        createdAt: fbUser.createdAt,
        updatedAt: new Date(),
        role: isAdmin ? 'admin' : 'user',
        isInstructor,
        // Note: instructorId would need to be synced separately if stored elsewhere
      };

      // Check if user exists
      const existing = await db.query.user.findFirst({
        where: eq(schema.user.id, fbUser.uid),
      });

      if (DRY_RUN) {
        if (existing) {
          log('info', `[DRY RUN] Would update user: ${fbUser.uid} (${fbUser.email})`);
          updated++;
        } else {
          log('info', `[DRY RUN] Would create user: ${fbUser.uid} (${fbUser.email})`);
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
    } catch (error) {
      log('error', `Failed to sync user ${fbUser.uid}`, error);
      skipped++;
    }
  }

  log('info', `User sync complete: ${created} created, ${updated} updated, ${skipped} skipped`);
  return { created, updated, skipped };
}

// CLI entry point
async function main() {
  const args = process.argv.slice(2);
  const yoloMode = args.includes('--yolo');

  if (yoloMode) {
    DRY_RUN = false;
  }

  if (!DATABASE_URL) {
    console.error('Error: DATABASE_URL environment variable is required');
    process.exit(1);
  }

  if (!SERVICE_ACCOUNT_PATH && !SERVICE_ACCOUNT_JSON) {
    console.error(
      'Error: FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_SERVICE_ACCOUNT environment variable is required',
    );
    console.error('');
    console.error('To get a service account:');
    console.error('  1. Go to Firebase Console > Project Settings > Service Accounts');
    console.error('  2. Click "Generate new private key"');
    console.error('  3. Save the JSON file and set FIREBASE_SERVICE_ACCOUNT_PATH to its path');
    process.exit(1);
  }

  log('info', 'Firebase User Sync Script starting...');
  log(
    'info',
    DRY_RUN ?
      'DRY RUN MODE - No changes will be written to database'
    : 'YOLO MODE - Changes WILL be written to database',
  );

  try {
    initializeFirebase();
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
