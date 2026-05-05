import express from 'express';
import multer from 'multer';
import * as XLSX from 'xlsx';
import pool, { USE_DATABASE } from '../database/db';
import { setExportData } from './export';

const router = express.Router();

// 配置文件上传
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

// 内存数据存储
const memoryWorkOrders: any[] = [
  {
    id: 1,
    order_no: 'WO202501220001',
    title: '电梯控制板故障，需要更换主板',
    description: '电梯控制板故障，需要更换主板',
    customer_id: 1,
    device_id: 1,
    type: '维修',
    priority: 'high',
    status: 'pending',
    stage: 'assigned',
    plan_hours: 4.0,
    is_charged: true,
    quoted_price: 5800.00,
    assignee_id: 2,
    created_by: 1,
    customer_name: '上海张江科技园',
    device_name: 'A栋电梯1号',
    assignee_name: '李明',
    created_at: '2025-01-22 09:30:00',
    // 完整字段
    task_no: 'TASK001',
    task_leader: '李明',
    implementation_entity: '内部团队',
    task_phase: '需求阶段',
    task_progress: '10%收到服务需求',
    task_status: '计划中',
    contacts: [{ name: '张三', role: '项目经理', phone: '13800138000' }],
    demand_date: '2025-01-20',
    requirement_description: '电梯控制板出现故障，需要更换主板并进行系统调试',
    requirement_photos: [],
    service_plan: '更换控制板、调试系统、测试运行',
    planned_completion_date: '2025-01-25',
    material_requirements: '控制板1块、调试工具1套',
    warranty_status: '质保期1年',
    service_docs: [],
    consensus_docs: [],
    consensus_date: '2025-01-21',
    sales_sub_project_no: 'SP202501',
    material_code: 'MC001',
    oa_work_order_no: 'OA001',
    contract_id: 1,
    contract_no: 'CT001',
    contract_name: '电梯维保合同',
    progress_notes: '已确认需求，准备备件',
    implementer: '李明',
    implementation_complete_date: null,
    actual_hours: 0,
    work_order_docs: [],
    site_completion_docs: [],
    work_order_signer: '张三',
    invoice_application: false,
    invoice_completed: false,
    invoice_delivered: false,
    planned_payment_date: '2025-02-01',
    actual_payment_date: null,
    payment_progress: '未开始'
  },
  {
    id: 2,
    order_no: 'WO202501220002',
    title: '电梯门系统异常，需调整门机参数',
    description: '电梯门系统异常，需调整门机参数',
    customer_id: 2,
    device_id: 2,
    type: '维修',
    priority: 'high',
    status: 'processing',
    stage: 'processing',
    plan_hours: 3.0,
    is_charged: true,
    quoted_price: 3200.00,
    assignee_id: 3,
    created_by: 1,
    customer_name: '北京中关村软件园',
    device_name: 'B栋电梯2号',
    assignee_name: '王伟',
    created_at: '2025-01-22 10:15:00',
    // 完整字段
    task_no: 'TASK002',
    task_leader: '王伟',
    implementation_entity: '外部服务商',
    task_phase: '实施阶段',
    task_progress: '50%正在实施',
    task_status: '进行中',
    contacts: [{ name: '李四', role: '客户代表', phone: '13800138001' }],
    demand_date: '2025-01-21',
    requirement_description: '电梯门机参数需要重新调整',
    requirement_photos: [],
    service_plan: '调整门机参数、测试门系统',
    planned_completion_date: '2025-01-24',
    material_requirements: '无需额外材料',
    warranty_status: '质保期6个月',
    service_docs: [],
    consensus_docs: [],
    consensus_date: '2025-01-22',
    sales_sub_project_no: 'SP202502',
    material_code: '',
    oa_work_order_no: 'OA002',
    contract_id: 2,
    contract_no: 'CT002',
    contract_name: '电梯维修合同',
    progress_notes: '正在进行参数调整',
    implementer: '王伟',
    implementation_complete_date: null,
    actual_hours: 1.5,
    work_order_docs: [],
    site_completion_docs: [],
    work_order_signer: '李四',
    invoice_application: false,
    invoice_completed: false,
    invoice_delivered: false,
    planned_payment_date: '2025-02-05',
    actual_payment_date: null,
    payment_progress: '未开始'
  },
  {
    id: 3,
    order_no: 'WO202501220003',
    title: '年度例行保养检查',
    description: '年度例行保养检查',
    customer_id: 1,
    device_id: 1,
    type: '保养',
    priority: 'normal',
    status: 'completed',
    stage: 'completed',
    plan_hours: 2.0,
    is_charged: false,
    quoted_price: 0.00,
    assignee_id: 2,
    created_by: 1,
    customer_name: '上海张江科技园',
    device_name: 'A栋电梯1号',
    assignee_name: '李明',
    created_at: '2025-01-22 11:00:00',
    // 完整字段
    task_no: 'TASK003',
    task_leader: '李明',
    implementation_entity: '内部团队',
    task_phase: '完成阶段',
    task_progress: '100%已完成',
    task_status: '已完成',
    contacts: [{ name: '张三', role: '项目经理', phone: '13800138000' }],
    demand_date: '2025-01-15',
    requirement_description: '年度例行保养检查',
    requirement_photos: [],
    service_plan: '检查电梯各项指标、润滑维护',
    planned_completion_date: '2025-01-18',
    material_requirements: '润滑油若干、清洁用品',
    warranty_status: '无',
    service_docs: [],
    consensus_docs: [],
    consensus_date: '2025-01-16',
    sales_sub_project_no: 'SP202503',
    material_code: '',
    oa_work_order_no: 'OA003',
    contract_id: null,
    contract_no: '',
    contract_name: '',
    progress_notes: '保养完成',
    implementer: '李明',
    implementation_complete_date: '2025-01-18',
    actual_hours: 2.0,
    work_order_docs: [],
    site_completion_docs: [],
    work_order_signer: '张三',
    invoice_application: false,
    invoice_completed: false,
    invoice_delivered: false,
    planned_payment_date: null,
    actual_payment_date: null,
    payment_progress: '免费服务'
  },
  {
    id: 4,
    order_no: 'WO202501220004',
    title: '电梯空调系统安装',
    description: '电梯空调系统安装',
    customer_id: 3,
    device_id: 3,
    type: '安装',
    priority: 'high',
    status: 'pending',
    stage: 'pending',
    plan_hours: 8.0,
    is_charged: true,
    quoted_price: 15000.00,
    assignee_id: null,
    created_by: 1,
    customer_name: '深圳南山区科技园',
    device_name: 'C栋电梯3号',
    assignee_name: null,
    created_at: '2025-01-22 13:30:00',
    // 完整字段
    task_no: 'TASK004',
    task_leader: '',
    implementation_entity: '',
    task_phase: '需求阶段',
    task_progress: '10%收到服务需求',
    task_status: '计划中',
    contacts: [{ name: '王五', role: '客户代表', phone: '13800138002' }],
    demand_date: '2025-01-22',
    requirement_description: '需要为电梯安装空调系统',
    requirement_photos: [],
    service_plan: '采购空调设备、安装调试',
    planned_completion_date: '2025-01-30',
    material_requirements: '电梯空调1套、安装工具1套',
    warranty_status: '质保期2年',
    service_docs: [],
    consensus_docs: [],
    consensus_date: null,
    sales_sub_project_no: 'SP202504',
    material_code: 'MC002',
    oa_work_order_no: 'OA004',
    contract_id: null,
    contract_no: '',
    contract_name: '',
    progress_notes: '需求已确认',
    implementer: null,
    implementation_complete_date: null,
    actual_hours: 0,
    work_order_docs: [],
    site_completion_docs: [],
    work_order_signer: '',
    invoice_application: false,
    invoice_completed: false,
    invoice_delivered: false,
    planned_payment_date: '2025-02-10',
    actual_payment_date: null,
    payment_progress: '未开始'
  },
  {
    id: 5,
    order_no: 'WO202501220005',
    title: '电梯控制系统升级改造',
    description: '电梯控制系统升级改造',
    customer_id: 2,
    device_id: 2,
    type: '其他',
    priority: 'high',
    status: 'processing',
    stage: 'processing',
    plan_hours: 12.0,
    is_charged: true,
    quoted_price: 28000.00,
    assignee_id: 3,
    created_by: 1,
    customer_name: '北京中关村软件园',
    device_name: 'B栋电梯2号',
    assignee_name: '王伟',
    created_at: '2025-01-22 14:45:00',
    // 完整字段
    task_no: 'TASK005',
    task_leader: '王伟',
    implementation_entity: '内部团队',
    task_phase: '实施阶段',
    task_progress: '30%设备准备中',
    task_status: '进行中',
    contacts: [{ name: '李四', role: '客户代表', phone: '13800138001' }],
    demand_date: '2025-01-20',
    requirement_description: '需要升级电梯控制系统',
    requirement_photos: [],
    service_plan: '采购新系统、安装调试、培训',
    planned_completion_date: '2025-02-05',
    material_requirements: '新控制系统1套、安装配件若干',
    warranty_status: '质保期3年',
    service_docs: [],
    consensus_docs: [],
    consensus_date: '2025-01-21',
    sales_sub_project_no: 'SP202505',
    material_code: 'MC003',
    oa_work_order_no: 'OA005',
    contract_id: 3,
    contract_no: 'CT003',
    contract_name: '系统升级合同',
    progress_notes: '设备采购中',
    implementer: '王伟',
    implementation_complete_date: null,
    actual_hours: 3.0,
    work_order_docs: [],
    site_completion_docs: [],
    work_order_signer: '李四',
    invoice_application: true,
    invoice_completed: false,
    invoice_delivered: false,
    planned_payment_date: '2025-02-15',
    actual_payment_date: null,
    payment_progress: '待开票'
  }
];
const memoryCustomers: any[] = [
  { id: 1, name: '上海张江科技园', contact_person: '张三', contact_phone: '13800138000' },
  { id: 2, name: '北京中关村软件园', contact_person: '李四', contact_phone: '13800138001' },
  { id: 3, name: '深圳南山区科技园', contact_person: '王五', contact_phone: '13800138002' }
];
const memoryDevices: any[] = [
  { id: 1, device_name: 'A栋电梯1号', customer_id: 1 },
  { id: 2, device_name: 'B栋电梯2号', customer_id: 2 },
  { id: 3, device_name: 'C栋电梯3号', customer_id: 3 }
];
const memoryUsers: any[] = [
  { id: 1, username: '管理员' },
  { id: 2, username: '李明' },
  { id: 3, username: '王伟' }
];

