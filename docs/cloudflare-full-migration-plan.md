# Full Cloudflare Migration Plan

Migrate everything off AWS EC2 onto Cloudflare: API on Workers, database on D1, storage on R2, frontend on Workers via OpenNext.

**Branch**: `cloudflare-migration` (based on `301-improve-admin`)

---

## Architecture

```
                         Cloudflare Edge
                         +------------------------------------------+
  Browser ---HTTPS--->   |  DNS + SSL termination (automatic)       |
                         |                                          |
                         |  wheresreligion.org -------> Worker       |  (Next.js via OpenNext)
                         |  api.wheresreligion.org ---> Worker       |  (Hono API)
                         |                                |         |
                         |                           D1 (SQLite)    |
                         |                           R2 (media)     |
                         +------------------------------------------+
```

No EC2, no Nginx, no PM2, no PostgreSQL, no security groups. Just Workers + D1 + R2.

---

## Current vs Target

| Component       | Current (301-improve-admin)  | Target (this branch)                              |
| --------------- | ---------------------------- | ------------------------------------------------- |
| API runtime     | Bun on EC2                   | Cloudflare Workers                                |
| API framework   | Hono                         | Hono (unchanged -- native Workers support)        |
| Database        | PostgreSQL on EC2            | Cloudflare D1 (SQLite)                            |
| ORM             | Drizzle (pg dialect)         | Drizzle (sqlite dialect)                          |
| Auth            | Better Auth (pg adapter)     | Better Auth (sqlite adapter)                      |
| Media storage   | S3 via RERUM proxy           | Cloudflare R2                                     |
| Frontend        | Next.js on Netlify           | Next.js on Workers (OpenNext)                     |
| SSL             | Cloudflare Origin CA + Nginx | Automatic (Workers handle SSL)                    |
| Process manager | PM2                          | None needed (serverless)                          |
| Reverse proxy   | Nginx                        | None needed (Workers handle routing)              |
| Deploy          | SSH + deploy.sh              | `wrangler deploy`                                 |
| DB backups      | pg_dump cron                 | D1 automatic + Time Travel (30-day point-in-time) |
| Infrastructure  | Terraform (AWS + Cloudflare) | Terraform (Cloudflare only) + wrangler            |

---

## Cost

| Resource         | Free Tier                     | Paid ($5/mo Workers plan)        |
| ---------------- | ----------------------------- | -------------------------------- |
| Workers requests | 100K/day                      | 10M/month                        |
| Workers CPU time | 10ms/req                      | 30s/req                          |
| D1 storage       | 5 GB                          | 10 GB (then $0.75/GB)            |
| D1 reads         | 5M/day                        | 25B/month                        |
| D1 writes        | 100K/day                      | 50M/month                        |
| R2 storage       | 10 GB                         | $0.015/GB/month                  |
| R2 operations    | 1M Class A, 10M Class B/month | $4.50/M Class A, $0.36/M Class B |

For ~500 users and ~10K notes, free tier covers everything. Even with growth, the $5/mo paid plan is far cheaper than the ~$15/mo t3.small EC2.

---

## Phase 1: API to Workers + D1

Convert the Hono API from a Bun server with PostgreSQL to a Cloudflare Worker with D1.

### 1.1 Schema conversion (pg -> sqlite)

**File: `packages/api/src/db/schema.ts`**

| Change            | From                          | To                                                                  |
| ----------------- | ----------------------------- | ------------------------------------------------------------------- |
| Import            | `drizzle-orm/pg-core`         | `drizzle-orm/sqlite-core`                                           |
| Table builder     | `pgTable`                     | `sqliteTable`                                                       |
| `timestamp`       | `timestamp('x').defaultNow()` | `integer('x', { mode: 'timestamp' }).default(sql\`(unixepoch())\`)` |
| `doublePrecision` | `doublePrecision('x')`        | `real('x')`                                                         |
| `jsonb`           | `jsonb('x')`                  | `text('x', { mode: 'json' })`                                       |
| `boolean`         | `boolean('x')`                | `integer('x', { mode: 'boolean' })`                                 |
| `uuid` (import)   | Remove unused import          | --                                                                  |
| `AnyPgColumn`     | `type AnyPgColumn`            | `type AnySQLiteColumn`                                              |

