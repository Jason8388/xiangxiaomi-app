import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { PCLayout } from '@/components/pc/PCLayout';
import { FontAwesome6 } from '@expo/vector-icons';
import { storage } from '@/utils/storage';
import { getApiBaseUrl } from '@/utils/api';

interface User {
  id: number;
  username: string;
  name: string;
  role: string;
  position?: string;
  department_id?: number;
  department_name?: string;
  is_disabled: boolean;
  disabled_at?: string;
  disabled_reason?: string;
  created_at: string;
}

interface Department {
  id: number;
  name: string;
  code: string;
  children?: Department[];
}

interface DepartmentWithUsers extends Department {
  users?: User[];
}

export default function PCEmployeeManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<DepartmentWithUsers[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // 新增员工状态
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    username: '',
    name: '',
    password: '',
    phone: '',
    position: '',
    department_id: null as number | null,
    department_name: '',
  });

  // 部门选择状态
  const [departmentSelectorVisible, setDepartmentSelectorVisible] = useState(false);
  const [flatDepartments, setFlatDepartments] = useState<{ id: number; name: string; level: number }[]>([]);

  // 编辑状态
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editPosition, setEditPosition] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editDepartmentId, setEditDepartmentId] = useState<number | null>(null);
  const [editDepartmentName, setEditDepartmentName] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editDeptSelectorVisible, setEditDeptSelectorVisible] = useState(false);

  // 禁用状态
  const [disableModalVisible, setDisableModalVisible] = useState(false);
  const [disableReason, setDisableReason] = useState('');

  // 加载当前登录用户信息
  const loadUserData = async () => {
    try {
      const sessionId = await storage.getItem('session_id');
      if (!sessionId) return;

      const response = await fetch(`${getApiBaseUrl()}/api/v1/users/me`, {
        headers: { Authorization: `Bearer ${sessionId}` },
      });
      const data = await response.json();
      if (response.ok) {
        setCurrentUser(data);
      }
    } catch (error) {
      console.error('Load user error:', error);
    }
  };

  // 加载数据函数
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const sessionId = await storage.getItem('session_id');
      if (!sessionId) {
        setError('未登录');
        return;
      }

      // 并行加载用户和部门数据（包括禁用的用户，用于显示禁用状态）
      const [usersRes, deptsRes] = await Promise.all([
        fetch(`${getApiBaseUrl()}/api/v1/users?include_disabled=true`, {
          headers: { Authorization: `Bearer ${sessionId}` },
        }),
        fetch(`${getApiBaseUrl()}/api/v1/departments`, {
          headers: { Authorization: `Bearer ${sessionId}` },
        }),
      ]);

      const usersData = await usersRes.json();
      const deptsData = await deptsRes.json();

      if (usersRes.ok) {
        setUsers(Array.isArray(usersData) ? usersData : []);
      } else {
        setError(usersData.error || '获取员工列表失败');
      }

      if (deptsRes.ok && Array.isArray(deptsData)) {
        // 将部门树扁平化用于选择
        const flattenDepts = (depts: Department[], level: number = 0): { id: number; name: string; level: number }[] => {
          let result: { id: number; name: string; level: number }[] = [];
          depts.forEach((dept) => {
            result.push({
              id: dept.id,
              name: dept.name,
              level,
            });
            if (dept.children && dept.children.length > 0) {
              result = result.concat(flattenDepts(dept.children, level + 1));
            }
          });
          return result;
        };

        setFlatDepartments(flattenDepts(deptsData));

        // 构建带用户的部门树
        const users = Array.isArray(usersData) ? usersData : [];
        const assignUsersToDepts = (depts: Department[]): DepartmentWithUsers[] => {
          return depts.map((dept) => {
            const deptUsers = users.filter((u: User) => u.department_id === dept.id);
            return {
              ...dept,
              users: deptUsers,
              children: dept.children ? assignUsersToDepts(dept.children) : [],
            };
          });
        };
        setDepartments(assignUsersToDepts(deptsData));
      }
    } catch (error) {
      console.error('Load data error:', error);
      setError('网络连接失败，请检查网络后重试');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUserData();
    loadData();
  }, [loadData]);

  const handleAddEmployee = () => {
    setNewEmployee({
      username: '',
      name: '',
      password: '',
      phone: '',
      position: '',
      department_id: null,
      department_name: '',
    });
    setAddModalVisible(true);
  };

  const handleSelectDepartment = (dept: { id: number; name: string }) => {
    setNewEmployee({
      ...newEmployee,
      department_id: dept.id,
      department_name: dept.name,
    });
    setDepartmentSelectorVisible(false);
  };

  const handleSaveNewEmployee = async () => {
    if (!newEmployee.username || !newEmployee.name || !newEmployee.password) {
      Alert.alert('提示', '用户名、姓名和密码不能为空');
      return;
    }

    if (newEmployee.password.length < 6) {
      Alert.alert('提示', '密码长度至少6位');
      return;
    }

    if (!newEmployee.phone) {
      Alert.alert('提示', '手机号码不能为空');
      return;
    }

    if (!/^1[3-9]\d{9}$/.test(newEmployee.phone)) {
      Alert.alert('提示', '请输入正确的手机号码');
      return;
    }

    try {
      const sessionId = await storage.getItem('session_id');
      const response = await fetch(`${getApiBaseUrl()}/api/v1/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionId}`,
        },
        body: JSON.stringify({
          username: newEmployee.username,
          password: newEmployee.password,
          name: newEmployee.name,
          phone: newEmployee.phone,
          position: newEmployee.position,
          department_id: newEmployee.department_id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '创建失败');
      }

      Alert.alert('成功', '员工创建成功');
      setAddModalVisible(false);
      loadData();
    } catch (error: any) {
      Alert.alert('错误', error.message);
    }
  };

  const handleEditUser = (userItem: User) => {
    setSelectedUser(userItem);
    setEditPosition(userItem.position || '');
    setEditPhone(userItem.phone || '');
    setEditDepartmentId(userItem.department_id || null);
    setEditDepartmentName(userItem.department_name || '');
    setEditPassword('');
    setEditModalVisible(true);
  };

  const handleSelectEditDepartment = (dept: { id: number; name: string }) => {
    setEditDepartmentId(dept.id);
    setEditDepartmentName(dept.name);
    setEditDeptSelectorVisible(false);
  };

  const handleSaveUser = async () => {
    if (!editPosition.trim()) {
      Alert.alert('提示', '岗位名称不能为空');
      return;
    }

    if (!editPhone.trim()) {
      Alert.alert('提示', '电话号码不能为空');
      return;
    }

    if (!/^1[3-9]\d{9}$/.test(editPhone)) {
      Alert.alert('提示', '请输入正确的手机号码');
      return;
    }

    if (editPassword && editPassword.length < 6) {
      Alert.alert('提示', '密码长度至少6位');
      return;
    }

    try {
      const sessionId = await storage.getItem('session_id');
      const updateData: any = {
        position: editPosition.trim(),
        phone: editPhone.trim(),
        department_id: editDepartmentId,
        operator_id: currentUser?.id,
      };

      if (editPassword && editPassword.trim()) {
        updateData.password = editPassword.trim();
      }

      const response = await fetch(
        `${getApiBaseUrl()}/api/v1/users/${selectedUser?.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${sessionId}`,
          },
          body: JSON.stringify(updateData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '更新失败');
      }

      Alert.alert('成功', '账号信息更新成功');
      setEditModalVisible(false);
      loadData();
    } catch (error: any) {
      Alert.alert('错误', error.message);
    }
  };

  const handleToggleDisable = (userItem: User) => {
    setSelectedUser(userItem);
    if (userItem.is_disabled) {
      Alert.alert(
        '确认启用',
        `确定要启用员工 ${userItem.name} 的账号吗？`,
        [
          { text: '取消', style: 'cancel' },
          {
            text: '确定',
            onPress: () => executeDisableUser(userItem, false, ''),
          },
        ]
      );
    } else {
      setDisableReason('');
      setDisableModalVisible(true);
    }
  };

  const executeDisableUser = async (userItem: User, disable: boolean, reason: string) => {
    try {
      const sessionId = await storage.getItem('session_id');
      const response = await fetch(
        `${getApiBaseUrl()}/api/v1/users/${userItem.id}/disable`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${sessionId}`,
          },
          body: JSON.stringify({
            is_disabled: disable,
            disabled_reason: disable ? reason : undefined,
            operator_id: currentUser?.id,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '操作失败');
      }

      Alert.alert('成功', disable ? '账号已禁用' : '账号已启用');
      setDisableModalVisible(false);
      loadData();
    } catch (error: any) {
      Alert.alert('错误', error.message);
    }
  };

  const handleDeleteUser = (userItem: User) => {
    Alert.alert('确认删除', `确定要删除员工 ${userItem.name} 吗？此操作不可恢复。`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            const sessionId = await storage.getItem('session_id');
            const response = await fetch(
              `${getApiBaseUrl()}/api/v1/users/${userItem.id}`,
              {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${sessionId}` },
              }
            );

            if (response.ok) {
              Alert.alert('成功', '删除成功');
              loadData();
            } else {
              const data = await response.json();
              throw new Error(data.error || '删除失败');
            }
          } catch (error: any) {
            Alert.alert('错误', error.message);
          }
        },
      },
    ]);
  };

  // 渲染部门树
  const renderDepartmentTree = (depts: DepartmentWithUsers[], level: number = 0) => {
    return depts.map((dept) => (
      <View key={dept.id} style={[styles.departmentItem, { marginLeft: level * 24 }]}>
        <View style={styles.departmentHeader}>
          <FontAwesome6 name="folder" size={16} color="#F39C12" />
          <Text style={styles.departmentName}>{dept.name}</Text>
          {dept.users && dept.users.length > 0 && (
            <Text style={styles.userCount}>({dept.users.length})</Text>
          )}
        </View>

        {dept.users && dept.users.length > 0 && (
          <View style={styles.usersList}>
            {dept.users.map((userItem) => renderUserCard(userItem))}
          </View>
        )}

        {dept.children && dept.children.length > 0 && renderDepartmentTree(dept.children, level + 1)}
      </View>
    ));
  };

  // 渲染用户卡片
  const renderUserCard = (userItem: User) => {
    return (
      <View key={userItem.id} style={styles.userCard}>
        <View style={styles.userCardLeft}>
          <FontAwesome6 name="user" size={20} color="#3498DB" />
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{userItem.name}</Text>
            <Text style={styles.userMeta}>
              {userItem.position || '未设置岗位'} · {userItem.username}
            </Text>
          </View>
          {userItem.is_disabled && (
            <View style={styles.disabledBadge}>
              <FontAwesome6 name="ban" size={12} color="#FF6B6B" />
              <Text style={styles.disabledText}>已禁用</Text>
            </View>
          )}
        </View>

        <View style={styles.userCardActions}>
          <TouchableOpacity style={styles.actionButton} onPress={() => handleEditUser(userItem)}>
            <FontAwesome6 name="pen" size={14} color="#F39C12" />
            <Text style={styles.actionButtonText}>修改</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleToggleDisable(userItem)}
          >
            <FontAwesome6
              name={userItem.is_disabled ? 'check' : 'ban'}
              size={14}
              color={userItem.is_disabled ? '#2ECC71' : '#E74C3C'}
            />
            <Text style={[styles.actionButtonText, { color: userItem.is_disabled ? '#2ECC71' : '#E74C3C' }]}>
              {userItem.is_disabled ? '启用' : '禁用'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => handleDeleteUser(userItem)}>
            <FontAwesome6 name="trash" size={14} color="#E74C3C" />
            <Text style={[styles.actionButtonText, { color: '#E74C3C' }]}>删除</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const content = (
    <View style={styles.container}>
      {/* 顶部操作栏 */}
      <View style={styles.topBar}>
        <Text style={styles.pageTitle}>账号管理</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddEmployee}>
          <FontAwesome6 name="user-plus" size={16} color="#FFFFFF" />
          <Text style={styles.addButtonText}>新增员工</Text>
        </TouchableOpacity>
      </View>

      {/* 内容区域 */}
      <ScrollView style={styles.content}>
        {loading ? (
          <View style={styles.centerContainer}>
            <Text style={styles.loadingText}>加载中...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => loadData()}>
              <Text style={styles.retryButtonText}>重新加载</Text>
            </TouchableOpacity>
          </View>
        ) : departments.length === 0 && users.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>暂无数据</Text>
          </View>
        ) : (
          <>
            {/* 未分配部门的员工 */}
            {users.filter((u) => !u.department_id).length > 0 && (
              <View style={styles.departmentItem}>
                <View style={styles.departmentHeader}>
                  <FontAwesome6 name="folder-open" size={16} color="#95A5A6" />
                  <Text style={styles.departmentName}>未分配部门</Text>
                  <Text style={styles.userCount}>
                    ({users.filter((u) => !u.department_id).length})
                  </Text>
                </View>
                <View style={styles.usersList}>
                  {users.filter((u) => !u.department_id).map((userItem) => renderUserCard(userItem))}
                </View>
              </View>
            )}

            {/* 部门树 */}
            {renderDepartmentTree(departments)}
          </>
        )}
      </ScrollView>

      {/* 新增员工 Modal */}
      <Modal visible={addModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>新增员工</Text>
              <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                <FontAwesome6 name="times" size={20} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>用户名 *</Text>
              <TextInput
                style={styles.input}
                value={newEmployee.username}
                onChangeText={(text) => setNewEmployee({ ...newEmployee, username: text })}
                placeholder="请输入用户名"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>姓名 *</Text>
              <TextInput
                style={styles.input}
                value={newEmployee.name}
                onChangeText={(text) => setNewEmployee({ ...newEmployee, name: text })}
                placeholder="请输入姓名"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>密码 *</Text>
              <TextInput
                style={styles.input}
                value={newEmployee.password}
                onChangeText={(text) => setNewEmployee({ ...newEmployee, password: text })}
                placeholder="请输入密码（至少6位）"
                secureTextEntry
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>手机号码 *</Text>
              <TextInput
                style={styles.input}
                value={newEmployee.phone}
                onChangeText={(text) => setNewEmployee({ ...newEmployee, phone: text })}
                placeholder="请输入手机号码"
                keyboardType="phone-pad"
                maxLength={11}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>岗位</Text>
              <TextInput
                style={styles.input}
                value={newEmployee.position}
                onChangeText={(text) => setNewEmployee({ ...newEmployee, position: text })}
                placeholder="请输入岗位名称"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>归属部门</Text>
              <TouchableOpacity
                style={styles.departmentSelector}
                onPress={() => setDepartmentSelectorVisible(true)}
              >
                <Text style={newEmployee.department_name ? styles.departmentSelectorText : styles.departmentSelectorPlaceholder}>
                  {newEmployee.department_name || '请选择部门'}
                </Text>
                <FontAwesome6 name="chevron-down" size={14} color="#95A5A6" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setAddModalVisible(false)}
              >
                <Text style={styles.modalButtonTextCancel}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handleSaveNewEmployee}
              >
                <Text style={styles.modalButtonTextConfirm}>创建</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 部门选择 Modal */}
      <Modal visible={departmentSelectorVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>选择部门</Text>
              <TouchableOpacity onPress={() => setDepartmentSelectorVisible(false)}>
                <FontAwesome6 name="times" size={20} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.departmentList}>
              {flatDepartments.map((dept) => (
                <TouchableOpacity
                  key={dept.id}
                  style={[styles.departmentOption, { marginLeft: dept.level * 16 }]}
                  onPress={() => handleSelectDepartment(dept)}
                >
                  <FontAwesome6 name="folder" size={16} color="#F39C12" />
                  <Text style={styles.departmentOptionText}>{dept.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 编辑账号 Modal */}
      <Modal visible={editModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>修改账号信息</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <FontAwesome6 name="times" size={20} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>岗位名称</Text>
              <TextInput
                style={styles.input}
                value={editPosition}
                onChangeText={setEditPosition}
                placeholder="请输入岗位名称"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>部门</Text>
              <TouchableOpacity
                style={styles.departmentSelector}
                onPress={() => setEditDeptSelectorVisible(true)}
              >
                <Text style={editDepartmentName ? styles.departmentSelectorText : styles.departmentSelectorPlaceholder}>
                  {editDepartmentName || '请选择部门'}
                </Text>
                <FontAwesome6 name="chevron-down" size={14} color="#95A5A6" />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>电话号码</Text>
              <TextInput
                style={styles.input}
                value={editPhone}
                onChangeText={setEditPhone}
                placeholder="请输入电话号码"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>新密码</Text>
              <TextInput
                style={styles.input}
                value={editPassword}
                onChangeText={setEditPassword}
                placeholder="留空则不修改密码"
                secureTextEntry
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.modalButtonTextCancel}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handleSaveUser}
              >
                <Text style={styles.modalButtonTextConfirm}>保存</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 编辑-部门选择 Modal */}
      <Modal visible={editDeptSelectorVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>选择部门</Text>
              <TouchableOpacity onPress={() => setEditDeptSelectorVisible(false)}>
                <FontAwesome6 name="times" size={20} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.departmentList}>
              {flatDepartments.map((dept) => (
                <TouchableOpacity
                  key={dept.id}
                  style={[styles.departmentOption, { marginLeft: dept.level * 16 }]}
                  onPress={() => handleSelectEditDepartment(dept)}
                >
                  <FontAwesome6 name="folder" size={16} color="#F39C12" />
                  <Text style={styles.departmentOptionText}>{dept.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 禁用账号 Modal */}
      <Modal visible={disableModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>禁用账号</Text>
              <TouchableOpacity onPress={() => setDisableModalVisible(false)}>
                <FontAwesome6 name="times" size={20} color="#666" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalDescription}>
              确定要禁用员工 {selectedUser?.name} 的账号吗？禁用后该员工将无法登录系统。
            </Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>禁用原因 *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={disableReason}
                onChangeText={setDisableReason}
                placeholder="请输入禁用原因"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setDisableModalVisible(false)}
              >
                <Text style={styles.modalButtonTextCancel}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonDanger]}
                onPress={() => selectedUser && executeDisableUser(selectedUser, true, disableReason)}
              >
                <Text style={styles.modalButtonTextConfirm}>禁用</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );

  return <PCLayout>{content}</PCLayout>;
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },
  topBar: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    padding: '16px',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: '#1A1A1A',
  },
  addButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    gap: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500' as const,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  centerContainer: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
  },
  errorText: {
    fontSize: 14,
    color: '#E74C3C',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#007AFF',
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  departmentItem: {
    marginBottom: 16,
  },
  departmentHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    gap: 8,
  },
  departmentName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#333',
  },
  userCount: {
    fontSize: 13,
    color: '#666',
  },
  usersList: {
    marginTop: 8,
    gap: 8,
  },
  userCard: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginLeft: 16,
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)' as any,
  },
  userCardLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
  },
  userInfo: {
    gap: 4,
  },
  userName: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: '#333',
  },
  userMeta: {
    fontSize: 13,
    color: '#666',
  },
  disabledBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#FFF0F0',
    borderRadius: 4,
    gap: 4,
  },
  disabledText: {
    fontSize: 12,
    color: '#FF6B6B',
  },
  userCardActions: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  actionButtonText: {
    fontSize: 13,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#333',
  },
  modalDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 22,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    fontWeight: '500' as const,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#FAFAFA',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top' as const,
  },
  departmentSelector: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FAFAFA',
  },
  departmentSelectorText: {
    fontSize: 14,
    color: '#333',
  },
  departmentSelectorPlaceholder: {
    fontSize: 14,
    color: '#999',
  },
  modalButtons: {
    flexDirection: 'row' as const,
    justifyContent: 'flex-end' as const,
    gap: 12,
    marginTop: 24,
  },
  modalButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center' as const,
  },
  modalButtonCancel: {
    backgroundColor: '#F5F5F5',
  },
  modalButtonConfirm: {
    backgroundColor: '#007AFF',
  },
  modalButtonDanger: {
    backgroundColor: '#E74C3C',
  },
  modalButtonTextCancel: {
    fontSize: 14,
    color: '#666',
  },
  modalButtonTextConfirm: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500' as const,
  },
  departmentList: {
    maxHeight: 300,
  },
  departmentOption: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    gap: 8,
  },
  departmentOptionText: {
    fontSize: 14,
    color: '#333',
  },
};
