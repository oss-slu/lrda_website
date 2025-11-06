import { initializeApp, getApps } from "firebase/app";
import { getAuth, initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore, Timestamp } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

// Firebase configuration details
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

// Only initialize Firebase if we have valid config (non-empty values)
// This prevents Firebase from initializing during build when env vars are missing
const shouldInitializeFirebase = () => {
  // Check if we have all required environment variables with actual values (not empty strings)
  const hasValidConfig = 
    firebaseConfig.apiKey && 
    firebaseConfig.apiKey.trim() !== '' &&
    firebaseConfig.authDomain && 
    firebaseConfig.authDomain.trim() !== '' &&
    firebaseConfig.projectId &&
    firebaseConfig.projectId.trim() !== '' &&
    firebaseConfig.storageBucket &&
    firebaseConfig.storageBucket.trim() !== '' &&
    firebaseConfig.messagingSenderId &&
    firebaseConfig.messagingSenderId.trim() !== '' &&
    firebaseConfig.appId &&
    firebaseConfig.appId.trim() !== '';
  
  return hasValidConfig;
};

// Initialize Firebase only if conditions are met
let app, auth, db, realtimeDb, storage;

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
  } catch (error) {
    // If initialization fails, log error but don't crash during build
    if (typeof window !== 'undefined') {
      console.error('Firebase initialization error:', error);
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

export { auth, db, realtimeDb, storage };  // Export db to use Firestore in other files
