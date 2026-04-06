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

// POST /api/v1/files/upload - 上传文件（支持多文件上传，最多5个，每个不超过50MB）
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
      const file_type = getFileType(mimetype);

      // 检查文件大小
      if (size > 50 * 1024 * 1024) {
        return res.status(400).json({
          error: `文件 ${originalname} 超过50MB限制，无法上传`
        });
      }

      // 检查是否是文档类型
      const validTypes = ['excel', 'ppt', 'word', 'pdf'];
      if (!validTypes.includes(file_type)) {
        return res.status(400).json({
          error: `文件 ${originalname} 格式不支持，仅支持Excel、PPT、Word、PDF格式`
        });
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

      results.push(result.rows[0]);
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

// POST /api/v1/files/upload/initiate - 初始化分片上传
router.post('/upload/initiate', async (req, res) => {
  try {
    const { file_name, file_size, file_type, uploader_id, description, chunk_count } = req.body;

    if (!file_name || !file_size || !file_type || !chunk_count) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    // 检查文件大小
    if (file_size > 50 * 1024 * 1024) {
      return res.status(400).json({ error: '文件大小超过50MB限制' });
    }

    // 检查是否是文档类型
    const validTypes = ['excel', 'ppt', 'word', 'pdf'];
    if (!validTypes.includes(file_type)) {
      return res.status(400).json({ error: '文件格式不支持，仅支持Excel、PPT、Word、PDF格式' });
    }

    // 生成文件名和上传ID
    const uploadId = randomUUID();
    const fileName = `${randomUUID()}.${file_name.split('.').pop()}`;

    // 保存上传记录
    const result = await pool.query(
      `INSERT INTO file_uploads (upload_id, file_name, file_type, original_name, file_size, uploader_id, description, chunk_count, status, uploaded_chunks)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'uploading', ARRAY[]::integer[])
       RETURNING *`,
      [uploadId, fileName, file_type, file_name, file_size, uploader_id || 1, description, chunk_count]
    );

    res.status(201).json({
      upload_id: uploadId,
      file_name: fileName,
      chunk_count,
      message: '上传已初始化'
    });
  } catch (error: any) {
    console.error('Initiate upload error:', error);
    res.status(500).json({ error: '初始化上传失败' });
  }
});

// POST /api/v1/files/upload/chunk - 上传分片
router.post('/upload/chunk', upload.single('chunk'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请选择文件分片' });
    }

    const { upload_id, chunk_index } = req.body;
    const chunkData = req.file.buffer;

    // 查询上传记录
    const uploadResult = await pool.query(
      'SELECT * FROM file_uploads WHERE upload_id = $1',
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
    const tmpDir = '/tmp/file_chunks';
    await fs.mkdir(tmpDir, { recursive: true });
    const chunkPath = path.join(tmpDir, `${upload_id}_${chunk_index}`);
    await fs.writeFile(chunkPath, chunkData);

    // 更新已上传分片列表
    await pool.query(
      `UPDATE file_uploads
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

// POST /api/v1/files/upload/complete - 完成上传（合并分片）
router.post('/upload/complete', async (req, res) => {
  try {
    const { upload_id } = req.body;

    // 查询上传记录
    const uploadResult = await pool.query(
      'SELECT * FROM file_uploads WHERE upload_id = $1',
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
    const tmpDir = '/tmp/file_chunks';

    const chunks: Buffer[] = [];
    for (let i = 0; i < upload.chunk_count; i++) {
      const chunkPath = path.join(tmpDir, `${upload_id}_${i}`);
      const chunkData = await fs.readFile(chunkPath);
      chunks.push(chunkData);
      await fs.unlink(chunkPath); // 删除分片文件
    }

    const completeFile = Buffer.concat(chunks);

    // 生成最终文件URL
    const file_url = `https://example.com/files/${upload.file_name}`;

    // 保存文件信息到数据库
    const result = await pool.query(
      `INSERT INTO files (file_name, file_type, original_name, file_size, file_url, uploader_id, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [upload.file_name, upload.file_type, upload.original_name, upload.file_size, file_url, upload.uploader_id, upload.description]
    );

    // 更新上传状态
    await pool.query(
      `UPDATE file_uploads SET status = 'completed', file_id = $1 WHERE upload_id = $2`,
      [result.rows[0].id, upload_id]
    );

    res.status(201).json({
      message: '文件上传完成',
      file: result.rows[0]
    });
  } catch (error: any) {
    console.error('Complete upload error:', error);
    res.status(500).json({ error: '完成上传失败' });
  }
});

// GET /api/v1/files/upload/:uploadId - 查询上传状态
router.get('/upload/:uploadId', async (req, res) => {
  try {
    const { uploadId } = req.params;

    const result = await pool.query(
      'SELECT * FROM file_uploads WHERE upload_id = $1',
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