No changes needed for: `text`, `relations`, `$defaultFn(() => crypto.randomUUID())`, foreign keys with `onDelete`.

### 1.2 Database connection

**File: `packages/api/src/db/index.ts`**

Replace:

```typescript
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
const pool = new Pool({ connectionString: env.DATABASE_URL, max: 20 });
export const db = drizzle(pool, { schema });
```

With:

```typescript
import { drizzle } from 'drizzle-orm/d1';
export function createDb(d1: D1Database) {
  return drizzle(d1, { schema });
}
export type Database = ReturnType<typeof createDb>;
```

The `db` instance is no longer a module-level singleton -- it's created per-request from the D1 binding. This is the standard Workers pattern.

Remove: `testConnection()`, `closePool()` -- not applicable to D1.

### 1.3 Better Auth adapter

**File: `packages/api/src/auth.ts`**

Change `provider: 'pg'` to `provider: 'sqlite'`. Auth also needs the D1-backed db instance, so it becomes a factory:

```typescript
export function createAuth(db: Database) {
  return betterAuth({
    database: drizzleAdapter(db, { provider: 'sqlite' }),
    // ... rest unchanged
  });
}
```

### 1.4 Entry point (Bun -> Workers)

**File: `packages/api/src/index.ts`**

Replace `Bun.serve()` with a Workers fetch handler:

```typescript
import { createDb } from './db';
import { createAuth } from './auth';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const db = createDb(env.DB);
    const auth = createAuth(db);
    // Build app with db + auth, handle request
    return app.fetch(request, env, ctx);
  },
};
```

Remove: graceful shutdown handlers (`SIGTERM`, `SIGINT`), `shutdown-state.ts`, `closePool()` call.

The main refactor here is threading `db` and `auth` through the app. Options:

- **Option A**: Use Hono's `env()` helper -- `c.env.DB` gives the D1 binding, create db per-request in middleware.
- **Option B**: Create db/auth in the fetch handler and pass via Hono context variables.

Option A is idiomatic for Hono on Workers.

### 1.5 Env handling

**File: `packages/api/src/env.ts`**

On Workers, env vars come from `wrangler.toml` `[vars]` and secrets (set via `wrangler secret put`), not `process.env`. Hono provides `c.env` to access them.

Remove `DATABASE_URL` (replaced by D1 binding). Keep all other vars but access them via `c.env` instead of `process.env`.

### 1.6 Route adjustments

**All route files in `packages/api/src/routes/`**

Minimal changes. The routes use Drizzle ORM (not raw SQL), which abstracts the database dialect. Two things to check:

- `ilike()` in `notes.ts` search -- SQLite `LIKE` is already case-insensitive for ASCII. Replace `ilike()` with `like()`.
- `.returning()` on insert/update -- supported by D1 via Drizzle.

Routes need access to the `db` instance from context instead of importing it directly. This means either:

- Passing `db` through Hono context (set in middleware, read in routes)
- Or using a factory pattern for the router

### 1.7 Health check

**File: `packages/api/src/routes/health.ts`**

Replace PostgreSQL `SELECT 1` probe with a D1 equivalent:

```typescript
await db.run(sql`SELECT 1`);
```

Remove `isShuttingDown()` check (no shutdown state in Workers).

### 1.8 Wrangler config

**New file: `packages/api/wrangler.toml`**

```toml
name = "lrda-api"
main = "src/index.ts"
compatibility_date = "2025-04-01"
compatibility_flags = ["nodejs_compat"]

[[d1_databases]]
binding = "DB"
database_name = "lrda-db"
database_id = "<from wrangler d1 create>"

[[r2_buckets]]
binding = "MEDIA_BUCKET"
bucket_name = "lrda-media"

[vars]
ENVIRONMENT = "staging"
BETTER_AUTH_URL = "https://api-staging.wheresreligion.org"
CORS_ORIGINS = "https://wheresreligion.org"
WEB_URL = "https://wheresreligion.org"
EMAIL_FROM = "noreply@wheresreligion.org"

# Secrets (set via `wrangler secret put`):
# BETTER_AUTH_SECRET
# RESEND_API_KEY
# GOOGLE_MAPS_API_KEY (optional)
```

