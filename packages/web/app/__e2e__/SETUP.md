# E2E Test Setup Guide

## Prerequisites

- Node.js 24+ and pnpm
- Your LRDA website application running locally

## Step-by-Step Setup

### 1. Configure Environment Variables

Ensure your `.env` files are set up for both the API and web packages:

- **API** (`packages/api/.env`): `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`
- **Web** (`packages/web/.env`): `VITE_GOOGLE_MAPS_API_KEY`, `VITE_API_URL` (defaults to `http://localhost:3002`)

The API must be running and connected to a PostgreSQL database for E2E tests to pass.

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
# Run all E2E tests (API + browser)
pnpm --filter web test:e2e

# Run only browser specs (Playwright)
pnpm --filter web test:e2e:browser

# Run only API tests (Vitest)
pnpm --filter web test:e2e:api

# Run browser specs with a visible browser
pnpm --filter web test:e2e:headed

# Open the Playwright UI / trace runner
pnpm --filter web test:e2e:ui
```

## Architecture

Two runners, each for what it's good at:

- **Browser specs** (`app/__e2e__/**/*.spec.ts`) run on **`@playwright/test`** (`playwright.config.ts`)
  -- web-first auto-waiting assertions, traces/screenshots on failure, `--ui` mode.
- **API e2e** (`tests/e2e/**/*.test.ts`) run on **Vitest** (`vitest.e2e.config.ts`)
  -- plain HTTP/fetch tests, no browser.

Browser helpers (`app/__e2e__/helpers/`):

- `pw.ts` -- `authedPage(browser, userId)` (injects a real signed session cookie),
  `anonPage(browser)`, and `url()`. Each call uses an isolated browser context.
- `auth-ui.ts` -- dev-mode email capture (`getLastEmailUrl`, `extractToken`,
  `verifyEmailToken`) and `cleanupByEmail` for the auth-page specs.

Both layers share the seed/query helpers in `tests/e2e/helpers/` (raw SQL + session
minting via the test-only `/api/test` endpoints, which are disabled in production).

## Test Structure

### Browser Specs (in `app/__e2e__/`)

- `authenticated.spec.ts` -- Authenticated flows: notes page, admin dashboard, nav state
  (session injected; navigates client-side because the authenticated routes' document
  SSR pass hangs in Vite dev)
- `auth-pages.spec.ts` -- Auth UI: protected-route guard, full signup -> verify -> login
  through the forms, and a negative login

### API E2E Tests (in `tests/e2e/`)

- `admin/admin.test.ts` -- Admin API endpoints
- `auth/auth-flows.test.ts` -- Full auth lifecycle: signup, email verification, password reset, Firebase migration
- `auth/security.test.ts` -- Auth guards, CSRF, admin access control
- `notes/notes-crud.test.ts` -- Note CRUD operations
- `notes/notes-access.test.ts` -- Note access control

## Adding New Tests

### Browser spec

1. Create a `.spec.ts` file in `app/__e2e__/`
2. `import { test, expect } from '@playwright/test'`
3. Use the `browser` fixture with `authedPage` / `anonPage` from `./helpers/pw`
4. Use Playwright's web-first locator + `expect` API

### API test

1. Create a `.test.ts` file in `tests/e2e/`
2. Use the helpers in `tests/e2e/helpers/` (client, auth, db-seed)

## Troubleshooting

### Common Issues

1. **Tests fail with element not found**
   - Check your HTML structure / update selectors
   - `pnpm --filter web test:e2e:ui` to step through with the trace runner

2. **Application not running**
   - Ensure `pnpm dev` is running and the app is at `http://localhost:3000`
   - The API must be reachable at `http://localhost:3002` and connected to Postgres
