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

Only three variables are required locally: `ENVIRONMENT`, `DATABASE_URL`, and `BETTER_AUTH_SECRET`. The `.env.example` file documents all available variables with descriptions -- `pnpm setup` copies it for you.

Generate a secret with: `openssl rand -base64 32`

The remaining variables are for optional features. The app runs without them -- features degrade gracefully (map won't render, emails print to console, AI tags aren't generated). See [External Services](#external-services) for setup instructions.

## External Services

Most services are managed under the project Google account (`lrda.adam.park@gmail.com`). Ask Adam Park or the team lead for access to any of these.

For local development, the app runs without any of these configured -- features degrade gracefully (map won't render, emails print to console, AI tags aren't generated).

### Google Maps

The project's Google Cloud project is under `lrda.adam.park@gmail.com`. Ask to be added as a project member to access the API keys.

Two separate API keys serve different purposes:

| Key | Package | Used for |
| --- | --- | --- |
| `VITE_MAP_KEY` | web | Client-side Maps JavaScript API (renders the map) |
| `VITE_MAP_ID` | web | Map styling via [Map IDs](https://developers.google.com/maps/documentation/get-map-id) |
| `GOOGLE_MAPS_API_KEY` | api | Server-side Geocoding API (reverse geocodes lat/lng to place names) |

The GCP project needs **Maps JavaScript API** and **Geocoding API** enabled, with separate keys restricted to each.

**Without these keys:** The map page won't render. Notes still save coordinates, but `locationName` (reverse-geocoded place name) will be empty.

### Resend (email delivery)

The Resend account is under `lrda.adam.park@gmail.com`, with the sending domain `wheresreligion.org` verified. Ask Adam for an API key if you need to test email flows locally.

**Without Resend:** The API logs verification and password-reset URLs to the console. Click them manually during development.

### OpenRouter (AI tag generation)

Used to auto-generate tags for notes. The production key has a $2 spend limit. For local development, you can create your own free account at [openrouter.ai](https://openrouter.ai) and set `OPENROUTER_API_KEY` in `packages/api/.env`.

**Without OpenRouter:** Tags can only be added manually. The AI tag button won't appear.

### Firebase and RERUM (migration period only)

These are only needed to run sync scripts during the migration period while the mobile app still uses RERUM/Firebase. Not needed for regular development. See [Database: Sync Scripts](/architecture/database#sync-scripts) for details.

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
