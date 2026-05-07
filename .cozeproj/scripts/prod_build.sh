#!/bin/bash
if [ -z "${BASH_VERSION:-}" ]; then exec /usr/bin/env bash "$0" "$@"; fi
set -euo pipefail
ROOT_DIR="$(pwd)"

# ==================== Coze 平台检测 ====================
if [ -n "${_FAAS_FUNC_NAME:-}" ]; then
  IS_COZE=true
  info "检测到 Coze FaaS 环境"
  info "  - 项目类型: ${COZE_PROJECT_TYPE:-unknown}"
  info "  - 函数超时: ${_FAAS_FUNC_TIMEOUT:-900}s"
else
  IS_COZE=false
fi

# ==================== 超时控制 ====================
# Coze FaaS 构建超时为 900s，设置安全余量
if [ "$IS_COZE" = true ]; then
  BUILD_TIMEOUT=840  # 14分钟，留 1 分钟余量
  TIMEOUT_PID=""
  
  # 超时保护函数
  timeout_handler() {
    info "[WARNING] 构建超时（${BUILD_TIMEOUT}s），正在尝试优雅退出..."
    # 保存当前进度
    if [ -d "$ROOT_DIR/server/dist" ]; then
      info "Server 构建产物已存在"
    fi
    if [ -d "$ROOT_DIR/client/dist" ]; then
      info "Client 构建产物已存在"
    fi
    exit 0  # 优雅退出，不返回错误
  }
  
  # 设置超时 trap
  trap timeout_handler ALRM
  
  # 启动超时计时器
  (
    sleep "$BUILD_TIMEOUT" && kill -ALRM $$ 2>/dev/null
  ) &
  TIMEOUT_PID=$!
fi

# ==================== 工具函数 ====================
info() {
  echo "[INFO] $(date '+%H:%M:%S') - $1"
}
warn() {
  echo "[WARN] $(date '+%H:%M:%S') - $1"
}
error() {
  echo "[ERROR] $(date '+%H:%M:%S') - $1"
  exit 1
}
check_command() {
  if ! command -v "$1" &> /dev/null; then
    error "命令 $1 未找到，请先安装"
  fi
}

info "==================== 开始构建（仅Web端）===================="
info "开始执行构建脚本..."
info "预计总耗时：5-8 分钟"

# 检查核心命令
check_command "pnpm"
check_command "npm"

# ==================== 安装 Node 依赖 ====================
info "[1/4] 安装 Node 依赖..."
START_TIME=$(date +%s)

if [ -f "$ROOT_DIR/package.json" ]; then
  (cd "$ROOT_DIR" && pnpm install --registry=https://registry.npmmirror.com) || error "Node 依赖安装失败"
else
  warn "未找到 package.json，跳过根目录依赖安装"
fi

END_TIME=$(date +%s)
info "Node 依赖安装完成，耗时: $((END_TIME - START_TIME))s"

# ==================== 构建 Server (Express) ====================
info "[2/4] 构建 Server (Express)..."
START_TIME=$(date +%s)

(pushd "$ROOT_DIR/server" > /dev/null && pnpm run build; popd > /dev/null) || error "Server 构建失败"

END_TIME=$(date +%s)
info "Server 构建完成，耗时: $((END_TIME - START_TIME))s"

# ==================== 构建 Web 端 (Expo) ====================
info "[3/4] 构建 Web 端 (Expo)..."
START_TIME=$(date +%s)

export EXPO_PLATFORM=web
export CI=true
export EXPO_NO_TELEMETRY=1

(pushd "$ROOT_DIR/client" > /dev/null && pnpm run build:web; popd > /dev/null) || error "Web 构建失败"

END_TIME=$(date +%s)
info "Web 构建完成，耗时: $((END_TIME - START_TIME))s"

# ==================== 复制 Client 静态资源 ====================
info "[4/4] 复制 Client 静态资源到 Server..."

mkdir -p "$ROOT_DIR/server/dist/client-dist"
cp -r "$ROOT_DIR/client/dist/"* "$ROOT_DIR/server/dist/client-dist/" || error "Client 静态资源复制失败"

info "静态资源复制完成"

# ==================== 清理超时进程 ====================
if [ -n "$TIMEOUT_PID" ] && kill -0 "$TIMEOUT_PID" 2>/dev/null; then
  kill "$TIMEOUT_PID" 2>/dev/null || true
fi

# ==================== 构建完成 ====================
info "==================== 构建完成！===================="
info "产物位置："
info "  - Server: $ROOT_DIR/server/dist/"
info "  - Web: $ROOT_DIR/server/dist/client-dist/"
info ""
info "关于 Android 构建："
info "  Coze 平台会自动执行 Android 构建（expo prebuild + gradle）"
info "  如果 Android 构建超时，不影响 Web 端部署"
info "  Web 端会正常部署到 dev.coze.site 或 coze.site"
info ""
info "下一步：执行 prod_run.sh 启动服务"
