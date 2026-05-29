# LRDA Website - Core Rules

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:

- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:

- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

## Project Overview

This is the **Where's Religion?** desktop web application -- a TanStack Start project for documenting and mapping lived religion research. The app uses Google Maps for mapping and supports rich text editing with media uploads.

**Migration status:**

1. The web app has migrated (RERUM + Firebase -> Hono/Node.js + PostgreSQL + Better Auth on Lightsail)
2. During the transition:
   - RERUM sync scripts (`packages/api/src/scripts/sync-from-rerum.ts`, `sync-to-rerum.ts`) keep the mobile app's RERUM data in sync with the new PostgreSQL backend
   - Firebase user sync script (`packages/api/src/scripts/sync-users-from-firebase.ts`) syncs Firebase users into PostgreSQL
3. Once the mobile app is also migrated, the sync scripts and `firebase-admin` dependency can be removed

**Do not delete** the RERUM sync scripts (`packages/api/src/scripts/sync-*.ts`), Firebase sync script, or `firebase-admin` dependency -- they are all needed for the migration period.

## Architecture

### Monorepo Structure

```
lrda_website/
├── packages/
│   ├── api/                # PRIMARY API server (Hono + Drizzle + PostgreSQL)
│   │   ├── src/
│   │   │   ├── routes/     # API route handlers (notes.ts, users.ts, etc.)
│   │   │   ├── db/         # Drizzle schema and pg pool
│   │   │   └── middleware/  # Auth middleware
│   │   └── drizzle/        # Generated SQL migrations (not in src/)
│   └── web/                # TanStack Start application
│       ├── app/            # Components, hooks, stores, services
│       ├── src/            # TanStack Router routes
│       ├── components/     # shadcn/ui components
│       └── wrangler.jsonc  # Cloudflare Workers config
└── public/                 # Static assets
```

**Important**: Always use `pnpm --filter <package-name>` for package-scoped commands:

- `pnpm --filter @lrda/api dev` - Run API server in dev mode
- `pnpm --filter web dev` - Run web app in dev mode
- `pnpm --filter . <command>` - Run command in root package

## Tech Stack

### Frontend (Web Package)

- **Framework**: TanStack Start (Vite + TanStack Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **UI Components**:
  - shadcn/ui (Radix primitives) - **Primary UI library**
  - MUI (Material UI) - **Use sparingly, only for rich text editor**
- **State Management**: Zustand
- **Data Fetching**: TanStack React Query (@tanstack/react-query)
- **Icons**: Lucide React (primary), MUI icons (secondary)
- **Deployment**: Cloudflare Workers via TanStack Start

### Backend (`packages/api/`)

- **Runtime**: Node.js (@hono/node-server)
- **Server Framework**: Hono (with `@hono/zod-openapi`)
- **ORM**: Drizzle ORM (PostgreSQL dialect)
- **Database**: PostgreSQL 17
- **Authentication**: Better Auth (session-based with cookies)
- **API Documentation**: OpenAPI/Scalar
- **Deployment**: AWS Lightsail via Docker (blue/green with Nginx)

### Key Patterns

- **Module-level singletons**: `db` (pg pool) and `auth` are created once at startup, not per-request
- **Env**: Zod-validated `process.env` via `src/env.ts`
- **OpenAPIHono type erasure**: `openapi()` handlers erase `Env` generics; use `getDb(c)` and `getEnv(c)` helpers from `routes/helpers.ts`

## Coding Standards

### Critical Rules

1. **NO EMOJIS**: Do not use emojis in code, comments, documentation, or commit messages. This is a strict rule.
2. **Icons**: Use Lucide icons (`lucide-react`), MUI icons, or SVGs. Never use emojis as icons.
3. **TypeScript**: Use proper type annotations; avoid `any` when possible.
4. **Modern Syntax**: Prefer modern ES6+ syntax and features.
5. **Tests**: Only write tests when explicitly asked. Do not automatically generate tests.

### Import Guidelines

- Use the `@/` alias for imports from project root: `import { something } from '@/app/lib/utils'`
- Avoid deep relative paths like `../../../`
- Server-side imports can use relative paths within the server/package

## Component Patterns

### React Components

- Prefer functional components with hooks
- Use TypeScript interfaces for component props
- Follow TanStack Start conventions:
  - File-based routing in `src/routes/`
  - Use `createFileRoute` for route definitions
  - Use `createServerFn` for server-side data loading
  - Use `head()` on routes for SEO meta tags

### State Management

- **Global State**: Zustand stores in `app/lib/stores/`
- **Server State**: TanStack React Query for server data
- Keep Zustand stores focused and modular

## Code Quality

### Code Style

- Follow existing code formatting
- Use consistent naming conventions:
  - Components: PascalCase (`MyComponent.tsx`)
  - Utilities: camelCase (`myUtility.ts`)
  - Stores: camelCase (`myStore.ts`)
  - Constants: camelCase or UPPER_SNAKE_CASE
