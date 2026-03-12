# Docker Blue/Green Zero-Downtime Deployment

## Context

The LRDA API runs on a single Lightsail instance ($10/mo, 2GB RAM) with Docker containers managed by a blue/green deploy script. Deploys are triggered via GitHub Actions, which builds a Docker image, pushes it to GHCR, then SSHs into Lightsail to pull and swap containers with zero downtime.

**Cost impact:** $0 additional -- Docker CE is free, same single Lightsail instance.

---

## Architecture

### Production (Lightsail)

```
  GitHub Actions (CI)                        Lightsail (2GB RAM)
  +--------------------------+
  | test -> build image      |   docker pull   [Nginx (native, systemd)]
  | -> push to GHCR          | ----SSH----->     port 80/443 + Cloudflare Origin CA
  +--------------------------+                          |
                                              upstream lrda_api
                                                        |
                                           +------------+------------+
                                           |                         |
                                  [lrda-api-blue]          [lrda-api-green]
                                   Docker :3002              Docker :3003
                                           |                         |
                                           +------------+------------+
                                                        |
                                               [PostgreSQL 17 (native)]
                                                    port 5432
```

- Docker images are built in GitHub Actions (7GB RAM) and pushed to GHCR -- the Lightsail instance (2GB RAM) only pulls pre-built images
- PostgreSQL 17 runs natively via systemd (already set up by user-data.sh)
- Nginx runs natively with Cloudflare Origin CA cert for SSL
- Only the API runs in Docker containers (blue on port 3002, green on port 3003)
- At any given time, only one container serves traffic; the other is stopped or being deployed

### Local Testing (mirrors production)

```
      [Nginx (Docker)] :8080
               |
      [api-blue (Docker)] :3002   [api-green (Docker)] :3003
               |                           |
      [PostgreSQL 17 (Docker)] :5434
```

Same Dockerfile, same topology. Tests the full deploy flow before pushing to Lightsail.

---

## Blue/Green Switching Mechanism

### How It Works

**State tracking:** A single Nginx upstream config file at `/etc/nginx/conf.d/upstream-api.conf`. The deploy script reads the port number from this file to determine which color is active, then overwrites it to switch.

- `upstream lrda_api { server 127.0.0.1:3002; }` = Blue serving traffic
- `upstream lrda_api { server 127.0.0.1:3003; }` = Green serving traffic

**Deploy flow:**

1. GitHub Actions builds Docker image and pushes to GHCR (tagged `sha-<commit>` + `latest`)
2. GitHub Actions SSHs into Lightsail and runs `deploy.sh <image_tag>`
3. deploy.sh reads the port from `upstream-api.conf` to determine active color
4. Pull pre-built image from GHCR (no build on Lightsail -- saves RAM/CPU)
5. Run `drizzle-kit migrate` from a temporary container (applies unapplied migrations)
6. Start inactive color container on its port
7. Health check new container directly (bypasses Nginx, hits container port)
8. If healthy: overwrite `upstream-api.conf` with new port, reload Nginx
9. Wait 5s for old Nginx workers to drain, then stop old container
10. If unhealthy: stop new container, keep old running (automatic rollback)

**Why this approach:**

- `nginx reload` is graceful -- new workers fork with new config while old workers finish existing connections. No dropped requests.
- Health check bypasses Nginx to test the container directly before switching traffic
- Rollback is automatic on failure -- old container never stops if new one is unhealthy
- Single upstream file is simpler than managing multiple `.conf`/`.disabled` files

---

## Files

### 1. `packages/api/Dockerfile`

Three-stage Node.js build (deps -> build -> runtime):

