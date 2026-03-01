# Docker Blue/Green Deployment with Local Prod-Like Testing

## Context

The LRDA API currently has no deploy pipeline, no Dockerfiles, and no way to test the production topology locally. The existing `user-data.sh` has known bugs (wrong port, no Bun, PM2 instead of Docker). This plan containerizes the API, adds blue/green zero-downtime deploys on the single EC2 instance, creates a local Docker Compose stack that mirrors production, and wires up a manual-dispatch GitHub Actions deploy workflow.

**Cost impact:** $0 additional -- Docker CE is free, same single EC2 instance.

---

## Architecture

### Production (EC2)

```
                     [Nginx (native, systemd)]
                       port 80/443 + SSL
                            |
                    upstream lrda_api
                            |
               +------------+------------+
               |                         |
      [lrda-api-blue]          [lrda-api-green]
       Docker :3002              Docker :3003
               |                         |
               +------------+------------+
                            |
                   [PostgreSQL 16 (native)]
                        port 5432
```

- PostgreSQL runs natively via systemd (already set up by user-data.sh)
- Nginx runs natively for certbot SSL management
- Only the API runs in Docker containers (blue on port 3002, green on port 3003)
- At any given time, only one container serves traffic; the other is stopped or being deployed

### Local Testing (mirrors production)

```
      [Nginx (Docker)] :8080
               |
      [api-blue (Docker)] :3002   [api-green (Docker)] :3003
               |                           |
      [PostgreSQL 16 (Docker)] :5434
```

Same Dockerfile, same topology. Tests the full deploy flow before pushing to EC2.

---

## Blue/Green Switching Mechanism

### How It Works

**State tracking:** Nginx upstream config files in `/etc/nginx/conf.d/`:
- `upstream-blue.conf` active + `upstream-green.conf.disabled` = Blue serving traffic
- `upstream-green.conf` active + `upstream-blue.conf.disabled` = Green serving traffic

**Deploy flow:**
1. Determine which color is currently active
2. Pull latest code, build new Docker image
3. Run DB migrations from temporary container
4. Start inactive color container on its port
5. Health check new container directly (bypasses Nginx, hits container port)
6. If healthy: write new upstream file, rename old to `.disabled`, reload Nginx
7. Stop old container
8. If unhealthy: stop new container, keep old running, rollback code. Zero downtime.

**Why this approach:**
- `nginx reload` is graceful -- new workers fork with new config while old workers finish existing connections. No dropped requests.
- Health check bypasses Nginx to test the container directly before switching traffic
- Rollback is automatic on failure -- old container never stops if new one is unhealthy

---

## Files to Create

### 1. `packages/api/Dockerfile`

Multi-stage Bun build:

```dockerfile
# ---- Build Stage ----
FROM oven/bun:1 AS builder

WORKDIR /app

# Copy workspace configuration
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY packages/api/package.json packages/api/
COPY packages/shared/package.json packages/shared/

# Install pnpm and all dependencies (devDependencies needed for build)
RUN bun install -g pnpm && pnpm install --frozen-lockfile

# Copy source code
COPY packages/shared/ packages/shared/
COPY packages/api/ packages/api/

# Build the API (produces dist/index.js -- single 2.2MB bundle)
WORKDIR /app/packages/api
RUN bun run build

# ---- Runtime Stage ----
FROM oven/bun:1-slim AS runtime

WORKDIR /app

# Copy the bundled output
COPY --from=builder /app/packages/api/dist/ ./dist/

# Copy migration files and drizzle config (needed for drizzle-kit migrate)
COPY --from=builder /app/packages/api/src/db/migrations/ ./src/db/migrations/
COPY --from=builder /app/packages/api/drizzle.config.ts ./

# Copy package files for drizzle-kit
COPY --from=builder /app/packages/api/package.json ./
COPY --from=builder /app/packages/api/node_modules/ ./node_modules/

ENV NODE_ENV=production
EXPOSE 3002

HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
  CMD bun -e "fetch('http://localhost:' + (process.env.PORT || 3002) + '/api/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["bun", "run", "dist/index.js"]
```

### 2. `packages/api/.dockerignore`

```
node_modules/
dist/
.env
.env.*
*.log
.git/
firebase-service-account.json
*-service-account.json
src/__tests__/
vitest.config.ts
README.md
```

### 3. `.dockerignore` (root)

```
.git/
.github/
node_modules/
packages/web/
docs/
infrastructure/
scripts/
public/
*.md
.env*
.next/
playwright-report/
test-results/
plans/
.claude/
```

