import express from 'express';

const router = express.Router();

// 通用文件上传接口
router.post('/', async (req, res) => {
  try {
    // 如果有文件，返回模拟URL
    // Multer会在实际使用时被添加到处理链中
    const file = req.file;
    if (file) {
      res.status(200).json({
        code: 0,
        data: {
          url: `/uploads/${file.originalname}`,
          filename: file.originalname
        },
        message: 'success'
      });
    } else {
      // 无文件时返回成功响应
      res.status(200).json({
        code: 0,
        data: {
          url: '',
          filename: ''
        },
        message: 'success'
      });
    }
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ code: 1, message: 'Internal server error' });
  }
});

export default router;
