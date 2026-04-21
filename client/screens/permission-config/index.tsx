import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Screen } from '@/components/Screen';
import { Button } from '@/components/Button';
import { getApiBaseUrl } from '@/utils/api';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { FontAwesome6 } from '@expo/vector-icons';

// 支持的模块配置
const MODULES = [
  { key: 'customer', name: '客户管理', icon: 'users' },
  { key: 'contract', name: '合同管理', icon: 'file-contract' },
  { key: 'device', name: '设备管理', icon: 'wrench' },
  { key: 'work_order', name: '工单管理', icon: 'clipboard-list' },
  { key: 'meeting_minute', name: '会议纪要', icon: 'clipboard-text' },
  { key: 'file', name: '文件管理', icon: 'folder' },
  { key: 'knowledge', name: '知识库', icon: 'book' },
] as const;

export type ModuleName = typeof MODULES[number]['key'];
export type PermissionType = 'view' | 'edit' | 'add' | 'delete';

interface PermissionSet {
  view: boolean;
  edit: boolean;
  add: boolean;
  delete: boolean;
}

interface Permissions {
  [key: string]: PermissionSet;
}

export default function PermissionConfig() {
  const router = useSafeRouter();
  const { userId, userName } = useSafeSearchParams<{ userId: string; userName: string }>();
  const [permissions, setPermissions] = useState<Permissions>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 加载用户权限
  useEffect(() => {
    if (userId) {
      loadPermissions();
    }
  }, [userId]);

  const loadPermissions = async () => {
    try {
      setLoading(true);
      console.log('[权限配置] 加载用户权限:', userId);

      const response = await fetch(`${getApiBaseUrl()}/api/v1/permissions/users/${userId}`);
      const data = await response.json();

      console.log('[权限配置] 权限数据:', data);

      if (response.ok && data.permissions) {
        setPermissions(data.permissions);
      } else {
        Alert.alert('错误', '加载权限失败');
      }
    } catch (error) {
      console.error('[权限配置] 加载权限错误:', error);
      Alert.alert('错误', '加载权限失败');
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (moduleName: ModuleName, permissionType: PermissionType) => {
    console.log(`[权限配置] 切换权限: ${moduleName}.${permissionType}`);

    setPermissions(prev => ({
      ...prev,
      [moduleName]: {
        ...prev[moduleName],
        [permissionType]: !prev[moduleName]?.[permissionType],
      },
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      console.log('[权限配置] 保存权限:', permissions);

      const response = await fetch(`${getApiBaseUrl()}/api/v1/permissions/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions }),
      });

      const data = await response.json();

      console.log('[权限配置] 保存响应:', data);

      if (response.ok) {
        Alert.alert('成功', '权限保存成功', [
          {
            text: '确定',
            onPress: () => router.back(),
          },
        ]);
      } else {
        Alert.alert('错误', data.error || '保存权限失败');
      }
    } catch (error) {
      console.error('[权限配置] 保存权限错误:', error);
      Alert.alert('错误', '保存权限失败');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Screen>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.container}>
        {/* 标题 */}
        <View style={styles.header}>
          <Text style={styles.title}>账号权限配置</Text>
          <Text style={styles.subtitle}>用户：{userName || `ID: ${userId}`}</Text>
        </View>

        {/* 权限列表 */}
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {MODULES.map((module) => (
            <View key={module.key} style={styles.moduleCard}>
              {/* 模块标题 */}
              <View style={styles.moduleHeader}>
                <FontAwesome6 name={module.icon as any} size={20} color="#007AFF" />
                <Text style={styles.moduleTitle}>{module.name}</Text>
              </View>

              {/* 权限开关 */}
              <View style={styles.permissionsContainer}>
                <PermissionSwitch
                  label="可查看"
                  value={permissions[module.key]?.view || false}
                  onValueChange={() => togglePermission(module.key, 'view')}
                />
                <PermissionSwitch
                  label="可编辑"
                  value={permissions[module.key]?.edit || false}
                  onValueChange={() => togglePermission(module.key, 'edit')}
                />
                <PermissionSwitch
                  label="可新增"
                  value={permissions[module.key]?.add || false}
                  onValueChange={() => togglePermission(module.key, 'add')}
                />
                <PermissionSwitch
                  label="可删除"
                  value={permissions[module.key]?.delete || false}
                  onValueChange={() => togglePermission(module.key, 'delete')}
                />
              </View>
            </View>
          ))}
        </ScrollView>

        {/* 底部按钮 */}
        <View style={styles.footer}>
          <Button
            title="保存"
            onPress={handleSave}
            loading={saving}
            disabled={saving}
            style={styles.saveButton}
          />
        </View>
      </View>
    </Screen>
  );
}

// 权限开关组件
interface PermissionSwitchProps {
  label: string;
  value: boolean;
  onValueChange: () => void;
}

function PermissionSwitch({ label, value, onValueChange }: PermissionSwitchProps) {
  return (
    <TouchableOpacity style={styles.permissionSwitch} onPress={onValueChange} activeOpacity={0.7}>
      <Text style={styles.permissionLabel}>{label}</Text>
      <View style={[styles.switchContainer, value ? styles.switchContainerOn : styles.switchContainerOff]}>
        <View style={[styles.switchDot, value ? styles.switchDotOn : styles.switchDotOff]} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    marginTop: 5,
  },
  scrollContainer: {
    flex: 1,
    padding: 15,
  },
  moduleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  moduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  moduleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginLeft: 10,
  },
  permissionsContainer: {
    gap: 12,
  },
  permissionSwitch: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  permissionLabel: {
    fontSize: 14,
    color: '#555555',
  },
  switchContainer: {
    width: 50,
    height: 28,
    borderRadius: 14,
    padding: 3,
    justifyContent: 'center',
    transition: 'background-color 0.3s',
  },
  switchContainerOn: {
    backgroundColor: '#007AFF',
  },
  switchContainerOff: {
    backgroundColor: '#CCCCCC',
  },
  switchDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    position: 'absolute',
    transition: 'left 0.3s',
  },
  switchDotOn: {
    backgroundColor: '#FFFFFF',
    left: 25,
  },
  switchDotOff: {
    backgroundColor: '#FFFFFF',
    left: 3,
  },
  footer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  saveButton: {
    marginTop: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666666',
  },
});
