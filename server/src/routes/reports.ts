import express from 'express';
import pool from '../database/db.js';
import * as XLSX from 'xlsx';
import { memoryContracts, memoryDevices, memoryWorkOrders } from '../database/memory-storage.js';

const router = express.Router();

/**
 * 服务端文件：server/src/routes/reports.ts
 * 接口：GET /api/v1/reports/customers
 * 描述：获取客户统计信息，包含合同数、设备数、工单数
 */
router.get('/customers', async (req, res) => {
  try {
    // 从合同数据中提取客户
    const customerMap = new Map();

    // 遍历合同，统计每个客户的合同数
    memoryContracts.forEach(contract => {
      if (!customerMap.has(contract.customer_name)) {
        customerMap.set(contract.customer_name, {
          customer_id: contract.customer_id,
          customer_name: contract.customer_name,
          contract_count: 0,
          device_count: 0,
          work_order_count: 0,
        });
      }
      const customer = customerMap.get(contract.customer_name);
      customer.contract_count++;
    });

    // 统计每个客户的设备数
    memoryDevices.forEach(device => {
      if (customerMap.has(device.customer_name)) {
        const customer = customerMap.get(device.customer_name);
        customer.device_count++;
      }
    });

    // 统计每个客户的工单数
    memoryWorkOrders.forEach(workOrder => {
      if (customerMap.has(workOrder.customer_name)) {
        const customer = customerMap.get(workOrder.customer_name);
        customer.work_order_count++;
      }
    });

    // 转换为数组
    let customers = Array.from(customerMap.values());

    // 如果有查询参数，进行过滤
    const { search } = req.query;
    console.log('[Reports] search param:', search, 'type:', typeof search);

    if (search && typeof search === 'string') {
      console.log('[Reports] filtering customers by:', search);
      customers = customers.filter(customer =>
        customer.customer_name.includes(search)
      );
      console.log('[Reports] filtered customers count:', customers.length);
    }

    // 计算总数
    const summary = {
      total_customers: customers.length,
      total_contracts: customers.reduce((sum, c) => sum + c.contract_count, 0),
      total_devices: customers.reduce((sum, c) => sum + c.device_count, 0),
      total_work_orders: customers.reduce((sum, c) => sum + c.work_order_count, 0),
    };

    res.json({
      summary,
      details: customers,
    });
  } catch (error) {
    console.error('Failed to fetch customers:', error);
    res.status(500).json({ error: '获取客户统计信息失败' });
  }
});

/**
 * 服务端文件：server/src/routes/reports.ts
 * 接口：GET /api/v1/reports/customers/:customerId/contracts
 * 描述：获取客户的合同列表
 * Query 参数：无
 */
router.get('/customers/:customerId/contracts', async (req, res) => {
  try {
    const { customerId } = req.params;

    if (!customerId || isNaN(Number(customerId))) {
      return res.status(400).json({ error: '客户ID无效' });
    }

    // 从合同数据中筛选客户的合同
    const contracts = memoryContracts.filter(
      contract => contract.customer_id === Number(customerId)
    ).map(contract => ({
      contract_number: contract.contract_number,
      contract_name: contract.contract_name,
      contract_amount: contract.contract_amount,
      sign_date: contract.sign_date,
      acceptance_date: contract.acceptance_date,
      status: contract.status,
      remarks: contract.remarks,
    }));

    res.json(contracts);
  } catch (error) {
    console.error('Failed to fetch customer contracts:', error);
    res.status(500).json({ error: '获取客户合同列表失败' });
  }
});

/**
 * 服务端文件：server/src/routes/reports.ts
 * 接口：GET /api/v1/reports/customers/:customerId/devices
 * 描述：获取客户的设备列表
 * Query 参数：无
 */
router.get('/customers/:customerId/devices', async (req, res) => {
  try {
    const { customerId } = req.params;

    if (!customerId || isNaN(Number(customerId))) {
      return res.status(400).json({ error: '客户ID无效' });
    }

    // 从设备数据中筛选客户的设备
    const devices = memoryDevices.filter(
      device => device.customer_id === Number(customerId)
    ).map(device => ({
      device_model: device.device_model,
      factory_serial_number: device.factory_serial_number,
      device_name: device.device_name,
      device_type: device.device_type,
      factory_date: device.factory_date,
      status: device.status,
    }));

    res.json(devices);
  } catch (error) {
    console.error('Failed to fetch customer devices:', error);
    res.status(500).json({ error: '获取客户设备列表失败' });
  }
});

