import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { PageHeader } from '@/components/PageHeader';
import { FontAwesome6 } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { getSecureItem } from '@/utils/storage';
import { getApiBaseUrl } from '@/utils/api';


interface Employee {
  id: number;
  username: string;
  name: string;
  role: string;
  position: string;
  email?: string;
  phone?: string;
  department_name?: string;
  department_id?: number;
}

interface Department {
  id: number;
  name: string;
  code: string;
  description?: string;
  parent_id: number | null;
  sort_order: number;
  employees: Employee[];
  children: Department[];
}

interface OrgData {
  tree: Department[];
  unassignedEmployees: Employee[];
  totalDepartments: number;
  totalEmployees: number;
}

export default function OrganizationScreen() {
  const [orgData, setOrgData] = useState<OrgData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedDepts, setExpandedDepts] = useState<Set<number>>(new Set());
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [employeeModalVisible, setEmployeeModalVisible] = useState(false);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [deptModalVisible, setDeptModalVisible] = useState(false);
  const [addDeptModalVisible, setAddDeptModalVisible] = useState(false);
  const [editDeptModalVisible, setEditDeptModalVisible] = useState(false);
  const [deptForm, setDeptForm] = useState({
    name: '',
    code: '',
    description: '',
    parent_id: null as number | null,
  });
  const [editingDeptId, setEditingDeptId] = useState<number | null>(null);
  const [user, setUser] = useState<any>(null);

  const fetchOrganization = async (): Promise<OrgData | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/v1/organization`);
      const data = await res.json();
      if (res.ok) {
        setOrgData(data);
        const topLevelIds = new Set<number>(data.tree.map((d: Department) => d.id));
        setExpandedDepts(topLevelIds);
        return data;
      } else {
        setError(data.error || '获取组织结构失败');
        return null;
      }
    } catch (err: any) {
      console.error('Fetch organization error:', err);
      setError('网络连接失败，请检查网络后重试');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const fetchUser = async () => {
    try {
      const userData = await getSecureItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Fetch user error:', error);
    }
  };


  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        setLoading(true);
        try {
          const res = await fetch(`${getApiBaseUrl()}/api/v1/organization`);
          const data = await res.json();
          if (res.ok) {
            setOrgData(data);
            const topLevelIds = new Set<number>(data.tree.map((d: Department) => d.id));
            setExpandedDepts(topLevelIds);
          }
        } catch (err) {
          console.error('Fetch organization error:', err);
        } finally {
          setLoading(false);
        }
      };
      loadData();
      fetchUser();
    }, [])
  );

  const toggleDepartment = (deptId: number) => {
    setExpandedDepts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(deptId)) {
        newSet.delete(deptId);
      } else {
        newSet.add(deptId);
      }
      return newSet;
    });
  };

  const handleEmployeePress = (employee: Employee) => {
    setSelectedEmployee(employee);
    setEmployeeModalVisible(true);
  };

  const handleDepartmentPress = (dept: Department) => {
    setSelectedDept(dept);
    setDeptModalVisible(true);
  };

  // 打开新增部门弹窗
  const handleAddDepartment = (parentId: number | null = null) => {
    setDeptForm({
      name: '',
      code: '',
      description: '',
      parent_id: parentId,
    });
    setEditingDeptId(null);
    setAddDeptModalVisible(true);
  };

  // 打开编辑部门弹窗
  const handleEditDepartment = (dept: Department) => {
    setDeptForm({
      name: dept.name,
      code: dept.code || '',
      description: dept.description || '',
      parent_id: dept.parent_id,
    });
    setEditingDeptId(dept.id);
    setEditDeptModalVisible(true);
    setDeptModalVisible(false);
  };

  // 保存部门（新增或编辑）
  const handleSaveDepartment = async () => {
    if (!deptForm.name.trim()) {
      Alert.alert('提示', '部门名称不能为空');
      return;
    }

    try {
      const isEdit = editingDeptId !== null;
      const url = isEdit
        ? `${getApiBaseUrl()}/api/v1/departments/${editingDeptId}`
        : `${getApiBaseUrl()}/api/v1/departments`;
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deptForm),
      });

      const data = await res.json();

      if (res.ok) {
        Alert.alert('成功', isEdit ? '部门修改成功' : '部门新增成功');
        setAddDeptModalVisible(false);
        setEditDeptModalVisible(false);
        fetchOrganization();
      } else {
        throw new Error(data.error || '操作失败');
      }
    } catch (error: any) {
      Alert.alert('错误', typeof error === 'string' ? error : '操作失败');
    }
  };

  // 删除部门
  const handleDeleteDepartment = (dept: Department) => {
    if (dept.employees && dept.employees.length > 0) {
      Alert.alert('提示', '该部门下有员工，无法删除');
      return;
    }
    if (dept.children && dept.children.length > 0) {
      Alert.alert('提示', '该部门下有子部门，无法删除');
      return;
    }

    Alert.alert(
      '确认删除',
      `确定要删除部门"${dept.name}"吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await fetch(
                `${getApiBaseUrl()}/api/v1/departments/${dept.id}`,
                { method: 'DELETE' }
              );

              if (res.ok) {
                Alert.alert('成功', '部门删除成功');
                setDeptModalVisible(false);
                fetchOrganization();
              } else {
                const data = await res.json();
                throw new Error(data.error || '删除失败');
              }
            } catch (error: any) {
              Alert.alert('错误', typeof error === 'string' ? error : '操作失败');
            }
          },
        },
      ]
    );
  };

  const renderEmployee = (employee: Employee, isNested = false) => (
    <TouchableOpacity
      key={employee.id}
      style={[styles.employeeCard, isNested && styles.employeeCardNested]}
      onPress={() => handleEmployeePress(employee)}
    >
      <View style={styles.employeeAvatar}>
        <Text style={styles.employeeAvatarText}>
          {employee.name?.charAt(0) || employee.username?.charAt(0) || '?'}
        </Text>
      </View>
      <View style={styles.employeeInfo}>
        <Text style={styles.employeeName}>{employee.name || employee.username}</Text>
        <Text style={styles.employeePosition}>{employee.position || '未设置职位'}</Text>
      </View>
      <FontAwesome6 name="chevron-right" size={14} color="#B2BEC3" />
    </TouchableOpacity>
  );

  const renderDepartment = (dept: Department, level = 0, parentId: number | null = null) => {
    const isExpanded = expandedDepts.has(dept.id);
    const hasChildren = dept.children && dept.children.length > 0;
    const hasEmployees = dept.employees && dept.employees.length > 0;

    return (
      <View key={dept.id} style={styles.deptContainer}>
        <View
          style={[
            styles.deptCard,
            level > 0 && styles.deptCardNested,
            { marginLeft: level * 16 },
          ]}
        >
          <TouchableOpacity
            style={styles.deptMainContent}
            onPress={() => handleDepartmentPress(dept)}
          >
            <View style={[styles.deptIcon, { backgroundColor: getDeptColor(dept.id) }]}>
              <FontAwesome6 name="building" size={14} color="#FFF" />
            </View>
            <View style={styles.deptInfo}>
              <Text style={styles.deptName}>{dept.name}</Text>
              <Text style={styles.deptCode}>{dept.code}</Text>
            </View>
            <View style={styles.deptStats}>
              {hasEmployees && (
                <View style={styles.statBadge}>
                  <Text style={styles.statBadgeText}>{dept.employees.length}人</Text>
                </View>
              )}
              <TouchableOpacity
                onPress={() => toggleDepartment(dept.id)}
                style={styles.expandButton}
              >
                <FontAwesome6
                  name={isExpanded ? 'chevron-down' : 'chevron-right'}
                  size={14}
                  color="#636E72"
                />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>

          {/* 修改和删除按钮 */}
          {(user?.role === 'admin' || !user) && (
            <View style={styles.deptActions}>
              <TouchableOpacity
                style={styles.deptActionBtn}
                onPress={() => handleEditDepartment(dept)}
              >
                <FontAwesome6 name="edit" size={14} color="#1E88E5" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deptActionBtn}
                onPress={() => handleDeleteDepartment(dept)}
              >
                <FontAwesome6 name="trash" size={14} color="#E74C3C" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* 子部门新增按钮 */}
        {(user?.role === 'admin' || !user) && isExpanded && (
          <TouchableOpacity
            style={[styles.addSubDeptBtn, { marginLeft: (level + 1) * 16 + 8 }]}
            onPress={() => handleAddDepartment(dept.id)}
          >
            <FontAwesome6 name="plus" size={12} color="#1E88E5" />
            <Text style={styles.addSubDeptText}>添加子部门</Text>
          </TouchableOpacity>
        )}

        {/* 部门员工 */}
        {isExpanded && hasEmployees && (
          <View style={[styles.employeesContainer, { marginLeft: (level + 1) * 16 }]}>
            {dept.employees.map(emp => renderEmployee(emp, true))}
          </View>
        )}

        {/* 子部门 */}
        {isExpanded && hasChildren && (
          <View style={styles.childrenContainer}>
            {dept.children.map(childDept => renderDepartment(childDept, level + 1, dept.id))}
          </View>
        )}
      </View>
    );
  };

  const getDeptColor = (id: number) => {
    const colors = ['#1E88E5', '#00B894', '#F39C12', '#9B59B6', '#E74C3C', '#2ECC71', '#3498DB', '#FF6B9D'];
    return colors[id % colors.length];
  };

  const isAdmin = user?.role === 'admin' || !user; // 无用户信息时也显示（预览模式）

  return (
    <Screen>
      <PageHeader title="组织结构" showHome />
      
      {/* 头部统计 */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          {isAdmin && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => handleAddDepartment(null)}
            >
              <FontAwesome6 name="plus" size={18} color="#FFF" />
              <Text style={styles.addButtonText}>新增部门</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.headerStats}>
          <View style={styles.statItem}>
            <FontAwesome6 name="building" size={16} color="#1E88E5" />
            <Text style={styles.statValue}>{orgData?.totalDepartments || 0}</Text>
            <Text style={styles.statLabel}>部门</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <FontAwesome6 name="users" size={16} color="#00B894" />
            <Text style={styles.statValue}>{orgData?.totalEmployees || 0}</Text>
            <Text style={styles.statLabel}>员工</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchOrganization} />
        }
      >
        {/* 错误提示 */}
        {error && (
          <View style={styles.errorContainer}>
            <FontAwesome6 name="exclamation-circle" size={32} color="#E74C3C" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchOrganization}>
              <Text style={styles.retryButtonText}>重试</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 加载中 */}
        {loading && !orgData && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>加载中...</Text>
          </View>
        )}

        {/* 部门树 */}
        {!error && orgData?.tree?.map(dept => renderDepartment(dept))}

        {/* 未分配部门员工 */}
        {orgData?.unassignedEmployees && orgData.unassignedEmployees.length > 0 && (
          <View style={styles.unassignedSection}>
            <View style={styles.sectionHeader}>
              <FontAwesome6 name="user-slash" size={16} color="#636E72" />
              <Text style={styles.sectionTitle}>未分配部门</Text>
              <Text style={styles.sectionCount}>({orgData.unassignedEmployees.length})</Text>
            </View>
            {orgData.unassignedEmployees.map(emp => renderEmployee(emp))}
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* 员工详情弹窗 */}
      <Modal visible={employeeModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>员工信息</Text>
              <TouchableOpacity onPress={() => setEmployeeModalVisible(false)}>
                <FontAwesome6 name="times" size={20} color="#636E72" />
              </TouchableOpacity>
            </View>

            {selectedEmployee && (
              <ScrollView style={styles.modalBody}>
                <View style={styles.profileSection}>
                  <View style={styles.profileAvatar}>
                    <Text style={styles.profileAvatarText}>
                      {selectedEmployee.name?.charAt(0) || selectedEmployee.username?.charAt(0) || '?'}
                    </Text>
                  </View>
                  <Text style={styles.profileName}>
                    {selectedEmployee.name || selectedEmployee.username}
                  </Text>
                  <Text style={styles.profilePosition}>
                    {selectedEmployee.position || '未设置职位'}
                  </Text>
                </View>

                <View style={styles.infoList}>
                  <View style={styles.infoItem}>
                    <FontAwesome6 name="user" size={16} color="#636E72" />
                    <Text style={styles.infoLabel}>用户名</Text>
                    <Text style={styles.infoValue}>{selectedEmployee.username}</Text>
                  </View>

                  <View style={styles.infoItem}>
                    <FontAwesome6 name="briefcase" size={16} color="#636E72" />
                    <Text style={styles.infoLabel}>职位</Text>
                    <Text style={styles.infoValue}>{selectedEmployee.position || '-'}</Text>
                  </View>

                  <View style={styles.infoItem}>
                    <FontAwesome6 name="building" size={16} color="#636E72" />
                    <Text style={styles.infoLabel}>部门</Text>
                    <Text style={styles.infoValue}>
                      {selectedEmployee.department_name || '未分配'}
                    </Text>
                  </View>

                  {selectedEmployee.email && (
                    <View style={styles.infoItem}>
                      <FontAwesome6 name="envelope" size={16} color="#636E72" />
                      <Text style={styles.infoLabel}>邮箱</Text>
                      <Text style={styles.infoValue}>{selectedEmployee.email}</Text>
                    </View>
                  )}

                  {selectedEmployee.phone && (
                    <View style={styles.infoItem}>
                      <FontAwesome6 name="phone" size={16} color="#636E72" />
                      <Text style={styles.infoLabel}>电话</Text>
                      <Text style={styles.infoValue}>{selectedEmployee.phone}</Text>
                    </View>
                  )}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* 部门详情弹窗 */}
      <Modal visible={deptModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>部门信息</Text>
              <TouchableOpacity onPress={() => setDeptModalVisible(false)}>
                <FontAwesome6 name="times" size={20} color="#636E72" />
              </TouchableOpacity>
            </View>

            {selectedDept && (
              <ScrollView style={styles.modalBody}>
                <View style={styles.deptProfileSection}>
                  <View style={[styles.deptProfileIcon, { backgroundColor: getDeptColor(selectedDept.id) }]}>
                    <FontAwesome6 name="building" size={24} color="#FFF" />
                  </View>
                  <Text style={styles.deptProfileName}>{selectedDept.name}</Text>
                  <Text style={styles.deptProfileCode}>{selectedDept.code}</Text>
                </View>

                <View style={styles.infoList}>
                  <View style={styles.infoItem}>
                    <FontAwesome6 name="signature" size={16} color="#636E72" />
                    <Text style={styles.infoLabel}>部门名称</Text>
                    <Text style={styles.infoValue}>{selectedDept.name}</Text>
                  </View>

                  <View style={styles.infoItem}>
                    <FontAwesome6 name="barcode" size={16} color="#636E72" />
                    <Text style={styles.infoLabel}>部门编码</Text>
                    <Text style={styles.infoValue}>{selectedDept.code}</Text>
                  </View>

                  {selectedDept.description && (
                    <View style={styles.infoItem}>
                      <FontAwesome6 name="info-circle" size={16} color="#636E72" />
                      <Text style={styles.infoLabel}>描述</Text>
                      <Text style={styles.infoValue}>{selectedDept.description}</Text>
                    </View>
                  )}

                  <View style={styles.infoItem}>
                    <FontAwesome6 name="users" size={16} color="#636E72" />
                    <Text style={styles.infoLabel}>员工数量</Text>
                    <Text style={styles.infoValue}>{selectedDept.employees?.length || 0} 人</Text>
                  </View>

                  <View style={styles.infoItem}>
                    <FontAwesome6 name="sitemap" size={16} color="#636E72" />
                    <Text style={styles.infoLabel}>子部门</Text>
                    <Text style={styles.infoValue}>{selectedDept.children?.length || 0} 个</Text>
                  </View>
                </View>

                {/* 操作按钮 */}
                {isAdmin && (
                  <View style={styles.deptOperateBtns}>
                    <TouchableOpacity
                      style={[styles.operateBtn, styles.editBtn]}
                      onPress={() => handleEditDepartment(selectedDept)}
                    >
                      <FontAwesome6 name="edit" size={16} color="#1E88E5" />
                      <Text style={styles.editBtnText}>修改部门</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.operateBtn, styles.deleteBtn]}
                      onPress={() => handleDeleteDepartment(selectedDept)}
                    >
                      <FontAwesome6 name="trash" size={16} color="#E74C3C" />
                      <Text style={styles.deleteBtnText}>删除部门</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* 新增部门弹窗 */}
      <Modal visible={addDeptModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.formModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {deptForm.parent_id ? '添加子部门' : '新增部门'}
              </Text>
              <TouchableOpacity onPress={() => setAddDeptModalVisible(false)}>
                <FontAwesome6 name="times" size={20} color="#636E72" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formModalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>部门名称 *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="请输入部门名称"
                  value={deptForm.name}
                  onChangeText={(text) => setDeptForm({ ...deptForm, name: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>部门描述</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea]}
                  placeholder="请输入部门描述（选填）"
                  value={deptForm.description}
                  onChangeText={(text) => setDeptForm({ ...deptForm, description: text })}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </ScrollView>

            <View style={styles.formModalFooter}>
              <TouchableOpacity
                style={[styles.formBtn, styles.formCancelBtn]}
                onPress={() => setAddDeptModalVisible(false)}
              >
                <Text style={styles.formCancelBtnText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.formBtn, styles.formSaveBtn]}
                onPress={handleSaveDepartment}
              >
                <Text style={styles.formSaveBtnText}>保存</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 编辑部门弹窗 */}
      <Modal visible={editDeptModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.formModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>修改部门</Text>
              <TouchableOpacity onPress={() => setEditDeptModalVisible(false)}>
                <FontAwesome6 name="times" size={20} color="#636E72" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formModalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>部门名称 *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="请输入部门名称"
                  value={deptForm.name}
                  onChangeText={(text) => setDeptForm({ ...deptForm, name: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>部门描述</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea]}
                  placeholder="请输入部门描述（选填）"
                  value={deptForm.description}
                  onChangeText={(text) => setDeptForm({ ...deptForm, description: text })}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </ScrollView>

            <View style={styles.formModalFooter}>
              <TouchableOpacity
                style={[styles.formBtn, styles.formCancelBtn]}
                onPress={() => setEditDeptModalVisible(false)}
              >
                <Text style={styles.formCancelBtnText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.formBtn, styles.formSaveBtn]}
                onPress={handleSaveDepartment}
              >
                <Text style={styles.formSaveBtnText}>保存</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#FFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F4',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2D3436',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1E88E5',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  headerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  statItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3436',
  },
  statLabel: {
    fontSize: 14,
    color: '#636E72',
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#DFE6E9',
  },
  content: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  deptContainer: {
    marginBottom: 8,
  },
  deptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginTop: 12,
    paddingRight: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  deptCardNested: {
    marginTop: 8,
    marginHorizontal: 0,
    marginLeft: 8,
    marginRight: 16,
  },
  deptMainContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  deptIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deptInfo: {
    flex: 1,
    marginLeft: 12,
  },
  deptName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3436',
  },
  deptCode: {
    fontSize: 12,
    color: '#636E72',
    marginTop: 2,
  },
  deptStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statBadge: {
    backgroundColor: '#F5F7FA',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statBadgeText: {
    fontSize: 12,
    color: '#636E72',
  },
  expandButton: {
    padding: 4,
  },
  deptActions: {
    flexDirection: 'row',
    gap: 4,
    paddingRight: 4,
  },
  deptActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F5F7FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addSubDeptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 4,
  },
  addSubDeptText: {
    fontSize: 13,
    color: '#1E88E5',
  },
  employeesContainer: {
    marginTop: 4,
  },
  employeeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginTop: 8,
    padding: 12,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  employeeCardNested: {
    marginHorizontal: 0,
    marginLeft: 8,
    marginRight: 16,
  },
  employeeAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E88E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  employeeAvatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  employeeInfo: {
    flex: 1,
    marginLeft: 12,
  },
  employeeName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2D3436',
  },
  employeePosition: {
    fontSize: 12,
    color: '#636E72',
    marginTop: 2,
  },
  childrenContainer: {},
  unassignedSection: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#636E72',
  },
  sectionCount: {
    fontSize: 12,
    color: '#B2BEC3',
  },
  bottomPadding: {
    height: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
  },
  formModalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F4',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3436',
  },
  modalBody: {
    padding: 16,
  },
  formModalBody: {
    padding: 16,
    maxHeight: 400,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    color: '#636E72',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: '#F5F7FA',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#2D3436',
  },
  formTextArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  formModalFooter: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F3F4',
  },
  formBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  formCancelBtn: {
    backgroundColor: '#F5F7FA',
  },
  formCancelBtnText: {
    fontSize: 16,
    color: '#636E72',
  },
  formSaveBtn: {
    backgroundColor: '#1E88E5',
  },
  formSaveBtnText: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '600',
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  profileAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#1E88E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  profileAvatarText: {
    fontSize: 28,
    fontWeight: '600',
    color: '#FFF',
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2D3436',
  },
  profilePosition: {
    fontSize: 14,
    color: '#636E72',
    marginTop: 4,
  },
  infoList: {
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F7FA',
  },
  infoLabel: {
    fontSize: 14,
    color: '#636E72',
    width: 70,
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    color: '#2D3436',
  },
  deptProfileSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  deptProfileIcon: {
    width: 72,
    height: 72,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  deptProfileName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2D3436',
  },
  deptProfileCode: {
    fontSize: 14,
    color: '#636E72',
    marginTop: 4,
  },
  deptOperateBtns: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  operateBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  editBtn: {
    backgroundColor: 'rgba(30, 136, 229, 0.1)',
    borderColor: '#1E88E5',
  },
  editBtnText: {
    fontSize: 15,
    color: '#1E88E5',
    fontWeight: '500',
  },
  deleteBtn: {
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    borderColor: '#E74C3C',
  },
  deleteBtnText: {
    fontSize: 15,
    color: '#E74C3C',
    fontWeight: '500',
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 14,
    color: '#636E72',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#6C63FF',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 14,
    color: '#636E72',
  },
});
