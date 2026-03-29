# Authentication

The application uses [Better Auth](https://www.better-auth.com/) for session-based authentication with httpOnly cookies.

## Overview

Better Auth is a self-hosted authentication library. Sessions are stored server-side in PostgreSQL, and authentication state is transmitted via httpOnly cookies -- no JWTs, no client-side token storage.

## Architecture

- **Server**: Better Auth is initialized in the API package and exposes auth endpoints at `/api/auth/*`
- **Client**: The web package uses Better Auth's React client to manage login state, session checks, and sign-out
- **Middleware**: API routes are protected by auth middleware that validates the session cookie on each request

## User Roles

The application has three user roles:

| Role | Capabilities |
| --- | --- |
| **User** (default) | Create/edit own notes, publish directly or request approval |
| **Instructor** | All user capabilities + review student submissions on `/instructor-dashboard` |
| **Admin** | All instructor capabilities + user management on `/admin` |

## Configuration

### API (`packages/api/.env`)

```ini
BETTER_AUTH_SECRET=your-secret-key-here
BETTER_AUTH_URL=http://localhost:3002
```

Generate a secret with:
```bash
openssl rand -base64 32
```

### Web (`packages/web/.env.local`)

The web client connects to the API's auth endpoints via `VITE_API_URL`:

```ini
VITE_API_URL=http://localhost:3002
```

## Key Files

| File | Purpose |
| --- | --- |
| `packages/api/src/routes/auth.ts` | Better Auth server handler |
| `packages/api/src/middleware/auth.ts` | Session validation middleware |
| `packages/web/app/lib/auth/` | Client and server auth configuration |
