import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.d.ts', 'src/**/__tests__/**'],
      reporter: ['text-summary', 'html'],
      thresholds: {
        lines: 19.63,
      },
      reportOnFailure: true,
    },
    env: {
      NODE_ENV: 'test',
      ENVIRONMENT: 'test',
      PORT: '3003',
      DATABASE_URL: 'postgresql://lrda:lrda_dev@localhost:5433/lrda_api',
      LOG_LEVEL: 'silent',
      BETTER_AUTH_SECRET: 'test-secret-key-for-testing-only',
      BETTER_AUTH_URL: 'http://localhost:3003',
    },
  },
  resolve: {
    alias: {
      '@': './src',
    },
  },
});
