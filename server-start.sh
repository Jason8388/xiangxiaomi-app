#!/bin/bash

# Backend Server Startup Script
# This script starts the backend server in the background

PROJECT_ROOT="/workspace/projects"
SERVER_DIR="$PROJECT_ROOT/server"
SERVER_PORT=9091

# Kill existing server process on port 9091
if command -v lsof &> /dev/null; then
  PIDS=$(lsof -t -i tcp:"$SERVER_PORT" -sTCP:LISTEN 2>/dev/null || true)
  if [ -n "$PIDS" ]; then
    kill -9 $PIDS 2>/dev/null || true
    sleep 1
  fi
fi

# Start backend server in background
cd "$SERVER_DIR"
NODE_ENV=development \
PORT="$SERVER_PORT" \
DB_HOST="${DB_HOST:-172.36.0.169}" \
DB_PORT="${DB_PORT:-59833}" \
DB_NAME="${DB_NAME:-postgres}" \
DB_USER="${DB_USER:-postgres}" \
DB_PASSWORD="${DB_PASSWORD:-postgres}" \
nohup npx tsx watch ./src/index.ts > /tmp/server.log 2>&1 &

echo "Backend server started on port $SERVER_PORT"
