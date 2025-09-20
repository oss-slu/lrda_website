#!/bin/bash

# Script to clear port 3000 for Playwright tests
echo "Clearing port 3000..."

# Kill any Next.js processes
pkill -f "next start" || true
pkill -f "next dev" || true

# Wait a moment for processes to fully terminate
sleep 2

echo "Port 3000 cleared. You can now run Playwright tests."
