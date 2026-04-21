import express from 'express';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Router } from 'express';

const router = express.Router();

// 可清理的文件类型定义
const CLEANABLE_FILE_TYPES = [
  { extension: '.log', name: '日志文件', description: '系统运行日志' },
  { extension: '.tmp', name: '临时文件', description: '临时存储文件' },
  { extension: '.cache', name: '缓存文件', description: '系统缓存文件' },
  { extension: '.bak', name: '备份文件', description: '备份文件' },
  { extension: '.swp', name: '交换文件', description: '交换文件' },
];

// 扫描目录（排除系统目录）
const EXCLUDE_DIRS = ['node_modules', '.git', '.coze', 'dist', 'build'];

// 获取系统存储空间信息
router.get('/storage-info', async (req, res) => {
  try {
    const projectRoot = process.env.COZE_WORKSPACE_PATH || '/workspace/projects';

    // 获取根目录的磁盘使用情况
    const stats = await fs.stat(projectRoot);
    const dfOutput = await execCommand('df -h ' + projectRoot);

    // 解析df输出
    const lines = dfOutput.split('\n');
    const dataLine = lines[1] ? lines[1].split(/\s+/) : [];

    const total = parseSize(dataLine[1]) || 0;
    const used = parseSize(dataLine[2]) || 0;
    const available = parseSize(dataLine[3]) || 0;
    const usagePercent = dataLine[4] ? parseInt(dataLine[4]) : 0;

    res.json({
      success: true,
      data: {
        total,        // 总空间（字节）
        used,         // 已用空间（字节）
        available,    // 可用空间（字节）
        usagePercent, // 使用率（百分比）
        totalFormatted: formatSize(total),
        usedFormatted: formatSize(used),
        availableFormatted: formatSize(available),
      },
    });
  } catch (error) {
    console.error('Get storage info error:', error);
    res.json({
      success: true,
      data: {
        total: 0,
        used: 0,
        available: 0,
        usagePercent: 0,
        totalFormatted: '未知',
        usedFormatted: '未知',
        availableFormatted: '未知',
      },
    });
  }
});

// 扫描并统计文件
router.post('/scan', async (req, res) => {
  try {
    const projectRoot = process.env.COZE_WORKSPACE_PATH || '/workspace/projects';
    const { directory = '' } = req.body;

    const scanDir = directory ? path.join(projectRoot, directory) : projectRoot;

    // 检查目录是否存在
    try {
      await fs.access(scanDir);
    } catch {
      return res.json({
        success: false,
        message: '目录不存在',
      });
    }

    const files = await scanDirectory(scanDir);

    // 统计文件类型
    const fileStats = new Map();

    for (const file of files) {
      const ext = path.extname(file.name);
      const stats = fileStats.get(ext) || {
        extension: ext,
        name: getFileTypeName(ext),
        count: 0,
        totalSize: 0,
      };

      stats.count++;
      stats.totalSize += file.size;
      fileStats.set(ext, stats);
    }

    // 转换为数组并按大小排序
    const typeStats = Array.from(fileStats.values()).map(stat => ({
      ...stat,
      totalSizeFormatted: formatSize(stat.totalSize),
      averageSize: stat.count > 0 ? stat.totalSize / stat.count : 0,
      averageSizeFormatted: formatSize(stat.count > 0 ? stat.totalSize / stat.count : 0),
    })).sort((a, b) => b.totalSize - a.totalSize);

    // 计算可清理的文件
    const cleanableTypes = CLEANABLE_FILE_TYPES.map(ct => {
      const stat = typeStats.find(ts => ts.extension === ct.extension);
      return {
        extension: ct.extension,
        name: ct.name,
        description: ct.description,
        count: stat ? stat.count : 0,
        totalSize: stat ? stat.totalSize : 0,
        totalSizeFormatted: stat ? formatSize(stat.totalSize) : '0 B',
      };
    }).filter(ct => ct.count > 0);

    // 计算总大小
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    const cleanableTotalSize = cleanableTypes.reduce((sum, ct) => sum + ct.totalSize, 0);

    // 获取存储空间信息
    const storageInfo = await getStorageInfo();

    // 生成清理文件列表
    const cleanupFiles = files.map(file => {
      const ext = path.extname(file.name);
      const isCleanable = CLEANABLE_FILE_TYPES.some(ct => ct.extension === ext);
      return {
        name: file.name,
        path: path.join(scanDir, file.path),
        size: file.size,
        type: ext.slice(1) || 'other',
        canDelete: isCleanable,
      };
    });

    res.json({
      success: true,
      code: 200,
      data: {
        totalSize,
        totalSizeFormatted: formatSize(totalSize),
        fileCount: files.length,
        storageInfo,
        fileTypeStats: typeStats.map(stat => ({
          type: stat.extension.slice(1) || 'other',
          count: stat.count,
          totalSize: stat.totalSize,
        })),
        cleanupFiles,
        cleanableTypes,
        cleanableTotalSize,
        cleanableTotalSizeFormatted: formatSize(cleanableTotalSize),
      },
    });
  } catch {
    res.json({
      success: false,
      message: '扫描文件失败',
    });
  }
});

