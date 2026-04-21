import express from 'express';
import { memoryWorkOrders as workOrders } from './workOrders';

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

// 检查工单是否缺失必填字段
function checkMissingFields(workOrder: any): string[] {
  const missingFields: string[] = [];

  // 检查任务负责人（task_leader 或 assignee_name）
  if (!workOrder.task_leader && !workOrder.assignee_name) {
    missingFields.push('任务负责人');
  }

  // 检查任务进度
  if (!workOrder.task_progress) {
    missingFields.push('任务进度');
  }

  // 检查任务状态
  if (!workOrder.task_status) {
    missingFields.push('任务状态');
  }

  // 检查需求信息（description 或 requirement_description）
  if (!workOrder.description && !workOrder.requirement_description) {
    missingFields.push('需求信息');
  }

  // 检查服务方案说明
  if (!workOrder.service_plan) {
    missingFields.push('服务方案说明');
  }

  // 检查计划完成日期
  if (!workOrder.planned_completion_date) {
    missingFields.push('计划完成日期');
  }

  // 检查是否收费
  if (workOrder.is_charged === undefined || workOrder.is_charged === null) {
    missingFields.push('是否收费');
  }

  return missingFields;
}

// 自动扫描所有工单并生成待填提醒
router.post('/scan', async (req, res) => {
  try {
    // 清空旧提醒（可选）
    // memoryReminders.length = 0;

    // 扫描所有工单
    let newRemindersCount = 0;

    workOrders.forEach((workOrder) => {
      // 检查缺失字段
      const missingFields = checkMissingFields(workOrder);

      // 如果有缺失字段，创建提醒
      if (missingFields.length > 0) {
        // 检查是否已经存在该工单的提醒
        const existingReminder = memoryReminders.find(
          (r) => r.work_order_id === workOrder.id && !r.is_read
        );

        if (!existingReminder) {
          const reminder: WorkOrderReminder = {
            id: reminderId++,
            work_order_id: workOrder.id,
            work_order_name: workOrder.title || '未命名工单',
            work_order_no: workOrder.order_no || '',
            missing_fields,
            created_at: new Date().toISOString(),
            is_read: false,
            assigned_to: workOrder.task_leader || workOrder.assignee_name || '',
          };

          memoryReminders.push(reminder);
          newRemindersCount++;
        }
      }
    });

    res.json({
      success: true,
      newRemindersCount,
      totalReminders: memoryReminders.length,
    });
  } catch (error) {
    console.error('Scan work orders error:', error);
    res.status(500).json({ error: '扫描失败' });
  }
});

// 获取所有提醒（自动扫描）
router.get('/', async (req, res) => {
  try {
    const { is_read, work_order_id, auto_scan } = req.query;

    // 如果请求自动扫描
    if (auto_scan === 'true') {
      workOrders.forEach((workOrder) => {
        const missingFields = checkMissingFields(workOrder);
        if (missingFields.length > 0) {
          const existingReminder = memoryReminders.find(
            (r) => r.work_order_id === workOrder.id
          );
          if (!existingReminder) {
            const reminder: WorkOrderReminder = {
              id: reminderId++,
              work_order_id: workOrder.id,
              work_order_name: workOrder.title || '未命名工单',
              work_order_no: workOrder.order_no || '',
              missing_fields: missingFields,
              created_at: new Date().toISOString(),
              is_read: false,
              assigned_to: workOrder.task_leader || workOrder.assignee_name || '',
            };
            memoryReminders.push(reminder);
          } else if (existingReminder.missing_fields.join(',') !== missingFields.join(',')) {
            // 更新缺失字段
            existingReminder.missing_fields = missingFields;
            existingReminder.is_read = false;
          }
        }
      });
    }

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
