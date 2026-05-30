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

## Test Policy

Tests are only written when explicitly requested. Do not automatically generate tests for new features unless asked.

When writing tests:
- Follow existing test patterns in the codebase
- Unit tests for logic and utilities
- Integration tests for API endpoints
- E2e tests for browser user flows
