#!/bin/bash
# Lightsail bootstrap script for LRDA API server
# Installs: Docker CE, PostgreSQL 17, Nginx
# API runs in Docker containers (blue/green), proxied through Nginx with Cloudflare Origin CA
set -e

# Log everything (POSIX-compatible -- Lightsail prepends a #!/bin/sh wrapper)
exec > /var/log/user-data.log 2>&1

echo "Starting LRDA server setup..."

# Update system
apt-get update
DEBIAN_FRONTEND=noninteractive apt-get upgrade -y

# Install Docker CE
curl -fsSL https://get.docker.com | bash
usermod -aG docker ubuntu

# Install PostgreSQL 17
curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | gpg --dearmor -o /usr/share/keyrings/postgresql-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/postgresql-archive-keyring.gpg] http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list
apt-get update
apt-get install -y postgresql-17

# Install Nginx
apt-get install -y nginx

# Install Cloudflare Origin CA certificate (injected by Terraform)
mkdir -p /etc/ssl/cloudflare
cat > /etc/ssl/cloudflare/origin.pem << 'CERT'
${origin_ca_cert}
CERT
cat > /etc/ssl/cloudflare/origin-key.pem << 'KEY'
${origin_ca_key}
KEY
chmod 600 /etc/ssl/cloudflare/origin-key.pem

# Configure PostgreSQL
# Quoted heredocs ('EOF') prevent shell from expanding $ in Terraform-resolved values
sudo -u postgres psql << 'EOF'
CREATE USER lrda_app;
CREATE DATABASE lrda_${environment} OWNER lrda_app;
GRANT ALL PRIVILEGES ON DATABASE lrda_${environment} TO lrda_app;
\c lrda_${environment}
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
EOF

# Set password with quoted heredoc (password may contain $ or other shell-special chars)
sudo -u postgres psql << 'EOF'
ALTER USER lrda_app PASSWORD '${db_password}';
EOF

# Configure PostgreSQL to allow local connections
echo "host lrda_${environment} lrda_app 127.0.0.1/32 md5" >> /etc/postgresql/17/main/pg_hba.conf
systemctl restart postgresql

# Create app and backup directories
mkdir -p /home/ubuntu/lrda
mkdir -p /home/ubuntu/lrda/logs
mkdir -p /home/ubuntu/backups/db
chown -R ubuntu:ubuntu /home/ubuntu/lrda
chown -R ubuntu:ubuntu /home/ubuntu/backups

# Generate a real BETTER_AUTH_SECRET
AUTH_SECRET=$(openssl rand -hex 32)

# Create environment file
# Quoted heredoc ('EOF') prevents shell expansion of $ in password and other values
cat > /home/ubuntu/lrda/.env << 'EOF'
ENVIRONMENT=${environment}
PORT=3002
DATABASE_URL=postgresql://lrda_app:${db_password_encoded}@localhost:5432/lrda_${environment}

# Better Auth
BETTER_AUTH_SECRET=__AUTH_SECRET__
BETTER_AUTH_URL=https://${api_subdomain}.${domain_name}
WEB_URL=https://${frontend_origin}

# CORS
CORS_ORIGINS=https://${frontend_origin}

# Email (Resend)
RESEND_API_KEY=
EMAIL_FROM=noreply@wheresreligion.org

# Google Maps (for reverse geocoding)
GOOGLE_MAPS_API_KEY=
EOF

# Inject generated auth secret (openssl rand -hex only produces [0-9a-f], safe for sed)
sed -i "s/__AUTH_SECRET__/$AUTH_SECRET/" /home/ubuntu/lrda/.env

chown ubuntu:ubuntu /home/ubuntu/lrda/.env
chmod 600 /home/ubuntu/lrda/.env

