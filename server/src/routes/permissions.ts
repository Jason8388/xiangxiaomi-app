import express from 'express';
import pool, { USE_DATABASE } from '../database/db';
import { memoryUsers, memoryUsersArray } from '../database/memory-storage';

const router = express.Router();

// 支持的模块列表
const SUPPORTED_MODULES = [
  'customer',
  'contract',
  'device',
  'work_order',
  'meeting_minute',
  'file',
  'knowledge',
] as const;

export type ModuleName = typeof SUPPORTED_MODULES[number];
export type PermissionType = 'view' | 'edit' | 'add' | 'delete';

export interface PermissionSet {
  view: boolean;
  edit: boolean;
  add: boolean;
  delete: boolean;
}

export interface UserPermission {
  id: number;
  user_id: number;
  module_name: ModuleName;
  permissions: PermissionSet;
  created_at: Date;
  updated_at: Date;
}

// 管理员默认权限：全部可查看、可编辑、可新增、可删除
const ADMIN_DEFAULT_PERMISSIONS: Record<ModuleName, PermissionSet> = {
  customer: { view: true, edit: true, add: true, delete: true },
  contract: { view: true, edit: true, add: true, delete: true },
  device: { view: true, edit: true, add: true, delete: true },
  work_order: { view: true, edit: true, add: true, delete: true },
  meeting_minute: { view: true, edit: true, add: true, delete: true },
  file: { view: true, edit: true, add: true, delete: true },
  knowledge: { view: true, edit: true, add: true, delete: true },
};

// 普通用户默认权限：
// - 客户管理和合同管理：可查看、可编辑
// - 设备管理、工单管理、会议纪要、文件管理、知识库：可查看、可编辑、可新增
const USER_DEFAULT_PERMISSIONS: Record<ModuleName, PermissionSet> = {
  customer: { view: true, edit: true, add: false, delete: false },
  contract: { view: true, edit: true, add: false, delete: false },
  device: { view: true, edit: true, add: true, delete: false },
  work_order: { view: true, edit: true, add: true, delete: false },
  meeting_minute: { view: true, edit: true, add: true, delete: false },
  file: { view: true, edit: true, add: true, delete: false },
  knowledge: { view: true, edit: true, add: true, delete: false },
};

// 兼容旧代码的默认权限（所有权限都为false，现在已不使用）
const DEFAULT_PERMISSIONS: Record<ModuleName, PermissionSet> = {
  customer: { view: false, edit: false, add: false, delete: false },
  contract: { view: false, edit: false, add: false, delete: false },
  device: { view: false, edit: false, add: false, delete: false },
  work_order: { view: false, edit: false, add: false, delete: false },
  meeting_minute: { view: false, edit: false, add: false, delete: false },
  file: { view: false, edit: false, add: false, delete: false },
  knowledge: { view: false, edit: false, add: false, delete: false },
};

/**
 * 获取用户角色
 * @param userId 用户ID
 * @returns 用户角色（'admin' 或 'user'）
 */
async function getUserRole(userId: number): Promise<string> {
  try {
    // 先从内存存储中查找
    const memoryUser = memoryUsersArray.find(u => u.id === userId);
    if (memoryUser && memoryUser.role) {
      return memoryUser.role;
    }

    // 如果内存存储中没有，从数据库查询
    if (USE_DATABASE) {
      const result = await pool.query(
        'SELECT role FROM users WHERE id = $1',
        [userId]
      );
      if (result.rows.length > 0 && result.rows[0].role) {
        return result.rows[0].role;
      }
    }

    // 默认为普通用户
    return 'user';
  } catch (error) {
    console.error('[权限API] 获取用户角色错误:', error);
    // 出错时默认为普通用户
    return 'user';
  }
}

/**
 * 根据用户角色获取默认权限
 * @param userId 用户ID
 * @returns 默认权限配置
 */
