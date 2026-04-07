import express from 'express';
import multer from 'multer';
import pool, { USE_DATABASE } from '../database/db';

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
const memoryKnowledgeList: any[] = [];
let memoryKnowledgeId = 1;

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
      res.json(result.rows);
    } catch (dbError: any) {
      console.error('Database error, using memory storage:', dbError.message);
      res.json(memoryKnowledgeList.slice(0, 100));
    }
  } catch (error) {
    console.error('Get knowledge error:', error);
    res.status(500).json({ error: '服务器错误' });
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

      res.json(result.rows[0]);
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
router.post('/', upload.array('files', 10), async (req, res) => {
  try {
    const { title, content, tags, author_id } = req.body;
    const files = req.files as Express.Multer.File[];

    if (!title) {
      return res.status(400).json({ error: '标题不能为空' });
    }

    // 处理文件信息
    let attachments: any[] = [];
    if (files && files.length > 0) {
      attachments = files.map((file, index) => ({
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

    try {
      const result = await queryWithRetry(
        'INSERT INTO knowledge (title, content, tags, author_id, attachments) VALUES ($1, $2, $3, $4, $5) RETURNING id, title',
        [title, content || '', parsedTags, author_id, JSON.stringify(attachments)]
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
        attachments,
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
    const { id } = req.params;
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
      memoryKnowledgeList[index] = {
        ...memoryKnowledgeList[index],
        title,
        content: content || '',
        tags: tags ? JSON.parse(tags) : [],
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
