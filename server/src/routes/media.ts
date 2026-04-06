import express from 'express';
import multer from 'multer';
import pool from '../database/db';
import { randomUUID } from 'crypto';

const router = express.Router();

// 配置multer用于文件上传
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 200 * 1024 * 1024, // 200MB（视频最大限制）
    files: 5, // 最多5个文件
  },
});

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

// POST /api/v1/media/upload - 上传媒体（支持多文件上传，最多5个，照片不超过20MB，视频不超过200MB）
router.post('/upload', upload.array('files', 5), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({ error: '请选择文件' });
    }

    const uploader_id = req.body.uploader_id ? parseInt(req.body.uploader_id) : 1;
    const description = req.body.description || '';
    const results: any[] = [];

    // 批量处理文件
    for (const file of files) {
      const { originalname, mimetype, size, buffer } = file;
      const media_type = getMediaType(mimetype);

      // 检查是否是媒体类型
      const validTypes = ['photo', 'video'];
      if (!validTypes.includes(media_type)) {
        return res.status(400).json({
          error: `文件 ${originalname} 格式不支持，仅支持照片和视频格式文件`
        });
      }

      // 检查文件大小
      if (media_type === 'photo' && size > 20 * 1024 * 1024) {
        return res.status(400).json({
          error: `照片 ${originalname} 超过20MB限制，无法上传`
        });
      }

      if (media_type === 'video' && size > 200 * 1024 * 1024) {
        return res.status(400).json({
          error: `视频 ${originalname} 超过200MB限制，无法上传`
        });
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

      results.push(result.rows[0]);
    }

    res.status(201).json({
      message: `成功上传${results.length}个媒体文件`,
      media: results
    });
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

// PUT /api/v1/media/:id/tags - 批量更新媒体标签（替换所有标签）
router.put('/:id/tags', async (req, res) => {
  try {
    const { id } = req.params;
    const { tag_ids } = req.body;

    // 检查媒体是否存在
    const mediaResult = await pool.query('SELECT * FROM media WHERE id = $1', [id]);
    if (mediaResult.rows.length === 0) {
      return res.status(404).json({ error: '媒体不存在' });
    }

    // 检查标签数量不超过5个
    if (tag_ids && tag_ids.length > 5) {
      return res.status(400).json({ error: '每个媒体最多只能添加5个标签' });
    }

    // 先删除所有现有标签关联
    await pool.query('DELETE FROM media_tags WHERE media_id = $1', [id]);

    // 如果有新的标签，批量插入
    if (tag_ids && tag_ids.length > 0) {
      const values = tag_ids.map((tagId: number, index: number) => 
        `($1, $${index + 2})`
      ).join(', ');
      
      await pool.query(
        `INSERT INTO media_tags (media_id, tag_id) VALUES ${values}`,
        [id, ...tag_ids]
      );
    }

    // 返回更新后的媒体信息
    const updatedMedia = await pool.query(
      `SELECT m.*, u.username as uploader_name,
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
      GROUP BY m.id, u.username`,
      [id]
    );

    res.json({ message: '标签更新成功', media: updatedMedia.rows[0] });
  } catch (error: any) {
    console.error('Update tags error:', error);
    res.status(500).json({ error: '更新标签失败' });
  }
});

// POST /api/v1/media/tags - 创建新标签
router.post('/tags', async (req, res) => {
  try {
    const { name, color } = req.body;

    if (!name) {
      return res.status(400).json({ error: '标签名称不能为空' });
    }

    // 检查是否已存在同名标签
    const existing = await pool.query(
      'SELECT * FROM tags WHERE name = $1',
      [name]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: '标签已存在' });
    }

    const result = await pool.query(
      'INSERT INTO tags (name, color) VALUES ($1, $2) RETURNING *',
      [name, color || '#1E88E5']
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('Create tag error:', error);
    res.status(500).json({ error: '创建标签失败' });
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

// POST /api/v1/media/upload/initiate - 初始化分片上传
router.post('/upload/initiate', async (req, res) => {
  try {
    const { media_name, media_type, original_name, file_size, uploader_id, description, chunk_count, width, height, duration } = req.body;

    if (!media_name || !media_type || !file_size || !chunk_count) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    // 检查文件大小
    if (media_type === 'photo' && file_size > 20 * 1024 * 1024) {
      return res.status(400).json({ error: '照片大小超过20MB限制' });
    }

    if (media_type === 'video' && file_size > 200 * 1024 * 1024) {
      return res.status(400).json({ error: '视频大小超过200MB限制' });
    }

    // 检查是否是媒体类型
    const validTypes = ['photo', 'video'];
    if (!validTypes.includes(media_type)) {
      return res.status(400).json({ error: '媒体类型不支持，仅支持照片和视频' });
    }

    // 生成文件名和上传ID
    const uploadId = randomUUID();
    const fileName = `${randomUUID()}.${original_name.split('.').pop()}`;

    // 保存上传记录
    const result = await pool.query(
      `INSERT INTO media_uploads (upload_id, media_name, media_type, original_name, file_size, uploader_id, description, chunk_count, width, height, duration, status, uploaded_chunks)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'uploading', ARRAY[]::integer[])
       RETURNING *`,
      [uploadId, fileName, media_type, original_name, file_size, uploader_id || 1, description, chunk_count, width, height, duration]
    );

    res.status(201).json({
      upload_id: uploadId,
      media_name: fileName,
      chunk_count,
      message: '上传已初始化'
    });
  } catch (error: any) {
    console.error('Initiate upload error:', error);
    res.status(500).json({ error: '初始化上传失败' });
  }
});

// POST /api/v1/media/upload/chunk - 上传分片
router.post('/upload/chunk', upload.single('chunk'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请选择文件分片' });
    }

    const { upload_id, chunk_index } = req.body;
    const chunkData = req.file.buffer;

    // 查询上传记录
    const uploadResult = await pool.query(
      'SELECT * FROM media_uploads WHERE upload_id = $1',
      [upload_id]
    );

    if (uploadResult.rows.length === 0) {
      return res.status(404).json({ error: '上传记录不存在' });
    }

    const upload = uploadResult.rows[0];

    // 检查分片索引是否有效
    if (chunk_index < 0 || chunk_index >= upload.chunk_count) {
      return res.status(400).json({ error: '无效的分片索引' });
    }

    // 保存分片到临时目录
    const fs = await import('fs/promises');
    const path = await import('path');
    const tmpDir = '/tmp/media_chunks';
    await fs.mkdir(tmpDir, { recursive: true });
    const chunkPath = path.join(tmpDir, `${upload_id}_${chunk_index}`);
    await fs.writeFile(chunkPath, chunkData);

    // 更新已上传分片列表
    await pool.query(
      `UPDATE media_uploads
       SET uploaded_chunks = array_append(uploaded_chunks, $1)
       WHERE upload_id = $2`,
      [parseInt(chunk_index), upload_id]
    );

    res.json({
      message: '分片上传成功',
      chunk_index: parseInt(chunk_index),
      uploaded_chunks: [...upload.uploaded_chunks, parseInt(chunk_index)]
    });
  } catch (error: any) {
    console.error('Upload chunk error:', error);
    res.status(500).json({ error: '分片上传失败' });
  }
});

// POST /api/v1/media/upload/complete - 完成上传（合并分片）
router.post('/upload/complete', async (req, res) => {
  try {
    const { upload_id } = req.body;

    // 查询上传记录
    const uploadResult = await pool.query(
      'SELECT * FROM media_uploads WHERE upload_id = $1',
      [upload_id]
    );

    if (uploadResult.rows.length === 0) {
      return res.status(404).json({ error: '上传记录不存在' });
    }

    const upload = uploadResult.rows[0];

    // 检查所有分片是否已上传
    if (upload.uploaded_chunks.length !== upload.chunk_count) {
      return res.status(400).json({
        error: '还有分片未上传完成',
        uploaded: upload.uploaded_chunks.length,
        total: upload.chunk_count
      });
    }

    // 合并分片
    const fs = await import('fs/promises');
    const path = await import('path');
    const tmpDir = '/tmp/media_chunks';

    const chunks: Buffer[] = [];
    for (let i = 0; i < upload.chunk_count; i++) {
      const chunkPath = path.join(tmpDir, `${upload_id}_${i}`);
      const chunkData = await fs.readFile(chunkPath);
      chunks.push(chunkData);
      await fs.unlink(chunkPath); // 删除分片文件
    }

    const completeFile = Buffer.concat(chunks);

    // 生成最终文件URL
    const file_url = `https://example.com/media/${upload.media_name}`;
    const thumbnail_url = upload.media_type === 'video'
      ? `https://example.com/media/thumbnails/${upload.media_name}.jpg`
      : file_url;

    // 保存媒体信息到数据库
    const result = await pool.query(
      `INSERT INTO media (media_name, media_type, original_name, file_size, file_url, thumbnail_url, width, height, duration, uploader_id, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [upload.media_name, upload.media_type, upload.original_name, upload.file_size, file_url, thumbnail_url, upload.width, upload.height, upload.duration, upload.uploader_id, upload.description]
    );

    // 更新上传状态
    await pool.query(
      `UPDATE media_uploads SET status = 'completed', media_id = $1 WHERE upload_id = $2`,
      [result.rows[0].id, upload_id]
    );

    res.status(201).json({
      message: '媒体上传完成',
      media: result.rows[0]
    });
  } catch (error: any) {
    console.error('Complete upload error:', error);
    res.status(500).json({ error: '完成上传失败' });
  }
});

// GET /api/v1/media/upload/:uploadId - 查询上传状态
router.get('/upload/:uploadId', async (req, res) => {
  try {
    const { uploadId } = req.params;

    const result = await pool.query(
      'SELECT * FROM media_uploads WHERE upload_id = $1',
      [uploadId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '上传记录不存在' });
    }

    const upload = result.rows[0];

    res.json({
      upload_id: upload.upload_id,
      status: upload.status,
      uploaded_chunks: upload.uploaded_chunks,
      total_chunks: upload.chunk_count,
      progress: (upload.uploaded_chunks.length / upload.chunk_count * 100).toFixed(2)
    });
  } catch (error: any) {
    console.error('Get upload status error:', error);
    res.status(500).json({ error: '查询上传状态失败' });
  }
});

export default router;
