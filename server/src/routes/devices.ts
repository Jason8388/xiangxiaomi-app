import express from 'express';
import multer from 'multer';
import ExcelJS from 'exceljs';
import pool from '../database/db';
import { uploadFileToOSS } from '../utils/oss';
import { deviceHistoryList, getDeviceHistoryDetail, saveDeviceHistoryDetail } from '../database/memory-storage';

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

// 下载设备信息导入模板
router.get('/template', async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('设备信息导入模板');

    // 设置表头
    worksheet.columns = [
      { header: '设备出厂编号 *', key: 'device_number', width: 20 },
      { header: '设备名称 *', key: 'device_name', width: 25 },
      { header: '设备型号 *', key: 'device_model', width: 20 },
      { header: '设备类型 *', key: 'device_type', width: 15 },
      { header: '归属客户 *', key: 'customer_name', width: 20 },
      { header: '设备服务编号', key: 'service_number', width: 20 },
      { header: '进厂日期', key: 'factory_date', width: 15 },
      { header: '验收日期', key: 'acceptance_date', width: 15 },
      { header: '质保到期日期', key: 'warranty_end_date', width: 15 },
      { header: '合同名称', key: 'contract_name', width: 30 },
      { header: '合同编号', key: 'contract_number', width: 20 },
      { header: '设备所在位置', key: 'location', width: 30 },
      { header: '备注', key: 'remarks', width: 30 },
    ];

    // 添加示例数据
    worksheet.addRow({
      device_number: 'D0004',
      device_name: '智能测量仪-M100',
      device_model: 'M100-PRO',
      device_type: '智能测量',
      customer_name: '测试客户',
      service_number: 'SV001',
      factory_date: '2024-01-01',
      acceptance_date: '2024-02-01',
      warranty_end_date: '2025-01-01',
      contract_name: '测试合同',
      contract_number: 'HT-TEST-001',
      location: '测试地点',
      remarks: '测试备注',
    });

    // 设置表头样式
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E88E5' },
    };

    // 设置列宽
    worksheet.columns.forEach((column) => {
      if (column.header?.includes('*')) {
        column.width = 25;
      }
    });

    // 生成Excel文件
    const buffer = await workbook.xlsx.writeBuffer();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=device_import_template.xlsx');
    res.send(buffer);
  } catch (error) {
    console.error('Download template error:', error);
    res.status(500).json({ error: '下载模板失败' });
  }
});

// 批量导入设备信息
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

    const devicesToImport: any[] = [];
    const errors: string[] = [];

    // 跳过表头，从第二行开始读取
    let rowNumber = 2;
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) return; // 跳过表头

      const device_number = row.getCell(1).text?.trim();
      const device_name = row.getCell(2).text?.trim();
      const device_model = row.getCell(3).text?.trim();
      const device_type = row.getCell(4).text?.trim();
      const customer_name = row.getCell(5).text?.trim();
      const service_number = row.getCell(6).text?.trim();
      const factory_date = row.getCell(7).text?.trim();
      const acceptance_date = row.getCell(8).text?.trim();
      const warranty_end_date = row.getCell(9).text?.trim();
      const contract_name = row.getCell(10).text?.trim();
      const contract_number = row.getCell(11).text?.trim();
      const location = row.getCell(12).text?.trim();
      const remarks = row.getCell(13).text?.trim();

      // 验证必填字段
      if (!device_number || !device_name || !device_model || !device_type || !customer_name) {
        errors.push(`第${rowNumber}行：设备出厂编号、设备名称、设备型号、设备类型、归属客户为必填项`);
        return;
      }

      devicesToImport.push({
        device_number,
        device_name,
        device_model,
        device_type,
        customer_name,
        service_number,
        factory_date,
        acceptance_date,
        warranty_end_date,
        contract_name,
        contract_number,
        location,
        remarks,
      });
    });

    if (errors.length > 0) {
      return res.status(400).json({ error: '数据验证失败', details: errors });
    }

    if (devicesToImport.length === 0) {
      return res.status(400).json({ error: '没有有效数据可导入' });
    }

    // 导入到数据库或内存存储
    let count = 0;
    if (USE_MEMORY_STORAGE) {
      // 使用内存存储
      devicesToImport.forEach((device) => {
        const newDevice = {
          id: memoryDevices.length + 1,
          device_number: device.device_number,
          device_name: device.device_name,
          device_model: device.device_model,
          factory_serial_number: device.device_number,
          device_type: device.device_type,
          customer_name: device.customer_name,
          factory_date: device.factory_date || '',
          acceptance_date: device.acceptance_date || '',
          warranty_end_date: device.warranty_end_date || '',
          status: '正常',
          contract_name: device.contract_name || '',
          contract_number: device.contract_number || '',
          location: device.location || '',
          qr_code: `S${memoryDevices.length + 1}`,
          photos: [],
          remarks: device.remarks || '',
          service_number: device.service_number || '',
          created_at: new Date(),
          updated_at: new Date(),
        };
        memoryDevices.push(newDevice);
        count++;
      });
    } else {
      // 使用数据库
      for (const device of devicesToImport) {
        await pool.query(
          `INSERT INTO devices (
            device_number, device_name, device_model, device_type, customer_name,
            factory_date, acceptance_date, warranty_end_date, contract_name, contract_number,
            location, remarks, service_number, qr_code, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())`,
          [
            device.device_number,
            device.device_name,
            device.device_model,
            device.device_type,
            device.customer_name,
            device.factory_date || null,
            device.acceptance_date || null,
            device.warranty_end_date || null,
            device.contract_name || null,
            device.contract_number || null,
            device.location || null,
            device.remarks || null,
            device.service_number || null,
            `S${Date.now()}`,
          ]
        );
        count++;
      }
    }

    res.json({ message: '导入成功', count });
  } catch (error) {
    console.error('Import devices error:', error);
    res.status(500).json({ error: '导入失败' });
  }
});

