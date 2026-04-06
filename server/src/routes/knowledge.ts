import express from 'express';
import pool from '../database/db';

const router = express.Router();

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
router.post('/', async (req, res) => {
  try {
    const { title, category, content, tags, author_id } = req.body;

    if (!title || !content || !author_id) {
      return res.status(400).json({ error: '缺少必填字段' });
    }

    const result = await pool.query(
      'INSERT INTO knowledge (title, category, content, tags, author_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [title, category, content, tags, author_id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Create knowledge error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 更新知识
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, category, content, tags } = req.body;

    const result = await pool.query(
      'UPDATE knowledge SET title = $1, category = $2, content = $3, tags = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *',
      [title, category, content, tags, id]
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