### 4. `docker-compose.prod-local.yml` (root)

Local prod-like stack:

```yaml
# Local production-like testing stack
# Usage: docker compose -f docker-compose.prod-local.yml up --build -d
#
# Mirrors EC2 production topology:
#   - PostgreSQL 16 (like native PG on EC2)
#   - Two API containers for blue/green testing
#   - Nginx reverse proxy with upstream switching

services:
  postgres:
    image: postgres:16-alpine
    container_name: lrda-prod-local-pg
    restart: unless-stopped
    ports:
      - "5434:5432"  # Different host port to avoid conflict with dev PG on 5433
    environment:
      POSTGRES_USER: lrda_app
      POSTGRES_PASSWORD: lrda_local_prod
      POSTGRES_DB: lrda_production
    volumes:
      - prod_local_pg_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U lrda_app -d lrda_production"]
      interval: 5s
      timeout: 3s
      retries: 5
    networks:
      - lrda-prod-local

  api-blue:
    build:
      context: .
      dockerfile: packages/api/Dockerfile
    container_name: lrda-api-blue
    ports:
      - "3002:3002"
    environment:
      NODE_ENV: production
      PORT: 3002
      DATABASE_URL: postgresql://lrda_app:lrda_local_prod@postgres:5432/lrda_production
      BETTER_AUTH_SECRET: local-prod-testing-secret-not-real
      BETTER_AUTH_URL: http://localhost:3002
      CORS_ORIGINS: http://localhost:3000,http://localhost:8080
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - lrda-prod-local

  api-green:
    build:
      context: .
      dockerfile: packages/api/Dockerfile
    container_name: lrda-api-green
    ports:
      - "3003:3002"
    environment:
      NODE_ENV: production
      PORT: 3002
      DATABASE_URL: postgresql://lrda_app:lrda_local_prod@postgres:5432/lrda_production
      BETTER_AUTH_SECRET: local-prod-testing-secret-not-real
      BETTER_AUTH_URL: http://localhost:3003
      CORS_ORIGINS: http://localhost:3000,http://localhost:8080
    depends_on:
      postgres:
        condition: service_healthy
    profiles:
      - green  # Only started when explicitly requested
    networks:
      - lrda-prod-local

  nginx:
    image: nginx:alpine
    container_name: lrda-prod-local-nginx
    ports:
      - "8080:80"
    volumes:
      - ./infrastructure/nginx/local.conf:/etc/nginx/conf.d/default.conf:ro
    depends_on:
      - api-blue
    networks:
      - lrda-prod-local

volumes:
  prod_local_pg_data:

networks:
  lrda-prod-local:
    driver: bridge
```

### 5. `docker-compose.prod.yml` (root -- deployed to EC2)

API containers only (PG + Nginx are native on EC2):

```yaml
# Production EC2 deployment
# PostgreSQL and Nginx run natively on the host.
# Only the API containers are managed by Docker.

services:
  api-blue:
    image: lrda-api:latest
    container_name: lrda-api-blue
    restart: unless-stopped
    ports:
      - "3002:3002"
    env_file:
      - .env
    environment:
      PORT: 3002
    extra_hosts:
      - "host.docker.internal:host-gateway"
    healthcheck:
      test: ["CMD", "bun", "-e", "fetch('http://localhost:3002/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]
      interval: 10s
      timeout: 3s
      start_period: 5s
      retries: 3

  api-green:
    image: lrda-api:latest
    container_name: lrda-api-green
    restart: unless-stopped
    ports:
      - "3003:3002"
    env_file:
      - .env
    environment:
      PORT: 3002
    extra_hosts:
      - "host.docker.internal:host-gateway"
    profiles:
      - green
    healthcheck:
      test: ["CMD", "bun", "-e", "fetch('http://localhost:3002/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]
      interval: 10s
      timeout: 3s
      start_period: 5s
      retries: 3
```

The `.env` file on EC2 uses `DATABASE_URL=postgresql://lrda_app:<password>@host.docker.internal:5432/lrda_<env>`. The `extra_hosts` directive maps `host.docker.internal` to the Docker host gateway, allowing containers to reach native PostgreSQL.

### 6. `infrastructure/nginx/local.conf`

