import express from 'express';

const router = express.Router();

// 内存设备数据（用于统计）
const memoryDevices = [
  { id: 1, device_name: '服务器', model: '服务器类', status: 'normal', warranty_expire: '2025-01-01' },
  { id: 2, device_name: '交换机', model: '网络设备', status: 'normal', warranty_expire: '2026-06-01' },
  { id: 3, device_name: '路由器', model: '网络设备', status: 'normal', warranty_expire: '2023-12-01' },
  { id: 4, device_name: '存储设备', model: '存储设备', status: 'fault', warranty_expire: '2024-06-01' },
  { id: 5, device_name: 'UPS电源', model: '电源设备', status: 'normal', warranty_expire: '2025-12-01' },
  { id: 6, device_name: '打印机', model: '办公设备', status: 'maintenance', warranty_expire: '2022-06-01' },
  { id: 7, device_name: '台式机', model: '办公设备', status: 'normal', warranty_expire: '2026-01-01' },
  { id: 8, device_name: '笔记本', model: '办公设备', status: 'normal', warranty_expire: '2024-03-01' },
  { id: 9, device_name: '防火墙', model: '安全设备', status: 'normal', warranty_expire: '2027-01-01' },
  { id: 10, device_name: '负载均衡器', model: '网络设备', status: 'normal', warranty_expire: '2025-09-01' },
  { id: 11, device_name: '磁带库', model: '存储设备', status: 'normal', warranty_expire: '2024-08-01' },
  { id: 12, device_name: '空调', model: '机房配套', status: 'normal', warranty_expire: '2026-12-01' },
];

// 判断设备是否在质保期内
function isWithinWarranty(warrantyExpire: string): boolean {
  if (!warrantyExpire) return false;
  const expireDate = new Date(warrantyExpire);
  return expireDate >= new Date();
}

// 获取客户统计
router.get('/customers', async (req, res) => {
  try {
    res.status(200).json({
      code: 0,
      data: {
        total: 0,
        new_this_month: 0,
        active: 0
      },
      message: 'success'
    });
  } catch (error) {
    console.error('Report customers error:', error);
    res.status(500).json({ code: 1, message: 'Internal server error' });
  }
});

// 获取设备统计（按设备类型分组）
router.get('/devices', async (req, res) => {
  try {
    // 按设备类型分组统计
    const typeStats: Record<string, { total: number; within_warranty: number; out_of_warranty: number }> = {};
    
    memoryDevices.forEach(device => {
      const deviceType = device.model || '未知类型';
      if (!typeStats[deviceType]) {
        typeStats[deviceType] = { total: 0, within_warranty: 0, out_of_warranty: 0 };
      }
      typeStats[deviceType].total++;
      if (isWithinWarranty(device.warranty_expire)) {
        typeStats[deviceType].within_warranty++;
      } else {
        typeStats[deviceType].out_of_warranty++;
      }
    });

    // 转换为数组格式
    const typeStatsArray = Object.entries(typeStats).map(([type, stats]) => ({
      device_type: type,
      ...stats
    }));

    // 总体统计
    const totalDevices = memoryDevices.length;
    const totalWithinWarranty = memoryDevices.filter(d => isWithinWarranty(d.warranty_expire)).length;

    res.status(200).json({
      code: 0,
      summary: {
        total_devices: totalDevices,
        within_warranty: totalWithinWarranty,
        out_of_warranty: totalDevices - totalWithinWarranty,
        updated_at: new Date().toISOString()
      },
      type_stats: typeStatsArray,
      message: 'success'
    });
  } catch (error) {
    console.error('Report devices error:', error);
    res.status(500).json({ code: 1, message: 'Internal server error' });
  }
});

// 获取工单统计
router.get('/after-sales', async (req, res) => {
  try {
    // 模拟工单统计数据
    const mockOrders = [
      { id: 1, is_charged: true, status: '已完成', amount: 15000, paid: 15000 },
      { id: 2, is_charged: true, status: '已完成', amount: 8000, paid: 5000 },
      { id: 3, is_charged: false, status: '已完成', amount: 0, paid: 0 },
      { id: 4, is_charged: true, status: '处理中', amount: 12000, paid: 8000 },
      { id: 5, is_charged: true, status: '已完成', amount: 20000, paid: 20000 },
      { id: 6, is_charged: false, status: '处理中', amount: 0, paid: 0 },
      { id: 7, is_charged: true, status: '已完成', amount: 5500, paid: 5500 },
      { id: 8, is_charged: true, status: '待处理', amount: 10000, paid: 0 },
      { id: 9, is_charged: false, status: '已完成', amount: 0, paid: 0 },
      { id: 10, is_charged: true, status: '已完成', amount: 18000, paid: 18000 },
      { id: 11, is_charged: true, status: '处理中', amount: 9500, paid: 5000 },
      { id: 12, is_charged: false, status: '已完成', amount: 0, paid: 0 },
    ];

    const totalOrders = mockOrders.length;
    const chargedOrders = mockOrders.filter(o => o.is_charged).length;
    const freeOrders = mockOrders.filter(o => !o.is_charged).length;
    const completedOrders = mockOrders.filter(o => o.status === '已完成').length;
    const totalAmount = mockOrders.reduce((sum, o) => sum + o.amount, 0);
    const paidAmount = mockOrders.reduce((sum, o) => sum + o.paid, 0);
    const pendingAmount = totalAmount - paidAmount;

    res.status(200).json({
      code: 0,
      summary: {
        total_orders: totalOrders,
        charged_orders: chargedOrders,
        free_orders: freeOrders,
        completed_orders: completedOrders,
        total_amount: totalAmount,
        paid_amount: paidAmount,
        pending_amount: pendingAmount,
        updated_at: new Date().toISOString()
      },
      message: 'success'
    });
  } catch (error) {
    console.error('Report after-sales error:', error);
    res.status(500).json({ code: 1, message: 'Internal server error' });
  }
});

// 导出客户报表
router.get('/customers/export', async (req, res) => {
  try {
    res.status(200).json({
      code: 0,
      data: { url: '' },
      message: 'success'
    });
  } catch (error) {
    console.error('Report export error:', error);
    res.status(500).json({ code: 1, message: 'Internal server error' });
  }
});

export default router;
