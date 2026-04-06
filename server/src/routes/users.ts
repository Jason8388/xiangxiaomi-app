import express from 'express';
import { randomUUID } from 'crypto';
import pool from '../database/db';
import { getUserByUsername, getActiveSessionCount, deactivateOldestSession, createSession } from '../database/memory-storage';

const router = express.Router();

// 使用内存存储（用于演示，数据库连接超时）
const USE_MEMORY_STORAGE = true;

// 登录
router.post('/login', async (req, res) => {
  try {
    const { username, password, device_id, device_info, ip_address } = req.body;

    let user: any;

    if (USE_MEMORY_STORAGE) {
      // 使用内存存储
      user = getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ error: '用户名或密码错误' });
      }

      // 验证密码
      if (user.password !== password) {
        return res.status(401).json({ error: '用户名或密码错误' });
      }
    } else {
      // 使用数据库（带重试机制）
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries) {
        try {
          const result = await pool.query(
            'SELECT * FROM users WHERE username = $1',
            [username]
          );

          if (result.rows.length === 0) {
            return res.status(401).json({ error: '用户名或密码错误' });
          }

          user = result.rows[0];

          // 验证密码
          if (user.password !== password) {
            return res.status(401).json({ error: '用户名或密码错误' });
          }
          break; // 成功，退出重试循环
        } catch (error: any) {
          console.error(`Login attempt ${retryCount + 1} error:`, error.message);

          // 检查是否是数据库连接错误
          if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.message.includes('Connection terminated')) {
            retryCount++;
            if (retryCount < maxRetries) {
              console.log(`Retrying login... (${retryCount}/${maxRetries})`);
              await new Promise(resolve => setTimeout(resolve, 2000 * retryCount));
              continue;
            }
          }

          // 重试次数用完或其他错误
          console.error('Login error:', error);
          return res.status(500).json({ error: '服务器错误，请稍后重试' });
        }
      }
    }

    // 检查账号是否被禁用
    if (user.is_disabled) {
      return res.status(403).json({
        error: '账号已被禁用，请联系管理员',
        disabled_reason: user.disabled_reason
      });
    }

    // 生成会话ID
    const sessionId = randomUUID();
    const deviceId = device_id || randomUUID();

    // 检查该用户的活跃会话数量（最多2个）
    const activeCount = getActiveSessionCount(user.id);

    // 如果已达到最大活跃会话数，删除最早的会话
    if (activeCount >= 2) {
      deactivateOldestSession(user.id);
    }

    // 创建新会话
    const session = createSession(user.id, sessionId, deviceId);

    // 不返回密码
    const { password: _, ...userWithoutPassword } = user;
    res.json({
      user: userWithoutPassword,
      session: session,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: '服务器错误，请稍后重试' });
  }
});

