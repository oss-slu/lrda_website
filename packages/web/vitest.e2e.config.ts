import { defineConfig } from 'vitest/config';

// API-level e2e tests (HTTP against a running dev server). Browser e2e tests
// run separately via @playwright/test (see playwright.config.ts).
export default defineConfig({
  test: {
    include: ['tests/e2e/**/*.test.ts'],
    globalSetup: ['tests/e2e/setup.ts'],
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