/**
 * 服务端文件：server/src/routes/reports.ts
 * 接口：GET /api/v1/reports/customers/:customerId/workorders
 * 描述：获取客户的工单列表
 * Query 参数：无
 */
router.get('/customers/:customerId/workorders', async (req, res) => {
  try {
    const { customerId } = req.params;

    if (!customerId || isNaN(Number(customerId))) {
      return res.status(400).json({ error: '客户ID无效' });
    }

    // 从工单数据中筛选客户的工单
    const workOrders = memoryWorkOrders.filter(
      workOrder => workOrder.customer_id === Number(customerId)
    ).map(workOrder => ({
      order_no: workOrder.order_no,
      title: workOrder.title,
      type: workOrder.type,
      status: workOrder.status === 'pending' ? '待处理'
            : workOrder.status === 'processing' ? '进行中'
            : '已完成',
      created_at: workOrder.created_at,
    }));

    res.json(workOrders);
  } catch (error) {
    console.error('Failed to fetch customer work orders:', error);
    res.status(500).json({ error: '获取客户工单列表失败' });
  }
});

// 导出客户统计Excel（复用原有功能）
router.get('/customers/export', async (req, res) => {
  try {
    const { memoryStorage } = await import('../database/memory-storage.ts');

    const contracts = memoryStorage?.contracts || [];
    const customerMap = new Map();

    contracts.forEach((contract: any) => {
      const customerId = contract.customer_id;
      if (!customerId) return;

      if (!customerMap.has(customerId)) {
        customerMap.set(customerId, {
          customer_id: customerId,
          customer_name: contract.customer_name || `客户${customerId}`,
          contract_count: 0,
          device_count: 0,
          after_sales_count: 0,
        });
      }
      customerMap.get(customerId).contract_count++;
    });

    const devices = memoryStorage?.devices || [];
    if (Array.isArray(devices)) {
      devices.forEach((device: any) => {
        const customerId = device.customer_id;
        if (!customerId) return;

        if (!customerMap.has(customerId)) {
          customerMap.set(customerId, {
            customer_id: customerId,
            customer_name: device.customer_name || `客户${customerId}`,
            contract_count: 0,
            device_count: 0,
            after_sales_count: 0,
          });
        }
        customerMap.get(customerId).device_count++;
      });
    }

    const customers = Array.from(customerMap.values());

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(customers);
    XLSX.utils.book_append_sheet(workbook, worksheet, '客户统计');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    const fileName = encodeURIComponent('客户统计.xlsx');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${fileName}`);
    res.send(buffer);
  } catch (error) {
    console.error('Export customers error:', error);
    res.status(500).json({ error: '导出客户统计失败' });
  }
});

/**
 * 服务端文件：server/src/routes/reports.ts
 * 接口：GET /api/v1/reports/devices
 * 描述：获取设备统计信息（汇总数据+设备列表）
 * Query 参数：search (可选) - 设备名称搜索关键词
 */
router.get('/devices', async (req, res) => {
  try {
    // 获取所有设备数据
    let devices = memoryDevices.map(device => ({
      device_id: device.id,
      device_name: device.device_name,
      device_number: device.device_number,
      device_model: device.device_model,
      device_type: device.device_type,
      customer_name: device.customer_name,
      status: device.status,
      installation_date: device.installation_date,
      warranty_date: device.warranty_date,
      project_name: device.project_name,
    }));

    // 如果有查询参数，进行过滤
    const { search } = req.query;
    if (search && typeof search === 'string') {
      devices = devices.filter(device =>
        device.device_name.includes(search) ||
        device.device_number.includes(search) ||
        device.device_model.includes(search)
      );
    }

    // 计算总数
    const summary = {
      total_devices: devices.length,
      by_status: {
        normal: devices.filter(d => d.status === '正常').length,
        warning: devices.filter(d => d.status === '警告').length,
        error: devices.filter(d => d.status === '故障').length,
        maintenance: devices.filter(d => d.status === '维护中').length,
      },
      by_type: {},
    };

    // 统计按类型的设备数量
    devices.forEach(device => {
      const type = device.device_type || '未知';
      if (!summary.by_type[type]) {
        summary.by_type[type] = 0;
      }
      summary.by_type[type]++;
    });

    res.json({
      summary,
      details: devices,
    });
  } catch (error) {
    console.error('Failed to fetch devices:', error);
    res.status(500).json({ error: '获取设备统计信息失败' });
  }
});

export default router;
