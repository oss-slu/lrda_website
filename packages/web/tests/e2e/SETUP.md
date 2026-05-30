# Test Setup Guide

## Prerequisites

- Node.js 24+ and pnpm
- Your LRDA website application running locally

## Step-by-Step Setup

### 1. Configure Environment Variables

Ensure your `.env` files are set up for both the API and web packages:

- **API** (`packages/api/.env`): `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`
- **Web** (`packages/web/.env`): `VITE_GOOGLE_MAPS_API_KEY`, `VITE_API_URL` (defaults to `http://localhost:3002`)

The API must be running and connected to a PostgreSQL database for tests to pass.

### 2. Install Playwright Browsers

```bash
pnpm --filter web test:e2e:install
```

### 3. Start Your Application

```bash
pnpm dev
```

The dev server is NOT started automatically -- start it manually before running tests.

### 4. Run Tests

```bash
# Run all tests (unit + integration + e2e)
pnpm --filter web test

# Run only API integration tests (Vitest, HTTP against running server)
pnpm --filter web test:integration

# Run only browser e2e specs (Playwright)
pnpm --filter web test:e2e

# Run browser specs with a visible browser
pnpm --filter web test:e2e:headed

# Open the Playwright UI / trace runner
pnpm --filter web test:e2e:ui
```

## Architecture

```
tests/
  helpers/          # Shared helpers (db-seed, client, auth)
  integration/      # API integration tests (Vitest, HTTP/fetch)
  e2e/              # Browser e2e specs (Playwright)
    helpers/        # Playwright-only helpers (pw.ts, auth-ui.ts)
```

Two runners, each for what it's good at:

- **Browser e2e specs** (`tests/e2e/**/*.spec.ts`) run on **`@playwright/test`** (`playwright.config.ts`)
  -- web-first auto-waiting assertions, traces/screenshots on failure, `--ui` mode.
- **API integration tests** (`tests/integration/**/*.test.ts`) run on **Vitest** (`vitest.integration.config.ts`)
  -- plain HTTP/fetch tests, no browser.

Browser-only helpers (`tests/e2e/helpers/`):

- `pw.ts` -- `authedPage(browser, userId)` (injects a real signed session cookie),
  `anonPage(browser)`, and `url()`. Each call uses an isolated browser context.
- `auth-ui.ts` -- dev-mode email capture (`getLastEmailUrl`, `extractToken`,
  `verifyEmailToken`) and `cleanupByEmail` for the auth-page specs.

Both layers share the seed/query helpers in `tests/helpers/` (raw SQL + session
minting via the test-only `/api/test` endpoints, which are disabled in production).

## Test Structure

### Browser E2E Specs (in `tests/e2e/`)

- `authenticated.spec.ts` -- Authenticated flows: notes page, admin dashboard, nav state
- `auth-pages.spec.ts` -- Auth UI: protected-route guard, full signup -> verify -> login
- `comments.spec.ts` -- Comment threading between student and instructor
- `firebase-password-sync.spec.ts` -- Password reset syncs to Firebase
- `notes-editor.spec.ts` -- Note CRUD and metadata editing

### API Integration Tests (in `tests/integration/`)

- `admin/admin.test.ts` -- Admin API endpoints
- `auth/auth-flows.test.ts` -- Full auth lifecycle: signup, email verification, password reset, Firebase migration
- `auth/security.test.ts` -- Auth guards, CSRF, admin access control
- `comments/comments-threading.test.ts` -- Comment threading API
- `notes/notes-crud.test.ts` -- Note CRUD operations
- `notes/notes-access.test.ts` -- Note access control

## Adding New Tests

### Browser e2e spec

1. Create a `.spec.ts` file in `tests/e2e/`
2. `import { test, expect } from '@playwright/test'`
3. Use the `browser` fixture with `authedPage` / `anonPage` from `./helpers/pw`
4. Import shared helpers from `../helpers/` (db-seed, client, auth)

### API integration test

1. Create a `.test.ts` file in `tests/integration/`
2. Import shared helpers from `../../helpers/` (db-seed, client, auth)

## Troubleshooting

### Common Issues

1. **Tests fail with element not found**
   - Check your HTML structure / update selectors
   - `pnpm --filter web test:e2e:ui` to step through with the trace runner

2. **Application not running**
   - Ensure `pnpm dev` is running and the app is at `http://localhost:3000`
   - The API must be reachable at `http://localhost:3002` and connected to Postgres
