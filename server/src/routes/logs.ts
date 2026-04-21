import express from 'express';
import { Pool } from 'pg';
import XLSX from 'xlsx';

const router = express.Router();

// 数据库连接
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'coze_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres123',
});

// 内存存储（备用）
const memoryLoginLogs: any[] = [];
const memoryOperationLogs: any[] = [];

// 查询函数（带重试）
async function queryWithRetry(sql: string, params: any[] = [], retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const result = await pool.query(sql, params);
      return result;
    } catch (error: any) {
      if (i === retries - 1) throw error;
      if (error.code === '57P01' || error.code === '57P02') {
        // 数据库连接错误，重试
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      } else {
        throw error;
      }
    }
  }
  throw new Error('Query failed');
}

// ==================== 登录日志 ====================

// 获取登录日志列表
router.get('/login', async (req, res) => {
  try {
    const {
      page = '1',
      limit = '20',
      username,
      start_date,
      end_date,
      platform,
      user_id,
    } = req.query;

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    const pageSize = parseInt(limit as string);

    // 构建查询条件
    const conditions: string[] = ['1=1'];
    const params: any[] = [];
    let paramIndex = 1;

    if (username) {
      conditions.push(`username ILIKE $${paramIndex++}`);
      params.push(`%${username}%`);
    }

    if (user_id) {
      conditions.push(`user_id = $${paramIndex++}`);
      params.push(parseInt(user_id as string));
    }

    if (start_date) {
      conditions.push(`login_time >= $${paramIndex++}`);
      params.push(start_date);
    }

    if (end_date) {
      conditions.push(`login_time <= $${paramIndex++}`);
      params.push(end_date);
    }

    if (platform) {
      conditions.push(`platform = $${paramIndex++}`);
      params.push(platform);
    }

    const whereClause = conditions.join(' AND ');

    // 查询数据
    let loginLogs;
    let total = 0;

    try {
      const dataQuery = `
        SELECT * FROM login_logs
        WHERE ${whereClause}
        ORDER BY login_time DESC
        LIMIT $${paramIndex++} OFFSET $${paramIndex}
      `;
      const dataResult = await queryWithRetry(dataQuery, [...params, pageSize, offset]);
      loginLogs = dataResult.rows;

      // 查询总数
      const countQuery = `
        SELECT COUNT(*) as total FROM login_logs
        WHERE ${whereClause}
      `;
      const countResult = await queryWithRetry(countQuery, params);
      total = parseInt(countResult.rows[0].total);
    } catch (error) {
      console.log('Query login logs error, using memory storage:', error);
      // 使用内存存储
      loginLogs = memoryLoginLogs
        .filter((log) => {
          if (username && !log.username.includes(username as string)) return false;
          if (user_id && log.user_id !== parseInt(user_id as string)) return false;
          if (start_date && new Date(log.login_time) < new Date(start_date as string)) return false;
          if (end_date && new Date(log.login_time) > new Date(end_date as string)) return false;
          if (platform && log.platform !== platform) return false;
          return true;
        })
        .sort((a, b) => new Date(b.login_time).getTime() - new Date(a.login_time).getTime())
        .slice(offset, offset + pageSize);

      total = memoryLoginLogs.filter((log) => {
        if (username && !log.username.includes(username as string)) return false;
        if (user_id && log.user_id !== parseInt(user_id as string)) return false;
        if (start_date && new Date(log.login_time) < new Date(start_date as string)) return false;
        if (end_date && new Date(log.login_time) > new Date(end_date as string)) return false;
        if (platform && log.platform !== platform) return false;
        return true;
      }).length;
    }

    res.json({
      code: 200,
      message: 'success',
      data: {
        list: loginLogs,
        total,
        page: parseInt(page as string),
        limit: pageSize,
      },
    });
  } catch (error: any) {
    console.error('Get login logs error:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '获取登录日志失败',
      data: null,
    });
  }
});

