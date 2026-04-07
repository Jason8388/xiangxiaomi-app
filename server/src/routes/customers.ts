import express from 'express';
import pool, { USE_DATABASE } from '../database/db';

const router = express.Router();

// 内存数据存储（用于数据库不可用时）
const memoryCustomers: any[] = [
  {
    id: 1,
    name: '示例科技有限公司',
    contact_person: '张三',
    contact_phone: '13800138001',
    address: '北京市朝阳区科技园区A座',
    email: 'zhangsan@example.com',
    industry: 'IT行业',
    level: 'A',
    source: '线上推广',
    status: '正常',
    business_manager: '张三',
    sub_group: '技术服务一组',
    device_count: 5,
    contract_count: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    name: '华联实业集团',
    contact_person: '李四',
    contact_phone: '13800138002',
    address: '上海市浦东新区金融中心B栋',
    email: 'lisi@example.com',
    industry: '金融服务',
    level: 'A',
    source: '客户介绍',
    status: '正常',
    business_manager: '李四',
    sub_group: '技术服务二组',
    device_count: 12,
    contract_count: 5,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 3,
    name: '东方制造有限公司',
    contact_person: '王五',
    contact_phone: '13800138003',
    address: '深圳市南山区科技园C座',
    email: 'wangwu@example.com',
    industry: '制造业',
    level: 'B',
    source: '行业展会',
    status: '正常',
    business_manager: '王五',
    sub_group: '技术服务三组',
    device_count: 8,
    contract_count: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];
let memoryCustomerId = 4;

// 带超时的查询函数
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

// 获取客户列表（带分页）
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 100, keyword } = req.query;
    const pageNum = parseInt(page as string) || 1;
    const limitNum = Math.min(parseInt(limit as string) || 100, 200); // 最多200条
    const offset = (pageNum - 1) * limitNum;

    let query = 'SELECT * FROM customers';
    let countQuery = 'SELECT COUNT(*) as total FROM customers';
    const params: any[] = [];

    // 关键词搜索
    if (keyword) {
      query += ' WHERE name ILIKE $1 OR contact ILIKE $1 OR phone ILIKE $1';
      countQuery += ' WHERE name ILIKE $1 OR contact ILIKE $1 OR phone ILIKE $1';
      params.push(`%${keyword}%`);
    }

    query += ` ORDER BY device_count DESC, id DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limitNum, offset);

    const [result, countResult] = await Promise.all([
      queryWithRetry(query, params),
      queryWithRetry(countQuery, keyword ? [`%${keyword}%`] : []),
    ]);

    res.json({
      data: result.rows,
      total: parseInt(countResult.rows[0].total),
      page: pageNum,
      limit: limitNum,
    });
  } catch (error) {
    console.error('Get customers error, using memory storage:', error);
    // 数据库失败时返回内存数据
    res.json({
      data: memoryCustomers,
      total: memoryCustomers.length,
      page: 1,
      limit: 100,
    });
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
    // 兼容前端字段名
    const { name, customer_name, contact, contact_person, phone, contact_phone, email, address, remark, customer_address, business_manager, sub_group, industry, remarks } = req.body;
    
    const customerName = name || customer_name;
    const contactName = contact || contact_person;
    const phoneNumber = phone || contact_phone;
    const customerAddress = address || customer_address;
    const remarkText = remark || remarks;

    if (!customerName) {
      return res.status(400).json({ error: '客户名称不能为空' });
    }

    try {
      const result = await queryWithRetry(
        'INSERT INTO customers (name, contact, phone, email, address, remark, business_manager, sub_group, industry) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
        [customerName, contactName, phoneNumber, email, customerAddress, remarkText, business_manager || '', sub_group || '', industry || '']
      );
      res.json(result.rows[0]);
    } catch (dbError: any) {
      console.error('Database error, using memory storage:', dbError.message);
      // 数据库失败时使用内存存储
      const newCustomer = {
        id: memoryCustomerId++,
        name: customerName,
        contact: contactName,
        phone: phoneNumber,
        email,
        address: customerAddress,
        remark: remarkText,
        business_manager: business_manager || '',
        sub_group: sub_group || '',
        industry: industry || '',
        device_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      memoryCustomers.push(newCustomer);
      res.json(newCustomer);
    }
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 更新客户
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, contact, phone, email, address, remark, remarks, business_manager, sub_group, industry } = req.body;
    const remarkText = remark || remarks;

    try {
      const result = await pool.query(
        'UPDATE customers SET name = $1, contact = $2, phone = $3, email = $4, address = $5, remark = $6, business_manager = $7, sub_group = $8, industry = $9, updated_at = CURRENT_TIMESTAMP WHERE id = $10 RETURNING *',
        [name, contact, phone, email, address, remarkText, business_manager || '', sub_group || '', industry || '', id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: '客户不存在' });
      }

      res.json(result.rows[0]);
    } catch (dbError: any) {
      console.error('Database error, using memory storage:', dbError.message);
      // 数据库失败时使用内存存储
      const index = memoryCustomers.findIndex(c => c.id === parseInt(id));
      if (index === -1) {
        return res.status(404).json({ error: '客户不存在' });
      }
      memoryCustomers[index] = {
        ...memoryCustomers[index],
        name, contact, phone, email, address,
        remark: remarkText,
        business_manager: business_manager || '',
        sub_group: sub_group || '',
        industry: industry || '',
        updated_at: new Date().toISOString(),
      };
      res.json(memoryCustomers[index]);
    }
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 删除客户
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (USE_DATABASE) {
      await pool.query('DELETE FROM customers WHERE id = $1', [id]);
    } else {
      // 内存存储模式
      const index = memoryCustomers.findIndex(c => c.id === parseInt(id));
      if (index === -1) {
        return res.status(404).json({ error: '客户不存在' });
      }
      memoryCustomers.splice(index, 1);
    }
    
    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

export default router;