### 1.9 Drizzle config

**File: `packages/api/drizzle.config.ts`**

```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'sqlite',
});
```

Migrations are applied to D1 via `wrangler d1 migrations apply`.

### 1.10 Dependencies

**File: `packages/api/package.json`**

| Remove                                                  | Add                         |
| ------------------------------------------------------- | --------------------------- |
| `pg`                                                    | `@cloudflare/workers-types` |
| `drizzle-orm/node-postgres` (import only)               | --                          |
| `bun-types`                                             | --                          |
| `pino` / `pino-pretty` (use console or Workers logging) | --                          |

Build script changes from `bun build` to `wrangler deploy` (wrangler handles bundling).

### 1.11 Migrations

Delete existing PostgreSQL migrations in `packages/api/src/db/migrations/`. Run `drizzle-kit generate` to create fresh SQLite migrations. Apply with:

```bash
wrangler d1 migrations apply lrda-db --local   # local dev
wrangler d1 migrations apply lrda-db --remote  # production
```

### 1.12 Local development

For local dev, wrangler provides a local D1 (backed by SQLite on disk):

```bash
cd packages/api
wrangler dev   # starts local Workers runtime with D1, R2, etc.
```

This replaces `docker-compose up` (PostgreSQL) + `bun run dev`.

Remove or deprecate `docker-compose.yml`.

---

## Phase 2: Media Storage to R2

### 2.1 R2 bucket

Create via wrangler:

```bash
wrangler r2 bucket create lrda-media
```

Already bound in `wrangler.toml` as `MEDIA_BUCKET`.

### 2.2 Upload endpoint

Add a new route (or modify existing flow) for direct uploads from the web app to R2:

```typescript
// packages/api/src/routes/media.ts
app.post('/api/media/upload', requireAuth, async c => {
  const formData = await c.req.formData();
  const file = formData.get('file') as File;
  const key = `${crypto.randomUUID()}-${file.name}`;
  await c.env.MEDIA_BUCKET.put(key, file.stream(), {
    httpMetadata: { contentType: file.type },
  });
  const url = `https://media.wheresreligion.org/${key}`;
  return c.json({ url }, 201);
});
```

### 2.3 Serving media

Option A: R2 custom domain (`media.wheresreligion.org` -> R2 bucket)
Option B: Serve through the API Worker using `MEDIA_BUCKET.get(key)`

R2 custom domains are simpler and offload serving from the Worker.

### 2.4 Web app changes

**File: `packages/web/app/lib/utils/s3_proxy.ts`**

Update `NEXT_PUBLIC_S3_PROXY_PREFIX` to point to the new upload endpoint (or R2 custom domain). The `uploadMedia()` and `uploadAudio()` functions already use `FormData` + `fetch` -- just change the URL.

### 2.5 Data migration

Existing media is on `livedreligion.s3.amazonaws.com` (via RERUM proxy). Migration options:

- **Lazy**: Keep old URLs working, new uploads go to R2. Old S3 URLs remain valid.
- **Full**: Write a one-time script to copy all media from S3 to R2, update URIs in D1.

Lazy migration is recommended to start. Old media URLs still resolve. New media goes to R2.

---

## Phase 3: Frontend to Workers (OpenNext)

### 3.1 Dependencies

```bash
pnpm --filter web add @opennextjs/cloudflare@latest
pnpm --filter web add -D wrangler@latest
pnpm --filter web remove @netlify/plugin-nextjs  # if present as dep
```

### 3.2 New files

**`packages/web/wrangler.jsonc`**

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "main": ".open-next/worker.js",
  "name": "lrda-web",
  "compatibility_date": "2025-04-01",
  "compatibility_flags": ["nodejs_compat"],
  "assets": {
    "binding": "ASSETS",
    "directory": ".open-next/assets",
  },
}
```

**`packages/web/open-next.config.ts`**

