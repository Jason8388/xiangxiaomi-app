import express from 'express';
import multer from 'multer';
import { uploadFileToOSS } from '../utils/oss';

const router = express.Router();

// 配置 multer 用于接收文件
const upload = multer({
  storage: multer.memoryStorage(), // 将文件存储在内存中
  limits: {
    fileSize: 10 * 1024 * 1024, // 限制文件大小为 10MB
  },
});

/**
 * 上传文件到 OSS
 * POST /api/v1/upload/oss
 */
router.post('/oss', upload.single('file'), async (req, res) => {
  try {
    console.log('[OSS Upload] 收到上传请求');

    // 检查是否有文件
    if (!req.file) {
      console.error('[OSS Upload] 没有文件');
      return res.status(400).json({ error: '没有上传文件' });
    }

    console.log('[OSS Upload] 文件信息:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
    });

    const { originalname, buffer, mimetype } = req.file;

    // 上传到 OSS
    const fileUrl = await uploadFileToOSS(buffer, originalname, mimetype);

    console.log('[OSS Upload] 上传成功:', fileUrl);

    res.json({
      success: true,
      data: {
        url: fileUrl,
        filename: originalname,
        contentType: mimetype,
        size: buffer.length,
      },
    });
  } catch (error: any) {
    console.error('[OSS Upload] 错误:', error);
    console.error('[OSS Upload] 错误堆栈:', error.stack);
    res.status(500).json({
      error: '上传失败',
      message: error.message,
    });
  }
});

/**
 * 批量上传文件到 OSS
 * POST /api/v1/upload/oss/batch
 */
router.post('/oss/batch', upload.array('files', 10), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({ error: '没有上传文件' });
    }

    // 并行上传所有文件
    const uploadPromises = files.map(async (file) => {
      const url = await uploadFileToOSS(file.buffer, file.originalname, file.mimetype);
      return {
        url,
        filename: file.originalname,
        contentType: file.mimetype,
        size: file.buffer.length,
      };
    });

    const results = await Promise.all(uploadPromises);

    res.json({
      success: true,
      data: results,
    });
  } catch (error: any) {
    console.error('Batch upload to OSS error:', error);
    res.status(500).json({
      error: '批量上传失败',
      message: error.message,
    });
  }
});

export default router;
