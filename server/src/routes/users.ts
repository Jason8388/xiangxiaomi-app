import express from 'express';
import multer from 'multer';
import { randomUUID } from 'crypto';
import pool, { USE_DATABASE } from '../database/db';
import { getUserByUsername, getActiveSessionCount, deactivateOldestSession, createSession, memoryUsers, memoryUsersArray, memoryUsersList } from '../database/memory-storage';
import { uploadFileToOSS } from '../utils/oss';

const router = express.Router();

// 配置文件上传
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 限制5MB
  },
});

// 使用内存存储（用于演示，数据库连接超时）
const USE_MEMORY_STORAGE = true;

// 带重试的查询函数（快速失败，最多重试1次）
async function queryWithRetry(query: string, params: any[] = [], retries = 1, delay = 300) {
  for (let i = 0; i < retries; i++) {
    try {
      return await pool.query(query, params);
    } catch (error: any) {
      console.log(`Query attempt ${i + 1} failed:`, error.message);
      if (i < retries - 1 && (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.message.includes('timeout') || error.message.includes('terminated'))) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries reached');
}

// 登录
router.post('/login', async (req, res) => {
  try {
    const { username, password, phone, device_id, device_info, ip_address } = req.body;

    // 支持用户名或手机号登录
    const loginId = username || phone;
    
    if (!loginId || !password) {
      return res.status(400).json({ error: '请输入用户名/手机号和密码' });
    }

    let user: any;

    if (USE_MEMORY_STORAGE) {
      // 使用内存存储
      // 先按用户名查找
      user = getUserByUsername(loginId);
      // 如果没找到，按手机号查找
      if (!user) {
        user = Object.values(memoryUsers).find((u: any) => u.phone === loginId);
      }
      
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
          // 支持用户名或手机号登录
          const result = await pool.query(
            'SELECT * FROM users WHERE username = $1 OR phone = $1',
            [loginId]
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

// 获取当前用户资料（需要session验证）
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '未登录或登录已过期' });
    }

    const sessionId = authHeader.substring(7);
    
    // 从内存存储中查找session
    const { memorySessions } = await import('../database/memory-storage');
    const session = memorySessions.find((s: any) => s.session_id === sessionId && s.is_active);
    
    if (!session) {
      return res.status(401).json({ error: '会话无效或已过期' });
    }

    // 查找用户
    const user = memoryUsersList.find((u: any) => u.id === session.user_id);
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    // 不返回密码
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 更新当前用户资料
router.put('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '未登录或登录已过期' });
    }

    const sessionId = authHeader.substring(7);
    
    // 从内存存储中查找session
    const { memorySessions } = await import('../database/memory-storage');
    const session = memorySessions.find((s: any) => s.session_id === sessionId && s.is_active);
    
    if (!session) {
      return res.status(401).json({ error: '会话无效或已过期' });
    }

    const { name, signature, old_password, new_password } = req.body;
    const userId = session.user_id;

    // 查找用户
    const userIndex = memoryUsersList.findIndex((u: any) => u.id === userId);
    if (userIndex === -1) {
      return res.status(404).json({ error: '用户不存在' });
    }

    // 如果要修改密码
    if (new_password) {
      if (!old_password) {
        return res.status(400).json({ error: '请输入原密码' });
      }
      if (memoryUsersList[userIndex].password !== old_password) {
        return res.status(400).json({ error: '原密码错误' });
      }
      if (new_password.length < 6) {
        return res.status(400).json({ error: '新密码长度不能少于6位' });
      }
      memoryUsersList[userIndex].password = new_password;
    }

    // 更新其他字段
    if (name !== undefined) {
      memoryUsersList[userIndex].name = name;
    }
    if (signature !== undefined) {
      memoryUsersList[userIndex].signature = signature;
    }
    memoryUsersList[userIndex].updated_at = new Date().toISOString();

    // 同时更新所有内存中的用户列表
    const updateInAllLists = (list: any[]) => {
      const idx = list.findIndex(u => u.id === userId);
      if (idx !== -1) {
        if (name !== undefined) list[idx].name = name;
        if (signature !== undefined) list[idx].signature = signature;
        if (new_password) list[idx].password = new_password;
      }
    };
    updateInAllLists(memoryUsersList);
    updateInAllLists(memoryUsersArray);

    // 不返回密码
    const { password: _, ...userWithoutPassword } = memoryUsersList[userIndex];
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Update user profile error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 上传用户头像
router.post('/me/avatar', upload.single('avatar'), async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '未登录或登录已过期' });
    }

    const sessionId = authHeader.substring(7);
    
    // 从内存存储中查找session
    const { memorySessions } = await import('../database/memory-storage');
    const session = memorySessions.find((s: any) => s.session_id === sessionId && s.is_active);
    
    if (!session) {
      return res.status(401).json({ error: '会话无效或已过期' });
    }

    if (!req.file) {
      return res.status(400).json({ error: '请选择要上传的头像图片' });
    }

    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({ error: '仅支持 JPG、PNG、GIF、WebP 格式的图片' });
    }

    // 上传到 OSS
    const ossUrl = await uploadFileToOSS(req.file.buffer, req.file.originalname, req.file.mimetype);

    // 更新用户头像
    const userIndex = memoryUsersList.findIndex((u: any) => u.id === session.user_id);
    if (userIndex !== -1) {
      memoryUsersList[userIndex].avatar = ossUrl;
      memoryUsersList[userIndex].updated_at = new Date().toISOString();

      // 同时更新所有内存中的用户列表
      const updateAvatar = (list: any[]) => {
        const idx = list.findIndex(u => u.id === session.user_id);
        if (idx !== -1) {
          list[idx].avatar = ossUrl;
        }
      };
      updateAvatar(memoryUsersList);
      updateAvatar(memoryUsersArray);
    }

    res.json({
      success: true,
      avatar: ossUrl,
      message: '头像上传成功'
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取用户列表
router.get('/', async (req, res) => {
  const { role, department_id, is_disabled } = req.query;
  
  // 直接使用内存数据，避免数据库连接超时
  let users = [...memoryUsersList];
  
  if (role) {
    users = users.filter(u => u.role === role);
  }
  if (department_id) {
    users = users.filter(u => u.department_id === parseInt(department_id as string));
  }
  if (is_disabled !== undefined) {
    users = users.filter(u => u.is_disabled === (is_disabled === 'true'));
  }
  
  return res.json(users);
});

// 创建用户
router.post('/', async (req, res) => {
  try {
    const { username, password, name, role, position, phone, department_id, department_name } = req.body;

    if (!username || !password || !name) {
      return res.status(400).json({ error: '缺少必填字段' });
    }

    try {
      const result = await queryWithRetry(
        'INSERT INTO users (username, password, name, role, position, phone, department_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, username, name, role, position, phone, department_id, created_at',
        [username, password, name, role || 'staff', position || null, phone || null, department_id || null]
      );
      res.json(result.rows[0]);
    } catch (dbError: any) {
      console.error('Database error, using memory storage:', dbError.message);
      // 检查是否已存在（同时检查 memoryUsersList 和 memoryUsers）
      const userExists = memoryUsersList.find(u => u.username === username) ||
        Object.values(memoryUsers).find((u: any) => u.username === username);
      if (userExists) {
        return res.status(400).json({ error: '用户名已存在' });
      }
      // 生成新ID（取当前最大ID+1）
      const maxId = Math.max(
        ...memoryUsersList.map(u => u.id),
        ...Object.values(memoryUsers).map((u: any) => u.id)
      );
      const newUser = {
        id: maxId + 1,
        username,
        password,
        name,
        role: role || 'staff',
        position: position || null,
        phone: phone || null,
        department_id: department_id || null,
        department_name: department_name || null,
        is_disabled: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      // 添加到 memoryUsersList（全局共享的内存存储）
      memoryUsersList.push(newUser);
      res.json(newUser);
    }
  } catch (error: any) {
    console.error('Create user error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 更新用户
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, password, position, phone, department_id } = req.body;

    // 使用内存存储模式
    if (!USE_DATABASE) {
      const userIndex = memoryUsersList.findIndex((u: any) => u.id === parseInt(id));
      if (userIndex === -1) {
        return res.status(404).json({ error: '用户不存在' });
      }

      // 更新字段
      if (name) memoryUsersList[userIndex].name = name;
      if (role) memoryUsersList[userIndex].role = role;
      if (password) memoryUsersList[userIndex].password = password;
      if (position !== undefined) memoryUsersList[userIndex].position = position;
      if (phone !== undefined) memoryUsersList[userIndex].phone = phone;
      if (department_id !== undefined) memoryUsersList[userIndex].department_id = department_id;
      memoryUsersList[userIndex].updated_at = new Date().toISOString();

      // 同时更新所有内存中的用户列表
      const updateInAllLists = (list: any[]) => {
        const idx = list.findIndex(u => u.id === parseInt(id));
        if (idx !== -1) {
          if (name) list[idx].name = name;
          if (role) list[idx].role = role;
          if (password) list[idx].password = password;
          if (position !== undefined) list[idx].position = position;
          if (phone !== undefined) list[idx].phone = phone;
          if (department_id !== undefined) list[idx].department_id = department_id;
        }
      };
      updateInAllLists(memoryUsersArray);

      // 返回更新后的用户（不包含密码）
      const { password: _, ...userWithoutPassword } = memoryUsersList[userIndex];
      return res.json(userWithoutPassword);
    }

    // 数据库模式
    let query = 'UPDATE users SET updated_at = CURRENT_TIMESTAMP';
    const values: any[] = [];
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

    if (phone !== undefined) {
      query += `, phone = $${paramCount}`;
      values.push(phone);
      paramCount++;
    }

    if (department_id !== undefined) {
      query += `, department_id = $${paramCount}`;
      values.push(department_id);
      paramCount++;
    }

    query += ` WHERE id = $${paramCount} RETURNING id, username, name, role, position, phone, department_id, created_at`;
    values.push(parseInt(id));

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

    if (USE_MEMORY_STORAGE) {
      // 使用内存存储
      // 优先从 memoryUsersList 数组中查找（新增的用户可能只在这里）
      let user = memoryUsersList.find((u: any) =>
        String(u.id) === id || u.username === id || u.name === id
      );

      // 如果没找到，尝试从 memoryUsers 对象中查找
      if (!user) {
        user = memoryUsers[id];
        // 尝试用数字 key 查找
        if (!user && !isNaN(parseInt(id))) {
          user = memoryUsers[parseInt(id)];
        }
        // 如果还没找到，遍历查找
        if (!user) {
          user = Object.values(memoryUsers).find((u: any) =>
            String(u.id) === id || u.username === id
          );
        }
      }

      if (!user) {
        return res.status(404).json({ error: '用户不存在' });
      }

      // 从内存存储中删除
      // 先尝试从 memoryUsersList 中移除
      const listIndex = memoryUsersList.findIndex((u: any) => String(u.id) === String(user!.id));
      if (listIndex !== -1) {
        memoryUsersList.splice(listIndex, 1);
      }
      // 再尝试从 memoryUsers 中移除
      const keys = Object.keys(memoryUsers);
      for (const key of keys) {
        if (memoryUsers[key].id === user.id) {
          delete memoryUsers[key];
          break;
        }
      }
      res.json({ success: true, message: `员工 ${user.name} 已删除` });
    } else {
      // 使用数据库
      try {
        // 将id转换为整数
        const numericId = parseInt(id, 10);
        if (isNaN(numericId)) {
          return res.status(400).json({ error: '无效的用户ID' });
        }
        
        // 检查用户是否存在
        const userResult = await queryWithRetry('SELECT id, name FROM users WHERE id = $1 OR username = $1', [numericId]);
        if (userResult.rows.length === 0) {
          return res.status(404).json({ error: '用户不存在' });
        }

        const userName = userResult.rows[0].name;

        // 执行删除操作
        await queryWithRetry('DELETE FROM users WHERE id = $1', [numericId]);

        res.json({ success: true, message: `员工 ${userName} 已删除` });
      } catch (dbError: any) {
        console.error('Database delete failed, falling back to memory storage:', dbError.message);
        // 如果数据库失败，使用内存存储 - 优先使用memoryUsersList数组
        let user = memoryUsersList.find((u: any) => 
          String(u.id) === id || u.username === id || u.name === id
        );
        
        // 如果找不到，尝试从memoryUsers对象中查找
        if (!user) {
          const memoryUser = memoryUsers[id];
          if (!memoryUser && !isNaN(parseInt(id))) {
            const parsedId = parseInt(id);
            user = memoryUsersList.find((u: any) => String(u.id) === String(parsedId));
          }
          if (!user) {
            user = Object.values(memoryUsers).find((u: any) => 
              String(u.id) === id || u.username === id || u.name === id
            );
          }
        }
        
        if (!user) {
          return res.status(404).json({ error: '用户不存在' });
        }
        
        // 从memoryUsersList中移除
        const index = memoryUsersList.findIndex((u: any) => String(u.id) === String(user!.id));
        if (index !== -1) {
          memoryUsersList.splice(index, 1);
        }
        // 从memoryUsers对象中移除
        const keys = Object.keys(memoryUsers);
        for (const key of keys) {
          if (memoryUsers[key].id === user.id) {
            delete memoryUsers[key];
            break;
          }
        }
        res.json({ success: true, message: `员工 ${user.name} 已删除` });
      }
    }
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

    if (USE_MEMORY_STORAGE) {
      // 使用内存存储
      // 优先从 memoryUsersList 数组中查找（新增的用户可能只在这里）
      let user = memoryUsersList.find((u: any) =>
        String(u.id) === id || u.username === id || u.name === id
      );

      // 如果没找到，尝试从 memoryUsers 对象中查找
      if (!user) {
        user = memoryUsers[id];
        // 尝试用数字 key 查找
        if (!user && !isNaN(parseInt(id))) {
          user = memoryUsers[parseInt(id)];
        }
        // 如果还没找到，遍历查找
        if (!user) {
          user = Object.values(memoryUsers).find((u: any) =>
            String(u.id) === id || u.username === id
          );
        }
      }

      if (!user) {
        return res.status(404).json({ error: '用户不存在' });
      }

      // 更新用户状态
      user.is_disabled = is_disabled;
      if (is_disabled) {
        user.disabled_at = new Date().toISOString();
        user.disabled_by = operator_id;
        user.disabled_reason = disabled_reason;
      } else {
        user.disabled_at = null;
        user.disabled_by = null;
        user.disabled_reason = null;
      }
      user.updated_at = new Date().toISOString();

      // 同步更新 memoryUsersList 中的对应记录
      const listIndex = memoryUsersList.findIndex((u: any) => String(u.id) === String(user!.id));
      if (listIndex !== -1) {
        memoryUsersList[listIndex] = user;
      }

      // 同步更新 memoryUsers 中的对应记录
      const keys = Object.keys(memoryUsers);
      for (const key of keys) {
        if (memoryUsers[key].id === user.id) {
          memoryUsers[key] = user;
          break;
        }
      }

      res.json({
        message: is_disabled ? '账号已禁用' : '账号已启用',
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
          is_disabled: user.is_disabled,
          disabled_at: user.disabled_at,
          disabled_reason: user.disabled_reason
        }
      });
    } else {
      // 使用数据库
      let query = `
        UPDATE users
        SET is_disabled = $1,
            updated_at = CURRENT_TIMESTAMP
      `;
      const values: any[] = [is_disabled];
      let paramCount: number = 2;

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
    }
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
