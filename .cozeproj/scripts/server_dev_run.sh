#!/bin/bash

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
SERVER_DIR="$ROOT_DIR/server"
CLIENT_DIR="$ROOT_DIR/client"
LOG_DIR="${COZE_LOG_DIR:-$ROOT_DIR/logs}"
LOG_SERVER_FILE="$LOG_DIR/server.log"
LOG_CLIENT_FILE="$LOG_DIR/client.log"
SERVER_PORT="${SERVER_PORT:-9091}"
EXPO_PORT="${EXPO_PORT:-5000}"

mkdir -p "$LOG_DIR"

pipe_to_log() {
  local source="${1:-SERVER}"
  local raw_log="${2:-}"
  local line clean_line timestamp
  while IFS= read -r line || [ -n "$line" ]; do
    clean_line=$(printf '%s' "$line" | sed 's/\x1b\[[0-9;]*[mA-Za-z]//g')
    if [ -n "$raw_log" ]; then
      timestamp=$(date '+%Y-%m-%d %H:%M:%S')
      echo "[$timestamp] $clean_line" >> "$raw_log"
    fi
    printf '[%s] %s\n' "$source" "$clean_line"
  done
}

kill_old_process() {
  local port=$1
  if command -v lsof &> /dev/null; then
    local pids
    pids=$(lsof -t -i tcp:"$port" -sTCP:LISTEN 2>/dev/null || true)
    if [ -n "$pids" ]; then
      echo "正在关闭端口 $port 的进程：$pids"
      kill -9 $pids 2>/dev/null || echo "关闭进程失败：$pids"
      sleep 1
    fi
  fi
}

echo "==================== Server Dev Run ===================="
echo "Server 目录：$SERVER_DIR"
echo "Expo 目录：$CLIENT_DIR"
echo "Server 端口：$SERVER_PORT"
echo "Expo 端口：$EXPO_PORT"
echo "日志文件：$LOG_SERVER_FILE, $LOG_CLIENT_FILE"
echo ""

kill_old_process $SERVER_PORT
kill_old_process $EXPO_PORT

echo "==================== 启动 Expo 服务 ===================="
echo "在后台启动 Expo 服务，端口 $EXPO_PORT"
cd "$CLIENT_DIR"
EXPO_PUBLIC_BACKEND_BASE_URL="${EXPO_PUBLIC_BACKEND_BASE_URL:-http://127.0.0.1:$SERVER_PORT}" \
npx expo start --web --localhost --clear --port "$EXPO_PORT" 2>&1 | pipe_to_log "EXPO" "$LOG_CLIENT_FILE" &
EXPO_PID=$!
disown $EXPO_PID 2>/dev/null || true
echo "Expo 服务已在后台启动，PID: $EXPO_PID"
echo ""

echo "==================== 启动 Server 服务 ===================="
echo "启动 server 服务，端口 $SERVER_PORT"
cd "$SERVER_DIR"
NODE_ENV=development \
PORT="$SERVER_PORT" \
DB_HOST="${DB_HOST:-172.36.0.169}" \
DB_PORT="${DB_PORT:-59833}" \
DB_NAME="${DB_NAME:-postgres}" \
DB_USER="${DB_USER:-postgres}" \
DB_PASSWORD="${DB_PASSWORD:-postgres}" \
npx tsx watch ./src/index.ts 2>&1 | pipe_to_log "SERVER" "$LOG_SERVER_FILE"
