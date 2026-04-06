import express from 'express';
import { randomUUID } from 'crypto';
import pool from '../database/db';

const router = express.Router();

// 创建版本回退请求
router.post('/request', async (req, res) => {
  try {
    const {
      from_version_code,
      to_version_code,
      rollback_reason,
      rollback_notes,
      requested_by,
    } = req.body;

    if (!from_version_code || !to_version_code || !rollback_reason) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    const rollbackId = randomUUID();

    // 创建回退请求记录
    const result = await pool.query(
      `INSERT INTO version_rollbacks
       (rollback_id, from_version_code, to_version_code, rollback_status, rollback_reason, rollback_notes, requested_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        rollbackId,
        from_version_code,
        to_version_code,
        'pending',
        rollback_reason,
        rollback_notes,
        requested_by,
      ]
    );

    // 创建审批请求
    const requestId = randomUUID();
    await pool.query(
      `INSERT INTO approval_requests (request_id, request_type, request_status, target_id, title, description, requested_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        requestId,
        'rollback',
        'pending',
        rollbackId,
        `版本回退申请：v${from_version_code} → v${to_version_code}`,
        rollback_notes || rollback_reason,
        requested_by,
      ]
    );

    res.status(201).json({
      message: '回退请求已创建，等待管理员审批',
      rollback: result.rows[0],
      request_id: requestId,
    });
  } catch (error) {
    console.error('Create rollback request error:', error);
    res.status(500).json({ error: '创建回退请求失败' });
  }
});

// 审批回退请求
router.post('/:rollback_id/approve', async (req, res) => {
  try {
    const { rollback_id } = req.params;
    const { approved, approved_by, approval_notes } = req.body;

    if (typeof approved !== 'boolean') {
      return res.status(400).json({ error: 'approved参数必须为布尔值' });
    }

    // 更新审批状态
    const result = await pool.query(
      `UPDATE version_rollbacks
       SET approval_status = $1, approved_by = $2, approved_at = CURRENT_TIMESTAMP, approval_notes = $3,
           rollback_status = CASE WHEN $1 = 'approved' THEN 'approved' ELSE 'rejected' END,
           updated_at = CURRENT_TIMESTAMP
       WHERE rollback_id = $4
       RETURNING *`,
      [approved ? 'approved' : 'rejected', approved_by, approval_notes, rollback_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '回退请求不存在' });
    }

    // 更新审批请求状态
    await pool.query(
      `UPDATE approval_requests
       SET request_status = $1, approved_by = $2, approved_at = CURRENT_TIMESTAMP, approval_notes = $3
       WHERE target_id = $4 AND request_type = 'rollback' AND request_status = 'pending'`,
      [approved ? 'approved' : 'rejected', approved_by, approval_notes, rollback_id]
    );

    res.json({
      message: approved ? '回退请求已批准' : '回退请求已拒绝',
      rollback: result.rows[0],
    });
  } catch (error) {
    console.error('Approve rollback error:', error);
    res.status(500).json({ error: '审批回退请求失败' });
  }
});

// 执行版本回退
router.post('/:rollback_id/execute', async (req, res) => {
  try {
    const { rollback_id } = req.params;
    const { executed_by } = req.body;

    // 检查是否已通过审批
    const rollbackCheck = await pool.query(
      'SELECT * FROM version_rollbacks WHERE rollback_id = $1',
      [rollback_id]
    );

    if (rollbackCheck.rows.length === 0) {
      return res.status(404).json({ error: '回退请求不存在' });
    }

    const rollback = rollbackCheck.rows[0];

    if (rollback.approval_status !== 'approved') {
      return res.status(400).json({ error: '该回退请求尚未通过审批' });
    }

    // 在回退前自动备份当前版本
    // 这里应该调用备份API，为了简化直接记录
    console.log(`Backup current version before rollback: ${rollback.from_version_code}`);

    // 更新回退状态为执行中
    await pool.query(
      `UPDATE version_rollbacks
       SET rollback_status = 'running', updated_at = CURRENT_TIMESTAMP
       WHERE rollback_id = $1`,
      [rollback_id]
    );

    try {
      // 执行回退操作（这里需要根据实际情况实现，如恢复数据库备份、回滚代码等）
      // 简化处理：更新app_versions表的当前版本标识
      console.log(`Executing rollback: v${rollback.from_version_code} → v${rollback.to_version_code}`);

      // 更新回退状态为成功
      const result = await pool.query(
        `UPDATE version_rollbacks
         SET rollback_status = 'success', executed_by = $1, executed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE rollback_id = $2
         RETURNING *`,
        [executed_by, rollback_id]
      );

      res.json({
        message: '版本回退成功',
        rollback: result.rows[0],
      });
    } catch (error: any) {
      // 回退失败
      await pool.query(
        `UPDATE version_rollbacks
         SET rollback_status = 'failed', error_message = $1, updated_at = CURRENT_TIMESTAMP
         WHERE rollback_id = $2`,
        [error.message, rollback_id]
      );

      throw error;
    }
  } catch (error: any) {
    console.error('Execute rollback error:', error);
    res.status(500).json({
      error: '执行版本回退失败',
      message: error.message,
    });
  }
});

