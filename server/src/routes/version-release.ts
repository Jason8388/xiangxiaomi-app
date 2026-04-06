import express from 'express';
import { randomUUID } from 'crypto';
import pool from '../database/db';

const router = express.Router();

// 创建版本发布请求
router.post('/create', async (req, res) => {
  try {
    const {
      version_code,
      version_name,
      version_title,
      description,
      download_url,
      created_by,
    } = req.body;

    if (!version_code || !version_name || !version_title) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    const releaseId = randomUUID();

    // 创建版本发布记录
    const result = await pool.query(
      `INSERT INTO version_releases
       (release_id, version_code, version_name, version_title, description, download_url,
        release_status, functionality_test_result, performance_test_result, compatibility_test_result,
        approval_status, published_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        releaseId,
        version_code,
        version_name,
        version_title,
        description,
        download_url,
        'testing', // 初始状态：测试中
        'pending', // 功能测试待测试
        'pending', // 性能测试待测试
        'pending', // 兼容性测试待测试
        'pending', // 审批待审批
        created_by,
      ]
    );

    res.status(201).json({
      message: '版本发布请求已创建',
      release: result.rows[0],
    });
  } catch (error) {
    console.error('Create release error:', error);
    res.status(500).json({ error: '创建版本发布请求失败' });
  }
});

// 提交测试结果
router.patch('/:release_id/tests', async (req, res) => {
  try {
    const { release_id } = req.params;
    const {
      functionality_test_result,
      performance_test_result,
      compatibility_test_result,
      test_notes,
    } = req.body;

    // 检查所有测试是否都通过
    const allPassed =
      (functionality_test_result || 'fail') === 'pass' &&
      (performance_test_result || 'fail') === 'pass' &&
      (compatibility_test_result || 'fail') === 'pass';

    // 更新测试结果
    const result = await pool.query(
      `UPDATE version_releases
       SET functionality_test_result = COALESCE($1, functionality_test_result),
           performance_test_result = COALESCE($2, performance_test_result),
           compatibility_test_result = COALESCE($3, compatibility_test_result),
           test_notes = COALESCE($4, test_notes),
           release_status = $5,
           updated_at = CURRENT_TIMESTAMP
       WHERE release_id = $6
       RETURNING *`,
      [
        functionality_test_result,
        performance_test_result,
        compatibility_test_result,
        test_notes,
        allPassed ? 'reviewing' : 'testing',
        release_id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '版本发布记录不存在' });
    }

    res.json({
      message: '测试结果已提交',
      release: result.rows[0],
    });
  } catch (error) {
    console.error('Submit test results error:', error);
    res.status(500).json({ error: '提交测试结果失败' });
  }
});

// 申请发布（提交审批）
router.post('/:release_id/apply', async (req, res) => {
  try {
    const { release_id } = req.params;
    const { applicant_id, notes } = req.body;

    // 检查测试是否全部通过
    const releaseCheck = await pool.query(
      'SELECT * FROM version_releases WHERE release_id = $1',
      [release_id]
    );

    if (releaseCheck.rows.length === 0) {
      return res.status(404).json({ error: '版本发布记录不存在' });
    }

    const release = releaseCheck.rows[0];

    if (
      release.functionality_test_result !== 'pass' ||
      release.performance_test_result !== 'pass' ||
      release.compatibility_test_result !== 'pass'
    ) {
      return res.status(400).json({
        error: '所有测试必须通过后才能申请发布',
        test_results: {
          functionality: release.functionality_test_result,
          performance: release.performance_test_result,
          compatibility: release.compatibility_test_result,
        },
      });
    }

    // 更新发布状态为待审批
    await pool.query(
      `UPDATE version_releases
       SET release_status = 'reviewing', approval_status = 'pending', updated_at = CURRENT_TIMESTAMP
       WHERE release_id = $1`,
      [release_id]
    );

    // 创建审批请求
    const requestId = randomUUID();
    await pool.query(
      `INSERT INTO approval_requests (request_id, request_type, request_status, target_id, title, description, requested_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        requestId,
        'release',
        'pending',
        release_id,
        `版本 ${release.version_name} 发布申请`,
        notes || `版本 ${release.version_name} 已通过所有测试，申请发布`,
        applicant_id,
      ]
    );

    res.json({
      message: '发布申请已提交，等待管理员审批',
      request_id: requestId,
    });
  } catch (error) {
    console.error('Apply for release error:', error);
    res.status(500).json({ error: '提交发布申请失败' });
  }
});

