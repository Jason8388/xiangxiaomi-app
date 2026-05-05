import express from 'express';
import multer from 'multer';
import ExcelJS from 'exceljs';
import pool, { USE_DATABASE } from '../database/db';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

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

// 内存存储：合同数据
const memoryContracts: any[] = [
  {
    id: 1,
    customer_id: 1,
    contract_number: 'CT-2025-001',
    contract_name: '示例科技有限公司设备采购合同',
    contract_type: '设备采购',
    contract_amount: 500000,
    sign_date: '2025-01-15',
    start_date: '2025-01-15',
    end_date: '2026-01-14',
    status: '执行中',
    remarks: '首次合作合同',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    customer_id: 1,
    contract_number: 'CT-2025-002',
    contract_name: '示例科技有限公司技术服务合同',
    contract_type: '技术服务',
    contract_amount: 100000,
    sign_date: '2025-02-01',
    start_date: '2025-02-01',
    end_date: '2026-01-31',
    status: '执行中',
    remarks: '年度维护服务',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 3,
    customer_id: 2,
    contract_number: 'CT-2025-003',
    contract_name: '华联实业集团设备租赁合同',
    contract_type: '设备租赁',
    contract_amount: 800000,
    sign_date: '2025-01-20',
    start_date: '2025-01-20',
    end_date: '2027-01-19',
    status: '执行中',
    remarks: '两年期租赁合同',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 4,
    customer_id: 3,
    contract_number: 'CT-2025-004',
    contract_name: '东方制造有限公司设备供应合同',
    contract_type: '设备供应',
    contract_amount: 300000,
    sign_date: '2025-02-10',
    start_date: '2025-02-10',
    end_date: '2025-05-10',
    status: '执行中',
    remarks: '生产线设备供应',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// 内存存储：设备数据
const memoryDevices: any[] = [
  {
    id: 1,
    customer_id: 1,
    device_name: '智能传感器-A001',
    device_type: '传感器',
    device_model: 'SN-A001',
    serial_number: 'SN202500001',
    install_date: '2025-01-20',
    warranty_expiry: '2026-01-20',
    status: '正常',
    location: '北京市朝阳区',
    remarks: '生产线监控',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    customer_id: 1,
    device_name: '工业控制器-C001',
    device_type: '控制器',
    device_model: 'IC-C001',
    serial_number: 'SN202500002',
    install_date: '2025-01-25',
    warranty_expiry: '2026-01-25',
    status: '正常',
    location: '北京市朝阳区',
    remarks: '生产线控制',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 3,
    customer_id: 2,
    device_name: '大型服务器-S001',
    device_type: '服务器',
    device_model: 'SV-S001',
    serial_number: 'SN202500003',
    install_date: '2025-01-22',
    warranty_expiry: '2026-01-22',
    status: '正常',
    location: '上海市浦东新区',
    remarks: '数据中心',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 4,
    customer_id: 3,
    device_name: '自动化生产线-P001',
    device_type: '生产线',
    device_model: 'PL-P001',
    serial_number: 'SN202500004',
    install_date: '2025-02-15',
    warranty_expiry: '2026-02-15',
    status: '正常',
    location: '深圳市南山区',
    remarks: '车间自动化设备',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// 内存存储：售后工单数据
const memoryWorkOrders: any[] = [
  {
    id: 1,
    customer_id: 1,
    order_number: 'WO-2025-001',
    service_type: '维修',
    description: '智能传感器故障维修服务',
    status: '已完成',
    priority: '高',
    assignee: '技术员A',
    report_date: '2025-01-28',
    completion_date: '2025-01-29',
    remarks: '传感器更换，已恢复正常',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    customer_id: 2,
    order_number: 'WO-2025-002',
    service_type: '保养',
    description: '服务器定期保养服务',
    status: '进行中',
    priority: '中',
    assignee: '技术员B',
    report_date: '2025-02-05',
    completion_date: null,
    remarks: '进行中，预计本周完成',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 3,
    customer_id: 3,
    order_number: 'WO-2025-003',
    service_type: '安装',
    description: '自动化生产线安装服务',
    status: '待处理',
    priority: '高',
    assignee: null,
    report_date: '2025-02-12',
    completion_date: null,
    remarks: '等待调度技术员',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

let memoryCustomerId = 4;

// 带超时的查询函数
async function queryWithRetry(query: string, params: any[] = [], retries = 1, delay = 500) {
  // 直接尝试查询，不检查 USE_DATABASE
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

// 获取客户列表（带分页，优先内存存储）
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 100, keyword } = req.query;
    const pageNum = parseInt(page as string) || 1;
    const limitNum = Math.min(parseInt(limit as string) || 100, 200); // 最多200条
    const offset = (pageNum - 1) * limitNum;

    // 优先使用内存存储，快速响应
    if (!USE_DATABASE) {
      let filtered = memoryCustomers;

      // 关键词搜索
      if (keyword) {
        const searchLower = keyword.toLowerCase();
        filtered = memoryCustomers.filter(c =>
          c.name.toLowerCase().includes(searchLower) ||
          c.contact.toLowerCase().includes(searchLower) ||
          c.phone.includes(keyword)
        );
      }

      // 分页
      const total = filtered.length;
      const paginated = filtered.slice(offset, offset + limitNum);

      return res.json({
        data: paginated,
        total: total,
        page: pageNum,
        limit: limitNum,
      });
    }

    // 如果数据库可用，查询数据库
    if (USE_DATABASE) {
      // 使用子查询动态统计设备和合同数量
      let query = `
        SELECT
          c.*,
          COALESCE(dc.count, 0) as device_count,
          COALESCE(cc.count, 0) as contract_count
        FROM customers c
        LEFT JOIN (SELECT customer_id, COUNT(*) as count FROM devices GROUP BY customer_id) dc ON c.id = dc.customer_id
        LEFT JOIN (SELECT customer_id, COUNT(*) as count FROM contracts GROUP BY customer_id) cc ON c.id = cc.customer_id
      `;
      let countQuery = 'SELECT COUNT(*) as total FROM customers';
      const params: any[] = [];

      // 关键词搜索
      if (keyword) {
        query += ' WHERE c.name ILIKE $1 OR c.contact ILIKE $1 OR c.phone ILIKE $1';
        countQuery += ' WHERE name ILIKE $1 OR contact ILIKE $1 OR phone ILIKE $1';
        params.push(`%${keyword}%`);
      }

      query += ` ORDER BY COALESCE(dc.count, 0) DESC, c.id DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
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
    } else {
      // 数据库不可用，返回内存数据
      let filtered = memoryCustomers;

      // 关键词搜索
      if (keyword) {
        const searchLower = keyword.toLowerCase();
        filtered = memoryCustomers.filter(c =>
          c.name.toLowerCase().includes(searchLower) ||
          c.contact.toLowerCase().includes(searchLower) ||
          c.phone.includes(keyword)
        );
      }

      // 分页
      const total = filtered.length;
      const paginated = filtered.slice(offset, offset + limitNum);

      res.json({
        data: paginated,
        total: total,
        page: pageNum,
        limit: limitNum,
      });
    }
  } catch (error) {
    console.error('Get customers error, using memory storage:', error);
    // 数据库失败时返回内存数据
    let filtered = memoryCustomers;
    const { keyword } = req.query;

    // 关键词搜索
    if (keyword) {
      const searchLower = keyword.toLowerCase();
      filtered = memoryCustomers.filter(c =>
        c.name.toLowerCase().includes(searchLower) ||
        c.contact.toLowerCase().includes(searchLower) ||
        c.phone.includes(keyword)
      );
    }

    res.json({
      data: filtered,
      total: filtered.length,
      page: 1,
      limit: 100,
    });
  }
});

// 获取客户详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let customer;

    // 如果数据库可用，先尝试查询数据库
    if (USE_DATABASE) {
      try {
        // 使用子查询动态统计设备和合同数量
        const result = await pool.query(`
          SELECT
            c.*,
            COALESCE(dc.count, 0) as device_count,
            COALESCE(cc.count, 0) as contract_count
          FROM customers c
          LEFT JOIN (SELECT customer_id, COUNT(*) as count FROM devices GROUP BY customer_id) dc ON c.id = dc.customer_id
          LEFT JOIN (SELECT customer_id, COUNT(*) as count FROM contracts GROUP BY customer_id) cc ON c.id = cc.customer_id
          WHERE c.id = $1
        `, [id]);
        if (result.rows.length > 0) {
          customer = result.rows[0];
        }
      } catch (dbError: any) {
        console.error('Database query failed, trying memory storage:', dbError.message);
      }
    }

    // 如果数据库查询失败或未找到，尝试内存存储
    if (!customer) {
      customer = memoryCustomers.find(c => c.id === parseInt(id));
    }

    if (!customer) {
      return res.status(404).json({ error: '客户不存在' });
    }

    res.json(customer);
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

// 获取客户的合同列表
router.get('/:id/contracts', async (req, res) => {
  try {
    const { id } = req.params;

    // 尝试直接查询数据库（不依赖 USE_DATABASE 标志）
    try {
      const result = await queryWithRetry(
        'SELECT * FROM contracts WHERE customer_id = $1 ORDER BY created_at DESC',
        [id],
        3,  // 增加重试次数到 3 次
        1000  // 增加延迟到 1 秒
      );
      console.log(`[Contracts] Found ${result.rows.length} contracts for customer ${id}`);
      res.json(result.rows);
      return;
    } catch (dbError: any) {
      console.error('Database query failed for contracts, using memory storage:', dbError.message);
    }

    // 如果数据库查询失败，返回内存存储的数据
    const customerContracts = memoryContracts.filter(c => c.customer_id === parseInt(id));
    console.log(`[Contracts Memory] Found ${customerContracts.length} contracts for customer ${id}`);
    res.json(customerContracts);
  } catch (error) {
    console.error('Get customer contracts error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取客户的设备列表
router.get('/:id/devices', async (req, res) => {
  try {
    const { id } = req.params;

    // 尝试直接查询数据库（不依赖 USE_DATABASE 标志）
    try {
      const result = await queryWithRetry(
        'SELECT * FROM devices WHERE customer_id = $1 ORDER BY created_at DESC',
        [id],
        3,  // 增加重试次数到 3 次
        1000  // 增加延迟到 1 秒
      );
      console.log(`[Devices] Found ${result.rows.length} devices for customer ${id}`);
      res.json(result.rows);
      return;
    } catch (dbError: any) {
      console.error('Database query failed for devices, using memory storage:', dbError.message);
    }

    // 如果数据库查询失败，返回内存存储的数据
    const customerDevices = memoryDevices.filter(d => d.customer_id === parseInt(id));
    console.log(`[Devices Memory] Found ${customerDevices.length} devices for customer ${id}`);
    res.json(customerDevices);
  } catch (error) {
    console.error('Get customer devices error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取客户的售后工单列表
router.get('/:id/work-orders', async (req, res) => {
  try {
    const { id } = req.params;

    // 尝试直接查询数据库（不依赖 USE_DATABASE 标志）
    try {
      const result = await queryWithRetry(
        'SELECT * FROM work_orders WHERE customer_id = $1 ORDER BY created_at DESC',
        [id],
        3,  // 增加重试次数到 3 次
        1000  // 增加延迟到 1 秒
      );
      console.log(`[WorkOrders] Found ${result.rows.length} work orders for customer ${id}`);
      res.json(result.rows);
      return;
    } catch (dbError: any) {
      console.error('Database query failed for work orders, using memory storage:', dbError.message);
    }

    // 如果数据库查询失败，返回内存存储的数据
    const customerWorkOrders = memoryWorkOrders.filter(wo => wo.customer_id === parseInt(id));
    console.log(`[WorkOrders Memory] Found ${customerWorkOrders.length} work orders for customer ${id}`);
    res.json(customerWorkOrders);
  } catch (error) {
    console.error('Get customer work orders error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 导出内存存储供其他路由使用
export { memoryCustomers };

// 下载客户导入模板
router.get('/import-template', async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('客户导入模板');

    // 设置表头
    worksheet.addRow([
      '客户名称*', '联系人', '联系电话', '地址', '邮箱',
      '所属行业', '客户等级', '客户来源', '业务经理', '服务看管部门', '备注'
    ]);

    // 添加示例数据
    worksheet.addRow([
      '示例科技有限公司', '张三', '13800138001', '北京市朝阳区', 'zhangsan@example.com',
      'IT行业', 'A', '线上推广', '张三', '技术服务一组', '优质客户'
    ]);

    // 设置表头样式
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E88E5' },
    };

    // 设置列宽
    worksheet.columns.forEach((column) => {
      column.width = 20;
    });

    // 生成Excel文件
    const buffer = await workbook.xlsx.writeBuffer();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=customer_import_template.xlsx');
    res.send(buffer);
  } catch (error) {
    console.error('Download template error:', error);
    res.status(500).json({ error: '下载模板失败' });
  }
});

// 批量导入客户
router.post('/import', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请上传文件' });
    }

    // 解析Excel文件
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);

    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) {
      return res.status(400).json({ error: 'Excel文件为空' });
    }

    const customersToImport: any[] = [];
    const errors: string[] = [];

    // 跳过表头，从第二行开始读取
    let rowNumber = 2;
    worksheet.eachRow({ includeEmpty: false }, (row, rowNum) => {
      if (rowNum === 1) return; // 跳过表头

      const name = row.getCell(1).text?.trim();
      const contact = row.getCell(2).text?.trim();
      const phone = row.getCell(3).text?.trim();
      const address = row.getCell(4).text?.trim();
      const email = row.getCell(5).text?.trim();
      const industry = row.getCell(6).text?.trim();
      const level = row.getCell(7).text?.trim();
      const source = row.getCell(8).text?.trim();
      const business_manager = row.getCell(9).text?.trim();
      const sub_group = row.getCell(10).text?.trim();
      const remarks = row.getCell(11).text?.trim();

      // 验证必填字段
      if (!name) {
        errors.push(`第${rowNum}行：客户名称为必填项`);
        return;
      }

      customersToImport.push({
        name,
        contact: contact || '',
        phone: phone || '',
        address: address || '',
        email: email || '',
        industry: industry || '',
        level: level || 'A',
        source: source || '',
        business_manager: business_manager || '',
        sub_group: sub_group || '',
        remarks: remarks || '',
      });
    });

    if (errors.length > 0) {
      return res.status(400).json({ error: '数据验证失败', details: errors });
    }

    if (customersToImport.length === 0) {
      return res.status(400).json({ error: '没有有效数据可导入' });
    }

    // 导入到数据库或内存存储
    let count = 0;
    if (USE_DATABASE) {
      // 使用数据库
      for (const customer of customersToImport) {
        await pool.query(
          `INSERT INTO customers (
            name, contact, phone, address, email,
            industry, level, source, business_manager, sub_group,
            remarks, status, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, '正常', NOW(), NOW())`,
          [
            customer.name,
            customer.contact,
            customer.phone,
            customer.address,
            customer.email,
            customer.industry,
            customer.level,
            customer.source,
            customer.business_manager,
            customer.sub_group,
            customer.remarks,
          ]
        );
        count++;
      }
    } else {
      // 使用内存存储
      customersToImport.forEach((customer) => {
        const newCustomer = {
          id: memoryCustomers.length + 1,
          name: customer.name,
          contact: customer.contact,
          phone: customer.phone,
          address: customer.address,
          email: customer.email,
          industry: customer.industry,
          level: customer.level,
          source: customer.source,
          business_manager: customer.business_manager,
          sub_group: customer.sub_group,
          remarks: customer.remarks,
          status: '正常',
          device_count: 0,
          contract_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        memoryCustomers.push(newCustomer);
        count++;
      });
    }

    res.json({
      success: true,
      message: `成功导入${count}条客户数据`,
      count: count,
    });
  } catch (error) {
    console.error('Import customers error:', error);
    res.status(500).json({ error: '批量导入失败' });
  }
});

// 导出客户信息
router.get('/export', async (req, res) => {
  try {
    const { ids } = req.query;
    let customers = memoryCustomers;

    // 如果指定了客户ID，则筛选
    if (ids) {
      const idArray = (ids as string).split(',').map(id => parseInt(id.trim()));
      customers = memoryCustomers.filter(c => idArray.includes(c.id));
    }

    if (customers.length === 0) {
      return res.status(400).json({ error: '没有可导出的数据' });
    }

    // 创建Excel工作簿
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('客户信息');

    // 设置表头
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: '客户名称', key: 'name', width: 25 },
      { header: '联系人', key: 'contact', width: 15 },
      { header: '联系电话', key: 'phone', width: 15 },
      { header: '地址', key: 'address', width: 30 },
      { header: '邮箱', key: 'email', width: 20 },
      { header: '所属行业', key: 'industry', width: 15 },
      { header: '客户等级', key: 'level', width: 10 },
      { header: '客户来源', key: 'source', width: 15 },
      { header: '业务经理', key: 'business_manager', width: 15 },
      { header: '服务看管部门', key: 'sub_group', width: 18 },
      { header: '备注', key: 'remarks', width: 30 },
      { header: '状态', key: 'status', width: 10 },
      { header: '创建时间', key: 'created_at', width: 20 },
    ];

    // 设置表头样式
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E88E5' },
    };

    // 添加数据
    customers.forEach((customer: any) => {
      worksheet.addRow({
        id: customer.id,
        name: customer.name || '',
        contact: customer.contact || '',
        phone: customer.phone || '',
        address: customer.address || '',
        email: customer.email || '',
        industry: customer.industry || '',
        level: customer.level || 'A',
        source: customer.source || '',
        business_manager: customer.business_manager || '',
        sub_group: customer.sub_group || '',
        remarks: customer.remarks || '',
        status: customer.status || '正常',
        created_at: customer.created_at ? new Date(customer.created_at).toLocaleString('zh-CN') : '',
      });
    });

    // 设置数据行样式
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.alignment = { vertical: 'middle' };
        if (rowNumber % 2 === 0) {
          row.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF8F9FF' },
          };
        }
      }
    });

    // 生成文件
    const buffer = await workbook.xlsx.writeBuffer();
    const filename = `客户信息_${new Date().toISOString().slice(0, 10)}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error('Export customers error:', error);
    res.status(500).json({ error: '导出失败' });
  }
});

export default router;
