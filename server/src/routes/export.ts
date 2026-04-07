import { Router } from 'express';
import ExcelJS from 'exceljs';

const router = Router();

// 从 workOrders 获取内存数据（避免循环导入）
let memoryWorkOrders: any[] = [];
let memoryCustomers: any[] = [];
let memoryDevices: any[] = [];
let memoryUsers: any[] = [];

export function setExportData(workOrders: any[], customers: any[], devices: any[], users: any[]) {
  memoryWorkOrders = workOrders;
  memoryCustomers = customers;
  memoryDevices = devices;
  memoryUsers = users;
}

// 导出工单为 Excel
router.get('/export/excel', async (req, res) => {
  try {
    // 创建工作簿
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'After-Sales System';
    workbook.created = new Date();
    
    // 创建工作表
    const worksheet = workbook.addWorksheet('工单列表', {
      properties: { tabColor: { argb: 'FF6C63FF' } }
    });
    
    // 定义列
    worksheet.columns = [
      { header: '工单编号', key: 'order_no', width: 18 },
      { header: '工单描述', key: 'description', width: 30 },
      { header: '客户名称', key: 'customer_name', width: 20 },
      { header: '设备名称', key: 'device_name', width: 20 },
      { header: '工单类型', key: 'type', width: 10 },
      { header: '优先级', key: 'priority', width: 10 },
      { header: '工单状态', key: 'status', width: 12 },
      { header: '工单阶段', key: 'stage', width: 12 },
      { header: '计划工时', key: 'plan_hours', width: 10 },
      { header: '是否收费', key: 'is_charged', width: 10 },
      { header: '报价金额', key: 'quoted_price', width: 12 },
      { header: '负责人', key: 'assignee_name', width: 12 },
      { header: '创建时间', key: 'created_at', width: 20 },
    ];
    
    // 设置表头样式
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF6C63FF' }
    };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
    
    // 阶段映射
    const stageMap: Record<string, string> = {
      pending: '待派工',
      assigned: '已派工',
      processing: '处理中',
      completed: '已完成',
      cancelled: '已取消'
    };
    
    // 优先级映射
    const priorityMap: Record<string, string> = {
      low: '低',
      normal: '普通',
      high: '高',
      urgent: '紧急'
    };
    
    // 状态映射
    const statusMap: Record<string, string> = {
      pending: '待处理',
      processing: '处理中',
      completed: '已完成',
      cancelled: '已取消'
    };
    
    // 添加数据
    memoryWorkOrders.forEach((order: any) => {
      const customer = memoryCustomers.find((c: any) => c.id === order.customer_id);
      const device = memoryDevices.find((d: any) => d.id === order.device_id);
      const assignee = memoryUsers.find((u: any) => u.id === order.assignee_id);
      
      worksheet.addRow({
        order_no: order.order_no || '',
        description: order.description || '',
        customer_name: customer?.name || order.customer_name || '',
        device_name: device?.device_name || order.device_name || '',
        type: order.type || '',
        priority: priorityMap[order.priority] || order.priority || '',
        status: statusMap[order.status] || order.status || '',
        stage: stageMap[order.stage] || order.stage || '',
        plan_hours: order.plan_hours || 0,
        is_charged: order.is_charged ? '是' : '否',
        quoted_price: order.quoted_price || 0,
        assignee_name: assignee?.name || order.assignee_name || '',
        created_at: order.created_at ? new Date(order.created_at).toLocaleString('zh-CN') : '',
      });
    });
    
    // 设置数据行样式
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.alignment = { vertical: 'middle' };
        // 奇偶行交替颜色
        if (rowNumber % 2 === 0) {
          row.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF8F9FF' }
          };
        }
      }
    });
    
    // 设置边框
    worksheet.getRow(1).border = {
      top: { style: 'thin', color: { argb: 'FF6C63FF' } },
      left: { style: 'thin', color: { argb: 'FF6C63FF' } },
      bottom: { style: 'thin', color: { argb: 'FF6C63FF' } },
      right: { style: 'thin', color: { argb: 'FF6C63FF' } }
    };
    
    // 生成文件
    const buffer = await workbook.xlsx.writeBuffer();
    const bufferData = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer as any);
    
    // 设置响应头
    const filename = `工单列表_${new Date().toISOString().slice(0, 10)}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
    res.setHeader('Content-Length', String(bufferData.length));
    
    res.send(bufferData);
  } catch (error: any) {
    console.error('Export Excel error:', error);
    res.status(500).json({ error: '导出失败', message: error.message });
  }
});

// 导出工单为 CSV
router.get('/export/csv', async (req, res) => {
  try {
    // CSV 表头
    const headers = [
      '工单编号', '工单描述', '客户名称', '设备名称', '工单类型',
      '优先级', '工单状态', '工单阶段', '计划工时', '是否收费',
      '报价金额', '负责人', '创建时间'
    ];
    
    // 阶段映射
    const stageMap: Record<string, string> = {
      pending: '待派工', assigned: '已派工', processing: '处理中',
      completed: '已完成', cancelled: '已取消'
    };
    const priorityMap: Record<string, string> = {
      low: '低', normal: '普通', high: '高', urgent: '紧急'
    };
    const statusMap: Record<string, string> = {
      pending: '待处理', processing: '处理中', completed: '已完成', cancelled: '已取消'
    };
    
    // 生成 CSV 内容
    let csv = '\uFEFF'; // BOM for UTF-8
    csv += headers.join(',') + '\n';
    
    memoryWorkOrders.forEach((order: any) => {
      const customer = memoryCustomers.find((c: any) => c.id === order.customer_id);
      const device = memoryDevices.find((d: any) => d.id === order.device_id);
      const assignee = memoryUsers.find((u: any) => u.id === order.assignee_id);
      
      const row = [
        order.order_no || '',
        `"${(order.description || '').replace(/"/g, '""')}"`,
        `"${(customer?.name || order.customer_name || '').replace(/"/g, '""')}"`,
        `"${(device?.device_name || order.device_name || '').replace(/"/g, '""')}"`,
        order.type || '',
        priorityMap[order.priority] || order.priority || '',
        statusMap[order.status] || order.status || '',
        stageMap[order.stage] || order.stage || '',
        order.plan_hours || 0,
        order.is_charged ? '是' : '否',
        order.quoted_price || 0,
        `"${(assignee?.name || order.assignee_name || '').replace(/"/g, '""')}"`,
        order.created_at ? new Date(order.created_at).toLocaleString('zh-CN') : ''
      ];
      csv += row.join(',') + '\n';
    });
    
    // 设置响应头
    const filename = `工单列表_${new Date().toISOString().slice(0, 10)}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
    
    res.send(csv);
  } catch (error: any) {
    console.error('Export CSV error:', error);
    res.status(500).json({ error: '导出失败', message: error.message });
  }
});

export default router;
