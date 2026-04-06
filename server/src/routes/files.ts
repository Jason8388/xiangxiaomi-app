import express from 'express';
import multer from 'multer';
import pool from '../database/db';
import { randomUUID } from 'crypto';

const router = express.Router();

// 配置multer用于文件上传
const storage = multer.memoryStorage();
const upload = multer({ storage });

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

// 检查用户是否是管理员
const isAdmin = async (userId: number): Promise<boolean> => {
  const result = await pool.query(
    'SELECT role FROM users WHERE id = $1',
    [userId]
  );
  return result.rows[0]?.role === 'admin';
};

// GET /api/v1/files - 获取文件列表
router.get('/', async (req, res) => {
  try {
    const { search, tag_id, file_type, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = `
      SELECT f.*, u.username as uploader_name,
        COALESCE(json_agg(DISTINCT jsonb_build_object(
          'id', t.id,
          'name', t.name,
          'color', t.color
        )) FILTER (WHERE t.id IS NOT NULL), '[]') as tags
      FROM files f
      LEFT JOIN users u ON f.uploader_id = u.id
      LEFT JOIN file_tags ft ON f.id = ft.file_id
      LEFT JOIN tags t ON ft.tag_id = t.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (search) {
      query += ` AND f.file_name ILIKE $${paramIndex}`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (tag_id) {
      query += ` AND t.id = $${paramIndex}`;
      params.push(tag_id);
      paramIndex++;
    }

    if (file_type) {
      query += ` AND f.file_type = $${paramIndex}`;
      params.push(file_type);
      paramIndex++;
    }

    query += ` GROUP BY f.id, u.username ORDER BY f.upload_time DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(Number(limit), offset);

    const result = await pool.query(query, params);

    // 获取总数
    let countQuery = `
      SELECT COUNT(DISTINCT f.id)
      FROM files f
      LEFT JOIN file_tags ft ON f.id = ft.file_id
      LEFT JOIN tags t ON ft.tag_id = t.id
      WHERE 1=1
    `;
    const countParams: any[] = [];
    let countParamIndex = 1;

    if (search) {
      countQuery += ` AND f.file_name ILIKE $${countParamIndex}`;
      countParams.push(`%${search}%`);
      countParamIndex++;
    }

    if (tag_id) {
      countQuery += ` AND t.id = $${countParamIndex}`;
      countParams.push(tag_id);
      countParamIndex++;
    }

    if (file_type) {
      countQuery += ` AND f.file_type = $${countParamIndex}`;
      countParams.push(file_type);
      countParamIndex++;
    }

    const countResult = await pool.query(countQuery, countParams);

    res.json({
      files: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: Number(page),
      limit: Number(limit),
    });
  } catch (error: any) {
    console.error('Get files error:', error);
    res.status(500).json({ error: '获取文件列表失败' });
  }
});

// GET /api/v1/files/:id - 获取文件详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT f.*, u.username as uploader_name,
        COALESCE(json_agg(DISTINCT jsonb_build_object(
          'id', t.id,
          'name', t.name,
          'color', t.color
        )) FILTER (WHERE t.id IS NOT NULL), '[]') as tags
      FROM files f
      LEFT JOIN users u ON f.uploader_id = u.id
      LEFT JOIN file_tags ft ON f.id = ft.file_id
      LEFT JOIN tags t ON ft.tag_id = t.id
      WHERE f.id = $1
      GROUP BY f.id, u.username
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '文件不存在' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Get file detail error:', error);
    res.status(500).json({ error: '获取文件详情失败' });
  }
});

