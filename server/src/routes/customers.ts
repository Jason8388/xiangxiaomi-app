import express from 'express';
import pool from '../database/db';

const router = express.Router();

// 获取客户列表
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM customers ORDER BY id DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取客户详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM customers WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '客户不存在' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 创建客户
router.post('/', async (req, res) => {
  try {
    const { name, contact, phone, email, address } = req.body;

    if (!name) {
      return res.status(400).json({ error: '客户名称不能为空' });
    }

    const result = await pool.query(
      'INSERT INTO customers (name, contact, phone, email, address) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, contact, phone, email, address]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 更新客户
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, contact, phone, email, address } = req.body;

    const result = await pool.query(
      'UPDATE customers SET name = $1, contact = $2, phone = $3, email = $4, address = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6 RETURNING *',
      [name, contact, phone, email, address, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '客户不存在' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 删除客户
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM customers WHERE id = $1', [id]);
    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

export default router;
