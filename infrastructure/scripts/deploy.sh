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
        "http://localhost:${INACTIVE_PORT}/api/health" || echo "000")
    if [ "${HTTP_STATUS}" = "200" ]; then
        HEALTHY=true
        log "Health check passed (attempt ${i})"
        break
    fi
    log "Attempt ${i}/${HEALTH_RETRIES}: HTTP ${HTTP_STATUS}"
done

if [ "${HEALTHY}" = "false" ]; then
    log "FAILED -- ${INACTIVE} not healthy. Keeping ${ACTIVE} running."
    docker compose -f "${COMPOSE_FILE}" stop "api-${INACTIVE}" || true
    exit 1
fi

# ---- Switch Nginx upstream ----
log "Switching Nginx to ${INACTIVE} (:${INACTIVE_PORT})..."
echo "upstream lrda_api { server 127.0.0.1:${INACTIVE_PORT}; }" | \
    sudo tee "${UPSTREAM_FILE}" > /dev/null

if sudo nginx -t; then
    sudo systemctl reload nginx
    log "Nginx reloaded"
else
    log "ERROR: Nginx config test failed, rolling back"
    if [ "${ACTIVE}" != "none" ]; then
        echo "upstream lrda_api { server 127.0.0.1:${ACTIVE_PORT}; }" | \
            sudo tee "${UPSTREAM_FILE}" > /dev/null
    fi
    docker compose -f "${COMPOSE_FILE}" stop "api-${INACTIVE}" || true
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
docker image prune -f --filter "until=168h" || true

log "Deploy complete. Active: ${INACTIVE} on :${INACTIVE_PORT}"
log "Image: ${FULL_IMAGE}"
