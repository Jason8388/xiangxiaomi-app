import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { Screen } from '@/components/Screen';
import { getApiBaseUrl } from '@/utils/api';
import { PageHeader } from '@/components/PageHeader';
import { useSafeRouter } from '@/hooks/useSafeRouter';

interface Customer {
  id: number;
  name: string;
  contact_person?: string;
  contact_phone?: string;
}

interface Contact {
  name: string;
  role: string;
  phone: string;
}

export default function WorkOrderCreate() {
  const router = useSafeRouter();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerSearchVisible, setCustomerSearchVisible] = useState(false);
  const [customerSearchKeyword, setCustomerSearchKeyword] = useState('');

  // 基本情况
  const [formData, setFormData] = useState({
    title: '', // 工单名称
    order_no: '', // 工单编号（系统自动生成）
    task_no: '', // 任务号
    customer_id: '',
    customer_name: '',
    task_leader: '',
    implementation_entity: '',
  });

  // 客户信息
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [demand_date, setDemand_date] = useState('');
  const [contactModalVisible, setContactModalVisible] = useState(false);
  const [editingContactIndex, setEditingContactIndex] = useState(-1);
  const [contactForm, setContactForm] = useState<Contact>({ name: '', role: '', phone: '' });

  // 加载客户列表
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const response = await fetch(`${getApiBaseUrl()}/api/v1/customers`);
        const data = await response.json();
        if (Array.isArray(data)) {
          setCustomers(data);
        } else if (data.data) {
          setCustomers(data.data);
        }
      } catch (error) {
        console.error('Load customers error:', error);
      }
    };
    loadCustomers();
  }, []);

  // 过滤客户
  const filteredCustomers = customerSearchKeyword.trim()
    ? customers.filter((c) =>
        c.name.toLowerCase().includes(customerSearchKeyword.toLowerCase()) ||
        (c.contact_person && c.contact_person.toLowerCase().includes(customerSearchKeyword.toLowerCase())) ||
        (c.contact_phone && c.contact_phone.includes(customerSearchKeyword))
      )
    : customers;

  // 选择客户
  const handleSelectCustomer = (customer: Customer) => {
    setFormData({
      ...formData,
      customer_name: customer.name,
      customer_id: customer.id.toString(),
    });
    // 自动填充联系人
    if (customer.contact_person) {
      setContacts([{ name: customer.contact_person, role: '', phone: customer.contact_phone || '' }]);
    }
    setCustomerSearchVisible(false);
    setCustomerSearchKeyword('');
  };

  // 添加/编辑联系人
  const handleAddContact = () => {
    setEditingContactIndex(-1);
    setContactForm({ name: '', role: '', phone: '' });
    setContactModalVisible(true);
  };

  const handleEditContact = (index: number) => {
    setEditingContactIndex(index);
    setContactForm(contacts[index]);
    setContactModalVisible(true);
  };

  const handleSaveContact = () => {
    if (!contactForm.name.trim()) {
      Alert.alert('提示', '联系人姓名不能为空');
      return;
    }
    if (!contactForm.phone.trim()) {
      Alert.alert('提示', '联系电话不能为空');
      return;
    }
    const newContacts = [...contacts];
    if (editingContactIndex >= 0) {
      newContacts[editingContactIndex] = contactForm;
    } else {
      newContacts.push(contactForm);
    }
    setContacts(newContacts);
    setContactModalVisible(false);
  };

  const handleDeleteContact = (index: number) => {
    const newContacts = contacts.filter((_, i) => i !== index);
    setContacts(newContacts);
  };

  // 提交表单
  const handleSubmit = async () => {
    // 基本情况校验
    if (!formData.title.trim()) {
      Alert.alert('提示', '工单名称不能为空');
      return;
    }
    if (!formData.customer_name.trim()) {
      Alert.alert('提示', '客户名称不能为空');
      return;
    }
    if (!formData.task_leader.trim()) {
      Alert.alert('提示', '任务负责人不能为空');
      return;
    }
    if (!formData.implementation_entity.trim()) {
      Alert.alert('提示', '实施主体不能为空');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `${getApiBaseUrl()}/api/v1/work-orders`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: formData.title,
            order_no: formData.order_no || undefined,
            task_no: formData.task_no || formData.order_no,
            customer_id: formData.customer_id || null,
            customer_name: formData.customer_name,
            task_leader: formData.task_leader,
            implementation_entity: formData.implementation_entity,
            task_phase: '需求阶段',
            task_progress: '10%收到服务需求',
            task_status: '计划中',
            contacts: contacts,
            demand_date: demand_date || null,
          }),
        }
      );

      if (response.ok) {
        Alert.alert('成功', '工单创建成功', [
          { text: '确定', onPress: () => router.back() },
        ]);
      } else {
        throw new Error('创建失败');
      }
    } catch (error) {
      console.error('Submit error:', error);
      Alert.alert('提示', '工单创建失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <PageHeader title="新建工单" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* 信息栏1：基本情况 */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <FontAwesome6 name="clipboard-list" size={16} color="#6C63FF" />
              <Text style={styles.sectionTitle}>基本情况</Text>
            </View>
            <View style={styles.sectionContent}>
              {/* 工单名称 */}
              <View style={styles.formItem}>
                <View style={styles.labelRow}>
                  <Text style={styles.required}>*</Text>
                  <Text style={styles.label}>工单名称</Text>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="请输入工单名称"
                  value={formData.title}
                  onChangeText={(text) => setFormData({ ...formData, title: text })}
                  placeholderTextColor="#999"
                />
              </View>

              {/* 工单编号（系统自动生成） */}
              <View style={styles.formItem}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>工单编号</Text>
                  <Text style={styles.autoTag}>系统自动生成</Text>
                </View>
                <View style={styles.autoGeneratedBox}>
                  <Text style={styles.autoGeneratedText}>
                    {formData.order_no || '保存后自动生成'}
                  </Text>
                </View>
              </View>

              {/* 任务号 */}
              <View style={styles.formItem}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>任务号</Text>
                  <Text style={styles.bindTag}>与工单编号绑定</Text>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="请输入任务号"
                  value={formData.task_no}
                  onChangeText={(text) => setFormData({ ...formData, task_no: text })}
                  placeholderTextColor="#999"
                />
              </View>

              {/* 客户名称 */}
              <View style={styles.formItem}>
                <View style={styles.labelRow}>
                  <Text style={styles.required}>*</Text>
                  <Text style={styles.label}>客户名称</Text>
                </View>
                <TouchableOpacity
                  style={styles.customerInput}
                  onPress={() => setCustomerSearchVisible(!customerSearchVisible)}
                >
                  <Text
                    style={[
                      styles.customerText,
                      !formData.customer_name && styles.customerPlaceholder,
                    ]}
                  >
                    {formData.customer_name || '点击选择客户（支持搜索）'}
                  </Text>
                  <FontAwesome6
                    name={customerSearchVisible ? 'chevron-up' : 'chevron-down'}
                    size={14}
                    color="#95A5A6"
                  />
                </TouchableOpacity>

                {customerSearchVisible && (
                  <View style={styles.customerSearchContainer}>
                    <View style={styles.searchInputContainer}>
                      <FontAwesome6 name="magnifying-glass" size={14} color="#95A5A6" />
                      <TextInput
                        style={styles.searchInput}
                        placeholder="搜索客户名称"
                        value={customerSearchKeyword}
                        onChangeText={setCustomerSearchKeyword}
                        placeholderTextColor="#95A5A6"
                      />
                    </View>
                    <ScrollView style={styles.customerList} nestedScrollEnabled>
                      {filteredCustomers.slice(0, 10).map((customer) => (
                        <TouchableOpacity
                          key={customer.id}
                          style={styles.customerItem}
                          onPress={() => handleSelectCustomer(customer)}
                        >
                          <View style={styles.customerItemContent}>
                            <Text style={styles.customerName}>{customer.name}</Text>
                            {customer.contact_person && (
                              <Text style={styles.customerContact}>
                                联系人: {customer.contact_person}
                                {customer.contact_phone && ` ${customer.contact_phone}`}
                              </Text>
                            )}
                          </View>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* 任务负责人 */}
              <View style={styles.formItem}>
                <View style={styles.labelRow}>
                  <Text style={styles.required}>*</Text>
                  <Text style={styles.label}>任务负责人</Text>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="请输入任务负责人"
                  value={formData.task_leader}
                  onChangeText={(text) => setFormData({ ...formData, task_leader: text })}
                  placeholderTextColor="#999"
                />
              </View>

              {/* 实施主体 */}
              <View style={styles.formItem}>
                <View style={styles.labelRow}>
                  <Text style={styles.required}>*</Text>
                  <Text style={styles.label}>实施主体</Text>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="请输入实施主体"
                  value={formData.implementation_entity}
                  onChangeText={(text) => setFormData({ ...formData, implementation_entity: text })}
                  placeholderTextColor="#999"
                />
              </View>
            </View>
          </View>

          {/* 信息栏2：客户信息 */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <FontAwesome6 name="user-tie" size={16} color="#E74C3C" />
              <Text style={styles.sectionTitle}>客户信息</Text>
              <TouchableOpacity style={styles.addBtn} onPress={handleAddContact}>
                <FontAwesome6 name="plus" size={12} color="#6C63FF" />
                <Text style={styles.addBtnText}>添加联系人</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.sectionContent}>
              {contacts.length === 0 ? (
                <View style={styles.emptyContacts}>
                  <Text style={styles.emptyText}>暂无联系人，点击上方添加</Text>
                </View>
              ) : (
                contacts.map((contact, index) => (
                  <View key={index} style={styles.contactCard}>
                    <View style={styles.contactRow}>
                      <Text style={styles.contactLabel}>联系人：</Text>
                      <Text style={styles.contactValue}>{contact.name}</Text>
                    </View>
                    {contact.role && (
                      <View style={styles.contactRow}>
                        <Text style={styles.contactLabel}>角色/职务：</Text>
                        <Text style={styles.contactValue}>{contact.role}</Text>
                      </View>
                    )}
                    <View style={styles.contactRow}>
                      <Text style={styles.contactLabel}>联系电话：</Text>
                      <Text style={styles.contactValue}>{contact.phone}</Text>
                    </View>
                    <View style={styles.contactActions}>
                      <TouchableOpacity
                        style={styles.contactActionBtn}
                        onPress={() => handleEditContact(index)}
                      >
                        <FontAwesome6 name="edit" size={12} color="#F39C12" />
                        <Text style={styles.actionText}>编辑</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.contactActionBtn}
                        onPress={() => handleDeleteContact(index)}
                      >
                        <FontAwesome6 name="trash" size={12} color="#E74C3C" />
                        <Text style={[styles.actionText, { color: '#E74C3C' }]}>删除</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        </ScrollView>

        {/* 底部提交按钮 */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
          >
            <Text style={styles.cancelButtonText}>取消</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>创建工单</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* 联系人编辑弹窗 */}
        {contactModalVisible && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editingContactIndex >= 0 ? '编辑联系人' : '添加联系人'}
                </Text>
                <TouchableOpacity onPress={() => setContactModalVisible(false)}>
                  <FontAwesome6 name="times" size={18} color="#666" />
                </TouchableOpacity>
              </View>
              <View style={styles.modalBody}>
                <View style={styles.modalFormItem}>
                  <Text style={styles.modalLabel}>联系人姓名 *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="请输入联系人姓名"
                    value={contactForm.name}
                    onChangeText={(text) => setContactForm({ ...contactForm, name: text })}
                    placeholderTextColor="#999"
                  />
                </View>
                <View style={styles.modalFormItem}>
                  <Text style={styles.modalLabel}>角色/职务</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="请输入角色/职务"
                    value={contactForm.role}
                    onChangeText={(text) => setContactForm({ ...contactForm, role: text })}
                    placeholderTextColor="#999"
                  />
                </View>
                <View style={styles.modalFormItem}>
                  <Text style={styles.modalLabel}>联系电话 *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="请输入联系电话"
                    value={contactForm.phone}
                    onChangeText={(text) => setContactForm({ ...contactForm, phone: text })}
                    keyboardType="phone-pad"
                    placeholderTextColor="#999"
                  />
                </View>
              </View>
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setContactModalVisible(false)}
                >
                  <Text style={styles.modalCancelText}>取消</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSaveContact}>
                  <Text style={styles.modalSaveText}>保存</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2D3436',
    marginLeft: 8,
    flex: 1,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#F0EEFF',
    borderRadius: 12,
    gap: 4,
  },
  addBtnText: {
    fontSize: 12,
    color: '#6C63FF',
  },
  sectionContent: {
    padding: 14,
  },
  formItem: {
    marginBottom: 14,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  required: {
    color: '#E74C3C',
    fontSize: 13,
    marginRight: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: '#636E72',
  },
  autoTag: {
    fontSize: 10,
    color: '#6C63FF',
    backgroundColor: '#F0EEFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  bindTag: {
    fontSize: 10,
    color: '#00B894',
    backgroundColor: '#E8F8F5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#2D3436',
  },
  autoGeneratedBox: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  autoGeneratedText: {
    fontSize: 14,
    color: '#95A5A6',
  },
  customerInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  customerText: {
    fontSize: 14,
    color: '#2D3436',
    flex: 1,
  },
  customerPlaceholder: {
    color: '#999',
  },
  customerSearchContainer: {
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    maxHeight: 200,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#2C3E50',
    padding: 0,
  },
  customerList: {
    maxHeight: 150,
  },
  customerItem: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  customerItemContent: {
    flex: 1,
  },
  customerName: {
    fontSize: 14,
    color: '#2D3436',
    fontWeight: '500',
  },
  customerContact: {
    fontSize: 12,
    color: '#95A5A6',
    marginTop: 2,
  },
  emptyContacts: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 13,
    color: '#95A5A6',
  },
  contactCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  contactRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  contactLabel: {
    fontSize: 13,
    color: '#95A5A6',
    width: 80,
  },
  contactValue: {
    fontSize: 13,
    color: '#2D3436',
    flex: 1,
  },
  contactActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    gap: 16,
  },
  contactActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 12,
    color: '#F39C12',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#636E72',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#6C63FF',
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: '100%',
    maxWidth: 340,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
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
  },
  modalFormItem: {
    marginBottom: 14,
  },
  modalLabel: {
    fontSize: 13,
    color: '#636E72',
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#2D3436',
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 12,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    color: '#636E72',
  },
  modalSaveBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#6C63FF',
    alignItems: 'center',
  },
  modalSaveText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
});
