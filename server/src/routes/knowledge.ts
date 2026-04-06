import express from 'express';
import multer from 'multer';
import pool from '../database/db';

const router = express.Router();

// 配置文件上传
const storage = multer.memoryStorage();
const upload = multer({ storage });

// 获取知识库列表
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT k.*, u.name as author_name FROM knowledge k LEFT JOIN users u ON k.author_id = u.id ORDER BY k.id DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get knowledge error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取知识库详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 增加浏览次数
    await pool.query('UPDATE knowledge SET views = views + 1 WHERE id = $1', [id]);

    const result = await pool.query(
      'SELECT k.*, u.name as author_name FROM knowledge k LEFT JOIN users u ON k.author_id = u.id WHERE k.id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '知识不存在' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get knowledge detail error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 搜索知识库
router.get('/search/:keyword', async (req, res) => {
  try {
    const { keyword } = req.params;
    const result = await pool.query(
      "SELECT k.*, u.name as author_name FROM knowledge k LEFT JOIN users u ON k.author_id = u.id WHERE k.title ILIKE $1 OR k.content ILIKE $1 OR $1 = ANY(k.tags) ORDER BY k.id DESC",
      [`%${keyword}%`]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Search knowledge error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 创建知识
router.post('/', upload.fields([
  { name: 'attachment_0', maxCount: 1 },
  { name: 'attachment_1', maxCount: 1 },
  { name: 'attachment_2', maxCount: 1 },
  { name: 'attachment_3', maxCount: 1 },
  { name: 'attachment_4', maxCount: 1 },
  { name: 'attachment_5', maxCount: 1 },
  { name: 'attachment_6', maxCount: 1 },
  { name: 'attachment_7', maxCount: 1 },
  { name: 'attachment_8', maxCount: 1 },
  { name: 'attachment_9', maxCount: 1 },
]), async (req, res) => {
  try {
    const files = req.files as any;
    const { title, content, tags, creator_name, creator_id } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: '缺少必填字段' });
    }

    // 处理附件
    const attachments: string[] = [];
    if (files) {
      Object.keys(files).forEach((key) => {
        if (files[key] && files[key][0]) {
          const fileBuffer = files[key][0].buffer;
          attachments.push(`data:${files[key][0].mimetype};base64,${fileBuffer.toString('base64')}`);
        }
      });
    }

    const tagsArray = tags ? JSON.parse(tags) : [];

    const result = await pool.query(
      'INSERT INTO knowledge (title, content, tags, author_id, author_name, attachments) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [title, content, tagsArray, creator_id || null, creator_name || null, JSON.stringify(attachments)]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Create knowledge error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 更新知识
router.put('/:id', upload.fields([
  { name: 'attachment_0', maxCount: 1 },
  { name: 'attachment_1', maxCount: 1 },
  { name: 'attachment_2', maxCount: 1 },
  { name: 'attachment_3', maxCount: 1 },
  { name: 'attachment_4', maxCount: 1 },
  { name: 'attachment_5', maxCount: 1 },
  { name: 'attachment_6', maxCount: 1 },
  { name: 'attachment_7', maxCount: 1 },
  { name: 'attachment_8', maxCount: 1 },
  { name: 'attachment_9', maxCount: 1 },
]), async (req, res) => {
  try {
    const { id } = req.params;
    const files = req.files as any;
    const { title, content, tags, creator_name, creator_id } = req.body;

    // 处理附件
    const attachments: string[] = [];
    if (files) {
      Object.keys(files).forEach((key) => {
        if (files[key] && files[key][0]) {
          const fileBuffer = files[key][0].buffer;
          attachments.push(`data:${files[key][0].mimetype};base64,${fileBuffer.toString('base64')}`);
        }
      });
    }

    const tagsArray = tags ? JSON.parse(tags) : [];

    const result = await pool.query(
      'UPDATE knowledge SET title = $1, content = $2, tags = $3, author_id = $4, author_name = $5, attachments = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7 RETURNING *',
      [title, content, tagsArray, creator_id || null, creator_name || null, JSON.stringify(attachments), id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '知识不存在' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update knowledge error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 删除知识
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM knowledge WHERE id = $1', [id]);
    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('Delete knowledge error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

export default router;
