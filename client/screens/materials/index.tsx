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
  Image,
  Platform,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Screen } from '@/components/Screen';
import { PageHeader } from '@/components/PageHeader';
import { FontAwesome6 } from '@expo/vector-icons';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import MaterialTagSelector from '@/components/MaterialTagSelector';

interface Material {
  id: number;
  material_number: string;
  material_name: string;
  material_spec: string;
  material_unit: string;
  category?: string;
  stock_quantity: number;
  supplier?: string;
  unit_price?: number;
  qr_code?: string;
  remarks?: string;
  tags?: string[];
}

export default function MaterialManagement() {
  const router = useSafeRouter();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [filteredMaterials, setFilteredMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [qrCodeModalVisible, setQrCodeModalVisible] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [tagSelectorVisible, setTagSelectorVisible] = useState(false);
  const [formData, setFormData] = useState({
    material_number: '',
    material_name: '',
    material_spec: '',
    material_unit: '',
    category: '',
    stock_quantity: 0,
    supplier: '',
    unit_price: '',
    remarks: '',
    tags: [] as string[],
  });

  useEffect(() => {
    const loadMaterials = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/materials`
        );
        const data = await response.json();
        if (response.ok) {
          setMaterials(data);
        }
      } catch (error) {
        console.error('Fetch materials error:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMaterials();
  }, []);

  useEffect(() => {
    if (searchKeyword.trim()) {
      const filtered = materials.filter(
        (m) =>
          m.material_name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
          m.material_number.toLowerCase().includes(searchKeyword.toLowerCase()) ||
          m.material_spec?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
          m.category?.toLowerCase().includes(searchKeyword.toLowerCase())
      );
      setFilteredMaterials(filtered);
    } else {
      setFilteredMaterials(materials);
    }
  }, [searchKeyword, materials]);

  const handleAdd = () => {
    setEditingMaterial(null);
    setFormData({
      material_number: '',
      material_name: '',
      material_spec: '',
      material_unit: '',
      category: '',
      stock_quantity: 0,
      supplier: '',
      unit_price: '',
      remarks: '',
      tags: [],
    });
    setModalVisible(true);
  };

  const handleEdit = (material: Material) => {
    setEditingMaterial(material);
    setFormData({
      material_number: material.material_number,
      material_name: material.material_name,
      material_spec: material.material_spec,
      material_unit: material.material_unit,
      category: material.category || '',
      stock_quantity: material.stock_quantity,
      supplier: material.supplier || '',
      unit_price: material.unit_price?.toString() || '',
      remarks: material.remarks || '',
      tags: material.tags || [],
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.material_number || !formData.material_name || !formData.material_unit) {
      Alert.alert('提示', '物料编号、物料名称和计量单位不能为空');
      return;
    }

    try {
      const payload = {
        ...formData,
        stock_quantity: Number(formData.stock_quantity),
        unit_price: formData.unit_price ? Number(formData.unit_price) : null,
      };

      const response = editingMaterial
        ? await fetch(
            `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/materials/${editingMaterial.id}`,
            {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            }
          )
        : await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/materials`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('成功', editingMaterial ? '修改成功' : '创建成功');
        setModalVisible(false);
        setLoading(true);
        const loadResponse = await fetch(
          `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/materials`
        );
        const loadData = await loadResponse.json();
        if (loadResponse.ok) {
          setMaterials(loadData);
        }
        setLoading(false);
      } else {
        throw new Error(data.error || '操作失败');
      }
    } catch (error: any) {
      Alert.alert('错误', error.message);
    }
  };

  const handleDelete = (material: Material) => {
    Alert.alert('确认删除', `确定要删除物料"${material.material_name}"吗？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            const response = await fetch(
              `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/materials/${material.id}`,
              {
                method: 'DELETE',
              }
            );
            const data = await response.json();
            if (response.ok) {
              Alert.alert('成功', '删除成功');
              setLoading(true);
              const loadResponse = await fetch(
                `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/materials`
              );
              const loadData = await loadResponse.json();
              if (loadResponse.ok) {
                setMaterials(loadData);
              }
              setLoading(false);
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

  const handleBatchImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const file = result.assets[0];
      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        name: file.name,
        type: file.mimeType || 'application/octet-stream',
      } as any);

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/materials/batch-import`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const data = await response.json();

      if (response.ok) {
        Alert.alert('成功', `成功导入 ${data.imported_count} 条物料记录`);
        setLoading(true);
        const loadResponse = await fetch(
          `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/materials`
        );
        const loadData = await loadResponse.json();
        if (loadResponse.ok) {
          setMaterials(loadData);
        }
        setLoading(false);
      } else {
        throw new Error(data.error || '导入失败');
      }
    } catch (error: any) {
      Alert.alert('错误', error.message);
    }
  };

  const handleBatchExport = async () => {
    try {
      Alert.alert('提示', '正在生成导出文件，请稍候...');

      if (Platform.OS === 'web') {
        // Web 端实现
        const response = await fetch(
          `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/materials/batch-export`,
          {
            method: 'GET',
          }
        );

        if (!response.ok) {
          throw new Error('导出失败');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `物料清单_${new Date().getTime()}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        Alert.alert('成功', '导出成功');
      } else {
        // 移动端实现
        const response = await fetch(
          `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/materials/batch-export`
        );
        const data = await response.text();

        if (!response.ok) {
          throw new Error(data || '导出失败');
        }

        const fileUri = `${(FileSystem as any).documentDirectory}物料清单_${Date.now()}.xlsx`;
        await (FileSystem as any).writeAsStringAsync(fileUri, data, {
          encoding: (FileSystem as any).EncodingType.Base64,
        });

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri);
          Alert.alert('成功', '导出成功');
        } else {
          Alert.alert('成功', `文件已保存到: ${fileUri}`);
        }
      }
    } catch (error: any) {
      Alert.alert('错误', error.message);
    }
  };

  const handleGenerateQRCode = async (material: Material) => {
    try {
      setSelectedMaterial(material);
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/materials/${material.id}/qrcode`,
        {
          method: 'POST',
        }
      );
      const data = await response.json();
      if (response.ok) {
        setQrCodeUrl(data.qr_code_url);
        setQrCodeModalVisible(true);
      } else {
        throw new Error(data.error || '生成失败');
      }
    } catch (error: any) {
      Alert.alert('错误', error.message);
    }
  };

  return (
    <Screen>
      <PageHeader title="物料管理" />

      {/* 统计信息 */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <FontAwesome6 name="box" size={20} color="#1E88E5" />
          <View style={styles.statContent}>
            <Text style={styles.statValue}>{materials.length}</Text>
            <Text style={styles.statLabel}>物料总数</Text>
          </View>
        </View>
        <View style={styles.statCard}>
          <FontAwesome6 name="database" size={20} color="#2ECC71" />
          <View style={styles.statContent}>
            <Text style={styles.statValue}>
              {materials.reduce((sum, m) => sum + m.stock_quantity, 0)}
            </Text>
            <Text style={styles.statLabel}>库存总量</Text>
          </View>
        </View>
      </View>

      {/* 搜索栏 */}
      <View style={styles.searchBar}>
        <FontAwesome6 name="magnifying-glass" size={16} color="#636E72" />
        <TextInput
          style={styles.searchInput}
          placeholder="搜索物料名称、编号、规格、分类"
          value={searchKeyword}
          onChangeText={setSearchKeyword}
          placeholderTextColor="#95A5A6"
        />
      </View>

      {/* 操作按钮 */}
      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
          <FontAwesome6 name="plus" size={16} color="#FFFFFF" />
          <Text style={styles.addButtonText}>新增物料</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.importButton]} onPress={handleBatchImport}>
          <FontAwesome6 name="file-import" size={16} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>批量导入</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.exportButton]} onPress={handleBatchExport}>
          <FontAwesome6 name="file-export" size={16} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>批量导出</Text>
        </TouchableOpacity>
      </View>

      {/* 物料列表 */}
      <ScrollView style={styles.listContainer}>
        {loading ? (
          <View style={styles.centerContainer}>
            <Text>加载中...</Text>
          </View>
        ) : filteredMaterials.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>
              {searchKeyword ? '未找到匹配的物料' : '暂无物料信息'}
            </Text>
          </View>
        ) : (
          filteredMaterials.map((material) => (
            <TouchableOpacity
              key={material.id}
              style={styles.card}
              onPress={() => router.push('/material-detail', { id: material.id })}
              activeOpacity={0.7}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleContainer}>
                  <FontAwesome6 name="box" size={18} color="#1E88E5" />
                  <View>
                    <Text style={styles.cardNumber}>{material.material_number}</Text>
                    <Text style={styles.cardTitle}>{material.material_name}</Text>
                  </View>
                </View>
                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleGenerateQRCode(material);
                    }}
                  >
                    <FontAwesome6 name="qrcode" size={16} color="#9B59B6" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleEdit(material);
                    }}
                  >
                    <FontAwesome6 name="pen" size={16} color="#F39C12" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDelete(material);
                    }}
                  >
                    <FontAwesome6 name="trash" size={16} color="#E74C3C" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.cardInfo}>
                <Text style={styles.infoLabel}>规格:</Text>
                <Text style={styles.infoValue}>{material.material_spec || '-'}</Text>
              </View>

              <View style={styles.cardInfo}>
                <Text style={styles.infoLabel}>计量单位:</Text>
                <Text style={styles.infoValue}>{material.material_unit}</Text>
              </View>

              {material.category && (
                <View style={styles.cardInfo}>
                  <Text style={styles.infoLabel}>分类:</Text>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{material.category}</Text>
                  </View>
                </View>
              )}

              {material.tags && material.tags.length > 0 && (
                <View style={styles.cardInfo}>
                  <Text style={styles.infoLabel}>标签:</Text>
                  <View style={styles.tagsContainer}>
                    {material.tags.slice(0, 3).map((tag, index) => (
                      <View key={index} style={styles.tagBadge}>
                        <Text style={styles.tagText}>{tag}</Text>
                      </View>
                    ))}
                    {material.tags.length > 3 && (
                      <Text style={styles.moreTagsText}>+{material.tags.length - 3}</Text>
                    )}
                  </View>
                </View>
              )}

              {material.supplier && (
                <View style={styles.cardInfo}>
                  <FontAwesome6 name="truck" size={14} color="#636E72" />
                  <Text style={styles.infoValue}>供应商: {material.supplier}</Text>
                </View>
              )}

              <View style={styles.cardFooter}>
                <View style={styles.stockContainer}>
                  <FontAwesome6 name="database" size={14} color="#2ECC71" />
                  <Text style={styles.stockLabel}>库存: </Text>
                  <Text style={styles.stockValue}>{material.stock_quantity} {material.material_unit}</Text>
                </View>
                {material.unit_price && (
                  <View style={styles.priceContainer}>
                    <FontAwesome6 name="yen-sign" size={14} color="#636E72" />
                    <Text style={styles.priceValue}>
                      ¥{material.unit_price.toFixed(2)}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* 新增/编辑物料 Modal */}
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
                {editingMaterial ? '编辑物料' : '新增物料'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <FontAwesome6 name="xmark" size={20} color="#636E72" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>物料编号 *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="请输入物料编号"
                  value={formData.material_number}
                  onChangeText={(text) =>
                    setFormData({ ...formData, material_number: text })
                  }
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>物料名称 *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="请输入物料名称"
                  value={formData.material_name}
                  onChangeText={(text) =>
                    setFormData({ ...formData, material_name: text })
                  }
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>物料规格</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="请输入物料规格"
                  value={formData.material_spec}
                  onChangeText={(text) =>
                    setFormData({ ...formData, material_spec: text })
                  }
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>计量单位 *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="请输入计量单位"
                  value={formData.material_unit}
                  onChangeText={(text) =>
                    setFormData({ ...formData, material_unit: text })
                  }
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>分类</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="请输入物料分类"
                  value={formData.category}
                  onChangeText={(text) =>
                    setFormData({ ...formData, category: text })
                  }
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>物料标签（最多10个）</Text>
                <TouchableOpacity
                  style={styles.tagSelectorButton}
                  onPress={() => setTagSelectorVisible(true)}
                >
                  {formData.tags && formData.tags.length > 0 ? (
                    <View style={styles.selectedTagsContainer}>
                      {formData.tags.slice(0, 3).map((tag, index) => (
                        <View key={index} style={styles.selectedTag}>
                          <Text style={styles.selectedTagText}>{tag}</Text>
                        </View>
                      ))}
                      {formData.tags.length > 3 && (
                        <Text style={styles.moreTagsText}>
                          +{formData.tags.length - 3}
                        </Text>
                      )}
                    </View>
                  ) : (
                    <Text style={styles.tagSelectorPlaceholder}>
                      点击选择标签
                    </Text>
                  )}
                  <FontAwesome6 name="chevron-right" size={14} color="#95A5A6" />
                </TouchableOpacity>
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>库存数量</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="请输入库存数量"
                    value={String(formData.stock_quantity)}
                    onChangeText={(text) =>
                      setFormData({ ...formData, stock_quantity: Number(text) })
                    }
                    keyboardType="number-pad"
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>单价</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="请输入单价"
                    value={formData.unit_price}
                    onChangeText={(text) =>
                      setFormData({ ...formData, unit_price: text })
                    }
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>供应商</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="请输入供应商名称"
                  value={formData.supplier}
                  onChangeText={(text) =>
                    setFormData({ ...formData, supplier: text })
                  }
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>备注</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea]}
                  placeholder="请输入备注信息"
                  value={formData.remarks}
                  onChangeText={(text) =>
                    setFormData({ ...formData, remarks: text })
                  }
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

      {/* 二维码展示 Modal */}
      <Modal
        visible={qrCodeModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setQrCodeModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>物料二维码</Text>
              <TouchableOpacity onPress={() => setQrCodeModalVisible(false)}>
                <FontAwesome6 name="xmark" size={20} color="#636E72" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.qrCodeInfo}>
                <Text style={styles.qrCodeLabel}>物料名称:</Text>
                <Text style={styles.qrCodeValue}>{selectedMaterial?.material_name}</Text>
              </View>
              <View style={styles.qrCodeInfo}>
                <Text style={styles.qrCodeLabel}>物料编号:</Text>
                <Text style={styles.qrCodeValue}>{selectedMaterial?.material_number}</Text>
              </View>

              <View style={styles.qrCodeImageContainer}>
                {qrCodeUrl ? (
                  <Image source={{ uri: qrCodeUrl }} style={styles.qrCodeImage} />
                ) : (
                  <Text style={styles.loadingText}>加载中...</Text>
                )}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setQrCodeModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>关闭</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 标签选择器 */}
      <MaterialTagSelector
        visible={tagSelectorVisible}
        selectedTags={formData.tags}
        onConfirm={(tags) => setFormData({ ...formData, tags })}
        onClose={() => setTagSelectorVisible(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D3436',
  },
  statLabel: {
    fontSize: 12,
    color: '#636E72',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F5F7FA',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#2D3436',
  },
  actionBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
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
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
  },
  importButton: {
    backgroundColor: '#27AE60',
  },
  exportButton: {
    backgroundColor: '#F39C12',
  },
  actionButtonText: {
    fontSize: 13,
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
  cardNumber: {
    fontSize: 12,
    color: '#636E72',
    marginBottom: 2,
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
  cardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  infoLabel: {
    fontSize: 13,
    color: '#636E72',
    width: 70,
  },
  infoValue: {
    fontSize: 13,
    color: '#2D3436',
    flex: 1,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: 'rgba(30, 136, 229, 0.1)',
  },
  categoryText: {
    fontSize: 11,
    color: '#1E88E5',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stockLabel: {
    fontSize: 12,
    color: '#636E72',
  },
  stockValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2ECC71',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '600',
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
  formRow: {
    flexDirection: 'row',
    gap: 12,
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
  qrCodeInfo: {
    marginBottom: 16,
  },
  qrCodeLabel: {
    fontSize: 14,
    color: '#636E72',
    marginBottom: 4,
  },
  qrCodeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3436',
  },
  qrCodeImageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    minHeight: 300,
  },
  qrCodeImage: {
    width: 280,
    height: 280,
  },
  loadingText: {
    fontSize: 14,
    color: '#636E72',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(30, 136, 229, 0.1)',
  },
  tagText: {
    fontSize: 11,
    color: '#1E88E5',
  },
  moreTagsText: {
    fontSize: 11,
    color: '#95A5A6',
    marginLeft: 4,
  },
  tagSelectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F5F7FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  tagSelectorPlaceholder: {
    fontSize: 14,
    color: '#95A5A6',
  },
  selectedTagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  selectedTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(30, 136, 229, 0.1)',
  },
  selectedTagText: {
    fontSize: 12,
    color: '#1E88E5',
  },
});