// 导出时同步数据
function syncExportData() {
  setExportData(memoryWorkOrders, memoryCustomers, memoryDevices, memoryUsers);
}
let memoryWorkOrderId = 6;
let orderNoCounter = 6;

// 生成工单编号
function generateOrderNo() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const seq = String(orderNoCounter++).padStart(4, '0');
  return `WO${year}${month}${day}${seq}`;
}

// 获取工单统计
router.get('/stats', async (req, res) => {
  if (!USE_DATABASE) {
    const totalWorkOrders = memoryWorkOrders.length;
    const chargedWorkOrders = memoryWorkOrders.filter(w => w.is_charged).length;
    const performanceAmount = memoryWorkOrders
      .filter(w => w.is_charged)
      .reduce((sum, w) => sum + (w.quoted_price || 0), 0);
    const pendingPaymentAmount = memoryWorkOrders
      .filter(w => w.is_charged && w.implementation_complete_date && !w.actual_payment_date)
      .reduce((sum, w) => sum + (w.quoted_price || 0), 0);
    const paidAmount = memoryWorkOrders
      .filter(w => w.actual_payment_date)
      .reduce((sum, w) => sum + (w.paid_amount || 0), 0);
    
    return res.json({
      totalWorkOrders,
      chargedWorkOrders,
      performanceAmount,
      pendingPaymentAmount,
      paidAmount,
    });
  }

  try {
    // 总工单数
    const totalResult = await pool.query('SELECT COUNT(*) as total FROM work_orders');
    const totalWorkOrders = parseInt(totalResult.rows[0].total);

    // 总收费工单数
    const chargedResult = await pool.query('SELECT COUNT(*) as total FROM work_orders WHERE is_charged = true');
    const chargedWorkOrders = parseInt(chargedResult.rows[0].total);

    // 售后业绩金额（收费工单对应金额总额）
    const performanceResult = await pool.query('SELECT COALESCE(SUM(quoted_amount), 0) as total FROM work_orders WHERE is_charged = true AND quoted_amount > 0');
    const performanceAmount = parseFloat(performanceResult.rows[0].total);

    // 售后待收款金额（已完成实施但未回款的收费工单）
    const pendingPaymentResult = await pool.query(`
      SELECT COALESCE(SUM(quoted_amount), 0) as total 
      FROM work_orders 
      WHERE is_charged = true 
        AND quoted_amount > 0
        AND implementation_complete_date IS NOT NULL 
        AND actual_payment_date IS NULL
    `);
    const pendingPaymentAmount = parseFloat(pendingPaymentResult.rows[0].total);

    // 售后已收款金额
    const paidResult = await pool.query('SELECT COALESCE(SUM(paid_amount), 0) as total FROM work_orders WHERE paid_amount > 0');
    const paidAmount = parseFloat(paidResult.rows[0].total);

    res.json({
      totalWorkOrders,
      chargedWorkOrders,
      performanceAmount,
      pendingPaymentAmount,
      paidAmount,
    });
  } catch (error) {
    console.error('Get work order stats error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 工单高级搜索（支持多种条件）
router.get('/search', async (req, res) => {
  if (!USE_DATABASE) {
    const keyword = (req.query.keyword as string || '').toLowerCase();
    const filtered = memoryWorkOrders.filter(w =>
      !keyword ||
      (w.order_no && w.order_no.toLowerCase().includes(keyword)) ||
      (w.title && w.title.toLowerCase().includes(keyword)) ||
      (w.task_no && w.task_no.toLowerCase().includes(keyword)) ||
      (w.customer_name && w.customer_name.toLowerCase().includes(keyword)) ||
      (w.sales_sub_project_no && w.sales_sub_project_no.toLowerCase().includes(keyword)) ||
      (w.contract_no && w.contract_no.toLowerCase().includes(keyword)) ||
      (w.contract_name && w.contract_name.toLowerCase().includes(keyword))
    );
    return res.json({ orders: filtered.slice(0, 50) });
  }

  try {
    const { keyword } = req.query;

    let query = `
      SELECT wo.*, cu.name as customer_name
       FROM work_orders wo
       LEFT JOIN customers cu ON wo.customer_id = cu.id
       WHERE 1=1
    `;
    const params: any[] = [];

    if (keyword) {
      query += ` AND (
        wo.title ILIKE $1 OR
        wo.order_no ILIKE $1 OR
        wo.task_no ILIKE $1 OR
        cu.name ILIKE $1 OR
        wo.sales_sub_project_no ILIKE $1 OR
        wo.contract_no ILIKE $1 OR
        wo.contract_name ILIKE $1
      )`;
      params.push(`%${keyword}%`);
    }

    query += ' ORDER BY wo.created_at DESC LIMIT 50';
    const result = await pool.query(query, params);
    res.json({ orders: result.rows });
  } catch (error) {
    console.error('Search work orders error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取工单列表（已有接口）
router.get('/', async (req, res) => {
  if (!USE_DATABASE) {
    const { keyword } = req.query;
    let filtered = [...memoryWorkOrders];
    
    if (keyword) {
      const kw = (keyword as string).toLowerCase();
      filtered = filtered.filter(w => 
        w.title?.toLowerCase().includes(kw) ||
        w.order_no?.toLowerCase().includes(kw) ||
        w.customer_name?.toLowerCase().includes(kw)
      );
    }
    
    return res.json(filtered.slice(0, 50));
  }

  try {
    const { keyword } = req.query;
    let query = `
      SELECT wo.*, cu.name as customer_name
       FROM work_orders wo
       LEFT JOIN customers cu ON wo.customer_id = cu.id
       WHERE 1=1
    `;
    const params: any[] = [];

    if (keyword) {
      query += ` AND (
        wo.title ILIKE $1 OR
        wo.order_no ILIKE $1 OR
        wo.task_no ILIKE $1 OR
        cu.name ILIKE $1 OR
        wo.sales_sub_project_no ILIKE $1 OR
        wo.contract_no ILIKE $1 OR
        wo.contract_name ILIKE $1
      )`;
      params.push(`%${keyword}%`);
    }

    query += ' ORDER BY wo.created_at DESC LIMIT 50';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get work orders error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取工单详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!USE_DATABASE) {
      const order = memoryWorkOrders.find(w => w.id === parseInt(id));
      if (!order) {
        return res.status(404).json({ error: '工单不存在' });
      }
      return res.json(order);
    }

    const result = await pool.query(
      `SELECT wo.*, cu.name as customer_name, cu.contact_person, cu.contact_phone
       FROM work_orders wo
       LEFT JOIN customers cu ON wo.customer_id = cu.id
       WHERE wo.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '工单不存在' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get work order error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 创建工单
router.post('/', async (req, res) => {
  try {
    const {
      // 基本情况
      title, // 工单名称
      order_no, // 工单编号（可选，不传则自动生成）
      task_no, // 任务号
      customer_id,
      customer_name,
      task_leader, // 任务负责人
      implementation_entity, // 实施主体
      // 工单状态
      task_phase, // 任务阶段
      task_progress, // 任务进度
      task_status, // 任务状态
      // 客户信息
      contacts, // 联系人列表 [{name, role, phone}]
      demand_date, // 接到服务需求日期
      // 服务方案
      service_plan, // 服务方案说明
      plan_hours, // 计划工时
      planned_completion_date, // 计划完成日期
      material_requirements, // 物料需求
      warranty_status, // 质保期状态
      is_charged, // 是否收费
      quoted_price, // 报价金额
      service_docs, // 服务方案文档路径
      consensus_docs, // 客户共识凭证路径
      consensus_date, // 服务方案客户共识日期
      sales_sub_project_no, // 销售子项目号
      material_code, // 物料编码
      oa_work_order_no, // OA系统工单编号
      contract_id, // 合同ID
      contract_no, // 合同编号
      contract_name, // 合同名称
      progress_notes, // 项目最新进度记录
      // 实施情况
      implementer, // 实施人
      implementation_complete_date, // 实施完成日期
      actual_hours, // 实际工时投入
      work_order_docs, // 派工单照片路径
      site_completion_docs, // 现场完成照片路径
      work_order_signer, // 派工单签字人
      // 回款情况
      invoice_application, // 是否申请开票
      invoice_completed, // 开票是否完成
      invoice_delivered, // 发票是否送达客户
      planned_payment_date, // 计划回款日期
      actual_payment_date, // 实际回款日期
    } = req.body;

    // 生成工单编号
    const woNo = order_no || generateOrderNo();

    if (!USE_DATABASE) {
      const newOrder = {
        id: memoryWorkOrderId++,
        order_no: woNo,
        title: title || '',
        task_no: task_no || woNo,
        customer_id,
        customer_name: customer_name || '',
        task_leader: task_leader || '',
        implementation_entity: implementation_entity || '',
        task_phase: task_phase || '需求阶段',
        task_progress: task_progress || '10%收到服务需求',
        task_status: task_status || '计划中',
        contacts: contacts || [],
        demand_date: demand_date || null,
        service_plan: service_plan || '',
        plan_hours: plan_hours || 0,
        planned_completion_date: planned_completion_date || null,
        material_requirements: material_requirements || '',
        warranty_status: warranty_status || '',
        is_charged: is_charged || false,
        quoted_price: quoted_price || 0,
        service_docs: service_docs || '',
        consensus_docs: consensus_docs || '',
        consensus_date: consensus_date || null,
        sales_sub_project_no: sales_sub_project_no || '',
        material_code: material_code || '',
        oa_work_order_no: oa_work_order_no || '',
        contract_id: contract_id || null,
        contract_no: contract_no || '',
        contract_name: contract_name || '',
        progress_notes: JSON.stringify(progress_notes || []),
        implementer: implementer || '',
        implementation_complete_date: implementation_complete_date || null,
        actual_hours: actual_hours || 0,
        work_order_docs: work_order_docs || '',
        site_completion_docs: site_completion_docs || '',
        work_order_signer: work_order_signer || '',
        invoice_application: invoice_application || '',
        invoice_completed: invoice_completed || '',
        invoice_delivered: invoice_delivered || '',
        planned_payment_date: planned_payment_date || null,
        actual_payment_date: actual_payment_date || null,
        payment_progress: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      memoryWorkOrders.push(newOrder);
      syncExportData();
      return res.json(newOrder);
    }

    const result = await pool.query(
      `INSERT INTO work_orders (
        order_no, title, task_no, customer_id, customer_name, task_leader, implementation_entity,
        task_phase, task_progress, task_status, contacts, demand_date,
        service_plan, plan_hours, planned_completion_date, material_requirements, warranty_status, is_charged, quoted_price,
        service_docs, consensus_docs, consensus_date,
        sales_sub_project_no, material_code, oa_work_order_no, contract_id, contract_no, contract_name, progress_notes,
        implementer, implementation_complete_date, actual_hours, work_order_docs, site_completion_docs, work_order_signer,
        invoice_application, invoice_completed, invoice_delivered, planned_payment_date, actual_payment_date,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41, $42)
      RETURNING *`,
      [
        woNo, title || '', task_no || woNo, customer_id, customer_name || '', task_leader || '', implementation_entity || '',
        task_phase || '需求阶段', task_progress || '10%收到服务需求', task_status || '计划中',
        JSON.stringify(contacts || []), demand_date || null,
        service_plan || '', plan_hours || 0, planned_completion_date || null, material_requirements || '', warranty_status || '', is_charged || false, quoted_price || 0,
        service_docs || '', consensus_docs || '', consensus_date || null,
        sales_sub_project_no || '', material_code || '', oa_work_order_no || '', contract_id || null, contract_no || '', contract_name || '',
        JSON.stringify(progress_notes || []),
        implementer || '', implementation_complete_date || null, actual_hours || 0, work_order_docs || '', site_completion_docs || '', work_order_signer || '',
        invoice_application || '', invoice_completed || '', invoice_delivered || '', planned_payment_date || null, actual_payment_date || null,
        new Date(), new Date()
      ]
    );

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Create work order error:', error);
    if (error.code === '23505') {
      res.status(400).json({ error: '工单编号已存在' });
    } else {
      res.status(500).json({ error: '服务器错误' });
    }
  }
});

// 更新工单
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!USE_DATABASE) {
      const index = memoryWorkOrders.findIndex(w => w.id === parseInt(id));
      if (index === -1) {
        return res.status(404).json({ error: '工单不存在' });
      }
      
      // 处理联系人列表
      if (updates.contacts) {
        updates.contacts = updates.contacts;
      }
      
      // 添加回款进度
      if (updates.addPaymentProgress) {
        if (!memoryWorkOrders[index].payment_progress) {
          memoryWorkOrders[index].payment_progress = [];
        }
        memoryWorkOrders[index].payment_progress.push({
          id: Date.now(),
          progress: updates.addPaymentProgress,
          updated_at: new Date().toISOString(),
        });
        delete updates.addPaymentProgress;
      }
      
      memoryWorkOrders[index] = {
        ...memoryWorkOrders[index],
        ...updates,
        updated_at: new Date().toISOString(),
      };
      return res.json(memoryWorkOrders[index]);
    }

    // 构建动态更新查询
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    // 基本情况
    if (updates.title !== undefined) { fields.push(`title = $${paramCount++}`); values.push(updates.title); }
    if (updates.task_no !== undefined) { fields.push(`task_no = $${paramCount++}`); values.push(updates.task_no); }
    if (updates.customer_id !== undefined) { fields.push(`customer_id = $${paramCount++}`); values.push(updates.customer_id); }
    if (updates.customer_name !== undefined) { fields.push(`customer_name = $${paramCount++}`); values.push(updates.customer_name); }
    if (updates.task_leader !== undefined) { fields.push(`task_leader = $${paramCount++}`); values.push(updates.task_leader); }
    if (updates.implementation_entity !== undefined) { fields.push(`implementation_entity = $${paramCount++}`); values.push(updates.implementation_entity); }
    
    // 工单状态
    if (updates.task_phase !== undefined) { fields.push(`task_phase = $${paramCount++}`); values.push(updates.task_phase); }
    if (updates.task_progress !== undefined) { fields.push(`task_progress = $${paramCount++}`); values.push(updates.task_progress); }
    if (updates.task_status !== undefined) { fields.push(`task_status = $${paramCount++}`); values.push(updates.task_status); }
    
    // 客户信息
    if (updates.contacts !== undefined) { fields.push(`contacts = $${paramCount++}`); values.push(JSON.stringify(updates.contacts)); }
    if (updates.demand_date !== undefined) { fields.push(`demand_date = $${paramCount++}`); values.push(updates.demand_date); }
    if (updates.requirement_photos !== undefined) { fields.push(`requirement_photos = $${paramCount++}`); values.push(updates.requirement_photos); }
    if (updates.requirement_videos !== undefined) { fields.push(`requirement_videos = $${paramCount++}`); values.push(updates.requirement_videos); }
    
    // 服务方案
    if (updates.service_plan !== undefined) { fields.push(`service_plan = $${paramCount++}`); values.push(updates.service_plan); }
    if (updates.plan_hours !== undefined) { fields.push(`plan_hours = $${paramCount++}`); values.push(updates.plan_hours); }
    if (updates.planned_completion_date !== undefined) { fields.push(`planned_completion_date = $${paramCount++}`); values.push(updates.planned_completion_date); }
    if (updates.material_requirements !== undefined) { fields.push(`material_requirements = $${paramCount++}`); values.push(updates.material_requirements); }
    if (updates.warranty_status !== undefined) { fields.push(`warranty_status = $${paramCount++}`); values.push(updates.warranty_status); }
    if (updates.is_charged !== undefined) { fields.push(`is_charged = $${paramCount++}`); values.push(updates.is_charged); }
    if (updates.quoted_price !== undefined) { fields.push(`quoted_price = $${paramCount++}`); values.push(updates.quoted_price); }
    if (updates.quoted_price_doc !== undefined) { fields.push(`quoted_price_doc = $${paramCount++}`); values.push(updates.quoted_price_doc); }
    if (updates.service_docs !== undefined) { fields.push(`service_docs = $${paramCount++}`); values.push(updates.service_docs); }
    if (updates.consensus_docs !== undefined) { fields.push(`consensus_docs = $${paramCount++}`); values.push(updates.consensus_docs); }
    if (updates.consensus_date !== undefined) { fields.push(`consensus_date = $${paramCount++}`); values.push(updates.consensus_date); }
    if (updates.sales_sub_project_no !== undefined) { fields.push(`sales_sub_project_no = $${paramCount++}`); values.push(updates.sales_sub_project_no); }
    if (updates.material_code !== undefined) { fields.push(`material_code = $${paramCount++}`); values.push(updates.material_code); }
    if (updates.oa_work_order_no !== undefined) { fields.push(`oa_work_order_no = $${paramCount++}`); values.push(updates.oa_work_order_no); }
    if (updates.contract_id !== undefined) { fields.push(`contract_id = $${paramCount++}`); values.push(updates.contract_id); }
    if (updates.contract_no !== undefined) { fields.push(`contract_no = $${paramCount++}`); values.push(updates.contract_no); }
    if (updates.contract_name !== undefined) { fields.push(`contract_name = $${paramCount++}`); values.push(updates.contract_name); }
    if (updates.progress_notes !== undefined) { fields.push(`progress_notes = $${paramCount++}`); values.push(JSON.stringify(updates.progress_notes)); }
    
    // 实施情况
    if (updates.implementer !== undefined) { fields.push(`implementer = $${paramCount++}`); values.push(updates.implementer); }
    if (updates.implementation_complete_date !== undefined) { fields.push(`implementation_complete_date = $${paramCount++}`); values.push(updates.implementation_complete_date); }
    if (updates.actual_hours !== undefined) { fields.push(`actual_hours = $${paramCount++}`); values.push(updates.actual_hours); }
    if (updates.work_order_docs !== undefined) { fields.push(`work_order_docs = $${paramCount++}`); values.push(updates.work_order_docs); }
    if (updates.site_completion_docs !== undefined) { fields.push(`site_completion_docs = $${paramCount++}`); values.push(updates.site_completion_docs); }
    if (updates.work_order_signer !== undefined) { fields.push(`work_order_signer = $${paramCount++}`); values.push(updates.work_order_signer); }
    
    // 回款情况
    if (updates.invoice_application !== undefined) { fields.push(`invoice_application = $${paramCount++}`); values.push(updates.invoice_application); }
    if (updates.invoice_completed !== undefined) { fields.push(`invoice_completed = $${paramCount++}`); values.push(updates.invoice_completed); }
    if (updates.invoice_delivered !== undefined) { fields.push(`invoice_delivered = $${paramCount++}`); values.push(updates.invoice_delivered); }
    if (updates.planned_payment_date !== undefined) { fields.push(`planned_payment_date = $${paramCount++}`); values.push(updates.planned_payment_date); }
    if (updates.actual_payment_date !== undefined) { fields.push(`actual_payment_date = $${paramCount++}`); values.push(updates.actual_payment_date); }

    if (fields.length === 0) {
      return res.status(400).json({ error: '没有需要更新的字段' });
    }

    fields.push(`updated_at = $${paramCount++}`);
    values.push(new Date());
    values.push(id);

    const query = `UPDATE work_orders SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '工单不存在' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update work order error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 添加回款进度
router.post('/:id/payment-progress', async (req, res) => {
  try {
    const { id } = req.params;
    const { progress } = req.body;

    if (!progress) {
      return res.status(400).json({ error: '回款进度内容不能为空' });
    }

    if (!USE_DATABASE) {
      const order = memoryWorkOrders.find(w => w.id === parseInt(id));
      if (!order) {
        return res.status(404).json({ error: '工单不存在' });
      }
      if (!order.payment_progress) {
        order.payment_progress = [];
      }
      const newProgress = {
        id: Date.now(),
        progress,
        updated_at: new Date().toISOString(),
      };
      order.payment_progress.push(newProgress);
      return res.json(newProgress);
    }

    // 数据库模式需要在work_orders表中添加payment_progress字段或创建新表
    res.json({ id: Date.now(), progress, updated_at: new Date() });
  } catch (error) {
    console.error('Add payment progress error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 删除工单
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!USE_DATABASE) {
      const index = memoryWorkOrders.findIndex(w => w.id === parseInt(id));
      if (index !== -1) {
        memoryWorkOrders.splice(index, 1);
      }
      return res.json({ message: '删除成功' });
    }

    await pool.query('DELETE FROM work_orders WHERE id = $1', [id]);
    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('Delete work order error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取工单日志
router.get('/:id/logs', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT wol.*, u.name as user_name FROM work_order_logs wol LEFT JOIN users u ON wol.user_id = u.id WHERE wol.work_order_id = $1 ORDER BY wol.created_at DESC',
      [id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get work order logs error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 批量导入工单
router.post('/batch', upload.single('file'), async (req: any, res: any) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请上传Excel文件' });
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      return res.status(400).json({ error: 'Excel文件中没有数据' });
    }

    const importedOrders: any[] = [];
    const errors: string[] = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i] as any;
      const rowNum = i + 2;

      // 验证必填字段
      if (!row['工单编号']) {
        errors.push(`第${rowNum}行：工单编号不能为空`);
        continue;
      }
      if (!row['工单名称']) {
        errors.push(`第${rowNum}行：工单名称不能为空`);
        continue;
      }

      const newOrder: any = {
        id: Date.now() + i,
        order_no: row['工单编号'] || '',
        title: row['工单名称'] || '',
        description: row['描述'] || '',
        type: row['工单类型'] || '维修',
        priority: row['优先级'] || 'medium',
        status: 'pending',
        customer_name: row['客户名称'] || '',
        device_name: row['设备名称'] || '',
        stage: row['阶段'] || 'assigned',
        plan_hours: parseFloat(row['计划工时']) || 0,
        is_charged: row['是否收费'] === '是' || row['是否收费'] === 'yes',
        quoted_price: parseFloat(row['报价']) || 0,
        assignee_name: row['处理人'] || '',
        oa_work_order_no: row['OA工单编号'] || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      importedOrders.push(newOrder);
    }

    // 添加到内存存储
    importedOrders.forEach((order) => {
      memoryWorkOrders.unshift(order);
    });

    res.json({
      message: '导入完成',
      total: data.length,
      success: importedOrders.length,
      failed: errors.length,
      errors,
      data: importedOrders,
    });
  } catch (error) {
    console.error('Import work orders error:', error);
    res.status(500).json({ error: '导入失败' });
  }
});

export default router;

export { memoryWorkOrders };
