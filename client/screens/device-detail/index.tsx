import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  StyleSheet,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { PageHeader } from '@/components/PageHeader';
import { FontAwesome6 } from '@expo/vector-icons';
import { SmartDateInput } from '@/components/SmartDateInput';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import * as ImagePicker from 'expo-image-picker';

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

interface DeviceDetail {
  id: number;
  device_number: string;
  device_name: string;
  device_model: string;
  factory_serial_number: string;
  device_type: string;
  customer_name: string;
  factory_date: string;
  acceptance_date?: string;
  warranty_end_date?: string;
  status: string;
  contract_name?: string;
  contract_number?: string;
  location?: string;
  qr_code_id?: string;
  qr_code_url?: string;
  photos?: string[];
  remarks?: string;
}

export default function DeviceDetailPage() {
  const router = useSafeRouter();
  const { id } = useSafeSearchParams<{ id: string }>();
  const [device, setDevice] = useState<DeviceDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<
    'edit' | 'qr' | 'photo' | 'contract'
  >('edit');
  const [formData, setFormData] = useState<any>({});
  const [qrInput, setQrInput] = useState('');
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);

  useEffect(() => {
    const loadDeviceDetail = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const response = await fetch(
          `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/devices/${id}`
        );
        const data = await response.json();
        if (response.ok) {
          setDevice(data);
        }
      } catch (error) {
        console.error('Fetch device detail error:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDeviceDetail();
  }, [id]);

  const loadDeviceDetail = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/devices/${id}`
      );
      const data = await response.json();
      if (response.ok) {
        setDevice(data);
      }
    } catch (error) {
      console.error('Fetch device detail error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWarrantyStatus = () => {
    if (!device?.warranty_end_date) return { text: '-', inWarranty: false };
    const now = new Date();
    const endDate = new Date(device.warranty_end_date);
    return {
      text: now <= endDate ? '质保期内' : '质保期外',
      inWarranty: now <= endDate,
    };
  };

  const handleEditDevice = () => {
    if (!device) return;
    setModalType('edit');
    setFormData({
      device_number: device.device_number,
      device_name: device.device_name,
      device_model: device.device_model,
      factory_serial_number: device.factory_serial_number,
      device_type: device.device_type,
      customer_name: device.customer_name,
      factory_date: device.factory_date,
      acceptance_date: device.acceptance_date || '',
      warranty_end_date: device.warranty_end_date || '',
      contract_name: device.contract_name || '',
      contract_number: device.contract_number || '',
      location: device.location || '',
      remarks: device.remarks || '',
    });
    setModalVisible(true);
  };

  const handleBindQRCode = () => {
    setModalType('qr');
    setQrInput('');
    setModalVisible(true);
  };

  const handleGenerateQRCode = () => {
    Alert.alert('提示', '二维码生成功能开发中');
  };

  const handleDownloadQRCode = () => {
    Alert.alert('提示', '二维码下载功能开发中');
  };

  const handleUploadPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled) {
        setSelectedPhotos([...selectedPhotos, result.assets[0].uri]);
      }
    } catch (error) {
      console.error('Image picker error:', error);
    }
  };

  const handleSave = async () => {
    try {
      if (modalType === 'edit') {
        const response = await fetch(
          `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/devices/${id}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
          }
        );
        const data = await response.json();
        if (response.ok) {
          setModalVisible(false);
          loadDeviceDetail();
        } else {
          throw new Error(data.error || '修改设备信息失败');
        }
      } else if (modalType === 'qr') {
        const response = await fetch(
          `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/devices/${id}/bind-qr`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ qr_code_id: qrInput }),
          }
        );
        const data = await response.json();
        if (response.ok) {
          setModalVisible(false);
          loadDeviceDetail();
        } else {
          throw new Error(data.error || '绑定二维码失败');
        }
      }
    } catch (error: any) {
      Alert.alert('错误', error.message);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  if (loading || !device) {
    return (
      <Screen>
        <View style={styles.centerContainer}>
          <Text>加载中...</Text>
        </View>
      </Screen>
    );
  }

  const warrantyStatus = getWarrantyStatus();

  return (
    <Screen>
      <PageHeader title="设备详情" />

      <ScrollView style={styles.container}>
        {/* 设备基本信息 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FontAwesome6 name="microchip" size={18} color="#2ECC71" />
            <Text style={styles.sectionTitle}>设备信息</Text>
            <TouchableOpacity style={styles.editButton} onPress={handleEditDevice}>
              <FontAwesome6 name="pen" size={14} color="#1E88E5" />
            </TouchableOpacity>
          </View>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>设备名称</Text>
              <Text style={styles.infoValue}>{device.device_name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>设备型号</Text>
              <Text style={styles.infoValue}>{device.device_model}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>出厂编号</Text>
              <Text style={styles.infoValue}>{device.factory_serial_number}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>设备编号</Text>
              <Text style={styles.infoValue}>{device.device_number}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>设备类型</Text>
              <View style={styles.typeBadge}>
                <Text style={styles.typeText}>{device.device_type}</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>归属客户</Text>
              <Text style={styles.infoValue}>{device.customer_name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>进厂日期</Text>
              <Text style={styles.infoValue}>{formatDate(device.factory_date)}</Text>
            </View>
            {device.acceptance_date && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>验收日期</Text>
                <Text style={styles.infoValue}>{formatDate(device.acceptance_date)}</Text>
              </View>
            )}
            {device.warranty_end_date && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>质保到期日期</Text>
                <Text style={styles.infoValue}>{formatDate(device.warranty_end_date)}</Text>
              </View>
            )}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>质保期状态</Text>
              <View
                style={[
                  styles.warrantyBadge,
                  {
                    backgroundColor: warrantyStatus.inWarranty
                      ? 'rgba(46, 204, 113, 0.1)'
                      : 'rgba(231, 76, 60, 0.1)',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.warrantyText,
                    {
                      color: warrantyStatus.inWarranty ? '#2ECC71' : '#E74C3C',
                    },
                  ]}
                >
                  {warrantyStatus.text}
                </Text>
              </View>
            </View>
            {device.location && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>设备位置</Text>
                <Text style={styles.infoValue}>{device.location}</Text>
              </View>
            )}
            {device.remarks && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>备注</Text>
                <Text style={styles.infoValue}>{device.remarks}</Text>
              </View>
            )}
          </View>
        </View>

        {/* 合同信息 */}
        {device.contract_name && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <FontAwesome6 name="file-contract" size={18} color="#1E88E5" />
              <Text style={styles.sectionTitle}>合同信息</Text>
            </View>
            <TouchableOpacity
              style={styles.contractCard}
              onPress={() =>
                router.push('/contract-detail', { id: device.contract_number })
              }
              activeOpacity={0.7}
            >
              <View style={styles.contractHeader}>
                <FontAwesome6 name="file-signature" size={18} color="#F39C12" />
                <View style={styles.contractInfo}>
                  <Text style={styles.contractName}>{device.contract_name}</Text>
                  <Text style={styles.contractNumber}>
                    {device.contract_number}
                  </Text>
                </View>
                <FontAwesome6 name="chevron-right" size={16} color="#636E72" />
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* 二维码信息 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FontAwesome6 name="qrcode" size={18} color="#1E88E5" />
            <Text style={styles.sectionTitle}>二维码</Text>
          </View>
          {device.qr_code_id ? (
            <View style={styles.qrCard}>
              <View style={styles.qrInfo}>
                <Text style={styles.qrLabel}>二维码ID</Text>
                <Text style={styles.qrValue}>{device.qr_code_id}</Text>
              </View>
              <View style={styles.qrActions}>
                <TouchableOpacity
                  style={styles.qrActionButton}
                  onPress={handleBindQRCode}
                >
                  <FontAwesome6 name="pen" size={14} color="#1E88E5" />
                  <Text style={styles.qrActionText}>修改</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.qrActionButton}
                  onPress={handleDownloadQRCode}
                >
                  <FontAwesome6 name="download" size={14} color="#1E88E5" />
                  <Text style={styles.qrActionText}>下载</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.noQrCard}>
              <Text style={styles.noQrText}>暂未绑定二维码</Text>
              <TouchableOpacity style={styles.bindQrButton} onPress={handleBindQRCode}>
                <FontAwesome6 name="link" size={14} color="#FFFFFF" />
                <Text style={styles.bindQrButtonText}>绑定二维码</Text>
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.qrBatchActions}>
            <TouchableOpacity
              style={styles.batchButton}
              onPress={handleGenerateQRCode}
            >
              <FontAwesome6 name="plus" size={14} color="#FFFFFF" />
              <Text style={styles.batchButtonText}>批量生成二维码</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 设备现场照片 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FontAwesome6 name="camera" size={18} color="#1E88E5" />
            <Text style={styles.sectionTitle}>现场照片</Text>
          </View>
          <View style={styles.photosGrid}>
            {(device.photos || []).map((photo, index) => (
              <View key={index} style={styles.photoContainer}>
                <Image source={{ uri: photo }} style={styles.photo} />
              </View>
            ))}
            <TouchableOpacity
              style={styles.addPhotoButton}
              onPress={handleUploadPhoto}
            >
              <FontAwesome6 name="plus" size={24} color="#636E72" />
              <Text style={styles.addPhotoText}>上传照片</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 设备履历表 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FontAwesome6 name="clipboard-list" size={18} color="#1E88E5" />
            <Text style={styles.sectionTitle}>设备履历表</Text>
          </View>
          <TouchableOpacity
            style={styles.recordCard}
            onPress={() => Alert.alert('提示', '设备履历表功能开发中')}
          >
            <View style={styles.recordInfo}>
              <FontAwesome6 name="file-excel" size={24} color="#27AE60" />
              <Text style={styles.recordText}>查看设备履历表</Text>
            </View>
            <FontAwesome6 name="download" size={16} color="#636E72" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* 编辑设备 Modal */}
      {modalType === 'edit' && (
        <Modal
          visible={modalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>编辑设备信息</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <FontAwesome6 name="xmark" size={20} color="#636E72" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>设备名称</Text>
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
                  <Text style={styles.formLabel}>设备型号</Text>
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
                  <Text style={styles.formLabel}>出厂编号</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="请输入出厂编号"
                    value={formData.factory_serial_number}
                    onChangeText={(text) =>
                      setFormData({ ...formData, factory_serial_number: text })
                    }
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>设备编号</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="请输入设备编号"
                    value={formData.device_number}
                    onChangeText={(text) =>
                      setFormData({ ...formData, device_number: text })
                    }
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>设备类型</Text>
                  <View style={styles.typeSelector}>
                    {DEVICE_TYPES.map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.typeOption,
                          formData.device_type === type && styles.typeOptionSelected,
                        ]}
                        onPress={() => setFormData({ ...formData, device_type: type })}
                      >
                        <Text
                          style={[
                            styles.typeOptionText,
                            formData.device_type === type && styles.typeOptionTextSelected,
                          ]}
                        >
                          {type}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>归属客户</Text>
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
                    <SmartDateInput
                      label="进厂日期"
                      value={formData.factory_date}
                      onChange={(date) => setFormData({ ...formData, factory_date: date })}
                      placeholder="请选择进厂日期"
                    />
                  </View>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <SmartDateInput
                      label="验收日期"
                      value={formData.acceptance_date}
                      onChange={(date) => setFormData({ ...formData, acceptance_date: date })}
                      placeholder="请选择验收日期"
                    />
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <SmartDateInput
                    label="质保到期日期"
                    value={formData.warranty_end_date}
                    onChange={(date) => setFormData({ ...formData, warranty_end_date: date })}
                    placeholder="请选择质保到期日期"
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
                  <Text style={styles.formLabel}>设备位置</Text>
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
      )}

      {/* 绑定二维码 Modal */}
      {modalType === 'qr' && (
        <Modal
          visible={modalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>绑定二维码</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <FontAwesome6 name="xmark" size={20} color="#636E72" />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>二维码ID</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="请输入二维码ID"
                    value={qrInput}
                    onChangeText={setQrInput}
                  />
                </View>
              </View>

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
                  <Text style={styles.saveButtonText}>绑定</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3436',
    flex: 1,
  },
  editButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(30, 136, 229, 0.1)',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  infoRow: {
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 13,
    color: '#636E72',
    width: 100,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#2D3436',
    flex: 1,
    textAlign: 'right',
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(30, 136, 229, 0.1)',
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E88E5',
  },
  warrantyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  warrantyText: {
    fontSize: 12,
    fontWeight: '600',
  },
  contractCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  contractHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  contractInfo: {
    flex: 1,
  },
  contractName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 4,
  },
  contractNumber: {
    fontSize: 13,
    color: '#636E72',
  },
  qrCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  qrInfo: {
    marginBottom: 12,
  },
  qrLabel: {
    fontSize: 13,
    color: '#636E72',
    marginBottom: 4,
  },
  qrValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3436',
  },
  qrActions: {
    flexDirection: 'row',
    gap: 12,
  },
  qrActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(30, 136, 229, 0.1)',
  },
  qrActionText: {
    fontSize: 13,
    color: '#1E88E5',
    fontWeight: '500',
  },
  noQrCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  noQrText: {
    fontSize: 14,
    color: '#636E72',
    marginBottom: 12,
  },
  bindQrButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#1E88E5',
  },
  bindQrButtonText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  qrBatchActions: {
    marginTop: 12,
  },
  batchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#1E88E5',
  },
  batchButtonText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  photoContainer: {
    width: 100,
    height: 100,
    borderRadius: 8,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  addPhotoButton: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#F5F7FA',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addPhotoText: {
    fontSize: 12,
    color: '#636E72',
  },
  recordCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  recordInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  recordText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#2D3436',
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
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  typeOptionSelected: {
    backgroundColor: '#1E88E5',
    borderColor: '#1E88E5',
  },
  typeOptionText: {
    fontSize: 13,
    color: '#636E72',
  },
  typeOptionTextSelected: {
    color: '#FFFFFF',
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