```nginx
upstream lrda_api {
    server api-blue:3002;
}

server {
    listen 80;
    server_name localhost;

    location / {
        proxy_pass http://lrda_api;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 7. `scripts/deploy.sh`

Blue/green deploy script (runs on EC2 via SSH from GitHub Actions):

```bash
#!/usr/bin/env bash
# Blue/green deploy script for LRDA API
set -euo pipefail

APP_DIR="/home/ubuntu/lrda"
COMPOSE_FILE="${APP_DIR}/docker-compose.prod.yml"
NGINX_CONF_DIR="/etc/nginx/conf.d"
BLUE_PORT=3002
GREEN_PORT=3003
HEALTH_RETRIES=20
HEALTH_DELAY=3
LOG_PREFIX="[deploy]"

log() { echo "${LOG_PREFIX} $(date -u +%H:%M:%S) $*"; }

cd "${APP_DIR}"

# ---- Determine active color ----
if [ -f "${NGINX_CONF_DIR}/upstream-blue.conf" ] && \
   ! [ -f "${NGINX_CONF_DIR}/upstream-blue.conf.disabled" ]; then
    ACTIVE="blue"; INACTIVE="green"
    ACTIVE_PORT="${BLUE_PORT}"; INACTIVE_PORT="${GREEN_PORT}"
elif [ -f "${NGINX_CONF_DIR}/upstream-green.conf" ] && \
     ! [ -f "${NGINX_CONF_DIR}/upstream-green.conf.disabled" ]; then
    ACTIVE="green"; INACTIVE="blue"
    ACTIVE_PORT="${GREEN_PORT}"; INACTIVE_PORT="${BLUE_PORT}"
else
    # First deploy
    log "No active upstream found. First deploy, defaulting to blue."
    ACTIVE="none"; INACTIVE="blue"
    ACTIVE_PORT="0"; INACTIVE_PORT="${BLUE_PORT}"
fi

log "Active: ${ACTIVE} (:${ACTIVE_PORT}), deploying to: ${INACTIVE} (:${INACTIVE_PORT})"

# ---- Pull latest code ----
PREV_COMMIT=$(git rev-parse HEAD 2>/dev/null || echo "none")
log "Current commit: ${PREV_COMMIT}"
git fetch origin main
git reset --hard origin/main
log "Updated to: $(git rev-parse HEAD)"

# ---- Build Docker image ----
log "Building Docker image..."
docker build -t lrda-api:latest -f packages/api/Dockerfile .

# ---- Run database migrations ----
log "Running database migrations..."
docker run --rm \
    --env-file "${APP_DIR}/.env" \
    --add-host=host.docker.internal:host-gateway \
    lrda-api:latest \
    bun x drizzle-kit migrate

# ---- Start inactive container ----
log "Starting ${INACTIVE} container..."
if [ "${INACTIVE}" = "green" ]; then
    docker compose -f "${COMPOSE_FILE}" --profile green up -d api-green
else
    docker compose -f "${COMPOSE_FILE}" up -d api-blue
fi

# ---- Health check new container ----
log "Health checking ${INACTIVE} on :${INACTIVE_PORT}..."
HEALTHY=false
for i in $(seq 1 ${HEALTH_RETRIES}); do
    sleep ${HEALTH_DELAY}
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
        "http://localhost:${INACTIVE_PORT}/api/health" 2>/dev/null || echo "000")
    if [ "${HTTP_STATUS}" = "200" ]; then
        HEALTHY=true
        log "Health check passed (attempt ${i})"
        break
    fi
    log "Attempt ${i}/${HEALTH_RETRIES}: HTTP ${HTTP_STATUS}"
done

if [ "${HEALTHY}" = "false" ]; then
    log "FAILED -- ${INACTIVE} not healthy. Keeping ${ACTIVE} running."
    docker compose -f "${COMPOSE_FILE}" stop "api-${INACTIVE}" 2>/dev/null || true
    if [ "${PREV_COMMIT}" != "none" ]; then
        git reset --hard "${PREV_COMMIT}"
    fi
    exit 1
fi

# ---- Switch Nginx upstream ----
log "Switching Nginx to ${INACTIVE} (:${INACTIVE_PORT})..."
echo "upstream lrda_api { server 127.0.0.1:${INACTIVE_PORT}; }" | \
    sudo tee "${NGINX_CONF_DIR}/upstream-${INACTIVE}.conf" > /dev/null

if [ "${ACTIVE}" != "none" ]; then
    sudo mv "${NGINX_CONF_DIR}/upstream-${ACTIVE}.conf" \
            "${NGINX_CONF_DIR}/upstream-${ACTIVE}.conf.disabled" 2>/dev/null || true
