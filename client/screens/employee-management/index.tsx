import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, TextInput, Modal, StyleSheet } from 'react-native';
import { Screen } from '@/components/Screen';
import { PageHeader } from '@/components/PageHeader';
import { FontAwesome6 } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';

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
}

export default function EmployeeManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // 筛选状态
  const [filterRole, setFilterRole] = useState<string | null>(null);
  const [filterDepartment, setFilterDepartment] = useState<number | null>(null);

  // 编辑状态
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editPosition, setEditPosition] = useState('');
  const [editDepartmentId, setEditDepartmentId] = useState<number | null>(null);

  // 禁用状态
  const [disableModalVisible, setDisableModalVisible] = useState(false);
  const [disableReason, setDisableReason] = useState('');
  const [isDisabling, setIsDisabling] = useState(false);

  // 重置密码状态
  const [resetPasswordModalVisible, setResetPasswordModalVisible] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    loadUserData();
    fetchUsers();
    fetchDepartments();
  }, []);

  const loadUserData = async () => {
    try {
      const userStr = await SecureStore.getItemAsync('user');
      if (userStr) {
        setUser(JSON.parse(userStr));
      }
    } catch (error) {
      console.error('Load user error:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      let url = `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/users`;
      const params = new URLSearchParams();

      if (filterRole) params.append('role', filterRole);
      if (filterDepartment) params.append('department_id', filterDepartment.toString());

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (response.ok) {
        setUsers(data);
      }
    } catch (error) {
      console.error('Fetch users error:', error);
      Alert.alert('错误', '获取员工列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/users/departments/list`);
      const data = await response.json();

      if (response.ok) {
        setDepartments(data);
      }
    } catch (error) {
      console.error('Fetch departments error:', error);
    }
  };

  const handleEditUser = (userItem: User) => {
    setSelectedUser(userItem);
    setEditPosition(userItem.position || '');
    setEditDepartmentId(userItem.department_id || null);
    setEditModalVisible(true);
  };

  const handleSavePosition = async () => {
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/users/${selectedUser?.id}/position`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            position: editPosition,
            department_id: editDepartmentId,
            operator_id: user?.id,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '更新失败');
      }

      Alert.alert('成功', data.message);
      setEditModalVisible(false);
      fetchUsers();
    } catch (error: any) {
      Alert.alert('错误', error.message);
    }
  };

  const handleToggleDisable = (userItem: User) => {
    setSelectedUser(userItem);
    if (userItem.is_disabled) {
      // 启用账号
      Alert.alert(
        '确认启用',
        `确定要启用员工 ${userItem.name} 的账号吗？`,
        [
          { text: '取消', style: 'cancel' },
          {
            text: '确定',
            onPress: () => executeDisableUser(false, ''),
          },
        ]
      );
    } else {
      // 禁用账号
      setDisableReason('');
      setDisableModalVisible(true);
      setIsDisabling(true);
    }
  };

  const executeDisableUser = async (disable: boolean, reason: string) => {
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/users/${selectedUser?.id}/disable`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            is_disabled: disable,
            disabled_reason: disable ? reason : undefined,
            operator_id: user?.id,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '操作失败');
      }

      Alert.alert('成功', data.message);
      setDisableModalVisible(false);
      fetchUsers();
    } catch (error: any) {
      Alert.alert('错误', error.message);
    }
  };

  const handleResetPassword = (userItem: User) => {
    setSelectedUser(userItem);
    setNewPassword('');
    setConfirmPassword('');
    setResetPasswordModalVisible(true);
  };

  const executeResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      Alert.alert('提示', '密码长度至少6位');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('提示', '两次输入的密码不一致');
      return;
    }

    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/users/${selectedUser?.id}/reset-password`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            new_password: newPassword,
            operator_id: user?.id,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '重置失败');
      }

      Alert.alert('成功', data.message);
      setResetPasswordModalVisible(false);
    } catch (error: any) {
      Alert.alert('错误', error.message);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return '#FF6B6B';
      case 'manager':
        return '#4ECDC4';
      default:
        return '#95A5A6';
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin':
        return '管理员';
      case 'manager':
        return '经理';
      case 'staff':
        return '员工';
      default:
        return role;
    }
  };

  return (
    <Screen>
      <PageHeader title="员工管理" />

      <View style={styles.filterContainer}>
        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>角色</Text>
          <View style={styles.filterScrollContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterScroll}
            >
              <TouchableOpacity
                style={[styles.filterChip, filterRole === null && styles.filterChipActive]}
                onPress={() => {
                  setFilterRole(null);
                  setTimeout(fetchUsers, 100);
                }}
              >
                <Text style={[styles.filterChipText, filterRole === null && styles.filterChipTextActive]}>
                  全部
                </Text>
              </TouchableOpacity>
              {['admin', 'manager', 'staff'].map((role) => (
                <TouchableOpacity
                  key={role}
                  style={[styles.filterChip, filterRole === role && styles.filterChipActive]}
                  onPress={() => {
                    setFilterRole(role);
                    setTimeout(fetchUsers, 100);
                  }}
                >
                  <Text
                    style={[styles.filterChipText, filterRole === role && styles.filterChipTextActive]}
                  >
                    {getRoleText(role)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>部门</Text>
          <View style={styles.filterScrollContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterScroll}
            >
              <TouchableOpacity
                style={[styles.filterChip, filterDepartment === null && styles.filterChipActive]}
                onPress={() => {
                  setFilterDepartment(null);
                  setTimeout(fetchUsers, 100);
                }}
              >
                <Text style={[styles.filterChipText, filterDepartment === null && styles.filterChipTextActive]}>
                  全部
                </Text>
              </TouchableOpacity>
              {departments.map((dept) => (
                <TouchableOpacity
                  key={dept.id}
                  style={[styles.filterChip, filterDepartment === dept.id && styles.filterChipActive]}
                  onPress={() => {
                    setFilterDepartment(dept.id);
                    setTimeout(fetchUsers, 100);
                  }}
                >
                  <Text
                    style={[styles.filterChipText, filterDepartment === dept.id && styles.filterChipTextActive]}
                  >
                    {dept.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </View>

      <ScrollView style={styles.listContainer}>
        {loading ? (
          <View style={styles.centerContainer}>
            <Text>加载中...</Text>
          </View>
        ) : users.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>暂无员工数据</Text>
          </View>
        ) : (
          users.map((userItem) => (
            <View key={userItem.id} style={styles.userCard}>
              <View style={styles.userHeader}>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{userItem.name}</Text>
                  <Text style={styles.userUsername}>{userItem.username}</Text>
                </View>
                <View
                  style={[
                    styles.roleBadge,
                    { backgroundColor: getRoleBadgeColor(userItem.role) },
                  ]}
                >
                  <Text style={styles.roleText}>{getRoleText(userItem.role)}</Text>
                </View>
              </View>

              <View style={styles.userDetails}>
                <View style={styles.detailItem}>
                  <FontAwesome6 name="briefcase" size={14} color="#636E72" />
                  <Text style={styles.detailText}>
                    {userItem.position || '未设置'}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <FontAwesome6 name="building" size={14} color="#636E72" />
                  <Text style={styles.detailText}>
                    {userItem.department_name || '未分配'}
                  </Text>
                </View>
              </View>

              {userItem.is_disabled && (
                <View style={styles.disabledInfo}>
                  <FontAwesome6 name="ban" size={14} color="#FF6B6B" />
                  <Text style={styles.disabledText}>账号已禁用</Text>
                  {userItem.disabled_reason && (
                    <Text style={styles.disabledReason}>
                      原因: {userItem.disabled_reason}
                    </Text>
                  )}
                </View>
              )}

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleEditUser(userItem)}
                >
                  <FontAwesome6 name="pen-to-square" size={16} color="#1E88E5" />
                  <Text style={styles.actionButtonText}>编辑</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleResetPassword(userItem)}
                >
                  <FontAwesome6 name="key" size={16} color="#F5A623" />
                  <Text style={styles.actionButtonText}>重置密码</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    userItem.is_disabled && styles.actionButtonEnable,
                  ]}
                  onPress={() => handleToggleDisable(userItem)}
                >
                  <FontAwesome6
                    name={userItem.is_disabled ? 'check' : 'ban'}
                    size={16}
                    color={userItem.is_disabled ? '#2ECC71' : '#FF6B6B'}
                  />
                  <Text
                    style={[
                      styles.actionButtonText,
                      userItem.is_disabled && styles.actionButtonTextEnable,
                    ]}
                  >
                    {userItem.is_disabled ? '启用' : '禁用'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* 编辑岗位和部门弹窗 */}
      <Modal visible={editModalVisible} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>编辑岗位和部门</Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>岗位</Text>
              <TextInput
                style={styles.input}
                value={editPosition}
                onChangeText={setEditPosition}
                placeholder="请输入岗位名称"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>部门</Text>
              <View style={styles.departmentContainer}>
                <TouchableOpacity
                  style={[
                    styles.departmentChip,
                    editDepartmentId === null && styles.departmentChipActive,
                  ]}
                  onPress={() => setEditDepartmentId(null)}
                >
                  <Text
                    style={[
                      styles.departmentChipText,
                      editDepartmentId === null && styles.departmentChipTextActive,
                    ]}
                  >
                    未分配
                  </Text>
                </TouchableOpacity>
                {departments.map((dept) => (
                  <TouchableOpacity
                    key={dept.id}
                    style={[
                      styles.departmentChip,
                      editDepartmentId === dept.id && styles.departmentChipActive,
                    ]}
                    onPress={() => setEditDepartmentId(dept.id)}
                  >
                    <Text
                      style={[
                        styles.departmentChipText,
                        editDepartmentId === dept.id && styles.departmentChipTextActive,
                      ]}
                    >
                      {dept.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
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
                onPress={handleSavePosition}
              >
                <Text style={styles.modalButtonTextConfirm}>保存</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 禁用账号弹窗 */}
      <Modal visible={disableModalVisible} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>禁用账号</Text>
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
                onPress={() => executeDisableUser(true, disableReason)}
              >
                <Text style={styles.modalButtonTextDanger}>确认禁用</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 重置密码弹窗 */}
      <Modal visible={resetPasswordModalVisible} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>重置密码</Text>
            <Text style={styles.modalDescription}>
              为员工 {selectedUser?.name} 设置新密码
            </Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>新密码</Text>
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="请输入新密码（至少6位）"
                secureTextEntry
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>确认密码</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="请再次输入新密码"
                secureTextEntry
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setResetPasswordModalVisible(false)}
              >
                <Text style={styles.modalButtonTextCancel}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={executeResetPassword}
              >
                <Text style={styles.modalButtonTextConfirm}>确认重置</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  filterContainer: {
    padding: 16,
    gap: 12,
  },
  filterGroup: {
    gap: 8,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#636E72',
  },
  filterScrollContainer: {
    overflow: 'hidden' as const,
  },
  filterScroll: {
    flexDirection: 'row',
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F5F7FA',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#1E88E5',
  },
  filterChipText: {
    fontSize: 13,
    color: '#636E72',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  listContainer: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#636E72',
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 4,
  },
  userUsername: {
    fontSize: 13,
    color: '#636E72',
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  userDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    color: '#636E72',
  },
  disabledInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  disabledText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#FF6B6B',
  },
  disabledReason: {
    fontSize: 12,
    color: '#FF6B6B',
    marginLeft: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F5F7FA',
  },
  actionButtonEnable: {
    backgroundColor: 'rgba(46, 204, 113, 0.1)',
  },
  actionButtonText: {
    fontSize: 13,
    color: '#2D3436',
  },
  actionButtonTextEnable: {
    color: '#2ECC71',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 12,
  },
  modalDescription: {
    fontSize: 14,
    color: '#636E72',
    marginBottom: 20,
    lineHeight: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2D3436',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F5F7FA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#2D3436',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  departmentContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  departmentChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F5F7FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  departmentChipActive: {
    backgroundColor: '#1E88E5',
    borderColor: '#1E88E5',
  },
  departmentChipText: {
    fontSize: 13,
    color: '#2D3436',
  },
  departmentChipTextActive: {
    color: '#FFFFFF',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#F5F7FA',
  },
  modalButtonConfirm: {
    backgroundColor: '#1E88E5',
  },
  modalButtonDanger: {
    backgroundColor: '#FF6B6B',
  },
  modalButtonTextCancel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#2D3436',
  },
  modalButtonTextConfirm: {
    fontSize: 15,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  modalButtonTextDanger: {
    fontSize: 15,
    fontWeight: '500',
    color: '#FFFFFF',
  },
});
