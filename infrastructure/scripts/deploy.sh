#!/bin/bash
# Deploy script for LRDA API on Lightsail
# Run on the server: ./deploy.sh [branch]
set -e

BRANCH="${1:-main}"
APP_DIR="/home/ubuntu/lrda"
REPO_URL="https://github.com/oss-slu/lrda_website.git"

echo "=== LRDA API Deploy ==="
echo "Branch: $BRANCH"
echo ""

# Clone or pull (git init handles pre-existing files from user-data)
if [ ! -d "$APP_DIR/.git" ]; then
  echo "Initializing repository..."
  cd "$APP_DIR"
  git init
  git remote add origin "$REPO_URL"
  git fetch origin
  git checkout -b "$BRANCH" "origin/$BRANCH"
else
  echo "Pulling latest changes..."
  cd "$APP_DIR"
  git fetch origin
  git checkout "$BRANCH"
  git pull origin "$BRANCH"
fi

cd "$APP_DIR"

# Symlink .env into API package (PM2 env_file loads root, but drizzle-kit needs it in packages/api)
if [ -f "$APP_DIR/.env" ] && [ ! -L "$APP_DIR/packages/api/.env" ]; then
  ln -sf "$APP_DIR/.env" "$APP_DIR/packages/api/.env"
fi

# Install dependencies
echo "Installing dependencies..."
pnpm install --frozen-lockfile

# Run database migrations
echo "Running database migrations..."
pnpm --filter @lrda/api db:push

# Restart API via PM2
echo "Restarting API server..."
if pm2 describe lrda-api > /dev/null 2>&1; then
  pm2 reload ecosystem.config.cjs
else
  pm2 start ecosystem.config.cjs
fi

pm2 save

# Health check
echo "Waiting for health check..."
sleep 3
if curl -sf http://localhost:3002/api/health > /dev/null; then
  echo ""
  echo "=== Deploy successful ==="
  pm2 status lrda-api
else
  echo ""
  echo "=== Health check failed ==="
  pm2 logs lrda-api --lines 20 --nostream
  exit 1
fi