fi

if sudo nginx -t 2>/dev/null; then
    sudo systemctl reload nginx
    log "Nginx reloaded"
else
    log "ERROR: Nginx config test failed, rolling back"
    if [ "${ACTIVE}" != "none" ]; then
        sudo mv "${NGINX_CONF_DIR}/upstream-${ACTIVE}.conf.disabled" \
                "${NGINX_CONF_DIR}/upstream-${ACTIVE}.conf" 2>/dev/null || true
    fi
    sudo rm -f "${NGINX_CONF_DIR}/upstream-${INACTIVE}.conf"
    docker compose -f "${COMPOSE_FILE}" stop "api-${INACTIVE}" 2>/dev/null || true
    exit 1
fi

# ---- Stop old container ----
if [ "${ACTIVE}" != "none" ]; then
    log "Stopping old ${ACTIVE} container..."
    docker compose -f "${COMPOSE_FILE}" stop "api-${ACTIVE}"
fi

# ---- Cleanup ----
docker image prune -f --filter "until=24h" 2>/dev/null || true

log "Deploy complete. Active: ${INACTIVE} on :${INACTIVE_PORT}"
log "Commit: $(git rev-parse HEAD)"
```

### 8. `scripts/backup-db.sh`

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

if [ -n "${S3_BUCKET}" ]; then
    aws s3 cp "${BACKUP_FILE}" "s3://${S3_BUCKET}/${S3_PREFIX}/${DB_NAME}_${TIMESTAMP}.sql.gz"
    echo "[backup] Uploaded to S3."
fi

find "${BACKUP_DIR}" -name "${DB_NAME}_*.sql.gz" -mtime +${RETENTION_DAYS} -delete
echo "[backup] Done. $(find "${BACKUP_DIR}" -name "${DB_NAME}_*.sql.gz" | wc -l) backup(s) retained."
```

### 9. `.github/workflows/deploy.yml`

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
  cancel-in-progress: false

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
            'bash /home/ubuntu/lrda/scripts/deploy.sh 2>&1'
        timeout-minutes: 10

      - name: Verify deployment externally
        run: |
          sleep 5
          HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
            "https://${{ secrets.API_DOMAIN }}/api/health" || echo "000")
          if [ "${HTTP_STATUS}" != "200" ]; then
            echo "External health check failed: HTTP ${HTTP_STATUS}"
            exit 1
          fi
          echo "External health check passed."

      - name: Cleanup
        if: always()
        run: rm -f ~/.ssh/deploy_key
