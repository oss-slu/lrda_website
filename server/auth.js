import { getAuth } from "firebase-admin/auth";
import { initializeApp, applicationDefault } from "firebase-admin/app";
import dotenv from "dotenv";
dotenv.config();

// Initialize Firebase Admin SDK if not already initialized
if (!getAuth.apps?.length) {
  initializeApp({
    credential: applicationDefault(),
  });
}

/**
 * Firebase Authentication Middleware
 * Verifies Firebase ID tokens from the Authorization header
 * Can be disabled in development by setting DISABLE_AUTH=true in .env
 */
export const firebaseAuthMiddleware = async (req, res, next) => {
  // Bypass authentication in development mode
  if (process.env.DISABLE_AUTH === 'true') {
    console.log('[Auth] Authentication bypassed (DISABLE_AUTH=true)');
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }
  
  const idToken = authHeader.split(" ")[1];
  try {
    const decodedToken = await getAuth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('[Auth] Token verification failed:', error.message);
    res.status(401).json({ error: "Invalid token" });
  }
};

/**
 * Selective Authentication Middleware
 * Applies authentication only to routes that modify data (POST, PUT, PATCH, DELETE)
 * GET requests (read-only) are allowed without authentication
 */
export const selectiveAuthMiddleware = async (req, res, next) => {
  // Allow GET requests without authentication (read-only operations)
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return next();
  }

  // Apply authentication for all other methods (POST, PUT, PATCH, DELETE)
  return firebaseAuthMiddleware(req, res, next);
};