// 获取可清理的文件列表
router.post('/cleanable-files', async (req, res) => {
  try {
    const projectRoot = process.env.COZE_WORKSPACE_PATH || '/workspace/projects';
    const { directory = '', fileTypes = [] } = req.body;

    const scanDir = directory ? path.join(projectRoot, directory) : projectRoot;
    const extensions = fileTypes.length > 0 ? fileTypes : CLEANABLE_FILE_TYPES.map(ct => ct.extension);

    const allFiles = await scanDirectory(scanDir);

    // 筛选可清理的文件
    const cleanableFiles = allFiles.filter(file => {
      const ext = path.extname(file.name);
      return extensions.includes(ext);
    }).map(file => ({
      ...file,
      sizeFormatted: formatSize(file.size),
      isCleanable: true,
    }));

    // 按大小排序
    cleanableFiles.sort((a, b) => b.size - a.size);

    // 计算总大小
    const totalSize = cleanableFiles.reduce((sum, file) => sum + file.size, 0);

    res.json({
      success: true,
      data: {
        totalSize,
        totalSizeFormatted: formatSize(totalSize),
        fileCount: cleanableFiles.length,
        files: cleanableFiles,
      },
    });
  } catch {
    res.json({
      success: false,
      message: '获取可清理文件失败',
    });
  }
});

// 清理文件
router.post('/clean', async (req, res) => {
  try {
    const projectRoot = process.env.COZE_WORKSPACE_PATH || '/workspace/projects';
    const { files = [], fileTypes = [], directory = '' } = req.body;

    if (files.length === 0 && fileTypes.length === 0) {
      return res.json({
        success: false,
        message: '请选择要清理的文件',
      });
    }

    let cleanedFiles = [];
    let cleanedSize = 0;
    let failedFiles = [];

    if (files.length > 0) {
      // 清理指定的文件
      for (const fileItem of files) {
        try {
          // 支持字符串路径和对象两种格式
          const filePath = typeof fileItem === 'string'
            ? (fileItem.startsWith('/') ? fileItem : path.join(projectRoot, fileItem))
            : (fileItem.path?.startsWith('/') ? fileItem.path : path.join(projectRoot, fileItem.path || ''));

          const fileName = typeof fileItem === 'string' ? path.basename(filePath) : (fileItem.name || path.basename(filePath));

          const stats = await fs.stat(filePath);

          await fs.unlink(filePath);
          cleanedSize += stats.size;
          cleanedFiles.push({
            path: typeof fileItem === 'string' ? fileItem : fileItem.path,
            name: fileName,
            size: stats.size,
            sizeFormatted: formatSize(stats.size),
          });
        } catch {
          failedFiles.push({
            path: typeof fileItem === 'string' ? fileItem : fileItem.path,
            name: typeof fileItem === 'string' ? path.basename(fileItem) : fileItem.name,
            error: 'Failed to delete file',
          });
        }
      }
    } else {
      // 按文件类型清理
      const scanDir = directory ? path.join(projectRoot, directory) : projectRoot;
      const allFiles = await scanDirectory(scanDir);

      for (const file of allFiles) {
        const ext = path.extname(file.name);
        if (fileTypes.includes(ext)) {
          try {
            const filePath = path.join(scanDir, file.path);

            await fs.unlink(filePath);
            cleanedSize += file.size;
            cleanedFiles.push({
              path: file.path,
              name: file.name,
              size: file.size,
              sizeFormatted: formatSize(file.size),
            });
          } catch {
            failedFiles.push({
              path: file.path,
              name: file.name,
              error: 'Failed to delete file',
            });
          }
        }
      }
    }

    res.json({
      success: true,
      code: 200,
      data: {
        cleanedCount: cleanedFiles.length,
        freedSpace: cleanedSize,
        cleanedSize,
        cleanedSizeFormatted: formatSize(cleanedSize),
        failedCount: failedFiles.length,
        cleanedFiles,
        failedFiles,
      },
    });
  } catch {
    res.json({
      success: false,
      message: '清理文件失败',
    });
  }
});

