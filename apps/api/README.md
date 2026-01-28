# LRDA API

REST API server for the Where's Religion? application, built with Hono, Drizzle ORM, and PostgreSQL.

## Tech Stack

- **Runtime**: Bun
- **Framework**: Hono with OpenAPI/Zod validation
- **Database**: PostgreSQL 17
- **ORM**: Drizzle
- **Authentication**: better-auth (session-based)
- **Documentation**: Scalar API Reference

## Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Start PostgreSQL
pnpm docker:up

# 3. Copy environment file
cp .env.example .env

# 4. Push database schema
pnpm db:push

# 5. Start dev server
pnpm dev
```

The API will be available at `http://localhost:3002` with docs at `http://localhost:3002/docs`.

## Environment Variables

| Variable             | Description                       | Default                 |
| -------------------- | --------------------------------- | ----------------------- |
| `NODE_ENV`           | Environment mode                  | `development`           |
| `PORT`               | Server port                       | `3002`                  |
| `DATABASE_URL`       | PostgreSQL connection string      | Required                |
| `BETTER_AUTH_SECRET` | Auth secret key                   | Required                |
| `BETTER_AUTH_URL`    | Auth callback URL                 | `http://localhost:3002` |
| `CORS_ORIGINS`       | Allowed origins (comma-separated) | `*` in dev              |
| `RERUM_API_URL`      | RERUM API URL for sync scripts    | Optional                |
| `LOG_LEVEL`          | Pino log level                    | `debug`                 |

## Scripts

### Development

| Command         | Description                      |
| --------------- | -------------------------------- |
| `pnpm dev`      | Start dev server with hot reload |
| `pnpm build`    | Build for production             |
| `pnpm start`    | Run production build             |
| `pnpm test`     | Run tests in watch mode          |
| `pnpm test:run` | Run tests once                   |

### Database

| Command            | Description                |
| ------------------ | -------------------------- |
| `pnpm docker:up`   | Start PostgreSQL container |
| `pnpm docker:down` | Stop PostgreSQL container  |
| `pnpm db:generate` | Generate migration files   |
| `pnpm db:migrate`  | Run migrations             |
| `pnpm db:push`     | Push schema directly (dev) |
| `pnpm db:studio`   | Open Drizzle Studio GUI    |

### Migration Sync Scripts

These scripts sync data from Firebase/RERUM to PostgreSQL during the migration period.

**Run order for initial sync:**

1. `pnpm sync:users:yolo` - Sync users from Firebase first
2. `pnpm sync:from-rerum:yolo --full` - Then sync notes/comments from RERUM

| Command                      | Description                               |
| ---------------------------- | ----------------------------------------- |
| `pnpm sync:users`            | Dry-run: preview Firebase users sync      |
| `pnpm sync:users:yolo`       | Actually sync users from Firebase         |
| `pnpm sync:from-rerum`       | Dry-run: preview RERUM to PostgreSQL sync |
| `pnpm sync:from-rerum:yolo`  | Actually sync from RERUM to PostgreSQL    |
| `pnpm sync:from-rerum:full`  | Full re-sync (ignore last sync time)      |
| `pnpm sync:from-rerum:watch` | Continuous sync every 30s                 |
| `pnpm sync:to-rerum`         | Dry-run: preview PostgreSQL to RERUM sync |
| `pnpm sync:to-rerum:yolo`    | Actually sync from PostgreSQL to RERUM    |
| `pnpm sync:to-rerum:watch`   | Continuous reverse sync every 30s         |
| `pnpm sync:bidirectional`    | Run both sync directions continuously     |

## API Endpoints

### Health

| Method | Path          | Description                       |
| ------ | ------------- | --------------------------------- |
| `GET`  | `/api/health` | Health check with database status |

### Authentication (better-auth)

| Method | Path                      | Description                  |
| ------ | ------------------------- | ---------------------------- |
| `POST` | `/api/auth/sign-up/email` | Register with email/password |
| `POST` | `/api/auth/sign-in/email` | Sign in with email/password  |
| `POST` | `/api/auth/sign-out`      | Sign out                     |
| `GET`  | `/api/auth/session`       | Get current session          |

### Users

