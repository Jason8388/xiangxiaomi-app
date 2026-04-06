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
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Screen } from '@/components/Screen';
import { PageHeader } from '@/components/PageHeader';
import { FontAwesome6 } from '@expo/vector-icons';
import { useSafeRouter } from '@/hooks/useSafeRouter';

const DEVICE_TYPES = [
  '智能测温',
  '智能焊接',
  '智能测量',
  '外观品检',
  '尺寸测量',
  '角度定位',
  '数字化产品',
  '第三方设备',
  '其它',
];

interface Device {
  id: number;
  device_number: string;
  device_name: string;
  device_model: string;
  device_type: string;
  customer_name: string;
  factory_date: string;
  acceptance_date?: string;
  warranty_end_date?: string;
  status: string;
  contract_name?: string;
  qr_code_id?: string;
  location?: string;
  remarks?: string;
  service_number?: string;
  site_photos?: string[];
}

export default function DeviceManagement() {
  const router = useSafeRouter();
  const [devices, setDevices] = useState<Device[]>([]);
  const [filteredDevices, setFilteredDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [deviceTypeFilter, setDeviceTypeFilter] = useState('');
  const [sitePhotos, setSitePhotos] = useState<string[]>([]);
  const [qrCode, setQrCode] = useState<string>('');
  const [deviceTypeSelectorVisible, setDeviceTypeSelectorVisible] = useState(false);
  const [formData, setFormData] = useState({
    device_number: '',
    device_name: '',
    device_model: '',
    device_type: '',
    customer_name: '',
    factory_date: '',
    acceptance_date: '',
    warranty_end_date: '',
    contract_name: '',
    contract_number: '',
    location: '',
    remarks: '',
    service_number: '',
  });

  useEffect(() => {
    const loadDevices = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/devices`);
        const data = await response.json();
        if (response.ok) {
          const sorted = data.sort((a: Device, b: Device) =>
            new Date(a.factory_date).getTime() - new Date(b.factory_date).getTime()
          );
          setDevices(sorted);
        }
      } catch (error) {
        console.error('Fetch devices error:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDevices();
  }, []);

  useEffect(() => {
    if (searchKeyword.trim() || deviceTypeFilter) {
      const filtered = devices.filter(
        (d) =>
          (!searchKeyword.trim() ||
            d.device_name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
            d.device_model.toLowerCase().includes(searchKeyword.toLowerCase()) ||
            d.device_number.toLowerCase().includes(searchKeyword.toLowerCase()) ||
            d.customer_name.toLowerCase().includes(searchKeyword.toLowerCase())) &&
          (!deviceTypeFilter || d.device_type === deviceTypeFilter)
      );
      setFilteredDevices(filtered);
    } else {
      setFilteredDevices(devices);
    }
  }, [searchKeyword, deviceTypeFilter, devices]);

  const handleAdd = () => {
    setEditingDevice(null);
    setFormData({
      device_number: '',
      device_name: '',
      device_model: '',
      device_type: '',
      customer_name: '',
      factory_date: '',
      acceptance_date: '',
      warranty_end_date: '',
      contract_name: '',
      contract_number: '',
      location: '',
      remarks: '',
      service_number: '',
    });
    setModalVisible(true);
  };

  const handleEdit = (device: Device) => {
    setEditingDevice(device);
    setFormData({
      device_number: device.device_number,
      device_name: device.device_name,
      device_model: device.device_model,
      device_type: device.device_type,
      customer_name: device.customer_name,
      factory_date: device.factory_date,
      acceptance_date: device.acceptance_date || '',
      warranty_end_date: device.warranty_end_date || '',
      contract_name: device.contract_name || '',
      contract_number: '',
      location: device.location || '',
      remarks: device.remarks || '',
      service_number: device.service_number || '',
    });
    // 加载现场照片
    if (device.site_photos && Array.isArray(device.site_photos)) {
      setSitePhotos(device.site_photos);
    } else {
      setSitePhotos([]);
    }
    // 生成二维码
    setQrCode(`S${device.id}`);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setEditingDevice(null);
    setSitePhotos([]);
    setQrCode('');
    setDeviceTypeSelectorVisible(false);
  };

  const handleSave = async () => {
    if (!formData.device_number || !formData.device_name || !formData.device_type) {
      Alert.alert('提示', '设备出厂编号、设备名称和设备类型不能为空');
      return;
    }

    try {
      // 构建FormData以支持文件上传
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key as keyof typeof formData]) {
          data.append(key, formData[key as keyof typeof formData]);
        }
      });

      // 上传照片
      if (sitePhotos.length > 0) {
        sitePhotos.forEach((photoUri, index) => {
          data.append(`site_photo_${index}`, {
            uri: photoUri,
            type: 'image/jpeg',
            name: `site_photo_${index}.jpg`,
          } as any);
        });
      }

      // 生成设备二维码（设备ID + 前缀S）
      // 如果是编辑模式，使用现有ID；如果是新增模式，使用temp_前缀
      const deviceId = editingDevice ? editingDevice.id : `temp_${Date.now()}`;
      const qrCodeValue = `S${deviceId}`;
      data.append('qr_code', qrCodeValue);

      const url = editingDevice
        ? `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/devices/${editingDevice.id}`
        : `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/devices`;

      const response = await fetch(url, {
        method: editingDevice ? 'PUT' : 'POST',
        body: data,
      });

      const dataJson = await response.json();

      if (response.ok) {
        Alert.alert('成功', editingDevice ? '修改成功' : '创建成功');
        setModalVisible(false);
        setSitePhotos([]);
        setQrCode('');
        setLoading(true);
        const loadResponse = await fetch(
          `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/devices`
        );
        const loadData = await loadResponse.json();
        if (loadResponse.ok) {
          const sorted = loadData.sort((a: Device, b: Device) =>
            new Date(a.factory_date).getTime() - new Date(b.factory_date).getTime()
          );
          setDevices(sorted);
        }
        setLoading(false);
      } else {
        throw new Error(dataJson.error || '操作失败');
      }
    } catch (error: any) {
      Alert.alert('错误', error.message);
    }
  };

  const handlePickImage = async () => {
    try {
      // 请求相册权限
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('提示', '需要相册权限才能上传照片');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedUri = result.assets[0].uri;
        setSitePhotos([...sitePhotos, selectedUri]);
      }
    } catch (error) {
      Alert.alert('错误', '选择图片失败');
    }
  };

  const handleRemovePhoto = (index: number) => {
    const newPhotos = sitePhotos.filter((_, i) => i !== index);
    setSitePhotos(newPhotos);
  };

  const handleOpenCamera = async () => {
    try {
      // 请求相机权限
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('提示', '需要相机权限才能拍照');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const takenUri = result.assets[0].uri;
        setSitePhotos([...sitePhotos, takenUri]);
      }
    } catch (error) {
      Alert.alert('错误', '拍照失败');
    }
  };

  const generateQRCode = () => {
    if (editingDevice) {
      // 编辑模式：使用现有设备ID
      setQrCode(`S${editingDevice.id}`);
    } else if (formData.device_number) {
      // 新增模式：使用设备出厂编号（临时方案）
      setQrCode(`S${formData.device_number}`);
    } else {
      Alert.alert('提示', '请先输入设备出厂编号');
    }
  };

  const handleDelete = (device: Device) => {
    Alert.alert('确认删除', `确定要删除设备"${device.device_name}"吗？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            const response = await fetch(
              `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/devices/${device.id}`,
              {
                method: 'DELETE',
              }
            );
            const data = await response.json();
            if (response.ok) {
              Alert.alert('成功', '删除成功');
              setLoading(true);
              const loadResponse = await fetch(
                `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/devices`
              );
              const loadData = await loadResponse.json();
              if (loadResponse.ok) {
                const sorted = loadData.sort((a: Device, b: Device) =>
                  new Date(a.factory_date).getTime() - new Date(b.factory_date).getTime()
                );
                setDevices(sorted);
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

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  return (
    <Screen>
      <PageHeader title="设备管理" />

      {/* 统计信息 */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <FontAwesome6 name="microchip" size={20} color="#1E88E5" />
          <View style={styles.statContent}>
            <Text style={styles.statValue}>{devices.length}</Text>
            <Text style={styles.statLabel}>设备总数</Text>
          </View>
        </View>
      </View>

      {/* 搜索和筛选 */}
      <View style={styles.searchBar}>
        <FontAwesome6 name="magnifying-glass" size={16} color="#636E72" />
        <TextInput
          style={styles.searchInput}
          placeholder="搜索设备名称、型号、编号、客户"
          value={searchKeyword}
          onChangeText={setSearchKeyword}
          placeholderTextColor="#95A5A6"
        />
      </View>

      {/* 设备类型筛选 */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.filterChip, !deviceTypeFilter && styles.filterChipActive]}
            onPress={() => setDeviceTypeFilter('')}
          >
            <Text
              style={[
                styles.filterChipText,
                !deviceTypeFilter && styles.filterChipTextActive,
              ]}
            >
              全部
            </Text>
          </TouchableOpacity>
          {DEVICE_TYPES.map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.filterChip, deviceTypeFilter === type && styles.filterChipActive]}
              onPress={() => setDeviceTypeFilter(deviceTypeFilter === type ? '' : type)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  deviceTypeFilter === type && styles.filterChipTextActive,
                ]}
              >
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 操作按钮 */}
      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
          <FontAwesome6 name="plus" size={16} color="#FFFFFF" />
          <Text style={styles.addButtonText}>新增设备</Text>
        </TouchableOpacity>
      </View>

      {/* 设备列表 */}
      <ScrollView style={styles.listContainer}>
        {loading ? (
          <View style={styles.centerContainer}>
            <Text>加载中...</Text>
          </View>
        ) : filteredDevices.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>
              {searchKeyword || deviceTypeFilter ? '未找到匹配的设备' : '暂无设备信息'}
            </Text>
          </View>
        ) : (
          filteredDevices.map((device) => (
            <View key={device.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleContainer}>
                  <FontAwesome6 name="microchip" size={18} color="#2ECC71" />
                  <Text style={styles.cardTitle}>{device.device_name}</Text>
                </View>
              </View>

              {device.service_number && (
                <View style={styles.cardInfo}>
                  <Text style={styles.infoLabel}>服务编号:</Text>
                  <Text style={styles.infoValue}>{device.service_number}</Text>
                </View>
              )}

              <View style={styles.cardActionsRow}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleEdit(device)}
                >
                  <FontAwesome6 name="pen" size={16} color="#F39C12" />
                  <Text style={styles.actionButtonText}>修改</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => router.push('/device-history', { deviceId: device.id, deviceName: device.device_name })}
                >
                  <FontAwesome6 name="clipboard-list" size={16} color="#3498DB" />
                  <Text style={styles.actionButtonText}>履历表</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleDelete(device)}
                >
                  <FontAwesome6 name="trash" size={16} color="#E74C3C" />
                  <Text style={styles.actionButtonText}>删除</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* 新增/编辑设备 Modal */}
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
                {editingDevice ? '编辑设备' : '新增设备'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <FontAwesome6 name="xmark" size={20} color="#636E72" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>设备出厂编号 *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="请输入设备出厂编号"
                  value={formData.device_number}
                  onChangeText={(text) =>
                    setFormData({ ...formData, device_number: text })
                  }
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>设备服务编号</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="请输入设备服务编号"
                  value={formData.service_number}
                  onChangeText={(text) =>
                    setFormData({ ...formData, service_number: text })
                  }
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>设备名称 *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="请输入设备名称"
                  value={formData.device_name}
                  onChangeText={(text) =>
                    setFormData({ ...formData, device_name: text })
                  }
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>设备型号 *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="请输入设备型号"
                  value={formData.device_model}
                  onChangeText={(text) =>
                    setFormData({ ...formData, device_model: text })
                  }
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>设备类型 *</Text>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => setDeviceTypeSelectorVisible(!deviceTypeSelectorVisible)}
                >
                  <Text style={formData.device_type ? styles.dropdownText : styles.dropdownPlaceholder}>
                    {formData.device_type || '请选择设备类型'}
                  </Text>
                  <FontAwesome6
                    name={deviceTypeSelectorVisible ? 'chevron-up' : 'chevron-down'}
                    size={14}
                    color="#95A5A6"
                  />
                </TouchableOpacity>

                {deviceTypeSelectorVisible && (
                  <View style={styles.dropdownMenu}>
                    <ScrollView style={styles.dropdownList}>
                      {DEVICE_TYPES.map((type) => (
                        <TouchableOpacity
                          key={type}
                          style={[
                            styles.dropdownItem,
                            formData.device_type === type && styles.dropdownItemSelected,
                          ]}
                          onPress={() => {
                            setFormData({ ...formData, device_type: type });
                            setDeviceTypeSelectorVisible(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.dropdownItemText,
                              formData.device_type === type && styles.dropdownItemTextSelected,
                            ]}
                          >
                            {type}
                          </Text>
                          {formData.device_type === type && (
                            <FontAwesome6 name="check" size={16} color="#2ECC71" />
                          )}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>归属客户 *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="请输入客户名称"
                  value={formData.customer_name}
                  onChangeText={(text) =>
                    setFormData({ ...formData, customer_name: text })
                  }
                />
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>进厂日期</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="YYYY-MM-DD"
                    value={formData.factory_date}
                    onChangeText={(text) =>
                      setFormData({ ...formData, factory_date: text })
                    }
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>验收日期</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="YYYY-MM-DD"
                    value={formData.acceptance_date}
                    onChangeText={(text) =>
                      setFormData({ ...formData, acceptance_date: text })
                    }
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>质保到期日期</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="YYYY-MM-DD"
                  value={formData.warranty_end_date}
                  onChangeText={(text) =>
                    setFormData({ ...formData, warranty_end_date: text })
                  }
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>合同名称</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="请输入合同名称"
                  value={formData.contract_name}
                  onChangeText={(text) =>
                    setFormData({ ...formData, contract_name: text })
                  }
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>设备所在位置</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea]}
                  placeholder="请输入设备位置说明"
                  value={formData.location}
                  onChangeText={(text) =>
                    setFormData({ ...formData, location: text })
                  }
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* 设备现场照片 */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>设备现场照片</Text>
                <View style={styles.photoContainer}>
                  {sitePhotos.map((photoUri, index) => (
                    <View key={index} style={styles.photoItem}>
                      <Image source={{ uri: photoUri }} style={styles.photoPreview} />
                      <TouchableOpacity
                        style={styles.photoRemoveButton}
                        onPress={() => handleRemovePhoto(index)}
                      >
                        <FontAwesome6 name="xmark" size={16} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  ))}
                  {sitePhotos.length < 5 && (
                    <TouchableOpacity
                      style={styles.photoAddButton}
                      onPress={handlePickImage}
                    >
                      <FontAwesome6 name="image" size={24} color="#1E88E5" />
                      <Text style={styles.photoAddButtonText}>选择照片</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <View style={styles.photoActions}>
                  <TouchableOpacity style={styles.photoActionButton} onPress={handleOpenCamera}>
                    <FontAwesome6 name="camera" size={16} color="#1E88E5" />
                    <Text style={styles.photoActionText}>拍照</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* 设备二维码 */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>设备二维码</Text>
                <View style={styles.qrCodeContainer}>
                  {qrCode ? (
                    <View style={styles.qrCodeDisplay}>
                      <FontAwesome6 name="qrcode" size={80} color="#2D3436" />
                      <Text style={styles.qrCodeValue}>{qrCode}</Text>
                      <Text style={styles.qrCodeHint}>扫码可查看设备详情</Text>
                    </View>
                  ) : (
                    <View style={styles.qrCodePlaceholder}>
                      <FontAwesome6 name="qrcode" size={60} color="#B2BEC3" />
                      <Text style={styles.qrCodePlaceholderText}>点击生成二维码</Text>
                    </View>
                  )}
                </View>
                {!qrCode && (
                  <TouchableOpacity
                    style={styles.generateQrButton}
                    onPress={generateQRCode}
                  >
                    <FontAwesome6 name="rotate" size={16} color="#FFFFFF" />
                    <Text style={styles.generateQrButtonText}>生成二维码</Text>
                  </TouchableOpacity>
                )}
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  statsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  statCard: {
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2D3436',
  },
  statLabel: {
    fontSize: 13,
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
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
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
    fontSize: 12,
    color: '#636E72',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
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
    gap: 8,
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
    width: 50,
  },
  infoValue: {
    fontSize: 13,
    color: '#2D3436',
    flex: 1,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: 'rgba(30, 136, 229, 0.1)',
  },
  typeText: {
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
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#636E72',
  },
  qrContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  qrText: {
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
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  dropdownText: {
    fontSize: 14,
    color: '#2C3E50',
  },
  dropdownPlaceholder: {
    fontSize: 14,
    color: '#95A5A6',
  },
  dropdownMenu: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dropdownList: {
    maxHeight: 200,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dropdownItemSelected: {
    backgroundColor: '#EBF5FF',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#2C3E50',
  },
  dropdownItemTextSelected: {
    color: '#1E88E5',
    fontWeight: '500',
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
  photoContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  photoItem: {
    width: 100,
    height: 100,
    position: 'relative',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  photoRemoveButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoAddButton: {
    width: 100,
    height: 100,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  photoAddButtonText: {
    fontSize: 12,
    color: '#1E88E5',
  },
  photoActions: {
    flexDirection: 'row',
    gap: 12,
  },
  photoActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#1E88E5',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  photoActionText: {
    fontSize: 14,
    color: '#1E88E5',
    fontWeight: '500',
  },
  qrCodeContainer: {
    alignItems: 'center',
    padding: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginBottom: 12,
  },
  qrCodeDisplay: {
    alignItems: 'center',
    gap: 12,
  },
  qrCodeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3436',
  },
  qrCodeHint: {
    fontSize: 12,
    color: '#636E72',
  },
  qrCodePlaceholder: {
    alignItems: 'center',
    gap: 8,
  },
  qrCodePlaceholderText: {
    fontSize: 14,
    color: '#B2BEC3',
  },
  generateQrButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: '#1E88E5',
    borderRadius: 8,
  },
  generateQrButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  cardActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#636E72',
  },
});
