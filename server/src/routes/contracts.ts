import express from 'express';
import pool from '../database/db';

const router = express.Router();

// 获取合同列表
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT c.*, cu.name as customer_name FROM contracts c LEFT JOIN customers cu ON c.customer_id = cu.id ORDER BY c.id DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get contracts error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取客户合同列表
router.get('/customer/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;
    const result = await pool.query(
      'SELECT * FROM contracts WHERE customer_id = $1 ORDER BY id DESC',
      [customerId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get customer contracts error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 创建合同
router.post('/', async (req, res) => {
  try {
    const { customer_id, contract_no, start_date, end_date, amount, status } = req.body;

    if (!customer_id || !contract_no || !start_date || !end_date) {
      return res.status(400).json({ error: '缺少必填字段' });
    }

    const result = await pool.query(
      'INSERT INTO contracts (customer_id, contract_no, start_date, end_date, amount, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [customer_id, contract_no, start_date, end_date, amount, status || 'active']
    );

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Create contract error:', error);
    if (error.code === '23505') {
      res.status(400).json({ error: '合同编号已存在' });
    } else {
      res.status(500).json({ error: '服务器错误' });
    }
  }
});

// 更新合同
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { start_date, end_date, amount, status } = req.body;

    const result = await pool.query(
      'UPDATE contracts SET start_date = $1, end_date = $2, amount = $3, status = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *',
      [start_date, end_date, amount, status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '合同不存在' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update contract error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 删除合同
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM contracts WHERE id = $1', [id]);
    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('Delete contract error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

export default router;