// 获取可清理的文件类型
router.get('/cleanable-types', (req, res) => {
  res.json({
    success: true,
    data: CLEANABLE_FILE_TYPES,
  });
});

// 清理所有可清理文件
router.post('/clean-all', async (req, res) => {
  try {
    const projectRoot = process.env.COZE_WORKSPACE_PATH || '/workspace/projects';
    const { directory = '' } = req.body;

    const scanDir = directory ? path.join(projectRoot, directory) : projectRoot;
    const allFiles = await scanDirectory(scanDir);

    // 筛选可清理的文件
    const cleanableFiles = allFiles.filter(file => {
      const ext = path.extname(file.name);
      return CLEANABLE_FILE_TYPES.some(ct => ct.extension === ext);
    });

    let cleanedFiles = [];
    let cleanedSize = 0;
    let failedFiles = [];

    // 清理所有可清理文件
    for (const file of cleanableFiles) {
      try {
        const filePath = path.join(scanDir, file.path);

        await fs.unlink(filePath);
        cleanedSize += file.size;
        cleanedFiles.push({
          path: file.path,
          name: file.name,
          size: file.size,
          sizeFormatted: formatSize(file.size),
        });
      } catch (error) {
        failedFiles.push({
          path: file.path,
          name: file.name,
          error: error.message,
        });
      }
    }

    res.json({
      success: true,
      code: 200,
      data: {
        cleanedCount: cleanedFiles.length,
        freedSpace: cleanedSize,
        cleanedSize,
        cleanedSizeFormatted: formatSize(cleanedSize),
        failedCount: failedFiles.length,
        cleanedFiles,
        failedFiles,
      },
    });
  } catch {
    res.json({
      success: false,
      message: '清理文件失败',
    });
  }
});

// 辅助函数：扫描目录
async function scanDirectory(dir: string, basePath: string = ''): Promise<any[]> {
  const files: any[] = [];

  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      // 跳过排除的目录
      if (entry.isDirectory() && EXCLUDE_DIRS.includes(entry.name)) {
        continue;
      }

      const fullPath = path.join(dir, entry.name);
      const relativePath = basePath ? path.join(basePath, entry.name) : entry.name;

      if (entry.isDirectory()) {
        // 递归扫描子目录
        const subFiles = await scanDirectory(fullPath, relativePath);
        files.push(...subFiles);
      } else {
        // 获取文件信息
        try {
          const stats = await fs.stat(fullPath);
          files.push({
            path: relativePath,
            name: entry.name,
            size: stats.size,
            sizeFormatted: formatSize(stats.size),
            modifiedTime: stats.mtime,
          });
        } catch {
          // 忽略无法访问的文件
        }
      }
    }
  } catch {
    console.error(`Error reading directory ${dir}`);
  }

  return files;
}

// 辅助函数：解析大小（GB/MB/KB/B）
function parseSize(sizeStr: string): number {
  if (!sizeStr) return 0;

  const unit = sizeStr.slice(-1).toUpperCase();
  const value = parseFloat(sizeStr.slice(0, -1));

  switch (unit) {
    case 'T':
      return value * 1024 * 1024 * 1024 * 1024;
    case 'G':
      return value * 1024 * 1024 * 1024;
    case 'M':
      return value * 1024 * 1024;
    case 'K':
      return value * 1024;
    default:
      return value || 0;
  }
}

// 辅助函数：格式化大小
function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + units[i];
}

// 辅助函数：获取文件类型名称
function getFileTypeName(extension: string): string {
  const type = CLEANABLE_FILE_TYPES.find(ct => ct.extension === extension);
  return type ? type.name : extension.toUpperCase().slice(1) + '文件';
}

// 辅助函数：获取存储空间信息
async function getStorageInfo() {
  try {
    const projectRoot = process.env.COZE_WORKSPACE_PATH || '/workspace/projects';
    const dfOutput = await execCommand('df -h ' + projectRoot);

    // 解析df输出
    const lines = dfOutput.split('\n');
    const dataLine = lines[1] ? lines[1].split(/\s+/) : [];

    const totalSpace = parseSize(dataLine[1]) || 0;
    const usedSpace = parseSize(dataLine[2]) || 0;
    const freeSpace = parseSize(dataLine[3]) || 0;

    return {
      totalSpace,
      usedSpace,
      freeSpace,
    };
  } catch {
    return {
      totalSpace: 0,
      usedSpace: 0,
      freeSpace: 0,
    };
  }
}

// 辅助函数：执行命令
async function execCommand(command: string): Promise<string> {
  const { exec } = await import('child_process');
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve(stdout);
      }
    });
  });
}

export default router;