```typescript
import { defineCloudflareConfig } from '@opennextjs/cloudflare';
export default defineCloudflareConfig();
```

### 3.3 Package.json scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "preview": "opennextjs-cloudflare build && opennextjs-cloudflare preview",
    "deploy": "opennextjs-cloudflare build && opennextjs-cloudflare deploy"
  }
}
```

### 3.4 Gitignore

Add `.open-next/` to `.gitignore`.

### 3.5 Remove Netlify

Delete `netlify.toml` (root) and `packages/web/netlify.toml`.

### 3.6 Environment variables

Set in Cloudflare dashboard or `wrangler.jsonc` `[vars]`:

- `NEXT_PUBLIC_API_URL` -- points to the API Worker URL
- `NEXT_PUBLIC_MAP_KEY`, `NEXT_PUBLIC_MAP_ID`, `NEXT_PUBLIC_PLACES_KEY`
- `NEXT_PUBLIC_S3_PROXY_PREFIX` -- points to R2 or media upload endpoint
- `OPENAI_API_KEY` (secret, for `/api/tags` route)

### 3.7 Remove `sharp`

The `sharp` dependency in `packages/web/package.json` is unused (zero imports) and would cause issues on Workers. Remove it.

### 3.8 Verify `next/headers` compatibility

`packages/web/app/lib/auth/server.ts` uses `cookies()` from `next/headers`. This should work with `@opennextjs/cloudflare` but needs testing. If issues arise, the auth flow can fall back to passing cookies via fetch headers.

---

## Phase 4: Sync Scripts (RERUM + Firebase)

These scripts must keep running during the migration period. They currently use `pg` + `drizzle-orm/node-postgres` to talk to PostgreSQL.

### Options

**Option A: Workers Cron Triggers (recommended)**

Deploy sync scripts as a separate Worker with Cron Triggers:

```toml
# packages/api/wrangler-cron.toml (or same worker, separate cron handler)
[triggers]
crons = ["*/15 * * * *"]  # every 15 minutes
```

The scheduled handler runs the sync logic against D1. This requires converting the scripts from pg to D1 (same changes as Phase 1).

**Concern**: Firebase Admin SDK uses Node.js APIs that may not work on Workers. The `sync-users-from-firebase.ts` script imports `firebase-admin`.

**Workaround**: Use Firebase REST API instead of the Admin SDK, or run the Firebase user sync as a one-time local script (it only needs to run once to seed existing users).

**Option B: Workers + Workflows (for long-running syncs)**

If sync jobs exceed the 30s CPU limit, use Cloudflare Workflows which support multi-step, retryable, long-running tasks.

**Option C: Run sync scripts locally / in CI**

Keep the scripts as-is (Node.js + pg), run them manually or via GitHub Actions cron against the D1 HTTP API. This avoids rewriting them entirely but adds complexity.

### Recommendation

- **Firebase user sync**: Run once locally before launch. No need to convert to Workers.
- **RERUM sync-from**: Convert to Workers Cron Trigger. Runs every 15 minutes, reads from RERUM API, writes to D1. Should be fast enough for 30s CPU limit.
- **RERUM sync-to**: Convert to Workers Cron Trigger. Reads from D1, posts to RERUM API. Same approach.

---

## Phase 5: Infrastructure Cleanup

### 5.1 Remove AWS Terraform

Delete or gut these files:

- `infrastructure/main.tf` -- remove all AWS resources (EC2, security group, EIP, data sources)
- `infrastructure/scripts/user-data.sh` -- delete entirely
- `infrastructure/scripts/deploy.sh` -- delete (if created)
- `infrastructure/scripts/backup-db.sh` -- delete (D1 has automatic backups)

### 5.2 Simplify Terraform

**`infrastructure/versions.tf`**: Remove `aws` provider, keep `cloudflare` and `tls` (if still needed).

**`infrastructure/variables.tf`**: Remove AWS variables (`aws_region`, `instance_type`, `key_pair_name`, `ssh_allowed_ips`, `db_password`). Keep Cloudflare + shared variables.

**`infrastructure/outputs.tf`**: Remove EC2 outputs. Keep `cloudflare_zone_id`, `cloudflare_name_servers`.

**`infrastructure/cloudflare.tf`**: Remove Origin CA resources (no origin server to certify). Remove `cloudflare_ip_ranges` data source (no security group to restrict). Keep zone settings, redirect rules, cache rules. Update API DNS to point to Workers (or let wrangler manage custom domains).

### 5.3 Terraform scope

With full Cloudflare, Terraform manages only:

- Zone settings (SSL mode, TLS version, caching behavior, security level)
- Redirect rules (www -> apex)
- Cache rules (bypass for API)

Workers, D1, and R2 are managed by wrangler (deploy, migrations, bucket creation). This is the standard split -- Terraform for zone-level config, wrangler for application resources.

### 5.4 CI/CD

**`.github/workflows/infrastructure.yml`**: Simplify to Cloudflare-only. Remove AWS secrets.

**`.github/workflows/deploy.yml`**: Replace SSH-based deploy with:

```yaml
steps:
  - uses: actions/checkout@v4
  - uses: pnpm/action-setup@v4
  - run: pnpm install --frozen-lockfile
  - run: pnpm --filter @lrda/api run build # if needed
  - run: wrangler deploy --config packages/api/wrangler.toml
    env:
      CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
  - run: pnpm --filter web deploy
    env:
      CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

