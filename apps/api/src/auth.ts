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
  emailAndPassword: {
    enabled: true,

    sendResetPassword: async (data) => {
      // In development, just log the reset link for testing
      // In production, replace this with actual email sending
      console.log(`✓ Password reset link generated for ${data.user.email}`);
      console.log(`Reset URL: ${data.url}`);
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },
  trustedOrigins: ['http://localhost:3000', 'http://localhost:3001'],
  plugins: [
    admin({
      defaultRole: 'user',
      adminRole: 'admin',
    }),
  ],
});
