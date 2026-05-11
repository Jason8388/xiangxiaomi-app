#!/usr/bin/env bash
# 产物部署使用
set -euo pipefail

ROOT_DIR="$(pwd)"

HOST="${HOST:-0.0.0.0}"
PORT="${PORT:-5000}"

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
# 注意：Coze FaaS 文件系统是只读的，无法在运行时复制文件
# assets 已在构建时复制到 client/dist/assets/
info "跳过 assets 复制（只读文件系统）..."

# ============== 启动服务 ======================
# 检查核心命令
check_command "pnpm"
check_command "npm"

info "开始执行：pnpm run start (server)"
(pushd "$ROOT_DIR/server" > /dev/null && PORT="$PORT" NODE_ENV=production pnpm run start; popd > /dev/null) || error "服务启动失败"
info "服务启动完成！\n"
