import express from 'express';
import multer from 'multer';
import pool from '../database/db';

const router = express.Router();

// 配置multer用于文件上传
const storage = multer.memoryStorage();
const upload = multer({ storage });

// 检查是否使用内存存储
const USE_MEMORY_STORAGE = true; // 数据库超时，启用内存存储

// 带重试的查询函数
async function queryWithRetry(query: string, params: any[] = [], retries = 3, delay = 1000) {
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

// 内存设备数据
let memoryDevices: any[] = [
  {
    id: 1,
    device_number: 'D0001',
    device_name: '智能焊接机器人-X100',
    device_model: 'X100-PRO',
    factory_serial_number: 'SN202401150001',
    device_type: '智能焊接',
    customer_name: '航天科技集团',
    factory_date: '2024-01-15',
    acceptance_date: '2024-02-15',
    warranty_end_date: '2025-01-15',
    status: '正常',
    contract_name: '焊接设备采购合同-2024-001',
    contract_number: 'HT-2024-001',
    location: '生产车间A区-01号工位',
    qr_code: 'QR-2024-001',
    photos: [],
    remarks: '首次安装调试完成，运行正常',
  },
  {
    id: 2,
    device_number: 'D0002',
    device_name: '智能测温仪-T500',
    device_model: 'T500-ULTRA',
    factory_serial_number: 'SN202402200002',
    device_type: '智能测温',
    customer_name: '电子科技股份',
    factory_date: '2024-02-20',
    acceptance_date: '2024-03-20',
    warranty_end_date: '2025-02-20',
    status: '正常',
    contract_name: '测温设备采购合同-2024-002',
    contract_number: 'HT-2024-002',
    location: '质检中心-03号检测台',
    qr_code: 'QR-2024-002',
    photos: [],
    remarks: '精度校准完成，检测范围-50℃至500℃',
  },
  {
    id: 3,
    device_number: 'D0003',
    device_name: '外观品检机-AI200',
    device_model: 'AI200-SMART',
    factory_serial_number: 'SN202403100003',
    device_type: '外观品检',
    customer_name: '精密制造公司',
    factory_date: '2024-03-10',
    acceptance_date: '2024-04-10',
    warranty_end_date: '2025-03-10',
    status: '维修中',
    contract_name: '品检设备采购合同-2024-003',
    contract_number: 'HT-2024-003',
    location: '质检车间-B区-05号工位',
    qr_code: 'QR-2024-003',
    photos: [],
    remarks: '视觉系统故障，待维修更换',
  },
];

// 获取设备列表（带分页）
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 100, customer_id } = req.query;
    const pageNum = parseInt(page as string) || 1;
    const limitNum = Math.min(parseInt(limit as string) || 100, 200);
    const offset = (pageNum - 1) * limitNum;

    if (USE_MEMORY_STORAGE) {
      // 使用内存存储
      let filtered = [...memoryDevices];
      if (customer_id) {
        filtered = filtered.filter(d => d.customer_id === parseInt(customer_id as string));
      }
      const total = filtered.length;
      const paginated = filtered.slice(offset, offset + limitNum);
      res.json({
        data: paginated,
        total,
        page: pageNum,
        limit: limitNum,
      });
      return;
    }

    let query = 'SELECT d.*, cu.name as customer_name, c.contract_no FROM devices d LEFT JOIN customers cu ON d.customer_id = cu.id LEFT JOIN contracts c ON d.contract_id = c.id';
    let countQuery = 'SELECT COUNT(*) as total FROM devices d';
    const params: any[] = [];
    const countParams: any[] = [];

    if (customer_id) {
      query += ' WHERE d.customer_id = $1';
      countQuery += ' WHERE d.customer_id = $1';
      params.push(customer_id);
      countParams.push(customer_id);
    }

    query += ` ORDER BY d.id DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limitNum, offset);

    const [result, countResult] = await Promise.all([
      queryWithRetry(query, params),
      queryWithRetry(countQuery, countParams),
    ]);

    res.json({
      data: result.rows,
      total: parseInt(countResult.rows[0].total),
      page: pageNum,
      limit: limitNum,
    });
  } catch (error) {
    console.error('Get devices error, using memory storage:', error);
    // 数据库失败时返回内存数据
    res.json({
      data: memoryDevices,
      total: memoryDevices.length,
      page: 1,
      limit: 100,
    });
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

// 获取设备详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (USE_MEMORY_STORAGE) {
      // 使用内存存储
      const device = memoryDevices.find((d) => d.id === parseInt(id as string));
      if (!device) {
        return res.status(404).json({ error: '设备不存在' });
      }

      // 直接返回内存数据，格式化日期字段
      const formattedDevice = {
        id: device.id,
        device_number: device.device_number || `D${String(device.id).padStart(4, '0')}`,
        device_name: device.device_name,
        device_model: device.device_model || '',
        factory_serial_number: device.factory_serial_number || '',
        device_type: device.device_type || '其它',
        customer_name: device.customer_name || '',
        factory_date: device.factory_date || '',
        acceptance_date: device.acceptance_date || '',
        warranty_end_date: device.warranty_end_date || '',
        status: device.status || '正常',
        contract_name: device.contract_name || '',
        contract_number: device.contract_number || '',
        location: device.location || '',
        qr_code_id: device.qr_code || '',
        qr_code_url: '',
        photos: device.photos || [],
        remarks: device.remarks || '',
        service_number: device.service_number || '',
      };
      res.json(formattedDevice);
    } else {
      // 使用数据库
      const result = await pool.query(
        'SELECT * FROM devices WHERE id = $1',
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: '设备不存在' });
      }

      res.json(result.rows[0]);
    }
  } catch (error) {
    console.error('Get device detail error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 创建设备
router.post('/', upload.fields([{ name: 'site_photo_0' }, { name: 'site_photo_1' }, { name: 'site_photo_2' }, { name: 'site_photo_3' }, { name: 'site_photo_4' }]), async (req, res) => {
  try {
    const files = req.files as any;

    if (USE_MEMORY_STORAGE) {
      // 使用内存存储
      const {
        device_number,
        device_name,
        device_model,
        device_type,
        customer_name,
        factory_date,
        acceptance_date,
        warranty_end_date,
        contract_name,
        contract_number,
        location,
        remarks,
        qr_code,
        service_number,
      } = req.body;

      if (!device_number || !device_name) {
        return res.status(400).json({ error: '缺少必填字段' });
      }

      const newDevice = {
        id: memoryDevices.length + 1,
        device_number: device_number || `D${String(memoryDevices.length + 1).padStart(4, '0')}`,
        device_name: device_name,
        device_model: device_model || '',
        factory_serial_number: device_number, // 使用设备编号作为出厂序列号
        device_type: device_type || '其它',
        customer_name: customer_name || '',
        factory_date: factory_date || '',
        acceptance_date: acceptance_date || '',
        warranty_end_date: warranty_end_date || '',
        status: '正常',
        contract_name: contract_name || '',
        contract_number: contract_number || '',
        location: location || '',
        qr_code: qr_code || `S${memoryDevices.length + 1}`,
        photos: [] as string[],
        remarks: remarks || '',
        service_number: service_number || '',
        created_at: new Date(),
        updated_at: new Date(),
      };

      // 处理照片（转换为base64存储，演示用途）
      if (files) {
        Object.keys(files).forEach((key) => {
          if (files[key] && files[key][0]) {
            const photoBuffer = files[key][0].buffer;
            newDevice.photos.push(`data:image/jpeg;base64,${photoBuffer.toString('base64')}`);
          }
        });
      }

      memoryDevices.push(newDevice);
      res.json(newDevice);
    } else {
      // 使用数据库
      const { customer_id, contract_id, device_number, device_name, device_model, device_type, customer_name, factory_date, acceptance_date, warranty_end_date, contract_name, location, remarks, qr_code, service_number } = req.body;

      if (!device_number || !device_name) {
        return res.status(400).json({ error: '缺少必填字段' });
      }

      // 处理现场照片
      const sitePhotos: string[] = [];
      if (files) {
        Object.keys(files).forEach((key) => {
          if (files[key] && files[key][0]) {
            const photoBuffer = files[key][0].buffer;
            sitePhotos.push(`data:image/jpeg;base64,${photoBuffer.toString('base64')}`);
          }
        });
      }

      // 生成设备二维码
      const deviceQrCode = qr_code || null;

      const result = await pool.query(
        `INSERT INTO devices (
          customer_id, contract_id, device_number, device_name, device_model, device_type,
          customer_name, factory_date, acceptance_date, warranty_end_date, contract_name,
          location, remarks, site_photos, qr_code, service_number, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW(), NOW())
        RETURNING *`,
        [
          customer_id || null,
          contract_id || null,
          device_number,
          device_name,
          device_model,
          device_type,
          customer_name,
          factory_date,
          acceptance_date,
          warranty_end_date,
          contract_name,
          location,
          remarks,
          JSON.stringify(sitePhotos),
          deviceQrCode,
          service_number || null,
          'normal'
        ]
      );

      res.json(result.rows[0]);
    }
  } catch (error) {
    console.error('Create device error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 更新设备
router.put('/:id', upload.fields([{ name: 'site_photo_0' }, { name: 'site_photo_1' }, { name: 'site_photo_2' }, { name: 'site_photo_3' }, { name: 'site_photo_4' }]), async (req, res) => {
  try {
    const { id } = req.params;
    const files = req.files as any;

    if (USE_MEMORY_STORAGE) {
      // 使用内存存储
      const {
        device_number,
        device_name,
        device_model,
        device_type,
        customer_name,
        factory_date,
        acceptance_date,
        warranty_end_date,
        contract_name,
        contract_number,
        location,
        remarks,
        service_number
      } = req.body;

      const deviceIndex = memoryDevices.findIndex((d) => d.id === parseInt(id as string));
      if (deviceIndex === -1) {
        return res.status(404).json({ error: '设备不存在' });
      }

      const device = memoryDevices[deviceIndex];
      if (device_number !== undefined) device.device_number = device_number;
      if (device_name !== undefined) device.device_name = device_name;
      if (device_model !== undefined) device.device_model = device_model;
      if (device_type !== undefined) device.device_type = device_type;
      if (customer_name !== undefined) device.customer_name = customer_name;
      if (factory_date !== undefined) device.factory_date = factory_date;
      if (acceptance_date !== undefined) device.acceptance_date = acceptance_date;
      if (warranty_end_date !== undefined) device.warranty_end_date = warranty_end_date;
      if (contract_name !== undefined) device.contract_name = contract_name;
      if (contract_number !== undefined) device.contract_number = contract_number;
      if (location !== undefined) device.location = location;
      if (remarks !== undefined) device.remarks = remarks;
      if (service_number !== undefined) device.service_number = service_number;
      device.updated_at = new Date();

      // 处理照片
      if (files && Object.keys(files).length > 0) {
        device.photos = [] as string[];
        Object.keys(files).forEach((key) => {
          if (files[key] && files[key][0]) {
            const photoBuffer = files[key][0].buffer;
            device.photos.push(`data:image/jpeg;base64,${photoBuffer.toString('base64')}`);
          }
        });
      }

      res.json(device);
    } else {
      // 使用数据库
      const { device_number, device_name, device_model, device_type, customer_name, factory_date, acceptance_date, warranty_end_date, contract_name, location, remarks, qr_code, service_number } = req.body;

      // 处理现场照片
      let sitePhotos: string[] = [];
      if (files && Object.keys(files).length > 0) {
        Object.keys(files).forEach((key) => {
          if (files[key] && files[key][0]) {
            const photoBuffer = files[key][0].buffer;
            sitePhotos.push(`data:image/jpeg;base64,${photoBuffer.toString('base64')}`);
          }
        });
      }

      // 构建更新SQL
      const updateFields = [];
      const updateValues = [];
      let paramIndex = 1;

      if (device_number) {
        updateFields.push(`device_number = $${paramIndex++}`);
        updateValues.push(device_number);
      }
      if (device_name) {
        updateFields.push(`device_name = $${paramIndex++}`);
        updateValues.push(device_name);
      }
      if (device_model) {
        updateFields.push(`device_model = $${paramIndex++}`);
        updateValues.push(device_model);
      }
      if (device_type) {
        updateFields.push(`device_type = $${paramIndex++}`);
        updateValues.push(device_type);
      }
      if (customer_name) {
        updateFields.push(`customer_name = $${paramIndex++}`);
        updateValues.push(customer_name);
      }
      if (factory_date) {
        updateFields.push(`factory_date = $${paramIndex++}`);
        updateValues.push(factory_date);
      }
      if (acceptance_date) {
        updateFields.push(`acceptance_date = $${paramIndex++}`);
        updateValues.push(acceptance_date);
      }
      if (warranty_end_date) {
        updateFields.push(`warranty_end_date = $${paramIndex++}`);
        updateValues.push(warranty_end_date);
      }
      if (contract_name) {
        updateFields.push(`contract_name = $${paramIndex++}`);
        updateValues.push(contract_name);
      }
      if (location) {
        updateFields.push(`location = $${paramIndex++}`);
        updateValues.push(location);
      }
      if (remarks) {
        updateFields.push(`remarks = $${paramIndex++}`);
        updateValues.push(remarks);
      }
      if (qr_code) {
        updateFields.push(`qr_code = $${paramIndex++}`);
        updateValues.push(qr_code);
      }
      if (service_number !== undefined) {
        updateFields.push(`service_number = $${paramIndex++}`);
        updateValues.push(service_number);
      }
      if (sitePhotos.length > 0) {
        updateFields.push(`site_photos = $${paramIndex++}`);
        updateValues.push(JSON.stringify(sitePhotos));
      }

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      updateValues.push(id);

      const result = await pool.query(
        `UPDATE devices SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
        updateValues
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: '设备不存在' });
      }

      res.json(result.rows[0]);
    }
  } catch (error) {
    console.error('Update device error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 删除设备
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deviceId = parseInt(id as string);

    if (USE_MEMORY_STORAGE) {
      // 使用内存存储
      const deviceIndex = memoryDevices.findIndex((d) => d.id === deviceId);
      if (deviceIndex === -1) {
        return res.status(404).json({ error: '设备不存在' });
      }
      memoryDevices.splice(deviceIndex, 1);
      res.json({ message: '删除成功' });
    } else {
      // 使用数据库
      await pool.query('DELETE FROM devices WHERE id = $1', [id]);
      res.json({ message: '删除成功' });
    }
  } catch (error) {
    console.error('Delete device error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取设备履历表详情
router.get('/:deviceId/history-detail', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const result = await pool.query(
      'SELECT * FROM device_history_detail WHERE device_id = $1',
      [deviceId]
    );
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      // 返回空对象，允许前端创建新的履历表
      res.json({
        device_id: parseInt(deviceId),
        device_name: '',
        product_spec: '',
        device_code: '',
        contract_name: '',
        contract_number: '',
        contract_date: '',
        customer_name: '',
        sales_manager: '',
        warranty_period: '',
        production_unit: '',
        production_order: '',
        batch_number: '',
        production_manager: '',
        production_complete_date: '',
        tester: '',
        debug_complete_date: '',
        quality_inspector: '',
        factory_inspector: '',
        factory_date: '',
        manufacturing_sop_file: '',
        factory_test_files: '',
        warranty_scope_price: '',
        delivery_pm: '',
        customer_contact: '',
        delivery_location: '',
        delivery_person: '',
        planned_arrival_date: '',
        actual_arrival_date: '',
        acceptance_manager: '',
        customer_acceptance_stakeholders: '',
        planned_acceptance_date: '',
        actual_acceptance_date: '',
        warranty_expiry_date: '',
        delivery_team: '',
        customer_training_personnel: '',
        device_warranty_period: '',
        operation_sop: '',
        training_confirmation_file: '',
        maintenance_sop: '',
        solution_files: '',
        software_version: '',
      });
    }
  } catch (error) {
    console.error('Get device history detail error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 创建或更新设备履历表详情
router.put('/:deviceId/history-detail', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const data = req.body;

    // 检查是否已存在记录
    const checkResult = await pool.query(
      'SELECT id FROM device_history_detail WHERE device_id = $1',
      [deviceId]
    );

    if (checkResult.rows.length > 0) {
      // 更新现有记录
      const result = await pool.query(
        `UPDATE device_history_detail SET
          device_name = $1,
          product_spec = $2,
          device_code = $3,
          contract_name = $4,
          contract_number = $5,
          contract_date = $6,
          customer_name = $7,
          sales_manager = $8,
          warranty_period = $9,
          production_unit = $10,
          production_order = $11,
          batch_number = $12,
          production_manager = $13,
          production_complete_date = $14,
          tester = $15,
          debug_complete_date = $16,
          quality_inspector = $17,
          factory_inspector = $18,
          factory_date = $19,
          manufacturing_sop_file = $20,
          factory_test_files = $21,
          warranty_scope_price = $22,
          delivery_pm = $23,
          customer_contact = $24,
          delivery_location = $25,
          delivery_person = $26,
          planned_arrival_date = $27,
          actual_arrival_date = $28,
          acceptance_manager = $29,
          customer_acceptance_stakeholders = $30,
          planned_acceptance_date = $31,
          actual_acceptance_date = $32,
          warranty_expiry_date = $33,
          delivery_team = $34,
          customer_training_personnel = $35,
          device_warranty_period = $36,
          operation_sop = $37,
          training_confirmation_file = $38,
          maintenance_sop = $39,
          solution_files = $40,
          software_version = $41,
          updated_at = NOW()
        WHERE device_id = $42
        RETURNING *`,
        [
          data.device_name,
          data.product_spec,
          data.device_code,
          data.contract_name,
          data.contract_number,
          data.contract_date,
          data.customer_name,
          data.sales_manager,
          data.warranty_period,
          data.production_unit,
          data.production_order,
          data.batch_number,
          data.production_manager,
          data.production_complete_date,
          data.tester,
          data.debug_complete_date,
          data.quality_inspector,
          data.factory_inspector,
          data.factory_date,
          data.manufacturing_sop_file,
          data.factory_test_files,
          data.warranty_scope_price,
          data.delivery_pm,
          data.customer_contact,
          data.delivery_location,
          data.delivery_person,
          data.planned_arrival_date,
          data.actual_arrival_date,
          data.acceptance_manager,
          data.customer_acceptance_stakeholders,
          data.planned_acceptance_date,
          data.actual_acceptance_date,
          data.warranty_expiry_date,
          data.delivery_team,
          data.customer_training_personnel,
          data.device_warranty_period,
          data.operation_sop,
          data.training_confirmation_file,
          data.maintenance_sop,
          data.solution_files,
          data.software_version,
          parseInt(deviceId),
        ]
      );
      res.json(result.rows[0]);
    } else {
      // 创建新记录
      const result = await pool.query(
        `INSERT INTO device_history_detail (
          device_id, device_name, product_spec, device_code,
          contract_name, contract_number, contract_date, customer_name, sales_manager, warranty_period,
          production_unit, production_order, batch_number, production_manager, production_complete_date,
          tester, debug_complete_date, quality_inspector, factory_inspector, factory_date,
          manufacturing_sop_file, factory_test_files, warranty_scope_price,
          delivery_pm, customer_contact, delivery_location, delivery_person,
          planned_arrival_date, actual_arrival_date, acceptance_manager, customer_acceptance_stakeholders,
          planned_acceptance_date, actual_acceptance_date, warranty_expiry_date,
          delivery_team, customer_training_personnel, device_warranty_period,
          operation_sop, training_confirmation_file, maintenance_sop,
          solution_files, software_version,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41, $42, NOW(), NOW())
        RETURNING *`,
        [
          parseInt(deviceId),
          data.device_name,
          data.product_spec,
          data.device_code,
          data.contract_name,
          data.contract_number,
          data.contract_date,
          data.customer_name,
          data.sales_manager,
          data.warranty_period,
          data.production_unit,
          data.production_order,
          data.batch_number,
          data.production_manager,
          data.production_complete_date,
          data.tester,
          data.debug_complete_date,
          data.quality_inspector,
          data.factory_inspector,
          data.factory_date,
          data.manufacturing_sop_file,
          data.factory_test_files,
          data.warranty_scope_price,
          data.delivery_pm,
          data.customer_contact,
          data.delivery_location,
          data.delivery_person,
          data.planned_arrival_date,
          data.actual_arrival_date,
          data.acceptance_manager,
          data.customer_acceptance_stakeholders,
          data.planned_acceptance_date,
          data.actual_acceptance_date,
          data.warranty_expiry_date,
          data.delivery_team,
          data.customer_training_personnel,
          data.device_warranty_period,
          data.operation_sop,
          data.training_confirmation_file,
          data.maintenance_sop,
          data.solution_files,
          data.software_version,
        ]
      );
      res.json(result.rows[0]);
    }
  } catch (error) {
    console.error('Save device history detail error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 删除设备履历表详情
router.delete('/:deviceId/history-detail', async (req, res) => {
  try {
    const { deviceId } = req.params;
    await pool.query('DELETE FROM device_history_detail WHERE device_id = $1', [deviceId]);
    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('Delete device history detail error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取设备履历表列表
router.get('/:deviceId/history', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const result = await pool.query(
      'SELECT * FROM device_history WHERE device_id = $1 ORDER BY event_date DESC, created_at DESC',
      [deviceId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get device history error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 创建设备履历记录
router.post('/:deviceId/history', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { event_type, event_date, description } = req.body;

    if (!event_type || !event_date) {
      return res.status(400).json({ error: '缺少必填字段' });
    }

    const result = await pool.query(
      `INSERT INTO device_history (device_id, event_type, event_date, description, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING *`,
      [deviceId, event_type, event_date, description]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Create device history error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 删除设备履历记录
router.delete('/:deviceId/history/:historyId', async (req, res) => {
  try {
    const { deviceId, historyId } = req.params;
    await pool.query(
      'DELETE FROM device_history WHERE id = $1 AND device_id = $2',
      [historyId, deviceId]
    );
    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('Delete device history error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

export default router;
