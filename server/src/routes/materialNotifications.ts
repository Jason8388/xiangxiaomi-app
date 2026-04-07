import express from 'express';

const router = express.Router();

// 获取物料通知列表
router.get('/', async (req, res) => {
  try {
    res.status(200).json({
      code: 0,
      data: [],
      message: 'success'
    });
  } catch (error) {
    console.error('Material notifications list error:', error);
    res.status(500).json({ code: 1, message: 'Internal server error' });
  }
});

// 标记已读
router.post('/:id/read', async (req, res) => {
  try {
    res.status(200).json({
      code: 0,
      message: 'success'
    });
  } catch (error) {
    console.error('Material notification read error:', error);
    res.status(500).json({ code: 1, message: 'Internal server error' });
  }
});

// 确认物料通知
router.post('/:id/confirm', async (req, res) => {
  try {
    res.status(200).json({
      code: 0,
      message: 'success'
    });
  } catch (error) {
    console.error('Material notification confirm error:', error);
    res.status(500).json({ code: 1, message: 'Internal server error' });
  }
});

export default router;
