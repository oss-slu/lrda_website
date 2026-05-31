# Testing

The project uses Vitest for unit and integration tests and Playwright for end-to-end tests.

## Running Tests

```bash
pnpm test                    # All tests (unit + integration + e2e)
pnpm test:unit               # Unit tests only (Vitest)
pnpm test:integration        # API integration tests (HTTP against running server)
pnpm test:e2e                # Browser e2e tests (Playwright)
pnpm test:e2e:headed         # E2E with visible browser
pnpm test:e2e:install        # Install Playwright browsers
```

## Unit Tests (Vitest)

Unit tests live in `packages/web/src/__tests__/` with the `.test.ts` or `.test.tsx` extension.

```bash
pnpm test:unit
```

Use React Testing Library for component tests. Mock files are in `packages/web/__mocks__/`.

## Integration Tests (Vitest)

API integration tests live in `packages/web/tests/integration/` (`.test.ts`). These make HTTP requests against a running dev server.

## End-to-End Tests (Playwright)

Browser e2e specs live in `packages/web/tests/e2e/` (`.spec.ts`). Shared test helpers (db-seed, client, auth) live in `packages/web/tests/helpers/`.

E2e tests require the full stack running locally (API server + database + web frontend). Run `pnpm dev` first, then `pnpm test:e2e` in a separate terminal.

### Known gap: e2e tests are not run in CI

The Playwright e2e suite is currently **skipped in GitHub Actions CI**. Getting Playwright tests to run reliably with a real database and API server in GitHub Actions turned out to be tricky, so they are skipped for now. This means regressions in browser user flows are only caught by running e2e tests locally before merging. This is a known weakness that the next team should invest time in fixing.

## Test Policy

Tests are only written when explicitly requested. Do not automatically generate tests for new features unless asked.

When writing tests:
- Follow existing test patterns in the codebase
- Unit tests for logic and utilities
- Integration tests for API endpoints
- E2e tests for browser user flows
