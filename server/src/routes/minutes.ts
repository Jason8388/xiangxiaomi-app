import express from 'express';

const router = express.Router();

// 获取会议记录列表 (兼容旧路由)
router.get('/', async (req, res) => {
  try {
    res.status(200).json({
      code: 0,
      data: [],
      message: 'success'
    });
  } catch (error) {
    console.error('Minutes list error:', error);
    res.status(500).json({ code: 1, message: 'Internal server error' });
  }
});

// 获取会议记录详情 (兼容旧路由)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    res.status(200).json({
      code: 0,
      data: { id },
      message: 'success'
    });
  } catch (error) {
    console.error('Minutes detail error:', error);
    res.status(500).json({ code: 1, message: 'Internal server error' });
  }
});

export default router;