// 获取登录日志统计
router.get('/login/stats', async (req, res) => {
  try {
    const { start_date, end_date, user_id } = req.query;

    const conditions: string[] = ['1=1'];
    const params: any[] = [];
    let paramIndex = 1;

    if (start_date) {
      conditions.push(`login_time >= $${paramIndex++}`);
      params.push(start_date);
    }

    if (end_date) {
      conditions.push(`login_time <= $${paramIndex++}`);
      params.push(end_date);
    }

    if (user_id) {
      conditions.push(`user_id = $${paramIndex++}`);
      params.push(parseInt(user_id as string));
    }

    const whereClause = conditions.join(' AND ');

    // 总登录次数
    const totalLoginsQuery = `
      SELECT COUNT(*) as count FROM login_logs
      WHERE ${whereClause}
    `;

    // 总登录人数
    const uniqueUsersQuery = `
      SELECT COUNT(DISTINCT user_id) as count FROM login_logs
      WHERE ${whereClause}
    `;

    // 平均登录时长
    const avgDurationQuery = `
      SELECT AVG(duration) as avg_duration FROM login_logs
      WHERE ${whereClause} AND duration IS NOT NULL
    `;

    // 按平台统计
    const platformStatsQuery = `
      SELECT platform, COUNT(*) as count FROM login_logs
      WHERE ${whereClause}
      GROUP BY platform
    `;

    // 按日期统计（最近7天）
    const dailyStatsQuery = `
      SELECT DATE(login_time) as date, COUNT(*) as count
      FROM login_logs
      WHERE ${whereClause}
        AND login_time >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(login_time)
      ORDER BY date DESC
    `;

    // 按用户统计（前10名）
    const userStatsQuery = `
      SELECT user_id, username, COUNT(*) as login_count, AVG(duration) as avg_duration
      FROM login_logs
      WHERE ${whereClause}
      GROUP BY user_id, username
      ORDER BY login_count DESC
      LIMIT 10
    `;

    let totalLogins = 0;
    let uniqueUsers = 0;
    let avgDuration = 0;
    let platformStats: any[] = [];
    let dailyStats: any[] = [];
    let userStats: any[] = [];

    try {
      const [totalResult, uniqueResult, avgResult, platformResult, dailyResult, userResult] = await Promise.all([
        queryWithRetry(totalLoginsQuery, params),
        queryWithRetry(uniqueUsersQuery, params),
        queryWithRetry(avgDurationQuery, params),
        queryWithRetry(platformStatsQuery, params),
        queryWithRetry(dailyStatsQuery, params),
        queryWithRetry(userStatsQuery, params),
      ]);

      totalLogins = parseInt(totalResult.rows[0].count);
      uniqueUsers = parseInt(uniqueResult.rows[0].count);
      avgDuration = Math.round(avgResult.rows[0].avg_duration || 0);
      platformStats = platformResult.rows;
      dailyStats = dailyResult.rows;
      userStats = userResult.rows;
    } catch (error) {
      console.log('Query login stats error, using memory storage:', error);
      // 使用内存存储
      const filteredLogs = memoryLoginLogs.filter((log) => {
        if (start_date && new Date(log.login_time) < new Date(start_date as string)) return false;
        if (end_date && new Date(log.login_time) > new Date(end_date as string)) return false;
        if (user_id && log.user_id !== parseInt(user_id as string)) return false;
        return true;
      });

      totalLogins = filteredLogs.length;
      uniqueUsers = new Set(filteredLogs.map(l => l.user_id)).size;
      avgDuration = Math.round(
        filteredLogs
          .filter(l => l.duration)
          .reduce((sum, l) => sum + l.duration, 0) / filteredLogs.filter(l => l.duration).length
      );

      // 平台统计
      const platformMap = new Map<string, number>();
      filteredLogs.forEach(log => {
        platformMap.set(log.platform || 'unknown', (platformMap.get(log.platform || 'unknown') || 0) + 1);
      });
      platformStats = Array.from(platformMap.entries()).map(([platform, count]) => ({ platform, count }));

      // 用户统计
      const userMap = new Map<number, { username: string; count: number; totalDuration: number }>();
      filteredLogs.forEach(log => {
        const user = userMap.get(log.user_id) || { username: log.username, count: 0, totalDuration: 0 };
        user.count++;
        if (log.duration) user.totalDuration += log.duration;
        userMap.set(log.user_id, user);
      });
      userStats = Array.from(userMap.entries())
        .map(([user_id, data]) => ({
          user_id,
          username: data.username,
          login_count: data.count,
          avg_duration: Math.round(data.totalDuration / data.count),
        }))
        .sort((a, b) => b.login_count - a.login_count)
        .slice(0, 10);
    }

    res.json({
      code: 200,
      message: 'success',
      data: {
        total_logins: totalLogins,
        unique_users: uniqueUsers,
        avg_duration: avgDuration,
        platform_stats: platformStats,
        daily_stats: dailyStats,
        user_stats: userStats,
      },
    });
  } catch (error: any) {
    console.error('Get login stats error:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '获取登录统计失败',
      data: null,
    });
  }
});

