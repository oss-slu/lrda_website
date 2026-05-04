import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { admin, bearer } from 'better-auth/plugins';
import { expo } from '@better-auth/expo';
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
