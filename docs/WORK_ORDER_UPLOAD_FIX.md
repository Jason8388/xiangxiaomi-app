# 工单管理文件上传功能修复说明

## 问题描述

用户反馈在工单管理中上传图片和视频后，文件没有上传到 OSS，且查看详情时看不到这些文件。

## 根本原因

工单管理模块的文件上传功能存在以下问题：

1. **只选择本地文件，未真正上传**
   - 使用 `expo-image-picker` 选择文件后，只保存了本地 URI（如 `file:///...`）
   - 本地 URI 只在客户端有效，服务端和其他设备无法访问
   - 没有调用 OSS 上传接口

2. **显示方式不正确**
   - 只显示"文件 1"、"文件 2"等文本
   - 没有真正显示图片或视频内容

## 修复内容

### 1. 修改上传逻辑（真正上传到 OSS）

**修改文件**：`/workspace/projects/client/screens/work-order-detail/index.tsx`

**修改内容**：
- 添加 `createFormDataFile` 导入
- 重写 `handleUploadRequirementMedia` 函数
- 选择文件后，使用 FormData 上传到后端 OSS 接口
- 保存返回的 OSS URL（公网访问链接）而不是本地 URI

```typescript
// 上传到 OSS
const uploadUrl = `${getApiBaseUrl()}/api/v1/upload/oss`;
const formData = new FormData();
const formDataFile = await createFormDataFile(uri, asset.fileName || `file_${Date.now()}`, asset.mimeType);
formData.append('file', formDataFile);

const response = await fetch(uploadUrl, {
  method: 'POST',
  body: formData,
});

if (response.ok) {
  const resultData = await response.json();
  const ossUrl = resultData.data.url;
  // 保存 OSS URL 而不是本地 URI
  setOrder({
    ...order,
    requirement_photos: [...(order.requirement_photos || []), ossUrl],
  });
}
```

### 2. 添加图片和视频显示功能

**修改内容**：
- 添加 `Image` 和 `Video` 组件导入（`expo-av`）
- 创建 `renderMediaFile` 辅助函数
  - 根据 URL 后缀判断是图片还是视频
  - 图片使用 `<Image>` 组件显示
  - 视频使用 `<Video>` 组件显示
  - 添加删除按钮
- 创建 `handleDeleteMedia` 函数处理删除操作

```typescript
const renderMediaFile = (uri: string, index: number) => {
  const isVideo = uri.toLowerCase().includes('.mp4') ||
                  uri.toLowerCase().includes('.mov') ||
                  uri.toLowerCase().includes('.avi') ||
                  uri.toLowerCase().includes('.mkv');

  if (isVideo) {
    return (
      <View key={index} style={styles.mediaContainer}>
        <Video
          source={{ uri }}
          style={styles.video}
          useNativeControls
          resizeMode={ResizeMode.CONTAIN}
        />
        <TouchableOpacity onPress={() => handleDeleteMedia(index)}>
          <FontAwesome6 name="times-circle" size={20} color="#FF6B6B" />
        </TouchableOpacity>
      </View>
    );
  } else {
    return (
      <View key={index} style={styles.mediaContainer}>
        <Image source={{ uri }} style={styles.image} resizeMode="cover" />
        <TouchableOpacity onPress={() => handleDeleteMedia(index)}>
          <FontAwesome6 name="times-circle" size={20} color="#FF6B6B" />
        </TouchableOpacity>
      </View>
    );
  }
};
```

### 3. 添加样式

**添加的样式**：
- `mediaContainer`: 媒体容器样式（100x100，圆角，背景色）
- `image`: 图片样式（填满容器）
- `video`: 视频样式（填满容器，原生控制）
- `mediaDeleteButton`: 删除按钮样式（右上角，半透明白色背景）

## 使用说明

### 上传文件

1. 进入工单详情页面（创建或编辑）
2. 在"需求照片/视频"部分点击：
   - **拍照**：拍摄照片
   - **选择图片**：从相册选择图片
   - **选择视频**：从相册选择视频
3. 文件会自动上传到阿里云 OSS
4. 上传成功后会显示缩略图或视频预览

### 查看文件

- **图片**：显示图片缩略图
- **视频**：显示视频播放器（带播放/暂停/进度控制）

### 删除文件

- 点击文件右上角的红色 "×" 按钮
- 确认后删除文件

## 文件存储位置

- **存储位置**：阿里云 OSS Bucket (`xiangxiaomi`)
- **访问方式**：公网访问（OSS URL）
- **存储路径**：`uploads/{timestamp}-{random}-{filename}`

## 支持的文件格式

### 图片
- JPEG
- PNG
- GIF
- 其他常见图片格式

### 视频
- MP4
- MOV
- AVI
- MKV

## 文件大小限制

- **默认限制**：10MB（在 `server/src/routes/upload.ts` 中配置）
- **修改方法**：修改 `limits.fileSize` 参数

## 测试步骤

1. 访问工单管理页面
2. 创建新工单或编辑现有工单
3. 点击"选择图片"上传一张图片
4. 观察上传进度提示
5. 上传成功后查看缩略图
6. 点击"选择视频"上传一个视频
7. 观察视频播放器是否正常显示
8. 点击删除按钮测试删除功能

## 验证结果

- ✅ 文件正确上传到 OSS
- ✅ 图片正确显示
- ✅ 视频正确播放
- ✅ 删除功能正常工作
- ✅ OSS URL 可以在详情页正常访问

## 注意事项

1. **网络要求**：上传文件需要网络连接
2. **权限要求**：需要相册权限才能选择文件
3. **存储费用**：OSS 存储会产生费用，请留意账单
4. **公网访问**：文件存储在 OSS，可以被公网访问（注意敏感信息）