// 导出登录日志
router.get('/login/export', async (req, res) => {
  try {
    const { username, start_date, end_date, platform } = req.query;

    // 构建查询条件
    const conditions: string[] = ['1=1'];
    const params: any[] = [];
    let paramIndex = 1;

    if (username) {
      conditions.push(`username ILIKE $${paramIndex++}`);
      params.push(`%${username}%`);
    }

    if (start_date) {
      conditions.push(`login_time >= $${paramIndex++}`);
      params.push(start_date);
    }

    if (end_date) {
      conditions.push(`login_time <= $${paramIndex++}`);
      params.push(end_date);
    }

    if (platform) {
      conditions.push(`platform = $${paramIndex++}`);
      params.push(platform);
    }

    const whereClause = conditions.join(' AND ');

    // 查询数据
    let loginLogs = [];
    try {
      const query = `
        SELECT * FROM login_logs
        WHERE ${whereClause}
        ORDER BY login_time DESC
      `;
      const result = await queryWithRetry(query, params);
      loginLogs = result.rows;
    } catch (error) {
      console.log('Query login logs for export error, using memory storage:', error);
      loginLogs = memoryLoginLogs.filter((log) => {
        if (username && !log.username.includes(username as string)) return false;
        if (start_date && new Date(log.login_time) < new Date(start_date as string)) return false;
        if (end_date && new Date(log.login_time) > new Date(end_date as string)) return false;
        if (platform && log.platform !== platform) return false;
        return true;
      });
    }

    // 使用XLSX库生成Excel文件

    // 准备数据
    const data = loginLogs.map(log => ({
      'ID': log.id,
      '用户名': log.username,
      '登录时间': formatDateTime(log.login_time),
      '登出时间': formatDateTime(log.logout_time),
      '登录时长（秒）': log.duration || 0,
      '平台': log.platform || '-',
      '设备信息': log.device_info || '-',
      'IP地址': log.ip_address || '-',
      '记录时间': formatDateTime(log.created_at),
    }));

    // 创建工作簿
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '登录日志');

    // 设置列宽
    ws['!cols'] = [
      { wch: 10 }, // ID
      { wch: 15 }, // 用户名
      { wch: 20 }, // 登录时间
      { wch: 20 }, // 登出时间
      { wch: 15 }, // 登录时长
      { wch: 10 }, // 平台
      { wch: 30 }, // 设备信息
      { wch: 15 }, // IP地址
      { wch: 20 }, // 记录时间
    ];

    // 生成文件
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // 设置响应头
    const filename = `登录日志_${new Date().toISOString().slice(0, 10)}.xlsx`;
    const encodedFilename = encodeURIComponent(filename);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${encodedFilename}"`);

    res.send(buffer);
  } catch (error: any) {
    console.error('Export login logs error:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '导出登录日志失败',
      data: null,
    });
  }
});

// ==================== 操作日志 ====================

// 获取操作日志列表
router.get('/operation', async (req, res) => {
  try {
    const {
      page = '1',
      limit = '20',
      username,
      action,
      module,
      start_date,
      end_date,
      user_id,
    } = req.query;

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    const pageSize = parseInt(limit as string);

    // 构建查询条件
    const conditions: string[] = ['1=1'];
    const params: any[] = [];
    let paramIndex = 1;

    if (username) {
      conditions.push(`username ILIKE $${paramIndex++}`);
      params.push(`%${username}%`);
    }

    if (user_id) {
      conditions.push(`user_id = $${paramIndex++}`);
      params.push(parseInt(user_id as string));
    }

    if (action) {
      conditions.push(`action ILIKE $${paramIndex++}`);
      params.push(`%${action}%`);
    }

    if (module) {
      conditions.push(`module = $${paramIndex++}`);
      params.push(module);
    }

    if (start_date) {
      conditions.push(`created_at >= $${paramIndex++}`);
      params.push(start_date);
    }

    if (end_date) {
      conditions.push(`created_at <= $${paramIndex++}`);
      params.push(end_date);
    }

    const whereClause = conditions.join(' AND ');

    // 查询数据
    let operationLogs;
    let total = 0;

    try {
      const dataQuery = `
        SELECT * FROM operation_logs
        WHERE ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${paramIndex++} OFFSET $${paramIndex}
      `;
      const dataResult = await queryWithRetry(dataQuery, [...params, pageSize, offset]);
      operationLogs = dataResult.rows;

      // 查询总数
      const countQuery = `
        SELECT COUNT(*) as total FROM operation_logs
        WHERE ${whereClause}
      `;
      const countResult = await queryWithRetry(countQuery, params);
      total = parseInt(countResult.rows[0].total);
    } catch (error) {
      console.log('Query operation logs error, using memory storage:', error);
      // 使用内存存储
      operationLogs = memoryOperationLogs
        .filter((log) => {
          if (username && !log.username.includes(username as string)) return false;
          if (user_id && log.user_id !== parseInt(user_id as string)) return false;
          if (action && !log.action.includes(action as string)) return false;
          if (module && log.module !== module) return false;
          if (start_date && new Date(log.created_at) < new Date(start_date as string)) return false;
          if (end_date && new Date(log.created_at) > new Date(end_date as string)) return false;
          return true;
        })
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(offset, offset + pageSize);

      total = memoryOperationLogs.filter((log) => {
        if (username && !log.username.includes(username as string)) return false;
        if (user_id && log.user_id !== parseInt(user_id as string)) return false;
        if (action && !log.action.includes(action as string)) return false;
        if (module && log.module !== module) return false;
        if (start_date && new Date(log.created_at) < new Date(start_date as string)) return false;
        if (end_date && new Date(log.created_at) > new Date(end_date as string)) return false;
        return true;
      }).length;
    }

    res.json({
      code: 200,
      message: 'success',
      data: {
        list: operationLogs,
        total,
        page: parseInt(page as string),
        limit: pageSize,
      },
    });
  } catch (error: any) {
    console.error('Get operation logs error:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '获取操作日志失败',
      data: null,
    });
  }
});

