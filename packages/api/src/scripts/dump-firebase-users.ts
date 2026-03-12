/**
 * Dump all Firebase users (Auth + Firestore) to a JSON file.
 *
 * Outputs to packages/api/firebase-users-dump.json
 *
 * Usage:
 *   bun run src/scripts/dump-firebase-users.ts
 *
 * Environment variables:
 *   FIREBASE_SERVICE_ACCOUNT_PATH   - Path to service account JSON file
 *   OR
 *   FIREBASE_SERVICE_ACCOUNT        - Service account JSON as string
 */

import { initializeApp, cert, type ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';

const SERVICE_ACCOUNT_PATH = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || '';
const SERVICE_ACCOUNT_JSON = process.env.FIREBASE_SERVICE_ACCOUNT || '';

function initializeFirebase(): void {
  let serviceAccount: ServiceAccount;

  if (SERVICE_ACCOUNT_PATH) {
    const fileContent = fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf-8');
    serviceAccount = JSON.parse(fileContent) as ServiceAccount;
    console.log(`Loaded service account from: ${SERVICE_ACCOUNT_PATH}`);
  } else if (SERVICE_ACCOUNT_JSON) {
    serviceAccount = JSON.parse(SERVICE_ACCOUNT_JSON) as ServiceAccount;
    console.log('Loaded service account from environment variable');
  } else {
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

  initializeApp({ credential: cert(serviceAccount) });
}

async function main() {
  initializeFirebase();

  const auth = getAuth();
  const firestore = getFirestore();
  const users: Record<string, unknown>[] = [];

  let nextPageToken: string | undefined;
  let page = 0;

  do {
    const listResult = await auth.listUsers(1000, nextPageToken);
    page++;
    console.log(`Fetched page ${page} (${listResult.users.length} users)`);

    for (const user of listResult.users) {
      // Fetch Firestore doc for extra fields
      let firestoreData: Record<string, unknown> | null = null;
      try {
        const doc = await firestore.collection('users').doc(user.uid).get();
        firestoreData = doc.exists ? (doc.data() as Record<string, unknown>) : null;
      } catch {
        // skip if Firestore doc fails
      }

      users.push({
        uid: user.uid,
        email: user.email || null,
        displayName: user.displayName || null,
        emailVerified: user.emailVerified,
        photoURL: user.photoURL || null,
        phoneNumber: user.phoneNumber || null,
        disabled: user.disabled,
        createdAt: user.metadata.creationTime,
        lastSignIn: user.metadata.lastSignInTime || null,
        customClaims: user.customClaims || null,
        firestore: firestoreData,
      });
    }

    nextPageToken = listResult.pageToken;
  } while (nextPageToken);

  const outPath = path.resolve(__dirname, '../../firebase-users-dump.json');
  fs.writeFileSync(outPath, JSON.stringify(users, null, 2));
  console.log(`Wrote ${users.length} users to ${outPath}`);

  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