# Copy docker-compose.prod.yml to app directory
cat > /home/ubuntu/lrda/docker-compose.prod.yml << 'COMPOSE'
# Production Lightsail deployment
# PostgreSQL and Nginx run natively on the host.
# Only the API containers are managed by Docker.

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
      test: ["CMD", "node", "-e", "fetch('http://localhost:3002/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]
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
      test: ["CMD", "node", "-e", "fetch('http://localhost:3003/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]
      interval: 10s
      timeout: 3s
      start_period: 5s
      retries: 3
COMPOSE
chown ubuntu:ubuntu /home/ubuntu/lrda/docker-compose.prod.yml

# Copy deploy script
cat > /home/ubuntu/lrda/deploy.sh << 'DEPLOY'
#!/usr/bin/env bash
# Blue/green deploy script for LRDA API
# Usage: deploy.sh <image_tag>
set -euo pipefail

IMAGE_TAG="${1:?Usage: deploy.sh <image_tag>}"

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
    log "No active upstream found. First deploy, defaulting to blue."
    ACTIVE="none"; INACTIVE="blue"
    ACTIVE_PORT="0"; INACTIVE_PORT="${BLUE_PORT}"
fi

log "Active: ${ACTIVE} (:${ACTIVE_PORT}), deploying to: ${INACTIVE} (:${INACTIVE_PORT})"
log "Image tag: ${IMAGE_TAG}"

export IMAGE_TAG
export GITHUB_REPOSITORY="${GITHUB_REPOSITORY:?GITHUB_REPOSITORY must be set}"

FULL_IMAGE="ghcr.io/${GITHUB_REPOSITORY}/api:${IMAGE_TAG}"
log "Pulling image: ${FULL_IMAGE}"
docker pull "${FULL_IMAGE}"

log "Running database migrations (drizzle-kit push)..."
docker run --rm \
    --network host \
    --env-file "${APP_DIR}/.env" \
    "${FULL_IMAGE}" \
    npx drizzle-kit push

log "Starting ${INACTIVE} container..."
if [ "${INACTIVE}" = "green" ]; then
    docker compose -f "${COMPOSE_FILE}" --profile green up -d api-green
else
    docker compose -f "${COMPOSE_FILE}" up -d api-blue
fi

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

if [ "${ACTIVE}" != "none" ]; then
    log "Stopping old ${ACTIVE} container..."
    docker compose -f "${COMPOSE_FILE}" stop "api-${ACTIVE}"
fi

docker image prune -f --filter "until=168h" 2>/dev/null || true

log "Deploy complete. Active: ${INACTIVE} on :${INACTIVE_PORT}"
log "Image: ${FULL_IMAGE}"
DEPLOY
chmod +x /home/ubuntu/lrda/deploy.sh
chown ubuntu:ubuntu /home/ubuntu/lrda/deploy.sh

# Copy backup script
cat > /home/ubuntu/lrda/backup-db.sh << 'BACKUP'
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
BACKUP
chmod +x /home/ubuntu/lrda/backup-db.sh
chown ubuntu:ubuntu /home/ubuntu/lrda/backup-db.sh

# Initial Nginx upstream config (blue as default)
echo "upstream lrda_api { server 127.0.0.1:3002; }" > /etc/nginx/conf.d/upstream-blue.conf

# Configure Nginx for API-only (frontend is on Cloudflare Workers)
# NOTE: This heredoc is intentionally UNQUOTED so \$ becomes $ in the nginx config
cat > /etc/nginx/sites-available/lrda << NGINX
server {
    listen 80;
    server_name ${api_subdomain}.${domain_name};
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ${api_subdomain}.${domain_name};

    ssl_certificate     /etc/ssl/cloudflare/origin.pem;
    ssl_certificate_key /etc/ssl/cloudflare/origin-key.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;

    location / {
        proxy_pass http://lrda_api;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
NGINX

ln -sf /etc/nginx/sites-available/lrda /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# Set up daily database backup cron (3am UTC)
echo "0 3 * * * ubuntu /home/ubuntu/lrda/backup-db.sh >> /home/ubuntu/lrda/logs/backup.log 2>&1" > /etc/cron.d/lrda-backup
chmod 644 /etc/cron.d/lrda-backup

echo "LRDA server setup complete!"
echo ""
echo "Next steps:"
echo "1. Push a Docker image to GHCR"
echo "2. Run: GITHUB_REPOSITORY=<owner>/<repo> ./deploy.sh <image_tag>"
