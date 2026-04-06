import express from 'express';
import multer from 'multer';
import pool from '../database/db';

const router = express.Router();

// 配置multer用于文件上传
const storage = multer.memoryStorage();
const upload = multer({ storage });

// 检查是否使用内存存储
const USE_MEMORY_STORAGE = false; // 设备管理需要数据库支持

// 内存设备数据
let memoryDevices: any[] = [
  {
    id: 1,
    customer_id: 1,
    contract_id: 1,
    device_name: '服务器-1',
    serial_no: 'SN00001',
    model: 'MDL-2024-1',
    purchase_date: '2024-01-01',
    warranty_expire: '2025-01-01',
    status: 'normal',
    site_photos: [],
    qr_code: 'S1',
  },
];

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
router.post('/', upload.fields([{ name: 'site_photo_0' }, { name: 'site_photo_1' }, { name: 'site_photo_2' }, { name: 'site_photo_3' }, { name: 'site_photo_4' }]), async (req, res) => {
  try {
    const files = req.files as any;

    if (USE_MEMORY_STORAGE) {
      // 使用内存存储
      const { customer_id, contract_id, device_name, serial_no, model, purchase_date, warranty_expire, status, qr_code } = req.body;

      if (!device_name) {
        return res.status(400).json({ error: '缺少必填字段' });
      }

      const newDevice = {
        id: memoryDevices.length + 1,
        customer_id: parseInt(customer_id) || 1,
        contract_id: parseInt(contract_id) || null,
        device_name,
        serial_no,
        model,
        purchase_date,
        warranty_expire,
        status: status || 'normal',
        qr_code: qr_code || `S${memoryDevices.length + 1}`,
        site_photos: [] as string[],
        created_at: new Date(),
        updated_at: new Date(),
      };

      // 处理照片（转换为base64存储，演示用途）
      if (files) {
        Object.keys(files).forEach((key) => {
          if (files[key] && files[key][0]) {
            const photoBuffer = files[key][0].buffer;
            newDevice.site_photos.push(`data:image/jpeg;base64,${photoBuffer.toString('base64')}`);
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
      const { device_name, serial_no, model, purchase_date, warranty_expire, status, qr_code } = req.body;

      const deviceIndex = memoryDevices.findIndex((d) => d.id === parseInt(id as string));
      if (deviceIndex === -1) {
        return res.status(404).json({ error: '设备不存在' });
      }

      const device = memoryDevices[deviceIndex];
      device.device_name = device_name || device.device_name;
      device.serial_no = serial_no || device.serial_no;
      device.model = model || device.model;
      device.purchase_date = purchase_date || device.purchase_date;
      device.warranty_expire = warranty_expire || device.warranty_expire;
      device.status = status || device.status;
      device.qr_code = qr_code || device.qr_code;
      device.updated_at = new Date();

      // 处理照片
      if (files && Object.keys(files).length > 0) {
        device.site_photos = [] as string[];
        Object.keys(files).forEach((key) => {
          if (files[key] && files[key][0]) {
            const photoBuffer = files[key][0].buffer;
            device.site_photos.push(`data:image/jpeg;base64,${photoBuffer.toString('base64')}`);
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
    await pool.query('DELETE FROM devices WHERE id = $1', [id]);
    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('Delete device error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

export default router;
