import express from 'express';

const router = express.Router();

// 获取标准物料清单列表
router.get('/', async (req, res) => {
  try {
    res.status(200).json({
      code: 0,
      data: [],
      message: 'success'
    });
  } catch (error) {
    console.error('Standard material lists error:', error);
    res.status(500).json({ code: 1, message: 'Internal server error' });
  }
});

// 获取标准物料详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    res.status(200).json({
      code: 0,
      data: { id },
      message: 'success'
    });
  } catch (error) {
    console.error('Standard material detail error:', error);
    res.status(500).json({ code: 1, message: 'Internal server error' });
  }
});

export default router;
