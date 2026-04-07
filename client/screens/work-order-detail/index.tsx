import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  StyleSheet,
  Platform,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { PageHeader } from '@/components/PageHeader';
import { FontAwesome6 } from '@expo/vector-icons';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import * as ImagePicker from 'expo-image-picker';

interface Contact {
  name: string;
  role: string;
  phone: string;
}

interface PaymentProgress {
  id: number;
  progress: string;
  updated_at: string;
}

interface WorkOrderDetail {
  id: number;
  order_no: string;
  title: string;
  task_no: string;
  customer_id: number;
  customer_name: string;
  task_leader: string;
  implementation_entity: string;
  // 工单状态
  task_phase: string;
  task_progress: string;
  task_status: string;
  demand_assessment_period: number;
  service_implementation_period: number;
  payment_period: number;
  // 客户信息
  contacts: Contact[];
  demand_date: string;
  // 服务方案
  service_plan: string;
  plan_hours: number;
  material_requirements: string;
  warranty_status: string;
  is_charged: boolean;
  quoted_price: number;
  service_docs: string;
  consensus_docs: string;
  consensus_date: string;
  // 实施情况
  implementer: string;
  implementation_complete_date: string;
  actual_hours: number;
  work_order_docs: string;
  site_completion_docs: string;
  work_order_signer: string;
  // 回款情况
  invoice_application: string;
  invoice_completed: string;
  invoice_delivered: string;
  planned_payment_date: string;
  actual_payment_date: string;
  payment_progress: PaymentProgress[];
  created_at: string;
}

