import express from 'express';
import multer from 'multer';
import pool, { USE_DATABASE } from '../database/db';
import { randomUUID } from 'crypto';

const router = express.Router();

// 配置multer用于文件上传
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
    files: 5, // 最多5个文件
  },
});

// 判断文件类型
const getFileType = (mimeType: string): string => {
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) {
    return 'excel';
  }
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) {
    return 'ppt';
  }
  if (mimeType.includes('word') || mimeType.includes('document')) {
    return 'word';
  }
  if (mimeType.includes('pdf')) {
    return 'pdf';
  }
  return 'other';
};

// 内存数据存储
const memoryFiles: any[] = [];
let memoryFileId = 1;

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

// 获取文件列表
router.get('/', async (req, res) => {
  try {
    const { search, file_type, tag_id, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = `
      SELECT f.*, u.username as uploader_name,
             COALESCE(
               (SELECT json_agg(json_build_object('id', t.id, 'name', t.name))
                FROM file_tags ft
                JOIN tags t ON ft.tag_id = t.id
                WHERE ft.file_id = f.id), '[]'
             ) as tags
      FROM files f
      LEFT JOIN users u ON f.uploader_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (search) {
      query += ` AND (f.original_name ILIKE $${paramIndex} OR f.description ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (file_type) {
      query += ` AND f.file_type = $${paramIndex}`;
      params.push(file_type);
      paramIndex++;
    }

    query += ` ORDER BY f.upload_time DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(Number(limit), offset);

    try {
      const result = await queryWithRetry(query, params);

      // 获取总数
      let countQuery = 'SELECT COUNT(DISTINCT f.id) FROM files f WHERE 1=1';
      const countParams: any[] = [];
      let countParamIndex = 1;

      if (search) {
        countQuery += ` AND (f.original_name ILIKE $${countParamIndex} OR f.description ILIKE $${countParamIndex})`;
        countParams.push(`%${search}%`);
        countParamIndex++;
      }

      if (file_type) {
        countQuery += ` AND f.file_type = $${countParamIndex}`;
        countParams.push(file_type);
      }

      const countResult = await queryWithRetry(countQuery, countParams);

      res.json({
        files: result.rows,
        total: parseInt(countResult.rows[0].count),
        page: Number(page),
        limit: Number(limit),
      });
    } catch (dbError: any) {
      console.error('Database error, using memory storage:', dbError.message);
      // 内存数据过滤
      let filtered = [...memoryFiles];
      if (search) {
        const kw = (search as string).toLowerCase();
        filtered = filtered.filter(f =>
          f.file_name?.toLowerCase().includes(kw) ||
          f.original_name?.toLowerCase().includes(kw) ||
          f.description?.toLowerCase().includes(kw)
        );
      }
      if (file_type) {
        filtered = filtered.filter(f => f.file_type === file_type);
      }

      res.json({
        files: filtered.slice(offset, offset + Number(limit)),
        total: filtered.length,
        page: Number(page),
        limit: Number(limit),
      });
    }
  } catch (error: any) {
    console.error('Get files error:', error);
    res.status(500).json({ error: '获取文件列表失败' });
  }
});

// 获取单个文件信息
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    try {
      const result = await queryWithRetry(
        `SELECT f.*, u.username as uploader_name,
                COALESCE(
                  (SELECT json_agg(json_build_object('id', t.id, 'name', t.name))
                   FROM file_tags ft
                   JOIN tags t ON ft.tag_id = t.id
                   WHERE ft.file_id = f.id), '[]'
                ) as tags
         FROM files f
         LEFT JOIN users u ON f.uploader_id = u.id
         WHERE f.id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: '文件不存在' });
      }

      res.json(result.rows[0]);
    } catch (dbError: any) {
      console.error('Database error, using memory storage:', dbError.message);
      const file = memoryFiles.find(f => f.id === parseInt(id));
      if (file) {
        res.json(file);
      } else {
        res.status(404).json({ error: '文件不存在' });
      }
    }
  } catch (error: any) {
    console.error('Get file error:', error);
    res.status(500).json({ error: '获取文件信息失败' });
  }
});

// 上传文件
router.post('/upload', upload.array('files', 5), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    const { description, tags } = req.body;
    const uploader_id = Number(req.body.uploader_id) || 0;

    if (!files || files.length === 0) {
      return res.status(400).json({ error: '请选择要上传的文件' });
    }

    const results: any[] = [];

    for (const file of files) {
      const { originalname, mimetype, size, buffer } = file;
      const file_type = getFileType(mimetype);
      const fileName = `${randomUUID()}.${originalname.split('.').pop()}`;
      const file_url = `/uploads/${fileName}`;

      try {
        const result = await queryWithRetry(
          `INSERT INTO files (file_name, file_type, original_name, file_size, file_url, uploader_id, description)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING *`,
          [fileName, file_type, originalname, size, file_url, uploader_id, description]
        );
        results.push(result.rows[0]);
      } catch (dbError: any) {
        console.error('Database error, using memory storage:', dbError.message);
        const newFile = {
          id: memoryFileId++,
          file_name: fileName,
          file_type,
          original_name: originalname,
          file_size: size,
          file_url,
          uploader_id,
          description,
          upload_time: new Date().toISOString(),
          tags: tags ? JSON.parse(tags) : [],
          downloads: 0,
        };
        memoryFiles.unshift(newFile);
        results.push(newFile);
      }
    }

    res.status(201).json({
      message: `成功上传${results.length}个文件`,
      files: results
    });
  } catch (error: any) {
    console.error('Upload files error:', error);
    res.status(500).json({ error: '文件上传失败' });
  }
});

// 删除文件
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    try {
      const result = await queryWithRetry(
        'DELETE FROM files WHERE id = $1 RETURNING id',
        [id]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ error: '文件不存在' });
      }

      res.json({ message: '文件删除成功' });
    } catch (dbError: any) {
      console.error('Database error, using memory storage:', dbError.message);
      const index = memoryFiles.findIndex(f => f.id === parseInt(id));
      if (index === -1) {
        return res.status(404).json({ error: '文件不存在' });
      }
      memoryFiles.splice(index, 1);
      res.json({ message: '文件删除成功' });
    }
  } catch (error: any) {
    console.error('Delete file error:', error);
    res.status(500).json({ error: '删除文件失败' });
  }
});

// 获取所有标签
router.get('/meta/tags', async (req, res) => {
  try {
    try {
      const result = await queryWithRetry('SELECT * FROM tags ORDER BY name');
      res.json(result.rows);
    } catch (dbError: any) {
      console.error('Database error, using memory storage:', dbError.message);
      res.json([]);
    }
  } catch (error: any) {
    console.error('Get tags error:', error);
    res.status(500).json({ error: '获取标签失败' });
  }
});

export default router;
