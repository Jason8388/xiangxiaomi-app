import express from 'express';
import { randomUUID } from 'crypto';
import pool from '../database/db';

const router = express.Router();
const MAX_ACTIVE_SESSIONS = 2; // 每个账号最多允许的活跃会话数

// 创建会话
router.post('/create', async (req, res) => {
  try {
    const { user_id, device_id, device_info, ip_address } = req.body;

    if (!user_id || !device_id) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    // 生成会话ID
    const sessionId = randomUUID();

    // 检查该用户的活跃会话数量
    const activeSessionsResult = await pool.query(
      'SELECT COUNT(*) as count FROM sessions WHERE user_id = $1 AND is_active = TRUE',
      [user_id]
    );
    const activeCount = parseInt(activeSessionsResult.rows[0].count);

    // 如果已达到最大活跃会话数，删除最早的会话
    if (activeCount >= MAX_ACTIVE_SESSIONS) {
      await pool.query(
        `UPDATE sessions
         SET is_active = FALSE,
             logout_time = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP
         WHERE id IN (
           SELECT id FROM sessions
           WHERE user_id = $1 AND is_active = TRUE
           ORDER BY login_time ASC
           LIMIT 1
         )`,
        [user_id]
      );
    }

    // 创建新会话
    const result = await pool.query(
      `INSERT INTO sessions (user_id, session_id, device_id, device_info, ip_address, login_time, last_active_time, is_active)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, TRUE)
       RETURNING *`,
      [user_id, sessionId, device_id, device_info, ip_address]
    );

    res.status(201).json({
      message: '会话创建成功',
      session: result.rows[0],
    });
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({ error: '创建会话失败' });
  }
});

// 检查会话状态
router.get('/check/:session_id', async (req, res) => {
  try {
    const { session_id } = req.params;

    const result = await pool.query(
      'SELECT * FROM sessions WHERE session_id = $1 AND is_active = TRUE',
      [session_id]
    );

    if (result.rows.length === 0) {
      return res.json({
        is_valid: false,
        message: '会话已失效，请重新登录',
      });
    }

    // 更新最后活跃时间
    await pool.query(
      'UPDATE sessions SET last_active_time = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [result.rows[0].id]
    );

    res.json({
      is_valid: true,
      session: result.rows[0],
    });
  } catch (error) {
    console.error('Check session error:', error);
    res.status(500).json({ error: '检查会话失败' });
  }
});

// 注销会话
router.post('/logout/:session_id', async (req, res) => {
  try {
    const { session_id } = req.params;

    const result = await pool.query(
      `UPDATE sessions
       SET is_active = FALSE,
           logout_time = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE session_id = $1
       RETURNING *`,
      [session_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '会话不存在' });
    }

    res.json({
      message: '会话已注销',
    });
  } catch (error) {
    console.error('Logout session error:', error);
    res.status(500).json({ error: '注销会话失败' });
  }
});

// 注销用户的所有会话
router.post('/logout-all/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;

    await pool.query(
      `UPDATE sessions
       SET is_active = FALSE,
           logout_time = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $1 AND is_active = TRUE`,
      [user_id]
    );

    res.json({
      message: '所有会话已注销',
    });
  } catch (error) {
    console.error('Logout all sessions error:', error);
    res.status(500).json({ error: '注销所有会话失败' });
  }
});

// 获取用户的所有活跃会话
router.get('/active/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;

    const result = await pool.query(
      `SELECT * FROM sessions
       WHERE user_id = $1 AND is_active = TRUE
       ORDER BY last_active_time DESC`,
      [user_id]
    );

    res.json({
      sessions: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error('Get active sessions error:', error);
    res.status(500).json({ error: '获取活跃会话失败' });
  }
});

// 清理过期会话（超过24小时未活跃）
router.post('/cleanup', async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE sessions
       SET is_active = FALSE,
           logout_time = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE is_active = TRUE
         AND last_active_time < NOW() - INTERVAL '24 hours'
       RETURNING *`
    );

    res.json({
      message: `清理了 ${result.rows.length} 个过期会话`,
      cleaned_count: result.rows.length,
    });
  } catch (error) {
    console.error('Cleanup sessions error:', error);
    res.status(500).json({ error: '清理过期会话失败' });
  }
});

export default router;
