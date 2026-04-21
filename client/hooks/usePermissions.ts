import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiBaseUrl } from '@/utils/api';

export type ModuleName = 'customer' | 'contract' | 'device' | 'work_order' | 'meeting_minute' | 'file' | 'knowledge';
export type PermissionType = 'view' | 'edit' | 'add' | 'delete';

export interface PermissionSet {
  view: boolean;
  edit: boolean;
  add: boolean;
  delete: boolean;
}

export interface UserPermissions {
  [key: string]: PermissionSet;
}

/**
 * 权限控制Hook
 * 用于检查用户是否有特定模块的特定权限
 */
export function usePermissions(userId?: number | string) {
  const [permissions, setPermissions] = useState<UserPermissions>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      loadPermissions();
    }
  }, [userId]);

  const loadPermissions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${getApiBaseUrl()}/api/v1/permissions/users/${userId}`);
      const data = await response.json();

      if (response.ok && data.permissions) {
        setPermissions(data.permissions);
      }
    } catch (error) {
      console.error('[权限Hook] 加载权限错误:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 检查用户是否有查看权限
   */
  const canView = (moduleName: ModuleName): boolean => {
    return permissions[moduleName]?.view || false;
  };

  /**
   * 检查用户是否有编辑权限
   */
  const canEdit = (moduleName: ModuleName): boolean => {
    return permissions[moduleName]?.edit || false;
  };

  /**
   * 检查用户是否有新增权限
   */
  const canAdd = (moduleName: ModuleName): boolean => {
    return permissions[moduleName]?.add || false;
  };

  /**
   * 检查用户是否有删除权限
   */
  const canDelete = (moduleName: ModuleName): boolean => {
    return permissions[moduleName]?.delete || false;
  };

  /**
   * 检查用户是否有任何权限
   */
  const hasAnyPermission = (moduleName: ModuleName): boolean => {
    const perm = permissions[moduleName];
    if (!perm) return false;
    return perm.view || perm.edit || perm.add || perm.delete;
  };

  return {
    permissions,
    loading,
    canView,
    canEdit,
    canAdd,
    canDelete,
    hasAnyPermission,
    reload: loadPermissions,
  };
}

/**
 * 简化版权限Hook，从存储中获取当前用户ID并加载权限
 */
export function useCurrentUserPermissions() {
  const [userId, setUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserId = async () => {
      try {
        let storedUserId: string | null = null;

        if (typeof window !== 'undefined') {
          // Web 平台使用 localStorage
          const userStr = localStorage.getItem('user');
          if (userStr) {
            const user = JSON.parse(userStr);
            storedUserId = user.id?.toString();
          }
        } else {
          // 移动端使用 AsyncStorage
          const userStr = await AsyncStorage.getItem('user');
          if (userStr) {
            const user = JSON.parse(userStr);
            storedUserId = user.id?.toString();
          }
        }

        setUserId(storedUserId ? parseInt(storedUserId) : null);
      } catch (error) {
        console.error('[权限Hook] 获取用户ID错误:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserId();
  }, []);

  const permissionsHook = usePermissions(userId);

  return {
    ...permissionsHook,
    loading: loading || permissionsHook.loading,
  };
}