```dockerfile
# ---- Stage 1: Install dependencies ----
FROM node:24-slim AS deps

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.20.0 --activate

# Copy workspace configuration + package.json files only (cache layer)
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc* ./
COPY packages/api/package.json packages/api/
COPY packages/shared/package.json packages/shared/

# Install all deps (devDependencies needed for tsc build + drizzle-kit migrations)
# --no-optional skips firebase-admin (~100MB, only needed for sync scripts)
RUN pnpm install --frozen-lockfile --no-optional

# ---- Stage 2: Build ----
FROM node:24-slim AS build

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.20.0 --activate

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/api/node_modules ./packages/api/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules

# Copy source (shared package exports raw .ts, needed at compile time)
COPY packages/shared/ packages/shared/
COPY packages/api/ packages/api/

# Compile TypeScript -> dist/
WORKDIR /app/packages/api
RUN npx tsc --project tsconfig.build.json

# ---- Stage 3: Runtime ----
FROM node:24-slim AS runtime

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.20.0 --activate

# Copy compiled JS output
COPY --from=build /app/packages/api/dist/ ./packages/api/dist/

# Copy shared package source -- tsx needed at runtime because @lrda/shared
# exports raw .ts files and tsc doesn't rewrite import paths
COPY --from=build /app/packages/shared/ ./packages/shared/

# Copy node_modules (includes drizzle-kit for running migrations during deploy)
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/api/node_modules ./packages/api/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules

# Copy package.json files (needed for pnpm workspace resolution)
COPY --from=deps /app/package.json ./
COPY --from=deps /app/pnpm-workspace.yaml ./
COPY --from=deps /app/packages/api/package.json ./packages/api/
COPY --from=deps /app/packages/shared/package.json ./packages/shared/

# Copy drizzle config, schema, and migration files (needed for drizzle-kit migrate during deploy)
COPY --from=build /app/packages/api/drizzle.config.ts ./packages/api/
COPY --from=build /app/packages/api/src/db/schema.ts ./packages/api/src/db/
COPY --from=build /app/packages/api/drizzle/ ./packages/api/drizzle/

WORKDIR /app/packages/api

USER node
ENV NODE_ENV=production
EXPOSE 3002

HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://localhost:' + (process.env.PORT || 3002) + '/api/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

# tsx registers as a loader so @lrda/shared .ts imports resolve at runtime
CMD ["node", "--import", "tsx", "dist/index.js"]
```

**Key design decisions:**

- `--no-optional` skips `firebase-admin` (~100MB) -- only needed for sync scripts which don't run in the container
- `tsx` is required at runtime because `@lrda/shared` exports raw `.ts` files and `tsc` doesn't rewrite import specifiers (e.g., `from '@lrda/shared/schemas'` resolves to `packages/shared/src/schemas/index.ts`)
- `drizzle-kit` + schema + migration files are included so deploy.sh can run `drizzle-kit migrate` from a temporary container
- `~300MB` image, `~200MB` RAM per container

### 2. `.dockerignore` (root)

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
.claude/
```

### 3. `packages/api/.dockerignore`

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
src/scripts/
vitest.config.ts
README.md
```

### 4. `infrastructure/nginx/local.conf`

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

### 5. `docker-compose.prod-local.yml` (root)

Local prod-like stack:

```yaml
# Local production-like testing stack
# Usage: docker compose -f docker-compose.prod-local.yml up --build -d
#
# Mirrors Lightsail production topology:
#   - PostgreSQL 17 (like native PG on Lightsail)
#   - Two API containers for blue/green testing
#   - Nginx reverse proxy with upstream switching

services:
  postgres:
    image: postgres:17-alpine
    container_name: lrda-prod-local-pg
    restart: unless-stopped
    ports:
      - '5434:5432' # Different host port to avoid conflict with dev PG on 5433
    environment:
      POSTGRES_USER: lrda_app
      POSTGRES_PASSWORD: lrda_local_prod
      POSTGRES_DB: lrda_production
    volumes:
      - prod_local_pg_data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U lrda_app -d lrda_production']
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
      - '3002:3002'
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
      - '3003:3002'
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
      - green # Only started when explicitly requested
    networks:
      - lrda-prod-local

  nginx:
    image: nginx:alpine
    container_name: lrda-prod-local-nginx
    ports:
      - '8080:80'
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

### 6. `docker-compose.prod.yml` (root -- deployed to Lightsail)

API containers only (PostgreSQL + Nginx are native on Lightsail):

```yaml
# Production Lightsail deployment
# PostgreSQL and Nginx run natively on the host.
# Only the API containers are managed by Docker.
#
# Images are pre-built in CI and pushed to GHCR.
# IMAGE_TAG is set by deploy.sh before running docker compose.
# Uses network_mode: host so containers bind directly to host ports
# and can reach PostgreSQL on localhost:5432 without bridge networking.

services:
  api-blue:
    image: ghcr.io/${GITHUB_REPOSITORY}/api:${IMAGE_TAG:-latest}
    container_name: lrda-api-blue
    restart: unless-stopped
    network_mode: host
    env_file:
      - .env
    environment:
      PORT: 3002
    healthcheck:
      test:
        [
          'CMD',
          'node',
          '-e',
          "fetch('http://localhost:3002/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))",
        ]
      interval: 10s
      timeout: 3s
      start_period: 5s
      retries: 3

  api-green:
    image: ghcr.io/${GITHUB_REPOSITORY}/api:${IMAGE_TAG:-latest}
    container_name: lrda-api-green
    restart: unless-stopped
    network_mode: host
    env_file:
      - .env
    environment:
      PORT: 3003
    profiles:
      - green
    healthcheck:
      test:
        [
          'CMD',
          'node',
          '-e',
          "fetch('http://localhost:3003/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))",
        ]
      interval: 10s
      timeout: 3s
      start_period: 5s
      retries: 3
