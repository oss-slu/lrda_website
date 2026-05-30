import { defineConfig } from 'vitest/config';

// API integration tests (HTTP against a running dev server). Browser e2e tests
// run separately via @playwright/test (see playwright.config.ts).
export default defineConfig({
  test: {
    include: ['tests/integration/**/*.test.ts'],
    globalSetup: ['tests/integration/setup.ts'],
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
