import { LLMClient, Config } from "coze-coding-dev-sdk";

const config = new Config();
const client = new LLMClient(config);

const systemPrompt = `你是一位专业的 DevOps 工程师和前端开发专家。请分析以下 Coze FaaS 平台部署失败的问题，提供详细的诊断报告和修复方案。

## 项目背景
- 项目类型：Expo 54 + React Native (前端) + Express.js (后端)
- 部署平台：Coze FaaS
- 问题：部署失败，APP 预览模式显示错误

## 测试报告内容

### 1. 构建配置检查
- prod_build.sh：包含删除 android 目录逻辑，防止触发 Android 构建
- .gitignore：已添加 client/android 和 server/.env 相关文件
- .coze 配置：前端端口 5000，后端端口 9091

### 2. 本地测试结果
- 前端 5000 端口：HTTP 200 ✅
- 后端 9091 端口：HTTP 200 ✅
- 页面路由测试：
  - /pc → HTTP 200 ✅
  - /pc/dashboard → HTTP 200 ✅
  - / → HTTP 200 ✅

### 3. 已知问题历史
- PC 路由重复注册：修复为删除 _layout.tsx 中重复的 Stack.Screen name="pc"
- oss-service.ts 缺失：已从 Git 历史恢复，使用环境变量管理凭证

### 4. 最新提交
- 3aa7e75: fix: 恢复 oss-service.ts，使用环境变量管理 OSS 凭证

### 5. 部署错误症状
- APP 预览模式显示 "found duplicate screen named 'pc'"
- 这是路由重复注册问题

请分析：
1. 部署失败的根本原因
2. 可能的潜在问题
3. 详细的修复方案
4. 部署前后的检查清单`;

async function main() {
  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: "请分析这个 Expo + Express 项目的 Coze FaaS 部署问题，并提供修复方案。" }
  ];

  console.log("正在调用豆包大模型分析部署问题...\n");
  console.log("=".repeat(60));

  const stream = client.stream(messages, {
    model: "doubao-seed-2-0-pro-260215",
    thinking: "enabled",
    temperature: 0.7,
  });

  let fullResponse = "";

  for await (const chunk of stream) {
    if (chunk.content) {
      const text = chunk.content.toString();
      process.stdout.write(text);
      fullResponse += text;
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("\n分析完成。");
}

main().catch(console.error);