```

With `network_mode: host`, each container binds directly to the host's network stack. Blue listens on host port 3002, green on 3003. PostgreSQL is reachable at `localhost:5432` with no extra networking config. The `.env` file on Lightsail uses `DATABASE_URL=postgresql://lrda_app:<password>@localhost:5432/lrda_<env>` -- same as a non-Docker setup.

### 7. `infrastructure/scripts/deploy.sh`

Blue/green deploy script (runs on Lightsail via SSH from GitHub Actions). Takes an image tag as argument -- the image is pre-built in CI and pulled from GHCR.

```bash
#!/usr/bin/env bash
# Blue/green deploy script for LRDA API
# Usage: deploy.sh <image_tag>
# Example: deploy.sh sha-abc1234
set -euo pipefail

IMAGE_TAG="${1:?Usage: deploy.sh <image_tag>}"

APP_DIR="/home/ubuntu/lrda"
COMPOSE_FILE="${APP_DIR}/docker-compose.prod.yml"
NGINX_CONF_DIR="/etc/nginx/conf.d"
UPSTREAM_FILE="${NGINX_CONF_DIR}/upstream-api.conf"
BLUE_PORT=3002
GREEN_PORT=3003
HEALTH_RETRIES=20
HEALTH_DELAY=3
LOG_PREFIX="[deploy]"

log() { echo "${LOG_PREFIX} $(date -u +%H:%M:%S) $*"; }

cd "${APP_DIR}"

# ---- Determine active color by reading current upstream port ----
if [ -f "${UPSTREAM_FILE}" ]; then
    CURRENT_PORT=$(grep -oE '[0-9]+' "${UPSTREAM_FILE}" | tail -1)
    if [ "${CURRENT_PORT}" = "${BLUE_PORT}" ]; then
        ACTIVE="blue"; INACTIVE="green"
        ACTIVE_PORT="${BLUE_PORT}"; INACTIVE_PORT="${GREEN_PORT}"
    elif [ "${CURRENT_PORT}" = "${GREEN_PORT}" ]; then
        ACTIVE="green"; INACTIVE="blue"
        ACTIVE_PORT="${GREEN_PORT}"; INACTIVE_PORT="${BLUE_PORT}"
    else
        log "Unknown port ${CURRENT_PORT}. Defaulting to blue."
        ACTIVE="none"; INACTIVE="blue"
        ACTIVE_PORT="0"; INACTIVE_PORT="${BLUE_PORT}"
    fi
else
    log "No upstream config found. First deploy, defaulting to blue."
    ACTIVE="none"; INACTIVE="blue"
    ACTIVE_PORT="0"; INACTIVE_PORT="${BLUE_PORT}"
fi

log "Active: ${ACTIVE} (:${ACTIVE_PORT}), deploying to: ${INACTIVE} (:${INACTIVE_PORT})"
log "Image tag: ${IMAGE_TAG}"

# ---- Pull pre-built image from GHCR ----
export IMAGE_TAG
export GITHUB_REPOSITORY="${GITHUB_REPOSITORY:?GITHUB_REPOSITORY must be set}"

FULL_IMAGE="ghcr.io/${GITHUB_REPOSITORY}/api:${IMAGE_TAG}"
log "Pulling image: ${FULL_IMAGE}"
docker pull "${FULL_IMAGE}"

# ---- Run database migrations ----
log "Running database migrations..."
docker run --rm \
    --network host \
    --env-file "${APP_DIR}/.env" \
    "${FULL_IMAGE}" \
    pnpm exec drizzle-kit migrate

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
    exit 1
fi

# ---- Switch Nginx upstream ----
log "Switching Nginx to ${INACTIVE} (:${INACTIVE_PORT})..."
echo "upstream lrda_api { server 127.0.0.1:${INACTIVE_PORT}; }" | \
    sudo tee "${UPSTREAM_FILE}" > /dev/null

if sudo nginx -t 2>/dev/null; then
    sudo systemctl reload nginx
    log "Nginx reloaded"
else
    log "ERROR: Nginx config test failed, rolling back"
    if [ "${ACTIVE}" != "none" ]; then
        echo "upstream lrda_api { server 127.0.0.1:${ACTIVE_PORT}; }" | \
            sudo tee "${UPSTREAM_FILE}" > /dev/null
    fi
    docker compose -f "${COMPOSE_FILE}" stop "api-${INACTIVE}" 2>/dev/null || true
    exit 1
fi

# ---- Drain old connections, then stop old container ----
if [ "${ACTIVE}" != "none" ]; then
    log "Waiting for old Nginx workers to drain..."
    sleep 5
    log "Stopping old ${ACTIVE} container..."
    docker compose -f "${COMPOSE_FILE}" stop "api-${ACTIVE}"
fi

# ---- Cleanup old images ----
docker image prune -f --filter "until=168h" 2>/dev/null || true

log "Deploy complete. Active: ${INACTIVE} on :${INACTIVE_PORT}"
log "Image: ${FULL_IMAGE}"
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
  push:
    branches: [301-improve-admin]
    paths:
      - 'packages/api/**'
      - 'packages/shared/**'
      - 'pnpm-lock.yaml'
  workflow_dispatch:
    inputs:
      environment:
        description: 'Target environment'
        required: true
        default: 'staging'
        type: choice
        options:
          - staging

permissions:
  contents: read

concurrency:
  group: deploy-api
  cancel-in-progress: false

jobs:
  unit-tests:
    name: Unit Tests
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 10.20.0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '24.x'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run unit tests
        run: pnpm test:unit --silent --no-coverage
        env:
          VITE_API_URL: 'http://localhost:3002'
          VITE_OPENAI_API_KEY: 'mock-openai-key'
          VITE_OPENAI_API_URL: 'https://api.openai.com/v1'
          CI: 'true'
          SUPPRESS_CONSOLE: 'true'

  build-and-push:
    name: Build & Push Docker Image
    needs: unit-tests
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    outputs:
      image_tag: ${{ steps.meta.outputs.version }}

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ghcr.io/${{ github.repository }}/api
          tags: |
            type=sha,prefix=sha-
            type=raw,value=latest

      - name: Build and push
        uses: docker/build-push-action@v6
        with:
          context: .
          file: packages/api/Dockerfile
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy:
    name: Deploy to ${{ github.event.inputs.environment || 'staging' }}
    needs: build-and-push
    runs-on: ubuntu-latest
    environment: ${{ github.event.inputs.environment || 'staging' }}
    permissions:
      contents: read
      packages: read

    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.LIGHTSAIL_HOST }}
          username: ubuntu
          key: ${{ secrets.LIGHTSAIL_SSH_PRIVATE_KEY }}
          command_timeout: 10m
          script: |
            set -e
            echo "${{ secrets.GITHUB_TOKEN }}" | docker login ghcr.io -u ${{ github.actor }} --password-stdin
            export GITHUB_REPOSITORY="${{ github.repository }}"
            export IMAGE_TAG="${{ needs.build-and-push.outputs.image_tag }}"
            sudo -E /home/ubuntu/lrda/deploy.sh "${IMAGE_TAG}"

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
```

