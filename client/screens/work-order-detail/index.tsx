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
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { PageHeader } from '@/components/PageHeader';
import { getApiBaseUrl } from '@/utils/api';
import { FontAwesome6 } from '@expo/vector-icons';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import DateTimePicker from '@react-native-community/datetimepicker';
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

interface ProgressNote {
  id: string;
  content: string;
  created_at: string;
}

interface WorkOrderDetail {
  id?: number;
  order_no?: string;
  title?: string;
  task_no?: string;
  customer_id?: number;
  customer_name?: string;
  task_leader?: string;
  implementation_entity?: string;
  task_phase?: string;
  task_progress?: string;
  task_status?: string;
  demand_assessment_period?: number;
  service_implementation_period?: number;
  payment_period?: number;
  contacts?: Contact[];
  demand_date?: string;
  // 需求信息
  requirement_date?: string;
  requirement_description?: string;
  requirement_photos?: string[];
  // 服务方案
  service_plan?: string;
  plan_hours?: number;
  planned_completion_date?: string;
  material_requirements?: string;
  warranty_status?: string;
  is_charged?: boolean;
  quoted_price?: number;
  service_docs?: string;
  consensus_docs?: string;
  consensus_date?: string;
  sales_sub_project_no?: string;
  material_code?: string;
  oa_work_order_no?: string;
  // 合同信息
  contract_id?: number;
  contract_no?: string;
  contract_name?: string;
  // 项目最新进度
  progress_notes?: ProgressNote[];
  implementer?: string;
  implementation_complete_date?: string;
  actual_hours?: number;
  work_order_docs?: string;
  site_completion_docs?: string;
  work_order_signer?: string;
  invoice_application?: string;
  invoice_completed?: string;
  invoice_delivered?: string;
  planned_payment_date?: string;
  actual_payment_date?: string;
  payment_progress?: PaymentProgress[];
  created_at?: string;
}

interface Customer {
  id: number;
  name: string;
  contact_person?: string;
  contact_phone?: string;
}

