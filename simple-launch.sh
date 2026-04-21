#!/bin/bash

# Simple launcher script
# Starts both server and Expo and keeps running

echo "=========================================="
echo "  Starting Services"
echo "=========================================="

# Set variables
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SERVER_DIR="$ROOT_DIR/server"
CLIENT_DIR="$ROOT_DIR/client"
SERVER_PORT=9091
EXPO_PORT=5000

# Kill existing processes
echo "Cleaning up old processes..."
pkill -f "tsx watch.*src/index.ts" 2>/dev/null || true
pkill -f "expo start.*--web" 2>/dev/null || true
sleep 2

# Start server
echo "Starting server on port $SERVER_PORT..."
cd "$SERVER_DIR"
NODE_ENV=development \
PORT="$SERVER_PORT" \
DB_HOST="${DB_HOST:-172.36.0.169}" \
DB_PORT="${DB_PORT:-59833}" \
DB_NAME="${DB_NAME:-postgres}" \
DB_USER="${DB_USER:-postgres}" \
DB_PASSWORD="${DB_PASSWORD:-postgres}" \
npx tsx watch ./src/index.ts > /tmp/server.log 2>&1 &
SERVER_PID=$!
echo "Server started with PID: $SERVER_PID"

# Wait a bit for server
sleep 3

# Start Expo
echo "Starting Expo on port $EXPO_PORT..."
cd "$CLIENT_DIR"
EXPO_PUBLIC_BACKEND_BASE_URL="http://127.0.0.1:$SERVER_PORT" \
npx expo start --web --localhost --clear --port "$EXPO_PORT" > /tmp/expo.log 2>&1 &
EXPO_PID=$!
echo "Expo started with PID: $EXPO_PID"

# Wait for services
echo "Waiting for services to start..."
sleep 10

echo ""
echo "=========================================="
echo "  ✓ All Services Started"
echo "=========================================="
echo "Server: http://127.0.0.1:$SERVER_PORT"
echo "Expo:   http://127.0.0.1:$EXPO_PORT"
echo "=========================================="
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Keep running
while true; do
  # Check if processes are still running
  if ! kill -0 "$SERVER_PID" 2>/dev/null; then
    echo "[WARN] Server process died, exiting..."
    break
  fi
  if ! kill -0 "$EXPO_PID" 2>/dev/null; then
    echo "[WARN] Expo process died, exiting..."
    break
  fi
  sleep 5
done

# Cleanup
echo "Stopping all services..."
kill "$SERVER_PID" "$EXPO_PID" 2>/dev/null || true