---

## Files Modified

### 10. `infrastructure/scripts/user-data.sh`

Key changes from the original PM2-based setup:

- **Removed**: Node.js installation (`nodesource`), pnpm global install, PM2 installation, PM2 ecosystem config, PM2 systemd setup (`pm2 startup`)
- **Added**: Docker CE installation (`curl -fsSL https://get.docker.com | bash`), `usermod -aG docker ubuntu`
- **Changed**: Nginx `proxy_pass` from `http://localhost:3002` to `http://lrda_api` (upstream block in separate file)
- **Added**: Initial Nginx upstream config: `upstream-api.conf` in `/etc/nginx/conf.d/`
- **Added**: Copy `docker-compose.prod.yml` and `deploy.sh` to `/home/ubuntu/lrda/`
- **Added**: Backup cron: `0 3 * * *`
- **Added**: Directories: `/home/ubuntu/lrda/logs`, `/home/ubuntu/backups/db`
- **Kept**: PostgreSQL 17, Cloudflare Origin CA cert, `.env` file, Nginx SSL config

Note: With `network_mode: host`, containers access PostgreSQL at `localhost:5432` directly. No `pg_hba.conf` or `listen_addresses` changes needed beyond the existing `127.0.0.1/32` entry.

---

## GitHub Secrets

| Secret                      | Description                       |
| --------------------------- | --------------------------------- |
| `LIGHTSAIL_SSH_PRIVATE_KEY` | PEM content of Lightsail key pair |
| `LIGHTSAIL_HOST`            | Static IP (see SSH Access below)  |
| `API_DOMAIN`                | `api-staging.wheresreligion.org`  |

