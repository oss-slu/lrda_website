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

### 4. Run Tests

```bash
# Run all E2E tests (API + browser)
pnpm --filter web test:e2e

# Run only browser specs
pnpm --filter web test:e2e:browser

# Run only API tests
pnpm --filter web test:e2e:api

# Run browser specs with visible browser
pnpm --filter web test:e2e:headed
```

## Architecture

Tests use **Vitest as the runner** with the **Playwright** package for browser automation.
This is NOT `@playwright/test` -- Vitest manages the test lifecycle, Playwright handles
browser launching and page interaction.

- `helpers/pw.ts` -- shared browser launcher (lazy singleton, auto-closed on process exit)
- Each spec file creates isolated browser contexts via `newPage()` to prevent session leakage

## Test Structure

### Browser Specs (in `app/__e2e__/`)

- `authenticated.spec.ts` -- Authenticated flows: notes page, admin dashboard, nav state

### API E2E Tests (in `tests/e2e/`)

- `admin/admin.test.ts` -- Admin API endpoints
- `auth/auth-flows.test.ts` -- Full auth lifecycle: signup, email verification, password reset, Firebase migration
- `auth/security.test.ts` -- Auth guards, CSRF, admin access control
- `notes/notes-crud.test.ts` -- Note CRUD operations
- `notes/notes-access.test.ts` -- Note access control

## Adding New Tests

1. Create a `.spec.ts` file in `app/__e2e__/`
2. Import `newPage` and `url` from `./helpers/pw`
3. Use `beforeAll`/`afterAll` to manage page lifecycle
4. Use Playwright's locator API for element interaction

## Troubleshooting

### Common Issues

1. **Tests fail with element not found**
   - Check your HTML structure
   - Update selectors in test files
   - Use browser dev tools to verify elements

2. **Application not running**
   - Ensure `pnpm dev` is running
   - Check if app is accessible at `http://localhost:3000`
