import express from 'express';

const router = express.Router();

// 内存存储（开发阶段使用）
const reminders: any[] = [];

// 获取所有提醒
router.get('/', (req, res) => {
  res.json(reminders.sort((a, b) => 
    new Date(b.remind_at).getTime() - new Date(a.remind_at).getTime()
  ));
});

// 创建提醒
router.post('/', (req, res) => {
  const { title, content, remind_at } = req.body;
  
  if (!title) {
    return res.status(400).json({ error: '标题不能为空' });
  }
  
  const reminder = {
    id: Date.now(),
    title,
    content: content || '',
    remind_at: remind_at || new Date().toISOString(),
    is_completed: false,
    created_at: new Date().toISOString(),
  };
  
  reminders.push(reminder);
  res.status(201).json(reminder);
});

// 更新提醒
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { title, content, remind_at, is_completed } = req.body;
  
  const index = reminders.findIndex(r => r.id === Number(id));
  if (index === -1) {
    return res.status(404).json({ error: '提醒不存在' });
  }
  
  reminders[index] = {
    ...reminders[index],
    title: title ?? reminders[index].title,
    content: content ?? reminders[index].content,
    remind_at: remind_at ?? reminders[index].remind_at,
    is_completed: is_completed ?? reminders[index].is_completed,
  };
  
  res.json(reminders[index]);
});

// 删除提醒
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const index = reminders.findIndex(r => r.id === Number(id));
  
  if (index === -1) {
    return res.status(404).json({ error: '提醒不存在' });
  }
  
  reminders.splice(index, 1);
  res.status(204).send();
});

// 切换完成状态
router.patch('/:id/toggle', (req, res) => {
  const { id } = req.params;
  const index = reminders.findIndex(r => r.id === Number(id));
  
  if (index === -1) {
    return res.status(404).json({ error: '提醒不存在' });
  }
  
  reminders[index].is_completed = !reminders[index].is_completed;
  res.json(reminders[index]);
});

export default router;
