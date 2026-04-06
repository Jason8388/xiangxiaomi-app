import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  StyleSheet,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { PageHeader } from '@/components/PageHeader';
import { FontAwesome6 } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { cachedFetch, clearCache } from '@/utils/storage';

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

export default function EmployeeManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<DepartmentWithUsers[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  // 新增员工状态
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    username: '',
    name: '',
    password: '',
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

  // 禁用状态
  const [disableModalVisible, setDisableModalVisible] = useState(false);
  const [disableReason, setDisableReason] = useState('');

  useEffect(() => {
    loadUserData();
    Promise.all([
      cachedFetch('users-list', fetchUsers, 'medium'),
      cachedFetch('departments-list', fetchDepartments, 'medium'),
    ]);
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

  const fetchUsers = async (): Promise<User[]> => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/users`);
      const data = await response.json();

      if (response.ok) {
        setUsers(data);
        return data;
      } else {
        setError(data.error || '获取员工列表失败');
        Alert.alert('错误', data.error || '获取员工列表失败');
        return [];
      }
    } catch (error) {
      console.error('Fetch users error:', error);
      setError('网络连接失败，请检查网络后重试');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async (): Promise<Department[]> => {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/departments`);
      const data = await response.json();

      if (response.ok) {
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

        setFlatDepartments(flattenDepts(data));

        // 将用户分配到部门，构建树形结构
        const assignUsersToDepts = (depts: Department[]): DepartmentWithUsers[] => {
          return depts.map((dept) => {
            const deptUsers = users.filter((u) => u.department_id === dept.id);
            return {
              ...dept,
              users: deptUsers,
              children: dept.children ? assignUsersToDepts(dept.children) : [],
            };
          });
        };

        setDepartments(assignUsersToDepts(data));
      }
    } catch (error) {
      console.error('Fetch departments error:', error);
    }
  };

  useEffect(() => {
    fetchDepartments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users]);

  const handleAddEmployee = () => {
    setNewEmployee({
      username: '',
      name: '',
      password: '',
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

    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: newEmployee.username,
          password: newEmployee.password,
          name: newEmployee.name,
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
      clearCache('users-list');
      fetchUsers();
    } catch (error: any) {
      Alert.alert('错误', error.message);
    }
  };

  const handleEditUser = (userItem: User) => {
    setSelectedUser(userItem);
    setEditPosition(userItem.position || '');
    setEditModalVisible(true);
  };

  const handleSavePosition = async () => {
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/users/${selectedUser?.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            position: editPosition,
            operator_id: user?.id,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '更新失败');
      }

      Alert.alert('成功', '更新成功');
      setEditModalVisible(false);
      clearCache('users-list');
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
            onPress: () => executeDisableUser(userItem, false, ''),
          },
        ]
      );
    } else {
      // 禁用账号
      setDisableReason('');
      setDisableModalVisible(true);
    }
  };

  const executeDisableUser = async (userItem: User, disable: boolean, reason: string) => {
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/users/${userItem.id}/disable`,
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

      Alert.alert('成功', disable ? '账号已禁用' : '账号已启用');
      setDisableModalVisible(false);
      clearCache('users-list');
      fetchUsers();
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
            const response = await fetch(
              `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/users/${userItem.id}`,
              {
                method: 'DELETE',
              }
            );

            if (response.ok) {
              Alert.alert('成功', '删除成功');
              clearCache('users-list');
              fetchUsers();
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
      <View key={dept.id} style={[styles.departmentItem, { marginLeft: level * 16 }]}>
        <View style={styles.departmentHeader}>
          <FontAwesome6 name="folder" size={16} color="#F39C12" />
          <Text style={styles.departmentName}>{dept.name}</Text>
          {dept.users && dept.users.length > 0 && (
            <Text style={styles.userCount}>({dept.users.length})</Text>
          )}
        </View>

        {/* 渲染该部门下的员工 */}
        {dept.users && dept.users.length > 0 && (
          <View style={styles.usersList}>
            {dept.users.map((userItem) => renderUserCard(userItem))}
          </View>
        )}

        {/* 递归渲染子部门 */}
        {dept.children && dept.children.length > 0 && renderDepartmentTree(dept.children, level + 1)}
      </View>
    ));
  };

  // 渲染用户卡片
  const renderUserCard = (userItem: User) => {
    return (
      <View key={userItem.id} style={styles.userCard}>
        <View style={styles.userContent}>
          <FontAwesome6 name="user" size={18} color="#3498DB" />
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{userItem.name}</Text>
            <Text style={styles.userPosition}>{userItem.position || '未设置岗位'}</Text>
          </View>
        </View>

        {userItem.is_disabled && (
          <View style={styles.disabledBadge}>
            <FontAwesome6 name="ban" size={12} color="#FF6B6B" />
            <Text style={styles.disabledText}>已禁用</Text>
          </View>
        )}

        <View style={styles.actionButtons}>
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
            <Text style={styles.actionButtonText}>{userItem.is_disabled ? '启用' : '禁用'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => handleDeleteUser(userItem)}>
            <FontAwesome6 name="trash" size={14} color="#E74C3C" />
            <Text style={styles.actionButtonText}>删除</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <Screen>
      <PageHeader title="账号管理" />

      {/* 新增员工按钮 */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.addButton} onPress={handleAddEmployee}>
          <FontAwesome6 name="user-plus" size={16} color="#FFFFFF" />
          <Text style={styles.addButtonText}>新增员工</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {loading ? (
          <View style={styles.centerContainer}>
            <Text>加载中...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => cachedFetch('users-list', fetchUsers, 'short')}
            >
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
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>新增员工</Text>

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

      {/* 编辑岗位 Modal */}
      <Modal visible={editModalVisible} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>修改岗位</Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>岗位</Text>
              <TextInput
                style={styles.input}
                value={editPosition}
                onChangeText={setEditPosition}
                placeholder="请输入岗位名称"
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
                onPress={handleSavePosition}
              >
                <Text style={styles.modalButtonTextConfirm}>保存</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 禁用账号 Modal */}
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
                onPress={() => selectedUser && executeDisableUser(selectedUser, true, disableReason)}
              >
                <Text style={styles.modalButtonTextDanger}>确认禁用</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 部门选择 Modal */}
      <Modal visible={departmentSelectorVisible} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>选择部门</Text>

            <ScrollView style={styles.departmentList}>
              {flatDepartments.length === 0 ? (
                <View style={styles.centerContainer}>
                  <Text style={styles.emptyText}>暂无部门数据</Text>
                </View>
              ) : (
                flatDepartments.map((dept) => (
                  <TouchableOpacity
                    key={dept.id}
                    style={[
                      styles.departmentSelectorItem,
                      newEmployee.department_id === dept.id && styles.departmentSelectorItemSelected,
                    ]}
                    onPress={() => handleSelectDepartment(dept)}
                  >
                    <View style={{ marginLeft: dept.level * 16 }}>
                      <Text
                        style={[
                          styles.departmentSelectorItemText,
                          newEmployee.department_id === dept.id && styles.departmentSelectorItemTextSelected,
                        ]}
                      >
                        {dept.name}
                      </Text>
                    </View>
                    {newEmployee.department_id === dept.id && (
                      <FontAwesome6 name="check-circle" size={20} color="#2ECC71" />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setDepartmentSelectorVisible(false)}
              >
                <Text style={styles.modalButtonTextCancel}>取消</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#2ECC71',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#95A5A6',
  },
  errorText: {
    fontSize: 14,
    color: '#E74C3C',
    marginBottom: 12,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#6C63FF',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  departmentItem: {
    marginBottom: 16,
  },
  departmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  departmentName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2C3E50',
    flex: 1,
  },
  userCount: {
    fontSize: 13,
    color: '#7F8C8D',
  },
  usersList: {
    marginTop: 8,
    gap: 8,
    paddingLeft: 8,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  userContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#2C3E50',
    marginBottom: 2,
  },
  userPosition: {
    fontSize: 13,
    color: '#7F8C8D',
  },
  disabledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    marginRight: 8,
  },
  disabledText: {
    fontSize: 11,
    color: '#FF6B6B',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  actionButtonText: {
    fontSize: 12,
    color: '#636E72',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: '100%',
    maxWidth: 400,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 16,
  },
  modalDescription: {
    fontSize: 14,
    color: '#636E72',
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#34495E',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#2C3E50',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#F8F9FA',
  },
  modalButtonTextCancel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#636E72',
  },
  modalButtonConfirm: {
    backgroundColor: '#3498DB',
  },
  modalButtonTextConfirm: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalButtonDanger: {
    backgroundColor: '#E74C3C',
  },
  modalButtonTextDanger: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  departmentSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
  },
  departmentSelectorText: {
    fontSize: 14,
    color: '#2C3E50',
  },
  departmentSelectorPlaceholder: {
    fontSize: 14,
    color: '#95A5A6',
  },
  departmentList: {
    maxHeight: 400,
    marginBottom: 16,
  },
  departmentSelectorItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  departmentSelectorItemSelected: {
    backgroundColor: '#EBF5FF',
  },
  departmentSelectorItemText: {
    fontSize: 15,
    color: '#2C3E50',
  },
  departmentSelectorItemTextSelected: {
    color: '#1E88E5',
    fontWeight: '500',
  },
});