async function getDefaultPermissionsByRole(userId: number): Promise<Record<ModuleName, PermissionSet>> {
  const role = await getUserRole(userId);
  console.log(`[权限API] 用户 ${userId} 的角色: ${role}`);

  if (role === 'admin') {
    return ADMIN_DEFAULT_PERMISSIONS;
  }

  return USER_DEFAULT_PERMISSIONS;
}

/**
 * 获取用户所有权限
 * GET /api/v1/permissions/users/:userId
 */
router.get('/users/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);

    if (isNaN(userId)) {
      return res.status(400).json({ error: '无效的用户ID' });
    }

    // 获取基于角色的默认权限
    const basePermissions = await getDefaultPermissionsByRole(userId);

    // 如果数据库不可用，直接返回基于角色的默认权限
    if (!USE_DATABASE) {
      console.log('[权限API] 数据库不可用，返回基于角色的默认权限');
      return res.json({
        user_id: userId,
        permissions: basePermissions,
      });
    }

    const result = await pool.query(
      'SELECT * FROM user_permissions WHERE user_id = $1',
      [userId]
    );

    // 合并数据库权限和默认权限
    const permissions: Record<ModuleName, PermissionSet> = { ...basePermissions };

    result.rows.forEach((row: UserPermission) => {
      if (SUPPORTED_MODULES.includes(row.module_name)) {
        // 使用数据库中的权限覆盖默认权限
        permissions[row.module_name] = row.permissions as PermissionSet;
      }
    });

    res.json({
      user_id: userId,
      permissions,
    });
  } catch (error: any) {
    console.error('[权限API] 获取用户权限错误:', error);
    // 出错时返回基于角色的默认权限
    const basePermissions = await getDefaultPermissionsByRole(parseInt(req.params.userId));
    res.json({
      user_id: parseInt(req.params.userId),
      permissions: basePermissions,
    });
  }
});

/**
 * 获取用户特定模块权限
 * GET /api/v1/permissions/users/:userId/modules/:moduleName
 */
router.get('/users/:userId/modules/:moduleName', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const moduleName = req.params.moduleName;

    if (isNaN(userId)) {
      return res.status(400).json({ error: '无效的用户ID' });
    }

    if (!SUPPORTED_MODULES.includes(moduleName as ModuleName)) {
      return res.status(400).json({ error: '不支持的模块' });
    }

    // 如果数据库不可用，直接返回基于角色的默认权限
    if (!USE_DATABASE) {
      console.log('[权限API] 数据库不可用，返回基于角色的默认权限');
      const basePermissions = await getDefaultPermissionsByRole(userId);
      return res.json({
        user_id: userId,
        module_name: moduleName,
        permissions: basePermissions[moduleName as ModuleName],
      });
    }

    const result = await pool.query(
      'SELECT permissions FROM user_permissions WHERE user_id = $1 AND module_name = $2',
      [userId, moduleName]
    );

    if (result.rows.length === 0) {
      // 获取基于角色的默认权限
      const basePermissions = await getDefaultPermissionsByRole(userId);
      return res.json({
        user_id: userId,
        module_name: moduleName,
        permissions: basePermissions[moduleName as ModuleName],
      });
    }

    res.json({
      user_id: userId,
      module_name: moduleName,
      permissions: result.rows[0].permissions,
    });
  } catch (error: any) {
    console.error('[权限API] 获取模块权限错误:', error);
    // 出错时返回基于角色的默认权限
    try {
      const basePermissions = await getDefaultPermissionsByRole(parseInt(req.params.userId));
      res.json({
        user_id: parseInt(req.params.userId),
        module_name: req.params.moduleName,
        permissions: basePermissions[req.params.moduleName as ModuleName],
      });
    } catch (fallbackError) {
      res.status(500).json({ error: '获取权限失败' });
    }
  }
});

/**
 * 更新用户特定模块权限
 * PUT /api/v1/permissions/users/:userId/modules/:moduleName
 */