`GITHUB_TOKEN` (automatic) handles GHCR auth with `packages: write` permission. No separate `GHCR_TOKEN` PAT is needed.

Optional: Create GitHub Environments (`staging`, `production`) with required reviewers on `production`.

---

## SSH Access

| | Staging |
|---|---|
| **Host** | `44.219.215.8` |
| **User** | `ubuntu` |
| **Key** | `~/.ssh/lrda-ec2.pem` |
| **Instance** | `lrda-staging` |

```bash
ssh -i ~/.ssh/lrda-ec2.pem ubuntu@44.219.215.8
```

Key files on the server:
- `/home/ubuntu/lrda/.env` -- environment variables
- `/home/ubuntu/lrda/docker-compose.prod.yml` -- Docker Compose config
- `/home/ubuntu/lrda/deploy.sh` -- blue/green deploy script
- `/etc/nginx/conf.d/upstream-api.conf` -- active Nginx upstream

---

## Database Migrations

Migrations use `drizzle-kit migrate` (not `push`). Migration files live in `packages/api/drizzle/` and are tracked in the `drizzle.__drizzle_migrations` table in PostgreSQL.

**Schema change workflow:**
1. Edit `packages/api/src/db/schema.ts`
2. Run `pnpm api:db:generate` -- creates a new numbered migration file in `packages/api/drizzle/`
3. Review the generated SQL
4. Commit and push
5. Deploy -- the script runs `drizzle-kit migrate` which applies only unapplied migrations

**Migrations are forward-only.** If a migration breaks the app, code rollback happens but schema stays at the new version. Manual intervention needed. Mitigation: always write backward-compatible migrations and review generated SQL before committing.

---

## Verification Checklist

### Phase 1: Docker build

```bash
docker build -t lrda-api:test -f packages/api/Dockerfile .
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

### Phase 3: Lightsail first deploy

```bash
tofu destroy && tofu apply  # Fresh instance with Docker CE
# Upload compose + deploy files, push image to GHCR, run deploy.sh
curl https://api-staging.wheresreligion.org/api/health  # 200
docker ps  # lrda-api-blue running
```

### Phase 4: Blue/green swap

```bash
# Deploy again with a new image tag -- should swap to green
docker ps  # lrda-api-green running, blue stopped
```

### Phase 5: GitHub Actions

```
Actions > Deploy API > Run workflow > staging
Watch: tests -> build -> SSH deploy -> external health check
```

---

## Notes

- **Graceful shutdown is already implemented.** The API handles SIGTERM/SIGINT in `src/index.ts`: it closes the HTTP server and drains the DB connection pool. `docker compose stop` sends SIGTERM, so in-flight requests complete before the container exits.
- **Docker image size:** Node 24 slim base ~200MB + compiled API + node_modules. Final image ~300MB. Two containers during deploy use ~400MB RAM total. Lightsail (2GB) has enough headroom with PostgreSQL and Nginx also running.
- **SSL:** Cloudflare Origin CA cert (15-year, no renewal). Generated via OpenTofu (`infrastructure/cloudflare.tf`), installed on Lightsail at `/etc/ssl/cloudflare/`. The upstream config is in a separate file (`/etc/nginx/conf.d/upstream-api.conf`), so SSL config doesn't interfere with blue/green switching.
- **CORS is handled by the API, not Nginx.** The Hono CORS middleware in `src/index.ts` manages `Access-Control-Allow-*` headers based on `CORS_ORIGINS` env var. The Nginx config should NOT add its own CORS headers.
- **`network_mode: host` trade-off:** Using host networking is simpler (no port mapping, no bridge config for PostgreSQL) but means containers can't use the same port simultaneously. Blue gets 3002, green gets 3003 -- they must use different `PORT` env values.
- **tsx at runtime:** Required because `@lrda/shared` exports raw `.ts` files via its `package.json` exports map (`"main": "./src/index.ts"`). `tsc` compiles the API code but doesn't rewrite import specifiers, so the compiled JS still imports from `@lrda/shared` which resolves to `.ts` files. `tsx` registers as a Node.js loader to handle this transparently.
- **deploy.sh is NOT auto-synced from git.** The server's copy at `/home/ubuntu/lrda/deploy.sh` is only updated when: (a) a new instance is provisioned via Terraform/user-data.sh, or (b) you manually `scp` it over. If you change the script in git, remember to copy it to the server.
