import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { admin, bearer } from 'better-auth/plugins';
import { expo } from '@better-auth/expo';
import { db } from './db';
import { env } from './env';
import { sendVerificationEmail, sendPasswordResetEmail } from './lib/email';
import { consumePassword } from './lib/pending-password-resets';

// Parse trusted origins from environment variable or use defaults
const getTrustedOrigins = (): string[] => {
  const origins: string[] = ['http://localhost:3000', 'http://localhost:3002'];

  if (env.CORS_ORIGINS) {
    const corsOrigins = env.CORS_ORIGINS.split(',').map(o => o.trim());
    origins.push(...corsOrigins);
  }

  return [...new Set(origins)];
};

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  basePath: '/api/auth',
  trustedOrigins: env.ENVIRONMENT === 'development' ? ['*'] : getTrustedOrigins(),
  user: {
    additionalFields: {
      isInstructor: {
        type: 'boolean',
        defaultValue: false,
        input: false,
      },
      pendingInstructorDescription: {
        type: 'string',
        required: false,
        input: true,
      },
      instructorId: {
        type: 'string',
        required: false,
        input: false,
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,

    sendResetPassword: async data => {
      const resetUrl = `${env.WEB_URL}/reset-password?token=${data.token}`;
      await sendPasswordResetEmail(data.user.email, resetUrl);
    },

    // Sync password to Firebase so the mobile app (still on Firebase Auth)
    // stays in sync. Remove when the mobile app migrates.
    onPasswordReset: async ({ user }) => {
      const plaintext = consumePassword(user.email);
      if (!plaintext) return;

      try {
        const { getApps, initializeApp, cert } = await import('firebase-admin/app');
        const { getAuth } = await import('firebase-admin/auth');

        if (getApps().length === 0) {
          const credPath = env.FIREBASE_SERVICE_ACCOUNT_PATH;
          const credJson = env.FIREBASE_SERVICE_ACCOUNT;
          if (!credPath && !credJson) {
            console.warn('[auth] Firebase credentials not configured, skipping password sync');
            return;
          }
          let serviceAccount;
          if (credPath) {
            const fs = await import('node:fs');
            serviceAccount = JSON.parse(fs.readFileSync(credPath, 'utf-8'));
          } else {
            serviceAccount = JSON.parse(credJson!);
          }
          initializeApp({ credential: cert(serviceAccount) });
        }

        const fbAuth = getAuth();
        const fbUser = await fbAuth.getUserByEmail(user.email);
        await fbAuth.updateUser(fbUser.uid, { password: plaintext });
        console.log(`[auth] Synced password reset to Firebase for ${user.email}`);
      } catch (error) {
        console.error('[auth] Failed to sync password reset to Firebase:', error);
      }
    },
  },
  emailVerification: {
    autoSignInAfterVerification: false,
    sendVerificationEmail: async data => {
      const verificationUrl = `${env.WEB_URL}/verify-email?token=${data.token}`;
      await sendVerificationEmail(data.user.email, verificationUrl);
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },
  advanced: {
    ...(env.COOKIE_DOMAIN && {
      crossSubDomainCookies: {
        enabled: true,
        domain: env.COOKIE_DOMAIN,
      },
    }),
  },
  rateLimit: {
    window: 60,
    max: 100,
    customRules: {
      '/sign-in/email': { window: 60, max: 10 },
      '/sign-up/email': { window: 60, max: 5 },
      '/request-password-reset': { window: 60, max: 5 },
      '/reset-password': { window: 60, max: 5 },
      '/send-verification-email': { window: 60, max: 5 },
    },
  },
  plugins: [
    admin({
      defaultRole: 'user',
      adminRole: 'admin',
    }),
    bearer(),
    expo(),
  ],
});
