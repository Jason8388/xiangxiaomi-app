import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  StyleSheet,
  TextInput,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { PageHeader } from '@/components/PageHeader';
import { FontAwesome6 } from '@expo/vector-icons';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { getApiBaseUrl } from '@/utils/api';

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

export default function CustomerDetail() {
  const router = useSafeRouter();
  const { id } = useSafeSearchParams<{ id: string }>();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'address' | 'contact' | 'edit'>('address');
  const [formData, setFormData] = useState<any>({});

  // 分管小组选项
  const subGroupOptions = ['技术服务一组', '技术服务二组', '技术服务三组'];
  const [subGroupModalVisible, setSubGroupModalVisible] = useState(false);

  const loadCustomerDetail = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const response = await fetch(
        `${getApiBaseUrl()}/api/v1/customers/${id}`
      );
      const data = await response.json();
      if (response.ok) {
        setCustomer(data);
      }
    } catch (error) {
      console.error('Fetch customer detail error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomerDetail();
  }, [id]);

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
      if (modalType === 'address') {
        // 新增地址
        const response = await fetch(
          `${getApiBaseUrl()}/api/v1/customers/${id}/addresses`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address: formData.address }),
          }
        );
        const data = await response.json();
        if (response.ok) {
          setModalVisible(false);
          loadCustomerDetail();
        } else {
          throw new Error(data.error || '添加地址失败');
        }
      } else if (modalType === 'contact') {
        // 新增联系人
        const response = await fetch(
          `${getApiBaseUrl()}/api/v1/customers/${id}/contacts`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
          }
        );
        const data = await response.json();
        if (response.ok) {
          setModalVisible(false);
          loadCustomerDetail();
        } else {
          throw new Error(data.error || '添加联系人失败');
        }
      } else if (modalType === 'edit') {
        // 编辑客户信息
        const response = await fetch(
          `${getApiBaseUrl()}/api/v1/customers/${id}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
          }
        );
        const data = await response.json();
        if (response.ok) {
          setModalVisible(false);
          loadCustomerDetail();
        } else {
          throw new Error(data.error || '修改客户信息失败');
        }
      }
    } catch (error: any) {
      console.error('Save error:', error);
    }
  };

  const handleDeleteAddress = (address: string) => {
    // 删除地址功能待实现
    console.log('Delete address:', address);
  };

  const handleDeleteContact = (contactId: number) => {
    // 删除联系人功能待实现
    console.log('Delete contact:', contactId);
  };

  if (loading || !customer) {
    return (
      <Screen>
        <View style={styles.centerContainer}>
          <Text>加载中...</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <PageHeader title="客户详情" />

      <ScrollView style={styles.container}>
        {/* 客户基本信息 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FontAwesome6 name="building" size={18} color="#1E88E5" />
            <Text style={styles.sectionTitle}>客户信息</Text>
            <TouchableOpacity style={styles.editButton} onPress={handleEditCustomer}>
              <FontAwesome6 name="pen" size={14} color="#1E88E5" />
            </TouchableOpacity>
          </View>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>客户名称</Text>
              <Text style={styles.infoValue}>{customer.name}</Text>
            </View>
            {customer.industry && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>所属行业</Text>
                <Text style={styles.infoValue}>{customer.industry}</Text>
              </View>
            )}
            {customer.business_manager && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>业务经理</Text>
                <Text style={styles.infoValue}>{customer.business_manager}</Text>
              </View>
            )}
            {customer.remarks && (
              <View style={styles.infoRow}>
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
            {(customer.addresses || []).map((address, index) => (
              <View key={index} style={styles.addressCard}>
                <View style={styles.addressRow}>
                  <FontAwesome6 name="map-pin" size={14} color="#636E72" />
                  <Text style={styles.addressText}>{address}</Text>
                  <TouchableOpacity onPress={() => handleDeleteAddress(address)}>
                    <FontAwesome6 name="trash" size={14} color="#E74C3C" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
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
            {(customer.contacts || []).map((contact) => (
              <View key={contact.id} style={styles.contactCard}>
                <View style={styles.contactHeader}>
                  <FontAwesome6 name="user" size={14} color="#636E72" />
                  <Text style={styles.contactName}>{contact.name}</Text>
                  {contact.position && (
                    <Text style={styles.contactPosition}>{contact.position}</Text>
                  )}
                  <TouchableOpacity onPress={() => handleDeleteContact(contact.id!)}>
                    <FontAwesome6 name="trash" size={14} color="#E74C3C" />
                  </TouchableOpacity>
                </View>
                {contact.phone && (
                  <View style={styles.contactPhoneRow}>
                    <FontAwesome6 name="phone" size={12} color="#636E72" />
                    <Text style={styles.contactPhone}>{contact.phone}</Text>
                  </View>
                )}
              </View>
            ))}
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
              onPress={() => router.push('/customer-ledger', { customerId: id, type: 'contract' })}
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
              onPress={() => router.push('/customer-ledger', { customerId: id, type: 'device' })}
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
              onPress={() =>
                router.push('/customer-ledger', { customerId: id, type: 'workorder' })
              }
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
      </ScrollView>

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
                    numberOfLines={3}
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
                      keyboardType="phone-pad"
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
                    <Text style={styles.formLabel}>分管小组</Text>
                    <TouchableOpacity
                      style={styles.selectButton}
                      onPress={() => setSubGroupModalVisible(true)}
                    >
                      <Text style={[
                        styles.selectButtonText,
                        !formData.sub_group && styles.selectButtonPlaceholder
                      ]}>
                        {formData.sub_group || '请选择分管小组'}
                      </Text>
                      <FontAwesome6 name="chevron-down" size={14} color="#95A5A6" />
                    </TouchableOpacity>
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
                      numberOfLines={3}
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

      {/* 分管小组选择弹窗 */}
      <Modal
        visible={subGroupModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSubGroupModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.selectModalOverlay}
          activeOpacity={1}
          onPress={() => setSubGroupModalVisible(false)}
        >
          <View style={styles.selectModalContent}>
            <View style={styles.selectModalHeader}>
              <Text style={styles.selectModalTitle}>选择分管小组</Text>
              <TouchableOpacity onPress={() => setSubGroupModalVisible(false)}>
                <FontAwesome6 name="xmark" size={18} color="#636E72" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.selectModalList}>
              {subGroupOptions.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.selectOptionItem,
                    formData.sub_group === option && styles.selectOptionItemActive
                  ]}
                  onPress={() => {
                    setFormData({ ...formData, sub_group: option });
                    setSubGroupModalVisible(false);
                  }}
                >
                  <Text style={[
                    styles.selectOptionText,
                    formData.sub_group === option && styles.selectOptionTextActive
                  ]}>
                    {option}
                  </Text>
                  {formData.sub_group === option && (
                    <FontAwesome6 name="check" size={16} color="#6C63FF" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
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
  infoRow: {
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 13,
    color: '#636E72',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#2D3436',
  },
  addressList: {
    gap: 8,
  },
  addressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    color: '#2D3436',
  },
  contactList: {
    gap: 8,
  },
  contactCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  contactName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2D3436',
    flex: 1,
  },
  contactPosition: {
    fontSize: 12,
    color: '#636E72',
  },
  contactPhoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 22,
  },
  contactPhone: {
    fontSize: 13,
    color: '#636E72',
  },
  ledgerGrid: {
    flexDirection: 'row',
    gap: 12,
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
    position: 'relative',
  },
  ledgerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  ledgerLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#2D3436',
    textAlign: 'center',
  },
  ledgerBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: '#E74C3C',
  },
  ledgerBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
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
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectButtonText: {
    fontSize: 14,
    color: '#2D3436',
    flex: 1,
  },
  selectButtonPlaceholder: {
    color: '#B2BEC3',
  },
  selectModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  selectModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '80%',
    maxHeight: '50%',
  },
  selectModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  selectModalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3436',
  },
  selectModalList: {
    paddingVertical: 8,
  },
  selectOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  selectOptionItemActive: {
    backgroundColor: 'rgba(108, 99, 255, 0.08)',
  },
  selectOptionText: {
    fontSize: 15,
    color: '#2D3436',
  },
  selectOptionTextActive: {
    color: '#6C63FF',
    fontWeight: '500',
  },
});
