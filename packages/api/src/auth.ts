import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { admin } from 'better-auth/plugins';
import { db } from './db';
import { env } from './env';
import { sendVerificationEmail, sendPasswordResetEmail } from './lib/email';

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
  trustedOrigins: getTrustedOrigins(),
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
