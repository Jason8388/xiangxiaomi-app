import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { PageHeader } from '@/components/PageHeader';
import { FontAwesome6 } from '@expo/vector-icons';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';

interface HistoryRecord {
  id: number;
  device_id: number;
  event_type: string;
  event_date: string;
  description: string;
  operator: string;
  created_at: string;
}

export default function DeviceHistory() {
  const router = useSafeRouter();
  const params = useSafeSearchParams<{ deviceId: string; deviceName: string }>();

  const deviceId = params.deviceId ? parseInt(params.deviceId) : 0;
  const deviceName = params.deviceName || '';

  const [histories, setHistories] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [formData, setFormData] = useState({
    event_type: '',
    event_date: '',
    description: '',
  });

  const EVENT_TYPES = [
    '设备安装',
    '设备维修',
    '设备保养',
    '设备巡检',
    '设备改造',
    '设备报废',
    '设备转移',
    '其它',
  ];

  useEffect(() => {
    loadHistories();
  }, []);

  const loadHistories = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/devices/${deviceId}/history`
      );
      const data = await response.json();
      if (response.ok) {
        setHistories(data);
      } else {
        Alert.alert('错误', data.error || '加载履历表失败');
      }
    } catch (error) {
      console.error('Load histories error:', error);
      Alert.alert('错误', '网络请求失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setFormData({
      event_type: '',
      event_date: new Date().toISOString().split('T')[0],
      description: '',
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.event_type || !formData.event_date) {
      Alert.alert('提示', '事件类型和事件日期不能为空');
      return;
    }

    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/devices/${deviceId}/history`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();
      if (response.ok) {
        Alert.alert('成功', '添加履历记录成功');
        setModalVisible(false);
        loadHistories();
      } else {
        throw new Error(data.error || '添加失败');
      }
    } catch (error: any) {
      Alert.alert('错误', error.message);
    }
  };

  const handleDelete = (recordId: number) => {
    Alert.alert('确认删除', '确定要删除这条履历记录吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            const response = await fetch(
              `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/devices/${deviceId}/history/${recordId}`,
              {
                method: 'DELETE',
              }
            );
            if (response.ok) {
              Alert.alert('成功', '删除成功');
              loadHistories();
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

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <Screen>
      <PageHeader title="设备履历表" />

      {/* 设备名称显示 */}
      {deviceName && (
        <View style={styles.deviceInfoContainer}>
          <FontAwesome6 name="microchip" size={16} color="#2ECC71" />
          <Text style={styles.deviceInfoText}>{deviceName}</Text>
        </View>
      )}

      {/* 操作按钮 */}
      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
          <FontAwesome6 name="plus" size={16} color="#FFFFFF" />
          <Text style={styles.addButtonText}>新增履历</Text>
        </TouchableOpacity>
      </View>

      {/* 履历列表 */}
      <ScrollView style={styles.listContainer}>
        {loading ? (
          <View style={styles.centerContainer}>
            <Text>加载中...</Text>
          </View>
        ) : histories.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>暂无履历记录</Text>
          </View>
        ) : (
          histories.map((record) => (
            <View key={record.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleContainer}>
                  <FontAwesome6 name="clock-rotate-left" size={18} color="#3498DB" />
                  <Text style={styles.cardTitle}>{record.event_type}</Text>
                </View>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => handleDelete(record.id)}
                >
                  <FontAwesome6 name="trash" size={16} color="#E74C3C" />
                </TouchableOpacity>
              </View>

              <View style={styles.cardInfo}>
                <Text style={styles.infoLabel}>事件日期:</Text>
                <Text style={styles.infoValue}>{formatDate(record.event_date)}</Text>
              </View>

              <View style={styles.cardInfo}>
                <Text style={styles.infoLabel}>操作人:</Text>
                <Text style={styles.infoValue}>{record.operator || '-'}</Text>
              </View>

              {record.description && (
                <View style={styles.cardInfo}>
                  <Text style={styles.infoLabel}>描述:</Text>
                  <Text style={styles.infoValue}>{record.description}</Text>
                </View>
              )}

              <View style={styles.cardFooter}>
                <Text style={styles.timestampText}>
                  创建时间: {formatDateTime(record.created_at)}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* 新增履历 Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>新增履历记录</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <FontAwesome6 name="xmark" size={20} color="#636E72" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>事件类型 *</Text>
                <View style={styles.typeSelector}>
                  {EVENT_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.typeOption,
                        formData.event_type === type && styles.typeOptionSelected,
                      ]}
                      onPress={() => setFormData({ ...formData, event_type: type })}
                    >
                      <Text
                        style={[
                          styles.typeOptionText,
                          formData.event_type === type && styles.typeOptionTextSelected,
                        ]}
                      >
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>事件日期 *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="YYYY-MM-DD"
                  value={formData.event_date}
                  onChangeText={(text) => setFormData({ ...formData, event_date: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>描述</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea]}
                  placeholder="请输入事件描述"
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                  multiline
                  numberOfLines={4}
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
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleSave}
              >
                <Text style={styles.submitButtonText}>保存</Text>
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
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2ECC71',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  listContainer: {
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
    color: '#95A5A6',
    fontSize: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },
  iconButton: {
    padding: 8,
  },
  cardInfo: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#7F8C8D',
    width: 80,
    flexShrink: 0,
  },
  infoValue: {
    fontSize: 14,
    color: '#2C3E50',
    flex: 1,
  },
  cardFooter: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  timestampText: {
    fontSize: 12,
    color: '#95A5A6',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
  },
  modalBody: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#34495E',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#2C3E50',
  },
  formTextArea: {
    minHeight: 100,
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
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  typeOptionSelected: {
    backgroundColor: '#3498DB',
    borderColor: '#3498DB',
  },
  typeOptionText: {
    fontSize: 14,
    color: '#636E72',
  },
  typeOptionTextSelected: {
    color: '#FFFFFF',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F8F9FA',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#636E72',
  },
  submitButton: {
    backgroundColor: '#3498DB',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
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
  deviceInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  deviceInfoText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },
});
