import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Modal,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { FontAwesome6 } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';

interface Employee {
  id: number;
  username: string;
  name: string;
  role: string;
  position: string;
  email?: string;
  phone?: string;
  department_name?: string;
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
  const [expandedDepts, setExpandedDepts] = useState<Set<number>>(new Set());
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [employeeModalVisible, setEmployeeModalVisible] = useState(false);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [deptModalVisible, setDeptModalVisible] = useState(false);

  const fetchOrganization = async () => {
    try {
      const res = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/organization`);
      if (res.ok) {
        const data = await res.json();
        setOrgData(data);
        // 默认展开所有顶级部门
        const topLevelIds = new Set(data.tree.map((d: Department) => d.id));
        setExpandedDepts(topLevelIds);
      }
    } catch (error) {
      console.error('Fetch organization error:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchOrganization();
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

  const renderDepartment = (dept: Department, level = 0) => {
    const isExpanded = expandedDepts.has(dept.id);
    const hasChildren = dept.children && dept.children.length > 0;
    const hasEmployees = dept.employees && dept.employees.length > 0;

    return (
      <View key={dept.id} style={styles.deptContainer}>
        <TouchableOpacity
          style={[
            styles.deptCard,
            level > 0 && styles.deptCardNested,
            { marginLeft: level * 16 },
          ]}
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
            {hasChildren && (
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
            )}
          </View>
        </TouchableOpacity>

        {/* 部门员工 */}
        {isExpanded && hasEmployees && (
          <View style={[styles.employeesContainer, { marginLeft: (level + 1) * 16 }]}>
            {dept.employees.map(emp => renderEmployee(emp, true))}
          </View>
        )}

        {/* 子部门 */}
        {isExpanded && hasChildren && (
          <View style={styles.childrenContainer}>
            {dept.children.map(childDept => renderDepartment(childDept, level + 1))}
          </View>
        )}
      </View>
    );
  };

  const getDeptColor = (id: number) => {
    const colors = ['#1E88E5', '#00B894', '#F39C12', '#9B59B6', '#E74C3C', '#2ECC71', '#3498DB', '#FF6B9D'];
    return colors[id % colors.length];
  };

  return (
    <Screen>
      {/* 头部统计 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>组织结构</Text>
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
        {/* 部门树 */}
        {orgData?.tree?.map(dept => renderDepartment(dept))}

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
                    <FontAwesome6 name="-barcode" size={16} color="#636E72" />
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
                    <FontAwesome6 name="-users" size={16} color="#636E72" />
                    <Text style={styles.infoLabel}>员工数量</Text>
                    <Text style={styles.infoValue}>{selectedDept.employees?.length || 0} 人</Text>
                  </View>

                  <View style={styles.infoItem}>
                    <FontAwesome6 name="sitemap" size={16} color="#636E72" />
                    <Text style={styles.infoLabel}>子部门</Text>
                    <Text style={styles.infoValue}>{selectedDept.children?.length || 0} 个</Text>
                  </View>
                </View>
              </ScrollView>
            )}
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2D3436',
    marginBottom: 12,
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
    padding: 14,
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
    width: 60,
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
});
