require('dotenv').config();
const admin = require('firebase-admin');
const fs = require('fs');

let initialized = false;

async function initializeFirebaseAdmin() {
  if (process.env.DISABLE_AUTH === 'true') {
    console.log('DISABLE_AUTH is true — skipping Firebase admin initialization');
    return;
  }

  if (initialized) return;

  try {
    // Support two patterns: JSON string in env, or path to service account file
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const svc = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({ credential: admin.credential.cert(svc) });
      initialized = true;
      return;
    }

    if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      const json = fs.readFileSync(process.env.FIREBASE_SERVICE_ACCOUNT_PATH, 'utf8');
      const svc = JSON.parse(json);
      admin.initializeApp({ credential: admin.credential.cert(svc) });
      initialized = true;
      return;
    }

    // If no service account is provided, attempt default credentials (useful in GCP)
    admin.initializeApp();
    initialized = true;
  } catch (err) {
    console.warn('Failed to initialize Firebase admin:', err && err.message ? err.message : err);
    throw err;
  }
}

function firebaseAuthMiddleware(req, res, next) {
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
  // Ensure admin is initialized
  if (!initialized) {
    // attempt initialization synchronously
    try {
      // initialization may throw; wrap in try/catch
      // but prefer async init earlier
      initializeFirebaseAdmin().catch(() => {});
    } catch (e) {}
  }

  admin
    .auth()
    .verifyIdToken(token)
    .then((decoded) => {
      req.user = decoded;
      next();
    })
    .catch((err) => {
      console.warn('Token verification failed:', err && err.message ? err.message : err);
      res.status(401).json({ error: 'Unauthorized' });
    });
}

module.exports = {
  initializeFirebaseAdmin,
  firebaseAuthMiddleware,
};
