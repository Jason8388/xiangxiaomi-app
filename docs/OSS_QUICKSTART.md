# OSS 文件上传功能 - 快速开始

## ✅ 已完成的功能

1. ✅ 后端 OSS SDK 集成（ali-oss）
2. ✅ 后端文件上传接口（`/api/v1/upload/oss`）
3. ✅ 前端上传组件（`OSSUploader`）
4. ✅ 测试页面（`/oss-upload-test`）
5. ✅ 部署文档（`docs/OSS_UPLOAD_DEPLOYMENT.md`）

---

## 🚀 快速使用

### 1. 配置环境变量（必需）

在 `/workspace/projects/server/.env` 文件中添加：

```env
OSS_REGION=oss-cn-hangzhou
OSS_ACCESS_KEY_ID=你的AccessKeyID
OSS_ACCESS_KEY_SECRET=你的AccessKeySecret
OSS_BUCKET=你的Bucket名称
```

**获取方式**：参考 `docs/OSS_UPLOAD_DEPLOYMENT.md` 文档

### 2. 在页面中使用

```typescript
import { OSSUploader } from '@/components/OSSUploader';

export default function MyPage() {
  return (
    <OSSUploader
      onUploadSuccess={(fileInfo) => {
        console.log('文件 URL:', fileInfo.url);
        // fileInfo.url 是文件的永久可访问链接
      }}
      buttonText="上传文件"
    />
  );
}
```

---

## 📁 文件结构

```
workspace/projects/
├── server/
│   ├── src/
│   │   ├── routes/
│   │   │   └── upload.ts          # 上传路由
│   │   └── utils/
│   │       └── oss.ts             # OSS 工具函数
│   └── .env                       # 环境变量配置
├── client/
│   ├── components/
│   │   └── OSSUploader.tsx        # 上传组件
│   └── screens/
│       └── oss-upload-test/       # 测试页面
│           └── index.tsx
└── docs/
    └── OSS_UPLOAD_DEPLOYMENT.md   # 详细部署文档
```

---

## 🔌 API 接口

### 单文件上传
```bash
POST /api/v1/upload/oss
Content-Type: multipart/form-data

# 响应
{
  "success": true,
  "data": {
    "url": "https://bucket.oss-region.aliyuncs.com/uploads/xxx.pdf",
    "filename": "document.pdf",
    "contentType": "application/pdf",
    "size": 12345
  }
}
```

### 批量上传
```bash
POST /api/v1/upload/oss/batch
Content-Type: multipart/form-data

# 最多上传 10 个文件
```

---

## 🎨 组件属性

| 属性 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `onUploadSuccess` | `(fileInfo) => void` | ❌ | - | 上传成功回调 |
| `onUploadError` | `(error) => void` | ❌ | - | 上传失败回调 |
| `accept` | `string` | ❌ | `*/*` | 接受的文件类型 |
| `maxSize` | `number` | ❌ | `10` | 最大文件大小（MB） |
| `buttonText` | `string` | ❌ | `'选择文件'` | 按钮文字 |
| `disabled` | `boolean` | ❌ | `false` | 是否禁用 |

---

## 🔐 安全说明

✅ **安全的设计**：
- 前端不存储任何密钥
- 所有密钥存储在后端环境变量中
- 后端使用 RAM 子账号（最小权限）
- 符合阿里云安全最佳实践

❌ **危险的做法**（已避免）：
- 前端直接使用 AccessKey
- 密钥硬编码在代码中
- 使用 root 账号密钥

---

## 📝 使用示例

### 示例 1：图片上传
```typescript
<OSSUploader
  accept="image/*"
  buttonText="上传图片"
  onUploadSuccess={(fileInfo) => {
    // 显示上传的图片
    setImageUrl(fileInfo.url);
  }}
/>
```

### 示例 2：PDF 文档上传
```typescript
<OSSUploader
  accept="application/pdf"
  buttonText="上传 PDF"
  maxSize={20}
  onUploadSuccess={(fileInfo) => {
    // 使用 PDF URL
    setPdfUrl(fileInfo.url);
  }}
/>
```

### 示例 3：知识库附件上传
```typescript
<OSSUploader
  buttonText="上传附件"
  onUploadSuccess={(fileInfo) => {
    // 添加到知识库附件列表
    setAttachments([...attachments, {
      name: fileInfo.filename,
      url: fileInfo.url,
    }]);
  }}
/>
```

---

## 🧪 测试

访问测试页面：`http://localhost:5000/oss-upload-test`

可以测试：
- 文件选择
- 文件上传
- 查看上传历史
- 复制文件 URL

---

## ❓ 常见问题

### Q: 上传失败，提示 "OSS 配置不完整"
**A**: 检查 `server/.env` 文件中的 4 个 OSS 环境变量是否都已正确配置。

### Q: 上传成功但无法访问文件
**A**: 检查阿里云 OSS Bucket 的读写权限是否设置为"公共读"。

### Q: 文件大小超过限制
**A**: 默认限制 10MB，可以在组件的 `maxSize` 属性中调整。

---

## 📚 详细文档

完整的部署和配置文档请参考：
`docs/OSS_UPLOAD_DEPLOYMENT.md`

---

## 🎉 完成

现在您可以在任何页面中使用 `OSSUploader` 组件来实现文件上传功能了！
