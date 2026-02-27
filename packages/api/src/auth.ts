import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { admin } from 'better-auth/plugins';
import { db } from './db';
import { env } from './env';

// Parse trusted origins from environment variable or use defaults
const getTrustedOrigins = (): string[] => {
  const origins: string[] = ['http://localhost:3000', 'http://localhost:3002'];

  if (env.CORS_ORIGINS) {
    const corsOrigins = env.CORS_ORIGINS.split(',').map(o => o.trim());
    origins.push(...corsOrigins);
  }

  return [...new Set(origins)]; // Remove duplicates
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
    requireEmailVerification: true, // Require email verification before login

    sendResetPassword: async data => {
      console.log(`✓ Password reset link generated for ${data.user.email}`);
      console.log(`Reset URL: ${data.url}`);
    },
  },
  emailVerification: {
    autoSignInAfterVerification: false,
    sendVerificationEmail: async data => {
      // Extract token from the verification URL
      const url = new URL(data.url);
      const token = url.searchParams.get('token');

      // Construct the web app verification URL
      const webAppUrl = process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3000';
      const verificationUrl = `${webAppUrl}/verify-email?token=${token}`;

      console.log(`✓ Verification email sent to ${data.user.email}`);
      console.log(`Verification URL: ${verificationUrl}`);
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