// 导出操作日志
router.get('/operation/export', async (req, res) => {
  try {
    const { username, action, module, start_date, end_date } = req.query;

    // 构建查询条件
    const conditions: string[] = ['1=1'];
    const params: any[] = [];
    let paramIndex = 1;

    if (username) {
      conditions.push(`username ILIKE $${paramIndex++}`);
      params.push(`%${username}%`);
    }

    if (action) {
      conditions.push(`action ILIKE $${paramIndex++}`);
      params.push(`%${action}%`);
    }

    if (module) {
      conditions.push(`module = $${paramIndex++}`);
      params.push(module);
    }

    if (start_date) {
      conditions.push(`created_at >= $${paramIndex++}`);
      params.push(start_date);
    }

    if (end_date) {
      conditions.push(`created_at <= $${paramIndex++}`);
      params.push(end_date);
    }

    const whereClause = conditions.join(' AND ');

    // 查询数据
    let operationLogs = [];
    try {
      const query = `
        SELECT * FROM operation_logs
        WHERE ${whereClause}
        ORDER BY created_at DESC
      `;
      const result = await queryWithRetry(query, params);
      operationLogs = result.rows;
    } catch (error) {
      console.log('Query operation logs for export error, using memory storage:', error);
      operationLogs = memoryOperationLogs.filter((log) => {
        if (username && !log.username.includes(username as string)) return false;
        if (action && !log.action.includes(action as string)) return false;
        if (module && log.module !== module) return false;
        if (start_date && new Date(log.created_at) < new Date(start_date as string)) return false;
        if (end_date && new Date(log.created_at) > new Date(end_date as string)) return false;
        return true;
      });
    }

    // 使用XLSX库生成Excel文件

    // 准备数据
    const data = operationLogs.map(log => ({
      'ID': log.id,
      '用户名': log.username,
      '操作类型': log.action,
      '模块': log.module || '-',
      '操作描述': log.description || '-',
      'IP地址': log.ip_address || '-',
      '平台': log.platform || '-',
      '操作时间': formatDateTime(log.created_at),
    }));

    // 创建工作簿
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '操作日志');

    // 设置列宽
    ws['!cols'] = [
      { wch: 10 }, // ID
      { wch: 15 }, // 用户名
      { wch: 15 }, // 操作类型
      { wch: 15 }, // 模块
      { wch: 30 }, // 操作描述
      { wch: 15 }, // IP地址
      { wch: 10 }, // 平台
      { wch: 20 }, // 操作时间
    ];

    // 生成文件
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // 设置响应头
    const filename = `操作日志_${new Date().toISOString().slice(0, 10)}.xlsx`;
    const encodedFilename = encodeURIComponent(filename);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${encodedFilename}"`);

    res.send(buffer);
  } catch (error: any) {
    console.error('Export operation logs error:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '导出操作日志失败',
      data: null,
    });
  }
});

// ==================== 辅助函数 ====================

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toISOString().replace('T', ' ').slice(0, 19);
}

export default router;