// 审批发布申请
router.post('/:release_id/approve', async (req, res) => {
  try {
    const { release_id } = req.params;
    const { approved, approved_by, approval_notes } = req.body;

    if (typeof approved !== 'boolean') {
      return res.status(400).json({ error: 'approved参数必须为布尔值' });
    }

    // 更新审批状态
    const result = await pool.query(
      `UPDATE version_releases
       SET approval_status = $1, approved_by = $2, approved_at = CURRENT_TIMESTAMP, approval_notes = $3,
           release_status = CASE WHEN $1 = 'approved' THEN 'approved' ELSE 'rejected' END,
           updated_at = CURRENT_TIMESTAMP
       WHERE release_id = $4
       RETURNING *`,
      [approved ? 'approved' : 'rejected', approved_by, approval_notes, release_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '版本发布记录不存在' });
    }

    // 更新审批请求状态
    await pool.query(
      `UPDATE approval_requests
       SET request_status = $1, approved_by = $2, approved_at = CURRENT_TIMESTAMP, approval_notes = $3
       WHERE target_id = $4 AND request_type = 'release' AND request_status = 'pending'`,
      [approved ? 'approved' : 'rejected', approved_by, approval_notes, release_id]
    );

    res.json({
      message: approved ? '发布申请已批准' : '发布申请已拒绝',
      release: result.rows[0],
    });
  } catch (error) {
    console.error('Approve release error:', error);
    res.status(500).json({ error: '审批发布申请失败' });
  }
});

// 发布版本
router.post('/:release_id/publish', async (req, res) => {
  try {
    const { release_id } = req.params;
    const { published_by } = req.body;

    // 检查是否已通过审批
    const releaseCheck = await pool.query(
      'SELECT * FROM version_releases WHERE release_id = $1',
      [release_id]
    );

    if (releaseCheck.rows.length === 0) {
      return res.status(404).json({ error: '版本发布记录不存在' });
    }

    const release = releaseCheck.rows[0];

    if (release.approval_status !== 'approved') {
      return res.status(400).json({ error: '该版本尚未通过审批，无法发布' });
    }

    // 在发布前自动备份当前版本（使用app_versions表中的最新版本）
    const currentVersion = await pool.query(
      'SELECT * FROM app_versions ORDER BY version_code DESC LIMIT 1'
    );

    if (currentVersion.rows.length > 0) {
      // 记录备份（实际应该调用备份API）
      console.log(`Backup current version ${currentVersion.rows[0].version_name} before release`);
    }

    // 更新发布状态为已发布
    const result = await pool.query(
      `UPDATE version_releases
       SET release_status = 'published', published_by = $1, published_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE release_id = $2
       RETURNING *`,
      [published_by, release_id]
    );

    // 更新或插入app_versions表
    await pool.query(
      `INSERT INTO app_versions (version_code, version_name, version_title, description, download_url, compatibility_end_date)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP + INTERVAL '30 days')
       ON CONFLICT (version_code) DO UPDATE SET
         version_name = EXCLUDED.version_name,
         version_title = EXCLUDED.version_title,
         description = EXCLUDED.description,
         download_url = EXCLUDED.download_url`,
      [
        release.version_code,
        release.version_name,
        release.version_title,
        release.description,
        release.download_url,
      ]
    );

    res.json({
      message: '版本已成功发布',
      release: result.rows[0],
    });
  } catch (error) {
    console.error('Publish version error:', error);
    res.status(500).json({ error: '发布版本失败' });
  }
});

// 获取版本发布列表
router.get('/', async (req, res) => {
  try {
    const { release_status, approval_status, limit = 50 } = req.query;

    let query = `
      SELECT vr.*, u1.username as created_by_name, u2.username as approved_by_name, u3.username as published_by_name
      FROM version_releases vr
      LEFT JOIN users u1 ON vr.published_by = u1.id
      LEFT JOIN users u2 ON vr.approved_by = u2.id
      LEFT JOIN users u3 ON vr.published_by = u3.id
      WHERE 1=1
    `;
    const values: any[] = [];
    let paramCount = 1;

    if (release_status) {
      query += ` AND vr.release_status = $${paramCount}`;
      values.push(release_status);
      paramCount++;
    }

    if (approval_status) {
      query += ` AND vr.approval_status = $${paramCount}`;
      values.push(approval_status);
      paramCount++;
    }

    query += ' ORDER BY vr.created_at DESC LIMIT $' + paramCount;
    values.push(Number(limit));

    const result = await pool.query(query, values);

    res.json(result.rows);
  } catch (error) {
    console.error('Get releases error:', error);
    res.status(500).json({ error: '获取版本发布列表失败' });
  }
});

// 获取版本发布详情
router.get('/:release_id', async (req, res) => {
  try {
    const { release_id } = req.params;

    const result = await pool.query(
      `SELECT vr.*, u1.username as created_by_name, u2.username as approved_by_name, u3.username as published_by_name
       FROM version_releases vr
       LEFT JOIN users u1 ON vr.published_by = u1.id
       LEFT JOIN users u2 ON vr.approved_by = u2.id
       LEFT JOIN users u3 ON vr.published_by = u3.id
       WHERE vr.release_id = $1`,
      [release_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '版本发布记录不存在' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get release error:', error);
    res.status(500).json({ error: '获取版本发布详情失败' });
  }
});

export default router;