**`.github/workflows/ci-cd.yml`**: Add `workflow_call:` trigger so deploy can reuse it. Clean up stale env vars.

---

## Phase 6: Existing Docs and Plans

### Update

- `docs/cloudflare-migration-plan.md` -- update Phase 2 (API SSL) to note it's no longer needed (no origin server). Update Phase 3 status.
- `docs/aws-deploy-plan.md` -- mark as superseded by this plan, or delete.
- `docs/docker-blue-green-deploy-plan.md` -- mark as superseded, or delete.
- `.claude/CLAUDE.md` -- update architecture section to reflect Cloudflare Workers, D1, R2.

### Delete (superseded)

- `packages/api/ecosystem.config.cjs` -- PM2 config, not needed
- `scripts/deploy.sh` -- SSH deploy, not needed
- `scripts/backup-db.sh` -- pg_dump, not needed (D1 has Time Travel)

---

## Implementation Order

### Wave 1: API core (D1 + Workers)

These have no external dependencies and can be done together:

1. `packages/api/src/db/schema.ts` -- convert pg -> sqlite types
2. `packages/api/src/db/index.ts` -- replace pg Pool with D1 factory
3. `packages/api/drizzle.config.ts` -- change dialect to sqlite
4. `packages/api/src/auth.ts` -- change provider to sqlite, factory pattern
5. `packages/api/src/index.ts` -- Workers fetch handler, remove Bun.serve()
6. `packages/api/src/env.ts` -- adapt for Workers env bindings
7. `packages/api/src/lib/shutdown-state.ts` -- delete (not needed)
8. `packages/api/src/routes/health.ts` -- D1 health check
9. `packages/api/src/routes/notes.ts` -- `ilike()` -> `like()`
10. Delete existing migrations, run `drizzle-kit generate`
11. Create `packages/api/wrangler.toml`
12. Update `packages/api/package.json` (deps, build script)
13. Update `packages/api/tsconfig.json` (remove bun-types)

**Test**: `wrangler dev` locally, verify all API routes work.

### Wave 2: R2 media storage

14. Create R2 bucket (`wrangler r2 bucket create lrda-media`)
15. Add media upload route to API
16. Update `packages/web/app/lib/utils/s3_proxy.ts` to point to new endpoint
17. Test uploads end-to-end

### Wave 3: Frontend on Workers

18. Install `@opennextjs/cloudflare` and `wrangler` in web package
19. Create `wrangler.jsonc`, `open-next.config.ts`
20. Update `package.json` scripts
21. Remove `sharp` dependency
22. Add `.open-next/` to `.gitignore`
23. Delete `netlify.toml` files
24. Test with `pnpm --filter web preview`
25. Deploy to `*.workers.dev` URL

### Wave 4: Sync scripts

