#!/usr/bin/env bash
# 产物部署使用
set -euo pipefail

ROOT_DIR="$(pwd)"

HOST="${HOST:-0.0.0.0}"
PORT="${PORT:-9091}"

# ==================== 工具函数 ====================
info() {
  echo "[INFO] $1"
}
warn() {
  echo "[WARN] $1"
}
error() {
  echo "[ERROR] $1"
  exit 1
}
check_command() {
  if ! command -v "$1" &> /dev/null; then
    error "命令 $1 未找到，请先安装"
  fi
}

# ============== 复制项目 assets 到服务端目录 ======================
info "开始复制项目 assets 目录..."
if [ -d "$ROOT_DIR/assets" ]; then
  mkdir -p "$ROOT_DIR/server/dist/assets"
  cp -r "$ROOT_DIR/assets/"* "$ROOT_DIR/server/dist/assets/" || warn "assets 复制失败，跳过"
fi

# ============== 创建 uploads 子目录（确保可写）======================
info "创建上传目录..."
mkdir -p "$ROOT_DIR/server/dist/assets/uploads" || warn "uploads 目录创建失败，跳过"
chmod 755 "$ROOT_DIR/server/dist/assets/uploads" || true

# ============== 启动服务 ======================
# 检查核心命令
check_command "pnpm"
check_command "npm"

info "开始执行：pnpm run start (server)"
(pushd "$ROOT_DIR/server" > /dev/null && PORT="$PORT" NODE_ENV=production pnpm run start; popd > /dev/null) || error "服务启动失败"
info "服务启动完成！\n"
