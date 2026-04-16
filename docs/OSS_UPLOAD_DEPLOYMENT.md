# 阿里云 OSS 文件上传功能 - 部署配置指南

## 功能说明

本功能实现了安全的阿里云 OSS 文件上传功能，采用前后端分离架构：
- **前端（Expo）**：选择本地文件，上传到后端
- **后端（Express）**：接收文件，使用阿里云 OSS SDK 上传到 OSS
- **阿里云 OSS**：提供文件存储和公网访问

## 安全架构

```
客户端 (Expo)  →  后端 (Express)  →  阿里云 OSS
    ↓                  ↓                 ↓
  文件选择          OSS SDK 上传        永久存储
  (不暴露密钥)      (环境变量存储)     (公网访问)
```

**为什么这样设计？**
- 前端直接使用 AccessKey 会暴露密钥（极不安全）
- 后端环境变量存储密钥（安全）
- 符合阿里云安全最佳实践

---

## 部署配置步骤

### 1. 阿里云准备工作

#### 1.1 创建 OSS Bucket
1. 登录 [阿里云 OSS 控制台](https://oss.console.aliyun.com/)
2. 创建 Bucket，记录以下信息：
   - **Bucket 名称**：如 `my-bucket-name`
   - **地域（Region）**：如 `oss-cn-hangzhou`
   - **访问域名**：如 `https://my-bucket-name.oss-cn-hangzhou.aliyuncs.com`

#### 1.2 创建 RAM 子账号
1. 登录 [阿里云 RAM 控制台](https://ram.console.aliyun.com/users)
2. 创建子账号，记录：
   - **AccessKey ID**：`LTAI5t...`
   - **AccessKey Secret**：`xxx...`

#### 1.3 配置 OSS 权限
1. 为子账号创建 OSS 权限策略
2. 推荐最小权限策略（只允许上传到指定 Bucket）：

```json
{
  "Version": "1",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "oss:PutObject",
        "oss:GetObject"
      ],
      "Resource": [
        "acs:oss:*:*:your-bucket-name/*"
      ]
    }
  ]
}
```

#### 1.4 配置 Bucket 权限
1. 进入 Bucket 设置 → 权限管理 → 读写权限
2. 设置为 **"公共读"**（Public Read），以支持公网访问

---

### 2. 后端环境变量配置

#### 2.1 在 `.env` 文件中添加配置

在 `/workspace/projects/server/.env` 文件中添加：

```env
# 阿里云 OSS 配置
OSS_REGION=oss-cn-hangzhou
OSS_ACCESS_KEY_ID=LTAI5txxxxxxxxxxxxxxxxx
OSS_ACCESS_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
OSS_BUCKET=my-bucket-name
```

#### 2.2 环境变量说明

| 变量名 | 说明 | 示例值 | 获取方式 |
|--------|------|--------|----------|
| `OSS_REGION` | OSS 地域 | `oss-cn-hangzhou` | Bucket 概览页面 |
| `OSS_ACCESS_KEY_ID` | RAM 子账号 AccessKey ID | `LTAI5t...` | RAM 控制台创建 |
| `OSS_ACCESS_KEY_SECRET` | RAM 子账号 AccessKey Secret | `xxx...` | RAM 控制台创建 |
| `OSS_BUCKET` | Bucket 名称 | `my-bucket-name` | 创建 Bucket 时设置 |

#### 2.3 部署到生产环境

如果使用 Docker 部署，在 `docker-compose.yml` 或启动命令中设置环境变量：

```yaml
version: '3.8'
services:
  server:
    environment:
      - OSS_REGION=oss-cn-hangzhou
      - OSS_ACCESS_KEY_ID=LTAI5txxxxxxxxxxxxxxxxx
      - OSS_ACCESS_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
      - OSS_BUCKET=my-bucket-name
```

或者使用启动命令：

```bash
OSS_REGION=oss-cn-hangzhou \
OSS_ACCESS_KEY_ID=LTAI5t... \
OSS_ACCESS_KEY_SECRET=xxx... \
OSS_BUCKET=my-bucket-name \
pnpm run dev
```

---

### 3. 前端使用示例

#### 3.1 导入组件

```typescript
import { OSSUploader } from '@/components/OSSUploader';
```

#### 3.2 基本使用

```typescript
<OSSUploader
  onUploadSuccess={(fileInfo) => {
    console.log('上传成功:', fileInfo);
    // fileInfo.url: 文件永久访问 URL
    // fileInfo.filename: 原始文件名
    // fileInfo.contentType: 文件类型
    // fileInfo.size: 文件大小（字节）
  }}
  onUploadError={(error) => {
    console.error('上传失败:', error);
  }}
  buttonText="上传文件"
  maxSize={10} // 最大 10MB
/>
```

#### 3.3 高级使用

```typescript
// 图片上传
<OSSUploader
  accept="image/*"
  onUploadSuccess={(fileInfo) => {
    // 使用返回的 URL 显示图片
    setImageUrl(fileInfo.url);
  }}
/>

// PDF 文档上传
<OSSUploader
  accept="application/pdf"
  buttonText="上传 PDF"
  maxSize={20} // 最大 20MB
/>

// 禁用状态
<OSSUploader
  disabled={true}
  buttonText="上传中..."
/>
```

---

## API 接口说明

### 单文件上传
- **接口**：`POST /api/v1/upload/oss`
- **请求**：`multipart/form-data`
  - `file`: 文件对象
- **响应**：
```json
{
  "success": true,
  "data": {
    "url": "https://my-bucket.oss-cn-hangzhou.aliyuncs.com/uploads/xxx.pdf",
    "filename": "document.pdf",
    "contentType": "application/pdf",
    "size": 12345
  }
}
```

### 批量上传
- **接口**：`POST /api/v1/upload/oss/batch`
- **请求**：`multipart/form-data`
  - `files`: 文件数组（最多 10 个）
- **响应**：
```json
{
  "success": true,
  "data": [
    {
      "url": "https://.../uploads/xxx1.pdf",
      "filename": "doc1.pdf",
      "contentType": "application/pdf",
      "size": 12345
    },
    ...
  ]
}
```

---

## 测试页面

项目已提供测试页面：`http://localhost:5000/oss-upload-test`

访问后可以：
1. 测试文件上传功能
2. 查看上传历史
3. 复制文件 URL

---

## 常见问题

### Q1: 上传失败，提示 "OSS 配置不完整"
**A**: 检查后端环境变量是否正确配置，所有 4 个变量都必须设置。

### Q2: 上传成功但无法访问文件
**A**: 检查 Bucket 读写权限是否设置为"公共读"。

### Q3: 上传速度慢
**A**: 检查地域选择，选择离用户最近的 Region。

### Q4: 文件大小限制
**A**: 默认限制 10MB，可在 `server/src/routes/upload.ts` 中修改 `limits.fileSize`。

---

## 安全建议

1. **不要在前端存储 AccessKey**：所有密钥必须存储在后端环境变量中
2. **使用最小权限策略**：RAM 子账号只授予必要的权限
3. **定期轮换密钥**：定期更新 AccessKey Secret
4. **监控访问日志**：定期检查 OSS 访问日志，发现异常及时处理
5. **限制访问来源**：在 Bucket 设置中配置防盗链或 IP 白名单

---

## 技术支持

如有问题，请检查：
1. 后端日志：`tail -f /app/work/logs/bypass/app.log`
2. 前端日志：浏览器开发者工具 Console
3. 阿里云 OSS 控制台：查看访问日志和错误日志
