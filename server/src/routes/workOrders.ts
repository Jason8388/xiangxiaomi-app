import express from 'express';
import pool, { USE_DATABASE } from '../database/db';

const router = express.Router();

// 内存数据存储
const memoryWorkOrders: any[] = [];
let memoryWorkOrderId = 1;
let orderNoCounter = 1;

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

// 获取工单列表
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
        cu.name ILIKE $1
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
      return res.json(newOrder);
    }

    const result = await pool.query(
      `INSERT INTO work_orders (
        order_no, title, task_no, customer_id, customer_name, task_leader, implementation_entity,
        task_phase, task_progress, task_status, contacts, demand_date,
        service_plan, plan_hours, planned_completion_date, material_requirements, warranty_status, is_charged, quoted_price,
        service_docs, consensus_docs, consensus_date,
        implementer, implementation_complete_date, actual_hours, work_order_docs, site_completion_docs, work_order_signer,
        invoice_application, invoice_completed, invoice_delivered, planned_payment_date, actual_payment_date,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36)
      RETURNING *`,
      [
        woNo, title || '', task_no || woNo, customer_id, customer_name || '', task_leader || '', implementation_entity || '',
        task_phase || '需求阶段', task_progress || '10%收到服务需求', task_status || '计划中',
        JSON.stringify(contacts || []), demand_date || null,
        service_plan || '', plan_hours || 0, planned_completion_date || null, material_requirements || '', warranty_status || '', is_charged || false, quoted_price || 0,
        service_docs || '', consensus_docs || '', consensus_date || null,
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
    
    // 服务方案
    if (updates.service_plan !== undefined) { fields.push(`service_plan = $${paramCount++}`); values.push(updates.service_plan); }
    if (updates.plan_hours !== undefined) { fields.push(`plan_hours = $${paramCount++}`); values.push(updates.plan_hours); }
    if (updates.planned_completion_date !== undefined) { fields.push(`planned_completion_date = $${paramCount++}`); values.push(updates.planned_completion_date); }
    if (updates.material_requirements !== undefined) { fields.push(`material_requirements = $${paramCount++}`); values.push(updates.material_requirements); }
    if (updates.warranty_status !== undefined) { fields.push(`warranty_status = $${paramCount++}`); values.push(updates.warranty_status); }
    if (updates.is_charged !== undefined) { fields.push(`is_charged = $${paramCount++}`); values.push(updates.is_charged); }
    if (updates.quoted_price !== undefined) { fields.push(`quoted_price = $${paramCount++}`); values.push(updates.quoted_price); }
    if (updates.service_docs !== undefined) { fields.push(`service_docs = $${paramCount++}`); values.push(updates.service_docs); }
    if (updates.consensus_docs !== undefined) { fields.push(`consensus_docs = $${paramCount++}`); values.push(updates.consensus_docs); }
    if (updates.consensus_date !== undefined) { fields.push(`consensus_date = $${paramCount++}`); values.push(updates.consensus_date); }
    
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

export default router;
