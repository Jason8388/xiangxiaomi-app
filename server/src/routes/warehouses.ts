import express from 'express';
import pool from '../database/db';

const router = express.Router();

// 获取仓库列表
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM warehouses ORDER BY id DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get warehouses error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 创建仓库
router.post('/', async (req, res) => {
  try {
    const { name, address, manager } = req.body;

    if (!name) {
      return res.status(400).json({ error: '仓库名称不能为空' });
    }

    const result = await pool.query(
      'INSERT INTO warehouses (name, address, manager) VALUES ($1, $2, $3) RETURNING *',
      [name, address, manager]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Create warehouse error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 更新仓库
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, manager } = req.body;

    const result = await pool.query(
      'UPDATE warehouses SET name = $1, address = $2, manager = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *',
      [name, address, manager, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '仓库不存在' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update warehouse error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 删除仓库
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM warehouses WHERE id = $1', [id]);
    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('Delete warehouse error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取仓库库存
router.get('/:id/inventory', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT i.*, d.device_name, d.model, w.name as warehouse_name FROM inventory i LEFT JOIN devices d ON i.device_id = d.id LEFT JOIN warehouses w ON i.warehouse_id = w.id WHERE i.warehouse_id = $1',
      [id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get warehouse inventory error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

export default router;
