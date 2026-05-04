#!/usr/bin/env bash
# Pings the health endpoint every second and logs status + deploy slot.
# Usage: ./scripts/health-ping.sh

URL="https://api-staging.wheresreligion.org/api/health"
DOWN_COUNT=0

while true; do
  BODY=$(curl -sf "$URL" 2>/dev/null)
  if [ $? -eq 0 ]; then
    SLOT=$(echo "$BODY" | grep -o '"slot":"[^"]*"' | cut -d'"' -f4)
    SLOT_LABEL="${SLOT:-unknown}"
    echo "$(date +%T) OK (200) [$SLOT_LABEL]"
  else
    DOWN_COUNT=$((DOWN_COUNT + 1))
    echo "$(date +%T) DOWN [total downtime: ${DOWN_COUNT}s]"
  fi
  sleep 1
done
