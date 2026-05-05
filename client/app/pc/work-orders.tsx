import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ScrollView, Alert, Modal } from 'react-native';
import { PCLayout } from '@/components/pc/PCLayout';
import { PCTable } from '@/components/pc/PCComponents';
import { PCTag } from '@/components/pc/PCComponents';
import { PCCard } from '@/components/pc/PCComponents';
import { PCToolbar } from '@/components/pc/PCComponents';
import { PCSearchBar } from '@/components/pc/PCComponents';
import { PCImportModal } from '@/components/pc/PCComponents';
import { FontAwesome6 } from '@expo/vector-icons';

import { storage } from '@/utils/storage';
import { getApiBaseUrl } from '@/utils/api';
const API_BASE = getApiBaseUrl();

interface WorkOrder {
  id: number;
  order_no: string;
  work_order_number?: string;
  title?: string;
  description?: string;
  customer_id?: number;
  customer_name: string;
  device_name?: string;
  task_no?: string;
  task_leader?: string;
  implementation_entity?: string;
  task_phase?: string;
  task_progress?: string;
  task_status?: string;
  stage?: string;
  priority?: string;
  status?: string;
  type?: string;
  plan_hours?: number;
  is_charge?: boolean;
  quote?: number;
  handler?: string;
  contacts?: Contact[];
  demand_date?: string;
  creator?: string;
  created_at?: string;
  updated_at?: string;
}

interface Contact {
  name: string;
  role?: string;
  phone: string;
}

interface Customer {
  id: number;
  name: string;
  contact_person?: string;
  contact_phone?: string;
}