function WorkOrderDetailScreen() {
  const router = useSafeRouter();
  const { id } = useSafeSearchParams<{ id: string }>();
  const isCreateMode = !id || id === 'new';

  const [loading, setLoading] = useState(!isCreateMode);
  const [submitting, setSubmitting] = useState(false);
  const [order, setOrder] = useState<WorkOrderDetail | null>(null);
  const [editingField, setEditingField] = useState('');
  const [editValue, setEditValue] = useState('');
  const [selectModalVisible, setSelectModalVisible] = useState(false);
  const [selectOptions, setSelectOptions] = useState<string[]>([]);
  const [selectTitle, setSelectTitle] = useState('');

  // 客户搜索
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerSearchVisible, setCustomerSearchVisible] = useState(false);
  const [customerSearchKeyword, setCustomerSearchKeyword] = useState('');

  // 合同搜索
  interface Contract {
    id: number;
    contract_no: string;
    title: string;
    customer_name?: string;
  }
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [contractSearchVisible, setContractSearchVisible] = useState(false);
  const [contractSearchKeyword, setContractSearchKeyword] = useState('');

  // 完整性检查弹窗
  const [checkModalVisible, setCheckModalVisible] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [checking, setChecking] = useState(false);

  // 联系人弹窗
  const [contactModalVisible, setContactModalVisible] = useState(false);
  const [editingContactIndex, setEditingContactIndex] = useState(-1);
  const [contactForm, setContactForm] = useState<Contact>({ name: '', role: '', phone: '' });

  // 回款进度弹窗
  const [paymentProgressModalVisible, setPaymentProgressModalVisible] = useState(false);
  const [paymentProgressText, setPaymentProgressText] = useState('');

  // 项目最新进度
  const [progressNoteText, setProgressNoteText] = useState('');

  // 日历选择器
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [datePickerField, setDatePickerField] = useState('');
  const [datePickerValue, setDatePickerValue] = useState(new Date());

  // 任务阶段选项
  const taskPhaseOptions = ['需求阶段', '实施阶段', '回款阶段', '关单存档', '异常状态'];
  const taskProgressOptions = [
    '10%收到服务需求', '20%确定方案与报价', '30%客户方案和报价共识',
    '40%完成实施准备', '50%完成实施', '60%完成客户确认', '70%完成对账',
    '80%完成开票和送达', '90%完成回款', '100%完成资料归档',
    '已关单', '挂起暂停', '终止'
  ];

  // 计算两个日期之间的天数差
  const calculateDaysDiff = (startDate: string, endDate: string): number => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
    const diffTime = end.getTime() - start.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // 获取周期值
  const getDemandPeriod = () => calculateDaysDiff(order?.demand_date || '', order?.consensus_date || '');
  const getServicePeriod = () => calculateDaysDiff(order?.consensus_date || '', order?.implementation_complete_date || '');
  const getPaymentPeriod = () => calculateDaysDiff(order?.implementation_complete_date || '', order?.actual_payment_date || '');
  const taskStatusOptions = ['计划中', '延期风险', '已延期', '关单完成', '挂起或暂停'];
  const warrantyStatusOptions = ['质保期内', '质保期外'];
  const isChargedOptions = ['收费', '免费'];
  const invoiceOptions = ['已申请', '未申请'];
  const invoiceCompletedOptions = ['已开票', '待开票'];
  const invoiceDeliveredOptions = ['是', '否'];

  // 初始化空表单
  const getEmptyOrder = (): WorkOrderDetail => ({
    title: '',
    order_no: '',
    task_no: '',
    customer_name: '',
    customer_id: undefined,
    task_leader: '',
    implementation_entity: '',
    task_phase: '需求阶段',
    task_progress: '10%收到服务需求',
    task_status: '计划中',
    contacts: [],
    demand_date: '',
    requirement_date: '',
    requirement_description: '',
    requirement_photos: [],
    service_plan: '',
    plan_hours: 0,
    planned_completion_date: '',
    material_requirements: '',
    warranty_status: '',
    is_charged: false,
    quoted_price: 0,
    service_docs: '',
    consensus_docs: '',
    consensus_date: '',
    sales_sub_project_no: '',
    material_code: '',
    oa_work_order_no: '',
    contract_id: undefined,
    contract_no: '',
    contract_name: '',
    progress_notes: [],
    implementer: '',
    implementation_complete_date: '',
    actual_hours: 0,
    work_order_docs: '',
    site_completion_docs: '',
    work_order_signer: '',
    invoice_application: '',
    invoice_completed: '',
    invoice_delivered: '',
    planned_payment_date: '',
    actual_payment_date: '',
    payment_progress: [],
  });

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

  // 加载合同列表
  useEffect(() => {
    const loadContracts = async () => {
      try {
        const response = await fetch(`${getApiBaseUrl()}/api/v1/contracts`);
        const data = await response.json();
        if (Array.isArray(data)) {
          setContracts(data);
        } else if (data.rows) {
          setContracts(data.rows);
        }
      } catch (error) {
        console.error('Load contracts error:', error);
      }
    };
    loadContracts();
  }, []);

  // 加载工单详情
  useEffect(() => {
    if (!isCreateMode) {
      fetchOrderDetail();
    } else {
      setOrder(getEmptyOrder());
    }
  }, [id]);

  const fetchOrderDetail = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/v1/work-orders/${id}`);
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
        planned_completion_date: data.planned_completion_date || '',
        material_requirements: data.material_requirements || '',
        warranty_status: data.warranty_status || '',
        is_charged: data.is_charged || false,
        quoted_price: data.quoted_price || 0,
        service_docs: data.service_docs || '',
        consensus_docs: data.consensus_docs || '',
        consensus_date: data.consensus_date || '',
        sales_sub_project_no: data.sales_sub_project_no || '',
        material_code: data.material_code || '',
        oa_work_order_no: data.oa_work_order_no || '',
        contract_id: data.contract_id,
        contract_no: data.contract_no || '',
        contract_name: data.contract_name || '',
        progress_notes: data.progress_notes || [],
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

    if (field === 'task_phase') { setSelectOptions(taskPhaseOptions); setSelectTitle('选择任务阶段'); setSelectModalVisible(true); }
    else if (field === 'task_progress') { setSelectOptions(taskProgressOptions); setSelectTitle('选择任务进度'); setSelectModalVisible(true); }
    else if (field === 'task_status') { setSelectOptions(taskStatusOptions); setSelectTitle('选择任务状态'); setSelectModalVisible(true); }
    else if (field === 'warranty_status') { setSelectOptions(warrantyStatusOptions); setSelectTitle('选择质保期状态'); setSelectModalVisible(true); }
    else if (field === 'is_charged') { setSelectOptions(isChargedOptions); setSelectTitle('选择是否收费'); setSelectModalVisible(true); }
    else if (field === 'invoice_application') { setSelectOptions(invoiceOptions); setSelectTitle('是否申请开票'); setSelectModalVisible(true); }
    else if (field === 'invoice_completed') { setSelectOptions(invoiceCompletedOptions); setSelectTitle('开票是否完成'); setSelectModalVisible(true); }
    else if (field === 'invoice_delivered') { setSelectOptions(invoiceDeliveredOptions); setSelectTitle('发票是否送达客户'); setSelectModalVisible(true); }
  };

  // 打开日历选择器
  const openDatePicker = (field: string, currentValue: string) => {
    setDatePickerField(field);
    if (currentValue) {
      setDatePickerValue(new Date(currentValue));
    } else {
      setDatePickerValue(new Date());
    }
    setDatePickerVisible(true);
  };

  // 处理日期选择
  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setDatePickerVisible(false);
    }
    if (selectedDate) {
      const dateStr = selectedDate.toISOString().split('T')[0];
      if (isCreateMode) {
        setOrder((prev: any) => ({ ...prev, [datePickerField]: dateStr }));
      } else if (order) {
        setOrder({ ...order, [datePickerField]: dateStr });
        // 保存到服务器
        fetch(`${getApiBaseUrl()}/api/v1/work-orders/${order.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ [datePickerField]: dateStr }),
        });
      }
    }
  };

  // 上传需求照片/视频
  const handleUploadRequirementMedia = async (type: 'photo' | 'video') => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('提示', '需要相册权限才能上传');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: type === 'photo' ? ['images'] : ['videos'],
        allowsEditing: false,
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        if (isCreateMode) {
          setOrder((prev: any) => ({
            ...prev,
            requirement_photos: [...(prev.requirement_photos || []), uri],
          }));
        } else if (order) {
          const newPhotos = [...(order.requirement_photos || []), uri];
          setOrder({ ...order, requirement_photos: newPhotos });
        }
      }
    } catch (error) {
      Alert.alert('错误', '上传失败');
    }
  };

  // 删除需求照片
  const handleDeleteRequirementPhoto = (index: number) => {
    if (isCreateMode) {
      setOrder((prev: any) => ({
        ...prev,
        requirement_photos: (prev.requirement_photos || []).filter((_: any, i: number) => i !== index),
      }));
    } else if (order) {
      const newPhotos = (order.requirement_photos || []).filter((_, i) => i !== index);
      setOrder({ ...order, requirement_photos: newPhotos });
    }
  };

  // 多行文本输入处理
  const renderMultiLineRow = (label: string, field: keyof WorkOrderDetail, placeholder?: string) => (
    <View style={styles.multiLineContainer}>
      <Text style={styles.multiLineLabel}>{label}</Text>
      <TextInput
        style={styles.multiLineInput}
        value={(order?.[field] as string) || ''}
        onChangeText={(text) => handleTextChange(field, text)}
        placeholder={placeholder || `请输入${label}`}
        placeholderTextColor="#CCC"
        multiline
        numberOfLines={3}
        textAlignVertical="top"
      />
    </View>
  );

  // 上传报价单照片或共识凭证
  const handleUploadMedia = async (field: 'quoted_price_doc' | 'consensus_docs' | 'work_order_docs' | 'site_completion_docs') => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('提示', '需要相册权限才能上传');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        if (isCreateMode) {
          setOrder((prev: any) => ({ ...prev, [field]: uri }));
        } else if (order) {
          setOrder({ ...order, [field]: uri });
          // 保存到服务器
          fetch(`${getApiBaseUrl()}/api/v1/work-orders/${order.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ [field]: uri }),
          });
        }
      }
    } catch (error) {
      Alert.alert('错误', '上传失败');
    }
  };

  const handleSelectConfirm = async () => {
    if (!order) return;
    try {
      if (isCreateMode) {
        setOrder({ ...order, [editingField]: editValue });
      } else {
        const updates: any = { [editingField]: editValue };
        const response = await fetch(
          `${getApiBaseUrl()}/api/v1/work-orders/${order.id}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
          }
        );
        if (response.ok) {
          setOrder({ ...order, [editingField]: editValue });
          Alert.alert('成功', '修改成功');
        }
      }
      setSelectModalVisible(false);
    } catch (error) {
      Alert.alert('错误', '操作失败');
    }
  };

  const handleTextChange = (field: string, value: any) => {
    if (!order) return;
    if (isCreateMode) {
      setOrder({ ...order, [field]: value });
    }
  };

  // 客户搜索
  const filteredCustomers = customerSearchKeyword.trim()
    ? customers.filter((c) => c.name.toLowerCase().includes(customerSearchKeyword.toLowerCase()))
    : customers;

  const handleSelectCustomer = (customer: Customer) => {
    if (!order) return;
    const newOrder = { ...order, customer_id: customer.id, customer_name: customer.name };
    if (customer.contact_person) {
      newOrder.contacts = [{ name: customer.contact_person, role: '', phone: customer.contact_phone || '' }];
    }
    setOrder(newOrder);
    setCustomerSearchVisible(false);
    setCustomerSearchKeyword('');
  };

  // 联系人操作
  const handleAddContact = () => {
    setEditingContactIndex(-1);
    setContactForm({ name: '', role: '', phone: '' });
    setContactModalVisible(true);
  };

  const handleEditContact = (index: number) => {
    if (!order) return;
    setEditingContactIndex(index);
    setContactForm(order.contacts?.[index] || { name: '', role: '', phone: '' });
    setContactModalVisible(true);
  };

  const handleSaveContact = () => {
    if (!order) return;
    const newContacts = [...(order.contacts || [])];
    if (editingContactIndex >= 0) {
      newContacts[editingContactIndex] = contactForm;
    } else {
      newContacts.push(contactForm);
    }
    if (isCreateMode) {
      setOrder({ ...order, contacts: newContacts });
    } else {
      setOrder({ ...order, contacts: newContacts });
      // 保存到服务器
      fetch(`${getApiBaseUrl()}/api/v1/work-orders/${order.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contacts: newContacts }),
      });
    }
    setContactModalVisible(false);
  };

  const handleDeleteContact = async (index: number) => {
    if (!order) return;
    const newContacts = (order.contacts || []).filter((_, i) => i !== index);
    if (isCreateMode) {
      setOrder({ ...order, contacts: newContacts });
    } else {
      setOrder({ ...order, contacts: newContacts });
      await fetch(`${getApiBaseUrl()}/api/v1/work-orders/${order.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contacts: newContacts }),
      });
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
        `${getApiBaseUrl()}/api/v1/work-orders/${order.id}/payment-progress`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ progress: paymentProgressText }),
        }
      );
      if (response.ok) {
        const newProgress = await response.json();
        setOrder({ ...order, payment_progress: [...(order.payment_progress || []), newProgress] });
        setPaymentProgressModalVisible(false);
        setPaymentProgressText('');
        Alert.alert('成功', '回款进度已添加');
      }
    } catch (error) {
      Alert.alert('错误', '添加失败');
    }
  };

  // 字段名称映射
  const getFieldLabel = (field: string) => {
    const labels: Record<string, string> = {
      'task_phase': '任务阶段',
      'task_progress': '任务进度',
      'task_status': '任务状态',
      'customer_name': '客户名称',
      'contacts': '客户联系人',
      'service_plan': '服务方案',
      'is_charged': '是否收费',
      'consensus_docs': '客户共识凭证',
      'oa_work_order_no': 'OA系统工单编号',
      'work_order_docs': '派工单照片',
      'work_order_signer': '派工单签字人',
      'actual_hours': '实际工时',
    };
    return labels[field] || field;
  };

  // 工单完整性检查
  const handleCheckCompleteness = async () => {
    if (!order) return;
    setChecking(true);

    const missing: string[] = [];

    // 检查必填字段
    if (!order.task_phase) missing.push('task_phase');
    if (!order.task_progress) missing.push('task_progress');
    if (!order.task_status) missing.push('task_status');
    if (!order.customer_name) missing.push('customer_name');
    if (!order.contacts || order.contacts.length === 0) missing.push('contacts');
    if (!order.service_plan) missing.push('service_plan');
    if (order.is_charged === undefined || order.is_charged === null) missing.push('is_charged');
    if (!order.consensus_docs) missing.push('consensus_docs');
    if (!order.oa_work_order_no) missing.push('oa_work_order_no');
    if (!order.work_order_docs) missing.push('work_order_docs');
    if (!order.work_order_signer) missing.push('work_order_signer');
    if (!order.actual_hours && order.actual_hours !== 0) missing.push('actual_hours');

    setMissingFields(missing);
    setCheckModalVisible(true);
    setChecking(false);
  };

  // 创建提醒
  const handleCreateReminder = async () => {
    if (!order || missingFields.length === 0) return;

    try {
      const response = await fetch(`${getApiBaseUrl()}/api/v1/work-order-reminders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          work_order_id: order.id,
          work_order_name: order.title,
          work_order_no: order.order_no || order.task_no,
          missing_fields: missingFields,
          assigned_to: order.task_leader,
        }),
      });

      if (response.ok) {
        const reminder = await response.json();
        setCheckModalVisible(false);
        Alert.alert('成功', '已创建提醒，将通知相关人员', [
          { text: '查看提醒', onPress: () => router.push('/work-order-reminders') },
          { text: '关闭', style: 'cancel' },
        ]);
      }
    } catch (error) {
      Alert.alert('错误', '创建提醒失败');
    }
  };

  // 提交表单
  const handleSubmit = async () => {
    if (!order) return;
    if (!order.title?.trim()) { Alert.alert('提示', '工单名称不能为空'); return; }
    if (!order.customer_name?.trim()) { Alert.alert('提示', '客户名称不能为空'); return; }
    if (!order.task_leader?.trim()) { Alert.alert('提示', '任务负责人不能为空'); return; }
    if (!order.implementation_entity?.trim()) { Alert.alert('提示', '实施主体不能为空'); return; }

    try {
      setSubmitting(true);
      const response = await fetch(`${getApiBaseUrl()}/api/v1/work-orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: order.title,
          task_no: order.task_no || order.order_no,
          customer_id: order.customer_id,
          customer_name: order.customer_name,
          task_leader: order.task_leader,
          implementation_entity: order.implementation_entity,
          task_phase: order.task_phase,
          task_progress: order.task_progress,
          task_status: order.task_status,
          contacts: order.contacts,
          demand_date: order.demand_date || null,
          service_plan: order.service_plan,
          plan_hours: order.plan_hours,
          planned_completion_date: order.planned_completion_date || null,
          material_requirements: order.material_requirements,
          warranty_status: order.warranty_status,
          is_charged: order.is_charged,
          quoted_price: order.quoted_price,
          consensus_date: order.consensus_date || null,
          sales_sub_project_no: order.sales_sub_project_no,
          material_code: order.material_code,
          oa_work_order_no: order.oa_work_order_no,
          contract_id: order.contract_id,
          contract_no: order.contract_no,
          contract_name: order.contract_name,
          progress_notes: order.progress_notes,
          implementer: order.implementer,
          implementation_complete_date: order.implementation_complete_date || null,
          actual_hours: order.actual_hours,
          work_order_signer: order.work_order_signer,
          invoice_application: order.invoice_application,
          invoice_completed: order.invoice_completed,
          invoice_delivered: order.invoice_delivered,
          planned_payment_date: order.planned_payment_date || null,
          actual_payment_date: order.actual_payment_date || null,
        }),
      });
      if (response.ok) {
        Alert.alert('成功', '工单保存成功', [{ text: '确定', onPress: () => router.back() }]);
      } else {
        throw new Error('保存失败');
      }
    } catch (error) {
      Alert.alert('错误', '保存失败，请稍后重试');
    } finally {
      setSubmitting(false);
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

  const renderInputRow = (label: string, field: keyof WorkOrderDetail, placeholder?: string, editable?: boolean) => (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={(order?.[field] as string) || ''}
        onChangeText={(text) => handleTextChange(field, text)}
        placeholder={placeholder || `请输入${label}`}
        placeholderTextColor="#CCC"
        editable={editable !== false}
      />
    </View>
  );

  const renderNumberRow = (label: string, field: keyof WorkOrderDetail, unit?: string) => (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <View style={styles.numberInput}>
        <TextInput
          style={styles.numberValue}
          value={order?.[field] ? String(order[field]) : ''}
          onChangeText={(text) => handleTextChange(field, parseFloat(text) || 0)}
          keyboardType="numeric"
          placeholder="0"
          placeholderTextColor="#CCC"
        />
        {unit && <Text style={styles.infoUnit}>{unit}</Text>}
      </View>
    </View>
  );

  if (loading || !order) {
    return (
      <Screen>
        <PageHeader title="工单详情" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6C63FF" />
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <PageHeader
        title={isCreateMode ? '新建工单' : '工单详情'}
        rightAction={
          !isCreateMode && (
            <TouchableOpacity
              style={styles.checkButton}
              onPress={handleCheckCompleteness}
              disabled={checking}
            >
              {checking ? (
                <ActivityIndicator size="small" color="#6C63FF" />
              ) : (
                <FontAwesome6 name="clipboard-check" size={18} color="#6C63FF" />
              )}
            </TouchableOpacity>
          )
        }
      />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 12, paddingBottom: 80 }}>
          {/* 信息栏1：基本情况 */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <FontAwesome6 name="clipboard-list" size={16} color="#6C63FF" />
              <Text style={styles.sectionTitle}>基本情况</Text>
            </View>
            <View style={styles.sectionContent}>
              {isCreateMode ? (
                <>
                  {renderInputRow('工单名称', 'title', '请输入工单名称', true)}
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>工单编号</Text>
                    <View style={styles.autoBox}>
                      <Text style={styles.autoText}>{order.order_no || '保存后自动生成'}</Text>
                    </View>
                  </View>
                  {renderInputRow('任务号', 'task_no', '与工单编号绑定')}
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>客户名称 *</Text>
                    <TouchableOpacity style={styles.customerInput} onPress={() => setCustomerSearchVisible(!customerSearchVisible)}>
                      <Text style={[styles.customerText, !order.customer_name && styles.placeholder]}>{order.customer_name || '点击选择客户'}</Text>
                      <FontAwesome6 name={customerSearchVisible ? 'chevron-up' : 'chevron-down'} size={14} color="#95A5A6" />
                    </TouchableOpacity>
                  </View>
                  {customerSearchVisible && (
                    <View style={styles.customerSearch}>
                      <View style={styles.searchInputRow}>
                        <FontAwesome6 name="magnifying-glass" size={14} color="#95A5A6" />
                        <TextInput style={styles.searchInput} placeholder="搜索客户" value={customerSearchKeyword} onChangeText={setCustomerSearchKeyword} placeholderTextColor="#CCC" />
                      </View>
                      <ScrollView style={{ maxHeight: 150 }}>
                        {filteredCustomers.slice(0, 10).map((c) => (
                          <TouchableOpacity key={c.id} style={styles.customerItem} onPress={() => handleSelectCustomer(c)}>
                            <Text style={styles.customerName}>{c.name}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                  {renderInputRow('任务负责人', 'task_leader', '请输入任务负责人', true)}
                  {renderInputRow('实施主体', 'implementation_entity', '请输入实施主体', true)}
                </>
              ) : (
                <>
                  {renderInfoRow('工单名称', order.title || '', 'title')}
                  {renderInfoRow('工单编号', order.order_no || '')}
                  {renderInfoRow('任务号', order.task_no || '', 'task_no')}
                  {renderInfoRow('客户名称', order.customer_name || '')}
                  {renderInfoRow('任务负责人', order.task_leader || '', 'task_leader')}
                  {renderInfoRow('实施主体', order.implementation_entity || '', 'implementation_entity')}
                </>
              )}
            </View>
          </View>

          {/* 信息栏2：工单状态 */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <FontAwesome6 name="tasks" size={16} color="#00B894" />
              <Text style={styles.sectionTitle}>工单状态</Text>
            </View>
            <View style={styles.sectionContent}>
              {isCreateMode ? (
                <>
                  {renderInfoRow('任务阶段', order.task_phase || '需求阶段', 'task_phase')}
                  {renderInfoRow('任务进度', order.task_progress || '10%收到服务需求', 'task_progress')}
                  {renderInfoRow('任务状态', order.task_status || '计划中', 'task_status')}
                  <View style={styles.periodRow}>
                    <Text style={styles.periodLabel}>需求对接周期</Text>
                    <Text style={styles.periodValue}>{getDemandPeriod() > 0 ? getDemandPeriod() : '—'}</Text>
                    <Text style={styles.periodUnit}>天</Text>
                  </View>
                  <View style={styles.periodRow}>
                    <Text style={styles.periodLabel}>服务实施周期</Text>
                    <Text style={styles.periodValue}>{getServicePeriod() > 0 ? getServicePeriod() : '—'}</Text>
                    <Text style={styles.periodUnit}>天</Text>
                  </View>
                  <View style={styles.periodRow}>
                    <Text style={styles.periodLabel}>回款周期</Text>
                    <Text style={styles.periodValue}>{getPaymentPeriod() > 0 ? getPaymentPeriod() : '—'}</Text>
                    <Text style={styles.periodUnit}>天</Text>
                  </View>
                </>
              ) : (
                <>
                  {renderInfoRow('任务阶段', order.task_phase || '', 'task_phase')}
                  {renderInfoRow('任务进度', order.task_progress || '', 'task_progress')}
                  {renderInfoRow('任务状态', order.task_status || '', 'task_status')}
                  {renderInfoRow('需求阶段时间周期', order.demand_assessment_period ? String(order.demand_assessment_period) : '', '', '天')}
                  {renderInfoRow('服务实施时间周期', order.service_implementation_period ? String(order.service_implementation_period) : '', '', '天')}
                  {renderInfoRow('回款周期', order.payment_period ? String(order.payment_period) : '', '', '天')}
                </>
              )}
            </View>
          </View>

          {/* 项目最新进度 */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <FontAwesome6 name="chart-line" size={16} color="#9B59B6" />
              <Text style={styles.sectionTitle}>项目最新进度</Text>
            </View>
            <View style={styles.sectionContent}>
              {/* 进度输入 */}
              <View style={styles.progressInputContainer}>
                <TextInput
                  style={styles.progressInput}
                  placeholder="输入项目最新进度说明..."
                  placeholderTextColor="#B2BEC3"
                  value={progressNoteText}
                  onChangeText={setProgressNoteText}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
                <TouchableOpacity
                  style={[styles.progressSaveBtn, !progressNoteText.trim() && styles.progressSaveBtnDisabled]}
                  onPress={() => {
                    if (!progressNoteText.trim()) return;
                    const newNote: ProgressNote = {
                      id: Date.now().toString(),
                      content: progressNoteText.trim(),
                      created_at: new Date().toISOString(),
                    };
                    setOrder((prev: any) => ({
                      ...prev,
                      progress_notes: [...(prev.progress_notes || []), newNote],
                    }));
                    setProgressNoteText('');
                  }}
                  disabled={!progressNoteText.trim()}
                >
                  <FontAwesome6 name="paper-plane" size={14} color="#FFF" />
                  <Text style={styles.progressSaveBtnText}>保存</Text>
                </TouchableOpacity>
              </View>

              {/* 历史记录 */}
              {order.progress_notes && order.progress_notes.length > 0 ? (
                <View style={styles.progressHistory}>
                  <Text style={styles.progressHistoryTitle}>历史记录</Text>
                  {order.progress_notes.slice().reverse().map((note, index) => (
                    <View key={note.id} style={styles.progressNoteItem}>
                      <View style={styles.progressNoteHeader}>
                        <Text style={styles.progressNoteDate}>
                          {new Date(note.created_at).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>
                      <Text style={styles.progressNoteContent}>{note.content}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyText}>暂无进度记录</Text>
              )}
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
              {isCreateMode ? (
                <TouchableOpacity style={styles.dateInput} onPress={() => openDatePicker('demand_date', order.demand_date || '')}>
                  <Text style={styles.dateLabel}>接到服务需求日期</Text>
                  <Text style={styles.dateValue}>{order.demand_date || '点击选择日期'}</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.dateInput} onPress={() => openDatePicker('demand_date', order.demand_date || '')}>
                  <Text style={styles.dateLabel}>接到服务需求日期</Text>
                  <Text style={styles.dateValue}>{order.demand_date || '点击选择日期'}</Text>
                </TouchableOpacity>
              )}
              {order.contacts && order.contacts.length > 0 ? order.contacts.map((contact, index) => (
                <View key={index} style={styles.contactCard}>
                  <Text style={styles.contactText}>联系人：{contact.name}{contact.role ? ` | ${contact.role}` : ''}{contact.phone ? ` | ${contact.phone}` : ''}</Text>
                  <View style={styles.contactActions}>
                    <TouchableOpacity onPress={() => handleEditContact(index)}><Text style={styles.editText}>编辑</Text></TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteContact(index)}><Text style={styles.deleteText}>删除</Text></TouchableOpacity>
                  </View>
                </View>
              )) : <Text style={styles.emptyText}>暂无联系人</Text>}
            </View>
          </View>

          {/* 信息栏3.5：需求信息 */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <FontAwesome6 name="lightbulb" size={16} color="#FDCB6E" />
              <Text style={styles.sectionTitle}>需求信息</Text>
            </View>
            <View style={styles.sectionContent}>
              {isCreateMode ? (
                <>
                  <TouchableOpacity style={styles.dateInput} onPress={() => openDatePicker('requirement_date', order.requirement_date || '')}>
                    <Text style={styles.dateLabel}>接到需求日期</Text>
                    <Text style={styles.dateValue}>{order.requirement_date || '点击选择日期'}</Text>
                  </TouchableOpacity>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>需求说明</Text>
                  </View>
                  <TextInput
                    style={styles.textArea}
                    value={order.requirement_description || ''}
                    onChangeText={(text) => handleTextChange('requirement_description', text)}
                    placeholder="请输入需求说明"
                    placeholderTextColor="#CCC"
                    multiline
                    numberOfLines={4}
                  />
                  <View style={styles.uploadSection}>
                    <Text style={styles.uploadLabel}>照片或视频</Text>
                    <View style={styles.uploadButtons}>
                      <TouchableOpacity style={styles.uploadBtn} onPress={() => handleUploadRequirementMedia('photo')}>
                        <FontAwesome6 name="image" size={14} color="#6C63FF" />
                        <Text style={styles.uploadBtnText}>上传照片</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.uploadBtn} onPress={() => handleUploadRequirementMedia('video')}>
                        <FontAwesome6 name="video" size={14} color="#6C63FF" />
                        <Text style={styles.uploadBtnText}>上传视频</Text>
                      </TouchableOpacity>
                    </View>
                    {order.requirement_photos && order.requirement_photos.length > 0 && (
                      <View style={styles.photoList}>
                        {order.requirement_photos.map((photo, index) => (
                          <View key={index} style={styles.photoItem}>
                            <Text style={styles.photoText}>文件 {index + 1}</Text>
                            <TouchableOpacity onPress={() => handleDeleteRequirementPhoto(index)}>
                              <FontAwesome6 name="times-circle" size={16} color="#E74C3C" />
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                </>
              ) : (
                <>
                  <TouchableOpacity style={styles.dateInput} onPress={() => openDatePicker('requirement_date', order.requirement_date || '')}>
                    <Text style={styles.dateLabel}>接到需求日期</Text>
                    <Text style={styles.dateValue}>{order.requirement_date || '点击选择日期'}</Text>
                  </TouchableOpacity>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>需求说明</Text>
                  </View>
                  <TextInput
                    style={styles.textArea}
                    value={order.requirement_description || ''}
                    onChangeText={(text) => {
                      setOrder({ ...order, requirement_description: text });
                    }}
                    placeholder="请输入需求说明"
                    placeholderTextColor="#CCC"
                    multiline
                    numberOfLines={4}
                    onBlur={() => {
                      if (order?.id && order.requirement_description !== undefined) {
                        fetch(`${getApiBaseUrl()}/api/v1/work-orders/${order.id}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ requirement_description: order.requirement_description }),
                        });
                      }
                    }}
                  />
                  <View style={styles.uploadSection}>
                    <Text style={styles.uploadLabel}>照片或视频</Text>
                    <View style={styles.uploadButtons}>
                      <TouchableOpacity style={styles.uploadBtn} onPress={() => handleUploadRequirementMedia('photo')}>
                        <FontAwesome6 name="image" size={14} color="#6C63FF" />
                        <Text style={styles.uploadBtnText}>上传照片</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.uploadBtn} onPress={() => handleUploadRequirementMedia('video')}>
                        <FontAwesome6 name="video" size={14} color="#6C63FF" />
                        <Text style={styles.uploadBtnText}>上传视频</Text>
                      </TouchableOpacity>
                    </View>
                    {order.requirement_photos && order.requirement_photos.length > 0 && (
                      <View style={styles.photoList}>
                        {order.requirement_photos.map((photo, index) => (
                          <View key={index} style={styles.photoItem}>
                            <Text style={styles.photoText}>文件 {index + 1}</Text>
                            <TouchableOpacity onPress={() => handleDeleteRequirementPhoto(index)}>
                              <FontAwesome6 name="times-circle" size={16} color="#E74C3C" />
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                </>
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
              {isCreateMode ? (
                <>
                  {renderInputRow('服务方案说明', 'service_plan', '请输入服务方案说明')}
                  {renderNumberRow('计划工时', 'plan_hours', '天')}
                  <TouchableOpacity style={styles.dateInput} onPress={() => openDatePicker('planned_completion_date', order.planned_completion_date || '')}>
                    <Text style={styles.dateLabel}>计划完成日期</Text>
                    <Text style={styles.dateValue}>{order.planned_completion_date || '点击选择日期'}</Text>
                  </TouchableOpacity>
                  {renderInputRow('物料需求', 'material_requirements', '请输入物料需求')}
                  {renderInfoRow('质保期状态', order.warranty_status || '', 'warranty_status')}
                  {renderInfoRow('是否收费', order.is_charged ? '收费' : '免费', 'is_charged')}
                  {renderNumberRow('收费金额', 'quoted_price', '元')}
                  <View style={styles.uploadRow}>
                    <Text style={styles.uploadLabel}>上传报价单照片</Text>
                    <TouchableOpacity style={styles.uploadBtn} onPress={() => handleUploadMedia('quoted_price_doc')}>
                      <FontAwesome6 name="upload" size={14} color="#6C63FF" />
                      <Text style={styles.uploadBtnText}>{order.quoted_price ? '已上传' : '上传'}</Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity style={styles.dateInput} onPress={() => openDatePicker('consensus_date', order.consensus_date || '')}>
                    <Text style={styles.dateLabel}>共识日期</Text>
                    <Text style={styles.dateValue}>{order.consensus_date || '点击选择日期'}</Text>
                  </TouchableOpacity>
                  <View style={styles.uploadRow}>
                    <Text style={styles.uploadLabel}>客户共识凭证</Text>
                    <TouchableOpacity style={styles.uploadBtn} onPress={() => handleUploadMedia('consensus_docs')}>
                      <FontAwesome6 name="upload" size={14} color="#6C63FF" />
                      <Text style={styles.uploadBtnText}>{order.consensus_docs ? '已上传' : '上传'}</Text>
                    </TouchableOpacity>
                  </View>
                  {renderInputRow('销售子项目号', 'sales_sub_project_no', '请输入销售子项目号')}
                  {/* 合同搜索选择 */}
                  <View style={styles.contractSearchContainer}>
                    <Text style={styles.contractLabel}>合同编号/名称</Text>
                    <TouchableOpacity
                      style={styles.contractInput}
                      onPress={() => setContractSearchVisible(!contractSearchVisible)}
                    >
                      <Text style={order.contract_no ? styles.contractValue : styles.contractPlaceholder}>
                        {order.contract_no ? `${order.contract_no} - ${order.contract_name || '未知'}` : '点击选择合同'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  {contractSearchVisible && (
                    <View style={styles.contractDropdown}>
                      <TextInput
                        style={styles.contractSearchInput}
                        placeholder="输入合同编号或名称搜索"
                        placeholderTextColor="#CCC"
                        value={contractSearchKeyword}
                        onChangeText={setContractSearchKeyword}
                      />
                      <ScrollView style={styles.contractList} nestedScrollEnabled>
                        {contracts
                          .filter(c => 
                            !contractSearchKeyword ||
                            c.contract_no?.toLowerCase().includes(contractSearchKeyword.toLowerCase()) ||
                            (c.title || '').toLowerCase().includes(contractSearchKeyword.toLowerCase())
                          )
                          .slice(0, 10)
                          .map((contract) => (
                            <TouchableOpacity
                              key={contract.id}
                              style={styles.contractItem}
                              onPress={() => {
                                setOrder((prev: any) => ({
                                  ...prev,
                                  contract_id: contract.id,
                                  contract_no: contract.contract_no,
                                  contract_name: contract.title || '',
                                }));
                                setContractSearchVisible(false);
                                setContractSearchKeyword('');
                              }}
                            >
                              <Text style={styles.contractItemNo}>{contract.contract_no}</Text>
                              <Text style={styles.contractItemName}>{contract.title || '未知'}</Text>
                            </TouchableOpacity>
                          ))}
                      </ScrollView>
                    </View>
                  )}
                  {renderMultiLineRow('物料编码', 'material_code', '请输入物料编码（支持多行）')}
                  {renderInputRow('OA系统工单编号', 'oa_work_order_no', '请输入OA系统工单编号')}
                </>
              ) : (
                <>
                  {renderInfoRow('服务方案说明', order.service_plan || '', 'service_plan')}
                  {renderInfoRow('计划工时', order.plan_hours ? String(order.plan_hours) : '', '', '天')}
                  <TouchableOpacity style={styles.dateInput} onPress={() => openDatePicker('planned_completion_date', order.planned_completion_date || '')}>
                    <Text style={styles.dateLabel}>计划完成日期</Text>
                    <Text style={styles.dateValue}>{order.planned_completion_date || '点击选择日期'}</Text>
                  </TouchableOpacity>
                  {renderInfoRow('物料需求', order.material_requirements || '', 'material_requirements')}
                  {renderInfoRow('质保期状态', order.warranty_status || '', 'warranty_status')}
                  {renderInfoRow('是否收费', order.is_charged ? '收费' : '免费', 'is_charged')}
                  {renderInfoRow('收费金额', order.quoted_price ? String(order.quoted_price) : '', '', '元')}
                  <View style={styles.uploadRow}>
                    <Text style={styles.uploadLabel}>上传报价单照片</Text>
                    <TouchableOpacity style={styles.uploadBtn} onPress={() => handleUploadMedia('quoted_price_doc')}>
                      <FontAwesome6 name="upload" size={14} color="#6C63FF" />
                      <Text style={styles.uploadBtnText}>{order.quoted_price ? '已上传' : '上传'}</Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity style={styles.dateInput} onPress={() => openDatePicker('consensus_date', order.consensus_date || '')}>
                    <Text style={styles.dateLabel}>服务方案客户共识日期</Text>
                    <Text style={styles.dateValue}>{order.consensus_date || '点击选择日期'}</Text>
                  </TouchableOpacity>
                  <View style={styles.uploadRow}>
                    <Text style={styles.uploadLabel}>客户共识凭证</Text>
                    <TouchableOpacity style={styles.uploadBtn} onPress={() => handleUploadMedia('consensus_docs')}>
                      <FontAwesome6 name="upload" size={14} color="#6C63FF" />
                      <Text style={styles.uploadBtnText}>{order.consensus_docs ? '已上传' : '上传'}</Text>
                    </TouchableOpacity>
                  </View>
                  {renderInputRow('销售子项目号', 'sales_sub_project_no', '请输入销售子项目号', true)}
                  {order.contract_no ? (
                    <View style={styles.contractDisplayRow}>
                      <Text style={styles.infoLabel}>合同编号</Text>
                      <Text style={styles.infoValue}>{order.contract_no}</Text>
                    </View>
                  ) : null}
                  {order.contract_name ? (
                    <View style={styles.contractDisplayRow}>
                      <Text style={styles.infoLabel}>合同名称</Text>
                      <Text style={styles.infoValue}>{order.contract_name}</Text>
                    </View>
                  ) : null}
                  {renderMultiLineRow('物料编码', 'material_code', '请输入物料编码（支持多行）')}
                  {renderInputRow('OA系统工单编号', 'oa_work_order_no', '请输入OA系统工单编号', true)}
                </>
              )}
            </View>
          </View>

          {/* 信息栏5：实施情况 */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <FontAwesome6 name="hard-hat" size={16} color="#F39C12" />
              <Text style={styles.sectionTitle}>实施情况</Text>
            </View>
            <View style={styles.sectionContent}>
              {isCreateMode ? (
                <>
                  {renderInputRow('实施人', 'implementer', '请输入实施人')}
                  <TouchableOpacity style={styles.dateInput} onPress={() => openDatePicker('implementation_complete_date', order.implementation_complete_date || '')}>
                    <Text style={styles.dateLabel}>完成日期</Text>
                    <Text style={styles.dateValue}>{order.implementation_complete_date || '点击选择日期'}</Text>
                  </TouchableOpacity>
                  {renderNumberRow('实际工时', 'actual_hours', '天')}
                  {renderInputRow('派工单签字人', 'work_order_signer', '请输入派工单签字人')}
                  <View style={styles.uploadRow}>
                    <Text style={styles.uploadLabel}>派工单照片</Text>
                    <TouchableOpacity style={styles.uploadBtn} onPress={() => handleUploadMedia('work_order_docs')}>
                      <FontAwesome6 name="camera" size={14} color="#6C63FF" />
                      <Text style={styles.uploadBtnText}>{order.work_order_docs ? '已上传' : '上传'}</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.uploadRow}>
                    <Text style={styles.uploadLabel}>现场实施照片</Text>
                    <TouchableOpacity style={styles.uploadBtn} onPress={() => handleUploadMedia('site_completion_docs')}>
                      <FontAwesome6 name="camera" size={14} color="#6C63FF" />
                      <Text style={styles.uploadBtnText}>{order.site_completion_docs ? '已上传' : '上传'}</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <>
                  {renderInfoRow('实施人', order.implementer || '', 'implementer')}
                  <TouchableOpacity style={styles.dateInput} onPress={() => openDatePicker('implementation_complete_date', order.implementation_complete_date || '')}>
                    <Text style={styles.dateLabel}>实施完成日期</Text>
                    <Text style={styles.dateValue}>{order.implementation_complete_date || '点击选择日期'}</Text>
                  </TouchableOpacity>
                  {renderInfoRow('实际工时投入', order.actual_hours ? String(order.actual_hours) : '', '', '天')}
                  {renderInfoRow('派工单签字人', order.work_order_signer || '', 'work_order_signer')}
                  <View style={styles.uploadRow}>
                    <Text style={styles.uploadLabel}>派工单照片</Text>
                    <TouchableOpacity style={styles.uploadBtn} onPress={() => handleUploadMedia('work_order_docs')}>
                      <FontAwesome6 name="camera" size={14} color="#6C63FF" />
                      <Text style={styles.uploadBtnText}>{order.work_order_docs ? '已上传' : '上传'}</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.uploadRow}>
                    <Text style={styles.uploadLabel}>现场实施照片</Text>
                    <TouchableOpacity style={styles.uploadBtn} onPress={() => handleUploadMedia('site_completion_docs')}>
                      <FontAwesome6 name="camera" size={14} color="#6C63FF" />
                      <Text style={styles.uploadBtnText}>{order.site_completion_docs ? '已上传' : '上传'}</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </View>

          {/* 信息栏6：回款情况 */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <FontAwesome6 name="money-bill" size={16} color="#27AE60" />
              <Text style={styles.sectionTitle}>回款情况</Text>
            </View>
            <View style={styles.sectionContent}>
              {isCreateMode ? (
                <>
                  {renderInfoRow('是否申请开票', order.invoice_application || '', 'invoice_application')}
                  {renderInfoRow('开票是否完成', order.invoice_completed || '', 'invoice_completed')}
                  {renderInfoRow('发票是否送达', order.invoice_delivered || '', 'invoice_delivered')}
                  <TouchableOpacity style={styles.dateInput} onPress={() => openDatePicker('planned_payment_date', order.planned_payment_date || '')}>
                    <Text style={styles.dateLabel}>计划回款日期</Text>
                    <Text style={styles.dateValue}>{order.planned_payment_date || '点击选择日期'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.dateInput} onPress={() => openDatePicker('actual_payment_date', order.actual_payment_date || '')}>
                    <Text style={styles.dateLabel}>实际回款日期</Text>
                    <Text style={styles.dateValue}>{order.actual_payment_date || '点击选择日期'}</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  {renderInfoRow('是否申请开票', order.invoice_application || '', 'invoice_application')}
                  {renderInfoRow('开票是否完成', order.invoice_completed || '', 'invoice_completed')}
                  {renderInfoRow('发票是否送达客户', order.invoice_delivered || '', 'invoice_delivered')}
                  <TouchableOpacity style={styles.dateInput} onPress={() => openDatePicker('planned_payment_date', order.planned_payment_date || '')}>
                    <Text style={styles.dateLabel}>计划回款日期</Text>
                    <Text style={styles.dateValue}>{order.planned_payment_date || '点击选择日期'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.dateInput} onPress={() => openDatePicker('actual_payment_date', order.actual_payment_date || '')}>
                    <Text style={styles.dateLabel}>实际回款日期</Text>
                    <Text style={styles.dateValue}>{order.actual_payment_date || '点击选择日期'}</Text>
                  </TouchableOpacity>
                  <View style={styles.progressSection}>
                    <View style={styles.progressHeader}>
                      <Text style={styles.progressTitle}>回款进度记录</Text>
                      <TouchableOpacity style={styles.addBtn} onPress={() => setPaymentProgressModalVisible(true)}>
                        <FontAwesome6 name="plus" size={12} color="#6C63FF" /><Text style={styles.addBtnText}>新增进度</Text>
                      </TouchableOpacity>
                    </View>
                    {order.payment_progress && order.payment_progress.length > 0 ? order.payment_progress.map((item, index) => (
                      <View key={item.id || index} style={styles.progressItem}>
                        <Text style={styles.progressText}>{item.progress}</Text>
                        <Text style={styles.progressDate}>{item.updated_at?.split('T')[0]}</Text>
                      </View>
                    )) : <Text style={styles.emptyText}>暂无回款进度</Text>}
                  </View>
                </>
              )}
            </View>
          </View>
        </ScrollView>

        {/* 新建模式底部按钮 */}
        {isCreateMode && (
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
              <Text style={styles.cancelBtnText}>取消</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
              {submitting ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.submitBtnText}>保存工单</Text>}
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* 下拉选择弹窗 */}
      <Modal visible={selectModalVisible} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setSelectModalVisible(false)}>
          <View style={styles.selectModal}>
            <View style={styles.selectHeader}><Text style={styles.selectTitle}>{selectTitle}</Text></View>
            <ScrollView style={{ maxHeight: 300 }}>
              {selectOptions.map((option, index) => (
                <TouchableOpacity key={index} style={[styles.selectItem, editValue === option && styles.selectActive]} onPress={() => setEditValue(option)}>
                  <Text style={[styles.selectItemText, editValue === option && styles.selectActiveText]}>{option}</Text>
                  {editValue === option && <FontAwesome6 name="check" size={16} color="#6C63FF" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.selectFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setSelectModalVisible(false)}><Text style={styles.cancelBtnText}>取消</Text></TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleSelectConfirm}><Text style={styles.submitBtnText}>确定</Text></TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 日期选择器 */}
      {datePickerVisible && (
        Platform.OS === 'ios' ? (
          <Modal visible={datePickerVisible} transparent animationType="fade">
            <View style={styles.modalOverlay}>
              <View style={styles.datePickerModal}>
                <View style={styles.datePickerHeader}>
                  <TouchableOpacity onPress={() => setDatePickerVisible(false)}>
                    <Text style={styles.datePickerCancel}>取消</Text>
                  </TouchableOpacity>
                  <Text style={styles.datePickerTitle}>选择日期</Text>
                  <TouchableOpacity onPress={() => setDatePickerVisible(false)}>
                    <Text style={styles.datePickerDone}>完成</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={datePickerValue}
                  mode="date"
                  display="spinner"
                  onChange={handleDateChange}
                />
              </View>
            </View>
          </Modal>
        ) : (
          <DateTimePicker
            value={datePickerValue}
            mode="date"
            display="default"
            onChange={handleDateChange}
          />
        )
      )}

      {/* 联系人编辑弹窗 */}
      <Modal visible={contactModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.editModal}>
            <View style={styles.editHeader}>
              <Text style={styles.editTitle}>{editingContactIndex >= 0 ? '编辑联系人' : '添加联系人'}</Text>
              <TouchableOpacity onPress={() => setContactModalVisible(false)}><FontAwesome6 name="times" size={18} color="#666" /></TouchableOpacity>
            </View>
            <View style={styles.editBody}>
              <View style={styles.editItem}>
                <Text style={styles.editLabel}>联系人姓名 *</Text>
                <TextInput style={styles.editInput} placeholder="请输入" value={contactForm.name} onChangeText={(text) => setContactForm({ ...contactForm, name: text })} />
              </View>
              <View style={styles.editItem}>
                <Text style={styles.editLabel}>角色/职务</Text>
                <TextInput style={styles.editInput} placeholder="请输入" value={contactForm.role} onChangeText={(text) => setContactForm({ ...contactForm, role: text })} />
              </View>
              <View style={styles.editItem}>
                <Text style={styles.editLabel}>联系电话 *</Text>
                <TextInput style={styles.editInput} placeholder="请输入" keyboardType="phone-pad" value={contactForm.phone} onChangeText={(text) => setContactForm({ ...contactForm, phone: text })} />
              </View>
            </View>
            <View style={styles.editFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setContactModalVisible(false)}><Text style={styles.cancelBtnText}>取消</Text></TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleSaveContact}><Text style={styles.submitBtnText}>保存</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 回款进度弹窗 */}
      <Modal visible={paymentProgressModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.editModal}>
            <View style={styles.editHeader}>
              <Text style={styles.editTitle}>新增回款进度</Text>
              <TouchableOpacity onPress={() => setPaymentProgressModalVisible(false)}><FontAwesome6 name="times" size={18} color="#666" /></TouchableOpacity>
            </View>
            <View style={styles.editBody}>
              <View style={styles.editItem}>
                <Text style={styles.editLabel}>回款进度内容</Text>
                <TextInput style={[styles.editInput, styles.textArea]} placeholder="请输入回款进度说明" multiline numberOfLines={3} value={paymentProgressText} onChangeText={setPaymentProgressText} />
              </View>
            </View>
            <View style={styles.editFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setPaymentProgressModalVisible(false)}><Text style={styles.cancelBtnText}>取消</Text></TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleAddPaymentProgress}><Text style={styles.submitBtnText}>提交</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 工单完整性检查弹窗 */}
      <Modal visible={checkModalVisible} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setCheckModalVisible(false)}>
          <View style={styles.checkModal} onStartShouldSetResponder={() => true}>
            <View style={styles.checkModalHeader}>
              <Text style={styles.checkModalTitle}>工单信息完整性检查</Text>
              <TouchableOpacity onPress={() => setCheckModalVisible(false)}>
                <FontAwesome6 name="times" size={20} color="#636E72" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.checkModalContent}>
              {missingFields.length === 0 ? (
                <View style={styles.checkEmptyIcon}>
                  <FontAwesome6 name="check-circle" size={60} color="#2ECC71" />
                  <Text style={styles.checkEmptyText}>所有必填信息已填写完整</Text>
                  <Text style={styles.checkEmptySubtext}>工单信息填写良好，无需补充</Text>
                </View>
              ) : (
                <>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
                    <FontAwesome6 name="exclamation-triangle" size={18} color="#E74C3C" />
                    <Text style={[styles.checkResultTitle, { marginLeft: 8, marginBottom: 0, color: '#E74C3C' }]}>
                      发现 {missingFields.length} 项信息待填写
                    </Text>
                  </View>
                  <View style={styles.checkFieldList}>
                    {missingFields.map((field, index) => (
                      <View key={index} style={styles.checkFieldItem}>
                        <View style={styles.checkFieldNumber}>
                          <Text style={styles.checkFieldNumberText}>{index + 1}</Text>
                        </View>
                        <Text style={styles.checkFieldLabel}>{getFieldLabel(field)}</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}
            </ScrollView>
            <View style={styles.checkModalFooter}>
              <TouchableOpacity style={styles.checkCancelBtn} onPress={() => setCheckModalVisible(false)}>
                <Text style={styles.checkCancelBtnText}>关闭</Text>
              </TouchableOpacity>
              {missingFields.length > 0 && (
                <TouchableOpacity style={styles.checkConfirmBtn} onPress={handleCreateReminder}>
                  <Text style={styles.checkConfirmBtnText}>创建提醒</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { backgroundColor: '#FFF', borderRadius: 12, marginBottom: 12, overflow: 'hidden' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#2D3436', marginLeft: 8, flex: 1 },
  sectionContent: { padding: 14 },
  addBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, backgroundColor: '#F0EEFF', borderRadius: 12, gap: 4 },
  addBtnText: { fontSize: 12, color: '#6C63FF' },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  infoLabel: { fontSize: 13, color: '#95A5A6', width: 100 },
  infoValueContainer: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  infoValue: { fontSize: 14, color: '#2D3436', flex: 1 },
  infoPlaceholder: { color: '#CCC' },
  infoUnit: { fontSize: 13, color: '#95A5A6', marginLeft: 4 },
  periodRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#F8F9FA', borderRadius: 8 },
  periodLabel: { fontSize: 13, color: '#95A5A6', flex: 1 },
  periodValue: { fontSize: 16, color: '#6C63FF', fontWeight: '600', minWidth: 40, textAlign: 'center' },
  periodUnit: { fontSize: 13, color: '#95A5A6', marginLeft: 4 },
  input: { flex: 1, backgroundColor: '#F8F9FA', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, color: '#2D3436' },
  numberInput: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  numberValue: { flex: 1, backgroundColor: '#F8F9FA', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, color: '#2D3436' },
  autoBox: { flex: 1, backgroundColor: '#F8F9FA', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  autoText: { fontSize: 14, color: '#95A5A6' },
  customerInput: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8F9FA', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  customerText: { fontSize: 14, color: '#2D3436', flex: 1 },
  placeholder: { color: '#CCC' },
  customerSearch: { backgroundColor: '#FFF', borderRadius: 8, borderWidth: 1, borderColor: '#E0E0E0', marginBottom: 12 },
  searchInputRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', gap: 8 },
  searchInput: { flex: 1, fontSize: 13, color: '#2C3E50', padding: 0 },
  customerItem: { paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  customerName: { fontSize: 14, color: '#2D3436', fontWeight: '500' },
  dateInput: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#F8F9FA', borderRadius: 8 },
  dateLabel: { fontSize: 13, color: '#95A5A6', width: 120 },
  dateValue: { fontSize: 14, color: '#2D3436', flex: 1 },
  contactCard: { backgroundColor: '#F8F9FA', borderRadius: 8, padding: 12, marginBottom: 10 },
  contactText: { fontSize: 13, color: '#636E72', marginBottom: 4 },
  contactActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 16, marginTop: 8 },
  editText: { fontSize: 13, color: '#6C63FF' },
  deleteText: { fontSize: 13, color: '#E74C3C' },
  emptyText: { fontSize: 13, color: '#95A5A6', textAlign: 'center', paddingVertical: 12 },
  docRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  docLabel: { fontSize: 13, color: '#95A5A6', width: 100 },
  uploadBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#F0EEFF', borderRadius: 8, gap: 6 },
  uploadText: { fontSize: 13, color: '#6C63FF' },
  progressSection: { marginTop: 8 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  progressTitle: { fontSize: 14, fontWeight: '600', color: '#2D3436' },
  progressItem: { backgroundColor: '#F8F9FA', borderRadius: 8, padding: 12, marginBottom: 8 },
  progressText: { fontSize: 13, color: '#2D3436', marginBottom: 4 },
  progressDate: { fontSize: 12, color: '#95A5A6' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 14, color: '#95A5A6', marginTop: 12 },
  footer: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 12, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#F0F0F0', gap: 12 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 10, backgroundColor: '#F0F0F0', alignItems: 'center' },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: '#636E72' },
  submitBtn: { flex: 1, paddingVertical: 14, borderRadius: 10, backgroundColor: '#6C63FF', alignItems: 'center' },
  submitBtnText: { fontSize: 15, fontWeight: '600', color: '#FFF' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  selectModal: { backgroundColor: '#FFF', borderRadius: 12, width: '85%', maxHeight: '70%' },
  selectHeader: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  selectTitle: { fontSize: 16, fontWeight: '600', color: '#2D3436' },
  selectItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  selectActive: { backgroundColor: '#F0EEFF' },
  selectItemText: { fontSize: 14, color: '#2D3436' },
  selectActiveText: { color: '#6C63FF', fontWeight: '500' },
  selectFooter: { flexDirection: 'row', padding: 14, gap: 12 },
  editModal: { backgroundColor: '#FFF', borderRadius: 12, width: '85%', maxHeight: '80%' },
  editHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  editTitle: { fontSize: 16, fontWeight: '600', color: '#2D3436' },
  editBody: { padding: 16 },
  editItem: { marginBottom: 14 },
  editLabel: { fontSize: 13, color: '#636E72', marginBottom: 6 },
  editInput: { backgroundColor: '#F8F9FA', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#2D3436' },
  textArea: { height: 80, textAlignVertical: 'top', backgroundColor: '#F8F9FA', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#2D3436', marginBottom: 12 },
  editFooter: { flexDirection: 'row', padding: 14, gap: 12, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  datePickerModal: { backgroundColor: '#FFF', borderRadius: 12, width: '90%', maxHeight: '50%' },
  datePickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  datePickerCancel: { fontSize: 15, color: '#636E72' },
  datePickerTitle: { fontSize: 16, fontWeight: '600', color: '#2D3436' },
  datePickerDone: { fontSize: 15, color: '#6C63FF', fontWeight: '600' },
  uploadSection: { marginTop: 8 },
  uploadLabel: { fontSize: 13, color: '#95A5A6', marginBottom: 8 },
  uploadButtons: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  uploadBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#F0EEFF', borderRadius: 8, gap: 6 },
  uploadBtnText: { fontSize: 13, color: '#6C63FF' },
  photoList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  photoItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FA', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, gap: 6 },
  photoText: { fontSize: 12, color: '#636E72' },
  uploadRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  uploadLabel: { fontSize: 13, color: '#636E72', flex: 1 },
  multiLineContainer: { marginBottom: 12 },
  multiLineLabel: { fontSize: 13, color: '#95A5A6', marginBottom: 6 },
  multiLineInput: { backgroundColor: '#F8F9FA', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#2D3436', minHeight: 80 },
  contractSearchContainer: { marginBottom: 12 },
  contractLabel: { fontSize: 13, color: '#95A5A6', marginBottom: 6 },
  contractInput: { backgroundColor: '#F8F9FA', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10 },
  contractValue: { fontSize: 14, color: '#2D3436' },
  contractPlaceholder: { fontSize: 14, color: '#CCC' },
  contractDropdown: { backgroundColor: '#FFF', borderRadius: 8, borderWidth: 1, borderColor: '#E0E0E0', marginTop: 8, overflow: 'hidden' },
  contractSearchInput: { borderBottomWidth: 1, borderBottomColor: '#F0F0F0', paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#2D3436' },
  contractList: { maxHeight: 200 },
  contractItem: { paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  contractItemNo: { fontSize: 13, color: '#6C63FF', fontWeight: '500' },
  contractItemName: { fontSize: 12, color: '#636E72', marginTop: 2 },
  contractDisplayRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#F8F9FA', borderRadius: 8 },
  progressInputContainer: { marginBottom: 12 },
  progressInput: { backgroundColor: '#F8F9FA', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#2D3436', minHeight: 80, textAlignVertical: 'top' },
  progressSaveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#6C63FF', borderRadius: 8, paddingVertical: 10, marginTop: 10 },
  progressSaveBtnDisabled: { backgroundColor: '#CCC' },
  progressSaveBtnText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  progressHistory: { backgroundColor: '#F8F9FA', borderRadius: 10, padding: 12, marginTop: 8 },
  progressHistoryTitle: { fontSize: 13, fontWeight: '600', color: '#636E72', marginBottom: 10 },
  progressNoteItem: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#E8E8E8' },
  progressNoteHeader: { flexDirection: 'row', marginBottom: 6 },
  progressNoteDate: { fontSize: 12, color: '#9B59B6', fontWeight: '500' },
  progressNoteContent: { fontSize: 14, color: '#2D3436', lineHeight: 20 },
  checkButton: { padding: 8 },
  checkModal: { backgroundColor: '#FFF', borderRadius: 16, width: '90%', maxHeight: '70%' },
  checkModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  checkModalTitle: { fontSize: 17, fontWeight: '600', color: '#2D3436' },
  checkModalContent: { padding: 18 },
  checkResultTitle: { fontSize: 14, fontWeight: '600', color: '#636E72', marginBottom: 12 },
  checkEmptyIcon: { alignItems: 'center', paddingVertical: 20 },
  checkEmptyText: { fontSize: 15, color: '#636E72', marginTop: 12 },
  checkEmptySubtext: { fontSize: 13, color: '#95A5A6', marginTop: 6 },
  checkFieldList: { backgroundColor: '#FFF5F5', borderRadius: 12, padding: 14 },
  checkFieldItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#FFE5E5' },
  checkFieldNumber: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#E74C3C', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  checkFieldNumberText: { fontSize: 12, fontWeight: '600', color: '#FFF' },
  checkFieldLabel: { fontSize: 14, color: '#2D3436', flex: 1 },
  checkModalFooter: { flexDirection: 'row', padding: 14, gap: 12, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  checkCancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: '#F0F0F0', alignItems: 'center' },
  checkCancelBtnText: { fontSize: 14, fontWeight: '600', color: '#636E72' },
  checkConfirmBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: '#6C63FF', alignItems: 'center' },
  checkConfirmBtnText: { fontSize: 14, fontWeight: '600', color: '#FFF' },
});

export default WorkOrderDetailScreen;
