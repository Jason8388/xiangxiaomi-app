import express from 'express';
import multer from 'multer';
import { S3Storage } from 'coze-coding-dev-sdk';

const router = express.Router();

// 配置 multer，使用内存存储
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 限制为 10MB
  },
});

// 初始化 S3Storage
const storage = new S3Storage({
  endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
  accessKey: "",
  secretKey: "",
  bucketName: process.env.COZE_BUCKET_NAME,
  region: "cn-beijing",
});

/**
 * 上传单个文件
 * POST /api/v1/upload
 * Body: multipart/form-data
 * - file: 文件（必填）
 * - folder: 文件夹路径（可选，默认为 'uploads'）
 * 返回: { key: string, url: string }
 */
router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请选择要上传的文件' });
    }

    const { folder = 'uploads' } = req.body;
    const file = req.file;

    console.log('[文件上传] 开始上传:', {
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      folder,
    });

    // 构建文件名，添加时间戳防止重名
    const timestamp = Date.now();
    const ext = file.originalname.split('.').pop();
    const fileName = `${folder}/${timestamp}_${file.originalname}`;

    // 上传文件到对象存储
    const fileKey = await storage.uploadFile({
      fileContent: file.buffer,
      fileName: fileName,
      contentType: file.mimetype,
    });

    console.log('[文件上传] 上传成功，fileKey:', fileKey);

    // 生成签名 URL（有效期 1 天）
    const fileUrl = await storage.generatePresignedUrl({
      key: fileKey,
      expireTime: 86400, // 1 天
    });

    console.log('[文件上传] 生成签名 URL:', fileUrl);

    res.json({
      key: fileKey,
      url: fileUrl,
      fileName: file.originalname,
      size: file.size,
    });
  } catch (error: any) {
    console.error('[文件上传] 上传失败:', error);
    res.status(500).json({ error: error.message || '文件上传失败' });
  }
});

/**
 * 批量上传文件
 * POST /api/v1/upload/batch
 * Body: multipart/form-data
 * - files: 文件数组（必填）
 * - folder: 文件夹路径（可选，默认为 'uploads'）
 * 返回: Array<{ key: string, url: string }>
 */
router.post('/batch', upload.array('files', 10), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: '请选择要上传的文件' });
    }

    const { folder = 'uploads' } = req.body;
    const results = [];

    for (const file of files) {
      console.log('[批量上传] 上传文件:', file.originalname);

      const timestamp = Date.now();
      const ext = file.originalname.split('.').pop();
      const fileName = `${folder}/${timestamp}_${file.originalname}`;

      const fileKey = await storage.uploadFile({
        fileContent: file.buffer,
        fileName: fileName,
        contentType: file.mimetype,
      });

      const fileUrl = await storage.generatePresignedUrl({
        key: fileKey,
        expireTime: 86400,
      });

      results.push({
        key: fileKey,
        url: fileUrl,
        fileName: file.originalname,
        size: file.size,
      });
    }

    console.log('[批量上传] 上传完成，文件数量:', results.length);
    res.json(results);
  } catch (error: any) {
    console.error('[批量上传] 上传失败:', error);
    res.status(500).json({ error: error.message || '批量上传失败' });
  }
});

/**
 * 获取文件访问 URL
 * GET /api/v1/upload/url/:key
 * 返回: { url: string }
 */
router.get('/url/:key', async (req, res) => {
  try {
    const { key } = req.params;
    console.log('[文件访问] 生成 URL for key:', key);

    const fileUrl = await storage.generatePresignedUrl({
      key,
      expireTime: 86400,
    });

    res.json({ url: fileUrl });
  } catch (error: any) {
    console.error('[文件访问] 生成 URL 失败:', error);
    res.status(500).json({ error: error.message || '生成 URL 失败' });
  }
});

/**
 * 删除文件
 * DELETE /api/v1/upload/:key
 * 返回: { success: boolean }
 */
router.delete('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    console.log('[文件删除] 删除文件:', key);

    const success = await storage.deleteFile({ fileKey: key });

    if (success) {
      console.log('[文件删除] 删除成功');
      res.json({ success: true, message: '删除成功' });
    } else {
      console.log('[文件删除] 文件不存在');
      res.status(404).json({ error: '文件不存在' });
    }
  } catch (error: any) {
    console.error('[文件删除] 删除失败:', error);
    res.status(500).json({ error: error.message || '删除失败' });
  }
});

export default router;
