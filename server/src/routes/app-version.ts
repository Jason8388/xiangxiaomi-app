import express from 'express';
import pool from '../database/db';

const router = express.Router();

// GET /api/v1/app-version/check - 检查版本更新
router.get('/check', async (req, res) => {
  try {
    const { version_code, device_id } = req.query;

    if (!version_code) {
      return res.status(400).json({ error: '缺少版本号参数' });
    }

    const currentVersionCode = parseInt(version_code as string);
    const deviceId = device_id as string || '';

    // 获取最新版本
    const latestVersionResult = await pool.query(
      'SELECT * FROM app_versions WHERE is_disabled = FALSE ORDER BY version_code DESC LIMIT 1'
    );

    if (latestVersionResult.rows.length === 0) {
      return res.json({
        has_update: false,
        message: '当前已是最新版本',
      });
    }

    const latestVersion = latestVersionResult.rows[0];

    // 检查是否需要更新
    if (latestVersion.version_code <= currentVersionCode) {
      return res.json({
        has_update: false,
        message: '当前已是最新版本',
      });
    }

    // 检查是否在兼容期内
    const now = new Date();
    const compatibilityEndDate = new Date(latestVersion.compatibility_end_date);
    const isCompatibilityPeriodExpired = now > compatibilityEndDate;

    // 判断是否强制更新
    const isMandatory = isCompatibilityPeriodExpired || latestVersion.is_mandatory;

    res.json({
      has_update: true,
      is_mandatory: isMandatory,
      compatibility_end_date: latestVersion.compatibility_end_date,
      latest_version: {
        version_code: latestVersion.version_code,
        version_name: latestVersion.version_name,
        version_title: latestVersion.version_title,
        description: latestVersion.description,
        release_date: latestVersion.release_date,
        download_url: latestVersion.download_url,
      },
    });
  } catch (error: any) {
    console.error('Check version error:', error);
    res.status(500).json({ error: '检查版本失败' });
  }
});

// GET /api/v1/app-version/latest - 获取最新版本信息（管理端）
router.get('/latest', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM app_versions WHERE is_disabled = FALSE ORDER BY version_code DESC LIMIT 1'
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '暂无版本信息' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Get latest version error:', error);
    res.status(500).json({ error: '获取版本信息失败' });
  }
});

// GET /api/v1/app-version - 获取所有版本列表（管理端）
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM app_versions ORDER BY version_code DESC'
    );

    res.json(result.rows);
  } catch (error: any) {
    console.error('Get versions error:', error);
    res.status(500).json({ error: '获取版本列表失败' });
  }
});

// POST /api/v1/app-version - 创建新版本（管理端）
router.post('/', async (req, res) => {
  try {
    const {
      version_code,
      version_name,
      version_title,
      description,
      download_url,
      is_mandatory = false,
    } = req.body;

    if (!version_code || !version_name || !version_title) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    // 计算兼容期结束时间（发布后30天）
    const compatibility_end_date = new Date();
    compatibility_end_date.setDate(compatibility_end_date.getDate() + 30);

    const result = await pool.query(
      `INSERT INTO app_versions (version_code, version_name, version_title, description, compatibility_end_date, download_url, is_mandatory)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [version_code, version_name, version_title, description, compatibility_end_date, download_url, is_mandatory]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    if (error.code === '23505') { // 唯一约束冲突
      return res.status(400).json({ error: '版本号已存在' });
    }
    console.error('Create version error:', error);
    res.status(500).json({ error: '创建版本失败' });
  }
});

// PUT /api/v1/app-version/:id - 更新版本信息（管理端）
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { version_name, version_title, description, download_url, is_mandatory, is_disabled } = req.body;

    const result = await pool.query(
      `UPDATE app_versions
       SET version_name = COALESCE($1, version_name),
           version_title = COALESCE($2, version_title),
           description = COALESCE($3, description),
           download_url = COALESCE($4, download_url),
           is_mandatory = COALESCE($5, is_mandatory),
           is_disabled = COALESCE($6, is_disabled),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`,
      [version_name, version_title, description, download_url, is_mandatory, is_disabled, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '版本不存在' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Update version error:', error);
    res.status(500).json({ error: '更新版本失败' });
  }
});

// DELETE /api/v1/app-version/:id - 删除版本（管理端）
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM app_versions WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '版本不存在' });
    }

    res.json({ message: '版本删除成功' });
  } catch (error: any) {
    console.error('Delete version error:', error);
    res.status(500).json({ error: '删除版本失败' });
  }
});

// POST /api/v1/app-version/upgrade-failure - 上报升级失败
router.post('/upgrade-failure', async (req, res) => {
  try {
    const {
      user_id,
      device_id,
      old_version_code,
      new_version_code,
      error_message,
      device_info,
    } = req.body;

    if (!old_version_code || !new_version_code || !error_message) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    const result = await pool.query(
      `INSERT INTO upgrade_failures (user_id, device_id, old_version_code, new_version_code, error_message, device_info)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [user_id, device_id, old_version_code, new_version_code, error_message, device_info]
    );

    res.status(201).json({
      message: '升级失败已记录',
      failure: result.rows[0],
    });
  } catch (error: any) {
    console.error('Report upgrade failure error:', error);
    res.status(500).json({ error: '上报升级失败出错' });
  }
});

// GET /api/v1/app-version/upgrade-failures - 获取升级失败列表（管理端）
router.get('/upgrade-failures', async (req, res) => {
  try {
    const { page = 1, limit = 20, is_reported } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = `
      SELECT uf.*, u.username, v1.version_name as old_version_name, v2.version_name as new_version_name
      FROM upgrade_failures uf
      LEFT JOIN users u ON uf.user_id = u.id
      LEFT JOIN app_versions v1 ON uf.old_version_code = v1.version_code
      LEFT JOIN app_versions v2 ON uf.new_version_code = v2.version_code
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (is_reported !== undefined) {
      query += ` AND uf.is_reported = $${paramIndex}`;
      params.push(is_reported === 'true');
      paramIndex++;
    }

    query += ` ORDER BY uf.error_timestamp DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(Number(limit), offset);

    const result = await pool.query(query, params);

    // 获取总数
    let countQuery = 'SELECT COUNT(*) as count FROM upgrade_failures WHERE 1=1';
    const countParams: any[] = [];
    let countParamIndex = 1;

    if (is_reported !== undefined) {
      countQuery += ` AND is_reported = $${countParamIndex}`;
      countParams.push(is_reported === 'true');
      countParamIndex++;
    }

    const countResult = await pool.query(countQuery, countParams);

    res.json({
      failures: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: Number(page),
      limit: Number(limit),
    });
  } catch (error: any) {
    console.error('Get upgrade failures error:', error);
    res.status(500).json({ error: '获取升级失败列表失败' });
  }
});

// PUT /api/v1/app-version/upgrade-failure/:id/report - 标记为已上报管理员
router.put('/upgrade-failure/:id/report', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'UPDATE upgrade_failures SET is_reported = TRUE WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '升级失败记录不存在' });
    }

    res.json({ message: '已标记为已上报' });
  } catch (error: any) {
    console.error('Mark as reported error:', error);
    res.status(500).json({ error: '标记失败' });
  }
});

export default router;
