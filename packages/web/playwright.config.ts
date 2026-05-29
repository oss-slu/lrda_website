import { defineConfig, devices } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

// Browser e2e tests. The dev server (web + API + Postgres) must already be
// running -- start it manually with `pnpm dev`. No webServer auto-start.
export default defineConfig({
  testDir: './app/__e2e__',
  testMatch: '**/*.spec.ts',
  // Serial: specs share a single Postgres dataset seeded via the test endpoints.
  workers: 1,
  fullyParallel: false,
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: BASE_URL,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
