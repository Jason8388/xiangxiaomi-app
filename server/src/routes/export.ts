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
    
    // 定义列 - 包含所有工单信息项
    worksheet.columns = [
      { header: '工单编号', key: 'order_no', width: 18 },
      { header: '工单名称', key: 'name', width: 20 },
      { header: '任务号', key: 'task_number', width: 15 },
      { header: '工单描述', key: 'description', width: 30 },
      { header: '问题描述', key: 'problem_description', width: 30 },
      { header: '需求描述', key: 'demand_description', width: 30 },
      { header: '服务方案', key: 'service_plan', width: 30 },
      { header: '客户名称', key: 'customer_name', width: 20 },
      { header: '设备名称', key: 'device_name', width: 20 },
      { header: '设备编号', key: 'device_number', width: 15 },
      { header: '合同名称', key: 'contract_name', width: 20 },
      { header: '合同编号', key: 'contract_no', width: 18 },
      { header: '工单类型', key: 'type', width: 10 },
      { header: '工作单类型', key: 'work_order_type', width: 12 },
      { header: '优先级', key: 'priority', width: 10 },
      { header: '工单状态', key: 'status', width: 12 },
      { header: '工单阶段', key: 'stage', width: 12 },
      { header: '任务阶段', key: 'task_phase', width: 12 },
      { header: '任务进度', key: 'task_progress', width: 12 },
      { header: '任务状态', key: 'task_status', width: 12 },
      { header: '负责人', key: 'assignee_name', width: 12 },
      { header: '实施人', key: 'implementer', width: 12 },
      { header: '计划工时', key: 'plan_hours', width: 10 },
      { header: '实际工时', key: 'actual_hours', width: 10 },
      { header: '是否收费', key: 'is_charged', width: 10 },
      { header: '报价金额', key: 'quoted_price', width: 12 },
      { header: '服务金额', key: 'service_amount', width: 12 },
      { header: '待付款', key: 'pending_payment', width: 12 },
      { header: '已付款', key: 'paid_amount', width: 12 },
      { header: '计划完成日期', key: 'planned_completion_date', width: 15 },
      { header: '实际完成日期', key: 'implementation_complete_date', width: 15 },
      { header: '需求接收日期', key: 'demand_received_date', width: 15 },
      { header: '客户共识日期', key: 'customer_consensus_date', width: 15 },
      { header: '计划付款日期', key: 'planned_payment_date', width: 15 },
      { header: '实际付款日期', key: 'actual_payment_date', width: 15 },
      { header: '销售子项目号', key: 'sales_sub_project_no', width: 18 },
      { header: 'OA工单号', key: 'oa_work_order_no', width: 18 },
      { header: '物料编码', key: 'material_code', width: 15 },
      { header: '实施主体', key: 'implement_subject', width: 20 },
      { header: '工单签署人', key: 'work_order_signer', width: 15 },
      { header: '质保状态', key: 'warranty_status', width: 12 },
      { header: '需求评估周期', key: 'demand_assessment_period', width: 12 },
      { header: '服务实施周期', key: 'service_implementation_period', width: 12 },
      { header: '付款周期', key: 'payment_period', width: 12 },
      { header: '发票申请', key: 'invoice_application', width: 12 },
      { header: '发票完成', key: 'invoice_completed', width: 12 },
      { header: '发票已交付', key: 'invoice_delivered', width: 12 },
      { header: '创建时间', key: 'created_at', width: 20 },
      { header: '更新时间', key: 'updated_at', width: 20 },
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
        id: order.id || '',
        order_no: order.order_no || '',
        name: order.name || '',
        task_number: order.task_number || '',
        description: order.description || '',
        problem_description: order.problem_description || '',
        demand_description: order.demand_description || '',
        service_plan: order.service_plan || '',
        customer_name: customer?.name || order.customer_name || '',
        device_name: device?.device_name || order.device_name || '',
        device_number: order.device_number || '',
        contract_name: order.contract_name || '',
        contract_no: order.contract_no || '',
        type: order.type || '',
        work_order_type: order.work_order_type || '',
        priority: priorityMap[order.priority] || order.priority || '',
        status: statusMap[order.status] || order.status || '',
        stage: stageMap[order.stage] || order.stage || '',
        task_phase: order.task_phase || '',
        task_progress: order.task_progress || '',
        task_status: order.task_status || '',
        assignee_name: assignee?.name || order.assignee_name || '',
        implementer: order.implementer || '',
        plan_hours: order.plan_hours || 0,
        actual_hours: order.actual_hours || 0,
        is_charged: order.is_charged ? '是' : '否',
        quoted_price: order.quoted_price || 0,
        service_amount: order.service_amount || 0,
        pending_payment: order.pending_payment || 0,
        paid_amount: order.paid_amount || 0,
        planned_completion_date: order.planned_completion_date || '',
        implementation_complete_date: order.implementation_complete_date || '',
        demand_received_date: order.demand_received_date || '',
        customer_consensus_date: order.customer_consensus_date || '',
        planned_payment_date: order.planned_payment_date || '',
        actual_payment_date: order.actual_payment_date || '',
        sales_sub_project_no: order.sales_sub_project_no || '',
        oa_work_order_no: order.oa_work_order_no || '',
        material_code: order.material_code || '',
        implement_subject: order.implement_subject || '',
        work_order_signer: order.work_order_signer || '',
        warranty_status: order.warranty_status || '',
        demand_assessment_period: order.demand_assessment_period || '',
        service_implementation_period: order.service_implementation_period || '',
        payment_period: order.payment_period || '',
        invoice_application: order.invoice_application || '',
        invoice_completed: order.invoice_completed || '',
        invoice_delivered: order.invoice_delivered || '',
        created_at: order.created_at ? new Date(order.created_at).toLocaleString('zh-CN') : '',
        updated_at: order.updated_at ? new Date(order.updated_at).toLocaleString('zh-CN') : '',
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
    // CSV 表头 - 包含所有工单信息项
    const headers = [
      '工单编号', '工单名称', '任务号', '工单描述', '问题描述', '需求描述', '服务方案',
      '客户名称', '设备名称', '设备编号', '合同名称', '合同编号',
      '工单类型', '工作单类型', '优先级', '工单状态', '工单阶段', '任务阶段', '任务进度', '任务状态',
      '负责人', '实施人', '计划工时', '实际工时', '是否收费', '报价金额', '服务金额', '待付款', '已付款',
      '计划完成日期', '实际完成日期', '需求接收日期', '客户共识日期', '计划付款日期', '实际付款日期',
      '销售子项目号', 'OA工单号', '物料编码', '实施主体', '工单签署人', '质保状态',
      '需求评估周期', '服务实施周期', '付款周期', '发票申请', '发票完成', '发票已交付',
      '创建时间', '更新时间'
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
        `"${(order.name || '').replace(/"/g, '""')}"`,
        order.task_number || '',
        `"${(order.description || '').replace(/"/g, '""')}"`,
        `"${(order.problem_description || '').replace(/"/g, '""')}"`,
        `"${(order.demand_description || '').replace(/"/g, '""')}"`,
        `"${(order.service_plan || '').replace(/"/g, '""')}"`,
        `"${(customer?.name || order.customer_name || '').replace(/"/g, '""')}"`,
        `"${(device?.device_name || order.device_name || '').replace(/"/g, '""')}"`,
        order.device_number || '',
        `"${(order.contract_name || '').replace(/"/g, '""')}"`,
        order.contract_no || '',
        order.type || '',
        order.work_order_type || '',
        priorityMap[order.priority] || order.priority || '',
        statusMap[order.status] || order.status || '',
        stageMap[order.stage] || order.stage || '',
        order.task_phase || '',
        order.task_progress || '',
        order.task_status || '',
        `"${(assignee?.name || order.assignee_name || '').replace(/"/g, '""')}"`,
        `"${(order.implementer || '').replace(/"/g, '""')}"`,
        order.plan_hours || 0,
        order.actual_hours || 0,
        order.is_charged ? '是' : '否',
        order.quoted_price || 0,
        order.service_amount || 0,
        order.pending_payment || 0,
        order.paid_amount || 0,
        order.planned_completion_date || '',
        order.implementation_complete_date || '',
        order.demand_received_date || '',
        order.customer_consensus_date || '',
        order.planned_payment_date || '',
        order.actual_payment_date || '',
        order.sales_sub_project_no || '',
        order.oa_work_order_no || '',
        order.material_code || '',
        `"${(order.implement_subject || '').replace(/"/g, '""')}"`,
        `"${(order.work_order_signer || '').replace(/"/g, '""')}"`,
        order.warranty_status || '',
        order.demand_assessment_period || '',
        order.service_implementation_period || '',
        order.payment_period || '',
        order.invoice_application || '',
        order.invoice_completed || '',
        order.invoice_delivered || '',
        order.created_at ? new Date(order.created_at).toLocaleString('zh-CN') : '',
        order.updated_at ? new Date(order.updated_at).toLocaleString('zh-CN') : ''
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