```

---

## Files to Modify

### 10. `infrastructure/scripts/user-data.sh`

Key changes:
- **Remove**: Node.js installation, PM2 installation, PM2 systemd setup
- **Add**: Docker CE installation (`docker-ce docker-ce-cli containerd.io docker-compose-plugin`)
- **Add**: `usermod -aG docker ubuntu` (allow non-root Docker)
- **Fix**: Nginx proxy port `3001` -> `3002`
- **Fix**: Health path `/health` -> `/api/health`
- **Fix**: Comment "proxy to Fastify" -> "proxy to Hono"
- **Add**: Nginx upstream config file: `upstream-blue.conf` in `/etc/nginx/conf.d/`
- **Add**: PostgreSQL `pg_hba.conf` entry for Docker bridge (`172.17.0.0/16`)
- **Add**: PostgreSQL `listen_addresses` to include `172.17.0.1` (Docker bridge)
- **Add**: `.env` with all required vars (`DATABASE_URL` using `host.docker.internal`, `BETTER_AUTH_SECRET`, `CORS_ORIGINS`)
- **Add**: Backup cron: `0 3 * * *`
- **Add**: Directories: `/home/ubuntu/lrda/logs`, `/home/ubuntu/backups/db`

### 11. `infrastructure/variables.tf` + `infrastructure/main.tf`

- Add `better_auth_secret` variable (type: string, sensitive: true)
- Pass `better_auth_secret` in the `templatefile()` call in `main.tf`

### 12. `.github/workflows/ci-cd.yml`

- Add `workflow_call:` to `on:` triggers (so deploy.yml can reuse it as a prerequisite)
- Remove stale `NEXT_PUBLIC_FIREBASE_*` env vars from both jobs
- Add `NEXT_PUBLIC_API_URL: 'http://localhost:3002'`

### 13. `docs/aws-deploy-plan.md`

- Update to reflect Docker-based approach replacing PM2

---

## Required GitHub Secrets

| Secret | Description | Example |
|--------|-------------|---------|
| `EC2_SSH_PRIVATE_KEY` | PEM content of EC2 key pair private key | `-----BEGIN RSA PRIVATE KEY-----...` |
| `EC2_HOST` | Elastic IP of EC2 instance | `54.123.45.67` |
| `API_DOMAIN` | API domain for external health checks | `api-staging.wherereligion.org` |
| `AWS_ACCESS_KEY_ID` | (already exists) | -- |
| `AWS_SECRET_ACCESS_KEY` | (already exists) | -- |
| `DB_PASSWORD` | (already exists) | -- |
| `DOMAIN_NAME` | (already exists) | -- |
| `SSH_ALLOWED_IPS` | (already exists) | -- |
| `KEY_PAIR_NAME` | (already exists) | -- |
| `BETTER_AUTH_SECRET` | New -- for Terraform variable | -- |

Optional: Create GitHub Environments (`staging`, `production`) with required reviewers on `production`.

---

## Implementation Order

| Step | File | Notes |
|------|------|-------|
| 1 | `packages/api/Dockerfile` | Core deliverable |
| 2 | `packages/api/.dockerignore` | Keeps image small |
| 3 | `.dockerignore` (root) | Keeps build context small |
| 4 | `infrastructure/nginx/local.conf` | Simple static file |
| 5 | `docker-compose.prod-local.yml` | Local testing stack |
| 6 | **Test locally**: build image + run stack | Verify before continuing |
| 7 | `docker-compose.prod.yml` | EC2 compose file |
| 8 | `scripts/deploy.sh` | Blue/green logic |
| 9 | `scripts/backup-db.sh` | Independent |
| 10 | `infrastructure/scripts/user-data.sh` | Big update |
| 11 | `infrastructure/variables.tf` + `main.tf` | New variable |
| 12 | `.github/workflows/ci-cd.yml` | Add workflow_call, clean env |
| 13 | `.github/workflows/deploy.yml` | Manual deploy workflow |
| 14 | `docs/aws-deploy-plan.md` | Update docs |

---

## Verification Checklist

### Phase 1: Dockerfile
```bash
docker build -t lrda-api:test -f packages/api/Dockerfile .
pnpm --filter @lrda/api docker:up  # start dev PG on 5433
docker run --rm -p 3002:3002 \
  -e DATABASE_URL=postgresql://lrda:lrda_dev@host.docker.internal:5433/lrda_api \
  -e BETTER_AUTH_SECRET=test-secret \
  -e BETTER_AUTH_URL=http://localhost:3002 \
  --add-host=host.docker.internal:host-gateway \
  lrda-api:test
curl http://localhost:3002/api/health  # expect 200
```

### Phase 2: Local prod stack
```bash
docker compose -f docker-compose.prod-local.yml up --build -d
curl http://localhost:8080/api/health   # through Nginx
curl http://localhost:3002/api/health   # direct to blue
docker compose -f docker-compose.prod-local.yml --profile green up -d api-green
curl http://localhost:3003/api/health   # direct to green
docker compose -f docker-compose.prod-local.yml --profile green down -v
```

### Phase 3: EC2 first deploy
```bash
ssh ubuntu@<ip> 'bash /home/ubuntu/lrda/scripts/deploy.sh'
curl https://api-staging.wherereligion.org/api/health  # 200
docker ps  # lrda-api-blue running
```

### Phase 4: Blue/green swap
```bash
# Run deploy again -- should swap to green
ssh ubuntu@<ip> 'bash /home/ubuntu/lrda/scripts/deploy.sh'
docker ps  # lrda-api-green running, blue stopped
```

### Phase 5: GitHub Actions
```
Actions > Deploy API > Run workflow > staging
Watch: tests -> SSH deploy -> external health check
```

---

## Notes

- **DB migrations are forward-only.** If a migration breaks the app, code rollback happens but schema stays at the new version. Manual intervention needed. Mitigation: always write backward-compatible migrations.
- **Docker image size:** Bun base ~150MB + bundled API ~2.2MB + drizzle-kit deps. Final image ~250MB. Two containers during deploy use ~200MB RAM total. t3.small (2GB) has plenty of headroom.
- **Certbot compatibility:** Certbot modifies the Nginx server block for SSL. The upstream config is in separate files (`/etc/nginx/conf.d/`), so certbot changes don't interfere with blue/green switching.