export default function PCWorkOrders() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingOrder, setEditingOrder] = useState<WorkOrder | null>(null);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerSearchVisible, setCustomerSearchVisible] = useState(false);
  const [customerSearchKeyword, setCustomerSearchKeyword] = useState('');

  // 基本情况
  const [formData, setFormData] = useState({
    title: '', // 工单名称
    order_no: '', // 工单编号
    task_no: '', // 任务号
    customer_id: '',
    customer_name: '',
    task_leader: '',
    implementation_entity: '',
    task_phase: '需求阶段',
    task_progress: '10%收到服务需求',
    task_status: '计划中',
  });

  // 客户信息
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [demand_date, setDemand_date] = useState('');

  // 联系人编辑弹窗
  const [contactModalVisible, setContactModalVisible] = useState(false);
  const [editingContactIndex, setEditingContactIndex] = useState(-1);
  const [contactForm, setContactForm] = useState<Contact>({ name: '', role: '', phone: '' });

  // 任务进度选择弹窗
  const [taskProgressModalVisible, setTaskProgressModalVisible] = useState(false);
  const taskProgressOptions = [
    '10%收到服务需求', '20%确定方案与报价', '30%客户方案和报价共识',
    '40%完成实施准备', '50%完成实施', '60%完成客户确认', '70%完成对账',
    '80%完成开票和送达', '90%完成回款', '100%完成资料归档',
    '已关单', '挂起暂停', '终止'
  ];

  const fetchWorkOrders = useCallback(async () => {
    setLoading(true);
    try {
      const sessionId = await storage.getItem('session_id');
      const response = await fetch(`${API_BASE}/api/v1/work-orders`, {
        headers: sessionId ? { Authorization: `Bearer ${sessionId}` } : {},
      });
      const data = await response.json();
      const list: WorkOrder[] = Array.isArray(data) ? data : (data.data || data.work_orders || []);
      const sorted = list.sort((a: WorkOrder, b: WorkOrder) =>
        new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      );
      setWorkOrders(sorted);
    } catch (error) {
      console.error('获取工单列表失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 加载客户列表
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/v1/customers`);
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

  useEffect(() => {
    fetchWorkOrders();
  }, [fetchWorkOrders]);

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

  const filteredOrders = workOrders.filter(o => {
    const matchSearch = !searchText ||
      (o.order_no?.includes(searchText) || false) ||
      (o.title?.includes(searchText) || false) ||
      (o.customer_name?.includes(searchText) || false) ||
      (o.task_leader?.includes(searchText) || false);
    const matchType = !typeFilter || o.type === typeFilter;
    const matchPriority = !priorityFilter || o.priority === priorityFilter;
    const matchStatus = !statusFilter || o.status === statusFilter;
    return matchSearch && matchType && matchPriority && matchStatus;
  });

  const handleDelete = async (record: WorkOrder) => {
    Alert.alert('确认', '确定删除此工单吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '确定',
        style: 'destructive',
        onPress: async () => {
          try {
            await fetch(`${API_BASE}/api/v1/work-orders/${record.id}`, { method: 'DELETE' });
            setWorkOrders(prev => prev.filter(o => o.id !== record.id));
            Alert.alert('成功', '删除成功');
          } catch (error) {
            console.error('删除失败:', error);
            Alert.alert('错误', '删除失败');
          }
        },
      },
    ]);
  };

  const handleSave = async () => {
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
      const sessionId = await storage.getItem('session_id');
      const url = editingOrder
        ? `${API_BASE}/api/v1/work-orders/${editingOrder.id}`
        : `${API_BASE}/api/v1/work-orders`;
      const method = editingOrder ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(sessionId ? { Authorization: `Bearer ${sessionId}` } : {}),
        },
        body: JSON.stringify({
          title: formData.title,
          order_no: formData.order_no || undefined,
          task_no: formData.task_no || formData.order_no,
          customer_id: formData.customer_id || null,
          customer_name: formData.customer_name,
          task_leader: formData.task_leader,
          implementation_entity: formData.implementation_entity,
          task_phase: formData.task_phase,
          task_progress: formData.task_progress,
          task_status: formData.task_status,
          contacts: contacts,
          demand_date: demand_date || null,
        }),
      });

      if (response.ok) {
        setModalVisible(false);
        fetchWorkOrders();
        Alert.alert('成功', editingOrder ? '修改成功' : '创建成功');
      } else {
        throw new Error('保存失败');
      }
    } catch (error) {
      console.error('保存失败:', error);
      Alert.alert('错误', '保存失败');
    }
  };

  const handleAdd = () => {
    setEditingOrder(null);
    setFormData({
      title: '',
      order_no: '',
      task_no: '',
      customer_id: '',
      customer_name: '',
      task_leader: '',
      implementation_entity: '',
      task_phase: '需求阶段',
      task_progress: '10%收到服务需求',
      task_status: '计划中',
    });
    setContacts([]);
    setDemand_date('');
    setModalVisible(true);
  };

  const handleEdit = (record: WorkOrder) => {
    setEditingOrder(record);
    setFormData({
      title: record.title || '',
      order_no: record.order_no || '',
      task_no: record.task_no || '',
      customer_id: record.customer_id?.toString() || '',
      customer_name: record.customer_name,
      task_leader: record.task_leader || '',
      implementation_entity: record.implementation_entity || '',
      task_phase: record.task_phase || '需求阶段',
      task_progress: record.task_progress || '10%收到服务需求',
      task_status: record.task_status || '计划中',
    });
    setContacts(record.contacts || []);
    setDemand_date(record.demand_date || '');
    setModalVisible(true);
  };

  const columns = [
    { key: 'order_no', title: '工单编号', width: 120 },
    { key: 'title', title: '工单名称', width: 150 },
    { key: 'customer_name', title: '客户名称', width: 150 },
    { key: 'task_leader', title: '任务负责人', width: 100 },
    { key: 'task_phase', title: '任务阶段', width: 100 },
    { key: 'task_progress', title: '任务进度', width: 120 },
    { key: 'task_status', title: '任务状态', width: 80 },
    { key: 'is_charged', title: '是否收费', width: 90, render: (val) => val === '是' ? '是' : (val === '否' ? '否' : '-') },
    { key: 'quoted_price', title: '收费金额', width: 100, render: (val) => val ? `¥${Number(val).toFixed(2)}` : '-' },
    { key: 'created_at', title: '创建时间', width: 150 },
  ];

  const actionsColumn = {
    key: 'actions',
    title: '操作',
    width: 140,
    render: (_: any, record: WorkOrder) => (
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TouchableOpacity onPress={() => window.location.href = `/pc/work-order-detail?id=${record.id}`}>
          <Text style={styles.btnText}>详情</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleEdit(record)}>
          <Text style={styles.btnText}>编辑</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(record)}>
          <Text style={[styles.btnText, { color: '#FF4D4F' }]}>删除</Text>
        </TouchableOpacity>
      </View>
    ),
  };

  const tableColumns = [...columns, actionsColumn];

  return (
    <PCLayout>
      <View className="pc-page-header">
        <Text className="pc-page-title">工单管理</Text>
        <Text className="pc-page-description">管理所有工单信息，包括客户、任务负责人、实施主体、任务阶段、进度、状态等完整信息</Text>
      </View>

      <PCCard>
        <PCToolbar
          left={
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <PCSearchBar
                placeholder="搜索工单编号、名称、客户或负责人..."
                value={searchText}
                onChange={setSearchText}
                onSearch={() => {}}
              />
            </View>
          }
          right={
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <TouchableOpacity
                style={styles.toolbarBtn}
                onPress={() => setImportModalVisible(true)}
              >
                <FontAwesome6 name="upload" size={14} color="#666" />
                <Text style={styles.toolbarBtnText}>批量导入</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.toolbarBtnPrimary}
                onPress={() => {
                  // 使用a标签触发下载，避免被浏览器拦截
                  const link = document.createElement('a');
                  link.href = `${API_BASE}/api/v1/reports/work-orders/export`;
                  link.download = '工单详情.xlsx';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
              >
                <FontAwesome6 name="download" size={14} color="#1E88E5" />
                <Text style={{ color: '#1E88E5', marginLeft: 4 }}>批量导出</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
                <FontAwesome6 name="plus" size={14} color="#fff" />
                <Text style={styles.addBtnText}>新增工单</Text>
              </TouchableOpacity>
            </View>
          }
        />

        <PCTable
          columns={tableColumns}
          data={filteredOrders}
          rowKey="id"
          loading={loading}
        />
      </PCCard>

      {/* 编辑/新增弹窗 */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { width: 800, maxHeight: '90vh' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingOrder ? '编辑工单' : '新建工单'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <FontAwesome6 name="times" size={18} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* 信息栏1：基本情况 */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <FontAwesome6 name="clipboard-list" size={14} color="#6C63FF" />
                  <Text style={styles.sectionTitle}>基本情况</Text>
                </View>
                <View style={styles.sectionContent}>
                  <View style={styles.formRow}>
                    <View style={styles.formCol}>
                      <Text style={styles.formLabel}>
                        <Text style={{ color: '#ff4d4f' }}>*</Text> 工单名称
                      </Text>
                      <TextInput
                        style={styles.input}
                        placeholder="请输入工单名称"
                        value={formData.title}
                        onChangeText={(text) => setFormData({ ...formData, title: text })}
                      />
                    </View>
                    <View style={styles.formCol}>
                      <Text style={styles.formLabel}>工单编号</Text>
                      <View style={styles.autoGeneratedBox}>
                        <Text style={styles.autoGeneratedText}>
                          {formData.order_no || '保存后自动生成'}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.formRow}>
                    <View style={styles.formCol}>
                      <Text style={styles.formLabel}>任务号</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="与工单编号绑定"
                        value={formData.task_no}
                        onChangeText={(text) => setFormData({ ...formData, task_no: text })}
                      />
                    </View>
                    <View style={styles.formCol}>
                      <Text style={styles.formLabel}>
                        <Text style={{ color: '#ff4d4f' }}>*</Text> 客户名称
                      </Text>
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
                          size={12}
                          color="#95A5A6"
                        />
                      </TouchableOpacity>
                      {customerSearchVisible && (
                        <View style={styles.customerSearchContainer}>
                          <View style={styles.searchInputContainer}>
                            <FontAwesome6 name="magnifying-glass" size={12} color="#95A5A6" />
                            <TextInput
                              style={styles.searchInput}
                              placeholder="搜索客户名称"
                              value={customerSearchKeyword}
                              onChangeText={setCustomerSearchKeyword}
                            />
                          </View>
                          <ScrollView style={styles.customerList} nestedScrollEnabled>
                            {filteredCustomers.slice(0, 10).map((customer) => (
                              <TouchableOpacity
                                key={customer.id}
                                style={styles.customerItem}
                                onPress={() => handleSelectCustomer(customer)}
                              >
                                <Text style={styles.customerName}>{customer.name}</Text>
                                {customer.contact_person && (
                                  <Text style={styles.customerContact}>
                                    联系人: {customer.contact_person}
                                  </Text>
                                )}
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                        </View>
                      )}
                    </View>
                  </View>
                  <View style={styles.formRow}>
                    <View style={styles.formCol}>
                      <Text style={styles.formLabel}>
                        <Text style={{ color: '#ff4d4f' }}>*</Text> 任务负责人
                      </Text>
                      <TextInput
                        style={styles.input}
                        placeholder="请输入任务负责人"
                        value={formData.task_leader}
                        onChangeText={(text) => setFormData({ ...formData, task_leader: text })}
                      />
                    </View>
                    <View style={styles.formCol}>
                      <Text style={styles.formLabel}>
                        <Text style={{ color: '#ff4d4f' }}>*</Text> 实施主体
                      </Text>
                      <TextInput
                        style={styles.input}
                        placeholder="请输入实施主体"
                        value={formData.implementation_entity}
                        onChangeText={(text) => setFormData({ ...formData, implementation_entity: text })}
                      />
                    </View>
                  </View>
                  <View style={styles.formRow}>
                    <View style={styles.formCol}>
                      <Text style={styles.formLabel}>任务阶段</Text>
                      <View style={styles.selectContainer}>
                        {['需求阶段', '实施阶段', '回款阶段', '关单存档', '异常状态'].map(phase => (
                          <TouchableOpacity
                            key={phase}
                            style={[
                              styles.selectOption,
                              formData.task_phase === phase && styles.selectOptionActive,
                            ]}
                            onPress={() => setFormData({ ...formData, task_phase: phase })}
                          >
                            <Text
                              style={[
                                styles.selectOptionText,
                                formData.task_phase === phase && styles.selectOptionTextActive,
                              ]}
                            >
                              {phase}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                    <View style={styles.formCol}>
                      <Text style={styles.formLabel}>任务进度</Text>
                      <TouchableOpacity
                        style={styles.selectInput}
                        onPress={() => setTaskProgressModalVisible(true)}
                      >
                        <Text style={formData.task_progress ? styles.selectInputText : styles.selectInputPlaceholder}>
                          {formData.task_progress || '请选择任务进度'}
                        </Text>
                        <FontAwesome6 name="chevron-down" size={14} color="#666" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={styles.formRow}>
                    <View style={styles.formCol}>
                      <Text style={styles.formLabel}>任务状态</Text>
                      <View style={styles.selectContainer}>
                        {['计划中', '延期风险', '已延期', '关单完成', '挂起或暂停'].map(status => (
                          <TouchableOpacity
                            key={status}
                            style={[
                              styles.selectOption,
                              formData.task_status === status && styles.selectOptionActive,
                            ]}
                            onPress={() => setFormData({ ...formData, task_status: status })}
                          >
                            <Text
                              style={[
                                styles.selectOptionText,
                                formData.task_status === status && styles.selectOptionTextActive,
                              ]}
                            >
                              {status}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                    <View style={styles.formCol}>
                      <Text style={styles.formLabel}>需求日期</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="YYYY-MM-DD"
                        value={demand_date}
                        onChangeText={setDemand_date}
                      />
                    </View>
                  </View>
                </View>
              </View>

              {/* 信息栏2：客户信息 */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <FontAwesome6 name="user-tie" size={14} color="#E74C3C" />
                  <Text style={styles.sectionTitle}>客户信息</Text>
                  <TouchableOpacity style={styles.addContactBtn} onPress={handleAddContact}>
                    <FontAwesome6 name="plus" size={10} color="#6C63FF" />
                    <Text style={styles.addContactBtnText}>添加联系人</Text>
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

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleSave}
              >
                <Text style={styles.submitBtnText}>创建工单</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 联系人编辑弹窗 */}
      <Modal
        visible={contactModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setContactModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { width: 400 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingContactIndex >= 0 ? '编辑联系人' : '添加联系人'}
              </Text>
              <TouchableOpacity onPress={() => setContactModalVisible(false)}>
                <FontAwesome6 name="times" size={18} color="#666" />
              </TouchableOpacity>
            </View>
            <View style={styles.contactModalBody}>
              <View style={styles.formRow}>
                <View style={styles.formColFull}>
                  <Text style={styles.formLabel}>
                    <Text style={{ color: '#ff4d4f' }}>*</Text> 联系人姓名
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="请输入联系人姓名"
                    value={contactForm.name}
                    onChangeText={(text) => setContactForm({ ...contactForm, name: text })}
                  />
                </View>
              </View>
              <View style={styles.formRow}>
                <View style={styles.formColFull}>
                  <Text style={styles.formLabel}>角色/职务</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="请输入角色/职务"
                    value={contactForm.role}
                    onChangeText={(text) => setContactForm({ ...contactForm, role: text })}
                  />
                </View>
              </View>
              <View style={styles.formRow}>
                <View style={styles.formColFull}>
                  <Text style={styles.formLabel}>
                    <Text style={{ color: '#ff4d4f' }}>*</Text> 联系电话
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="请输入联系电话"
                    value={contactForm.phone}
                    onChangeText={(text) => setContactForm({ ...contactForm, phone: text })}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>
            </View>
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setContactModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleSaveContact}
              >
                <Text style={styles.submitBtnText}>保存</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 任务进度选择弹窗 */}
      <Modal
        visible={taskProgressModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setTaskProgressModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setTaskProgressModalVisible(false)}
        >
          <View style={styles.selectModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>选择任务进度</Text>
              <TouchableOpacity onPress={() => setTaskProgressModalVisible(false)}>
                <FontAwesome6 name="times" size={18} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.selectModalBody}>
              {taskProgressOptions.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.selectOptionItem,
                    formData.task_progress === option && styles.selectOptionItemActive,
                  ]}
                  onPress={() => {
                    setFormData({ ...formData, task_progress: option });
                    setTaskProgressModalVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.selectOptionItemText,
                      formData.task_progress === option && styles.selectOptionItemTextActive,
                    ]}
                  >
                    {option}
                  </Text>
                  {formData.task_progress === option && (
                    <FontAwesome6 name="check" size={16} color="#1E88E5" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 批量导入弹窗 */}
      <PCImportModal
        visible={importModalVisible}
        onClose={() => setImportModalVisible(false)}
        onSuccess={() => {
          setImportModalVisible(false);
          fetchWorkOrders();
        }}
        apiPath="/api/v1/work-orders/batch"
        title="工单"
        templateUrl={`${API_BASE}/api/v1/reports/work-orders/template`}
      />
    </PCLayout>
  );
}

const styles = StyleSheet.create({
  btnText: {
    fontSize: 13,
    color: '#1E88E5',
  },
  toolbarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 4,
  },
  toolbarBtnText: {
    color: '#666',
    fontSize: 13,
  },
  toolbarBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#1E88E5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E88E5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 4,
  },
  addBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 8,
    width: '90%',
    maxHeight: '80vh',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  modalBody: {
    padding: 20,
    maxHeight: '60vh',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  section: {
    marginBottom: 20,
    backgroundColor: '#fafafa',
    borderRadius: 8,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#f0f0f0',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  addContactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
  },
  addContactBtnText: {
    fontSize: 12,
    color: '#6C63FF',
  },
  sectionContent: {
    padding: 14,
  },
  formRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 14,
  },
  formCol: {
    flex: 1,
  },
  formColFull: {
    flex: 1,
  },
  formLabel: {
    fontSize: 13,
    color: '#333',
    marginBottom: 6,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d9d9d9',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  autoGeneratedBox: {
    borderWidth: 1,
    borderColor: '#d9d9d9',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f5f5f5',
  },
  autoGeneratedText: {
    fontSize: 14,
    color: '#999',
  },
  customerInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d9d9d9',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  customerText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  customerPlaceholder: {
    color: '#999',
  },
  customerSearchContainer: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#d9d9d9',
    borderRadius: 6,
    backgroundColor: '#fff',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  customerList: {
    maxHeight: 200,
  },
  customerItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  customerName: {
    fontSize: 14,
    color: '#333',
  },
  customerContact: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  selectContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: '#f0f0f0',
  },
  selectOptionActive: {
    backgroundColor: '#1E88E5',
  },
  selectOptionText: {
    fontSize: 13,
    color: '#666',
  },
  selectOptionTextActive: {
    color: '#fff',
  },
  emptyContacts: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: '#999',
  },
  contactCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e8e8e8',
    borderRadius: 6,
    padding: 12,
    marginBottom: 10,
  },
  contactRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  contactLabel: {
    fontSize: 13,
    color: '#666',
    width: 90,
  },
  contactValue: {
    fontSize: 13,
    color: '#333',
    flex: 1,
  },
  contactActions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  contactActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 13,
    color: '#F39C12',
  },
  contactModalBody: {
    padding: 20,
  },
  selectInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 36,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#d9d9d9',
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  selectInputText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  selectInputPlaceholder: {
    fontSize: 14,
    color: '#999',
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectModalContent: {
    backgroundColor: '#fff',
    borderRadius: 8,
    width: 400,
    maxHeight: '70%',
  },
  selectModalBody: {
    maxHeight: 400,
    padding: 10,
  },
  selectOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectOptionItemActive: {
    backgroundColor: '#e6f7ff',
  },
  selectOptionItemText: {
    fontSize: 14,
    color: '#333',
  },
  selectOptionItemTextActive: {
    color: '#1E88E5',
    fontWeight: '500',
  },
  cancelBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d9d9d9',
  },
  cancelBtnText: {
    fontSize: 14,
    color: '#666',
  },
  submitBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: '#1E88E5',
  },
  submitBtnText: {
    fontSize: 14,
    color: '#fff',
  },
});
