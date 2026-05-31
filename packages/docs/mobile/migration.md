# Migration Status

The Where's Religion? platform is in the middle of a backend migration. The web app has completed the migration; the mobile app is next.

## Migration Overview

```
Before:  Web + Mobile  -->  RERUM API + Firebase Auth
                              |
After:   Web           -->  Hono API + PostgreSQL + Better Auth  (done)
         Mobile        -->  Hono API + PostgreSQL + Better Auth  (planned)
```

## Current State (as of Summer 2026)

| Component | Web | Mobile |
| --- | --- | --- |
| Authentication | Better Auth (complete) | Better Auth (merged, not yet in app stores) |
| Note API | Hono/PostgreSQL (complete) | RERUM (legacy, migration in progress) |
| Media storage | S3 Proxy via RERUM (migrating to own S3/R2) | S3 Proxy via RERUM |

The mobile app auth migration to Better Auth has been merged and tested, but the updated app has **not yet been deployed to the App Store or Google Play**. Yash currently owns the Apple Developer account, so coordination with him is necessary for mobile deployments.

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
