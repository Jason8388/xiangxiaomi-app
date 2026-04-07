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
import * as SecureStore from 'expo-secure-store';

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

const DEPT_COLORS = [
  '#4F46E5', '#059669', '#D97706', '#7C3AED', '#DC2626', '#0891B2', '#EA580C',
];

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
  const [deptForm, setDeptForm] = useState({ name: '', description: '', parent_id: null as number | null });
  const [editingDeptId, setEditingDeptId] = useState<number | null>(null);
  const [user, setUser] = useState<any>(null);

  const fetchOrganization = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/organization`);
      const data = await res.json();
      if (res.ok) {
        setOrgData(data);
        const topLevelIds = new Set<number>(data.tree.map((d: Department) => d.id));
        setExpandedDepts(topLevelIds);
      } else {
        setError(data.error || '获取组织结构失败');
      }
    } catch (err: any) {
      setError('网络连接失败，请检查网络后重试');
    } finally {
      setLoading(false);
    }
  };

  const fetchUser = async () => {
    try {
      const userData = await SecureStore.getItemAsync('user');
      if (userData) setUser(JSON.parse(userData));
    } catch (error) { console.error('Fetch user error:', error); }
  };

  useFocusEffect(useCallback(() => {
    fetchOrganization();
    fetchUser();
  }, []));

  const toggleDepartment = (deptId: number) => {
    setExpandedDepts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(deptId)) newSet.delete(deptId);
      else newSet.add(deptId);
      return newSet;
    });
  };

  const handleEmployeePress = (employee: Employee) => { setSelectedEmployee(employee); setEmployeeModalVisible(true); };
  const handleDepartmentPress = (dept: Department) => { setSelectedDept(dept); setDeptModalVisible(true); };
  const handleAddDepartment = (parentId: number | null = null) => {
    setDeptForm({ name: '', description: '', parent_id: parentId });
    setEditingDeptId(null);
    setAddDeptModalVisible(true);
  };
  const handleEditDepartment = (dept: Department) => {
    setDeptForm({ name: dept.name, description: dept.description || '', parent_id: dept.parent_id });
    setEditingDeptId(dept.id);
    setEditDeptModalVisible(true);
    setDeptModalVisible(false);
  };

  const handleSaveDepartment = async () => {
    if (!deptForm.name.trim()) { Alert.alert('提示', '部门名称不能为空'); return; }
    try {
      const isEdit = editingDeptId !== null;
      const url = isEdit ? `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/departments/${editingDeptId}` : `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/departments`;
      const res = await fetch(url, { method: isEdit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(deptForm) });
      const data = await res.json();
      if (res.ok) {
        Alert.alert('成功', isEdit ? '部门修改成功' : '部门新增成功');
        setAddDeptModalVisible(false);
        setEditDeptModalVisible(false);
        fetchOrganization();
      } else { throw new Error(data.error || '操作失败'); }
    } catch (error: any) { Alert.alert('错误', error.message); }
  };

  const handleDeleteDepartment = (dept: Department) => {
    if (dept.employees?.length > 0) { Alert.alert('提示', '该部门下有员工，无法删除'); return; }
    if (dept.children?.length > 0) { Alert.alert('提示', '该部门下有子部门，无法删除'); return; }
    Alert.alert('确认删除', `确定要删除部门"${dept.name}"吗？`, [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: async () => {
        try {
          const res = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/departments/${dept.id}`, { method: 'DELETE' });
          if (res.ok) { Alert.alert('成功', '部门删除成功'); setDeptModalVisible(false); fetchOrganization(); }
          else { const data = await res.json(); throw new Error(data.error || '删除失败'); }
        } catch (error: any) { Alert.alert('错误', error.message); }
      }},
    ]);
  };

  const getDeptColor = (id: number) => DEPT_COLORS[id % DEPT_COLORS.length];
  const getAvatarColor = (name: string) => { const colors = ['#4F46E5', '#059669', '#D97706', '#7C3AED', '#DC2626', '#0891B2', '#EA580C']; return colors[name.charCodeAt(0) % colors.length]; };

  const renderEmployee = (employee: Employee, isNested = false, color = '#4F46E5') => (
    <TouchableOpacity key={employee.id} style={[styles.employeeCard, isNested && styles.employeeCardNested]} onPress={() => handleEmployeePress(employee)} activeOpacity={0.7}>
      <View style={[styles.employeeAvatar, { backgroundColor: color }]}><Text style={styles.employeeAvatarText}>{employee.name?.charAt(0) || employee.username?.charAt(0) || '?'}</Text></View>
      <View style={styles.employeeInfo}><Text style={styles.employeeName}>{employee.name || employee.username}</Text><Text style={styles.employeePosition}>{employee.position || '未设置职位'}</Text></View>
      <FontAwesome6 name="angle-right" size={18} color="#9CA3AF" />
    </TouchableOpacity>
  );

  const renderDepartment = (dept: Department, level = 0, color = '#4F46E5') => {
    const isExpanded = expandedDepts.has(dept.id);
    const hasChildren = dept.children?.length > 0;
    const hasEmployees = dept.employees?.length > 0;
    return (
      <View key={dept.id} style={styles.deptContainer}>
        <TouchableOpacity style={[styles.deptCard, level > 0 && styles.deptCardNested, { marginLeft: level * 20 }]} onPress={() => handleDepartmentPress(dept)} activeOpacity={0.8}>
          <View style={[styles.deptColorBar, { backgroundColor: color }]} />
          {hasChildren ? (
            <TouchableOpacity style={styles.expandBtn} onPress={() => toggleDepartment(dept.id)}><View style={[styles.expandIcon, isExpanded && styles.expandIconActive]}><FontAwesome6 name={isExpanded ? 'chevron-up' : 'chevron-down'} size={14} color="#FFF" /></View></TouchableOpacity>
          ) : <View style={styles.expandPlaceholder} />}
          <View style={[styles.deptIcon, { backgroundColor: color + '20' }]}><FontAwesome6 name="building" size={18} color={color} /></View>
          <View style={styles.deptInfo}><Text style={styles.deptName}>{dept.name}</Text><Text style={styles.deptMeta}>{dept.code} · {hasEmployees ? `${dept.employees.length}名员工` : '暂无员工'}</Text></View>
          {hasEmployees && <View style={[styles.employeeBadge, { backgroundColor: color + '15' }]}><Text style={[styles.employeeBadgeText, { color }]}>{dept.employees.length}</Text></View>}
          {hasChildren && <View style={styles.childBadge}><Text style={styles.childBadgeText}>{dept.children.length}</Text></View>}
        </TouchableOpacity>
        {(user?.role === 'admin' || !user) && <TouchableOpacity style={[styles.addSubDeptBtn, { marginLeft: (level + 1) * 20 + 12 }]} onPress={() => handleAddDepartment(dept.id)}><View style={styles.addSubDeptIcon}><FontAwesome6 name="plus" size={10} color="#4F46E5" /></View><Text style={styles.addSubDeptText}>添加子部门</Text></TouchableOpacity>}
        {isExpanded && hasEmployees && (
          <View style={[styles.employeesSection, { marginLeft: (level + 1) * 20 }]}>
            <View style={styles.sectionDivider}><View style={styles.dividerLine} /><Text style={styles.dividerText}>成员</Text><View style={styles.dividerLine} /></View>
            {dept.employees.map(emp => renderEmployee(emp, true, getAvatarColor(emp.name || emp.username)))}
          </View>
        )}
        {isExpanded && hasChildren && <View style={styles.childrenSection}>{dept.children.map(childDept => renderDepartment(childDept, level + 1, getDeptColor(childDept.id)))}</View>}
      </View>
    );
  };

  const isAdmin = user?.role === 'admin' || !user;

  return (
    <Screen>
      <PageHeader title="组织架构" showHome />
      <View style={styles.statsSection}>
        <View style={styles.statsCard}>
          <View style={styles.statItem}><View style={[styles.statIconWrap, { backgroundColor: '#4F46E515' }]}><FontAwesome6 name="building" size={20} color="#4F46E5" /></View><View><Text style={styles.statValue}>{orgData?.totalDepartments || 0}</Text><Text style={styles.statLabel}>部门总数</Text></View></View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}><View style={[styles.statIconWrap, { backgroundColor: '#05966915' }]}><FontAwesome6 name="users" size={20} color="#059669" /></View><View><Text style={styles.statValue}>{orgData?.totalEmployees || 0}</Text><Text style={styles.statLabel}>员工总数</Text></View></View>
        </View>
        {isAdmin && <TouchableOpacity style={styles.addButton} onPress={() => handleAddDepartment(null)} activeOpacity={0.8}><FontAwesome6 name="plus" size={18} color="#FFF" /><Text style={styles.addButtonText}>新建部门</Text></TouchableOpacity>}
      </View>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchOrganization} colors={['#4F46E5']} tintColor="#4F46E5" />}>
        {error && <View style={styles.errorContainer}><View style={styles.errorIcon}><FontAwesome6 name="exclamation-circle" size={40} color="#DC2626" /></View><Text style={styles.errorText}>{error}</Text><TouchableOpacity style={styles.retryButton} onPress={fetchOrganization}><Text style={styles.retryButtonText}>重新加载</Text></TouchableOpacity></View>}
        {loading && !orgData && <View style={styles.loadingContainer}><FontAwesome6 name="spinner" size={32} color="#4F46E5" /><Text style={styles.loadingText}>正在加载组织架构...</Text></View>}
        {!error && orgData?.tree?.length > 0 && <View style={styles.deptTree}>{orgData.tree.map((dept, i) => renderDepartment(dept, 0, getDeptColor(dept.id)))}</View>}
        {!error && orgData?.tree?.length === 0 && <View style={styles.emptyContainer}><FontAwesome6 name="building" size={48} color="#D1D5DB" /><Text style={styles.emptyTitle}>暂无部门信息</Text><Text style={styles.emptyText}>点击上方"新建部门"按钮创建第一个部门</Text></View>}
        {orgData?.unassignedEmployees?.length > 0 && <View style={styles.unassignedSection}><View style={styles.sectionHeader}><View style={styles.unassignedBadge}><FontAwesome6 name="user-slash" size={14} color="#9CA3AF" /></View><Text style={styles.sectionTitle}>未分配部门</Text><View style={styles.countBadge}><Text style={styles.countBadgeText}>{orgData.unassignedEmployees.length}</Text></View></View>{orgData.unassignedEmployees.map(emp => renderEmployee(emp, false, getAvatarColor(emp.name || emp.username)))}</View>}
        <View style={styles.bottomPadding} />
      </ScrollView>

      <Modal visible={employeeModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}><Text style={styles.modalTitle}>员工信息</Text><TouchableOpacity onPress={() => setEmployeeModalVisible(false)}><FontAwesome6 name="times" size={20} color="#6B7280" /></TouchableOpacity></View>
            {selectedEmployee && (
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <View style={styles.profileSection}>
                  <View style={[styles.profileAvatar, { backgroundColor: getAvatarColor(selectedEmployee.name || selectedEmployee.username) }]}><Text style={styles.profileAvatarText}>{selectedEmployee.name?.charAt(0) || selectedEmployee.username?.charAt(0) || '?'}</Text></View>
                  <Text style={styles.profileName}>{selectedEmployee.name || selectedEmployee.username}</Text>
                  <Text style={styles.profilePosition}>{selectedEmployee.position || '未设置职位'}</Text>
                  <View style={styles.profileBadge}><Text style={styles.profileBadgeText}>{selectedEmployee.department_name || '未分配部门'}</Text></View>
                </View>
                <View style={styles.infoCard}>
                  <View style={styles.infoItem}><View style={styles.infoIconWrap}><FontAwesome6 name="user" size={16} color="#6B7280" /></View><View><Text style={styles.infoLabel}>用户名</Text><Text style={styles.infoValue}>{selectedEmployee.username}</Text></View></View>
                  <View style={styles.infoItem}><View style={styles.infoIconWrap}><FontAwesome6 name="briefcase" size={16} color="#6B7280" /></View><View><Text style={styles.infoLabel}>职位</Text><Text style={styles.infoValue}>{selectedEmployee.position || '-'}</Text></View></View>
                  <View style={styles.infoItem}><View style={styles.infoIconWrap}><FontAwesome6 name="building" size={16} color="#6B7280" /></View><View><Text style={styles.infoLabel}>部门</Text><Text style={styles.infoValue}>{selectedEmployee.department_name || '未分配'}</Text></View></View>
                  {selectedEmployee.email && <View style={styles.infoItem}><View style={styles.infoIconWrap}><FontAwesome6 name="envelope" size={16} color="#6B7280" /></View><View><Text style={styles.infoLabel}>邮箱</Text><Text style={styles.infoValue}>{selectedEmployee.email}</Text></View></View>}
                  {selectedEmployee.phone && <View style={styles.infoItem}><View style={styles.infoIconWrap}><FontAwesome6 name="phone" size={16} color="#6B7280" /></View><View><Text style={styles.infoLabel}>电话</Text><Text style={styles.infoValue}>{selectedEmployee.phone}</Text></View></View>}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      <Modal visible={deptModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}><Text style={styles.modalTitle}>部门信息</Text><TouchableOpacity onPress={() => setDeptModalVisible(false)}><FontAwesome6 name="times" size={20} color="#6B7280" /></TouchableOpacity></View>
            {selectedDept && (
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <View style={styles.deptProfileSection}>
                  <View style={[styles.deptProfileIcon, { backgroundColor: getDeptColor(selectedDept.id) }]}><FontAwesome6 name="building" size={28} color="#FFF" /></View>
                  <Text style={styles.deptProfileName}>{selectedDept.name}</Text>
                  <View style={styles.deptCodeBadge}><Text style={styles.deptCodeBadgeText}>{selectedDept.code}</Text></View>
                </View>
                <View style={styles.deptStatsCard}>
                  <View style={styles.deptStatItem}><FontAwesome6 name="users" size={20} color="#4F46E5" /><Text style={styles.deptStatValue}>{selectedDept.employees?.length || 0}</Text><Text style={styles.deptStatLabel}>成员</Text></View>
                  <View style={styles.deptStatDivider} />
                  <View style={styles.deptStatItem}><FontAwesome6 name="layer-group" size={20} color="#059669" /><Text style={styles.deptStatValue}>{selectedDept.children?.length || 0}</Text><Text style={styles.deptStatLabel}>子部门</Text></View>
                </View>
                {selectedDept.description && <View style={styles.deptDescCard}><Text style={styles.deptDescLabel}>部门描述</Text><Text style={styles.deptDescText}>{selectedDept.description}</Text></View>}
                {isAdmin && <View style={styles.deptOperateBtns}><TouchableOpacity style={[styles.operateBtn, styles.editBtn]} onPress={() => handleEditDepartment(selectedDept)}><FontAwesome6 name="edit" size={16} color="#4F46E5" /><Text style={styles.editBtnText}>修改部门</Text></TouchableOpacity><TouchableOpacity style={[styles.operateBtn, styles.deleteBtn]} onPress={() => handleDeleteDepartment(selectedDept)}><FontAwesome6 name="trash" size={16} color="#DC2626" /><Text style={styles.deleteBtnText}>删除部门</Text></TouchableOpacity></View>}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      <Modal visible={addDeptModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.formModalContent}>
            <View style={styles.modalHeader}><Text style={styles.modalTitle}>{deptForm.parent_id ? '添加子部门' : '新建部门'}</Text><TouchableOpacity onPress={() => setAdd
DeptModalVisible(false)}><FontAwesome6 name="times" size={20} color="#6B7280" /></TouchableOpacity></View>
            <ScrollView style={styles.formModalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}><Text style={styles.formLabel}>部门名称 *</Text><TextInput style={styles.formInput} placeholder="请输入部门名称" value={deptForm.name} onChangeText={(text) => setDeptForm({ ...deptForm, name: text })} /></View>
              <View style={styles.formGroup}><Text style={styles.formLabel}>部门描述</Text><TextInput style={[styles.formInput, styles.formTextArea]} placeholder="请输入部门描述（选填）" value={deptForm.description} onChangeText={(text) => setDeptForm({ ...deptForm, description: text })} multiline numberOfLines={3} /></View>
            </ScrollView>
            <View style={styles.formModalFooter}><TouchableOpacity style={[styles.formBtn, styles.formCancelBtn]} onPress={() => setAddDeptModalVisible(false)}><Text style={styles.formCancelBtnText}>取消</Text></TouchableOpacity><TouchableOpacity style={[styles.formBtn, styles.formSaveBtn]} onPress={handleSaveDepartment}><Text style={styles.formSaveBtnText}>保存</Text></TouchableOpacity></View>
          </View>
        </View>
      </Modal>

      <Modal visible={editDeptModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.formModalContent}>
            <View style={styles.modalHeader}><Text style={styles.modalTitle}>修改部门</Text><TouchableOpacity onPress={() => setEditDeptModalVisible(false)}><FontAwesome6 name="times" size={20} color="#6B7280" /></TouchableOpacity></View>
            <ScrollView style={styles.formModalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}><Text style={styles.formLabel}>部门名称 *</Text><TextInput style={styles.formInput} placeholder="请输入部门名称" value={deptForm.name} onChangeText={(text) => setDeptForm({ ...deptForm, name: text })} /></View>
              <View style={styles.formGroup}><Text style={styles.formLabel}>部门描述</Text><TextInput style={[styles.formInput, styles.formTextArea]} placeholder="请输入部门描述（选填）" value={deptForm.description} onChangeText={(text) => setDeptForm({ ...deptForm, description: text })} multiline numberOfLines={3} /></View>
            </ScrollView>
            <View style={styles.formModalFooter}><TouchableOpacity style={[styles.formBtn, styles.formCancelBtn]} onPress={() => setEditDeptModalVisible(false)}><Text style={styles.formCancelBtnText}>取消</Text></TouchableOpacity><TouchableOpacity style={[styles.formBtn, styles.formSaveBtn]} onPress={handleSaveDepartment}><Text style={styles.formSaveBtnText}>保存</Text></TouchableOpacity></View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  // Stats Section
  statsSection: { padding: 16, gap: 12 },
  statsCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'center', shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  statItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  statIconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 24, fontWeight: '700', color: '#1F2937' },
  statLabel: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  statDivider: { width: 1, height: 36, backgroundColor: '#E5E7EB', marginHorizontal: 12 },
  addButton: { backgroundColor: '#4F46E5', borderRadius: 14, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  addButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  // Content
  content: { flex: 1, backgroundColor: '#F9FAFB', paddingHorizontal: 16 },
  deptTree: { paddingTop: 8 },
  deptContainer: { marginBottom: 8 },
  // Department Card
  deptCard: { backgroundColor: '#FFF', borderRadius: 16, flexDirection: 'row', alignItems: 'center', padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2, overflow: 'hidden' },
  deptCardNested: { marginTop: 6 },
  deptColorBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, borderTopLeftRadius: 16, borderBottomLeftRadius: 16 },
  expandBtn: { marginRight: 10 },
  expandPlaceholder: { width: 24, height: 24, marginRight: 10 },
  expandIcon: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' },
  expandIconActive: { backgroundColor: '#4F46E5' },
  deptIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  deptInfo: { flex: 1 },
  deptName: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
  deptMeta: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  employeeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, marginRight: 8 },
  employeeBadgeText: { fontSize: 12, fontWeight: '600' },
  childBadge: { backgroundColor: '#F3F4F6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, marginRight: 8 },
  childBadgeText: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  // Sub Dept Button
  addSubDeptBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12, marginTop: 4 },
  addSubDeptIcon: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' },
  addSubDeptText: { fontSize: 12, color: '#4F46E5', fontWeight: '500' },
  // Employees Section
  employeesSection: { marginTop: 8 },
  sectionDivider: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
  dividerText: { fontSize: 12, color: '#9CA3AF', fontWeight: '500' },
  childrenSection: { marginTop: 4 },
  // Employee Card
  employeeCard: { backgroundColor: '#FFF', borderRadius: 14, flexDirection: 'row', alignItems: 'center', padding: 14, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  employeeCardNested: { marginLeft: 8, marginRight: 0 },
  employeeAvatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  employeeAvatarText: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  employeeInfo: { flex: 1, marginLeft: 12 },
  employeeName: { fontSize: 15, fontWeight: '600', color: '#1F2937' },
  employeePosition: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  employeeArrow: { paddingLeft: 8 },
  // Unassigned Section
  unassignedSection: { marginTop: 20, marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  unassignedBadge: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  countBadge: { backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  countBadgeText: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  // Empty State
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#6B7280', marginTop: 16 },
  emptyText: { fontSize: 14, color: '#9CA3AF', marginTop: 8 },
  // Error & Loading
  errorContainer: { alignItems: 'center', paddingVertical: 60 },
  errorIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center' },
  errorText: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginTop: 16, marginBottom: 20 },
  retryButton: { backgroundColor: '#4F46E5', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  retryButtonText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  loadingContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 12 },
  loadingText: { fontSize: 14, color: '#6B7280' },
  bottomPadding: { height: 24 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%' },
  formModalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '70%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  modalBody: { padding: 20 },
  formModalBody: { padding: 20, maxHeight: 350 },
  formModalFooter: { flexDirection: 'row', padding: 20, gap: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  formBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  formCancelBtn: { backgroundColor: '#F3F4F6' },
  formCancelBtnText: { fontSize: 16, color: '#6B7280', fontWeight: '600' },
  formSaveBtn: { backgroundColor: '#4F46E5' },
  formSaveBtnText: { fontSize: 16, color: '#FFF', fontWeight: '600' },
  // Profile Section
  profileSection: { alignItems: 'center', paddingVertical: 24 },
  profileAvatar: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  profileAvatarText: { fontSize: 32, fontWeight: '700', color: '#FFF' },
  profileName: { fontSize: 22, fontWeight: '700', color: '#1F2937' },
  profilePosition: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  profileBadge: { backgroundColor: '#F3F4F6', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, marginTop: 12 },
  profileBadgeText: { fontSize: 12, color: '#6B7280' },
  // Info Card
  infoCard: { backgroundColor: '#F9FAFB', borderRadius: 16, padding: 16, gap: 16 },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  infoIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center' },
  infoLabel: { fontSize: 12, color: '#9CA3AF' },
  infoValue: { fontSize: 14, color: '#1F2937', fontWeight: '500', marginTop: 2 },
  // Dept Profile
  deptProfileSection: { alignItems: 'center', paddingVertical: 24 },
  deptProfileIcon: { width: 80, height: 80, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  deptProfileName: { fontSize: 22, fontWeight: '700', color: '#1F2937' },
  deptCodeBadge: { backgroundColor: '#F3F4F6', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, marginTop: 8 },
  deptCodeBadgeText: { fontSize: 12, color: '#6B7280' },
  deptStatsCard: { backgroundColor: '#F9FAFB', borderRadius: 16, padding: 20, flexDirection: 'row', alignItems: 'center', marginTop: 16 },
  deptStatItem: { flex: 1, alignItems: 'center', gap: 8 },
  deptStatValue: { fontSize: 28, fontWeight: '700', color: '#1F2937' },
  deptStatLabel: { fontSize: 12, color: '#6B7280' },
  deptStatDivider: { width: 1, height: 48, backgroundColor: '#E5E7EB' },
  deptDescCard: { backgroundColor: '#F9FAFB', borderRadius: 16, padding: 16, marginTop: 16 },
  deptDescLabel: { fontSize: 12, color: '#9CA3AF', marginBottom: 8 },
  deptDescText: { fontSize: 14, color: '#1F2937', lineHeight: 22 },
  deptOperateBtns: { flexDirection: 'row', gap: 12, marginTop: 20 },
  operateBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12 },
  editBtn: { backgroundColor: '#EEF2FF', borderWidth: 1, borderColor: '#4F46E5' },
  editBtnText: { fontSize: 15, color: '#4F46E5', fontWeight: '600' },
  deleteBtn: { backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#DC2626' },
  deleteBtnText: { fontSize: 15, color: '#DC2626', fontWeight: '600' },
  // Form
  formGroup: { marginBottom: 20 },
  formLabel: { fontSize: 14, color: '#6B7280', marginBottom: 8, fontWeight: '500' },
  formInput: { backgroundColor: '#F9FAFB', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#1F2937' },
  formTextArea: { minHeight: 100, textAlignVertical: 'top' },
});
