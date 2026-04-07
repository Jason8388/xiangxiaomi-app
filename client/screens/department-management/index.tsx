import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet, TextInput, Modal } from 'react-native';
import { Screen } from '@/components/Screen';
import { PageHeader } from '@/components/PageHeader';
import { FontAwesome6 } from '@expo/vector-icons';
import { useSafeRouter } from '@/hooks/useSafeRouter';

import { getApiBaseUrl } from '@/utils/api';

interface Department {
  id: number;
  name: string;
  code: string;
  description?: string;
  parent_id: number | null;
  sort_order: number;
  is_disabled: boolean;
  children?: Department[];
}

export default function DepartmentManagement() {
  const router = useSafeRouter();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    parent_id: null as number | null,
    sort_order: 0,
  });

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async (): Promise<Department[]> => {
    try {
      setLoading(true);
      const response = await fetch(`${getApiBaseUrl()}/api/v1/departments`);
      const data = await response.json();
      if (response.ok) {
        setDepartments(data);
        return data;
      }
      return [];
    } catch (error) {
      console.error('Fetch departments error:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = (parentId?: number) => {
    setEditingDept(null);
    setFormData({
      name: '',
      code: '',
      description: '',
      parent_id: parentId || null,
      sort_order: 0,
    });
    setModalVisible(true);
  };

  const handleEdit = (dept: Department) => {
    setEditingDept(dept);
    setFormData({
      name: dept.name,
      code: dept.code,
      description: dept.description || '',
      parent_id: dept.parent_id,
      sort_order: dept.sort_order,
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.code) {
      Alert.alert('提示', '部门名称和代码不能为空');
      return;
    }

    try {
      const response = editingDept
        ? await fetch(
            `${getApiBaseUrl()}/api/v1/departments/${editingDept.id}`,
            {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(formData),
            }
          )
        : await fetch(`${getApiBaseUrl()}/api/v1/departments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
          });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('成功', editingDept ? '修改成功' : '创建成功');
        setModalVisible(false);
        fetchDepartments();
      } else {
        throw new Error(data.error || '操作失败');
      }
    } catch (error: any) {
      Alert.alert('错误', error.message);
    }
  };

  const handleDelete = (dept: Department) => {
    Alert.alert('确认删除', `确定要删除部门"${dept.name}"吗？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            const response = await fetch(
              `${getApiBaseUrl()}/api/v1/departments/${dept.id}`,
              {
                method: 'DELETE',
              }
            );
            const data = await response.json();
            if (response.ok) {
              Alert.alert('成功', '删除成功');
              fetchDepartments();
            } else {
              throw new Error(data.error || '删除失败');
            }
          } catch (error: any) {
            Alert.alert('错误', error.message);
          }
        },
      },
    ]);
  };

  const handleToggleDisable = async (dept: Department) => {
    try {
      const response = await fetch(
        `${getApiBaseUrl()}/api/v1/departments/${dept.id}/toggle`,
        {
          method: 'PATCH',
        }
      );
      const data = await response.json();
      if (response.ok) {
        fetchDepartments();
      } else {
        throw new Error(data.error || '操作失败');
      }
    } catch (error: any) {
      Alert.alert('错误', error.message);
    }
  };

  const renderDepartment = (dept: Department, level: number = 0) => {
    const hasChildren = dept.children && dept.children.length > 0;

    return (
      <View key={dept.id}>
        <View style={[styles.card, dept.is_disabled && styles.cardDisabled]}>
          <View style={[styles.cardContent, { marginLeft: level * 20 }]}>
            <View style={styles.deptInfo}>
              <View style={styles.deptHeader}>
                {hasChildren && (
                  <FontAwesome6 name="folder-tree" size={16} color="#1E88E5" style={styles.folderIcon} />
                )}
                <Text style={[styles.deptName, dept.is_disabled && styles.deptNameDisabled]}>
                  {dept.name}
                </Text>
              </View>
              <View style={styles.deptMeta}>
                <Text style={styles.deptCode}>代码: {dept.code}</Text>
                {dept.description && <Text style={styles.deptDesc}>{dept.description}</Text>}
              </View>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleAdd(dept.id)}
              >
                <FontAwesome6 name="plus" size={16} color="#1E88E5" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleEdit(dept)}
              >
                <FontAwesome6 name="pen" size={16} color="#F39C12" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleToggleDisable(dept)}
              >
                <FontAwesome6
                  name={dept.is_disabled ? "toggle-on" : "toggle-off"}
                  size={16}
                  color={dept.is_disabled ? "#2ECC71" : "#95A5A6"}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleDelete(dept)}
              >
                <FontAwesome6 name="trash" size={16} color="#E74C3C" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
        {hasChildren && (
          <View style={styles.childrenContainer}>
            {dept.children?.map(child => renderDepartment(child, level + 1))}
          </View>
        )}
      </View>
    );
  };

  return (
    <Screen>
      <PageHeader title="部门管理" />

      <View style={styles.actionBar}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => handleAdd()}
        >
          <FontAwesome6 name="plus" size={16} color="#FFFFFF" />
          <Text style={styles.addButtonText}>新建部门</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.listContainer}>
        {loading ? (
          <View style={styles.centerContainer}>
            <Text>加载中...</Text>
          </View>
        ) : departments.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>暂无部门</Text>
          </View>
        ) : (
          departments.map(dept => renderDepartment(dept))
        )}
      </ScrollView>

      {/* 新增/编辑部门 Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingDept ? '编辑部门' : '新建部门'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <FontAwesome6 name="xmark" size={20} color="#636E72" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>部门名称 *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="请输入部门名称"
                  value={formData.name}
                  onChangeText={text => setFormData({ ...formData, name: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>部门代码 *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="请输入部门代码"
                  value={formData.code}
                  onChangeText={text => setFormData({ ...formData, code: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>部门描述</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea]}
                  placeholder="请输入部门描述"
                  value={formData.description}
                  onChangeText={text => setFormData({ ...formData, description: text })}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>排序</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="请输入排序号"
                  value={formData.sort_order.toString()}
                  onChangeText={text =>
                    setFormData({ ...formData, sort_order: parseInt(text) || 0 })
                  }
                  keyboardType="numeric"
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSave}
              >
                <Text style={styles.saveButtonText}>保存</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  actionBar: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  addButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#1E88E5',
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  listContainer: {
    flex: 1,
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 14,
    color: '#636E72',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  cardDisabled: {
    opacity: 0.6,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  deptInfo: {
    flex: 1,
  },
  deptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  folderIcon: {
    marginRight: 8,
  },
  deptName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3436',
  },
  deptNameDisabled: {
    color: '#95A5A6',
  },
  deptMeta: {
    gap: 2,
  },
  deptCode: {
    fontSize: 12,
    color: '#636E72',
  },
  deptDesc: {
    fontSize: 12,
    color: '#95A5A6',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F5F7FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  childrenContainer: {
    marginTop: 8,
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
    borderRadius: 16,
    width: '100%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3436',
  },
  modalBody: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2D3436',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#2D3436',
  },
  formTextArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5F7FA',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#636E72',
  },
  saveButton: {
    backgroundColor: '#1E88E5',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
});
