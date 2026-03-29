# Migration Status

The Where's Religion? platform is in the middle of a backend migration. The web app has completed the migration; the mobile app is next.

## Migration Overview

```
Before:  Web + Mobile  -->  RERUM API + Firebase Auth
                              |
After:   Web           -->  Hono API + PostgreSQL + Better Auth  (done)
         Mobile        -->  Hono API + PostgreSQL + Better Auth  (planned)
```

## Current State

| Component | Web | Mobile |
| --- | --- | --- |
| Authentication | Better Auth (complete) | Firebase Auth (legacy) |
| Note API | Hono/PostgreSQL (complete) | RERUM (legacy) |
| Media storage | TBD | S3 Proxy (legacy) |

## Sync Scripts

During the transition, sync scripts keep data consistent between the old and new backends:

| Script | Location | Purpose |
| --- | --- | --- |
| `sync-from-rerum.ts` | `packages/api/src/scripts/` | Pull notes from RERUM into PostgreSQL |
| `sync-to-rerum.ts` | `packages/api/src/scripts/` | Push notes from PostgreSQL back to RERUM |
| `sync-users-from-firebase.ts` | `packages/api/src/scripts/` | Sync Firebase users into PostgreSQL |

These scripts and the `firebase-admin` dependency in the API package must **not** be removed until the mobile app migration is complete.

## Mobile Migration Plans

Two migration plans exist in the mobile repo:

### Auth Migration (`MIGRATION_PLAN.md`)

Replace Firebase Auth with Better Auth via the website API:

- **Login**: `POST /api/auth/sign-in/email` instead of `firebase.auth().signInWithEmailAndPassword()`
- **Session**: Bearer token via `Authorization` header instead of Firebase ID tokens
- **Validation**: `GET /api/auth/get-session` instead of `onAuthStateChanged`
- **Logout**: `POST /api/auth/sign-out` instead of `firebase.auth().signOut()`

### API Migration (`RERUM_MIGRATION_PLAN.md`)

Replace RERUM API calls with the website Hono API using an adapter pattern:

- A mapping layer translates between the RERUM data format and the new API's format
- Screens remain unchanged -- only the API client layer is swapped
- Pagination, search, and filtering adapt to the new query parameters

## What Gets Removed After Migration

Once the mobile app is fully migrated:

1. RERUM sync scripts (`packages/api/src/scripts/sync-from-rerum.ts`, `sync-to-rerum.ts`)
2. Firebase user sync script (`packages/api/src/scripts/sync-users-from-firebase.ts`)
3. `firebase-admin` dependency from the API package
4. Any RERUM-specific data format handling in the API
