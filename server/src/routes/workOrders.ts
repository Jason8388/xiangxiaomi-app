import express from 'express';
import pool from '../database/db';

const router = express.Router();

// 获取工单列表
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT wo.*, cu.name as customer_name, d.device_name, u.name as assignee_name
       FROM work_orders wo
       LEFT JOIN customers cu ON wo.customer_id = cu.id
       LEFT JOIN devices d ON wo.device_id = d.id
       LEFT JOIN users u ON wo.assignee_id = u.id
       ORDER BY wo.id DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get work orders error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取工单详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT wo.*, cu.name as customer_name, d.device_name, u.name as assignee_name
       FROM work_orders wo
       LEFT JOIN customers cu ON wo.customer_id = cu.id
       LEFT JOIN devices d ON wo.device_id = d.id
       LEFT JOIN users u ON wo.assignee_id = u.id
       WHERE wo.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '工单不存在' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get work order error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 创建工单
router.post('/', async (req, res) => {
  try {
    const { customer_id, device_id, contract_id, order_no, type, priority, status, description, assignee_id } = req.body;

    if (!customer_id || !type || !order_no) {
      return res.status(400).json({ error: '缺少必填字段' });
    }

    const result = await pool.query(
      'INSERT INTO work_orders (customer_id, device_id, contract_id, order_no, type, priority, status, description, assignee_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [customer_id, device_id, contract_id, order_no, type, priority || 'normal', status || 'pending', description, assignee_id]
    );

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Create work order error:', error);
    if (error.code === '23505') {
      res.status(400).json({ error: '工单编号已存在' });
    } else {
      res.status(500).json({ error: '服务器错误' });
    }
  }
});

// 更新工单
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, priority, description, assignee_id } = req.body;

    const result = await pool.query(
      'UPDATE work_orders SET status = $1, priority = $2, description = $3, assignee_id = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *',
      [status, priority, description, assignee_id, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '工单不存在' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update work order error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 删除工单
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM work_orders WHERE id = $1', [id]);
    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('Delete work order error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取工单日志
router.get('/:id/logs', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT wol.*, u.name as user_name FROM work_order_logs wol LEFT JOIN users u ON wol.user_id = u.id WHERE wol.work_order_id = $1 ORDER BY wol.created_at DESC',
      [id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get work order logs error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 添加工单日志
router.post('/:id/logs', async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id, action, description } = req.body;

    if (!user_id || !action) {
      return res.status(400).json({ error: '缺少必填字段' });
    }

    const result = await pool.query(
      'INSERT INTO work_order_logs (work_order_id, user_id, action, description) VALUES ($1, $2, $3, $4) RETURNING *',
      [id, user_id, action, description]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Create work order log error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

export default router;
