#!/bin/bash
if [ -z "${BASH_VERSION:-}" ]; then exec /usr/bin/env bash "$0" "$@"; fi
set -euo pipefail
ROOT_DIR="$(pwd)"

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

info "==================== 开始构建（仅Web端）===================="
info "开始执行构建脚本（prod_build.sh）..."
info "正在检查依赖命令是否存在..."
# 检查核心命令
check_command "pnpm"
check_command "npm"

# ==================== 安装 Node 依赖 ====================
info "==================== 安装 Node 依赖 ===================="
info "开始安装 Node 依赖"
if [ -f "$ROOT_DIR/package.json" ]; then
  info "进入目录：$ROOT_DIR"
  info "正在执行：pnpm install"
  (cd "$ROOT_DIR" && pnpm install --registry=https://registry.npmmirror.com) || error "Node 依赖安装失败"
else
  warn "未找到 $ROOT_DIR/package.json 文件，请检查路径是否正确"
fi

# ==================== 强制删除 Android 目录 ====================
info "==================== 删除 Android 目录 ===================="
if [ -d "$ROOT_DIR/client/android" ]; then
  info "发现 client/android 目录，正在删除..."
  rm -rf "$ROOT_DIR/client/android"
  info "client/android 目录已删除"
else
  info "未发现 client/android 目录，跳过"
fi

# 防止 expo prebuild 重新生成 android 目录
info "==================== 标记禁用 Android 构建 ===================="
echo "androidBlocked=true" >> "$ROOT_DIR/client/.android-blocked"
info "Android 构建已被禁用"
info "==================== 依赖安装完成！====================\n"

# ==================== 构建 Server (Express) ====================
info "==================== 构建 Server ===================="
info "开始执行：pnpm run build (server)"
(pushd "$ROOT_DIR/server" > /dev/null && pnpm run build; popd > /dev/null) || error "Server 构建失败"
info "==================== Server 构建完成！====================\n"

# ==================== 构建 Web 端 (Expo) ====================
info "==================== 构建 Web 端 ===================="
info "开始执行：pnpm run build:web (Expo)"
# 设置环境变量，只构建 web 平台
export EXPO_PLATFORM=web
export CI=true
(pushd "$ROOT_DIR/client" > /dev/null && pnpm run build:web; popd > /dev/null) || error "Web 构建失败"
info "==================== Web 构建完成！====================\n"

# ==================== 复制 Client 静态资源到 Server ====================
info "==================== 复制 Client 静态资源 ===================="
mkdir -p "$ROOT_DIR/server/dist/client-dist"
cp -r "$ROOT_DIR/client/dist/"* "$ROOT_DIR/server/dist/client-dist/" || error "Client 静态资源复制失败"
info "Client 静态资源已复制到 server/dist/client-dist/"

# ==================== 复制项目根目录 assets 到 client/dist/assets ====================
info "==================== 复制项目 assets 目录 ===================="
if [ -d "$ROOT_DIR/assets" ]; then
  # 确保 client/dist/assets 目录存在
  mkdir -p "$ROOT_DIR/client/dist/assets"
  # 复制项目根目录 assets 到 client/dist/assets
  cp -r "$ROOT_DIR/assets/"* "$ROOT_DIR/client/dist/assets/" || warn "项目 assets 复制失败，跳过"
  info "项目 assets 目录已复制到 client/dist/assets/"
  # 创建 uploads 子目录
  mkdir -p "$ROOT_DIR/client/dist/assets/uploads"
else
  info "未发现项目根目录 assets 目录，跳过"
fi
info "==================== 静态资源复制完成！====================\n"
info "产物位置："
info "  - Server: $ROOT_DIR/server/dist/"
info "  - Web: $ROOT_DIR/client/dist/"
info ""
info "下一步：执行 ./prod_run.sh 启动服务"