router.put('/users/:userId/modules/:moduleName', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const moduleName = req.params.moduleName;
    const { permissions } = req.body;

    if (isNaN(userId)) {
      return res.status(400).json({ error: '无效的用户ID' });
    }

    if (!SUPPORTED_MODULES.includes(moduleName as ModuleName)) {
      return res.status(400).json({ error: '不支持的模块' });
    }

    if (!permissions || typeof permissions !== 'object') {
      return res.status(400).json({ error: '无效的权限数据' });
    }

    // 验证权限字段
    const validPermissions: PermissionSet = {
      view: Boolean(permissions.view),
      edit: Boolean(permissions.edit),
      add: Boolean(permissions.add),
      delete: Boolean(permissions.delete),
    };

    // 使用 UPSERT 语法更新或插入
    const result = await pool.query(
      `
      INSERT INTO user_permissions (user_id, module_name, permissions)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, module_name)
      DO UPDATE SET
        permissions = EXCLUDED.permissions,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
      `,
      [userId, moduleName, JSON.stringify(validPermissions)]
    );

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error: any) {
    console.error('[权限API] 更新权限错误:', error);
    res.status(500).json({ error: '更新权限失败' });
  }
});

/**
 * 批量更新用户权限
 * PUT /api/v1/permissions/users/:userId
 */
router.put('/users/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { permissions } = req.body;

    if (isNaN(userId)) {
      return res.status(400).json({ error: '无效的用户ID' });
    }

    if (!permissions || typeof permissions !== 'object') {
      return res.status(400).json({ error: '无效的权限数据' });
    }

    // 如果数据库不可用，只返回成功消息（实际上不保存）
    if (!USE_DATABASE) {
      console.log('[权限API] 数据库不可用，跳过权限保存');
      return res.json({
        success: true,
        message: '权限更新成功（仅演示，未实际保存）',
      });
    }

    // 验证每个模块的权限
    for (const moduleName of SUPPORTED_MODULES) {
      if (!permissions[moduleName] || typeof permissions[moduleName] !== 'object') {
        continue;
      }

      const validPermissions: PermissionSet = {
        view: Boolean(permissions[moduleName].view),
        edit: Boolean(permissions[moduleName].edit),
        add: Boolean(permissions[moduleName].add),
        delete: Boolean(permissions[moduleName].delete),
      };

      await pool.query(
        `
        INSERT INTO user_permissions (user_id, module_name, permissions)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id, module_name)
        DO UPDATE SET
          permissions = EXCLUDED.permissions,
          updated_at = CURRENT_TIMESTAMP
        `,
        [userId, moduleName, JSON.stringify(validPermissions)]
      );
    }

    res.json({
      success: true,
      message: '权限更新成功',
    });
  } catch (error: any) {
    console.error('[权限API] 批量更新权限错误:', error);
    res.status(500).json({ error: '批量更新权限失败' });
  }
});

/**
 * 检查用户是否有特定权限
 * POST /api/v1/permissions/check
 */
router.post('/check', async (req, res) => {
  try {
    const { userId, moduleName, permissionType } = req.body;

    if (!userId || !moduleName || !permissionType) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    if (!SUPPORTED_MODULES.includes(moduleName as ModuleName)) {
      return res.status(400).json({ error: '不支持的模块' });
    }

    if (
      !['view', 'edit', 'add', 'delete'].includes(permissionType as PermissionType)
    ) {
      return res.status(400).json({ error: '不支持的权限类型' });
    }

    const result = await pool.query(
      `SELECT permissions FROM user_permissions WHERE user_id = $1 AND module_name = $2`,
      [userId, moduleName]
    );

    if (result.rows.length === 0) {
      return res.json({
        hasPermission: false,
        userId,
        moduleName,
        permissionType,
      });
    }

    const permissions = result.rows[0].permissions as PermissionSet;
    const hasPermission = permissions[permissionType] || false;

    res.json({
      hasPermission,
      userId,
      moduleName,
      permissionType,
    });
  } catch (error: any) {
    console.error('[权限API] 检查权限错误:', error);
    res.status(500).json({ error: '检查权限失败' });
  }
});

export default router;
