---
alwaysApply: true
description: 'Core coding standards, architecture patterns, and conventions for LRDA Website monorepo'
---

# LRDA Website - Core Rules

## Project Overview

This is the **Where's Religion?** desktop web application - a Next.js project for documenting and mapping lived religion research. The app uses Google Maps for mapping and supports rich text editing with media uploads.

### Migration Context

This codebase has migrated off the legacy RERUM backend and Firebase Auth to a self-hosted stack: Hono API on Node.js with PostgreSQL and Better Auth, deployed to AWS Lightsail via Docker. There is a companion **mobile app** (`lrda_mobile`) that still uses RERUM and Firebase.

**Migration status:**
1. The web app has migrated (RERUM + Firebase -> Hono/Node.js + PostgreSQL + Better Auth on Lightsail)
2. During the transition:
   - RERUM sync scripts (`packages/api/src/scripts/sync-from-rerum.ts`, `sync-to-rerum.ts`) keep the mobile app's RERUM data in sync with the new PostgreSQL backend
   - Firebase user sync script (`packages/api/src/scripts/sync-users-from-firebase.ts`) syncs Firebase users into PostgreSQL
3. Once the mobile app is also migrated, the sync scripts and `firebase-admin` dependency can be removed

**Do not delete** the RERUM sync scripts (`packages/api/src/scripts/sync-*.ts`), Firebase sync script, or `firebase-admin` dependency -- they are all needed for the migration period.

### Packages

This is a **monorepo** containing:

- **API package** (`packages/api/`): **Primary REST API** -- Hono + Drizzle + PostgreSQL, deployed to AWS Lightsail via Docker (blue/green deploys). Port 3002 locally.
- **Web package** (`packages/web/`): TanStack Start application, deployed to Cloudflare Workers.

## Architecture

### Monorepo Structure

```
lrda_website/
├── packages/
│   ├── api/                # PRIMARY API server (Hono + Drizzle + D1)
│   │   ├── src/
│   │   │   ├── routes/     # API route handlers (notes.ts, users.ts, etc.)
│   │   │   ├── db/         # Drizzle schema and D1 db factory
│   │   │   └── middleware/  # Auth + DB middleware
│   │   ├── drizzle/        # Generated SQL migrations (not in src/)
│   │   └── wrangler.jsonc  # Cloudflare Workers config
│   └── web/                # Next.js App Router application
│       ├── app/            # Pages, components, hooks, stores
│       ├── components/     # shadcn/ui components
│       └── wrangler.jsonc  # Cloudflare Workers config (OpenNext)
└── public/                 # Static assets
```

### Package Management

- **Package Manager**: pnpm (v10.20.0)
- **Node Version**: >=24.0.0
- **Workspace**: pnpm workspaces with packages in `packages/`

**Important**: Always use `pnpm --filter <package-name>` for package-scoped commands:

- `pnpm --filter @lrda/api dev` - Run API server in dev mode
- `pnpm --filter web dev` - Run web app in dev mode
- `pnpm --filter . <command>` - Run command in root package

## Tech Stack

### Frontend (Web Package)

