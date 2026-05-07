# Coze FaaS 部署问题修复报告

## 问题分析

### 核心问题
Coze FaaS 平台会自动检测 `client/android/` 目录并触发 Android 构建流程（`expo prebuild` + Gradle），即使 `prod_build.sh` 只配置了 Web 端构建。

### 症状
1. Android 构建因 Google Maven 429 速率限制而失败
2. 15 分钟超时（`_FAAS_FUNC_TIMEOUT=900`）导致构建被中断
3. 构建日志被截断，无法看到最终结果

### 受影响的日志片段
```
[HTTP HTTP/1.1 429 Too Many Requests: https://dl.google.com/dl/android/maven2/com/android/tools/sdklib/30.1.1/sdklib-30.1.1.module)]
```

## 解决方案

### 方案：在构建脚本中删除 Android 目录

修改了 `.cozeproj/scripts/prod_build.sh`，在构建开始时删除 `client/android/` 目录：

```bash
# ==================== 禁用 Android 构建 ====================
# Coze 平台会自动检测 android/ 目录并触发 Android 构建
# 删除 android/ 目录可以避免触发 Android 构建，节省时间和避免 429 限流问题
if [ -d "$ROOT_DIR/client/android" ]; then
  info "[0/5] 删除 Android 目录以禁用 Coze 自动 Android 构建..."
  rm -rf "$ROOT_DIR/client/android"
  info "Android 目录已删除，Coze 平台将跳过 Android 构建"
fi
```

### 优势
1. **避免 429 限流**：不再访问 Google Maven 仓库
2. **节省时间**：跳过 Android 构建（通常需要 10-15 分钟）
3. **提高成功率**：Web 端构建通常在 3-5 分钟内完成
4. **不影响 Web 部署**：仅禁用 Android 构建，Web 端仍正常部署

### 劣势
- Android 应用需要通过 EAS Build 单独构建
- 不影响通过 Expo Go 或 Web 访问应用

## 修改的文件

### `.cozeproj/scripts/prod_build.sh`
- 添加了删除 `client/android/` 目录的逻辑
- 更新了构建步骤编号为 [0/5] 到 [4/5]
- 更新了日志输出，说明已禁用 Android 构建

## 后续步骤

### 1. 重新触发部署
在 Coze 平台上重新触发部署，构建日志应显示：
```
[0/5] 删除 Android 目录以禁用 Coze 自动 Android 构建...
[1/5] 安装 Node 依赖...
...
==================== 构建完成！====================
```

### 2. 验证部署结果
- 访问 `dev.coze.site` 或 `coze.site` 检查 Web 端
- 检查 Coze 平台部署状态（应该不再有 Android 构建失败）

### 3. Android 应用构建（可选）
如果需要 Android APK，可以：
- 使用 EAS Build：`eas build --platform android --local`
- 或通过 EAS Online 构建

## 预期结果

修改后：
- ✅ 构建时间从 10-15 分钟缩短到 3-5 分钟
- ✅ 避免 Google Maven 429 限流问题
- ✅ Web 端正常部署
- ✅ 不再出现 Android 构建失败

## 日期
2026-05-08