// 获取用户列表
router.get('/', async (req, res) => {
  try {
    const { role, department_id, is_disabled } = req.query;
    let query = `
      SELECT u.id, u.username, u.name, u.role, u.position, u.department_id, u.is_disabled,
             u.disabled_at, u.disabled_reason, d.name as department_name,
             u.created_at, u.updated_at
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE 1=1
    `;
    const values = [];
    let paramCount = 1;

    if (role) {
      query += ` AND u.role = $${paramCount}`;
      values.push(role);
      paramCount++;
    }

    if (department_id) {
      query += ` AND u.department_id = $${paramCount}`;
      values.push(department_id);
      paramCount++;
    }

    if (is_disabled !== undefined) {
      query += ` AND u.is_disabled = $${paramCount}`;
      values.push(is_disabled === 'true');
      paramCount++;
    }

    query += ' ORDER BY u.id';

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 创建用户
router.post('/', async (req, res) => {
  try {
    const { username, password, name, role, position, department_id } = req.body;

    if (!username || !password || !name) {
      return res.status(400).json({ error: '缺少必填字段' });
    }

    const result = await pool.query(
      'INSERT INTO users (username, password, name, role, position, department_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, username, name, role, position, department_id, created_at',
      [username, password, name, role || 'staff', position || null, department_id || null]
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
    const { name, role, password, position } = req.body;

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

    if (position !== undefined) {
      query += `, position = $${paramCount}`;
      values.push(position);
      paramCount++;
    }

    query += ` WHERE id = $${paramCount} RETURNING id, username, name, role, position, created_at`;
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

// 删除用户（仅用于测试，生产环境禁用）
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 检查是否尝试删除账号（生产环境不允许删除，只能禁用）
    const userResult = await pool.query('SELECT is_disabled FROM users WHERE id = $1', [id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }

    res.status(403).json({
      error: '不允许删除用户账号，如需停用账号请使用禁用功能'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 禁用/启用账号
router.patch('/:id/disable', async (req, res) => {
  try {
    const { id } = req.params;
    const { is_disabled, disabled_reason, operator_id } = req.body;

    if (typeof is_disabled !== 'boolean') {
      return res.status(400).json({ error: 'is_disabled参数必须为布尔值' });
    }

    // 如果要禁用账号，必须提供禁用原因
    if (is_disabled && !disabled_reason) {
      return res.status(400).json({ error: '禁用账号时必须提供禁用原因' });
    }

    let query = `
      UPDATE users
      SET is_disabled = $1,
          updated_at = CURRENT_TIMESTAMP
    `;
    const values = [is_disabled];
    let paramCount = 2;

    if (is_disabled) {
      query += `,
          disabled_at = CURRENT_TIMESTAMP,
          disabled_by = $${paramCount},
          disabled_reason = $${paramCount + 1}
      `;
      values.push(operator_id, disabled_reason);
      paramCount += 2;
    } else {
      // 启用账号时清空禁用相关字段
      query += `,
          disabled_at = NULL,
          disabled_by = NULL,
          disabled_reason = NULL
      `;
    }

    query += ` WHERE id = $${paramCount} RETURNING id, username, name, role, is_disabled, disabled_at, disabled_reason`;
    values.push(parseInt(id));

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }

    res.json({
      message: is_disabled ? '账号已禁用' : '账号已启用',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 修改员工岗位和部门
router.patch('/:id/position', async (req, res) => {
  try {
    const { id } = req.params;
    const { position, department_id, operator_id } = req.body;

    let query = 'UPDATE users SET updated_at = CURRENT_TIMESTAMP';
    const values = [];
    let paramCount = 1;

    if (position !== undefined) {
      query += `, position = $${paramCount}`;
      values.push(position);
      paramCount++;
    }

    if (department_id !== undefined) {
      // 验证部门是否存在
      const deptResult = await pool.query('SELECT id FROM departments WHERE id = $1', [department_id]);
      if (deptResult.rows.length === 0) {
        return res.status(400).json({ error: '部门不存在' });
      }
      query += `, department_id = $${paramCount}`;
      values.push(department_id);
      paramCount++;
    }

    if (paramCount === 1) {
      return res.status(400).json({ error: '请至少提供一个修改字段' });
    }

    query += ` WHERE id = $${paramCount} RETURNING id, username, name, position, department_id, updated_at`;
    values.push(id);

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }

    res.json({
      message: '岗位和部门信息已更新',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Update user position error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 管理员重置密码
router.post('/:id/reset-password', async (req, res) => {
  try {
    const { id } = req.params;
    const { new_password, operator_id } = req.body;

    if (!new_password) {
      return res.status(400).json({ error: '请提供新密码' });
    }

    if (new_password.length < 6) {
      return res.status(400).json({ error: '密码长度至少6位' });
    }

    // 更新密码
    const result = await pool.query(
      'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, username, name',
      [new_password, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }

    res.json({
      message: '密码重置成功',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取部门列表
router.get('/departments/list', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, code, description, parent_id, sort_order, is_disabled FROM departments ORDER BY sort_order, id'
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

export default router;
