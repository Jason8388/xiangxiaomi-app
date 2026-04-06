import express from 'express';
import pool from '../database/db';

const router = express.Router();

// 获取物料列表
router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = 'SELECT * FROM materials WHERE 1=1';
    const params: any[] = [];
    let paramCount = 1;

    if (category) {
      query += ` AND category = $${paramCount}`;
      params.push(category);
      paramCount++;
    }

    if (search) {
      query += ` AND (name ILIKE $${paramCount} OR code ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    query += ' ORDER BY id DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get materials error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取物料详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM materials WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '物料不存在' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get material error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取物料库存
router.get('/:id/inventory', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT mi.*, w.name as warehouse_name, m.name as material_name, m.code as material_code, m.unit
       FROM material_inventory mi
       LEFT JOIN warehouses w ON mi.warehouse_id = w.id
       LEFT JOIN materials m ON mi.material_id = m.id
       WHERE mi.material_id = $1`,
      [id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get material inventory error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取库存不足的物料
router.get('/low-stock/list', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT m.*, mi.quantity, m.min_stock
       FROM materials m
       LEFT JOIN material_inventory mi ON m.id = mi.material_id
       WHERE mi.quantity <= m.min_stock
       ORDER BY (mi.quantity::float / NULLIF(m.min_stock, 0)) ASC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get low stock materials error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 创建物料
router.post('/', async (req, res) => {
  try {
    const { name, code, category, unit, min_stock, description } = req.body;

    if (!name || !code) {
      return res.status(400).json({ error: '物料名称和编码不能为空' });
    }

    const result = await pool.query(
      'INSERT INTO materials (name, code, category, unit, min_stock, description) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, code, category, unit, min_stock || 0, description]
    );

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Create material error:', error);
    if (error.code === '23505') {
      res.status(400).json({ error: '物料编码已存在' });
    } else {
      res.status(500).json({ error: '服务器错误' });
    }
  }
});

// 更新物料
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, category, unit, min_stock, description } = req.body;

    const result = await pool.query(
      'UPDATE materials SET name = $1, code = $2, category = $3, unit = $4, min_stock = $5, description = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7 RETURNING *',
      [name, code, category, unit, min_stock, description, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '物料不存在' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Update material error:', error);
    if (error.code === '23505') {
      res.status(400).json({ error: '物料编码已存在' });
    } else {
      res.status(500).json({ error: '服务器错误' });
    }
  }
});

// 删除物料
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM material_inventory WHERE material_id = $1', [id]);
    await pool.query('DELETE FROM materials WHERE id = $1', [id]);
    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('Delete material error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 调整库存
router.post('/:id/inventory/adjust', async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { warehouse_id, quantity, type } = req.body; // type: 'in' or 'out'

    if (!warehouse_id || !quantity || !type) {
      return res.status(400).json({ error: '缺少必填字段' });
    }

    if (type !== 'in' && type !== 'out') {
      return res.status(400).json({ error: '类型必须为 in 或 out' });
    }

    await client.query('BEGIN');

    // 检查库存记录是否存在
    const checkResult = await client.query(
      'SELECT id, quantity FROM material_inventory WHERE warehouse_id = $1 AND material_id = $2',
      [warehouse_id, id]
    );

    let newQuantity: number;

    if (checkResult.rows.length === 0) {
      // 新建库存记录
      newQuantity = type === 'in' ? quantity : -quantity;
      if (newQuantity < 0) {
        throw new Error('库存不足');
      }

      await client.query(
        `INSERT INTO material_inventory (warehouse_id, material_id, quantity, ${type === 'in' ? 'last_in_date' : 'last_out_date'})
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
        [warehouse_id, id, newQuantity]
      );
    } else {
      // 更新现有库存
      const currentQuantity = checkResult.rows[0].quantity;
      if (type === 'out' && currentQuantity < quantity) {
        throw new Error('库存不足');
      }

      newQuantity = type === 'in' ? currentQuantity + quantity : currentQuantity - quantity;

      await client.query(
        `UPDATE material_inventory
         SET quantity = $1,
             ${type === 'in' ? 'last_in_date' : 'last_out_date'} = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [newQuantity, checkResult.rows[0].id]
      );
    }

    await client.query('COMMIT');
    res.json({ message: '库存调整成功', new_quantity: newQuantity });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Adjust inventory error:', error);
    res.status(500).json({ error: error.message || '服务器错误' });
  } finally {
    client.release();
  }
});

export default router;