26. Convert `sync-from-rerum.ts` to use D1 (or run via Workers Cron)
27. Convert `sync-to-rerum.ts` to use D1 (or run via Workers Cron)
28. Run `sync-users-from-firebase.ts` once locally, then shelve
29. Update `seed.ts` for SQLite (TRUNCATE -> DELETE)
30. Update `promote-admin.ts` for D1

### Wave 5: Infrastructure cleanup

31. Gut `infrastructure/main.tf` (remove AWS)
32. Simplify `infrastructure/variables.tf`, `outputs.tf`, `versions.tf`
33. Update `infrastructure/cloudflare.tf` (remove Origin CA, update DNS)
34. Delete `infrastructure/scripts/user-data.sh`
35. Update `.github/workflows/` (deploy via wrangler, remove AWS secrets)
36. Update or delete old plan docs

### Wave 6: Custom domains and DNS cutover

37. Add custom domain to API Worker (`api.wheresreligion.org`)
38. Add custom domain to web Worker (`wheresreligion.org`, `www.wheresreligion.org`)
39. Verify everything works on custom domains
40. Remove Netlify site
41. Merge to main

---

## Testing Checklist

### After Wave 1 (API on Workers)

- [ ] `wrangler dev` starts locally
- [ ] `curl http://localhost:8787/api/health` returns 200
- [ ] Create/read/update/delete notes via API
- [ ] Auth flow works (signup, login, session)
- [ ] Admin routes work (role checks)
- [ ] Comment CRUD works
- [ ] Search (notes by title, tags, geo bounds) works

### After Wave 2 (R2 storage)

- [ ] Upload image via web app, stored in R2
- [ ] Upload audio via web app, stored in R2
- [ ] Media URLs resolve and display correctly
- [ ] Old media URLs (S3/RERUM) still work

### After Wave 3 (Frontend on Workers)

- [ ] `pnpm --filter web preview` runs locally
- [ ] Auth flow works (login, signup, session cookies)
- [ ] Google Maps loads and renders markers
- [ ] Note editor (Tiptap) loads, saves, shows media
- [ ] Comments work
- [ ] Admin dashboard works
- [ ] Instructor dashboard works
- [ ] All pages render without errors

### After Wave 4 (Sync scripts)

- [ ] RERUM sync-from runs and imports notes
- [ ] RERUM sync-to runs and exports notes
- [ ] Sync state tracked correctly (no duplicates)

### After Wave 6 (DNS cutover)

- [ ] `https://wheresreligion.org` serves frontend
- [ ] `https://api.wheresreligion.org/api/health` returns 200
- [ ] Mobile app "Visit Website" link works
- [ ] Old Netlify URL redirects or is decommissioned

---

## Risks and Mitigations

| Risk                                | Impact                                           | Mitigation                                              |
| ----------------------------------- | ------------------------------------------------ | ------------------------------------------------------- |
| D1 SQLite limits (10 GB paid)       | Low -- estimated ~350 MB for 500 users/10K notes | Monitor via Cloudflare dashboard                        |
| Workers 30s CPU limit               | Low -- all routes are simple CRUD                | Use Workflows for sync scripts if they're slow          |
| Firebase Admin SDK on Workers       | High -- Node.js native modules                   | Run firebase sync once locally, don't deploy to Workers |
| `next/headers` cookies() on Workers | Medium -- may break server auth                  | Test early in Wave 3; fallback to header-based auth     |
| RERUM API reliability               | Low -- external dependency for sync              | Retry logic already in sync scripts                     |
| D1 eventual consistency             | Low -- D1 is strongly consistent within a region | No action needed                                        |
| `ilike()` behavior change           | Low -- SQLite LIKE is case-insensitive for ASCII | Replace with `like()`, test search                      |

---

## Rollback Plan

The `301-improve-admin` branch preserves the full AWS/PostgreSQL path. If Cloudflare doesn't work out:

1. Switch back to `301-improve-admin`
2. Provision EC2 via existing Terraform
3. Deploy with the original deploy.sh + PM2 approach
4. No data loss -- D1 data can be exported and imported into PostgreSQL

The two branches can coexist until one is proven.
