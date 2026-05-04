# Quick Start

Get the full stack running locally in about 5 minutes.

## Prerequisites

- **Node.js** 24+ (recommend using [nvm](https://github.com/nvm-sh/nvm))
- **pnpm** 10+ (`npm i -g pnpm`)
- **Docker** (for PostgreSQL)
- **Git**

## 1. Clone and Install

```bash
git clone https://github.com/YOUR_USERNAME/lrda_website.git
cd lrda_website
pnpm install
```

## 2. Set Up Environment Variables

```bash
pnpm setup
```

This creates `packages/web/.env.local` and `packages/api/.env` with sensible defaults.

### Getting API Keys

- **Google Maps API Key**: Required for map features. Get one from [Google Cloud Console](https://console.cloud.google.com/apis/credentials). Add it to `packages/web/.env.local` as `VITE_MAP_KEY`.
- **BETTER_AUTH_SECRET**: Generate a random string (e.g., `openssl rand -base64 32`). Add it to `packages/api/.env`.

For full access to the development environment, contact the team lead.

## 3. Apply Database Migrations

```bash
pnpm api:db:migrate
```

This starts a PostgreSQL container via Docker and applies all Drizzle schema migrations.

## 4. Start Everything

```bash
pnpm dev
```

This single command starts:

- **API server** (Hono / Node.js) on [http://localhost:3002](http://localhost:3002)
- **Web frontend** (TanStack Start / Vite) on [http://localhost:3000](http://localhost:3000)

Open [http://localhost:3000](http://localhost:3000) -- the full stack is running.

> Use `Ctrl+C` to stop all services at once.

## 5. Seed the Database (Optional)

Populate the database with sample data:

```bash
pnpm api:db:seed
```

## Available Commands

| Command                | Description                             |
| ---------------------- | --------------------------------------- |
| `pnpm dev`             | Start API + frontend together           |
| `pnpm dev:api`         | Start API server only (port 3002)       |
| `pnpm dev:web`         | Start frontend only (port 3000)         |
| `pnpm dev:docs`        | Start docs site only (port 3001)        |
| `pnpm api:db:migrate`  | Apply database migrations               |
| `pnpm api:db:generate` | Generate migrations from schema changes |
| `pnpm api:db:seed`     | Seed database with sample data          |
| `pnpm setup`           | Create .env files from examples         |
| `pnpm test`            | Run unit and e2e tests                  |
| `pnpm lint`            | Run ESLint                              |

## Common Issues

### Port Already in Use

```bash
lsof -ti:3000 -ti:3002 | xargs kill -9
```

Or use the built-in script:

```bash
pnpm clear-ports
```

### Authentication Issues

1. Ensure the API server is running (`pnpm dev:api`)
2. Check that `VITE_API_URL` in `packages/web/.env.local` is `http://localhost:3002`
3. Clear browser cookies and try again

### Docker Issues

Make sure Docker is running before starting the dev server. The `pnpm dev` command automatically starts the PostgreSQL container, but Docker Desktop (or the Docker daemon) must be active.
