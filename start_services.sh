#!/bin/bash

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
SERVER_PORT="9091"
EXPO_PORT="5000"
EXPO_PUBLIC_BACKEND_BASE_URL="${EXPO_PUBLIC_BACKEND_BASE_URL:-http://127.0.0.1:${SERVER_PORT}}"

export EXPO_PUBLIC_BACKEND_BASE_URL

echo "=================================="
echo "Starting services..."
echo "=================================="
echo "Server Port: $SERVER_PORT"
echo "Expo Port: $EXPO_PORT"
echo "Backend URL: $EXPO_PUBLIC_BACKEND_BASE_URL"
echo "=================================="

# Start server
echo ""
echo "Starting server..."
cd "$ROOT_DIR/server"
npm run dev > /dev/null 2>&1 &
SERVER_PID=$!
echo "Server started with PID: $SERVER_PID"

# Wait for server to be ready
echo "Waiting for server to be ready..."
for i in {1..30}; do
  if curl -s "http://127.0.0.1:$SERVER_PORT/api/v1/health" > /dev/null 2>&1; then
    echo "Server is ready!"
    break
  fi
  echo "Waiting for server... ($i/30)"
  sleep 2
done

# Start Expo
echo ""
echo "Starting Expo..."
cd "$ROOT_DIR/client"
npm start > /dev/null 2>&1 &
EXPO_PID=$!
echo "Expo started with PID: $EXPO_PID"

# Wait for Expo to be ready
echo "Waiting for Expo to be ready..."
for i in {1..60}; do
  if curl -s "http://127.0.0.1:$EXPO_PORT" > /dev/null 2>&1; then
    echo "Expo is ready!"
    break
  fi
  echo "Waiting for Expo... ($i/60)"
  sleep 2
done

echo ""
echo "=================================="
echo "All services started successfully!"
echo "=================================="
echo "Server PID: $SERVER_PID"
echo "Expo PID: $EXPO_PID"
echo "=================================="

# Keep script running
echo "Press Ctrl+C to stop all services..."
wait
