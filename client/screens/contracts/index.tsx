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
} from 'react-native';
import { Screen } from '@/components/Screen';
import { PageHeader } from '@/components/PageHeader';
import { FontAwesome6 } from '@expo/vector-icons';
import { SmartDateInput } from '@/components/SmartDateInput';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { cachedFetch, clearCache } from '@/utils/storage';

interface Contract {
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
  device_count: number;
  work_order_count: number;
}

interface Customer {
  id: number;
  name: string;
  contact?: string;
  phone?: string;
  address?: string;
}

export default function ContractManagement() {
  const router = useSafeRouter();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [filteredContracts, setFilteredContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [customerSelectorVisible, setCustomerSelectorVisible] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [formData, setFormData] = useState({
    contract_number: '',
    contract_name: '',
    customer_name: '',
    business_manager: '',
    sign_date: '',
    acceptance_date: '',
    warranty_end_date: '',
    contract_amount: '',
    remarks: '',
    tags: [] as string[],
  });
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        await Promise.all([
          cachedFetch('contracts-list', fetchContracts, 'medium'),
          cachedFetch('customers-list', fetchCustomers, 'medium'),
        ]);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (searchKeyword.trim()) {
      const filtered = contracts.filter(
        (c) =>
          c.contract_name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
          c.contract_number.toLowerCase().includes(searchKeyword.toLowerCase()) ||
          c.customer_name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
          c.business_manager.toLowerCase().includes(searchKeyword.toLowerCase())
      );
      setFilteredContracts(filtered);
    } else {
      setFilteredContracts(contracts);
    }
  }, [searchKeyword, contracts]);

  const fetchContracts = async (): Promise<Contract[]> => {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/contracts`);
      const data = await response.json();
      if (response.ok && Array.isArray(data)) {
        const sorted = data.sort((a: Contract, b: Contract) =>
          new Date(b.sign_date).getTime() - new Date(a.sign_date).getTime()
        );
        setContracts(sorted);
        return sorted;
      }
      return [];
    } catch (error) {
      console.error('Fetch contracts error:', error);
      return [];
    }
  };

  const fetchCustomers = async (): Promise<Customer[]> => {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/customers`);
      const data = await response.json();
      if (Array.isArray(data)) {
        setCustomers(data);
        return data;
      }
      return [];
    } catch (error) {
      console.error('Fetch customers error:', error);
      return [];
    }
  };

  const handleAdd = () => {
    setEditingContract(null);
    setFormData({
      contract_number: '',
      contract_name: '',
      customer_name: '',
      business_manager: '',
      sign_date: '',
      acceptance_date: '',
      warranty_end_date: '',
      contract_amount: '',
      remarks: '',
      tags: [],
    });
    setTagInput('');
    setModalVisible(true);
  };

  const handleEdit = (contract: Contract) => {
    setEditingContract(contract);
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
    setTagInput('');
    setModalVisible(true);
  };

  const handleAddTag = () => {
    if (tagInput.trim() && formData.tags.length < 5) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()],
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((t) => t !== tag),
    });
  };

  const handleSave = async () => {
    if (!formData.contract_number || !formData.contract_name || !formData.customer_name) {
      Alert.alert('提示', '合同编号、合同名称和客户名称不能为空');
      return;
    }

    try {
      const response = editingContract
        ? await fetch(
            `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/contracts/${editingContract.id}`,
            {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...formData,
                contract_amount: formData.contract_amount ? parseFloat(formData.contract_amount) : null,
              }),
            }
          )
        : await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/contracts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...formData,
              contract_amount: formData.contract_amount ? parseFloat(formData.contract_amount) : null,
            }),
          });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('成功', editingContract ? '修改成功' : '创建成功');
        setModalVisible(false);
        clearCache('contracts-list');
        fetchContracts();
      } else {
        throw new Error(data.error || '操作失败');
      }
    } catch (error: any) {
      Alert.alert('错误', error.message);
    }
  };

  const handleDelete = (contract: Contract) => {
    Alert.alert('确认删除', `确定要删除合同"${contract.contract_name}"吗？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            const response = await fetch(
              `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/contracts/${contract.id}`,
              {
                method: 'DELETE',
              }
            );
            const data = await response.json();
            if (response.ok) {
              Alert.alert('成功', '删除成功');
              clearCache('contracts-list');
              fetchContracts();
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
      <PageHeader title="合同管理" />

      {/* 搜索栏 */}
      <View style={styles.searchBar}>
        <FontAwesome6 name="magnifying-glass" size={16} color="#636E72" />
        <TextInput
          style={styles.searchInput}
          placeholder="搜索合同名称、编号、客户、业务经理"
          value={searchKeyword}
          onChangeText={setSearchKeyword}
          placeholderTextColor="#95A5A6"
        />
      </View>

      {/* 操作按钮 */}
      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
          <FontAwesome6 name="plus" size={16} color="#FFFFFF" />
          <Text style={styles.addButtonText}>新建合同</Text>
        </TouchableOpacity>
      </View>

      {/* 合同列表 */}
      <ScrollView style={styles.listContainer}>
        {loading ? (
          <View style={styles.centerContainer}>
            <Text>加载中...</Text>
          </View>
        ) : filteredContracts.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>
              {searchKeyword ? '未找到匹配的合同' : '暂无合同信息'}
            </Text>
          </View>
        ) : (
          filteredContracts.map((contract) => (
            <View key={contract.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleContainer}>
                  <FontAwesome6 name="file-signature" size={18} color="#2ECC71" />
                  <Text style={styles.cardTitle}>{contract.contract_name}</Text>
                </View>
              </View>

              <View style={styles.cardInfo}>
                <Text style={styles.infoLabel}>合同编号:</Text>
                <Text style={styles.infoValue}>{contract.contract_number}</Text>
              </View>

              <View style={styles.cardInfo}>
                <Text style={styles.infoLabel}>客户名称:</Text>
                <Text style={styles.infoValue}>{contract.customer_name}</Text>
              </View>

              <View style={styles.cardActionsRow}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleEdit(contract)}
                >
                  <FontAwesome6 name="pen" size={16} color="#F39C12" />
                  <Text style={styles.actionButtonText}>修改</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleDelete(contract)}
                >
                  <FontAwesome6 name="trash" size={16} color="#E74C3C" />
                  <Text style={styles.actionButtonText}>删除</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* 新增/编辑合同 Modal */}
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
                {editingContract ? '编辑合同' : '新建合同'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <FontAwesome6 name="xmark" size={20} color="#636E72" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>合同编号 *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="请输入合同编号"
                  value={formData.contract_number}
                  onChangeText={(text) => setFormData({ ...formData, contract_number: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>合同名称 *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="请输入合同名称"
                  value={formData.contract_name}
                  onChangeText={(text) => setFormData({ ...formData, contract_name: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>客户名称 *</Text>
                <TouchableOpacity
                  style={styles.formInput}
                  onPress={() => setCustomerSelectorVisible(true)}
                >
                  <Text style={formData.customer_name ? styles.formInputText : styles.formInputPlaceholder}>
                    {formData.customer_name || '请选择客户'}
                  </Text>
                  <FontAwesome6 name="chevron-down" size={14} color="#95A5A6" />
                </TouchableOpacity>
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
                <Text style={styles.formLabel}>合同标签（最多5个）</Text>
                <View style={styles.tagInputContainer}>
                  <TextInput
                    style={styles.tagInput}
                    placeholder="输入标签后回车添加"
                    value={tagInput}
                    onChangeText={setTagInput}
                    onSubmitEditing={handleAddTag}
                  />
                  <TouchableOpacity
                    style={styles.addTagButton}
                    onPress={handleAddTag}
                    disabled={formData.tags.length >= 5}
                  >
                    <FontAwesome6 name="plus" size={14} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
                {formData.tags.length > 0 && (
                  <View style={styles.tagsList}>
                    {formData.tags.map((tag, index) => (
                      <View key={index} style={styles.tagItem}>
                        <Text style={styles.tagItemText}>{tag}</Text>
                        <TouchableOpacity onPress={() => handleRemoveTag(tag)}>
                          <FontAwesome6 name="xmark" size={12} color="#E74C3C" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
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

      {/* 客户选择 Modal */}
      <Modal
        visible={customerSelectorVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCustomerSelectorVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>选择客户</Text>
              <TouchableOpacity onPress={() => setCustomerSelectorVisible(false)}>
                <FontAwesome6 name="xmark" size={20} color="#636E72" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {customers.length === 0 ? (
                <View style={styles.centerContainer}>
                  <Text style={styles.emptyText}>暂无客户数据</Text>
                </View>
              ) : (
                customers.map((customer) => (
                  <TouchableOpacity
                    key={customer.id}
                    style={styles.customerItem}
                    onPress={() => {
                      setFormData({ ...formData, customer_name: customer.name });
                      setCustomerSelectorVisible(false);
                    }}
                  >
                    <View style={styles.customerItemContent}>
                      <FontAwesome6 name="building" size={18} color="#3498DB" />
                      <View style={styles.customerInfo}>
                        <Text style={styles.customerName}>{customer.name}</Text>
                        {customer.contact && (
                          <Text style={styles.customerContact}>联系人: {customer.contact}</Text>
                        )}
                        {customer.phone && (
                          <Text style={styles.customerContact}>电话: {customer.phone}</Text>
                        )}
                        {customer.address && (
                          <Text style={styles.customerContact}>地址: {customer.address}</Text>
                        )}
                      </View>
                    </View>
                    {formData.customer_name === customer.name && (
                      <FontAwesome6 name="check-circle" size={20} color="#2ECC71" />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setCustomerSelectorVisible(false)}
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F5F7FA',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#2D3436',
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
    flex: 1,
  },
  cardNumber: {
    fontSize: 12,
    color: '#636E72',
    marginBottom: 4,
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
    gap: 8,
    marginBottom: 8,
  },
  cardInfoText: {
    fontSize: 13,
    color: '#636E72',
    flex: 1,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
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
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
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
  tagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tagInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#2D3436',
  },
  addTagButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#1E88E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  tagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(30, 136, 229, 0.1)',
  },
  tagItemText: {
    fontSize: 12,
    color: '#1E88E5',
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
  customerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  customerItemContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    flex: 1,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#2C3E50',
    marginBottom: 4,
  },
  customerContact: {
    fontSize: 13,
    color: '#7F8C8D',
    marginBottom: 2,
  },
  formInputText: {
    fontSize: 14,
    color: '#2C3E50',
    flex: 1,
  },
  formInputPlaceholder: {
    fontSize: 14,
    color: '#95A5A6',
    flex: 1,
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
});
