import express from 'express';
import pool from '../database/db';

const router = express.Router();

// 获取设备列表
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT d.*, cu.name as customer_name, c.contract_no FROM devices d LEFT JOIN customers cu ON d.customer_id = cu.id LEFT JOIN contracts c ON d.contract_id = c.id ORDER BY d.id DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get devices error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取客户设备列表
router.get('/customer/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;
    const result = await pool.query(
      'SELECT * FROM devices WHERE customer_id = $1 ORDER BY id DESC',
      [customerId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get customer devices error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 创建设备
router.post('/', async (req, res) => {
  try {
    const { customer_id, contract_id, device_name, serial_no, model, purchase_date, warranty_expire, status } = req.body;

    if (!customer_id || !device_name) {
      return res.status(400).json({ error: '缺少必填字段' });
    }

    const result = await pool.query(
      'INSERT INTO devices (customer_id, contract_id, device_name, serial_no, model, purchase_date, warranty_expire, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [customer_id, contract_id, device_name, serial_no, model, purchase_date, warranty_expire, status || 'normal']
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Create device error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 更新设备
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { device_name, serial_no, model, purchase_date, warranty_expire, status } = req.body;

    const result = await pool.query(
      'UPDATE devices SET device_name = $1, serial_no = $2, model = $3, purchase_date = $4, warranty_expire = $5, status = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7 RETURNING *',
      [device_name, serial_no, model, purchase_date, warranty_expire, status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '设备不存在' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update device error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 删除设备
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM devices WHERE id = $1', [id]);
    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('Delete device error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

export default router;
