/**
 * Global setup for API-level e2e tests.
 * Sets the API URL for test helpers.
 * Assumes the dev server is already running (`pnpm dev`).
 */
export default function setup() {
  process.env.__TEST_API_URL = process.env.__TEST_API_URL || 'http://localhost:3002';
}
