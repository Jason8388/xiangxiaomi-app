import express from 'express';
import multer from 'multer';
import pool, { USE_DATABASE } from '../database/db';
import { FileManager } from '../utils/fileManager';

const router = express.Router();

// 配置文件上传 - 支持图片和文档
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 限制50MB
  },
  fileFilter: (req, file, cb) => {
    // 允许的文件类型
    const allowedTypes = [
      // 图片
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      // Word文档
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      // Excel表格
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      // PowerPoint
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      // PDF
      'application/pdf',
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件类型'));
    }
  }
});

// 内存数据存储（用于数据库不可用时）
const memoryKnowledgeList: any[] = [
  {
    id: 1,
    title: '设备日常维护指南',
    category: '维护手册',
    content: '设备日常维护是保证设备正常运行的重要环节。\n\n1. 每天开机前检查设备外观和电源\n2. 定期清洁设备表面和散热孔\n3. 每周检查设备运行参数\n4. 每月进行全面的设备保养',
    author: '系统管理员',
    view_count: 156,
    like_count: 28,
    tags: ['设备维护', '日常保养', '操作规范'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    title: '常见故障代码及解决方案',
    category: '故障处理',
    content: '当设备出现故障时，请参照以下代码进行初步诊断：\n\nE001 - 温度过高：检查散热系统是否正常\nE002 - 压力异常：检查管路是否堵塞\nE003 - 电机过载：减少设备负荷\nE004 - 传感器故障：联系技术支持',
    author: '技术支持部',
    view_count: 234,
    like_count: 45,
    tags: ['故障代码', '故障处理', '维修指南'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 3,
    title: '安全生产操作规程',
    category: '安全规范',
    content: '安全生产是企业发展的基础，每位员工必须遵守以下规程：\n\n1. 进入车间必须穿戴安全防护用品\n2. 严禁酒后上岗和疲劳作业\n3. 设备运行中禁止进行维修保养\n4. 发现安全隐患立即报告\n5. 定期参加安全培训',
    author: '安全管理部门',
    view_count: 312,
    like_count: 67,
    tags: ['安全生产', '操作规程', '安全培训'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];
let memoryKnowledgeId = 4;

// 带重试的查询函数
async function queryWithRetry(query: string, params: any[] = [], retries = 1, delay = 500) {
  if (!USE_DATABASE) {
    throw new Error('Database not available');
  }
  for (let i = 0; i < retries; i++) {
    try {
      return await pool.query(query, params);
    } catch (error: any) {
      if (i < retries - 1 && (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.message.includes('timeout') || error.message.includes('terminated'))) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries reached');
}

// 获取知识库列表
router.get('/', async (req, res) => {
  try {
    try {
      const result = await queryWithRetry(
        'SELECT k.*, u.name as author_name FROM knowledge k LEFT JOIN users u ON k.author_id = u.id ORDER BY k.id DESC LIMIT 100'
      );
      res.json({ code: 0, data: result.rows, message: 'success' });
    } catch (dbError: any) {
      console.error('Database error, using memory storage:', dbError.message);
      res.json({ code: 0, data: memoryKnowledgeList.slice(0, 100), message: 'success' });
    }
  } catch (error) {
    console.error('Get knowledge error:', error);
    res.status(500).json({ code: 1, message: '服务器错误' });
  }
});

// 获取知识库详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    try {
      // 增加浏览次数
      await queryWithRetry('UPDATE knowledge SET views = views + 1 WHERE id = $1', [id]);

      const result = await queryWithRetry(
        'SELECT k.*, u.name as author_name FROM knowledge k LEFT JOIN users u ON k.author_id = u.id WHERE k.id = $1',
        [id]
      );

      if (result.rows.length === 0) {
        // 尝试从内存中获取
        const memoryItem = memoryKnowledgeList.find(k => k.id === parseInt(id));
        if (memoryItem) {
          return res.json(memoryItem);
        }
        return res.status(404).json({ error: '知识不存在' });
      }

      const knowledge = result.rows[0];
      // 如果 author_name 为空，使用默认值
      if (!knowledge.author_name) {
        knowledge.author_name = '未知用户';
      }
      // 添加 author 字段用于前端兼容
      knowledge.author = knowledge.author_name;
      knowledge.author_name = knowledge.author_name;

      // 如果有附件 key，动态生成 URL
      if (knowledge.attachment_keys && Array.isArray(knowledge.attachment_keys) && knowledge.attachment_keys.length > 0) {
        try {
          const attachments = await FileManager.enrichAttachmentsWithUrls(knowledge.attachment_keys);
          knowledge.attachments = attachments;
        } catch (error) {
          console.error('[知识库详情] 生成附件 URL 失败:', error);
          knowledge.attachments = [];
        }
      } else {
        knowledge.attachments = [];
      }

      res.json(knowledge);
    } catch (dbError: any) {
      console.error('Database error, using memory storage:', dbError.message);
      const memoryItem = memoryKnowledgeList.find(k => k.id === parseInt(id));
      if (memoryItem) {
        return res.json(memoryItem);
      }
      res.status(404).json({ error: '知识不存在' });
    }
  } catch (error) {
    console.error('Get knowledge detail error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 搜索知识库
router.get('/search/:keyword', async (req, res) => {
  try {
    const { keyword } = req.params;
    try {
      const result = await queryWithRetry(
        "SELECT k.*, u.name as author_name FROM knowledge k LEFT JOIN users u ON k.author_id = u.id WHERE k.title ILIKE $1 OR k.content ILIKE $1 ORDER BY k.id DESC",
        [`%${keyword}%`]
      );
      res.json(result.rows);
    } catch (dbError: any) {
      console.error('Database error, using memory storage:', dbError.message);
      const kw = keyword.toLowerCase();
      const filtered = memoryKnowledgeList.filter(k => 
        k.title?.toLowerCase().includes(kw) || 
        k.content?.toLowerCase().includes(kw)
      );
      res.json(filtered);
    }
  } catch (error) {
    console.error('Search knowledge error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 创建知识库（支持文件上传）
router.post('/', async (req, res) => {
  try {
    const { title, content, tags, author_id, creator, attachments, attachmentKeys } = req.body;

    if (!title) {
      return res.status(400).json({ error: '标题不能为空' });
    }

    // 安全解析 tags
    let parsedTags: string[] = [];
    if (tags) {
      try {
        parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
      } catch (e) {
        parsedTags = [tags];
      }
    }

    // 获取创建者姓名，如果没有则使用默认值
    const creatorName = creator || '当前用户';

    // 处理附件：优先使用 attachmentKeys（文件 key 数组），否则从 attachments 提取 key
    let finalAttachmentKeys: string[] = [];
    
    if (attachmentKeys && Array.isArray(attachmentKeys)) {
      // 直接使用文件 key 数组
      finalAttachmentKeys = attachmentKeys;
    } else if (attachments && Array.isArray(attachments)) {
      // 从 attachments 数组中提取 key（兼容旧格式）
      const extractedKeys = FileManager.extractFileKeys(attachments);
      finalAttachmentKeys = extractedKeys;
    }

    console.log('[知识库创建] 附件 key 数量:', finalAttachmentKeys.length);

    try {
      const result = await queryWithRetry(
        'INSERT INTO knowledge (title, content, tags, author_id, attachment_keys, author_name) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, title',
        [title, content || '', parsedTags, author_id, finalAttachmentKeys, creatorName]
      );
      res.status(201).json({ id: result.rows[0].id, title: result.rows[0].title });
    } catch (dbError: any) {
      console.error('Database error, using memory storage:', dbError.message);
      // 使用内存存储
      const newKnowledge = {
        id: memoryKnowledgeId++,
        title,
        content: content || '',
        tags: parsedTags,
        author_id,
        author: creatorName,
        author_name: creatorName,
        attachment_keys: finalAttachmentKeys,
        views: 0,
        likes: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      memoryKnowledgeList.unshift(newKnowledge);
      res.status(201).json({ id: newKnowledge.id, title: newKnowledge.title });
    }
  } catch (error) {
    console.error('Create knowledge error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 更新知识库
router.put('/:id', upload.array('files', 10), async (req, res) => {
  try {
    const id = req.params.id as string;
    const { title, content, tags } = req.body;
    const files = req.files as Express.Multer.File[];

    try {
      let attachments: any[] = [];
      if (files && files.length > 0) {
        attachments = files.map(file => ({
          name: file.originalname,
          size: file.size,
          type: file.mimetype,
        }));
      }

      // 安全解析 tags
      let parsedTags: string[] = [];
      if (tags) {
        try {
          parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
        } catch (e) {
          parsedTags = [tags];
        }
      }

      let query = 'UPDATE knowledge SET title = $1, content = $2, tags = $3';
      const params: any[] = [title, content || '', parsedTags];
      
      if (attachments.length > 0) {
        query += ', attachments = $4 WHERE id = $5';
        params.push(JSON.stringify(attachments), id);
      } else {
        query += ' WHERE id = $4';
        params.push(id);
      }

      const result = await queryWithRetry(query, params);

      if (result.rowCount === 0) {
        return res.status(404).json({ error: '知识不存在' });
      }

      res.json({ message: '更新成功' });
    } catch (dbError: any) {
      console.error('Database error, using memory storage:', dbError.message);
      const index = memoryKnowledgeList.findIndex(k => k.id === parseInt(id));
      if (index === -1) {
        return res.status(404).json({ error: '知识不存在' });
      }
      // 安全解析 tags
      let parsedTags: string[] = [];
      if (tags) {
        try {
          parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
        } catch (e) {
          parsedTags = [];
        }
      }
      memoryKnowledgeList[index] = {
        ...memoryKnowledgeList[index],
        title,
        content: content || '',
        tags: parsedTags,
        updated_at: new Date().toISOString(),
      };
      res.json({ message: '更新成功' });
    }
  } catch (error) {
    console.error('Update knowledge error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 删除知识库
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    try {
      const result = await queryWithRetry(
        'DELETE FROM knowledge WHERE id = $1 RETURNING id',
        [id]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ error: '知识不存在' });
      }

      res.json({ message: '删除成功' });
    } catch (dbError: any) {
      console.error('Database error, using memory storage:', dbError.message);
      const index = memoryKnowledgeList.findIndex(k => k.id === parseInt(id));
      if (index === -1) {
        return res.status(404).json({ error: '知识不存在' });
      }
      memoryKnowledgeList.splice(index, 1);
      res.json({ message: '删除成功' });
    }
  } catch (error) {
    console.error('Delete knowledge error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

export default router;
