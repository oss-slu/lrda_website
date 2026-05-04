# Backend Architecture

The API package (`packages/api/`) is a [Hono](https://hono.dev/) REST API server running on Node.js with PostgreSQL via Drizzle ORM.

## Framework Stack

- **Hono**: Lightweight web framework with middleware support
- **`@hono/zod-openapi`**: OpenAPI route definitions with Zod validation
- **`@hono/node-server`**: Node.js HTTP adapter for Hono
- **Drizzle ORM**: Type-safe SQL with PostgreSQL dialect
- **Better Auth**: Session-based authentication

## API Structure

Routes are organized by resource in `src/routes/`:

```
src/
  index.ts            # App entry point, mounts routes
  env.ts              # Zod-validated environment variables
  routes/
    notes.ts          # /api/notes CRUD
    users.ts          # /api/users management
    comments.ts       # /api/comments threads
    admin.ts          # /api/admin endpoints
    auth.ts           # /api/auth (Better Auth handler)
    helpers.ts        # getDb(), getEnv() utilities
  middleware/
    auth.ts           # Session validation middleware
  db/
    index.ts          # PostgreSQL connection pool (singleton)
    schema.ts         # Drizzle table definitions
    types.ts          # Inferred TypeScript types
```

## Key Patterns

### OpenAPI-First Routes

Every route is defined with `@hono/zod-openapi`, which provides request/response validation and auto-generated OpenAPI documentation:

```typescript
const route = createRoute({
  method: 'get',
  path: '/api/notes',
  request: { query: GetNotesQuerySchema },
  responses: { 200: { content: { 'application/json': { schema: NotesResponseSchema } } } },
})
```

### Module-Level Singletons

The database pool and auth instance are created once at startup and shared across all requests:

```typescript
// db/index.ts
export const pool = new Pool({ connectionString: env.DATABASE_URL })
export const db = drizzle(pool, { schema })
```

### Type Erasure Workaround

`openapi()` handlers erase Hono's `Env` generics. Use `getDb(c)` and `getEnv(c)` helpers from `routes/helpers.ts` to access the database and environment within route handlers.

### Environment Validation

All environment variables are validated at startup with Zod in `src/env.ts`. Missing or invalid values cause an immediate, descriptive error.

## API Documentation

The API serves interactive documentation via [Scalar](https://scalar.com/) at the `/reference` endpoint when running locally.

## Deployment

The API deploys to **AWS Lightsail** via Docker with blue/green deploys. See [Deployment](/architecture/deployment) for details.
