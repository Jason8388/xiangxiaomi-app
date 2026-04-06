import express from 'express';
import multer from 'multer';
import pool from '../database/db';
import { randomUUID } from 'crypto';

const router = express.Router();

// 配置multer用于文件上传
const storage = multer.memoryStorage();
const upload = multer({ storage });

// 判断媒体类型
const getMediaType = (mimeType: string): string => {
  if (mimeType.includes('image')) {
    return 'photo';
  }
  if (mimeType.includes('video')) {
    return 'video';
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

// GET /api/v1/media - 获取媒体列表
router.get('/', async (req, res) => {
  try {
    const {
      search,
      tag_id,
      media_type,
      uploader_id,
      start_date,
      end_date,
      page = 1,
      limit = 20
    } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = `
      SELECT m.*, u.username as uploader_name,
        COALESCE(json_agg(DISTINCT jsonb_build_object(
          'id', t.id,
          'name', t.name,
          'color', t.color
        )) FILTER (WHERE t.id IS NOT NULL), '[]') as tags
      FROM media m
      LEFT JOIN users u ON m.uploader_id = u.id
      LEFT JOIN media_tags mt ON m.id = mt.media_id
      LEFT JOIN tags t ON mt.tag_id = t.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (search) {
      query += ` AND m.original_name ILIKE $${paramIndex}`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (tag_id) {
      query += ` AND t.id = $${paramIndex}`;
      params.push(tag_id);
      paramIndex++;
    }

    if (media_type) {
      query += ` AND m.media_type = $${paramIndex}`;
      params.push(media_type);
      paramIndex++;
    }

    if (uploader_id) {
      query += ` AND m.uploader_id = $${paramIndex}`;
      params.push(uploader_id);
      paramIndex++;
    }

    if (start_date) {
      query += ` AND m.upload_time >= $${paramIndex}`;
      params.push(start_date);
      paramIndex++;
    }

    if (end_date) {
      query += ` AND m.upload_time <= $${paramIndex}`;
      params.push(end_date);
      paramIndex++;
    }

    query += ` GROUP BY m.id, u.username ORDER BY m.upload_time DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(Number(limit), offset);

    const result = await pool.query(query, params);

    // 获取总数
    let countQuery = `
      SELECT COUNT(DISTINCT m.id)
      FROM media m
      LEFT JOIN media_tags mt ON m.id = mt.media_id
      LEFT JOIN tags t ON mt.tag_id = t.id
      WHERE 1=1
    `;
    const countParams: any[] = [];
    let countParamIndex = 1;

    if (search) {
      countQuery += ` AND m.original_name ILIKE $${countParamIndex}`;
      countParams.push(`%${search}%`);
      countParamIndex++;
    }

    if (tag_id) {
      countQuery += ` AND t.id = $${countParamIndex}`;
      countParams.push(tag_id);
      countParamIndex++;
    }

    if (media_type) {
      countQuery += ` AND m.media_type = $${countParamIndex}`;
      countParams.push(media_type);
      countParamIndex++;
    }

    if (uploader_id) {
      countQuery += ` AND m.uploader_id = $${countParamIndex}`;
      countParams.push(uploader_id);
      countParamIndex++;
    }

    if (start_date) {
      countQuery += ` AND m.upload_time >= $${countParamIndex}`;
      countParams.push(start_date);
      countParamIndex++;
    }

    if (end_date) {
      countQuery += ` AND m.upload_time <= $${countParamIndex}`;
      countParams.push(end_date);
      countParamIndex++;
    }

    const countResult = await pool.query(countQuery, countParams);

    res.json({
      media: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: Number(page),
      limit: Number(limit),
    });
  } catch (error: any) {
    console.error('Get media error:', error);
    res.status(500).json({ error: '获取媒体列表失败' });
  }
});

// GET /api/v1/media/:id - 获取媒体详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT m.*, u.username as uploader_name,
        COALESCE(json_agg(DISTINCT jsonb_build_object(
          'id', t.id,
          'name', t.name,
          'color', t.color
        )) FILTER (WHERE t.id IS NOT NULL), '[]') as tags
      FROM media m
      LEFT JOIN users u ON m.uploader_id = u.id
      LEFT JOIN media_tags mt ON m.id = mt.media_id
      LEFT JOIN tags t ON mt.tag_id = t.id
      WHERE m.id = $1
      GROUP BY m.id, u.username
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '媒体不存在' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Get media detail error:', error);
    res.status(500).json({ error: '获取媒体详情失败' });
  }
});

