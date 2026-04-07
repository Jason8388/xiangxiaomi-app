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
import { SmartDateInput } from '@/components/SmartDateInput';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { getApiBaseUrl } from '@/utils/api';

interface Contact {
  id?: number;
  name: string;
  phone?: string;
  position?: string;
}

interface ContractDetail {
  id: number;
  contract_number: string;
  contract_name: string;
  customer_name: string;
  business_manager: string;
  sign_date: string;
  acceptance_date?: string;
  warranty_end_date?: string;
  contract_amount?: number;
  remarks?: string;
  tags?: string[];
  addresses?: string[];
  contacts?: Contact[];
  device_count: number;
  work_order_count: number;
}

export default function ContractDetailPage() {
  const router = useSafeRouter();
  const { id } = useSafeSearchParams<{ id: string }>();
  const [contract, setContract] = useState<ContractDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'address' | 'contact' | 'edit'>('address');
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    const loadContractDetail = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const response = await fetch(
          `${getApiBaseUrl()}/api/v1/contracts/${id}`
        );
        const data = await response.json();
        if (response.ok) {
          setContract(data);
        }
      } catch (error) {
        console.error('Fetch contract detail error:', error);
      } finally {
        setLoading(false);
      }
    };

    loadContractDetail();
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

  const handleEditContract = () => {
    if (!contract) return;
    setModalType('edit');
    setFormData({
      contract_number: contract.contract_number,
      contract_name: contract.contract_name,
      customer_name: contract.customer_name,
      business_manager: contract.business_manager,
      sign_date: contract.sign_date,
      acceptance_date: contract.acceptance_date || '',
      warranty_end_date: contract.warranty_end_date || '',
      contract_amount: contract.contract_amount?.toString() || '',
      remarks: contract.remarks || '',
      tags: contract.tags || [],
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    try {
      if (modalType === 'address') {
        const response = await fetch(
          `${getApiBaseUrl()}/api/v1/contracts/${id}/addresses`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address: formData.address }),
          }
        );
        const data = await response.json();
        if (response.ok) {
          setModalVisible(false);
          loadContractDetail();
        } else {
          throw new Error(data.error || '添加地址失败');
        }
      } else if (modalType === 'contact') {
        const response = await fetch(
          `${getApiBaseUrl()}/api/v1/contracts/${id}/contacts`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
          }
        );
        const data = await response.json();
        if (response.ok) {
          setModalVisible(false);
          loadContractDetail();
        } else {
          throw new Error(data.error || '添加联系人失败');
        }
      } else if (modalType === 'edit') {
        const response = await fetch(
          `${getApiBaseUrl()}/api/v1/contracts/${id}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...formData,
              contract_amount: formData.contract_amount
                ? parseFloat(formData.contract_amount)
                : null,
            }),
          }
        );
        const data = await response.json();
        if (response.ok) {
          setModalVisible(false);
          loadContractDetail();
        } else {
          throw new Error(data.error || '修改合同信息失败');
        }
      }
    } catch (error: any) {
      console.error('Save error:', error);
    }
  };

  const handleDeleteAddress = (address: string) => {
    console.log('Delete address:', address);
  };

  const handleDeleteContact = (contactId: number) => {
    console.log('Delete contact:', contactId);
  };

  const loadContractDetail = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const response = await fetch(
        `${getApiBaseUrl()}/api/v1/contracts/${id}`
      );
      const data = await response.json();
      if (response.ok) {
        setContract(data);
      }
    } catch (error) {
      console.error('Fetch contract detail error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  if (loading || !contract) {
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
      <PageHeader title="合同详情" />

      <ScrollView style={styles.container}>
        {/* 合同基本信息 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FontAwesome6 name="file-contract" size={18} color="#1E88E5" />
            <Text style={styles.sectionTitle}>合同信息</Text>
            <TouchableOpacity style={styles.editButton} onPress={handleEditContract}>
              <FontAwesome6 name="pen" size={14} color="#1E88E5" />
            </TouchableOpacity>
          </View>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>合同编号</Text>
              <Text style={styles.infoValue}>{contract.contract_number}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>合同名称</Text>
              <Text style={styles.infoValue}>{contract.contract_name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>客户名称</Text>
              <Text style={styles.infoValue}>{contract.customer_name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>业务经理</Text>
              <Text style={styles.infoValue}>{contract.business_manager}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>签订日期</Text>
              <Text style={styles.infoValue}>{formatDate(contract.sign_date)}</Text>
            </View>
            {contract.acceptance_date && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>验收日期</Text>
                <Text style={styles.infoValue}>{formatDate(contract.acceptance_date)}</Text>
              </View>
            )}
            {contract.warranty_end_date && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>质保到期日期</Text>
                <Text style={styles.infoValue}>{formatDate(contract.warranty_end_date)}</Text>
              </View>
            )}
            {contract.contract_amount && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>合同金额</Text>
                <Text style={styles.infoValue}>
                  ¥{contract.contract_amount.toLocaleString()}
                </Text>
              </View>
            )}
            {contract.remarks && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>备注</Text>
                <Text style={styles.infoValue}>{contract.remarks}</Text>
              </View>
            )}
          </View>

          {contract.tags && contract.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              <FontAwesome6 name="tags" size={14} color="#636E72" />
              <View style={styles.tagsList}>
                {contract.tags.map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
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
            {(contract.addresses || []).map((address, index) => (
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
            {(contract.contacts || []).map((contact) => (
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
              onPress={() =>
                router.push('/contract-ledger', { contractId: id, type: 'device' })
              }
            >
              <View style={[styles.ledgerIcon, { backgroundColor: 'rgba(46, 204, 113, 0.1)' }]}>
                <FontAwesome6 name="microchip" size={24} color="#2ECC71" />
              </View>
              <Text style={styles.ledgerLabel}>设备台账</Text>
              <View style={styles.ledgerBadge}>
                <Text style={styles.ledgerBadgeText}>{contract.device_count}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.ledgerCard}
              onPress={() =>
                router.push('/contract-ledger', { contractId: id, type: 'workorder' })
              }
            >
              <View style={[styles.ledgerIcon, { backgroundColor: 'rgba(155, 89, 182, 0.1)' }]}>
                <FontAwesome6 name="clipboard-list" size={24} color="#9B59B6" />
              </View>
              <Text style={styles.ledgerLabel}>售后工单</Text>
              <View style={styles.ledgerBadge}>
                <Text style={styles.ledgerBadgeText}>{contract.work_order_count}</Text>
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
                {modalType === 'edit' && '编辑合同信息'}
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
                    <Text style={styles.formLabel}>合同编号 *</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="请输入合同编号"
                      value={formData.contract_number}
                      onChangeText={(text) =>
                        setFormData({ ...formData, contract_number: text })
                      }
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>合同名称 *</Text>
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
                    <Text style={styles.formLabel}>客户名称 *</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="请输入客户名称"
                      value={formData.customer_name}
                      onChangeText={(text) =>
                        setFormData({ ...formData, customer_name: text })
                      }
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

                  <View style={styles.formRow}>
                    <View style={[styles.formGroup, { flex: 1 }]}>
                      <SmartDateInput
                        label="签订日期"
                        value={formData.sign_date}
                        onChange={(date) => setFormData({ ...formData, sign_date: date })}
                        placeholder="请选择签订日期"
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
                    <Text style={styles.formLabel}>合同金额</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="请输入合同金额"
                      value={formData.contract_amount}
                      onChangeText={(text) =>
                        setFormData({ ...formData, contract_amount: text })
                      }
                      keyboardType="decimal-pad"
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
  tagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(30, 136, 229, 0.1)',
  },
  tagText: {
    fontSize: 11,
    color: '#1E88E5',
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
});
