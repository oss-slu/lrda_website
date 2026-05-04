# Database

The application uses PostgreSQL 17 with [Drizzle ORM](https://orm.drizzle.team/) for type-safe database access and migration management.

## Local Setup

PostgreSQL runs in a Docker container for local development:

```bash
pnpm api:docker:up    # Start PostgreSQL container (port 5433)
pnpm api:docker:down  # Stop and remove container
```

The container is configured in `packages/api/docker-compose.yml`:
- **Port**: 5433 (mapped to 5432 inside the container)
- **Database**: `lrda_api`
- **User**: `lrda`

## Schema

The database schema is defined in `packages/api/src/db/schema.ts` using Drizzle's table builder API. This is the single source of truth for the database structure.

## Migrations

Drizzle generates SQL migration files from schema changes:

```bash
pnpm api:db:generate  # Generate migration from schema diff
pnpm api:db:migrate   # Apply pending migrations
pnpm api:db:push      # Push schema directly (dev only, no migration file)
pnpm api:db:studio    # Open Drizzle Studio (visual database browser)
```

Generated migrations live in `packages/api/drizzle/` and are committed to the repository.

## Seeding

Sample data can be loaded for development:

```bash
pnpm api:db:seed
```

## Configuration

The database connection is configured via the `DATABASE_URL` environment variable in `packages/api/.env`:

```ini
DATABASE_URL=postgresql://lrda:lrda_dev@localhost:5433/lrda_api
```

## Key Files

| File | Purpose |
| --- | --- |
| `packages/api/src/db/schema.ts` | Drizzle table definitions |
| `packages/api/src/db/index.ts` | Connection pool singleton |
| `packages/api/src/db/types.ts` | Inferred TypeScript types |
| `packages/api/drizzle.config.ts` | Drizzle Kit configuration |
| `packages/api/drizzle/` | Generated SQL migration files |
| `packages/api/docker-compose.yml` | Local PostgreSQL container |
