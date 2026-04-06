import express from 'express';
import pool from '../database/db';

const router = express.Router();

// 获取工单统计
router.get('/stats', async (req, res) => {
  try {
    // 总工单数
    const totalResult = await pool.query('SELECT COUNT(*) as total FROM work_orders');
    const totalWorkOrders = parseInt(totalResult.rows[0].total);

    // 总收费工单数（假设有一个 is_charged 字段）
    let chargedWorkOrders = 0;
    try {
      const chargedResult = await pool.query(
        "SELECT COUNT(*) as total FROM work_orders WHERE is_charged = true"
      );
      chargedWorkOrders = parseInt(chargedResult.rows[0].total);
    } catch (e) {
      console.log('is_charged field not found, using 0');
    }

    // 售后业绩金额（假设有 service_amount 字段）
    let performanceAmount = 0;
    try {
      const performanceResult = await pool.query(
        'SELECT COALESCE(SUM(service_amount), 0) as total FROM work_orders WHERE service_amount IS NOT NULL'
      );
      performanceAmount = parseFloat(performanceResult.rows[0].total);
    } catch (e) {
      console.log('service_amount field not found, using 0');
    }

    // 售后代收款金额（假设有 pending_payment 字段）
    let pendingPaymentAmount = 0;
    try {
      const pendingPaymentResult = await pool.query(
        'SELECT COALESCE(SUM(pending_payment), 0) as total FROM work_orders WHERE pending_payment IS NOT NULL'
      );
      pendingPaymentAmount = parseFloat(pendingPaymentResult.rows[0].total);
    } catch (e) {
      console.log('pending_payment field not found, using 0');
    }

    // 售后已收款金额（假设有 paid_amount 字段）
    let paidAmount = 0;
    try {
      const paidAmountResult = await pool.query(
        'SELECT COALESCE(SUM(paid_amount), 0) as total FROM work_orders WHERE paid_amount IS NOT NULL'
      );
      paidAmount = parseFloat(paidAmountResult.rows[0].total);
    } catch (e) {
      console.log('paid_amount field not found, using 0');
    }

    res.json({
      totalWorkOrders,
      chargedWorkOrders,
      performanceAmount,
      pendingPaymentAmount,
      paidAmount,
    });
  } catch (error) {
    console.error('Get work order stats error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取工单列表
router.get('/', async (req, res) => {
  try {
    const { keyword, status } = req.query;

    let query = `
      SELECT wo.*, cu.name as customer_name, d.device_name, d.device_number,
              u.name as assignee_name, creator.name as creator_name
       FROM work_orders wo
       LEFT JOIN customers cu ON wo.customer_id = cu.id
       LEFT JOIN devices d ON wo.device_id = d.id
       LEFT JOIN users u ON wo.assignee_id = u.id
       LEFT JOIN users creator ON wo.created_by = creator.id
       WHERE 1=1
    `;
    const params: any[] = [];

    // 状态筛选
    if (status && status !== 'all') {
      query += ' AND wo.status = $' + (params.length + 1);
      params.push(status);
    }

    // 关键词搜索（支持多字段模糊搜索）
    if (keyword) {
      query += ` AND (
        wo.description ILIKE $${params.length + 1} OR
        wo.order_no ILIKE $${params.length + 1} OR
        cu.name ILIKE $${params.length + 1} OR
        d.device_name ILIKE $${params.length + 1} OR
        d.device_number ILIKE $${params.length + 1} OR
        u.name ILIKE $${params.length + 1}
      )`;
      params.push(`%${keyword}%`);
    }

    query += ' ORDER BY wo.created_at DESC';

    const result = await pool.query(query, params);
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
      `SELECT wo.*, cu.name as customer_name, d.device_name,
              u.name as assignee_name, creator.name as creator_name
       FROM work_orders wo
       LEFT JOIN customers cu ON wo.customer_id = cu.id
       LEFT JOIN devices d ON wo.device_id = d.id
       LEFT JOIN users u ON wo.assignee_id = u.id
       LEFT JOIN users creator ON wo.created_by = creator.id
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
    const { customer_id, device_id, contract_id, order_no, type, priority, status, description, assignee_id, created_by } = req.body;

    if (!customer_id || !type || !order_no) {
      return res.status(400).json({ error: '缺少必填字段' });
    }

    const result = await pool.query(
      'INSERT INTO work_orders (customer_id, device_id, contract_id, order_no, type, priority, status, description, assignee_id, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
      [customer_id, device_id, contract_id, order_no, type, priority || 'normal', status || 'pending', description, assignee_id, created_by]
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
