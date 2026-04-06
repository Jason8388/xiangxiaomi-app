import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Screen } from '@/components/Screen';
import { PageHeader } from '@/components/PageHeader';
import { FontAwesome6 } from '@expo/vector-icons';

interface MaterialRequirementItem {
  material_id: number;
  material_name: string;
  material_number: string;
  quantity: number;
}

interface MaterialRequirement {
  id: number;
  title: string;
  description?: string;
  materials: MaterialRequirementItem[];
  created_at: string;
  created_by: string;
  status: string;
}

export default function MaterialRequirements() {
  const [requirements, setRequirements] = useState<MaterialRequirement[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRequirement, setEditingRequirement] = useState<MaterialRequirement | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
  });
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedRequirement, setSelectedRequirement] = useState<MaterialRequirement | null>(null);
  const [materialModalVisible, setMaterialModalVisible] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [availableMaterials, setAvailableMaterials] = useState<any[]>([]);
  const [quantityModalVisible, setQuantityModalVisible] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);
  const [quantity, setQuantity] = useState('');

  useEffect(() => {
    loadRequirements();
    loadAvailableMaterials();
  }, []);

  const loadRequirements = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/material-requirements`
      );
      const data = await response.json();
      if (response.ok) {
        setRequirements(data);
      }
    } catch (error) {
      console.error('Fetch requirements error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableMaterials = async () => {
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/materials`
      );
      const data = await response.json();
      if (response.ok) {
        setAvailableMaterials(data);
      }
    } catch (error) {
      console.error('Fetch materials error:', error);
    }
  };

  const handleAdd = () => {
    setEditingRequirement(null);
    setFormData({ title: '', description: '' });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.title) {
      Alert.alert('提示', '物料需求单标题不能为空');
      return;
    }

    try {
      const response = editingRequirement
        ? await fetch(
            `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/material-requirements/${editingRequirement.id}`,
            {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(formData),
            }
          )
        : await fetch(
            `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/material-requirements`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(formData),
            }
          );

      const data = await response.json();

      if (response.ok) {
        Alert.alert('成功', editingRequirement ? '修改成功' : '创建成功');
        setModalVisible(false);
        loadRequirements();
      } else {
        throw new Error(data.error || '操作失败');
      }
    } catch (error: any) {
      Alert.alert('错误', error.message);
    }
  };

  const handleDelete = (requirement: MaterialRequirement) => {
    Alert.alert('确认删除', `确定要删除物料需求单"${requirement.title}"吗？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            const response = await fetch(
              `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/material-requirements/${requirement.id}`,
              {
                method: 'DELETE',
              }
            );
            const data = await response.json();
            if (response.ok) {
              Alert.alert('成功', '删除成功');
              loadRequirements();
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

  const handleViewDetail = (requirement: MaterialRequirement) => {
    setSelectedRequirement(requirement);
    setDetailModalVisible(true);
  };

  const handleAddMaterial = (material: any) => {
    setSelectedMaterial(material);
    setQuantity('');
    setQuantityModalVisible(true);
  };

  const handleConfirmAddMaterial = async () => {
    if (!selectedRequirement) {
      Alert.alert('提示', '请先选择物料需求单');
      return;
    }

    if (!quantity || Number(quantity) <= 0) {
      Alert.alert('提示', '请输入有效的需求数量');
      return;
    }

    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/material-requirements/${selectedRequirement.id}/materials`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            material_id: selectedMaterial.id,
            quantity: Number(quantity),
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        Alert.alert('成功', '添加成功');
        setQuantityModalVisible(false);
        loadRequirements();
        setSelectedRequirement(data);
      } else {
        throw new Error(data.error || '添加失败');
      }
    } catch (error: any) {
      Alert.alert('错误', error.message);
    }
  };

  const handleDownload = async (requirement: MaterialRequirement) => {
    try {
      Alert.alert('提示', '正在生成下载文件，请稍候...');

      if (Platform.OS === 'web') {
        // Web 端实现
        const response = await fetch(
          `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/material-requirements/${requirement.id}/download`,
          {
            method: 'GET',
          }
        );

        if (!response.ok) {
          throw new Error('下载失败');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `物料需求单_${requirement.title}_${new Date().getTime()}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        Alert.alert('成功', '下载成功');
      } else {
        // 移动端实现
        const response = await fetch(
          `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/material-requirements/${requirement.id}/download`
        );
        const data = await response.text();

        if (!response.ok) {
          throw new Error(data || '下载失败');
        }

        const fileUri = `${(FileSystem as any).documentDirectory}物料需求单_${requirement.title}_${Date.now()}.xlsx`;
        await (FileSystem as any).writeAsStringAsync(fileUri, data, {
          encoding: (FileSystem as any).EncodingType.Base64,
        });

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri);
          Alert.alert('成功', '下载成功');
        } else {
          Alert.alert('成功', `文件已保存到: ${fileUri}`);
        }
      }
    } catch (error: any) {
      Alert.alert('错误', error.message);
    }
  };

  return (
    <Screen>
      <PageHeader title="物料需求单管理" />

      {/* 操作按钮 */}
      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
          <FontAwesome6 name="plus" size={16} color="#FFFFFF" />
          <Text style={styles.addButtonText}>新建需求单</Text>
        </TouchableOpacity>
      </View>

      {/* 物料需求单列表 */}
      <ScrollView style={styles.listContainer}>
        {loading ? (
          <View style={styles.centerContainer}>
            <Text>加载中...</Text>
          </View>
        ) : requirements.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>暂无物料需求单</Text>
          </View>
        ) : (
          requirements.map((req) => (
            <View key={req.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleContainer}>
                  <FontAwesome6 name="file-lines" size={18} color="#F39C12" />
                  <View>
                    <Text style={styles.cardTitle}>{req.title}</Text>
                    <Text style={styles.cardMeta}>
                      {req.created_by} · {new Date(req.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => handleDownload(req)}
                  >
                    <FontAwesome6 name="download" size={16} color="#27AE60" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => {
                      setEditingRequirement(req);
                      setFormData({
                        title: req.title,
                        description: req.description || '',
                      });
                      setModalVisible(true);
                    }}
                  >
                    <FontAwesome6 name="pen" size={16} color="#F39C12" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => handleDelete(req)}
                  >
                    <FontAwesome6 name="trash" size={16} color="#E74C3C" />
                  </TouchableOpacity>
                </View>
              </View>

              {req.description && (
                <Text style={styles.description}>{req.description}</Text>
              )}

              <View style={styles.cardFooter}>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        req.status === '已完成'
                          ? 'rgba(46, 204, 113, 0.1)'
                          : 'rgba(241, 196, 15, 0.1)',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color: req.status === '已完成' ? '#2ECC71' : '#F1C40F',
                      },
                    ]}
                  >
                    {req.status}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.viewButton}
                  onPress={() => handleViewDetail(req)}
                >
                  <FontAwesome6 name="list-check" size={14} color="#FFFFFF" />
                  <Text style={styles.viewButtonText}>
                    查看明细 ({req.materials.length}项)
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* 新增/编辑需求单 Modal */}
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
                {editingRequirement ? '编辑需求单' : '新建需求单'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <FontAwesome6 name="xmark" size={20} color="#636E72" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>需求单标题 *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="请输入需求单标题"
                  value={formData.title}
                  onChangeText={(text) => setFormData({ ...formData, title: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>描述</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea]}
                  placeholder="请输入描述信息"
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                  multiline
                  numberOfLines={3}
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

      {/* 查看明细 Modal */}
      <Modal
        visible={detailModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>物料明细</Text>
              <View style={styles.headerActions}>
                <TouchableOpacity
                  style={styles.headerActionButton}
                  onPress={() => {
                    setMaterialModalVisible(true);
                    setDetailModalVisible(false);
                  }}
                >
                  <FontAwesome6 name="plus" size={14} color="#1E88E5" />
                  <Text style={styles.headerActionText}>添加物料</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                  <FontAwesome6 name="xmark" size={20} color="#636E72" />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView style={styles.modalBody}>
              {selectedRequirement?.materials.map((item) => (
                <View key={item.material_id} style={styles.materialItem}>
                  <Text style={styles.materialName}>{item.material_name}</Text>
                  <Text style={styles.materialNumber}>{item.material_number}</Text>
                  <View style={styles.quantityContainer}>
                    <Text style={styles.quantityLabel}>需求数量:</Text>
                    <Text style={styles.quantityValue}>{item.quantity}</Text>
                  </View>
                </View>
              ))}
              {selectedRequirement?.materials.length === 0 && (
                <View style={styles.centerContainer}>
                  <Text style={styles.emptyText}>暂无物料明细</Text>
                </View>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setDetailModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>关闭</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 添加物料 Modal */}
      <Modal
        visible={materialModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setMaterialModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>选择物料</Text>
              <TouchableOpacity onPress={() => setMaterialModalVisible(false)}>
                <FontAwesome6 name="xmark" size={20} color="#636E72" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchBar}>
              <FontAwesome6 name="magnifying-glass" size={16} color="#636E72" />
              <TextInput
                style={styles.searchInput}
                placeholder="搜索物料"
                value={searchKeyword}
                onChangeText={setSearchKeyword}
                placeholderTextColor="#95A5A6"
              />
            </View>

            <ScrollView style={styles.modalBody}>
              {availableMaterials
                .filter(
                  (m) =>
                    !searchKeyword ||
                    m.material_name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
                    m.material_number.toLowerCase().includes(searchKeyword.toLowerCase())
                )
                .map((material) => (
                  <TouchableOpacity
                    key={material.id}
                    style={styles.materialSelectorItem}
                    onPress={() => {
                      handleAddMaterial(material);
                    }}
                  >
                    <Text style={styles.materialSelectorName}>{material.material_name}</Text>
                    <Text style={styles.materialSelectorNumber}>
                      {material.material_number}
                    </Text>
                    <FontAwesome6 name="plus" size={16} color="#1E88E5" />
                  </TouchableOpacity>
                ))}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setMaterialModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 物料数量输入 Modal */}
      <Modal
        visible={quantityModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setQuantityModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>输入需求数量</Text>
              <TouchableOpacity onPress={() => setQuantityModalVisible(false)}>
                <FontAwesome6 name="xmark" size={20} color="#636E72" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>物料名称</Text>
                <Text style={styles.formValue}>{selectedMaterial?.material_name}</Text>
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>物料编号</Text>
                <Text style={styles.formValue}>{selectedMaterial?.material_number}</Text>
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>需求数量 *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="请输入需求数量"
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="number-pad"
                />
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setQuantityModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleConfirmAddMaterial}
              >
                <Text style={styles.saveButtonText}>确认</Text>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  addButton: {
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
    paddingHorizontal: 16,
    paddingBottom: 24,
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D3436',
  },
  cardMeta: {
    fontSize: 12,
    color: '#636E72',
    marginTop: 2,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 6,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#F5F7FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  description: {
    fontSize: 13,
    color: '#636E72',
    marginBottom: 12,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#1E88E5',
  },
  viewButtonText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '500',
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(30, 136, 229, 0.1)',
  },
  headerActionText: {
    fontSize: 12,
    color: '#1E88E5',
    fontWeight: '500',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3436',
  },
  modalBody: {
    padding: 16,
    maxHeight: 400,
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
  formValue: {
    fontSize: 14,
    color: '#636E72',
    paddingVertical: 8,
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#F5F7FA',
    borderRadius: 8,
    gap: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#2D3436',
  },
  materialItem: {
    backgroundColor: '#F5F7FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  materialName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 4,
  },
  materialNumber: {
    fontSize: 13,
    color: '#636E72',
    marginBottom: 6,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  quantityLabel: {
    fontSize: 13,
    color: '#636E72',
  },
  quantityValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E88E5',
  },
  materialSelectorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: '#F5F7FA',
    borderRadius: 8,
    marginBottom: 8,
  },
  materialSelectorName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#2D3436',
  },
  materialSelectorNumber: {
    fontSize: 12,
    color: '#636E72',
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