export default function WorkOrderDetailScreen() {
  const router = useSafeRouter();
  const { id } = useSafeSearchParams<{ id: string }>();
  const [order, setOrder] = useState<WorkOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingField, setEditingField] = useState('');
  const [editValue, setEditValue] = useState('');
  const [selectModalVisible, setSelectModalVisible] = useState(false);
  const [selectOptions, setSelectOptions] = useState<string[]>([]);
  const [selectTitle, setSelectTitle] = useState('');

  // 联系人弹窗
  const [contactModalVisible, setContactModalVisible] = useState(false);
  const [editingContactIndex, setEditingContactIndex] = useState(-1);
  const [contactForm, setContactForm] = useState<Contact>({ name: '', role: '', phone: '' });

  // 回款进度弹窗
  const [paymentProgressModalVisible, setPaymentProgressModalVisible] = useState(false);
  const [paymentProgressText, setPaymentProgressText] = useState('');

  // 任务阶段选项
  const taskPhaseOptions = ['需求阶段', '实施阶段', '回款阶段', '关单存档', '异常状态'];

  // 任务进度选项
  const taskProgressOptions = [
    '10%收到服务需求', '20%确定方案与报价', '30%客户方案和报价共识',
    '40%完成实施准备', '50%完成实施', '60%完成客户确认', '70%完成对账',
    '80%完成开票和送达', '90%完成回款', '100%完成资料归档',
    '已关单', '挂起暂停', '终止'
  ];

  // 任务状态选项
  const taskStatusOptions = ['计划中', '延期风险', '已延期', '关单完成', '挂起或暂停'];

  // 质保期状态选项
  const warrantyStatusOptions = ['质保期内', '质保期外'];

  // 是否收费选项
  const isChargedOptions = ['收费', '免费'];

  // 开票相关选项
  const invoiceOptions = ['已申请', '未申请'];
  const invoiceCompletedOptions = ['已开票', '待开票'];
  const invoiceDeliveredOptions = ['是', '否'];

  useEffect(() => {
    fetchOrderDetail();
  }, [id]);

  const fetchOrderDetail = async () => {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/work-orders/${id}`);
      const data = await response.json();
      setOrder({
        id: data.id,
        order_no: data.order_no || '',
        title: data.title || '',
        task_no: data.task_no || data.order_no || '',
        customer_id: data.customer_id,
        customer_name: data.customer_name || '',
        task_leader: data.task_leader || '',
        implementation_entity: data.implementation_entity || '',
        task_phase: data.task_phase || '需求阶段',
        task_progress: data.task_progress || '10%收到服务需求',
        task_status: data.task_status || '计划中',
        demand_assessment_period: data.demand_assessment_period || 0,
        service_implementation_period: data.service_implementation_period || 0,
        payment_period: data.payment_period || 0,
        contacts: data.contacts || [],
        demand_date: data.demand_date || '',
        service_plan: data.service_plan || '',
        plan_hours: data.plan_hours || 0,
        material_requirements: data.material_requirements || '',
        warranty_status: data.warranty_status || '',
        is_charged: data.is_charged || false,
        quoted_price: data.quoted_price || 0,
        service_docs: data.service_docs || '',
        consensus_docs: data.consensus_docs || '',
        consensus_date: data.consensus_date || '',
        implementer: data.implementer || '',
        implementation_complete_date: data.implementation_complete_date || '',
        actual_hours: data.actual_hours || 0,
        work_order_docs: data.work_order_docs || '',
        site_completion_docs: data.site_completion_docs || '',
        work_order_signer: data.work_order_signer || '',
        invoice_application: data.invoice_application || '',
        invoice_completed: data.invoice_completed || '',
        invoice_delivered: data.invoice_delivered || '',
        planned_payment_date: data.planned_payment_date || '',
        actual_payment_date: data.actual_payment_date || '',
        payment_progress: data.payment_progress || [],
        created_at: data.created_at,
      });
    } catch (error) {
      console.error('Fetch order detail error:', error);
      Alert.alert('错误', '获取工单详情失败');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (field: string, value: string) => {
    setEditingField(field);
    setEditValue(value);

    if (field === 'task_phase') {
      setSelectOptions(taskPhaseOptions);
      setSelectTitle('选择任务阶段');
      setSelectModalVisible(true);
    } else if (field === 'task_progress') {
      setSelectOptions(taskProgressOptions);
      setSelectTitle('选择任务进度');
      setSelectModalVisible(true);
    } else if (field === 'task_status') {
      setSelectOptions(taskStatusOptions);
      setSelectTitle('选择任务状态');
      setSelectModalVisible(true);
    } else if (field === 'warranty_status') {
      setSelectOptions(warrantyStatusOptions);
      setSelectTitle('选择质保期状态');
      setSelectModalVisible(true);
    } else if (field === 'is_charged') {
      setSelectOptions(isChargedOptions);
      setSelectTitle('选择是否收费');
      setSelectModalVisible(true);
    } else if (field === 'invoice_application') {
      setSelectOptions(invoiceOptions);
      setSelectTitle('是否申请开票');
      setSelectModalVisible(true);
    } else if (field === 'invoice_completed') {
      setSelectOptions(invoiceCompletedOptions);
      setSelectTitle('开票是否完成');
      setSelectModalVisible(true);
    } else if (field === 'invoice_delivered') {
      setSelectOptions(invoiceDeliveredOptions);
      setSelectTitle('发票是否送达客户');
      setSelectModalVisible(true);
    } else {
      setSelectModalVisible(false);
    }
  };

  const handleSelectConfirm = async () => {
    if (!order) return;
    try {
      const updates: any = { [editingField]: editValue };
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/work-orders/${order.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        }
      );
      if (response.ok) {
        setOrder({ ...order, [editingField]: editValue });
        setSelectModalVisible(false);
        Alert.alert('成功', '修改成功');
      }
    } catch (error) {
      Alert.alert('错误', '修改失败');
    }
  };

  const handleTextSave = async () => {
    if (!order) return;
    try {
      const updates: any = { [editingField]: editValue };
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/work-orders/${order.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        }
      );
      if (response.ok) {
        setOrder({ ...order, [editingField]: editValue });
        setEditingField('');
        Alert.alert('成功', '修改成功');
      }
    } catch (error) {
      Alert.alert('错误', '修改失败');
    }
  };

  // 联系人操作
  const handleAddContact = () => {
    setEditingContactIndex(-1);
    setContactForm({ name: '', role: '', phone: '' });
    setContactModalVisible(true);
  };

  const handleEditContact = (index: number) => {
    setEditingContactIndex(index);
    setContactForm(order?.contacts[index] || { name: '', role: '', phone: '' });
    setContactModalVisible(true);
  };

  const handleSaveContact = async () => {
    if (!order) return;
    const newContacts = [...(order.contacts || [])];
    if (editingContactIndex >= 0) {
      newContacts[editingContactIndex] = contactForm;
    } else {
      newContacts.push(contactForm);
    }
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/work-orders/${order.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contacts: newContacts }),
        }
      );
      if (response.ok) {
        setOrder({ ...order, contacts: newContacts });
        setContactModalVisible(false);
        Alert.alert('成功', '联系人已保存');
      }
    } catch (error) {
      Alert.alert('错误', '保存失败');
    }
  };

  const handleDeleteContact = async (index: number) => {
    if (!order) return;
    const newContacts = (order.contacts || []).filter((_, i) => i !== index);
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/work-orders/${order.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contacts: newContacts }),
        }
      );
      if (response.ok) {
        setOrder({ ...order, contacts: newContacts });
      }
    } catch (error) {
      Alert.alert('错误', '删除失败');
    }
  };

  // 添加回款进度
  const handleAddPaymentProgress = async () => {
    if (!order || !paymentProgressText.trim()) {
      Alert.alert('提示', '请输入回款进度内容');
      return;
    }
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/work-orders/${order.id}/payment-progress`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ progress: paymentProgressText }),
        }
      );
      if (response.ok) {
        const newProgress = await response.json();
        setOrder({
          ...order,
          payment_progress: [...(order.payment_progress || []), newProgress],
        });
        setPaymentProgressModalVisible(false);
        setPaymentProgressText('');
        Alert.alert('成功', '回款进度已添加');
      }
    } catch (error) {
      Alert.alert('错误', '添加失败');
    }
  };

  const renderInfoRow = (label: string, value: string, editable?: string, unit?: string) => (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <TouchableOpacity
        style={styles.infoValueContainer}
        onPress={() => editable && handleEdit(editable, value)}
        disabled={!editable}
      >
        <Text style={[styles.infoValue, !value && styles.infoPlaceholder]}>
          {value || '点击填写'}
        </Text>
        {unit && value ? <Text style={styles.infoUnit}>{unit}</Text> : null}
        {editable && <FontAwesome6 name="edit" size={12} color="#95A5A6" style={{ marginLeft: 6 }} />}
      </TouchableOpacity>
    </View>
  );

  if (loading || !order) {
    return (
      <Screen>
        <PageHeader title="工单详情" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <PageHeader title="工单详情" />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 12, paddingBottom: 30 }}>
        {/* 信息栏1：基本情况 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FontAwesome6 name="clipboard-list" size={16} color="#6C63FF" />
            <Text style={styles.sectionTitle}>基本情况</Text>
          </View>
          <View style={styles.sectionContent}>
            {renderInfoRow('工单名称', order.title, 'title')}
            {renderInfoRow('工单编号', order.order_no)}
            {renderInfoRow('任务号', order.task_no, 'task_no')}
            {renderInfoRow('客户名称', order.customer_name)}
            {renderInfoRow('任务负责人', order.task_leader, 'task_leader')}
            {renderInfoRow('实施主体', order.implementation_entity, 'implementation_entity')}
          </View>
        </View>

        {/* 信息栏2：工单状态 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FontAwesome6 name="tasks" size={16} color="#00B894" />
            <Text style={styles.sectionTitle}>工单状态</Text>
          </View>
          <View style={styles.sectionContent}>
            {renderInfoRow('任务阶段', order.task_phase, 'task_phase')}
            {renderInfoRow('任务进度', order.task_progress, 'task_progress')}
            {renderInfoRow('任务状态', order.task_status, 'task_status')}
            {renderInfoRow('需求阶段时间周期', order.demand_assessment_period > 0 ? order.demand_assessment_period.toString() : '', false, '天')}
            {renderInfoRow('服务实施时间周期', order.service_implementation_period > 0 ? order.service_implementation_period.toString() : '', false, '天')}
            {renderInfoRow('回款周期', order.payment_period > 0 ? order.payment_period.toString() : '', false, '天')}
          </View>
        </View>

        {/* 信息栏3：客户信息 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FontAwesome6 name="user-tie" size={16} color="#E74C3C" />
            <Text style={styles.sectionTitle}>客户信息</Text>
            <TouchableOpacity style={styles.addBtn} onPress={handleAddContact}>
              <FontAwesome6 name="plus" size={12} color="#6C63FF" />
              <Text style={styles.addBtnText}>添加</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.sectionContent}>
            <TouchableOpacity style={styles.dateInput} onPress={() => handleEdit('demand_date', order.demand_date)}>
              <Text style={styles.dateLabel}>接到服务需求日期</Text>
              <Text style={styles.dateValue}>{order.demand_date || '点击选择日期'}</Text>
            </TouchableOpacity>
            {order.contacts && order.contacts.length > 0 ? (
              order.contacts.map((contact, index) => (
                <View key={index} style={styles.contactCard}>
                  <View style={styles.contactRow}>
                    <Text style={styles.contactLabel}>联系人：{contact.name}</Text>
                  </View>
                  {contact.role && (
                    <View style={styles.contactRow}>
                      <Text style={styles.contactLabel}>角色/职务：{contact.role}</Text>
                    </View>
                  )}
                  <View style={styles.contactRow}>
                    <Text style={styles.contactLabel}>联系电话：{contact.phone}</Text>
                  </View>
                  <View style={styles.contactActions}>
                    <TouchableOpacity onPress={() => handleEditContact(index)}>
                      <Text style={styles.editText}>编辑</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteContact(index)}>
                      <Text style={styles.deleteText}>删除</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>暂无联系人</Text>
            )}
          </View>
        </View>

        {/* 信息栏4：服务方案 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FontAwesome6 name="file-alt" size={16} color="#3498DB" />
            <Text style={styles.sectionTitle}>服务方案</Text>
          </View>
          <View style={styles.sectionContent}>
            {renderInfoRow('服务方案说明', order.service_plan, 'service_plan')}
            {renderInfoRow('计划工时', order.plan_hours > 0 ? order.plan_hours.toString() : '', '', '天')}
            {renderInfoRow('物料需求', order.material_requirements, 'material_requirements')}
            {renderInfoRow('质保期状态', order.warranty_status, 'warranty_status')}
            {renderInfoRow('是否收费', order.is_charged ? '收费' : '免费', 'is_charged')}
            {renderInfoRow('报价金额', order.quoted_price > 0 ? order.quoted_price.toString() : '', '', '元')}
            <TouchableOpacity style={styles.dateInput} onPress={() => handleEdit('consensus_date', order.consensus_date)}>
              <Text style={styles.dateLabel}>服务方案客户共识日期</Text>
              <Text style={styles.dateValue}>{order.consensus_date || '点击选择日期'}</Text>
            </TouchableOpacity>
            <View style={styles.docRow}>
              <Text style={styles.docLabel}>报价单：</Text>
              <TouchableOpacity style={styles.uploadBtn}>
                <FontAwesome6 name="upload" size={14} color="#6C63FF" />
                <Text style={styles.uploadText}>{order.service_docs ? '已上传' : '上传照片'}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.docRow}>
              <Text style={styles.docLabel}>客户共识凭证：</Text>
              <TouchableOpacity style={styles.uploadBtn}>
                <FontAwesome6 name="upload" size={14} color="#6C63FF" />
                <Text style={styles.uploadText}>{order.consensus_docs ? '已上传' : '上传照片'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 信息栏5：实施情况 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FontAwesome6 name="hard-hat" size={16} color="#F39C12" />
            <Text style={styles.sectionTitle}>实施情况</Text>
          </View>
          <View style={styles.sectionContent}>
            {renderInfoRow('实施人', order.implementer, 'implementer')}
            <TouchableOpacity style={styles.dateInput} onPress={() => handleEdit('implementation_complete_date', order.implementation_complete_date)}>
              <Text style={styles.dateLabel}>实施完成日期</Text>
              <Text style={styles.dateValue}>{order.implementation_complete_date || '点击选择日期'}</Text>
            </TouchableOpacity>
            {renderInfoRow('实际工时投入', order.actual_hours > 0 ? order.actual_hours.toString() : '', '', '天')}
            {renderInfoRow('派工单签字人', order.work_order_signer, 'work_order_signer')}
            <View style={styles.docRow}>
              <Text style={styles.docLabel}>派工单照片：</Text>
              <TouchableOpacity style={styles.uploadBtn}>
                <FontAwesome6 name="camera" size={14} color="#6C63FF" />
                <Text style={styles.uploadText}>{order.work_order_docs ? '已上传' : '上传照片'}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.docRow}>
              <Text style={styles.docLabel}>现场完成照片：</Text>
              <TouchableOpacity style={styles.uploadBtn}>
                <FontAwesome6 name="camera" size={14} color="#6C63FF" />
                <Text style={styles.uploadText}>{order.site_completion_docs ? '已上传' : '上传照片'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 信息栏6：回款情况 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FontAwesome6 name="money-bill" size={16} color="#27AE60" />
            <Text style={styles.sectionTitle}>回款情况</Text>
          </View>
          <View style={styles.sectionContent}>
            {renderInfoRow('是否申请开票', order.invoice_application, 'invoice_application')}
            {renderInfoRow('开票是否完成', order.invoice_completed, 'invoice_completed')}
            {renderInfoRow('发票是否送达客户', order.invoice_delivered, 'invoice_delivered')}
            <TouchableOpacity style={styles.dateInput} onPress={() => handleEdit('planned_payment_date', order.planned_payment_date)}>
              <Text style={styles.dateLabel}>计划回款日期</Text>
              <Text style={styles.dateValue}>{order.planned_payment_date || '点击选择日期'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dateInput} onPress={() => handleEdit('actual_payment_date', order.actual_payment_date)}>
              <Text style={styles.dateLabel}>实际回款日期</Text>
              <Text style={styles.dateValue}>{order.actual_payment_date || '点击选择日期'}</Text>
            </TouchableOpacity>
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressTitle}>回款进度记录</Text>
                <TouchableOpacity style={styles.addBtn} onPress={() => setPaymentProgressModalVisible(true)}>
                  <FontAwesome6 name="plus" size={12} color="#6C63FF" />
                  <Text style={styles.addBtnText}>新增进度</Text>
                </TouchableOpacity>
              </View>
              {order.payment_progress && order.payment_progress.length > 0 ? (
                order.payment_progress.map((item, index) => (
                  <View key={item.id || index} style={styles.progressItem}>
                    <Text style={styles.progressText}>{item.progress}</Text>
                    <Text style={styles.progressDate}>{item.updated_at?.split('T')[0]}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>暂无回款进度记录</Text>
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* 下拉选择弹窗 */}
      <Modal visible={selectModalVisible} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setSelectModalVisible(false)}>
          <View style={styles.selectModal}>
            <View style={styles.selectHeader}>
              <Text style={styles.selectTitle}>{selectTitle}</Text>
            </View>
            <ScrollView style={styles.selectList}>
              {selectOptions.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.selectItem, editValue === option && styles.selectItemActive]}
                  onPress={() => setEditValue(option)}
                >
                  <Text style={[styles.selectItemText, editValue === option && styles.selectItemTextActive]}>
                    {option}
                  </Text>
                  {editValue === option && <FontAwesome6 name="check" size={16} color="#6C63FF" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.selectFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setSelectModalVisible(false)}>
                <Text style={styles.cancelBtnText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleSelectConfirm}>
                <Text style={styles.confirmBtnText}>确定</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 联系人编辑弹窗 */}
      <Modal visible={contactModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.editModal}>
            <View style={styles.editHeader}>
              <Text style={styles.editTitle}>{editingContactIndex >= 0 ? '编辑联系人' : '添加联系人'}</Text>
              <TouchableOpacity onPress={() => setContactModalVisible(false)}>
                <FontAwesome6 name="times" size={18} color="#666" />
              </TouchableOpacity>
            </View>
            <View style={styles.editBody}>
              <View style={styles.editItem}>
                <Text style={styles.editLabel}>联系人姓名 *</Text>
                <TextInput
                  style={styles.editInput}
                  placeholder="请输入"
                  value={contactForm.name}
                  onChangeText={(text) => setContactForm({ ...contactForm, name: text })}
                />
              </View>
              <View style={styles.editItem}>
                <Text style={styles.editLabel}>角色/职务</Text>
                <TextInput
                  style={styles.editInput}
                  placeholder="请输入"
                  value={contactForm.role}
                  onChangeText={(text) => setContactForm({ ...contactForm, role: text })}
                />
              </View>
              <View style={styles.editItem}>
                <Text style={styles.editLabel}>联系电话 *</Text>
                <TextInput
                  style={styles.editInput}
                  placeholder="请输入"
                  keyboardType="phone-pad"
                  value={contactForm.phone}
                  onChangeText={(text) => setContactForm({ ...contactForm, phone: text })}
                />
              </View>
            </View>
            <View style={styles.editFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setContactModalVisible(false)}>
                <Text style={styles.cancelBtnText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleSaveContact}>
                <Text style={styles.confirmBtnText}>保存</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 回款进度新增弹窗 */}
      <Modal visible={paymentProgressModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.editModal}>
            <View style={styles.editHeader}>
              <Text style={styles.editTitle}>新增回款进度</Text>
              <TouchableOpacity onPress={() => setPaymentProgressModalVisible(false)}>
                <FontAwesome6 name="times" size={18} color="#666" />
              </TouchableOpacity>
            </View>
            <View style={styles.editBody}>
              <View style={styles.editItem}>
                <Text style={styles.editLabel}>回款进度内容</Text>
                <TextInput
                  style={[styles.editInput, styles.textArea]}
                  placeholder="请输入回款进度说明"
                  multiline
                  numberOfLines={3}
                  value={paymentProgressText}
                  onChangeText={setPaymentProgressText}
                />
              </View>
            </View>
            <View style={styles.editFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setPaymentProgressModalVisible(false)}>
                <Text style={styles.cancelBtnText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleAddPaymentProgress}>
                <Text style={styles.confirmBtnText}>提交</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
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
  sectionContent: {
    padding: 14,
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
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 13,
    color: '#95A5A6',
    width: 100,
  },
  infoValueContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoValue: {
    fontSize: 14,
    color: '#2D3436',
    flex: 1,
  },
  infoPlaceholder: {
    color: '#CCC',
  },
  infoUnit: {
    fontSize: 13,
    color: '#95A5A6',
    marginLeft: 4,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  dateLabel: {
    fontSize: 13,
    color: '#95A5A6',
    width: 120,
  },
  dateValue: {
    fontSize: 14,
    color: '#2D3436',
    flex: 1,
  },
  contactCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  contactRow: {
    marginBottom: 4,
  },
  contactLabel: {
    fontSize: 13,
    color: '#636E72',
  },
  contactActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
    marginTop: 8,
  },
  editText: {
    fontSize: 13,
    color: '#6C63FF',
  },
  deleteText: {
    fontSize: 13,
    color: '#E74C3C',
  },
  emptyText: {
    fontSize: 13,
    color: '#95A5A6',
    textAlign: 'center',
    paddingVertical: 12,
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  docLabel: {
    fontSize: 13,
    color: '#95A5A6',
    width: 100,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F0EEFF',
    borderRadius: 8,
    gap: 6,
  },
  uploadText: {
    fontSize: 13,
    color: '#6C63FF',
  },
  progressSection: {
    marginTop: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3436',
  },
  progressItem: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  progressText: {
    fontSize: 13,
    color: '#2D3436',
    marginBottom: 4,
  },
  progressDate: {
    fontSize: 12,
    color: '#95A5A6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#95A5A6',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: '85%',
    maxHeight: '70%',
  },
  selectHeader: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  selectTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3436',
  },
  selectList: {
    maxHeight: 300,
  },
  selectItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  selectItemActive: {
    backgroundColor: '#F0EEFF',
  },
  selectItemText: {
    fontSize: 14,
    color: '#2D3436',
  },
  selectItemTextActive: {
    color: '#6C63FF',
    fontWeight: '500',
  },
  selectFooter: {
    flexDirection: 'row',
    padding: 14,
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    color: '#636E72',
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#6C63FF',
    alignItems: 'center',
  },
  confirmBtnText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  editModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: '85%',
    maxHeight: '80%',
  },
  editHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  editTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3436',
  },
  editBody: {
    padding: 16,
  },
  editItem: {
    marginBottom: 14,
  },
  editLabel: {
    fontSize: 13,
    color: '#636E72',
    marginBottom: 6,
  },
  editInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#2D3436',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  editFooter: {
    flexDirection: 'row',
    padding: 14,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
});
