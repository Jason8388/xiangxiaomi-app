import express from 'express';
import pool, { USE_DATABASE } from '../database/db';
import XLSX from 'xlsx';

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

// 下载导入模板
router.get('/template', (req, res) => {
  // CSV 格式的物料导入模板
  const template = `物料编号,物料名称,规格型号,单位,分类,当前库存,预警库存,供应商,单价,存放位置,备注
MAT-001,示例物料1,M8*30mm,盒,紧固件,100,50,供应商名称,15.50,A区-01-01,这是示例数据
MAT-002,示例物料2,5L/桶,桶,润滑剂,50,20,供应商名称,128.00,B区-02-03,这是示例数据`;

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="material_template.csv"');
  res.send(template);
});

// 批量导出物料
router.get('/batch-export', async (req, res) => {
  try {
    let materials: any[] = [];
    try {
      const result = await queryWithRetry('SELECT * FROM materials ORDER BY id DESC');
      materials = result.rows;
    } catch (error) {
      console.error('Query materials error, using memory storage:', error);
      materials = memoryMaterials;
    }

    if (materials.length === 0) {
      return res.status(404).json({ error: '暂无物料数据' });
    }

    // 准备导出数据（包含所有字段）
    const exportData = materials.map((m: any) => ({
      'ID': m.id,
      '物料编号': m.material_number || m.code || '',
      '物料名称': m.material_name || m.name || '',
      '规格型号': m.material_spec || m.spec || '',
      '单位': m.material_unit || m.unit || '',
      '分类': m.category || '',
      '当前库存': m.stock_quantity || m.current_stock || 0,
      '预警库存': m.warning_stock || m.min_stock || 0,
      '供应商': m.supplier || '',
      '单价': m.unit_price || m.price || 0,
      '物料图片': m.material_photo || m.photo || '',
      '二维码ID': m.qr_code_id || '',
      '标签': m.tags && Array.isArray(m.tags) ? m.tags.join(', ') : '',
      '备注': m.remarks || m.note || m.description || '',
      '创建时间': m.created_at ? new Date(m.created_at).toLocaleString('zh-CN') : '',
      '更新时间': m.updated_at ? new Date(m.updated_at).toLocaleString('zh-CN') : '',
    }));

    // 创建工作簿和工作表
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // 设置列宽
    worksheet['!cols'] = [
      { wch: 8 },  // ID
      { wch: 15 }, // 物料编号
      { wch: 20 }, // 物料名称
      { wch: 15 }, // 规格型号
      { wch: 8 },  // 单位
      { wch: 12 }, // 分类
      { wch: 10 }, // 当前库存
      { wch: 10 }, // 预警库存
      { wch: 15 }, // 供应商
      { wch: 10 }, // 单价
      { wch: 25 }, // 物料图片
      { wch: 15 }, // 二维码ID
      { wch: 20 }, // 标签
      { wch: 25 }, // 备注
      { wch: 20 }, // 创建时间
      { wch: 20 }, // 更新时间
    ];

    // 添加工作表到工作簿
    XLSX.utils.book_append_sheet(workbook, worksheet, '物料清单');

    // 生成文件并返回
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="' + encodeURIComponent('物料清单_' + new Date().getTime() + '.xlsx') + '"');
    res.send(buffer);
  } catch (error: any) {
    console.error('Batch export materials error:', error);
    res.status(500).json({ error: error.message || '导出失败' });
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
    // 兼容前端字段名
    const { name, material_name, code, material_number, category, material_category, unit, material_unit, specification, material_spec, min_stock, stock_quantity, material_photo, qr_code_id, remarks, tags } = req.body;

    const materialName = name || material_name;
    const materialCode = code || material_number;
    const materialCategory = category || material_category;
    const materialUnit = unit || material_unit;
    const materialSpec = specification || material_spec;

    if (!materialName || !materialCode) {
      return res.status(400).json({ error: '物料名称和编码不能为空' });
    }

    // 如果没有提供二维码ID，自动生成
    const finalQrCodeId = qr_code_id || `QR-${materialCode}-${Date.now()}`;

    try {
      const result = await pool.query(
        `INSERT INTO materials (
          name, code, category, unit, specification, min_stock,
          material_photo, qr_code_id, remarks, tags,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *`,
        [
          materialName, materialCode, materialCategory, materialUnit, materialSpec, min_stock || 0,
          material_photo, finalQrCodeId, remarks, tags || []
        ]
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
        material_photo,
        qr_code_id: finalQrCodeId,
        remarks,
        tags,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      memoryMaterials.unshift(newMaterial);
      res.json(newMaterial);
    }
  } catch (error) {
    console.error('Create material error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 更新物料
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, material_name, code, material_number, category, material_category,
      unit, material_unit, specification, material_spec,
      min_stock, stock_quantity, supplier, unit_price,
      material_photo, qr_code_id, remarks, tags
    } = req.body;

    const materialName = name || material_name;
    const materialCode = code || material_number;
    const materialCategory = category || material_category;
    const materialUnit = unit || material_unit;
    const materialSpec = specification || material_spec;

    try {
      const result = await pool.query(
        `UPDATE materials SET
          name = COALESCE($1, name),
          code = COALESCE($2, code),
          category = COALESCE($3, category),
          unit = COALESCE($4, unit),
          specification = COALESCE($5, specification),
          min_stock = COALESCE($6, min_stock),
          supplier = COALESCE($7, supplier),
          unit_price = COALESCE($8, unit_price),
          material_photo = COALESCE($9, material_photo),
          qr_code_id = COALESCE($10, qr_code_id),
          remarks = COALESCE($11, remarks),
          tags = COALESCE($12, tags),
          updated_at = CURRENT_TIMESTAMP
          WHERE id = $13 RETURNING *`,
        [
          materialName, materialCode, materialCategory, materialUnit, materialSpec,
          min_stock, supplier, unit_price, material_photo, qr_code_id, remarks, tags, id
        ]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: '物料不存在' });
      }

      res.json(result.rows[0]);
    } catch (dbError: any) {
      console.error('Database error, using memory storage:', dbError.message);
      const index = memoryMaterials.findIndex(m => m.id === parseInt(id));
      if (index !== -1) {
        memoryMaterials[index] = {
          ...memoryMaterials[index],
          ...(materialName && { name: materialName }),
          ...(materialCode && { code: materialCode }),
          ...(materialCategory && { category: materialCategory }),
          ...(materialUnit && { unit: materialUnit }),
          ...(materialSpec && { specification: materialSpec }),
          ...(min_stock !== undefined && { min_stock }),
          ...(stock_quantity !== undefined && { stock_quantity }),
          ...(supplier !== undefined && { supplier }),
          ...(unit_price !== undefined && { unit_price }),
          ...(material_photo !== undefined && { material_photo }),
          ...(qr_code_id !== undefined && { qr_code_id }),
          ...(remarks !== undefined && { remarks }),
          ...(tags !== undefined && { tags }),
          updated_at: new Date().toISOString(),
        };
        res.json(memoryMaterials[index]);
      } else {
        res.status(404).json({ error: '物料不存在' });
      }
    }
  } catch (error: any) {
    console.error('Update material error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 删除物料
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    try {
      await pool.query('DELETE FROM material_inventory WHERE material_id = $1', [id]);
      await pool.query('DELETE FROM materials WHERE id = $1', [id]);
      res.json({ message: '删除成功' });
    } catch (dbError: any) {
      console.error('Database error, using memory storage:', dbError.message);
      const index = memoryMaterials.findIndex(m => m.id === parseInt(id));
      if (index !== -1) {
        memoryMaterials.splice(index, 1);
        res.json({ message: '删除成功' });
      } else {
        res.status(404).json({ error: '物料不存在' });
      }
    }
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
