# Testing

The project uses Vitest for unit tests and Playwright for end-to-end tests.

## Running Tests

```bash
pnpm test           # All tests (unit + e2e)
pnpm test:unit      # Unit tests only (Vitest)
pnpm test:e2e       # End-to-end tests (Playwright)
pnpm test:e2e:headed  # E2E with visible browser
```

## Unit Tests (Vitest)

Unit tests live in `packages/web/app/__tests__/` with the `.test.ts` or `.test.tsx` extension.

```bash
pnpm test:unit
```

Use React Testing Library for component tests. Mock files are in `packages/web/app/__mocks__/` and `packages/web/__mocks__/`.

## End-to-End Tests (Playwright)

Browser e2e specs live in `packages/web/src/__e2e__/` (`.spec.ts`, Playwright).
API integration tests live in `packages/web/tests/integration/` (`.test.ts`, Vitest).

```bash
pnpm test:integration        # API integration tests (HTTP against running server)
pnpm test:e2e                # Browser e2e tests (Playwright)
pnpm test:e2e:headed         # Run with visible browser
pnpm test:e2e:install        # Install Playwright browsers
```

## Test Policy

Tests are only written when explicitly requested. Do not automatically generate tests for new features unless asked.

When writing tests:
- Follow existing test patterns in the codebase
- Unit tests for logic and utilities
- E2E tests for user flows and integration points
