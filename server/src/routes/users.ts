import express from 'express';
import bcrypt from 'bcryptjs';
import pool from '../database/db';

const router = express.Router();

// 登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const user = result.rows[0];

    // 简化：直接比较密码（实际应用应该使用 bcrypt）
    if (user.password !== password) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    // 不返回密码
    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取用户列表
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, name, role, created_at FROM users ORDER BY id'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 创建用户
router.post('/', async (req, res) => {
  try {
    const { username, password, name, role } = req.body;

    if (!username || !password || !name) {
      return res.status(400).json({ error: '缺少必填字段' });
    }

    const result = await pool.query(
      'INSERT INTO users (username, password, name, role) VALUES ($1, $2, $3, $4) RETURNING id, username, name, role, created_at',
      [username, password, name, role || 'staff']
    );

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Create user error:', error);
    if (error.code === '23505') {
      res.status(400).json({ error: '用户名已存在' });
    } else {
      res.status(500).json({ error: '服务器错误' });
    }
  }
});

// 更新用户
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, password } = req.body;

    let query = 'UPDATE users SET updated_at = CURRENT_TIMESTAMP';
    const values = [];
    let paramCount = 1;

    if (name) {
      query += `, name = $${paramCount}`;
      values.push(name);
      paramCount++;
    }

    if (role) {
      query += `, role = $${paramCount}`;
      values.push(role);
      paramCount++;
    }

    if (password) {
      query += `, password = $${paramCount}`;
      values.push(password);
      paramCount++;
    }

    query += ` WHERE id = $${paramCount} RETURNING id, username, name, role, created_at`;
    values.push(id);

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 删除用户
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

export default router;
