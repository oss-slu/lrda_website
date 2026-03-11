# AWS Production Deployment Pipeline

Reference plan for setting up CI/CD, zero-downtime deploys, database backups, and production hardening for the LRDA API on AWS EC2.

**Architecture:** Single EC2 (API + PostgreSQL) + Cloudflare Workers (frontend via `@opennextjs/cloudflare`). Cloudflare proxies API traffic, Origin CA cert for SSL. No ALB, no ECS, no Fargate. $0 additional cost beyond the existing EC2.

---

## Overview

| Component | Tool | Notes |
|-----------|------|-------|
| Runtime | Bun | API is built and runs on Bun, not Node |
| Process Manager | PM2 (fork mode) | Bun doesn't support Node cluster mode |
| Reverse Proxy | Nginx | SSL via Cloudflare Origin CA (15-year cert, no renewal) |
| Deploy Trigger | GitHub Actions (manual) | `workflow_dispatch` with environment choice |
| DB Migrations | Auto on deploy | `drizzle-kit migrate` runs during each deploy |
| DB Backups | Nightly cron | `pg_dump` to local disk, 7-day retention, optional S3 |
| Rollback | Automatic | Health check failure triggers rollback to previous commit |

---

## Current Issues to Fix

1. ~~**Nginx port mismatch**: Proxies to `localhost:3001` but API runs on port `3002`~~ **FIXED in user-data.sh**
2. ~~**Nginx health path wrong**: `/health` -> `localhost:3001/health` should be `/api/health` -> `localhost:3002/api/health`~~ **FIXED in user-data.sh**
3. **No Bun installed**: `user-data.sh` installs Node.js but the API needs Bun
4. ~~**No graceful shutdown**: `Bun.serve()` has no SIGTERM/SIGINT handlers -- in-flight requests get dropped~~ **FIXED**
5. ~~**Health check always 200**: Returns HTTP 200 even when database is disconnected (should be 503)~~ **FIXED**
6. **No PM2 config**: PM2 is installed but no `ecosystem.config.cjs` exists
7. **No deploy pipeline**: CI only runs tests, no deployment step
8. **No DB backups**: No `pg_dump` cron, no backup strategy
9. **Terraform state is local**: S3 backend is commented out in `versions.tf`
10. **Stale CI env vars**: `ci-cd.yml` still sets `NEXT_PUBLIC_FIREBASE_*` variables

---

## Files to Create

### 1. `packages/api/src/lib/shutdown-state.ts`

Shared shutdown flag (avoids circular imports between `index.ts` and `health.ts`):

```typescript
let _shutting = false;
export function setShuttingDown(v: boolean) { _shutting = v; }
export function isShuttingDown() { return _shutting; }
```

### 2. `packages/api/ecosystem.config.cjs`

PM2 configuration for Bun in fork mode:

```javascript
module.exports = {
  apps: [{
    name: 'lrda-api',
    interpreter: '/home/ubuntu/.bun/bin/bun',
    script: 'dist/index.js',
    cwd: '/home/ubuntu/lrda/packages/api',
    exec_mode: 'fork',
    instances: 1,
    env: {
      NODE_ENV: 'production',
      PORT: 3002,
    },
    kill_timeout: 10000,       // 10s for graceful shutdown before SIGKILL
    listen_timeout: 10000,
    error_file: '/home/ubuntu/lrda/logs/api-error.log',
    out_file: '/home/ubuntu/lrda/logs/api-out.log',
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    max_restarts: 10,
    min_uptime: 5000,
    restart_delay: 1000,
    autorestart: true,
    watch: false,
  }],
};
```

### 3. `scripts/deploy.sh`

Server-side deploy script (called via SSH from GitHub Actions):

```bash
#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/home/ubuntu/lrda"
API_DIR="${APP_DIR}/packages/api"
HEALTH_URL="http://localhost:3002/api/health"
HEALTH_RETRIES=15
HEALTH_DELAY=2

mkdir -p "${APP_DIR}/logs"

echo "[deploy] Starting deploy at $(date -u +%Y-%m-%dT%H:%M:%SZ)"
cd "${APP_DIR}"

# 1. Save current commit for rollback
PREV_COMMIT=$(git rev-parse HEAD)
echo "[deploy] Previous commit: ${PREV_COMMIT}"

# 2. Pull latest code
git fetch origin main
git reset --hard origin/main

# 3. Install dependencies
pnpm install --frozen-lockfile

# 4. Build API
cd "${API_DIR}"
bun run build

# 5. Run database migrations
pnpm run db:migrate

# 6. Reload PM2
pm2 reload ecosystem.config.cjs

# 7. Health check
HEALTHY=false
for i in $(seq 1 ${HEALTH_RETRIES}); do
  sleep ${HEALTH_DELAY}
  HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${HEALTH_URL}" || echo "000")
  if [ "${HTTP_STATUS}" = "200" ]; then
    HEALTHY=true
    echo "[deploy] Health check passed (attempt ${i})"
    break
  fi
  echo "[deploy] Health check attempt ${i}/${HEALTH_RETRIES}: HTTP ${HTTP_STATUS}"
done

# 8. Rollback if unhealthy
if [ "${HEALTHY}" = "false" ]; then
  echo "[deploy] FAILED - rolling back to ${PREV_COMMIT}"
  cd "${APP_DIR}"
  git reset --hard "${PREV_COMMIT}"
  cd "${API_DIR}"
  pnpm install --frozen-lockfile
  bun run build
  pm2 reload ecosystem.config.cjs
  echo "[deploy] Rollback complete."
  exit 1
fi

echo "[deploy] Success at $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "[deploy] Commit: $(git rev-parse HEAD)"
```

