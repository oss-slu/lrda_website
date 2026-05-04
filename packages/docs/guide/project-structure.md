# Project Structure

The codebase is a pnpm monorepo with three packages under `packages/`.

## Directory Layout

```
lrda_website/
├── packages/
│   ├── api/                # Hono REST API (Node.js + PostgreSQL)
│   │   ├── src/
│   │   │   ├── routes/     # API route handlers (notes.ts, users.ts, etc.)
│   │   │   ├── db/         # Drizzle schema and pg pool
│   │   │   └── middleware/  # Auth middleware
│   │   └── drizzle/        # Generated SQL migrations
│   ├── web/                # TanStack Start application (React 19 + Vite)
│   │   ├── app/            # Components, hooks, stores, services
│   │   │   ├── lib/
│   │   │   │   ├── components/   # Custom components
│   │   │   │   ├── hooks/        # React hooks (queries/ for data fetching)
│   │   │   │   ├── stores/       # Zustand state stores
│   │   │   │   ├── services/     # API service layer
│   │   │   │   ├── auth/         # Better Auth client/server
│   │   │   │   └── utils/        # Utilities and constants
│   │   │   └── types.ts          # Central type definitions
│   │   ├── src/routes/     # TanStack Router file-based routes
│   │   └── components/ui/  # shadcn/ui components
│   ├── shared/             # Shared TypeScript types and Zod schemas
│   │   └── src/schemas/    # note.ts, user.ts, comment.ts, admin.ts
│   └── docs/               # This documentation site (VitePress)
├── docs/                   # Internal planning documents
├── infrastructure/         # AWS Lightsail deployment scripts
├── .github/workflows/      # CI/CD pipelines
├── package.json            # Root scripts and workspace config
└── pnpm-workspace.yaml     # Workspace package glob
```

## Packages

### `@lrda/api` -- Backend API

The primary REST API server built with [Hono](https://hono.dev/) and [Drizzle ORM](https://orm.drizzle.team/). Runs on Node.js, connects to PostgreSQL, and handles authentication via Better Auth.

- **Port**: 3002
- **Deployment**: AWS Lightsail via Docker (blue/green deploys)
- **Key patterns**: Module-level singletons for `db` and `auth`, Zod-validated env via `src/env.ts`, OpenAPI route definitions with `@hono/zod-openapi`

### `web` -- Frontend Application

A [TanStack Start](https://tanstack.com/start) application with file-based routing, server functions, and SSR. Uses React 19, Tailwind CSS, and shadcn/ui components.

- **Port**: 3000
- **Deployment**: Cloudflare Workers
- **Key patterns**: File-based routing in `src/routes/`, Zustand for global state, TanStack React Query for server data, Tiptap for rich text editing

### `@lrda/shared` -- Shared Types

TypeScript-only utility package containing Zod schemas and inferred types shared between the API and web packages. No runtime code.

- **Exports**: `@lrda/shared` (all types), `@lrda/shared/schemas` (all schemas), `@lrda/shared/schemas/*` (individual schema files)

### `@lrda/docs` -- Documentation

This VitePress documentation site.

- **Port**: 3001
- **Deployment**: GitHub Pages

## Package Dependencies

Both `web` and `api` depend on `@lrda/shared` using pnpm's workspace protocol:

```json
"@lrda/shared": "workspace:*"
```

This ensures they always reference the local version during development.

## Import Conventions

- Use the `@/` alias for imports from the package root: `import { something } from '@/app/lib/utils'`
- Avoid deep relative paths like `../../../`
- Server-side imports within a package can use relative paths
