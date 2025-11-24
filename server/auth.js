require('dotenv').config();
const admin = require('firebase-admin');
const fs = require('fs');

let initialized = false;

async function initializeFirebaseAdmin() {
  if (process.env.DISABLE_AUTH === 'true') {
    console.log('DISABLE_AUTH is true — skipping Firebase admin initialization');
    initialized = true;
    return;
  }

  if (initialized) return;

  try {
    // Support two patterns: JSON string in env, or path to service account file
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        const svc = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        admin.initializeApp({ credential: admin.credential.cert(svc) });
        initialized = true;
        console.log('Firebase admin initialized from FIREBASE_SERVICE_ACCOUNT env var');
        return;
      } catch (parseErr) {
        console.warn('Failed to parse FIREBASE_SERVICE_ACCOUNT JSON:', parseErr.message);
        throw parseErr;
      }
    }

    if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      try {
        const json = fs.readFileSync(process.env.FIREBASE_SERVICE_ACCOUNT_PATH, 'utf8');
        const svc = JSON.parse(json);
        admin.initializeApp({ credential: admin.credential.cert(svc) });
        initialized = true;
        console.log('Firebase admin initialized from FIREBASE_SERVICE_ACCOUNT_PATH');
        return;
      } catch (fileErr) {
        console.warn('Failed to read or parse service account file:', fileErr.message);
        throw fileErr;
      }
    }

    // If no service account is provided, attempt default credentials (useful in GCP)
    console.log('Attempting to use default Firebase credentials...');
    admin.initializeApp();
    initialized = true;
  } catch (err) {
    console.warn('Failed to initialize Firebase admin:', err && err.message ? err.message : err);
    throw err;
  }
}

async function firebaseAuthMiddleware(req, res, next) {
  // Bypass in development if requested
  if (process.env.DISABLE_AUTH === 'true') {
    return next();
  }

  const authHeader = req.headers.authorization || '';
  const match = authHeader.match(/^Bearer (.+)$/);
  if (!match) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = match[1];
  
  try {
    // Ensure admin is initialized before verifying
    if (!initialized) {
      await initializeFirebaseAdmin();
    }
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;
    return next();
  } catch (err) {
    console.warn('Token verification failed:', err && err.message ? err.message : err);
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

module.exports = {
  initializeFirebaseAdmin,
  firebaseAuthMiddleware,
};
