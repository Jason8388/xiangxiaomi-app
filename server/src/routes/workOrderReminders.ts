import express from 'express';

const router = express.Router();

interface WorkOrderReminder {
  id: number;
  work_order_id: number;
  work_order_name: string;
  work_order_no: string;
  missing_fields: string[];
  created_at: string;
  is_read: boolean;
  assigned_to?: string;
}

// 内存存储（模拟数据库）
const memoryReminders: WorkOrderReminder[] = [];
let reminderId = 1;

export default router;

// 获取工单待填写字段检查
router.post('/check', async (req, res) => {
  try {
    const { workOrder } = req.body;

    if (!workOrder) {
      return res.status(400).json({ error: '工单信息不能为空' });
    }

    const missingFields: string[] = [];

    // 检查必填字段
    if (!workOrder.task_phase) {
      missingFields.push('任务阶段');
    }
    if (!workOrder.task_progress) {
      missingFields.push('任务进度');
    }
    if (!workOrder.task_status) {
      missingFields.push('任务状态');
    }
    
    // 客户信息检查
    if (!workOrder.customer_name) {
      missingFields.push('客户名称');
    }
    if (!workOrder.contacts || workOrder.contacts.length === 0) {
      missingFields.push('客户联系人');
    }
    
    // 服务方案检查
    if (!workOrder.service_plan) {
      missingFields.push('服务方案');
    }
    
    // 是否收费检查
    if (workOrder.is_charged === undefined || workOrder.is_charged === null) {
      missingFields.push('是否收费');
    }
    
    // 客户共识凭证检查
    if (!workOrder.consensus_docs) {
      missingFields.push('客户共识凭证');
    }
    
    // OA系统工单编号检查
    if (!workOrder.oa_work_order_no) {
      missingFields.push('OA系统工单编号');
    }
    
    // 派工单照片检查
    if (!workOrder.work_order_docs) {
      missingFields.push('派工单照片');
    }
    
    // 派工单签字人检查
    if (!workOrder.work_order_signer) {
      missingFields.push('派工单签字人');
    }
    
    // 实际工时检查
    if (!workOrder.actual_hours && workOrder.actual_hours !== 0) {
      missingFields.push('实际工时');
    }

    res.json({
      missingFields,
      totalMissing: missingFields.length,
      hasMissing: missingFields.length > 0,
    });
  } catch (error) {
    console.error('Check work order error:', error);
    res.status(500).json({ error: '检查失败' });
  }
});

// 创建工单提醒
router.post('/', async (req, res) => {
  try {
    const { work_order_id, work_order_name, work_order_no, missing_fields, assigned_to } = req.body;

    if (!work_order_id || !missing_fields || missing_fields.length === 0) {
      return res.status(400).json({ error: '参数不完整' });
    }

    const reminder: WorkOrderReminder = {
      id: reminderId++,
      work_order_id,
      work_order_name: work_order_name || '未命名工单',
      work_order_no: work_order_no || '',
      missing_fields,
      created_at: new Date().toISOString(),
      is_read: false,
      assigned_to,
    };

    memoryReminders.push(reminder);

    res.json(reminder);
  } catch (error) {
    console.error('Create reminder error:', error);
    res.status(500).json({ error: '创建提醒失败' });
  }
});

// 获取所有提醒
router.get('/', async (req, res) => {
  try {
    const { is_read, work_order_id } = req.query;

    let filtered = [...memoryReminders];

    if (is_read !== undefined) {
      filtered = filtered.filter(r => r.is_read === (is_read === 'true'));
    }

    if (work_order_id) {
      filtered = filtered.filter(r => r.work_order_id === parseInt(work_order_id as string));
    }

    // 按创建时间倒序排列
    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    res.json(filtered);
  } catch (error) {
    console.error('Get reminders error:', error);
    res.status(500).json({ error: '获取提醒失败' });
  }
});

// 获取未读提醒数量
router.get('/unread-count', async (req, res) => {
  try {
    const count = memoryReminders.filter(r => !r.is_read).length;
    res.json({ count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: '获取失败' });
  }
});

// 标记提醒为已读
router.put('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;

    const reminder = memoryReminders.find(r => r.id === parseInt(id));
    if (!reminder) {
      return res.status(404).json({ error: '提醒不存在' });
    }

    reminder.is_read = true;
    res.json(reminder);
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ error: '更新失败' });
  }
});

// 标记工单所有提醒为已读
router.put('/work-order/:id/read-all', async (req, res) => {
  try {
    const { id } = req.params;

    const updated = memoryReminders.filter(r => {
      if (r.work_order_id === parseInt(id)) {
        r.is_read = true;
        return true;
      }
      return false;
    });

    res.json({ updated: updated.length });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({ error: '更新失败' });
  }
});

// 删除提醒
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const index = memoryReminders.findIndex(r => r.id === parseInt(id));
    if (index === -1) {
      return res.status(404).json({ error: '提醒不存在' });
    }

    memoryReminders.splice(index, 1);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete reminder error:', error);
    res.status(500).json({ error: '删除失败' });
  }
});
