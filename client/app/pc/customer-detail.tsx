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
} from 'react-native';
import { PCLayout } from '@/components/pc/PCLayout';
import { FontAwesome6 } from '@expo/vector-icons';
import { getApiBaseUrl } from '@/utils/api';
import { storage } from '@/utils/storage';

interface Customer {
  id: number;
  name: string;
  addresses?: string[];
  industry?: string;
  contacts?: Contact[];
  business_manager?: string;
  sub_group?: string;
  contract_count: number;
  device_count: number;
  work_order_count: number;
  remarks?: string;
}

interface Contact {
  id?: number;
  name: string;
  phone?: string;
  position?: string;
}

export default function PCCustomerDetail() {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'address' | 'contact' | 'edit'>('address');
  const [formData, setFormData] = useState<any>({});
  const [id, setId] = useState<string>('');

  useEffect(() => {
    // 从URL获取id参数
    const params = new URLSearchParams(window.location.search);
    const customerId = params.get('id') || '';
    setId(customerId);
  }, []);

  useEffect(() => {
    if (id) {
      loadCustomerDetail();
    }
  }, [id]);

  const loadCustomerDetail = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const sessionId = await storage.getItem('session_id');
      const response = await fetch(
        `${getApiBaseUrl()}/api/v1/customers/${id}`,
        {
          headers: {
            'X-Session-ID': sessionId || '',
          },
        }
      );
      const data = await response.json();
      if (response.ok) {
        setCustomer(data);
      } else {
        Alert.alert('错误', data.error || '获取客户详情失败');
      }
    } catch (error) {
      console.error('Fetch customer detail error:', error);
      Alert.alert('错误', '网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAddress = () => {
    setModalType('address');
    setFormData({ address: '' });
    setModalVisible(true);
  };

  const handleAddContact = () => {
    setModalType('contact');
    setFormData({ name: '', phone: '', position: '' });
    setModalVisible(true);
  };

  const handleEditCustomer = () => {
    if (!customer) return;
    setModalType('edit');
    setFormData({
      name: customer.name,
      industry: customer.industry || '',
      business_manager: customer.business_manager || '',
      sub_group: customer.sub_group || '',
      remarks: customer.remarks || '',
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    try {
      const sessionId = await storage.getItem('session_id');
      
      if (modalType === 'address') {
        if (!formData.address?.trim()) {
          Alert.alert('错误', '请输入地址');
          return;
        }
        const response = await fetch(
          `${getApiBaseUrl()}/api/v1/customers/${id}/addresses`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Session-ID': sessionId || '',
            },
            body: JSON.stringify({ address: formData.address }),
          }
        );
        const data = await response.json();
        if (response.ok) {
          setModalVisible(false);
          loadCustomerDetail();
        } else {
          Alert.alert('错误', data.error || '添加地址失败');
        }
      } else if (modalType === 'contact') {
        if (!formData.name?.trim()) {
          Alert.alert('错误', '请输入联系人姓名');
          return;
        }
        const response = await fetch(
          `${getApiBaseUrl()}/api/v1/customers/${id}/contacts`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Session-ID': sessionId || '',
            },
            body: JSON.stringify(formData),
          }
        );
        const data = await response.json();
        if (response.ok) {
          setModalVisible(false);
          loadCustomerDetail();
        } else {
          Alert.alert('错误', data.error || '添加联系人失败');
        }
      } else if (modalType === 'edit') {
        if (!formData.name?.trim()) {
          Alert.alert('错误', '请输入客户名称');
          return;
        }
        const response = await fetch(
          `${getApiBaseUrl()}/api/v1/customers/${id}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'X-Session-ID': sessionId || '',
            },
            body: JSON.stringify(formData),
          }
        );
        const data = await response.json();
        if (response.ok) {
          setModalVisible(false);
          loadCustomerDetail();
        } else {
          Alert.alert('错误', data.error || '修改客户信息失败');
        }
      }
    } catch (error: any) {
      console.error('Save error:', error);
      Alert.alert('错误', '网络错误，请稍后重试');
    }
  };

  if (loading) {
    return (
      <PCLayout title="客户详情">
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      </PCLayout>
    );
  }

  if (!customer) {
    return (
      <PCLayout title="客户详情">
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>未找到客户信息</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => window.location.href = '/pc/customers'}
          >
            <Text style={styles.backButtonText}>返回客户列表</Text>
          </TouchableOpacity>
        </View>
      </PCLayout>
    );
  }

  return (
    <PCLayout title="客户详情">
      <View style={styles.container}>
        {/* 客户基本信息 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FontAwesome6 name="building" size={18} color="#1E88E5" />
            <Text style={styles.sectionTitle}>客户信息</Text>
            <TouchableOpacity style={styles.editButton} onPress={handleEditCustomer}>
              <FontAwesome6 name="pen" size={14} color="#1E88E5" />
              <Text style={styles.editButtonText}>编辑</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.infoCard}>
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>客户名称</Text>
                <Text style={styles.infoValue}>{customer.name}</Text>
              </View>
              {customer.industry && (
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>所属行业</Text>
                  <Text style={styles.infoValue}>{customer.industry}</Text>
                </View>
              )}
              {customer.business_manager && (
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>业务经理</Text>
                  <Text style={styles.infoValue}>{customer.business_manager}</Text>
                </View>
              )}
              {customer.sub_group && (
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>服务看管部门</Text>
                  <Text style={styles.infoValue}>{customer.sub_group}</Text>
                </View>
              )}
            </View>
            {customer.remarks && (
              <View style={styles.remarksRow}>
                <Text style={styles.infoLabel}>备注</Text>
                <Text style={styles.infoValue}>{customer.remarks}</Text>
              </View>
            )}
          </View>
        </View>

        {/* 客户地址 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FontAwesome6 name="location-dot" size={18} color="#1E88E5" />
            <Text style={styles.sectionTitle}>客户地址</Text>
            <TouchableOpacity style={styles.addButton} onPress={handleAddAddress}>
              <FontAwesome6 name="plus" size={14} color="#1E88E5" />
              <Text style={styles.addButtonText}>新增地址</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.addressList}>
            {(customer.addresses || []).length === 0 ? (
              <Text style={styles.emptyText}>暂无地址信息</Text>
            ) : (
              (customer.addresses || []).map((address, index) => (
                <View key={index} style={styles.addressCard}>
                  <FontAwesome6 name="map-pin" size={14} color="#636E72" />
                  <Text style={styles.addressText}>{address}</Text>
                </View>
              ))
            )}
          </View>
        </View>

        {/* 客户联系人 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FontAwesome6 name="user-group" size={18} color="#1E88E5" />
            <Text style={styles.sectionTitle}>客户联系人</Text>
            <TouchableOpacity style={styles.addButton} onPress={handleAddContact}>
              <FontAwesome6 name="plus" size={14} color="#1E88E5" />
              <Text style={styles.addButtonText}>新增联系人</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.contactList}>
            {(customer.contacts || []).length === 0 ? (
              <Text style={styles.emptyText}>暂无联系人信息</Text>
            ) : (
              (customer.contacts || []).map((contact, index) => (
                <View key={contact.id || index} style={styles.contactCard}>
                  <View style={styles.contactHeader}>
                    <FontAwesome6 name="user" size={14} color="#636E72" />
                    <Text style={styles.contactName}>{contact.name}</Text>
                    {contact.position && (
                      <Text style={styles.contactPosition}>({contact.position})</Text>
                    )}
                  </View>
                  {contact.phone && (
                    <View style={styles.contactPhoneRow}>
                      <FontAwesome6 name="phone" size={12} color="#636E72" />
                      <Text style={styles.contactPhone}>{contact.phone}</Text>
                    </View>
                  )}
                </View>
              ))
            )}
          </View>
        </View>

        {/* 台账导航 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FontAwesome6 name="folder-open" size={18} color="#1E88E5" />
            <Text style={styles.sectionTitle}>台账管理</Text>
          </View>
          <View style={styles.ledgerGrid}>
            <TouchableOpacity
              style={styles.ledgerCard}
              onPress={() => window.location.href = `/pc/contracts?customerId=${id}`}
            >
              <View style={[styles.ledgerIcon, { backgroundColor: 'rgba(30, 136, 229, 0.1)' }]}>
                <FontAwesome6 name="file-contract" size={24} color="#1E88E5" />
              </View>
              <Text style={styles.ledgerLabel}>合同台账</Text>
              <View style={styles.ledgerBadge}>
                <Text style={styles.ledgerBadgeText}>{customer.contract_count}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.ledgerCard}
              onPress={() => window.location.href = `/pc/devices?customerId=${id}`}
            >
              <View style={[styles.ledgerIcon, { backgroundColor: 'rgba(46, 204, 113, 0.1)' }]}>
                <FontAwesome6 name="microchip" size={24} color="#2ECC71" />
              </View>
              <Text style={styles.ledgerLabel}>设备台账</Text>
              <View style={styles.ledgerBadge}>
                <Text style={styles.ledgerBadgeText}>{customer.device_count}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.ledgerCard}
              onPress={() => window.location.href = `/pc/work-orders?customerId=${id}`}
            >
              <View style={[styles.ledgerIcon, { backgroundColor: 'rgba(155, 89, 182, 0.1)' }]}>
                <FontAwesome6 name="clipboard-list" size={24} color="#9B59B6" />
              </View>
              <Text style={styles.ledgerLabel}>售后工单</Text>
              <View style={styles.ledgerBadge}>
                <Text style={styles.ledgerBadgeText}>{customer.work_order_count}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Modal */}
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
                {modalType === 'address' && '新增地址'}
                {modalType === 'contact' && '新增联系人'}
                {modalType === 'edit' && '编辑客户信息'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <FontAwesome6 name="xmark" size={20} color="#636E72" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {modalType === 'address' && (
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>地址 *</Text>
                  <TextInput
                    style={[styles.formInput, styles.formTextArea]}
                    placeholder="请输入详细地址"
                    value={formData.address}
                    onChangeText={(text) => setFormData({ ...formData, address: text })}
                    multiline
                  />
                </View>
              )}

              {modalType === 'contact' && (
                <>
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>联系人姓名 *</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="请输入联系人姓名"
                      value={formData.name}
                      onChangeText={(text) => setFormData({ ...formData, name: text })}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>联系电话</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="请输入联系电话"
                      value={formData.phone}
                      onChangeText={(text) => setFormData({ ...formData, phone: text })}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>职位</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="请输入职位"
                      value={formData.position}
                      onChangeText={(text) => setFormData({ ...formData, position: text })}
                    />
                  </View>
                </>
              )}

              {modalType === 'edit' && (
                <>
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>客户名称 *</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="请输入客户名称"
                      value={formData.name}
                      onChangeText={(text) => setFormData({ ...formData, name: text })}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>业务经理</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="请输入业务经理"
                      value={formData.business_manager}
                      onChangeText={(text) =>
                        setFormData({ ...formData, business_manager: text })
                      }
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>服务看管部门</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="请输入服务看管部门"
                      value={formData.sub_group}
                      onChangeText={(text) =>
                        setFormData({ ...formData, sub_group: text })
                      }
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>所属行业</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="请输入所属行业"
                      value={formData.industry}
                      onChangeText={(text) =>
                        setFormData({ ...formData, industry: text })
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
                    />
                  </View>
                </>
              )}
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
    </PCLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#636E72',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#E74C3C',
  },
  backButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#1E88E5',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(30, 136, 229, 0.1)',
  },
  editButtonText: {
    fontSize: 13,
    color: '#1E88E5',
    fontWeight: '500',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(30, 136, 229, 0.1)',
  },
  addButtonText: {
    fontSize: 12,
    color: '#1E88E5',
    fontWeight: '500',
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
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  infoItem: {
    width: '50%',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 13,
    color: '#636E72',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    color: '#2D3436',
  },
  remarksRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  addressList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  addressText: {
    fontSize: 14,
    color: '#2D3436',
    flex: 1,
  },
  contactList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  contactCard: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactName: {
    fontSize: 15,
    color: '#2D3436',
    fontWeight: '500',
  },
  contactPosition: {
    fontSize: 13,
    color: '#636E72',
  },
  contactPhoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    marginLeft: 22,
  },
  contactPhone: {
    fontSize: 14,
    color: '#636E72',
  },
  emptyText: {
    fontSize: 14,
    color: '#95A5A6',
    textAlign: 'center',
    paddingVertical: 20,
  },
  ledgerGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  ledgerCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  ledgerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  ledgerLabel: {
    fontSize: 14,
    color: '#2D3436',
    fontWeight: '500',
    marginBottom: 8,
  },
  ledgerBadge: {
    backgroundColor: '#1E88E5',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ledgerBadgeText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 500,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3436',
  },
  modalBody: {
    padding: 16,
    maxHeight: 400,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  modalButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: '#F0F0F0',
  },
  cancelButtonText: {
    fontSize: 14,
    color: '#636E72',
  },
  saveButton: {
    backgroundColor: '#1E88E5',
  },
  saveButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    color: '#2D3436',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#FFFFFF',
  },
  formTextArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
});
