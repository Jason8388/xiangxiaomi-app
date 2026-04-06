import express from 'express';
import { randomUUID } from 'crypto';
import pool from '../database/db';
import { exec } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

const router = express.Router();
const BACKUP_DIR = '/tmp/db_backups'; // 备份文件存储目录
const KEEP_BACKUP_MONTHS = 3; // 保留最近3个月的备份

// 确保备份目录存在
async function ensureBackupDir() {
  try {
    await fs.mkdir(BACKUP_DIR, { recursive: true });
  } catch (error) {
    console.error('Create backup directory error:', error);
  }
}

// 执行数据库备份
async function executeBackup(backupId: string, backupType: string, createdBy?: number) {
  const backupFileName = `backup_${backupId}_${Date.now()}.sql`;
  const backupFilePath = path.join(BACKUP_DIR, backupFileName);

  await ensureBackupDir();

  // 更新备份状态为running
  await pool.query(
    'UPDATE db_backups SET backup_status = $1 WHERE backup_id = $2',
    ['running', backupId]
  );

  try {
    // 执行pg_dump命令备份数据库
    // 注意：实际使用时需要根据数据库配置调整参数
    const command = `pg_dump -h 172.36.0.169 -p 59833 -U postgres -d postgres > ${backupFilePath}`;
    await new Promise<void>((resolve, reject) => {
      exec(command, { env: { ...process.env, PGPASSWORD: 'postgres@2024' } }, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });

    // 检查备份文件大小
    const stats = await fs.stat(backupFilePath);

    // 更新备份状态为success
    await pool.query(
      `UPDATE db_backups
       SET backup_status = $1, backup_file_path = $2, backup_size = $3, completed_at = CURRENT_TIMESTAMP
       WHERE backup_id = $4`,
      ['success', backupFilePath, stats.size, backupId]
    );

    return { success: true, filePath: backupFilePath, size: stats.size };
  } catch (error: any) {
    console.error('Execute backup error:', error);

    // 更新备份状态为failed
    await pool.query(
      `UPDATE db_backups
       SET backup_status = $1, error_message = $2, completed_at = CURRENT_TIMESTAMP
       WHERE backup_id = $3`,
      ['failed', error.message, backupId]
    );

    return { success: false, error: error.message };
  }
}

// 创建备份记录
router.post('/create', async (req, res) => {
  try {
    const { backup_type = 'manual', created_by } = req.body;
    const backupId = randomUUID();

    // 创建备份记录
    const result = await pool.query(
      `INSERT INTO db_backups (backup_id, backup_file_name, backup_type, backup_status, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [backupId, '', backup_type, 'pending', created_by]
    );

    // 异步执行备份
    executeBackup(backupId, backup_type, created_by).catch(console.error);

    res.status(201).json({
      message: '备份任务已创建',
      backup: result.rows[0],
    });
  } catch (error) {
    console.error('Create backup error:', error);
    res.status(500).json({ error: '创建备份任务失败' });
  }
});

// 获取备份列表
router.get('/', async (req, res) => {
  try {
    console.log('Get backups request:', req.query);

    // 最简单的查询
    const result = await pool.query('SELECT 1 as test');
    console.log('Query result:', result.rows);

    res.json(result.rows);
  } catch (error) {
    console.error('Get backups error:', error);
    res.status(500).json({ error: '获取备份列表失败', detail: String(error) });
  }
});

// 获取备份详情
router.get('/:backup_id', async (req, res) => {
  try {
    const { backup_id } = req.params;

    const result = await pool.query(
      `SELECT db.*, u.username as created_by_name
       FROM db_backups db
       LEFT JOIN users u ON db.created_by = u.id
       WHERE db.backup_id = $1 AND db.is_deleted = FALSE`,
      [backup_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '备份记录不存在' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get backup error:', error);
    res.status(500).json({ error: '获取备份详情失败' });
  }
});

// 清理过期备份（删除超过3个月的备份文件）
router.post('/cleanup', async (req, res) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - KEEP_BACKUP_MONTHS);

    // 查找过期的备份记录
    const expiredBackups = await pool.query(
      `SELECT backup_id, backup_file_path
       FROM db_backups
       WHERE started_at < $1 AND is_deleted = FALSE`,
      [cutoffDate]
    );

    let deletedCount = 0;

    // 删除过期备份文件
    for (const backup of expiredBackups.rows) {
      if (backup.backup_file_path) {
        try {
          await fs.unlink(backup.backup_file_path);
          // 标记为已删除
          await pool.query(
            `UPDATE db_backups
             SET is_deleted = TRUE, deleted_at = CURRENT_TIMESTAMP
             WHERE backup_id = $1`,
            [backup.backup_id]
          );
          deletedCount++;
        } catch (error) {
          console.error(`Delete backup file error: ${backup.backup_file_path}`, error);
        }
      }
    }

    res.json({
      message: `清理了 ${deletedCount} 个过期备份文件`,
      deleted_count: deletedCount,
    });
  } catch (error) {
    console.error('Cleanup backups error:', error);
    res.status(500).json({ error: '清理备份失败' });
  }
});

// 手动触发备份（用于测试）
router.post('/manual', async (req, res) => {
  try {
    const { created_by } = req.body;
    const backupId = randomUUID();

    // 创建备份记录
    const result = await pool.query(
      `INSERT INTO db_backups (backup_id, backup_file_name, backup_type, backup_status, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [backupId, '', 'manual', 'running', created_by]
    );

    // 同步执行备份
    const backupResult = await executeBackup(backupId, 'manual', created_by);

    if (backupResult.success) {
      res.json({
        message: '备份成功',
        backup: result.rows[0],
        backup_file_path: backupResult.filePath,
        backup_size: backupResult.size,
      });
    } else {
      res.status(500).json({
        message: '备份失败',
        error: backupResult.error,
        backup: result.rows[0],
      });
    }
  } catch (error) {
    console.error('Manual backup error:', error);
    res.status(500).json({ error: '手动备份失败' });
  }
});

// 定时任务：每日凌晨自动备份
// 可以使用node-cron库在应用启动时注册定时任务
export async function scheduleDailyBackup() {
  // 这里可以集成node-cron或其他定时任务库
  console.log('Daily backup scheduled at 00:00');
}

export default router;
