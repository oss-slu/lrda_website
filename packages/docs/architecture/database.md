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

The schema is defined in `packages/api/src/db/schema.ts` -- that file is the source of truth for table definitions and column types.

### Tables at a Glance

**Better Auth tables:** `user`, `session`, `account`, `verification` -- managed by Better Auth. The `user` table has custom fields added by the application (`isInstructor`, `instructorId`, `pendingInstructorDescription`).

**Content tables:** `note`, `media`, `audio`, `comment` -- the core application data. Notes have location, text, media attachments, and threaded comments.

**Sync/analytics:** `syncState`, `syncRun`, `syncRunDetail` (migration-period audit logging), `pageView` (privacy-first analytics, no PII).

### Relationships

```
user
  |-- has many -> session, account
  |-- has many -> note (via creatorId)
  |-- has many -> comment (via authorId)
  |-- belongs to -> user (via instructorId: student -> instructor)
  |-- has many -> user (instructor -> students)

note
  |-- belongs to -> user (via creatorId)
  |-- has many -> media, audio, comment

comment
  |-- belongs to -> note, user
  |-- belongs to -> comment (via parentId, threading)
  |-- has many -> comment (replies)
```

### Note Workflow States

Notes move through states based on three boolean flags:

| State | `isPublished` | `approvalRequested` | `isReturned` | Meaning |
| --- | --- | --- | --- | --- |
| Draft | false | false | false | Private, in progress |
| Pending | false | true | false | Submitted for instructor review |
| Returned | false | false | true | Instructor declined with feedback |
| Published | true | -- | -- | Publicly visible on the map |

**With an instructor assigned:** Students submit notes for approval. Instructors approve (published) or return with comments. Returned notes can be revised and resubmitted.

**Without an instructor:** Users can publish and unpublish directly.

### Rich Text Migration

The `note` table currently has two text columns:

- **`text`** -- HTML string. Currently used for rendering and editing.
- **`textJson`** -- ProseMirror/TipTap JSON. Target format.

The editor saves to both columns during the transition. The plan is to migrate fully to `textJson` once:

1. The existing note corpus has been audited (tag/attribute inventory)
2. A migration script with dry-run diffing has been built and tested
3. Server-side rendering of `textJson` is confirmed working on Cloudflare Workers

See `docs/rich-text-architecture.md` in the repository root for the full design proposal.

## Migrations

```bash
pnpm api:db:generate  # Generate migration from schema diff
pnpm api:db:migrate   # Apply pending migrations
pnpm api:db:push      # Push schema directly (dev only, no migration file)
pnpm api:db:studio    # Open Drizzle Studio (visual database browser)
```

Generated migrations live in `packages/api/drizzle/` and are committed to the repository.

### Creating a Migration

After changing `packages/api/src/db/schema.ts`:

1. Run `pnpm api:db:generate` -- compares your schema against the migration history and produces a new `.sql` file
2. Review the generated SQL
3. Run `pnpm api:db:migrate` to apply it

During rapid iteration, `pnpm api:db:push` pushes the schema directly without generating a migration file. Once the schema is stable, generate a proper migration with `db:generate`.

### Rolling Back Locally

Drizzle Kit doesn't have a built-in rollback. To reset locally:

```bash
pnpm api:docker:down   # removes container + volume (clean slate)
pnpm api:docker:up
pnpm api:db:migrate
pnpm api:db:seed       # re-seed if needed
```

Never edit migration files after they've been applied to a shared database -- create a new migration instead.

## Seeding

```bash
pnpm api:db:seed
```

Truncates all tables and populates them with fixture data (users, notes with media/audio, threaded comments). Uses a shared seed password for all test accounts. Safe to re-run.

## Sync Scripts

These scripts exist for the migration period while the mobile app still uses RERUM and Firebase. They are not needed for regular development.

**RERUM note sync:** `sync-from-rerum.ts` pulls notes from RERUM into PostgreSQL (incremental or full). `sync-to-rerum.ts` pushes web app changes back to RERUM for the mobile app. Both scripts are in `packages/api/src/scripts/`.

**Firebase user sync:** `sync-users-from-firebase.ts` pulls users from Firebase Auth/Firestore into PostgreSQL, resolving instructor relationships after all users are created.

**When can these be removed?** Once the mobile app is migrated to use the PostgreSQL backend directly, all three sync scripts, the `syncState`/`syncRun`/`syncRunDetail` tables, and the `firebase-admin` dependency can be removed.

## Key Files

| File | Purpose |
| --- | --- |
| `packages/api/src/db/schema.ts` | Drizzle table definitions (source of truth) |
| `packages/api/src/db/index.ts` | Connection pool singleton |
| `packages/api/drizzle.config.ts` | Drizzle Kit configuration |
| `packages/api/drizzle/` | Generated SQL migration files |
| `packages/api/docker-compose.yml` | Local PostgreSQL container |