// POST /api/v1/files/upload - 上传文件
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请选择文件' });
    }

    const { originalname, mimetype, size, buffer } = req.file;
    const uploader_id = req.body.uploader_id ? parseInt(req.body.uploader_id) : 1;
    const description = req.body.description || '';
    const file_type = getFileType(mimetype);

    // 检查是否是文档类型
    const validTypes = ['excel', 'ppt', 'word', 'pdf'];
    if (!validTypes.includes(file_type)) {
      return res.status(400).json({ error: '仅支持上传Excel、PPT、Word、PDF格式的文件' });
    }

    // 生成文件名
    const fileName = `${randomUUID()}.${originalname.split('.').pop()}`;

    // TODO: 上传到对象存储，这里暂时使用模拟URL
    const file_url = `https://example.com/files/${fileName}`;

    // 保存文件信息到数据库
    const result = await pool.query(
      `INSERT INTO files (file_name, file_type, original_name, file_size, file_url, uploader_id, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [fileName, file_type, originalname, size, file_url, uploader_id, description]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('Upload file error:', error);
    res.status(500).json({ error: '文件上传失败' });
  }
});

// POST /api/v1/files/:id/tags - 添加标签
router.post('/:id/tags', async (req, res) => {
  try {
    const { id } = req.params;
    const { tag_id } = req.body;

    // 检查文件是否存在
    const fileResult = await pool.query('SELECT * FROM files WHERE id = $1', [id]);
    if (fileResult.rows.length === 0) {
      return res.status(404).json({ error: '文件不存在' });
    }

    // 检查标签数量是否超过10个
    const tagCountResult = await pool.query(
      'SELECT COUNT(*) as count FROM file_tags WHERE file_id = $1',
      [id]
    );
    if (parseInt(tagCountResult.rows[0].count) >= 10) {
      return res.status(400).json({ error: '每个文件最多只能添加10个标签' });
    }

    // 检查是否已经添加过该标签
    const existingResult = await pool.query(
      'SELECT * FROM file_tags WHERE file_id = $1 AND tag_id = $2',
      [id, tag_id]
    );
    if (existingResult.rows.length > 0) {
      return res.status(400).json({ error: '该标签已存在' });
    }

    // 添加标签关联
    await pool.query(
      'INSERT INTO file_tags (file_id, tag_id) VALUES ($1, $2)',
      [id, tag_id]
    );

    res.status(201).json({ message: '标签添加成功' });
  } catch (error: any) {
    console.error('Add tag error:', error);
    res.status(500).json({ error: '添加标签失败' });
  }
});

// DELETE /api/v1/files/:id/tags/:tagId - 删除标签
router.delete('/:id/tags/:tagId', async (req, res) => {
  try {
    const { id, tagId } = req.params;

    const result = await pool.query(
      'DELETE FROM file_tags WHERE file_id = $1 AND tag_id = $2',
      [id, tagId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: '标签不存在' });
    }

    res.json({ message: '标签删除成功' });
  } catch (error: any) {
    console.error('Delete tag error:', error);
    res.status(500).json({ error: '删除标签失败' });
  }
});

// POST /api/v1/files/download/:id - 下载文件（增加下载计数）
router.post('/download/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'UPDATE files SET download_count = download_count + 1 WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '文件不存在' });
    }

    res.json({ message: '下载记录已更新', file: result.rows[0] });
  } catch (error: any) {
    console.error('Download file error:', error);
    res.status(500).json({ error: '下载文件失败' });
  }
});

// DELETE /api/v1/files/batch - 批量删除文件（仅管理员）
router.delete('/batch', async (req, res) => {
  try {
    const { ids, user_id } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: '请选择要删除的文件' });
    }

    // 检查是否是管理员
    const admin = await isAdmin(user_id);
    if (!admin) {
      return res.status(403).json({ error: '只有管理员可以批量删除文件' });
    }

    // 批量删除
    const result = await pool.query(
      'DELETE FROM files WHERE id = ANY($1) RETURNING *',
      [ids]
    );

    res.json({
      message: `成功删除${result.rowCount}个文件`,
      deleted_count: result.rowCount,
    });
  } catch (error: any) {
    console.error('Batch delete error:', error);
    res.status(500).json({ error: '批量删除失败' });
  }
});

// GET /api/v1/tags - 获取所有标签
router.get('/tags/list', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM tags ORDER BY name ASC'
    );

    // 获取每个标签的使用次数
    const tags = await Promise.all(
      result.rows.map(async (tag) => {
        const countResult = await pool.query(
          'SELECT COUNT(*) as count FROM file_tags WHERE tag_id = $1',
          [tag.id]
        );
        return {
          ...tag,
          count: parseInt(countResult.rows[0].count),
        };
      })
    );

    res.json(tags);
  } catch (error: any) {
    console.error('Get tags error:', error);
    res.status(500).json({ error: '获取标签列表失败' });
  }
});

// POST /api/v1/tags - 创建标签
router.post('/tags', async (req, res) => {
  try {
    const { name, color = '#1E88E5' } = req.body;

    if (!name) {
      return res.status(400).json({ error: '标签名称不能为空' });
    }

    const result = await pool.query(
      'INSERT INTO tags (name, color) VALUES ($1, $2) RETURNING *',
      [name, color]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    if (error.code === '23505') { // 唯一约束冲突
      return res.status(400).json({ error: '标签名称已存在' });
    }
    console.error('Create tag error:', error);
    res.status(500).json({ error: '创建标签失败' });
  }
});

export default router;
