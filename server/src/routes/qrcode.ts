import express from 'express';

const router = express.Router();

// 生成二维码
router.post('/generate', async (req, res) => {
  try {
    const { content } = req.body;
    res.status(200).json({
      code: 0,
      data: {
        qrcode_url: `data:image/png;base64,generated_qrcode_for_${content}`,
        content
      },
      message: 'success'
    });
  } catch (error) {
    console.error('QR code generate error:', error);
    res.status(500).json({ code: 1, message: 'Internal server error' });
  }
});

// 解析二维码
router.post('/parse', async (req, res) => {
  try {
    const { data } = req.body;
    res.status(200).json({
      code: 0,
      data: { content: data },
      message: 'success'
    });
  } catch (error) {
    console.error('QR code parse error:', error);
    res.status(500).json({ code: 1, message: 'Internal server error' });
  }
});

export default router;
