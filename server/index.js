require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const { firebaseAuthMiddleware, initializeFirebaseAdmin } = require('./auth');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(bodyParser.json({ limit: '5mb' }));
app.use(cookieParser());

let rerumRouter = null;
try {
  // Try to require the rerum package/router. This project expects the rerum router
  // to be available as a Node package. If it's not present, we still create the server
  // so devs can run without it; in that case routes will return 404 unless mounted.
  rerumRouter = require('rerum');
} catch (e) {
  console.warn('Could not require "rerum" package. Make sure it is installed if you want to proxy to it.');
  const tmp = express.Router();
  tmp.all('*', (req, res) => res.status(404).json({ error: 'Rerum router not available in this environment.' }));
  rerumRouter = tmp;
}

// Apply auth middleware only for non-GET methods
app.use('/api', (req, res, next) => {
  if (process.env.DISABLE_AUTH === 'true' || req.method === 'GET') {
    return next();
  }
  return firebaseAuthMiddleware(req, res, next);
}, rerumRouter);

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'lrda-server OK' });
});

// Protected test route: POST /__auth_test returns authenticated user info
app.post('/__auth_test', firebaseAuthMiddleware, (req, res) => {
  res.json({ message: 'Auth successful', user: req.user || { note: 'DISABLE_AUTH=true (dev mode)' } });
});

// Start server after Firebase initialization
(async function startServer() {
  try {
    await initializeFirebaseAdmin();
    if (process.env.DISABLE_AUTH !== 'true') {
      console.log('Firebase admin initialized');
    } else {
      console.log('Auth disabled (DISABLE_AUTH=true) — running in dev mode');
    }
  } catch (err) {
    console.warn(
      'Firebase admin initialization failed. Set DISABLE_AUTH=true to skip, or provide FIREBASE_SERVICE_ACCOUNT/FIREBASE_SERVICE_ACCOUNT_PATH.',
      err && err.message ? err.message : err
    );
  }

  app.listen(PORT, () => {
    console.log(`LRDA server proxy listening on port ${PORT}`);
  });
})();
