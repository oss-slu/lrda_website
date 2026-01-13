#!/bin/bash
# Start Docker services and initialize LocalStack S3
# Usage: ./scripts/services-up.sh [--wait]
#   --wait: Keep the script running (for use with concurrently)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
COMPOSE_FILE="$ROOT_DIR/packages/server/docker-compose.yml"
LOCALSTACK_URL="http://localhost:4566"
BUCKET_NAME="livedreligion-local"

# Colors for output
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}[services]${NC} Starting Docker services..."
docker compose -f "$COMPOSE_FILE" up -d

echo -e "${BLUE}[services]${NC} Waiting for MongoDB..."
until docker compose -f "$COMPOSE_FILE" exec -T mongo mongosh --eval "db.adminCommand('ping')" &>/dev/null; do
  sleep 1
done
echo -e "${GREEN}[services]${NC} MongoDB is ready"

echo -e "${BLUE}[services]${NC} Waiting for LocalStack S3..."
until curl -s "$LOCALSTACK_URL/_localstack/health" 2>/dev/null | grep -q '"s3"'; do
  sleep 1
done
echo -e "${GREEN}[services]${NC} LocalStack is ready"

# Initialize S3 bucket
echo -e "${BLUE}[services]${NC} Initializing S3 bucket: $BUCKET_NAME"
aws --endpoint-url="$LOCALSTACK_URL" s3 mb "s3://$BUCKET_NAME" 2>/dev/null || true

aws --endpoint-url="$LOCALSTACK_URL" s3api put-bucket-policy --bucket "$BUCKET_NAME" --policy '{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::'"$BUCKET_NAME"'/*"
    }
  ]
}' 2>/dev/null || true

echo -e "${GREEN}[services]${NC} S3 bucket ready"

echo -e "${GREEN}[services]${NC} All services are up!"
echo -e "  ${YELLOW}MongoDB:${NC}        localhost:27017"
echo -e "  ${YELLOW}Mongo Express:${NC}  http://localhost:8081"
echo -e "  ${YELLOW}LocalStack S3:${NC}  http://localhost:4566"

# If --wait flag is passed, keep the script running
if [[ "$1" == "--wait" ]]; then
  echo -e "${BLUE}[services]${NC} Services running. Press Ctrl+C to stop all."
  # Wait indefinitely (will be killed by concurrently when user hits Ctrl+C)
  tail -f /dev/null
fi