| Method  | Path                                       | Description          | Auth     |
| ------- | ------------------------------------------ | -------------------- | -------- |
| `GET`   | `/api/users/me`                            | Get current user     | Required |
| `PATCH` | `/api/users/me`                            | Update current user  | Required |
| `GET`   | `/api/users/:id`                           | Get user by ID       | -        |
| `GET`   | `/api/users/instructors`                   | List all instructors | -        |
| `POST`  | `/api/users/join-instructor/:instructorId` | Join an instructor   | Required |

### Notes

| Method   | Path                                | Description               | Auth        |
| -------- | ----------------------------------- | ------------------------- | ----------- |
| `GET`    | `/api/notes`                        | List notes (with filters) | -           |
| `GET`    | `/api/notes/:id`                    | Get note by ID            | -           |
| `POST`   | `/api/notes`                        | Create note               | Required    |
| `PATCH`  | `/api/notes/:id`                    | Update note               | Owner/Admin |
| `DELETE` | `/api/notes/:id`                    | Delete note               | Owner/Admin |
| `GET`    | `/api/notes/students/:instructorId` | Get student notes         | Instructor  |

**Query Parameters for `GET /api/notes`:**

- `published` - Filter by published status
- `creatorId` - Filter by creator
- `minLat`, `maxLat`, `minLng`, `maxLng` - Geo bounds
- `limit`, `offset` - Pagination

### Comments

| Method   | Path                                     | Description           | Auth       |
| -------- | ---------------------------------------- | --------------------- | ---------- |
| `GET`    | `/api/comments/note/:noteId`             | Get comments for note | -          |
| `POST`   | `/api/comments`                          | Create comment        | Required   |
| `PATCH`  | `/api/comments/:id`                      | Update comment        | Author     |
| `DELETE` | `/api/comments/:id`                      | Delete comment        | Author     |
| `POST`   | `/api/comments/thread/:threadId/resolve` | Resolve thread        | Note Owner |

### Admin

| Method  | Path                         | Description      | Auth  |
| ------- | ---------------------------- | ---------------- | ----- |
| `GET`   | `/api/admin/users`           | List all users   | Admin |
| `PATCH` | `/api/admin/users/:id/role`  | Update user role | Admin |
| `POST`  | `/api/admin/users/:id/ban`   | Ban user         | Admin |
| `POST`  | `/api/admin/users/:id/unban` | Unban user       | Admin |

## Database Schema

```
user
  - id, name, email, emailVerified, image
  - role, banned, banReason, banExpires
  - isInstructor, instructorId, pendingInstructorDescription

session
  - id, token, expiresAt, userId, ipAddress, userAgent

account
  - id, accountId, providerId, userId, accessToken, refreshToken

note
  - id, title, text, creatorId
  - latitude, longitude
  - isPublished, approvalRequested
  - tags (jsonb), time, createdAt, updatedAt

media
  - id, noteId, type, uri, thumbnailUri, uuid

audio
  - id, noteId, uri, name, duration, uuid

comment
  - id, noteId, authorId, authorName, text
  - position (jsonb), threadId, parentId, isResolved
```

## Project Structure

```
apps/api/
├── src/
│   ├── __tests__/       # Test files
│   ├── db/
│   │   ├── index.ts     # Database connection
│   │   ├── schema.ts    # Drizzle schema
│   │   └── types.ts     # TypeScript types
│   ├── lib/
│   │   └── logger.ts    # Pino logger
│   ├── middleware/
│   │   └── auth.ts      # Auth middleware
│   ├── routes/
│   │   ├── admin.ts     # Admin routes
│   │   ├── comments.ts  # Comments CRUD
│   │   ├── health.ts    # Health check
│   │   ├── index.ts     # Route aggregator
│   │   ├── notes.ts     # Notes CRUD
│   │   └── users.ts     # User routes
│   ├── scripts/
│   │   ├── sync-from-rerum.ts  # RERUM -> PostgreSQL
│   │   └── sync-to-rerum.ts    # PostgreSQL -> RERUM
│   ├── auth.ts          # better-auth config
│   ├── env.ts           # Environment validation
│   ├── index.ts         # App entry point
│   └── types.ts         # Shared types
├── drizzle/             # Generated migrations
├── docker-compose.yml   # PostgreSQL container
├── drizzle.config.ts    # Drizzle Kit config
└── package.json
```

## Testing

```bash
# Run all tests
pnpm test

# Run once (CI)
pnpm test:run

# Run specific test file
pnpm test src/__tests__/health.test.ts
```

## API Documentation

Interactive API documentation is available at `/docs` when the server is running. The OpenAPI spec is available at `/openapi.json`.