Note: DB migrations are forward-only. If a migration breaks the app, the code rollback happens but the DB schema stays at the new version. Manual intervention needed in that case.

### 4. `scripts/backup-db.sh`

Nightly PostgreSQL backup script:

```bash
#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="/home/ubuntu/backups/db"
RETENTION_DAYS=7
DB_NAME="${DB_NAME:-lrda_staging}"
TIMESTAMP=$(date -u +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.sql.gz"
S3_BUCKET="${BACKUP_S3_BUCKET:-}"
S3_PREFIX="${BACKUP_S3_PREFIX:-backups/db}"

mkdir -p "${BACKUP_DIR}"

echo "[backup] Starting backup of ${DB_NAME}"
sudo -u postgres pg_dump "${DB_NAME}" | gzip > "${BACKUP_FILE}"
echo "[backup] Created: ${BACKUP_FILE} ($(du -h "${BACKUP_FILE}" | cut -f1))"

# Optional S3 upload
if [ -n "${S3_BUCKET}" ]; then
  aws s3 cp "${BACKUP_FILE}" "s3://${S3_BUCKET}/${S3_PREFIX}/${DB_NAME}_${TIMESTAMP}.sql.gz"
  echo "[backup] Uploaded to S3."
fi

# Prune old backups
find "${BACKUP_DIR}" -name "${DB_NAME}_*.sql.gz" -mtime +${RETENTION_DAYS} -delete
echo "[backup] Done. $(find "${BACKUP_DIR}" -name "${DB_NAME}_*.sql.gz" | wc -l) backup(s) retained."
```

Cron entry (added by `user-data.sh`):
```
0 3 * * * DB_NAME=lrda_<environment> /home/ubuntu/lrda/scripts/backup-db.sh >> /home/ubuntu/logs/backup.log 2>&1
```

### 5. `.github/workflows/deploy.yml`

Manual deploy workflow:

```yaml
name: Deploy API

on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Target environment'
        required: true
        default: 'staging'
        type: choice
        options:
          - staging
          - production

concurrency:
  group: deploy-${{ github.event.inputs.environment }}
  cancel-in-progress: false  # Never cancel an in-progress deploy

jobs:
  tests:
    name: Run Tests
    uses: ./.github/workflows/ci-cd.yml

  deploy:
    name: Deploy to ${{ github.event.inputs.environment }}
    needs: tests
    runs-on: ubuntu-latest
    environment: ${{ github.event.inputs.environment }}

    steps:
      - name: Configure SSH
        run: |
          mkdir -p ~/.ssh
          echo "${{ secrets.EC2_SSH_PRIVATE_KEY }}" > ~/.ssh/deploy_key
          chmod 600 ~/.ssh/deploy_key
          ssh-keyscan -H ${{ secrets.EC2_HOST }} >> ~/.ssh/known_hosts 2>/dev/null

      - name: Deploy via SSH
        run: |
          ssh -i ~/.ssh/deploy_key -o StrictHostKeyChecking=no \
            ubuntu@${{ secrets.EC2_HOST }} \
            'bash /home/ubuntu/lrda/scripts/deploy.sh'

      - name: Verify deployment
        run: |
          sleep 5
          HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
            "https://${{ secrets.API_DOMAIN }}/api/health" || echo "000")
          if [ "${HTTP_STATUS}" != "200" ]; then
            echo "External health check failed: HTTP ${HTTP_STATUS}"
            exit 1
          fi
          echo "Health check passed."

      - name: Cleanup
        if: always()
        run: rm -f ~/.ssh/deploy_key
```

---

## Files to Modify

### 6. `packages/api/src/db/index.ts`

Add `closePool()` export for graceful shutdown:

```typescript
export async function closePool(): Promise<void> {
  await pool.end();
}
```

### 7. `packages/api/src/routes/health.ts`

- Import `isShuttingDown` from `../lib/shutdown-state`
- Return HTTP 503 when DB is disconnected or server is shutting down
- Add `503` response to the OpenAPI route spec

### 8. `packages/api/src/index.ts`

Add graceful shutdown after `Bun.serve()`:

```typescript
import { setShuttingDown } from './lib/shutdown-state';
import { closePool } from './db';

// ... existing code ...

let isShuttingDown = false;
async function gracefulShutdown(signal: string) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  setShuttingDown(true);
  logger.info(`Received ${signal}, shutting down...`);
  server.stop();
  await closePool();
  logger.info('Shutdown complete.');
  process.exit(0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
```

### 9. `infrastructure/scripts/user-data.sh`

