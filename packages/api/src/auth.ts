import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { admin } from 'better-auth/plugins';
import type { Database } from './db';
import { sendVerificationEmail, sendPasswordResetEmail } from './lib/email';

export function createAuth(env: Env, db: Database) {
  // Parse trusted origins from environment variable or use defaults
  const origins: string[] = ['http://localhost:3000', 'http://localhost:8787'];
  if (env.CORS_ORIGINS) {
    const corsOrigins = env.CORS_ORIGINS.split(',').map(o => o.trim());
    origins.push(...corsOrigins);
  }
  const trustedOrigins = [...new Set(origins)];

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: 'sqlite',
    }),
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    basePath: '/api/auth',
    trustedOrigins,
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
          input: true,
        },
      },
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,

      sendResetPassword: async data => {
        const url = new URL(data.url);
        const token = url.searchParams.get('token');
        const resetUrl = `${env.WEB_URL}/reset-password?token=${token}`;
        await sendPasswordResetEmail(data.user.email, resetUrl);
      },
    },
    emailVerification: {
      autoSignInAfterVerification: false,
      sendVerificationEmail: async data => {
        // Extract token from the verification URL and build a web-app URL
        const url = new URL(data.url);
        const token = url.searchParams.get('token');
        const verificationUrl = `${env.WEB_URL}/verify-email?token=${token}`;

        await sendVerificationEmail(data.user.email, verificationUrl);
      },
    },
    session: {
      cookieCache: {
        enabled: true,
        maxAge: 5 * 60, // 5 minutes
      },
    },
    plugins: [
      admin({
        defaultRole: 'user',
        adminRole: 'admin',
      }),
    ],
  });
}