- **Framework**: Next.js 16+ (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **UI Components**:
  - shadcn/ui (Radix primitives) - **Primary UI library**
  - MUI (Material UI) - **Use sparingly, only for rich text editor**
- **Rich Text Editor**: Tiptap with mui-tiptap
- **State Management**: Zustand
- **Data Fetching**: TanStack React Query (@tanstack/react-query)
- **Maps**: Google Maps API (@react-google-maps/api)
- **Icons**: Lucide React (primary), MUI icons (secondary)
- **Deployment**: Cloudflare Workers via `@opennextjs/cloudflare`

### Backend (`packages/api/`)

- **Runtime**: Cloudflare Workers
- **Server Framework**: Hono (with `@hono/zod-openapi`)
- **ORM**: Drizzle ORM (SQLite dialect)
- **Database**: Cloudflare D1 (SQLite)
- **Authentication**: Better Auth (session-based with cookies)
- **API Documentation**: OpenAPI/Scalar

### Key Patterns (Workers)

- **Per-request DB**: `createDb(c.env.DB)` in `dbMiddleware` -- no module-level singleton
- **Per-request Auth**: `createAuth(c.env, db)` in middleware and auth handlers
- **OpenAPIHono type erasure**: `openapi()` handlers erase `Env` generics; use `getDb(c)` and `getEnv(c)` helpers from `routes/helpers.ts`
- **Env bindings**: Typed via `worker-configuration.d.ts` global `Env` interface

### Testing

- **Unit Tests**: Jest
- **E2E Tests**: Playwright
- **Test Location**: `app/__tests__/` (unit), `app/__e2e__/` (e2e)

## Coding Standards

### Critical Rules

1. **NO EMOJIS**: Do not use emojis in code, comments, documentation, or commit messages. This is a strict rule.
2. **Icons**: Use Lucide icons (`lucide-react`), MUI icons, or SVGs. Never use emojis as icons.
3. **TypeScript**: Use proper type annotations; avoid `any` when possible.
4. **Modern Syntax**: Prefer modern ES6+ syntax and features.
5. **Tests**: Only write tests when explicitly asked. Do not automatically generate tests.

### File Organization

- **Components**: `app/lib/components/` (custom), `components/ui/` (shadcn/ui)
- **Utilities and Constants**: `app/lib/utils/`
- **Types**: `app/types.ts` (central type definitions including media types)
- **Zustand Stores**: `app/lib/stores/`
- **Hooks**: `app/lib/hooks/` (query hooks in `hooks/queries/`)
- **Services**: `app/lib/services/` (flat structure -- `notes.service.ts`, `comments.types.ts`, etc.)
- **Auth**: `app/lib/auth/` (Better Auth client/server)
- **API Routes**: `packages/api/src/routes/`
- **API DB Schema**: `packages/api/src/db/schema.ts`

### Import Guidelines

- Use the `@/` alias for imports from project root: `import { something } from '@/app/lib/utils'`
- Avoid deep relative paths like `../../../`
- Prefer absolute imports using `@/` alias
- Server-side imports can use relative paths within the server/package

### Code Organization Principles

- Keep files small, focused, and modular
- Avoid large monolithic files
- Split functionality into logically grouped modules
- Each file should handle one coherent responsibility

## Component Patterns

### React Components

- Prefer functional components with hooks
- Use TypeScript interfaces for component props
- Follow Next.js App Router conventions:
  - Server Components by default
  - Use `'use client'` directive only when needed (hooks, event handlers, browser APIs)
  - Route handlers in `app/api/`

### UI Components

- **Primary**: Use shadcn/ui components from `@/components/ui/`
- **Secondary**: Use MUI components only for rich text editor integration
- Customize shadcn/ui components with Tailwind classes
- Component composition over prop drilling

### State Management

- **Global State**: Zustand stores in `app/lib/stores/`
- **Server State**: TanStack React Query for server data
- **Local State**: React `useState` for component-specific state
- Keep Zustand stores focused and modular

### Example Component Structure

```typescript
"use client"; // Only if needed

import { Button } from "@/components/ui/button";
import { useStore } from "@/app/lib/stores/exampleStore";
import { LucideIcon } from "lucide-react";

interface ExampleProps {
  title: string;
  onAction: () => void;
}

export function ExampleComponent({ title, onAction }: ExampleProps) {
  const { state } = useStore();

  return (
    <div className="container">
      <Button onClick={onAction}>{title}</Button>
    </div>
  );
}
```

## Styling Guidelines

### Tailwind CSS

- Use Tailwind CSS for all styling
- Avoid inline styles
- Follow the project color palette: **blues and whites**
- Maintain consistent spacing and responsive design patterns
- Use Tailwind utility classes; customize in `tailwind.config.ts` if needed

### Responsive Design

- Mobile-first approach
- Use Tailwind breakpoints: `sm:`, `md:`, `lg:`, `xl:`, `2xl:`
- Test responsive layouts

## Development Workflow

### Common Commands

```bash
# Install dependencies
pnpm install

# Development
pnpm dev                              # Start API + web together
pnpm dev:api                          # API server only (wrangler dev, port 8787)
pnpm dev:web                          # Web app only (Next.js, port 3000)

# Database
pnpm api:db:migrate                   # Apply D1 migrations locally
pnpm api:db:generate                  # Generate migrations from schema changes

# Testing
pnpm test                             # Run all tests
pnpm test:unit                        # Jest unit tests
pnpm test:e2e                         # Playwright e2e tests

# Building
pnpm build                            # Build Next.js app

# Linting
pnpm lint                             # ESLint
pnpm lint:fix                         # ESLint with auto-fix
```

### Running Full Stack

1. Apply migrations: `pnpm api:db:migrate`
2. Start everything: `pnpm dev`

## Testing Guidelines

### Policy

- **Only write tests when explicitly requested**
- Do not automatically generate tests without being asked
- When writing tests:
  - Unit tests: `app/__tests__/` using Jest
  - E2E tests: `app/__e2e__/` using Playwright
  - Use React Testing Library for component tests

### Test Structure

- Unit tests: `.test.tsx` or `.test.ts` files
- E2E tests: `.spec.ts` files in `app/__e2e__/`
- Mock files: `app/__mocks__/` and `__mocks__/`

## Code Quality

### TypeScript

- Strict mode enabled
- Avoid `any` type
- Use proper type annotations
- Define interfaces for props and data structures
- Use type inference where appropriate

### Code Style

- Follow existing code formatting
- Use consistent naming conventions:
  - Components: PascalCase (`MyComponent.tsx`)
  - Utilities: camelCase (`myUtility.ts`)
  - Stores: camelCase (`myStore.ts`)
  - Constants: camelCase or UPPER_SNAKE_CASE

### Guardrails

- Do not commit build artifacts (`.next`, `dist`, `coverage`)
- Match existing formatting and TypeScript settings
- Avoid changing Node/TS configs unless necessary
- Use pnpm workspaces; prefer `--filter` for package-scoped commands
