import { initializeApp, getApps } from "firebase/app";
import type { FirebaseApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import type { Auth } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import type { Firestore } from "firebase/firestore";
import { getDatabase, connectDatabaseEmulator } from "firebase/database";
import type { Database } from "firebase/database";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import type { FirebaseStorage } from "firebase/storage";

// Check if we should use Firebase emulators (local development)
const useEmulators = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true";

// Firebase configuration details
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "demo-api-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "demo-project.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "demo-project",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "demo-project.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:123:web:abc",
};

// Only initialize Firebase if we have valid config (non-empty values)
// This prevents Firebase from initializing during build when env vars are missing
const shouldInitializeFirebase = (): boolean => {
  // Always initialize if using emulators
  if (useEmulators) {
    return true;
  }

  // Check if we have all required environment variables with actual values (not empty strings)
  const hasValidConfig: boolean = !!(
    firebaseConfig.apiKey &&
    firebaseConfig.apiKey.trim() !== "" &&
    firebaseConfig.authDomain &&
    firebaseConfig.authDomain.trim() !== "" &&
    firebaseConfig.projectId &&
    firebaseConfig.projectId.trim() !== "" &&
    firebaseConfig.storageBucket &&
    firebaseConfig.storageBucket.trim() !== "" &&
    firebaseConfig.messagingSenderId &&
    firebaseConfig.messagingSenderId.trim() !== "" &&
    firebaseConfig.appId &&
    firebaseConfig.appId.trim() !== ""
  );

  return hasValidConfig;
};

// Initialize Firebase only if conditions are met
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let realtimeDb: Database | null = null;
let storage: FirebaseStorage | null = null;

if (shouldInitializeFirebase()) {
  try {
    // Check if Firebase is already initialized
    const existingApps = getApps();
    if (existingApps.length === 0) {
      app = initializeApp(firebaseConfig);
    } else {
      app = existingApps[0];
    }

    auth = getAuth(app);
    db = getFirestore(app);
    realtimeDb = getDatabase(app);
    storage = getStorage(app);

    // Connect to emulators if enabled (only in browser, and only once)
    if (useEmulators && typeof window !== "undefined") {
      // Use a flag to prevent multiple connections
      const emulatorKey = "__FIREBASE_EMULATORS_CONNECTED__";
      if (!(window as Record<string, unknown>)[emulatorKey]) {
        (window as Record<string, unknown>)[emulatorKey] = true;

        try {
          connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
          connectFirestoreEmulator(db, "127.0.0.1", 8080);
          connectDatabaseEmulator(realtimeDb, "127.0.0.1", 9000);
          connectStorageEmulator(storage, "127.0.0.1", 9199);
          console.log("Firebase Emulators connected - Auth:9099, Firestore:8080, Database:9000, Storage:9199");
        } catch (emulatorError) {
          console.warn("Failed to connect to Firebase emulators. Make sure they are running with: pnpm firebase:emulators", emulatorError);
          // Reset the flag so it can retry on next page load
          (window as Record<string, unknown>)[emulatorKey] = false;
        }
      }
    }
  } catch (error) {
    // If initialization fails, log error but don't crash during build
    if (typeof window !== "undefined") {
      console.error("Firebase initialization error:", error);
    }
    // Set to null so imports don't fail, but usage will need to check
    app = null;
    auth = null;
    db = null;
    realtimeDb = null;
    storage = null;
  }
} else {
  // During build or if config is missing, set to null
  // Components should handle null gracefully
  app = null;
  auth = null;
  db = null;
  realtimeDb = null;
  storage = null;
}

export { auth, db, realtimeDb, storage }; // Export db to use Firestore in other files
