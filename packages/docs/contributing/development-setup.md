# Development Setup

Detailed environment setup for contributors.

## Prerequisites

- **Node.js** 24+ (recommend [nvm](https://github.com/nvm-sh/nvm))
- **pnpm** 10+ (`npm i -g pnpm`)
- **Docker** (for PostgreSQL)
- **Git**

## Environment Variables

### Web (`packages/web/.env.local`)

```ini
# API Server URL
VITE_API_URL=http://localhost:3002

# Google Maps (for map features)
VITE_MAP_KEY=your-google-maps-api-key
VITE_MAP_ID=your-google-maps-map-id
```

### API (`packages/api/.env`)

```ini
# Required
BETTER_AUTH_SECRET=your-secret-key-here
DATABASE_URL=postgresql://lrda:lrda_dev@localhost:5433/lrda_api

# Optional
ENVIRONMENT=development
PORT=3002
BETTER_AUTH_URL=http://localhost:3002
WEB_URL=http://localhost:3000
```

Run `pnpm setup` to create both files from the example templates.

### Getting API Keys

- **Google Maps API Key**: [Google Cloud Console](https://console.cloud.google.com/apis/credentials) -- enable the Maps JavaScript API
- **BETTER_AUTH_SECRET**: `openssl rand -base64 32`

For full access to the development environment, contact the team lead.

## Ports

| Service | Port |
| --- | --- |
| Web (Vite) | 3000 |
| Docs (VitePress) | 3001 |
| API (Hono) | 3002 |
| PostgreSQL | 5433 |

## Database

PostgreSQL runs in Docker. The container starts automatically with `pnpm dev`, or manually:

```bash
pnpm api:docker:up    # Start PostgreSQL
pnpm api:db:migrate   # Apply migrations
pnpm api:db:seed      # Load sample data (optional)
```

## Running Individual Packages

```bash
pnpm dev          # Everything (API + Web)
pnpm dev:api      # API server only
pnpm dev:web      # Web frontend only
pnpm dev:docs     # Documentation site only
```
