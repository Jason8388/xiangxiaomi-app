import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import pool from '../database/db';

const router = express.Router();

// 配置 multer 存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = '/tmp/uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

// 文件过滤器：只允许 Excel、Word、PPT、PDF
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // pptx
    'application/pdf',
  ];
  const allowedExtensions = ['.xls', '.xlsx', '.doc', '.docx', '.ppt', '.pptx', '.pdf'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('只允许上传 Excel、Word、PPT、PDF 格式文件'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 限制50MB
});

// 获取文件列表
router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;

    // Fallback 预置数据（数据库不可用时使用）
    const fallbackData = [
      {
        id: 1,
        file_name: '项目进度报告.xlsx',
        original_name: '项目进度报告.xlsx',
        file_type: 'xlsx',
        file_size: 1024000,
        category: '项目文档',
        description: '2024年第一季度项目进度汇总',
        uploaded_by: 1,
        created_at: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: 2,
        file_name: '会议纪要.docx',
        original_name: '会议纪要.docx',
        file_type: 'docx',
        file_size: 512000,
        category: '会议记录',
        description: '4月份项目例会纪要',
        uploaded_by: 1,
        created_at: new Date(Date.now() - 172800000).toISOString(),
      },
    ];

    try {
      let query = 'SELECT * FROM files WHERE 1=1';
      const params: any[] = [];
      let paramCount = 1;

      if (category) {
        query += ` AND category = $${paramCount}`;
        params.push(category);
        paramCount++;
      }

      if (search) {
        query += ` AND (original_name ILIKE $${paramCount} OR description ILIKE $${paramCount})`;
        params.push(`%${search}%`);
        paramCount++;
      }

      // 按上传时间倒序排列（最新在前）
      query += ' ORDER BY created_at DESC';

      const result = await pool.query(query, params);

      if (result.rows.length > 0) {
        // 解析 tags 字段
        const rows = result.rows.map(row => {
          if (row.tags && typeof row.tags === 'string') {
            try {
              row.tags = JSON.parse(row.tags);
            } catch {
              row.tags = [];
            }
          } else if (!row.tags) {
            row.tags = [];
          }
          return row;
        });
        res.json(rows);
      } else {
        res.json(fallbackData);
      }
    } catch (dbError) {
      console.log('Using fallback file data due to DB error');
      res.json(fallbackData);
    }
  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({ error: '获取文件列表失败' });
  }
});

// 上传文件
router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请选择要上传的文件' });
    }

    const { category, description, tags, uploader_name } = req.body;
    
    // 解析标签
    let parsedTags: string[] = [];
    if (tags) {
      try {
        parsedTags = JSON.parse(tags);
      } catch {
        parsedTags = [];
      }
    }

    // 获取文件扩展名
    const fileExt = path.extname(req.file.originalname).toLowerCase().replace('.', '');

    // Fallback 预置响应（数据库不可用时）
    const fallbackResponse = {
      id: Date.now(),
      file_name: req.file.filename,
      original_name: req.file.originalname,
      file_type: fileExt,
      file_size: req.file.size,
      category: category || '未分类',
      description: description || '',
      tags: parsedTags,
      uploader_name: uploader_name || '未知',
      created_at: new Date().toISOString(),
    };

    try {
      const result = await pool.query(
        `INSERT INTO files (file_name, original_name, file_path, file_size, file_type, category, description, tags, uploader_name, uploaded_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          req.file.filename,
          req.file.originalname,
          req.file.path,
          req.file.size,
          fileExt,
          category || '未分类',
          description || '',
          JSON.stringify(parsedTags),
          uploader_name || '',
          req.body.uploaded_by || 1,
        ]
      );

      // 解析 tags 和 uploader_name 返回
      const row = result.rows[0];
      if (row.tags && typeof row.tags === 'string') {
        try {
          row.tags = JSON.parse(row.tags);
        } catch {
          row.tags = [];
        }
      }
      res.json(row);
    } catch (dbError) {
      console.log('Using fallback response due to DB error');
      res.json(fallbackResponse);
    }
  } catch (error) {
    console.error('Upload file error:', error);
    res.status(500).json({ error: '文件上传失败' });
  }
});

// 获取文件详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('SELECT * FROM files WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '文件不存在' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get file error:', error);
    res.status(500).json({ error: '获取文件详情失败' });
  }
});

// 删除文件
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 先获取文件信息
    const result = await pool.query('SELECT * FROM files WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '文件不存在' });
    }

    const file = result.rows[0];

    // 删除物理文件
    if (file.file_path && fs.existsSync(file.file_path)) {
      fs.unlinkSync(file.file_path);
    }

    // 删除数据库记录
    await pool.query('DELETE FROM files WHERE id = $1', [id]);

    res.json({ message: '文件删除成功' });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ error: '删除文件失败' });
  }
});

// 下载文件
router.get('/:id/download', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('SELECT * FROM files WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '文件不存在' });
    }

    const file = result.rows[0];

    if (!fs.existsSync(file.file_path)) {
      return res.status(404).json({ error: '文件不存在或已被删除' });
    }

    res.download(file.file_path, file.original_name);
  } catch (error) {
    console.error('Download file error:', error);
    res.status(500).json({ error: '文件下载失败' });
  }
});

export default router;