// 导出设备信息
router.get('/export', async (req, res) => {
  try {
    const { ids } = req.query;
    let devices = memoryDevices;

    // 如果指定了设备ID，则筛选
    if (ids) {
      const idArray = (ids as string).split(',').map(id => parseInt(id.trim()));
      devices = memoryDevices.filter(d => idArray.includes(d.id));
    }

    if (devices.length === 0) {
      return res.status(400).json({ error: '没有可导出的数据' });
    }

    // 创建Excel工作簿
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('设备信息');

    // 设置表头
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: '设备出厂编号', key: 'device_number', width: 20 },
      { header: '设备名称', key: 'device_name', width: 25 },
      { header: '设备型号', key: 'device_model', width: 20 },
      { header: '设备类型', key: 'device_type', width: 15 },
      { header: '归属客户', key: 'customer_name', width: 20 },
      { header: '设备服务编号', key: 'service_number', width: 20 },
      { header: '进厂日期', key: 'factory_date', width: 15 },
      { header: '验收日期', key: 'acceptance_date', width: 15 },
      { header: '质保到期日期', key: 'warranty_end_date', width: 15 },
      { header: '合同名称', key: 'contract_name', width: 30 },
      { header: '合同编号', key: 'contract_number', width: 20 },
      { header: '设备所在位置', key: 'location', width: 30 },
      { header: '备注', key: 'remarks', width: 30 },
      { header: '状态', key: 'status', width: 10 },
    ];

    // 设置表头样式
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E88E5' },
    };

    // 添加数据
    devices.forEach((device) => {
      worksheet.addRow({
        id: device.id,
        device_number: device.device_number,
        device_name: device.device_name,
        device_model: device.device_model,
        device_type: device.device_type,
        customer_name: device.customer_name,
        service_number: device.service_number || '',
        factory_date: device.factory_date || '',
        acceptance_date: device.acceptance_date || '',
        warranty_end_date: device.warranty_end_date || '',
        contract_name: device.contract_name || '',
        contract_number: device.contract_number || '',
        location: device.location || '',
        remarks: device.remarks || '',
        status: device.status || '正常',
      });
    });

    // 生成Excel文件
    const buffer = await workbook.xlsx.writeBuffer();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    const filename = `设备信息导出_${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Disposition', `attachment; filename=${encodeURIComponent(filename)}`);
    res.send(buffer);
  } catch (error) {
    console.error('Export devices error:', error);
    res.status(500).json({ error: '导出失败' });
  }
});

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

// 设备履历表

// 获取设备履历表
router.get('/device-history/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { type } = req.query;

    if (USE_MEMORY_STORAGE) {
      const historyList = deviceHistoryList.filter(h => h.device_id === parseInt(deviceId));
      if (type) {
        const filtered = historyList.filter(h => h.type === type);
        return res.json({ code: 0, data: filtered, message: 'success' });
      }
      return res.json({ code: 0, data: historyList, message: 'success' });
    }

    let query = 'SELECT * FROM device_history WHERE device_id = $1';
    const params: any[] = [deviceId];
    if (type) {
      query += ' AND type = $2';
      params.push(type);
    }
    query += ' ORDER BY date DESC';

    const result = await pool.query(query, params);
    res.json({ code: 0, data: result.rows, message: 'success' });
  } catch (error) {
    console.error('获取设备履历表失败:', error);
    res.status(500).json({ code: 500, message: '获取设备履历表失败' });
  }
});


// 设备统计
router.get('/stats', async (req, res) => {
  try {
    if (USE_MEMORY_STORAGE) {
      const devices = memoryDevices;
      const stats = {
        total: devices.length,
        inUse: devices.filter(d => d.status === '在用').length,
        idle: devices.filter(d => d.status === '闲置').length,
        repairing: devices.filter(d => d.status === '维修中').length,
        scrapped: devices.filter(d => d.status === '已报废').length,
      };
      return res.json(stats);
    }
    
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = '在用' THEN 1 END) as in_use,
        COUNT(CASE WHEN status = '闲置' THEN 1 END) as idle,
        COUNT(CASE WHEN status = '维修中' THEN 1 END) as repairing,
        COUNT(CASE WHEN status = '已报废' THEN 1 END) as scrapped
      FROM devices
    `);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get device stats error:', error);
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

      // 处理照片（上传到OSS）
      if (files) {
        await Promise.all(Object.keys(files).map(async (key) => {
          if (files[key] && files[key][0]) {
            const photoBuffer = files[key][0].buffer;
            const photoName = `site_photo_${Date.now()}_${key}.jpg`;
            const ossUrl = await uploadFileToOSS(photoBuffer, photoName, 'image/jpeg');
            newDevice.photos.push(ossUrl);
          }
        }));
      }

      memoryDevices.push(newDevice);
      res.json(newDevice);
    } else {
      // 使用数据库
      const { customer_id, contract_id, device_number, device_name, device_model, device_type, customer_name, factory_date, acceptance_date, warranty_end_date, contract_name, location, remarks, qr_code, service_number } = req.body;

      if (!device_number || !device_name) {
        return res.status(400).json({ error: '缺少必填字段' });
      }

      // 处理现场照片（上传到OSS）
      const sitePhotos: string[] = [];
      if (files) {
        await Promise.all(Object.keys(files).map(async (key) => {
          if (files[key] && files[key][0]) {
            const photoBuffer = files[key][0].buffer;
            const photoName = `site_photo_${Date.now()}_${key}.jpg`;
            const ossUrl = await uploadFileToOSS(photoBuffer, photoName, 'image/jpeg');
            sitePhotos.push(ossUrl);
          }
        }));
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

      // 处理照片（上传到OSS）
      if (files && Object.keys(files).length > 0) {
        device.photos = [] as string[];
        await Promise.all(Object.keys(files).map(async (key) => {
          if (files[key] && files[key][0]) {
            const photoBuffer = files[key][0].buffer;
            const photoName = `site_photo_${Date.now()}_${key}.jpg`;
            const ossUrl = await uploadFileToOSS(photoBuffer, photoName, 'image/jpeg');
            device.photos.push(ossUrl);
          }
        }));
      }

      res.json(device);
    } else {
      // 使用数据库
      const { device_number, device_name, device_model, device_type, customer_name, factory_date, acceptance_date, warranty_end_date, contract_name, location, remarks, qr_code, service_number } = req.body;

      // 处理现场照片（上传到OSS）
      let sitePhotos: string[] = [];
      if (files && Object.keys(files).length > 0) {
        await Promise.all(Object.keys(files).map(async (key) => {
          if (files[key] && files[key][0]) {
            const photoBuffer = files[key][0].buffer;
            const photoName = `site_photo_${Date.now()}_${key}.jpg`;
            const ossUrl = await uploadFileToOSS(photoBuffer, photoName, 'image/jpeg');
            sitePhotos.push(ossUrl);
          }
        }));
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
    
    // 尝试从数据库获取
    if (!USE_MEMORY_STORAGE) {
      const result = await pool.query(
        'SELECT * FROM device_history_detail WHERE device_id = $1',
        [deviceId]
      );
      if (result.rows.length > 0) {
        res.json(result.rows[0]);
        return;
      }
    }
    
    // 从内存存储获取
    const detail = getDeviceHistoryDetail(parseInt(deviceId));
    if (detail) {
      res.json(detail);
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
    if (USE_MEMORY_STORAGE) {
      const history = deviceHistoryList.filter(h => h.device_id === parseInt(deviceId));
      res.json(history);
    } else {
      const result = await pool.query(
        'SELECT * FROM device_history WHERE device_id = $1 ORDER BY event_date DESC, created_at DESC',
        [deviceId]
      );
      res.json(result.rows);
    }
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

// 导出设备履历表详情
router.get('/:deviceId/history-detail/export', async (req, res) => {
  try {
    const { deviceId } = req.params;

    let historyData: any = null;

    // 尝试从数据库获取设备履历表详情
    try {
      const result = await pool.query(
        'SELECT * FROM device_history_detail WHERE device_id = $1',
        [deviceId]
      );

      if (result.rows.length > 0) {
        historyData = result.rows[0];
      }
    } catch (error: any) {
      console.log('Database query failed for device history detail, will use memory storage if available:', error.message);
    }

    // 如果数据库查询失败或无数据，尝试使用内存存储的设备信息
    if (!historyData && USE_MEMORY_STORAGE) {
      console.log(`[History Export] Using memory storage for device ${deviceId}`);
      const device = memoryDevices.find(d => d.id === parseInt(deviceId));
      if (device) {
        // 使用设备信息生成履历表数据
        historyData = {
          device_name: device.device_name,
          product_spec: device.device_model,
          device_code: device.device_number,
          contract_name: device.contract_name,
          contract_number: device.contract_number,
          contract_date: device.factory_date,
          customer_name: device.customer_name,
          factory_date: device.factory_date,
          acceptance_date: device.acceptance_date,
          warranty_end_date: device.warranty_end_date,
          warranty_period: device.warranty_end_date,
          location: device.location,
          remarks: device.remarks,
        };
      }
    }

    // 如果仍然没有数据，返回错误
    if (!historyData) {
      return res.status(404).json({ error: '未找到设备履历表' });
    }

    // 导出为Excel
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('设备履历表');

    // 创建工作表数据
    const worksheetData = [
      ['设备履历表'],
      [],
      ['基本信息'],
      ['字段名称', '内容'],
      ['设备名称', historyData.device_name || ''],
      ['产品规格', historyData.product_spec || ''],
      ['设备编码', historyData.device_code || ''],
      [],
      ['销售订单信息'],
      ['字段名称', '内容'],
      ['合同名称', historyData.contract_name || ''],
      ['合同编号', historyData.contract_number || ''],
      ['合同签订日期', historyData.contract_date || ''],
      ['客户名称', historyData.customer_name || ''],
      ['业务经理', historyData.sales_manager || ''],
      ['设备质保期', historyData.warranty_period || ''],
      [],
      ['制造信息'],
      ['字段名称', '内容'],
      ['生产单位', historyData.production_unit || ''],
      ['生产订单号', historyData.production_order || ''],
      ['批次号', historyData.batch_number || ''],
      ['生产负责人', historyData.production_manager || ''],
      ['生产完工日期', historyData.production_complete_date || ''],
      ['测试人', historyData.tester || ''],
      ['调试完工日期', historyData.debug_complete_date || ''],
      ['质检员', historyData.quality_inspector || ''],
      ['出厂检验人', historyData.factory_inspector || ''],
      ['出厂日期', historyData.factory_date || ''],
      ['设备制造SOP文件', historyData.manufacturing_sop_file || ''],
      ['出厂检验文件包', historyData.factory_test_files || ''],
      ['设备质保范围与价格标准', historyData.warranty_scope_price || ''],
      [],
      ['交付验收信息'],
      ['字段名称', '内容'],
      ['项目交付PM', historyData.delivery_pm || ''],
      ['客户现场对接人', historyData.customer_contact || ''],
      ['交付厂区/车间区域', historyData.delivery_location || ''],
      ['交付人', historyData.delivery_person || ''],
      ['计划进场时间', historyData.planned_arrival_date || ''],
      ['实际进场时间', historyData.actual_arrival_date || ''],
      ['验收负责人', historyData.acceptance_manager || ''],
      ['客户验收干系人', historyData.customer_acceptance_stakeholders || ''],
      ['计划验收时间', historyData.planned_acceptance_date || ''],
      ['实际验收时间', historyData.actual_acceptance_date || ''],
      ['设备质保到期时间', historyData.warranty_expiry_date || ''],
      ['交付协同人员', historyData.delivery_team || ''],
      ['客户培训人员', historyData.customer_training_personnel || ''],
      ['设备质保期', historyData.device_warranty_period || ''],
      ['设备操作SOP', historyData.operation_sop || ''],
      ['设备培训确认单文件', historyData.training_confirmation_file || ''],
      ['设备维保SOP', historyData.maintenance_sop || ''],
      [],
      ['研发信息'],
      ['字段名称', '内容'],
      ['方案文件', historyData.solution_files || ''],
      ['出厂软件算法版本说明', historyData.software_version || ''],
      [],
      ['附件信息'],
      ['文件名称', '说明'],
    ];

    // 添加数据到工作表
    worksheetData.forEach((row, rowIndex) => {
      const worksheetRow = worksheet.addRow(row);

      // 设置标题样式
      if (rowIndex === 0) {
        worksheetRow.font = { bold: true, size: 16 };
        worksheetRow.alignment = { horizontal: 'center' };
        worksheet.mergeCells('A1:B1');
      }
      // 设置分类标题样式
      else if (row && row[0] && !row[1] && row[0].endsWith('信息')) {
        worksheetRow.font = { bold: true, size: 14, color: { argb: 'FF1E88E5' } };
        worksheetRow.alignment = { horizontal: 'left' };
      }
      // 设置表头样式
      else if (rowIndex > 0 && worksheetData[rowIndex - 1] && worksheetData[rowIndex - 1][0] && !worksheetData[rowIndex - 1][1]) {
        worksheetRow.font = { bold: true, size: 12 };
        worksheetRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE3F2FD' },
        };
      }
      // 设置数据行样式
      else if (rowIndex > 0 && row[1]) {
        worksheetRow.alignment = { vertical: 'top', wrapText: true };
      }
    });

    // 设置列宽
    worksheet.getColumn(1).width = 30;
    worksheet.getColumn(2).width = 50;

    // 解析附件
    if (historyData.attachments) {
      try {
        const attachmentList = JSON.parse(historyData.attachments);
        if (Array.isArray(attachmentList) && attachmentList.length > 0) {
          attachmentList.forEach((attachment: any) => {
            const row = worksheet.addRow([
              attachment.name || '',
              `大小: ${attachment.size ? formatFileSize(attachment.size) : ''}`
            ]);
            row.alignment = { vertical: 'top', wrapText: true };
          });
        } else {
          worksheet.addRow(['暂无附件', '']);
        }
      } catch {
        worksheet.addRow(['暂无附件', '']);
      }
    } else {
      worksheet.addRow(['暂无附件', '']);
    }

    // 生成Excel文件
    const excelBuffer = await workbook.xlsx.writeBuffer();

    // 设置响应头
    const filename = `设备履历表_${historyData.device_name || deviceId}_${new Date().getTime()}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
    res.setHeader('Content-Length', excelBuffer.length);

    res.send(excelBuffer);
  } catch (error) {
    console.error('Export device history detail error:', error);
    res.status(500).json({ error: '导出失败' });
  }
});

// 设备批量导入
router.post('/batch', upload.single('file'), async (req: any, res: any) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请上传Excel文件' });
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);
    const worksheet = workbook.getWorksheet(1);

    if (!worksheet) {
      return res.status(400).json({ error: 'Excel文件格式错误' });
    }

    const devices: any[] = [];
    let startRow = 1; // 默认从第一行开始读取

    // 检查第一行是否是表头
    const firstRow = worksheet.getRow(1);
    const firstCellValue = firstRow.getCell(1).value?.toString().toLowerCase() || '';
    
    // 如果第一行是"设备编号"或"设备名称"，则跳过表头从第二行开始
    if (firstCellValue.includes('设备编号') || firstCellValue.includes('设备名称') || firstCellValue.includes('设备')) {
      startRow = 2;
    }

    // 从指定行开始读取数据
    for (let rowNum = startRow; rowNum <= worksheet.rowCount; rowNum++) {
      const row = worksheet.getRow(rowNum);
      
      // 检查是否有有效数据
      const deviceCode = row.getCell(1).value?.toString().trim() || '';
      const deviceName = row.getCell(2).value?.toString().trim() || '';
      
      if (!deviceCode && !deviceName) continue;

      devices.push({
        device_code: deviceCode || `DEV${Date.now()}${rowNum}`,
        device_name: deviceName || '',
        device_type: row.getCell(3).value?.toString().trim() || '',
        model: row.getCell(4).value?.toString().trim() || '',
        manufacturer: row.getCell(5).value?.toString().trim() || '',
        serial_number: row.getCell(6).value?.toString().trim() || '',
        install_location: row.getCell(7).value?.toString().trim() || '',
        customer_name: row.getCell(8).value?.toString().trim() || '',
        status: (row.getCell(9).value?.toString().trim() || '正常').replace('正常', '正常').replace('维修中', '维修中').replace('已报废', '已报废') || '正常',
        purchase_date: row.getCell(10).value ? new Date(row.getCell(10).value) : null,
        warranty_expiry: row.getCell(11).value ? new Date(row.getCell(11).value) : null,
        qr_code: row.getCell(12).value?.toString().trim() || '',
        service_number: row.getCell(13).value?.toString().trim() || '',
        remarks: row.getCell(14).value?.toString().trim() || '',
      });
    }

    if (devices.length === 0) {
      return res.status(400).json({ error: 'Excel文件中没有有效数据' });
    }

    let successCount = 0;
    let failCount = 0;
    const failedRows: any[] = [];

    // 批量插入设备
    for (let i = 0; i < devices.length; i++) {
      const device = devices[i];
      try {
        // 如果有客户名称，先查找客户ID
        let customerId = null;
        if (device.customer_name) {
          const customerResult = await queryWithRetry(
            'SELECT id FROM customers WHERE name = $1 LIMIT 1',
            [device.customer_name]
          );
          if (customerResult.rows.length > 0) {
            customerId = customerResult.rows[0].id;
          }
        }

        const query = `
          INSERT INTO devices (
            device_code, device_name, device_type, model, manufacturer,
            serial_number, install_location, customer_id, status,
            purchase_date, warranty_expiry, qr_code, service_number, remarks,
            created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
          ON CONFLICT (device_code) DO UPDATE SET
            device_name = EXCLUDED.device_name,
            device_type = EXCLUDED.device_type,
            model = EXCLUDED.model,
            updated_at = NOW()
          RETURNING id
        `;

        await queryWithRetry(query, [
          device.device_code,
          device.device_name,
          device.device_type,
          device.model,
          device.manufacturer,
          device.serial_number,
          device.install_location,
          customerId,
          device.status,
          device.purchase_date,
          device.warranty_expiry,
          device.qr_code,
          device.service_number,
          device.remarks,
        ]);

        // 更新内存存储
        const existingIndex = memoryDevices.findIndex(d => d.device_code === device.device_code);
        if (existingIndex >= 0) {
          memoryDevices[existingIndex] = {
            ...memoryDevices[existingIndex],
            device_name: device.device_name,
            device_type: device.device_type,
            model: device.model,
            manufacturer: device.manufacturer,
            serial_number: device.serial_number,
            install_location: device.install_location,
            customer_name: device.customer_name,
            status: device.status,
            purchase_date: device.purchase_date,
            warranty_expiry: device.warranty_expiry,
            qr_code: device.qr_code,
            service_number: device.service_number,
            remarks: device.remarks,
            updated_at: new Date().toISOString(),
          };
        } else {
          memoryDevices.push({
            id: memoryDevices.length + 1,
            device_code: device.device_code,
            device_name: device.device_name,
            device_type: device.device_type,
            model: device.model,
            manufacturer: device.manufacturer,
            serial_number: device.serial_number,
            install_location: device.install_location,
            customer_id: customerId,
            customer_name: device.customer_name,
            status: device.status,
            purchase_date: device.purchase_date,
            warranty_expiry: device.warranty_expiry,
            qr_code: device.qr_code,
            service_number: device.service_number,
            remarks: device.remarks,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }

        successCount++;
      } catch (error: any) {
        failCount++;
        failedRows.push({
          row: i + startRow + 1,
          device_code: device.device_code,
          error: error.message,
        });
      }
    }

    res.json({
      success: true,
      message: `导入完成：成功 ${successCount} 条，失败 ${failCount} 条`,
      successCount,
      failCount,
      failedRows: failCount > 0 ? failedRows : undefined,
    });
  } catch (error: any) {
    console.error('Batch import devices error:', error);
    res.status(500).json({ error: '批量导入失败: ' + error.message });
  }
});

// 格式化文件大小
function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// 导出内存存储供其他路由使用
export { memoryDevices };

export default router;
