import express from 'express';
import { memoryFiles } from './files';

const router = express.Router();

// 通用查询接口
router.get('/search', async (req, res) => {
  try {
    const { type, keyword } = req.query;
    res.status(200).json({
      code: 0,
      data: [],
      message: 'success'
    });
  } catch (error) {
    console.error('Query search error:', error);
    res.status(500).json({ code: 1, message: 'Internal server error' });
  }
});

// 合同查询
router.get('/contracts', async (req, res) => {
  try {
    res.status(200).json({
      code: 0,
      data: [],
      message: 'success'
    });
  } catch (error) {
    console.error('Query contracts error:', error);
    res.status(500).json({ code: 1, message: 'Internal server error' });
  }
});

// 设备查询
router.get('/devices', async (req, res) => {
  try {
    res.status(200).json({
      code: 0,
      data: [],
      message: 'success'
    });
  } catch (error) {
    console.error('Query devices error:', error);
    res.status(500).json({ code: 1, message: 'Internal server error' });
  }
});

// 物料查询
router.get('/materials', async (req, res) => {
  try {
    res.status(200).json({
      code: 0,
      data: [],
      message: 'success'
    });
  } catch (error) {
    console.error('Query materials error:', error);
    res.status(500).json({ code: 1, message: 'Internal server error' });
  }
});

// 会议查询
router.get('/meetings', async (req, res) => {
  try {
    const { keyword } = req.query;

    if (!keyword || typeof keyword !== 'string') {
      return res.status(200).json([]);
    }

    // 预置会议纪要数据
    const meetings = [
      {
        id: 1,
        minute_id: 'MIN-2024-001',
        meeting_name: '项目启动会议',
        meeting_type: 'project-start',
        meeting_date: '2024-01-15T09:00:00.000Z',
        meeting_location: '第一会议室',
        attendees: '张三、李四、王五',
        topics: '讨论项目目标、时间节点、资源分配',
        key_points: '确定项目启动时间为2月1日，张三负责技术架构，李四负责项目管理',
        customer_name: '测试客户公司',
        project_name: '智能设备管理系统',
        tags: [{ id: 1, tag: '项目启动' }, { id: 2, tag: '重要会议' }],
        file_url: null,
        created_at: '2024-01-15T09:30:00.000Z',
      },
      {
        id: 2,
        minute_id: 'MIN-2024-002',
        meeting_name: '周例会',
        meeting_type: 'department-weekly',
        meeting_date: '2024-01-20T14:00:00.000Z',
        meeting_location: '第二会议室',
        attendees: '张三、李四、王五、赵六',
        topics: '汇报本周工作进展、讨论下周工作计划',
        key_points: '本周完成需求分析，下周开始开发工作',
        customer_name: null,
        project_name: null,
        tags: [{ id: 1, tag: '周例会' }, { id: 2, tag: '工作汇报' }],
        file_url: null,
        created_at: '2024-01-20T15:00:00.000Z',
      },
      {
        id: 3,
        minute_id: 'MIN-2024-003',
        meeting_name: '客户沟通会议',
        meeting_type: 'customer-meeting',
        meeting_date: '2024-01-25T10:00:00.000Z',
        meeting_location: '客户办公室',
        attendees: '张三、李四、客户代表',
        topics: '讨论系统功能需求、技术方案',
        key_points: '客户确认核心功能，需要增加移动端支持',
        customer_name: '测试客户公司',
        project_name: '智能设备管理系统',
        tags: [{ id: 1, tag: '客户沟通' }, { id: 2, tag: '需求讨论' }],
        file_url: null,
        created_at: '2024-01-25T11:00:00.000Z',
      },
    ];

    // 模糊搜索
    const keywordLower = keyword.toLowerCase();
    const filteredMeetings = meetings.filter((meeting) => {
      const name = (meeting.meeting_name || '').toLowerCase();
      const location = (meeting.meeting_location || '').toLowerCase();
      const attendees = (meeting.attendees || '').toLowerCase();
      const topics = (meeting.topics || '').toLowerCase();
      const type = (meeting.meeting_type || '').toLowerCase();
      const date = (meeting.meeting_date || '').toLowerCase();
      const customer = (meeting.customer_name || '').toLowerCase();
      const project = (meeting.project_name || '').toLowerCase();
      const tags = (meeting.tags || [])
        .map((t) => (typeof t === 'string' ? t : t.tag || ''))
        .join(' ')
        .toLowerCase();

      return (
        name.includes(keywordLower) ||
        location.includes(keywordLower) ||
        attendees.includes(keywordLower) ||
        topics.includes(keywordLower) ||
        type.includes(keywordLower) ||
        date.includes(keywordLower) ||
        customer.includes(keywordLower) ||
        project.includes(keywordLower) ||
        tags.includes(keywordLower)
      );
    });

    res.status(200).json(filteredMeetings);
  } catch (error) {
    console.error('Query meetings error:', error);
    res.status(500).json({ code: 1, message: 'Internal server error' });
  }
});

// 文件查询
router.get('/files', async (req, res) => {
  try {
    const { keyword } = req.query;

    if (!keyword || typeof keyword !== 'string') {
      return res.status(200).json({
        code: 0,
        data: [],
        message: 'success'
      });
    }

    // 从内存存储中搜索文件
    const keywordLower = keyword.toLowerCase();
    const filteredFiles = memoryFiles
      .filter((file) => {
        // 搜索文件名
        const fileName = (file.file_name || '').toLowerCase();
        // 搜索分类
        const category = (file.category || '').toLowerCase();
        // 搜索描述
        const description = (file.description || '').toLowerCase();
        // 搜索标签
        const tags = (file.tags || []).map((t: string) => t.toLowerCase()).join(' ');

        return (
          fileName.includes(keywordLower) ||
          category.includes(keywordLower) ||
          description.includes(keywordLower) ||
          tags.includes(keywordLower)
        );
      })
      .map((file) => ({
        id: file.id,
        file_name: file.file_name,
        file_url: file.file_url || '',
        file_type: file.file_type,
        file_size: file.file_size,
        uploaded_by: file.uploaded_by === 1 ? 'admin' : `用户${file.uploaded_by}`,
        tags: file.tags || [],
        created_at: file.created_at,
        customer_name: file.customer_name || null,
        project_name: file.project_name || null,
        device_name: file.device_name || null,
        device_number: file.device_number || null,
      }));

    res.status(200).json(filteredFiles);
  } catch (error) {
    console.error('Query files error:', error);
    res.status(500).json({ code: 1, message: 'Internal server error' });
  }
});

export default router;
