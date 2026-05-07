#!/bin/bash
# Android 构建优化脚本
# 在 expo prebuild 之后、gradle 构建之前执行

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ANDROID_DIR="$ROOT_DIR/android"

echo "[INFO] Android 构建优化..."

if [ -d "$ANDROID_DIR" ] && [ -f "$ANDROID_DIR/gradle.properties" ]; then
  echo "[INFO] 优化 gradle.properties..."
  
  # 添加优化配置
  if ! grep -q "org.gradle.parallel=true" "$ANDROID_DIR/gradle.properties"; then
    echo "org.gradle.parallel=true" >> "$ANDROID_DIR/gradle.properties"
  fi
  
  if ! grep -q "org.gradle.caching=true" "$ANDROID_DIR/gradle.properties"; then
    echo "org.gradle.caching=true" >> "$ANDROID_DIR/gradle.properties"
  fi
  
  if ! grep -q "android.useAndroidX=true" "$ANDROID_DIR/gradle.properties"; then
    echo "android.useAndroidX=true" >> "$ANDROID_DIR/gradle.properties"
  fi
  
  if ! grep -q "android.enableJetifier=true" "$ANDROID_DIR/gradle.properties"; then
    echo "android.enableJetifier=true" >> "$ANDROID_DIR/gradle.properties"
  fi
  
  echo "[INFO] gradle.properties 优化完成"
else
  echo "[INFO] android 目录不存在，跳过优化（将在 expo prebuild 时生成）"
fi

echo "[INFO] Android 构建优化脚本执行完成"