- Add Bun installation: `sudo -u ubuntu bash -c 'curl -fsSL https://bun.sh/install | bash'`
- ~~Fix Nginx `proxy_pass` from `localhost:3001` to `localhost:3002`~~ **DONE**
- ~~Fix Nginx health location to `/api/health` -> `localhost:3002/api/health`~~ **DONE**
- ~~Fix comment "proxy to Fastify" -> "proxy to Hono"~~ **DONE**
- ~~Remove certbot, use Cloudflare Origin CA cert~~ **DONE** (cert generated via OpenTofu, installed post-deploy)
- ~~Nginx listens on 443 with SSL using Origin CA cert paths~~ **DONE**
- Add `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `CORS_ORIGINS` to the `.env` file
- Move `.env` creation to `packages/api/.env` (Bun loads `.env` from CWD, PM2 sets CWD to this dir)
- Add backup cron: `0 3 * * *`
- Create directories: `/home/ubuntu/lrda/logs`, `/home/ubuntu/backups/db`

### 10. `.github/workflows/ci-cd.yml`

- Add `workflow_call:` to the `on:` triggers so `deploy.yml` can reuse it as a prerequisite
- Clean up stale `NEXT_PUBLIC_FIREBASE_*` env vars, replace with `NEXT_PUBLIC_API_URL`

### 11. `infrastructure/versions.tf`

Uncomment the S3 backend block (lines 13-19). Requires one-time manual bootstrap:

```bash
# Create S3 bucket for Terraform state
aws s3api create-bucket --bucket lrda-terraform-state --region us-east-1
aws s3api put-bucket-versioning --bucket lrda-terraform-state \
  --versioning-configuration Status=Enabled

# Create DynamoDB table for state locking
aws dynamodb create-table \
  --table-name terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1

# Then: terraform init -migrate-state
```

---

## Required GitHub Secrets

| Secret | Description | Example |
|--------|-------------|---------|
| `EC2_SSH_PRIVATE_KEY` | PEM content of EC2 key pair private key | `-----BEGIN RSA PRIVATE KEY-----...` |
| `EC2_HOST` | Elastic IP of EC2 instance | `54.123.45.67` |
| `API_DOMAIN` | API domain for health checks | `api-staging.wheresreligion.org` |
| `AWS_ACCESS_KEY_ID` | (already exists) | -- |
| `AWS_SECRET_ACCESS_KEY` | (already exists) | -- |
| `DB_PASSWORD` | (already exists) | -- |
| `DOMAIN_NAME` | (already exists) | -- |
| `SSH_ALLOWED_IPS` | (already exists) | -- |
| `KEY_PAIR_NAME` | (already exists) | -- |

Optionally: Create GitHub Environments (`staging`, `production`) with required reviewers on `production` for an extra approval gate.

---

## Implementation Order

1. ~~`packages/api/src/lib/shutdown-state.ts` -- create (no deps)~~ **DONE**
2. ~~`packages/api/src/db/index.ts` -- add `closePool()` (no deps)~~ **DONE**
3. ~~`packages/api/src/routes/health.ts` -- fix status codes (depends on 1)~~ **DONE**
4. ~~`packages/api/src/index.ts` -- add graceful shutdown (depends on 1, 2)~~ **DONE**
5. `packages/api/ecosystem.config.cjs` -- create PM2 config (no deps)
6. `scripts/deploy.sh` -- create deploy script (depends on 5)
7. `scripts/backup-db.sh` -- create backup script (no deps)
8. `infrastructure/scripts/user-data.sh` -- fix all issues (depends on 6, 7)
9. `.github/workflows/ci-cd.yml` + `.github/workflows/deploy.yml` -- CI/CD (depends on all above)
10. `infrastructure/versions.tf` -- Terraform state backend (independent)

Steps 1-4 are complete and can be tested locally. Steps 5-10 take effect when the EC2 is provisioned.

---

## Verification Checklist

**Local testing (steps 1-4):**
```bash
cd packages/api && bun run build && bun run dist/index.js &
curl -v http://localhost:3002/api/health        # expect 200
kill -TERM $!                                    # expect graceful shutdown logs
# Stop local PostgreSQL, restart server:
curl -v http://localhost:3002/api/health        # expect 503
```

**After EC2 is provisioned:**
1. SSH in, verify `bun --version` works
2. Verify Nginx: `cat /etc/nginx/sites-available/lrda` shows port 3002
3. Clone repo, place `.env` at `packages/api/.env`, run `scripts/deploy.sh`
4. `curl http://localhost:3002/api/health` returns 200
5. `pm2 status` shows `lrda-api` online
6. `pm2 logs` shows structured JSON output

**CI/CD:**
1. Push all changes to main
2. GitHub Actions > Deploy API > Run workflow > staging
3. Watch: tests pass -> SSH deploy -> external health check
4. `curl https://api-staging.wheresreligion.org/api/health` returns 200

**Backups:**
```bash
DB_NAME=lrda_staging bash scripts/backup-db.sh
ls -la /home/ubuntu/backups/db/    # expect timestamped .sql.gz file
```
