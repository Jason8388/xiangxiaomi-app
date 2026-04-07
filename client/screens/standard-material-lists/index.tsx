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
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { getApiBaseUrl } from '@/utils/api';

interface MaterialItem {
  material_id: number;
  material_name: string;
  material_number: string;
  quantity: number;
}

interface StandardMaterialList {
  id: number;
  name: string;
  description?: string;
  materials: MaterialItem[];
  created_at: string;
}

export default function StandardMaterialList() {
  const router = useSafeRouter();
  const [lists, setLists] = useState<StandardMaterialList[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingList, setEditingList] = useState<StandardMaterialList | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedList, setSelectedList] = useState<StandardMaterialList | null>(null);
  const [materialModalVisible, setMaterialModalVisible] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [availableMaterials, setAvailableMaterials] = useState<any[]>([]);

  useEffect(() => {
    loadLists();
    loadAvailableMaterials();
  }, []);

  const loadLists = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${getApiBaseUrl()}/api/v1/standard-material-lists`
      );
      const data = await response.json();
      if (response.ok) {
        setLists(data);
      }
    } catch (error) {
      console.error('Fetch lists error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableMaterials = async () => {
    try {
      const response = await fetch(
        `${getApiBaseUrl()}/api/v1/materials`
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
    setEditingList(null);
    setFormData({ name: '', description: '' });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.name) {
      Alert.alert('提示', '标准物料单名称不能为空');
      return;
    }

    try {
      const response = editingList
        ? await fetch(
            `${getApiBaseUrl()}/api/v1/standard-material-lists/${editingList.id}`,
            {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(formData),
            }
          )
        : await fetch(
            `${getApiBaseUrl()}/api/v1/standard-material-lists`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(formData),
            }
          );

      const data = await response.json();

      if (response.ok) {
        Alert.alert('成功', editingList ? '修改成功' : '创建成功');
        setModalVisible(false);
        loadLists();
      } else {
        throw new Error(data.error || '操作失败');
      }
    } catch (error: any) {
      Alert.alert('错误', error.message);
    }
  };

  const handleDelete = (list: StandardMaterialList) => {
    Alert.alert('确认删除', `确定要删除标准物料单"${list.name}"吗？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            const response = await fetch(
              `${getApiBaseUrl()}/api/v1/standard-material-lists/${list.id}`,
              {
                method: 'DELETE',
              }
            );
            const data = await response.json();
            if (response.ok) {
              Alert.alert('成功', '删除成功');
              loadLists();
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

  const handleViewDetail = (list: StandardMaterialList) => {
    router.push('/standard-material-detail', { id: list.id });
  };

  const handleAddMaterial = (materialId: number) => {
    Alert.alert('提示', '添加物料功能开发中');
  };

  const handleDownload = async (list: StandardMaterialList) => {
    try {
      Alert.alert('提示', '正在生成下载文件，请稍候...');

      if (Platform.OS === 'web') {
        // Web 端实现
        const response = await fetch(
          `${getApiBaseUrl()}/api/v1/standard-material-lists/${list.id}/download`,
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
        a.download = `标准物料单_${list.name}_${new Date().getTime()}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        Alert.alert('成功', '下载成功');
      } else {
        // 移动端实现
        const response = await fetch(
          `${getApiBaseUrl()}/api/v1/standard-material-lists/${list.id}/download`
        );
        const data = await response.text();

        if (!response.ok) {
          throw new Error(data || '下载失败');
        }

        const fileUri = `${(FileSystem as any).documentDirectory}标准物料单_${list.name}_${Date.now()}.xlsx`;
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
      <PageHeader title="标准物料单管理" />

      {/* 操作按钮 */}
      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
          <FontAwesome6 name="plus" size={16} color="#FFFFFF" />
          <Text style={styles.addButtonText}>新建标准物料单</Text>
        </TouchableOpacity>
      </View>

      {/* 标准物料单列表 */}
      <ScrollView style={styles.listContainer}>
        {loading ? (
          <View style={styles.centerContainer}>
            <Text>加载中...</Text>
          </View>
        ) : lists.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>暂无标准物料单</Text>
          </View>
        ) : (
          lists.map((list) => (
            <View key={list.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleContainer}>
                  <FontAwesome6 name="file-lines" size={18} color="#1E88E5" />
                  <Text style={styles.cardTitle}>{list.name}</Text>
                </View>
                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => handleDownload(list)}
                  >
                    <FontAwesome6 name="download" size={16} color="#27AE60" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => {
                      setEditingList(list);
                      setFormData({
                        name: list.name,
                        description: list.description || '',
                      });
                      setModalVisible(true);
                    }}
                  >
                    <FontAwesome6 name="pen" size={16} color="#F39C12" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => handleDelete(list)}
                  >
                    <FontAwesome6 name="trash" size={16} color="#E74C3C" />
                  </TouchableOpacity>
                </View>
              </View>

              {list.description && (
                <Text style={styles.description}>{list.description}</Text>
              )}

              <View style={styles.cardFooter}>
                <TouchableOpacity
                  style={styles.viewButton}
                  onPress={() => handleViewDetail(list)}
                >
                  <FontAwesome6 name="list-check" size={14} color="#FFFFFF" />
                  <Text style={styles.viewButtonText}>
                    查看明细 ({list.materials.length}项)
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* 新增/编辑标准物料单 Modal */}
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
                {editingList ? '编辑标准物料单' : '新建标准物料单'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <FontAwesome6 name="xmark" size={20} color="#636E72" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>标准物料单名称 *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="请输入标准物料单名称"
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
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
              {selectedList?.materials.map((item) => (
                <View key={item.material_id} style={styles.materialItem}>
                  <Text style={styles.materialName}>{item.material_name}</Text>
                  <Text style={styles.materialNumber}>{item.material_number}</Text>
                  <View style={styles.quantityContainer}>
                    <Text style={styles.quantityLabel}>数量:</Text>
                    <Text style={styles.quantityValue}>{item.quantity}</Text>
                  </View>
                </View>
              ))}
              {selectedList?.materials.length === 0 && (
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
                      handleAddMaterial(material.id);
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
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
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
