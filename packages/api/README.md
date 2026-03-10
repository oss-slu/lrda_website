# LRDA API

REST API server for the Where's Religion? application, built with Hono, Drizzle ORM, and Cloudflare D1.

## Tech Stack

- **Runtime**: Cloudflare Workers
- **Framework**: Hono with OpenAPI/Zod validation
- **Database**: Cloudflare D1 (SQLite)
- **ORM**: Drizzle
- **Authentication**: better-auth (session-based)
- **Documentation**: Scalar API Reference

## Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Copy environment file
cp .env.example .env

# 3. Apply database migrations
pnpm db:migrate

# 4. Start dev server
pnpm dev
```

The API will be available at `http://localhost:8787` with docs at `http://localhost:8787/docs`.

## Environment Variables

Secrets are stored in `.env` (read automatically by wrangler). Non-secret vars are in `wrangler.jsonc`.

| Variable             | Description                    | Where            |
| -------------------- | ------------------------------ | ---------------- |
| `BETTER_AUTH_SECRET` | Auth secret key                | `.env` (secret)  |
| `RESEND_API_KEY`     | Email sending API key          | `.env` (secret)  |
| `GOOGLE_MAPS_API_KEY`| Geocoding API key              | `.env` (secret)  |
| `BETTER_AUTH_URL`    | Auth callback URL              | `wrangler.jsonc` |
| `CORS_ORIGINS`       | Allowed origins                | `wrangler.jsonc` |
| `WEB_URL`            | Frontend URL (for email links) | `wrangler.jsonc` |

## Scripts

### Development

| Command         | Description                              |
| --------------- | ---------------------------------------- |
| `pnpm dev`      | Start wrangler dev server (port 8787)    |
| `pnpm deploy`   | Deploy to Cloudflare (staging)           |
| `pnpm deploy:prod` | Deploy to Cloudflare (production)     |
| `pnpm test`     | Run tests in watch mode                  |
| `pnpm test:run` | Run tests once                           |

### Database

| Command            | Description                          |
| ------------------ | ------------------------------------ |
| `pnpm db:generate` | Generate migration files from schema |
| `pnpm db:migrate`  | Apply migrations to local D1         |
| `pnpm db:migrate:prod` | Apply migrations to production D1 |
| `pnpm db:studio`   | Open Drizzle Studio GUI              |

### Migration Sync Scripts

These scripts sync data from Firebase/RERUM to D1 during the migration period.

**Run order for initial sync:**

1. `pnpm sync:users:yolo` - Sync users from Firebase first
2. `pnpm sync:from-rerum:yolo --full` - Then sync notes/comments from RERUM

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

## Project Structure

```
packages/api/
├── src/
│   ├── __tests__/       # Test files
│   ├── db/
│   │   ├── index.ts     # D1 database factory
│   │   └── schema.ts    # Drizzle schema (SQLite)
│   ├── lib/
│   │   ├── email.ts     # Resend email helpers
│   │   └── geocode.ts   # Reverse geocoding
│   ├── middleware/
│   │   └── auth.ts      # Auth + DB middleware
│   ├── routes/
│   │   ├── admin.ts     # Admin routes
│   │   ├── comments.ts  # Comments CRUD
│   │   ├── health.ts    # Health check
│   │   ├── helpers.ts   # Route context helpers
│   │   ├── index.ts     # Route aggregator
│   │   ├── notes.ts     # Notes CRUD
│   │   └── users.ts     # User routes
│   ├── scripts/         # Migration sync scripts
│   ├── auth.ts          # better-auth config factory
│   ├── index.ts         # Worker entry point
│   └── types.ts         # Shared types
├── drizzle/             # Generated migrations
├── wrangler.jsonc       # Cloudflare Workers config
├── drizzle.config.ts    # Drizzle Kit config
└── package.json
```

## API Documentation

Interactive API documentation is available at `/docs` when the server is running. The OpenAPI spec is available at `/openapi.json`.