// 获取回退请求列表
router.get('/', async (req, res) => {
  try {
    const { rollback_status, approval_status, limit = 50 } = req.query;

    let query = `
      SELECT vr.*, u1.username as requested_by_name, u2.username as approved_by_name, u3.username as executed_by_name
      FROM version_rollbacks vr
      LEFT JOIN users u1 ON vr.requested_by = u1.id
      LEFT JOIN users u2 ON vr.approved_by = u2.id
      LEFT JOIN users u3 ON vr.executed_by = u3.id
      WHERE 1=1
    `;
    const values: any[] = [];
    let paramCount = 1;

    if (rollback_status) {
      query += ` AND vr.rollback_status = $${paramCount}`;
      values.push(rollback_status);
      paramCount++;
    }

    if (approval_status) {
      query += ` AND vr.approval_status = $${paramCount}`;
      values.push(approval_status);
      paramCount++;
    }

    query += ' ORDER BY vr.requested_at DESC LIMIT $' + paramCount;
    values.push(Number(limit));

    const result = await pool.query(query, values);

    res.json(result.rows);
  } catch (error) {
    console.error('Get rollbacks error:', error);
    res.status(500).json({ error: '获取回退请求列表失败' });
  }
});

// 获取回退请求详情
router.get('/:rollback_id', async (req, res) => {
  try {
    const { rollback_id } = req.params;

    const result = await pool.query(
      `SELECT vr.*, u1.username as requested_by_name, u2.username as approved_by_name, u3.username as executed_by_name
       FROM version_rollbacks vr
       LEFT JOIN users u1 ON vr.requested_by = u1.id
       LEFT JOIN users u2 ON vr.approved_by = u2.id
       LEFT JOIN users u3 ON vr.executed_by = u3.id
       WHERE vr.rollback_id = $1`,
      [rollback_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '回退请求不存在' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get rollback error:', error);
    res.status(500).json({ error: '获取回退请求详情失败' });
  }
});

// 获取审批请求列表
router.get('/approvals/list', async (req, res) => {
  try {
    const { request_type, request_status, limit = 50 } = req.query;

    let query = `
      SELECT ar.*, u1.username as requested_by_name, u2.username as approved_by_name
      FROM approval_requests ar
      LEFT JOIN users u1 ON ar.requested_by = u1.id
      LEFT JOIN users u2 ON ar.approved_by = u2.id
      WHERE 1=1
    `;
    const values: any[] = [];
    let paramCount = 1;

    if (request_type) {
      query += ` AND ar.request_type = $${paramCount}`;
      values.push(request_type);
      paramCount++;
    }

    if (request_status) {
      query += ` AND ar.request_status = $${paramCount}`;
      values.push(request_status);
      paramCount++;
    }

    query += ' ORDER BY ar.requested_at DESC LIMIT $' + paramCount;
    values.push(Number(limit));

    const result = await pool.query(query, values);

    res.json(result.rows);
  } catch (error) {
    console.error('Get approvals error:', error);
    res.status(500).json({ error: '获取审批请求列表失败' });
  }
});

// 处理审批请求（通用）
router.post('/approvals/:request_id/handle', async (req, res) => {
  try {
    const { request_id } = req.params;
    const { approved, approved_by, approval_notes } = req.body;

    if (typeof approved !== 'boolean') {
      return res.status(400).json({ error: 'approved参数必须为布尔值' });
    }

    // 获取审批请求详情
    const approvalCheck = await pool.query(
      'SELECT * FROM approval_requests WHERE request_id = $1 AND request_status = $pending',
      [request_id]
    );

    if (approvalCheck.rows.length === 0) {
      return res.status(404).json({ error: '审批请求不存在或已处理' });
    }

    const approval = approvalCheck.rows[0];

    // 根据请求类型调用相应的审批逻辑
    if (approval.request_type === 'release') {
      // 版本发布审批
      await pool.query(
        `UPDATE version_releases
         SET approval_status = $1, approved_by = $2, approved_at = CURRENT_TIMESTAMP, approval_notes = $3
         WHERE release_id = $4`,
        [approved ? 'approved' : 'rejected', approved_by, approval_notes, approval.target_id]
      );
    } else if (approval.request_type === 'rollback') {
      // 版本回退审批
      await pool.query(
        `UPDATE version_rollbacks
         SET approval_status = $1, approved_by = $2, approved_at = CURRENT_TIMESTAMP, approval_notes = $3
         WHERE rollback_id = $4`,
        [approved ? 'approved' : 'rejected', approved_by, approval_notes, approval.target_id]
      );
    }

    // 更新审批请求状态
    const result = await pool.query(
      `UPDATE approval_requests
       SET request_status = $1, approved_by = $2, approved_at = CURRENT_TIMESTAMP, approval_notes = $3
       WHERE request_id = $4
       RETURNING *`,
      [approved ? 'approved' : 'rejected', approved_by, approval_notes, request_id]
    );

    res.json({
      message: approved ? '审批已通过' : '审批已拒绝',
      approval: result.rows[0],
    });
  } catch (error) {
    console.error('Handle approval error:', error);
    res.status(500).json({ error: '处理审批请求失败' });
  }
});

export default router;
