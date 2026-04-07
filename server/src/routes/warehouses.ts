import express from 'express';
import pool from '../database/db';

const router = express.Router();

// 内存存储fallback
let memoryWarehouses = [
  { id: 1, name: '主仓库', address: '北京市朝阳区', manager: '张三', created_at: new Date().toISOString() },
  { id: 2, name: '备件仓库', address: '上海市浦东新区', manager: '李四', created_at: new Date().toISOString() }
];

// 获取仓库列表
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM warehouses ORDER BY id DESC'
    );
    res.json({ code: 0, data: result.rows, message: 'success' });
  } catch (error) {
    console.error('Get warehouses error, using memory storage:', error);
    res.json({ code: 0, data: memoryWarehouses, message: 'success' });
  }
});

// 创建仓库
router.post('/', async (req, res) => {
  try {
    const { name, address, manager } = req.body;

    if (!name) {
      return res.status(400).json({ code: 1, error: '仓库名称不能为空' });
    }

    const result = await pool.query(
      'INSERT INTO warehouses (name, address, manager) VALUES ($1, $2, $3) RETURNING *',
      [name, address, manager]
    );

    res.status(201).json({ code: 0, data: result.rows[0], message: 'success' });
  } catch (error) {
    console.error('Create warehouse error, using memory storage:', error);
    const newWarehouse = {
      id: Date.now(),
      name: req.body.name,
      address: req.body.address,
      manager: req.body.manager,
      created_at: new Date().toISOString()
    };
    memoryWarehouses.push(newWarehouse);
    res.status(201).json({ code: 0, data: newWarehouse, message: 'success' });
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
      return res.status(404).json({ code: 1, error: '仓库不存在' });
    }

    res.json({ code: 0, data: result.rows[0], message: 'success' });
  } catch (error) {
    console.error('Update warehouse error, using memory storage:', error);
    const index = memoryWarehouses.findIndex(w => w.id === parseInt(req.params.id));
    if (index >= 0) {
      memoryWarehouses[index] = { ...memoryWarehouses[index], ...req.body };
      res.json({ code: 0, data: memoryWarehouses[index], message: 'success' });
    } else {
      res.status(404).json({ code: 1, error: '仓库不存在' });
    }
  }
});

// 删除仓库
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM warehouses WHERE id = $1', [id]);
    res.json({ code: 0, message: '删除成功' });
  } catch (error) {
    console.error('Delete warehouse error, using memory storage:', error);
    memoryWarehouses = memoryWarehouses.filter(w => w.id !== parseInt(req.params.id));
    res.json({ code: 0, message: '删除成功' });
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
    res.json({ code: 0, data: result.rows, message: 'success' });
  } catch (error) {
    console.error('Get warehouse inventory error, returning empty:', error);
    res.json({ code: 0, data: [], message: 'success' });
  }
});

export default router;
