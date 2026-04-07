import express from 'express';
import pool, { USE_DATABASE } from '../database/db';

const router = express.Router();

// 内存数据存储
const memoryMaterials: any[] = [
  {
    id: 1,
    qr_code_id: 'M1A2B3C4D5E6',
    name: '标准螺丝 M8x30',
    code: 'MAT-001',
    category: '紧固件',
    unit: '盒',
    spec: 'M8*30mm 不锈钢',
    min_stock: 100,
    current_stock: 250,
    location: 'A区-01-01',
    supplier: '华东五金',
    price: 15.50,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    qr_code_id: 'M7G8H9I0J1K',
    name: '工业润滑油 5L',
    code: 'MAT-002',
    category: '润滑剂',
    unit: '桶',
    spec: '5L/桶 长城牌',
    min_stock: 20,
    current_stock: 45,
    location: 'B区-02-03',
    supplier: '石化物资',
    price: 128.00,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 3,
    qr_code_id: 'ML2N3O4P5Q6',
    name: '防护手套',
    code: 'MAT-003',
    category: '劳保用品',
    unit: '副',
    spec: '加厚耐磨款 L码',
    min_stock: 500,
    current_stock: 1200,
    location: 'C区-03-02',
    supplier: '劳保商城',
    price: 8.00,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 4,
    qr_code_id: 'MR7S8T9U0V1',
    name: '电缆线 2.5平方',
    code: 'MAT-004',
    category: '电气材料',
    unit: '米',
    spec: '100米/卷 阻燃型',
    min_stock: 50,
    current_stock: 80,
    location: 'D区-04-01',
    supplier: '电线电缆厂',
    price: 3.20,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];
let memoryMaterialId = 5;

// 带重试的查询函数
async function queryWithRetry(query: string, params: any[] = [], retries = 1, delay = 500) {
  if (!USE_DATABASE) {
    throw new Error('Database not available');
  }
  for (let i = 0; i < retries; i++) {
    try {
      return await pool.query(query, params);
    } catch (error: any) {
      if (i < retries - 1 && (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.message.includes('timeout') || error.message.includes('terminated'))) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries reached');
}

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

    const result = await queryWithRetry(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get materials error, using memory storage:', error);
    res.json(memoryMaterials);
  }
});

// 创建物料
router.post('/', async (req, res) => {
  try {
    // 兼容前端字段名
    const { name, material_name, code, material_number, category, material_category, unit, material_unit, specification, material_spec, min_stock, stock_quantity } = req.body;
    
    const materialName = name || material_name;
    const materialCode = code || material_number;
    const materialCategory = category || material_category;
    const materialUnit = unit || material_unit;
    const materialSpec = specification || material_spec;

    if (!materialName || !materialCode) {
      return res.status(400).json({ error: '物料名称和编码不能为空' });
    }

    try {
      const result = await queryWithRetry(
        'INSERT INTO materials (name, code, category, unit, specification, min_stock) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [materialName, materialCode, materialCategory, materialUnit, materialSpec, min_stock || 0]
      );
      res.json(result.rows[0]);
    } catch (dbError: any) {
      console.error('Database error, using memory storage:', dbError.message);
      const newMaterial = {
        id: memoryMaterialId++,
        name: materialName,
        code: materialCode,
        category: materialCategory,
        unit: materialUnit,
        specification: materialSpec,
        min_stock: min_stock || 0,
        stock_quantity: stock_quantity || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      memoryMaterials.push(newMaterial);
      res.json(newMaterial);
    }
  } catch (error) {
    console.error('Create material error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取物料详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    try {
      const result = await pool.query('SELECT * FROM materials WHERE id = $1', [id]);
      if (result.rows.length === 0) {
        // 尝试从内存数据中查找
        const memoryMaterial = memoryMaterials.find(m => m.id === parseInt(id));
        if (memoryMaterial) {
          return res.json({ code: 0, data: memoryMaterial, message: 'success' });
        }
        return res.status(404).json({ code: 1, error: '物料不存在' });
      }
      res.json({ code: 0, data: result.rows[0], message: 'success' });
    } catch (dbError: any) {
      console.error('Database error, using memory storage:', dbError.message);
      // 从内存数据中查找
      const memoryMaterial = memoryMaterials.find(m => m.id === parseInt(id));
      if (memoryMaterial) {
        return res.json({ code: 0, data: memoryMaterial, message: 'success' });
      }
      return res.status(404).json({ code: 1, error: '物料不存在' });
    }
  } catch (error) {
    console.error('Get material error:', error);
    res.status(500).json({ code: 1, error: '服务器错误' });
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
    const {
      material_number, material_name, material_spec, material_unit,
      category, stock_quantity, warning_stock, supplier, unit_price,
      material_photo, qr_code_id, remarks, tags
    } = req.body;

    if (!material_number || !material_name) {
      return res.status(400).json({ error: '物料编号和名称不能为空' });
    }

    // 如果没有提供二维码ID，自动生成
    const finalQrCodeId = qr_code_id || `QR-${material_number}-${Date.now()}`;

    const result = await pool.query(
      `INSERT INTO materials (
        material_number, material_name, material_spec, material_unit,
        category, stock_quantity, warning_stock, supplier, unit_price,
        material_photo, qr_code_id, remarks, tags,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *`,
      [
        material_number, material_name, material_spec, material_unit,
        category, stock_quantity || 0, warning_stock || 0, supplier, unit_price,
        material_photo, finalQrCodeId, remarks, tags || []
      ]
    );

    res.status(201).json(result.rows[0]);
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
    const {
      material_number, material_name, material_spec, material_unit,
      category, stock_quantity, warning_stock, supplier, unit_price,
      material_photo, qr_code_id, remarks, tags
    } = req.body;

    const result = await pool.query(
      `UPDATE materials SET
        material_number = COALESCE($1, material_number),
        material_name = COALESCE($2, material_name),
        material_spec = COALESCE($3, material_spec),
        material_unit = COALESCE($4, material_unit),
        category = COALESCE($5, category),
        stock_quantity = COALESCE($6, stock_quantity),
        warning_stock = COALESCE($7, warning_stock),
        supplier = COALESCE($8, supplier),
        unit_price = COALESCE($9, unit_price),
        material_photo = COALESCE($10, material_photo),
        qr_code_id = COALESCE($11, qr_code_id),
        remarks = COALESCE($12, remarks),
        tags = COALESCE($13, tags),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $14 RETURNING *`,
      [
        material_number, material_name, material_spec, material_unit,
        category, stock_quantity, warning_stock, supplier, unit_price,
        material_photo, qr_code_id, remarks, tags, id
      ]
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