// POST /api/v1/media/upload - 上传媒体
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请选择文件' });
    }

    const { originalname, mimetype, size, buffer } = req.file;
    const uploader_id = req.body.uploader_id ? parseInt(req.body.uploader_id) : 1;
    const description = req.body.description || '';
    const media_type = getMediaType(mimetype);

    // 检查是否是媒体类型
    const validTypes = ['photo', 'video'];
    if (!validTypes.includes(media_type)) {
      return res.status(400).json({ error: '仅支持上传照片和视频格式文件' });
    }

    // 生成文件名
    const mediaName = `${randomUUID()}.${originalname.split('.').pop()}`;

    // TODO: 上传到对象存储，这里暂时使用模拟URL
    const file_url = `https://example.com/media/${mediaName}`;
    const thumbnail_url = media_type === 'video'
      ? `https://example.com/media/thumbnails/${mediaName}.jpg`
      : file_url;

    // 解析宽高和时长（这里简化处理，实际应该使用库解析）
    const width = req.body.width ? parseInt(req.body.width) : null;
    const height = req.body.height ? parseInt(req.body.height) : null;
    const duration = media_type === 'video' && req.body.duration ? parseInt(req.body.duration) : null;

    // 保存媒体信息到数据库
    const result = await pool.query(
      `INSERT INTO media (media_name, media_type, original_name, file_size, file_url, thumbnail_url, width, height, duration, uploader_id, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [mediaName, media_type, originalname, size, file_url, thumbnail_url, width, height, duration, uploader_id, description]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('Upload media error:', error);
    res.status(500).json({ error: '媒体上传失败' });
  }
});

// POST /api/v1/media/:id/tags - 添加标签
router.post('/:id/tags', async (req, res) => {
  try {
    const { id } = req.params;
    const { tag_id } = req.body;

    // 检查媒体是否存在
    const mediaResult = await pool.query('SELECT * FROM media WHERE id = $1', [id]);
    if (mediaResult.rows.length === 0) {
      return res.status(404).json({ error: '媒体不存在' });
    }

    // 检查标签数量是否超过5个
    const tagCountResult = await pool.query(
      'SELECT COUNT(*) as count FROM media_tags WHERE media_id = $1',
      [id]
    );
    if (parseInt(tagCountResult.rows[0].count) >= 5) {
      return res.status(400).json({ error: '每个媒体最多只能添加5个标签' });
    }

    // 检查是否已经添加过该标签
    const existingResult = await pool.query(
      'SELECT * FROM media_tags WHERE media_id = $1 AND tag_id = $2',
      [id, tag_id]
    );
    if (existingResult.rows.length > 0) {
      return res.status(400).json({ error: '该标签已存在' });
    }

    // 添加标签关联
    await pool.query(
      'INSERT INTO media_tags (media_id, tag_id) VALUES ($1, $2)',
      [id, tag_id]
    );

    res.status(201).json({ message: '标签添加成功' });
  } catch (error: any) {
    console.error('Add tag error:', error);
    res.status(500).json({ error: '添加标签失败' });
  }
});

// DELETE /api/v1/media/:id/tags/:tagId - 删除标签
router.delete('/:id/tags/:tagId', async (req, res) => {
  try {
    const { id, tagId } = req.params;

    const result = await pool.query(
      'DELETE FROM media_tags WHERE media_id = $1 AND tag_id = $2',
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

// POST /api/v1/media/download/:id - 下载媒体（增加下载计数）
router.post('/download/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'UPDATE media SET download_count = download_count + 1 WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '媒体不存在' });
    }

    res.json({ message: '下载记录已更新', media: result.rows[0] });
  } catch (error: any) {
    console.error('Download media error:', error);
    res.status(500).json({ error: '下载媒体失败' });
  }
});

// DELETE /api/v1/media/batch - 批量删除媒体（仅管理员）
router.delete('/batch', async (req, res) => {
  try {
    const { ids, user_id } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: '请选择要删除的媒体' });
    }

    // 检查是否是管理员
    const admin = await isAdmin(user_id);
    if (!admin) {
      return res.status(403).json({ error: '只有管理员可以批量删除媒体' });
    }

    // 批量删除
    const result = await pool.query(
      'DELETE FROM media WHERE id = ANY($1) RETURNING *',
      [ids]
    );

    res.json({
      message: `成功删除${result.rowCount}个媒体`,
      deleted_count: result.rowCount,
    });
  } catch (error: any) {
    console.error('Batch delete error:', error);
    res.status(500).json({ error: '批量删除失败' });
  }
});

// GET /api/v1/media/uploaders - 获取所有上传者列表（用于筛选）
router.get('/uploaders/list', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT DISTINCT u.id, u.username, COUNT(m.id) as media_count
       FROM users u
       INNER JOIN media m ON u.id = m.uploader_id
       GROUP BY u.id, u.username
       ORDER BY u.username ASC`
    );

    res.json(result.rows);
  } catch (error: any) {
    console.error('Get uploaders error:', error);
    res.status(500).json({ error: '获取上传者列表失败' });
  }
});

// GET /api/v1/media/tags/list - 获取所有可用标签
router.get('/tags/list', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM tags ORDER BY name ASC'
    );

    // 获取每个标签的使用次数（针对媒体）
    const tags = await Promise.all(
      result.rows.map(async (tag) => {
        const countResult = await pool.query(
          'SELECT COUNT(*) as count FROM media_tags WHERE tag_id = $1',
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

export default router;
