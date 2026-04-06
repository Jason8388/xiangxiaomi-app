import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { FontAwesome6 } from '@expo/vector-icons';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import * as ImagePicker from 'expo-image-picker';

interface ContactPerson {
  id: string;
  name: string;
  role: string;
  phone: string;
}

interface MediaItem {
  id: string;
  uri: string;
  type: 'photo' | 'video';
  name?: string;
}

interface WorkOrderDetail {
  id: number;
  name?: string;
  order_no: string;
  task_number?: string;
  customer_name?: string;
  assignee_name?: string;
  implement_subject?: string;
  work_order_type?: string;
  task_phase?: string;
  task_progress?: string;
  task_status?: string;
  demand_assessment_period?: number;
  service_implementation_period?: number;
  payment_period?: number;
  description?: string;
  created_at?: string;
  updated_at?: string;
  contacts?: ContactPerson[];
  // 需求信息
  demand_received_date?: string;
  demand_description?: string;
  problem_description?: string;
  device_media?: MediaItem[];
  device_number?: string;
  contract_name?: string;
  contract_no?: string;
}

export default function WorkOrderDetailScreen() {
  const [order, setOrder] = useState<WorkOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingField, setEditingField] = useState('');
  const [editValue, setEditValue] = useState('');
  const [selectModalVisible, setSelectModalVisible] = useState(false);
  const [selectOptions, setSelectOptions] = useState<string[]>([]);
  const [selectTitle, setSelectTitle] = useState('');
  const [contactModalVisible, setContactModalVisible] = useState(false);
  const [editingContact, setEditingContact] = useState<ContactPerson | null>(null);
  const [contactForm, setContactForm] = useState({ name: '', role: '', phone: '' });
  const [editingDemandField, setEditingDemandField] = useState('');
  const [demandEditValue, setDemandEditValue] = useState('');
  const [mediaPickerVisible, setMediaPickerVisible] = useState(false);

  const router = useSafeRouter();
  const { id } = useSafeSearchParams<{ id: string }>();

  // 工单类型选项
  const workOrderTypeOptions = ['收费工单', '免费工单', '待定工单'];

  // 任务阶段选项
  const taskPhaseOptions = ['需求阶段', '实施阶段', '回款阶段', '关单存档', '异常状态'];

  // 任务进度选项（根据工单类型变化）
  const getTaskProgressOptions = (type: string) => {
    switch (type) {
      case '收费工单':
        return [
          '10%收到服务需求',
          '20%确定方案与报价',
          '30%客户方案和报价共识',
          '40%完成实施准备',
          '50%完成实施',
          '60%完成客户确认',
          '70%完成对账',
          '80%完成开票和送达',
          '90%完成回款',
          '100%完成资料归档',
          '已关单',
          '挂起暂停',
          '终止',
        ];
      case '免费工单':
        return [
          '10%收到服务需求',
          '30%确定方案与计划',
          '50%完成实施准备',
          '70%完成实施',
          '90%完成客户确认',
          '100%完成资料归档',
          '已关单',
          '挂起暂停',
          '终止',
        ];
      case '待定工单':
        return [
          '10%收到服务需求',
          '20%确定方案与报价',
          '30%客户方案和报价共识',
          '已关单',
          '挂起暂停',
          '终止',
        ];
      default:
        return [];
    }
  };

  // 任务状态选项
  const taskStatusOptions = ['计划中', '延期风险', '已延期', '关单完成', '挂起或暂停'];

  useEffect(() => {
    fetchOrderDetail();
  }, [id]);

  const fetchOrderDetail = async () => {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/work-orders/${id}`);
      const data = await response.json();

      // 转换数据结构以匹配新的字段
      const transformedData: WorkOrderDetail = {
        id: data.id,
        name: data.description || '', // 工单名称使用description
        order_no: data.order_no,
        task_number: data.order_no, // 任务号默认使用order_no
        customer_name: data.customer_name || '',
        assignee_name: data.assignee_name || '',
        implement_subject: '', // 新增字段，默认为空
        work_order_type: data.is_charged ? '收费工单' : '免费工单', // 根据is_charged判断
        task_phase: '需求阶段', // 默认值
        task_progress: '', // 根据work_order_type动态设置
        task_status: data.status === 'pending' ? '计划中' : data.status === 'processing' ? '计划中' : data.status === 'completed' ? '关单完成' : '计划中',
        demand_assessment_period: 0,
        service_implementation_period: 0,
        payment_period: 0,
        description: data.description || '',
        created_at: data.created_at,
        updated_at: data.updated_at,
      };

      setOrder(transformedData);
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

    // 下拉选择类型的字段
    if (field === 'work_order_type') {
      setSelectOptions(workOrderTypeOptions);
      setSelectTitle('选择工单类型');
      setSelectModalVisible(true);
    } else if (field === 'task_phase') {
      setSelectOptions(taskPhaseOptions);
      setSelectTitle('选择任务阶段');
      setSelectModalVisible(true);
    } else if (field === 'task_progress') {
      const type = order?.work_order_type || '免费工单';
      setSelectOptions(getTaskProgressOptions(type));
      setSelectTitle('选择任务进度');
      setSelectModalVisible(true);
    } else if (field === 'task_status') {
      setSelectOptions(taskStatusOptions);
      setSelectTitle('选择任务状态');
      setSelectModalVisible(true);
    } else {
      // 文本输入类型
      setEditModalVisible(true);
    }
  };

  const handleSave = async () => {
    if (!order) return;

    try {
      const updates: any = {};
      updates[editingField] = editValue;

      // 特殊字段处理
      if (editingField === 'name') {
        updates.description = editValue;
      }

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
        setEditModalVisible(false);
        setSelectModalVisible(false);
        Alert.alert('成功', '修改成功');
      } else {
        throw new Error('修改失败');
      }
    } catch (error: any) {
      Alert.alert('错误', error.message);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleAddContact = () => {
    setEditingContact(null);
    setContactForm({ name: '', role: '', phone: '' });
    setContactModalVisible(true);
  };

  const handleEditContact = (contact: ContactPerson) => {
    setEditingContact(contact);
    setContactForm({ name: contact.name, role: contact.role, phone: contact.phone });
    setContactModalVisible(true);
  };

  const handleDeleteContact = (contactId: string) => {
    Alert.alert('确认删除', '确定要删除该联系人吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          if (!order) return;
          const newContacts = (order.contacts || []).filter(c => c.id !== contactId);
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
              Alert.alert('成功', '删除成功');
            } else {
              throw new Error('删除失败');
            }
          } catch (error: any) {
            Alert.alert('错误', error.message);
          }
        },
      },
    ]);
  };

  const handleSaveContact = async () => {
    if (!order) return;
    if (!contactForm.name) {
      Alert.alert('提示', '请输入联系人姓名');
      return;
    }
    if (!contactForm.phone) {
      Alert.alert('提示', '请输入联系电话');
      return;
    }

    try {
      let newContacts: ContactPerson[];
      if (editingContact) {
        newContacts = (order.contacts || []).map(c =>
          c.id === editingContact.id ? { ...c, ...contactForm } : c
        );
      } else {
        const newContact: ContactPerson = {
          id: Date.now().toString(),
          ...contactForm,
        };
        newContacts = [...(order.contacts || []), newContact];
      }

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
        Alert.alert('成功', editingContact ? '修改成功' : '添加成功');
      } else {
        throw new Error('保存失败');
      }
    } catch (error: any) {
      Alert.alert('错误', error.message);
    }
  };

  // 处理需求信息编辑
  const handleDemandEdit = (field: string, value: string) => {
    setEditingDemandField(field);
    setDemandEditValue(value);
    setEditModalVisible(true);
  };

  const handleSaveDemandField = async () => {
    if (!order) return;

    try {
      const updates: any = {};
      updates[editingDemandField] = demandEditValue;

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/work-orders/${order.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        }
      );

      if (response.ok) {
        setOrder({ ...order, [editingDemandField]: demandEditValue });
        setEditModalVisible(false);
        Alert.alert('成功', '修改成功');
      } else {
        throw new Error('修改失败');
      }
    } catch (error: any) {
      Alert.alert('错误', error.message);
    }
  };

  // 上传设备照片/视频
  const pickMedia = async (type: 'photo' | 'video') => {
    try {
      if (type === 'photo') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('提示', '需要相册权限才能上传照片');
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: type === 'photo' 
          ? ImagePicker.MediaTypeOptions.Images 
          : ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const newMedia: MediaItem = {
          id: Date.now().toString(),
          uri: asset.uri,
          type: type,
          name: asset.fileName || `media_${Date.now()}`,
        };

        const updatedMedia = [...(order?.device_media || []), newMedia];
        
        // 上传到服务器
        const formData = new FormData();
        formData.append('device_media', JSON.stringify(updatedMedia));

        const response = await fetch(
          `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/work-orders/${order?.id}`,
          {
            method: 'PUT',
            body: formData,
          }
        );

        if (response.ok) {
          setOrder({ ...order!, device_media: updatedMedia });
          Alert.alert('成功', '上传成功');
        }
      }
    } catch (error: any) {
      Alert.alert('错误', error.message);
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('提示', '需要相机权限才能拍照');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const newMedia: MediaItem = {
          id: Date.now().toString(),
          uri: asset.uri,
          type: 'photo',
          name: `photo_${Date.now()}.jpg`,
        };

        const updatedMedia = [...(order?.device_media || []), newMedia];
        
        const formData = new FormData();
        formData.append('device_media', JSON.stringify(updatedMedia));

        const response = await fetch(
          `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/work-orders/${order?.id}`,
          {
            method: 'PUT',
            body: formData,
          }
        );

        if (response.ok) {
          setOrder({ ...order!, device_media: updatedMedia });
          Alert.alert('成功', '拍照上传成功');
        }
      }
    } catch (error: any) {
      Alert.alert('错误', error.message);
    }
  };

  const deleteMedia = async (mediaId: string) => {
    Alert.alert('确认删除', '确定要删除此媒体文件吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          if (!order) return;
          const updatedMedia = (order.device_media || []).filter(m => m.id !== mediaId);
          
          const formData = new FormData();
          formData.append('device_media', JSON.stringify(updatedMedia));

          try {
            const response = await fetch(
              `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/work-orders/${order.id}`,
              {
                method: 'PUT',
                body: formData,
              }
            );

            if (response.ok) {
              setOrder({ ...order, device_media: updatedMedia });
              Alert.alert('成功', '删除成功');
            }
          } catch (error: any) {
            Alert.alert('错误', error.message);
          }
        },
      },
    ]);
  };

  const renderInfoRow = (label: string, value: string | number, field?: string, isEditable = false) => (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <TouchableOpacity
        style={styles.infoValueContainer}
        onPress={() => isEditable && field && handleEdit(field, String(value))}
        disabled={!isEditable}
      >
        <Text style={[styles.infoValue, !value && styles.infoValuePlaceholder]}>
          {value || '-'}
        </Text>
        {isEditable && field && (
          <FontAwesome6 name="chevron-right" size={14} color="#B2BEC3" />
        )}
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <Screen>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 14, color: '#636E72' }}>加载中...</Text>
        </View>
      </Screen>
    );
  }

  if (!order) {
    return (
      <Screen>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 14, color: '#636E72' }}>工单不存在</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      {/* 顶部导航 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <FontAwesome6 name="arrow-left" size={20} color="#2D3436" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>工单详情</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      >
        {/* 栏1：基本情况 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FontAwesome6 name="circle-info" size={20} color="#6C63FF" style={{ marginRight: 8 }} />
            <Text style={styles.sectionTitle}>基本情况</Text>
          </View>
          <View style={styles.sectionContent}>
            {renderInfoRow('工单名称', order.name || '', 'name', true)}
            {renderInfoRow('工单编号', order.order_no)}
            {renderInfoRow('任务号', order.task_number || '', 'task_number', true)}
            {renderInfoRow('客户名称', order.customer_name || '')}
            {renderInfoRow('任务负责人', order.assignee_name || '')}
            {renderInfoRow('实施主体', order.implement_subject || '', 'implement_subject', true)}
          </View>
        </View>

        {/* 栏2：工单状态 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FontAwesome6 name="clipboard-list" size={20} color="#00B894" style={{ marginRight: 8 }} />
            <Text style={styles.sectionTitle}>工单状态</Text>
          </View>
          <View style={styles.sectionContent}>
            {renderInfoRow('工单类型', order.work_order_type || '', 'work_order_type', true)}
            {renderInfoRow('任务阶段', order.task_phase || '', 'task_phase', true)}
            {renderInfoRow(
              '任务进度',
              order.task_progress || '',
              'task_progress',
              !!order.work_order_type
            )}
            {renderInfoRow('任务状态', order.task_status || '', 'task_status', true)}
            {renderInfoRow(
              '需求评估周期',
              order.demand_assessment_period ? `${order.demand_assessment_period} 天` : '',
              'demand_assessment_period',
              true
            )}
            {renderInfoRow(
              '服务实施周期',
              order.service_implementation_period ? `${order.service_implementation_period} 天` : '',
              'service_implementation_period',
              true
            )}
            {renderInfoRow(
              '回款周期',
              order.payment_period ? `${order.payment_period} 天` : '',
              'payment_period',
              true
            )}
          </View>
        </View>

        {/* 栏3：客户联系信息 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FontAwesome6 name="address-book" size={20} color="#E74C3C" style={{ marginRight: 8 }} />
            <Text style={styles.sectionTitle}>客户联系信息</Text>
            <TouchableOpacity
              onPress={handleAddContact}
              style={styles.addButton}
            >
              <FontAwesome6 name="plus" size={14} color="#6C63FF" />
              <Text style={styles.addButtonText}>添加联系人</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.sectionContent}>
            {order.contacts && order.contacts.length > 0 ? (
              order.contacts.map((contact) => (
                <View key={contact.id} style={styles.contactCard}>
                  <View style={styles.contactInfo}>
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
                  </View>
                  <View style={styles.contactActions}>
                    <TouchableOpacity
                      onPress={() => handleEditContact(contact)}
                      style={styles.contactActionButton}
                    >
                      <FontAwesome6 name="edit" size={14} color="#F39C12" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteContact(contact.id)}
                      style={styles.contactActionButton}
                    >
                      <FontAwesome6 name="trash" size={14} color="#E74C3C" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyContacts}>
                <FontAwesome6 name="user-slash" size={32} color="#B2BEC3" />
                <Text style={styles.emptyContactsText}>暂无联系人</Text>
                <TouchableOpacity onPress={handleAddContact} style={styles.addContactHint}>
                  <Text style={styles.addContactHintText}>点击添加联系人</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* 栏4：需求信息 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FontAwesome6 name="list-check" size={20} color="#0984E3" style={{ marginRight: 8 }} />
            <Text style={styles.sectionTitle}>需求信息</Text>
          </View>
          <View style={styles.sectionContent}>
            {renderInfoRow('需求收到日期', order.demand_received_date || '', 'demand_received_date', true)}
            {renderInfoRow('需求描述', order.demand_description || '', 'demand_description', true)}
            {renderInfoRow('问题说明', order.problem_description || '', 'problem_description', true)}

            {/* 设备编号 */}
            {renderInfoRow('设备编号', order.device_number || '', 'device_number', true)}

            {/* 合同名称 */}
            {renderInfoRow('合同名称', order.contract_name || '', 'contract_name', true)}

            {/* 合同编号 */}
            {renderInfoRow('合同编号', order.contract_no || '', 'contract_no', true)}

            {/* 设备照片/视频 */}
            <View style={styles.mediaSection}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>设备照片/视频</Text>
              </View>
              <View style={styles.mediaGrid}>
                {/* 已有媒体 */}
                {order.device_media && order.device_media.length > 0 && (
                  order.device_media.map((media) => (
                    <View key={media.id} style={styles.mediaItem}>
                      <View style={styles.mediaThumbnail}>
                        {media.type === 'photo' ? (
                          <FontAwesome6 name="image" size={24} color="#636E72" />
                        ) : (
                          <FontAwesome6 name="video" size={24} color="#636E72" />
                        )}
                      </View>
                      <TouchableOpacity
                        style={styles.mediaDeleteButton}
                        onPress={() => deleteMedia(media.id)}
                      >
                        <FontAwesome6 name="times" size={10} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  ))
                )}
                {/* 添加按钮 */}
                <TouchableOpacity
                  style={styles.mediaAddButton}
                  onPress={() => setMediaPickerVisible(true)}
                >
                  <FontAwesome6 name="plus" size={24} color="#6C63FF" />
                  <Text style={styles.mediaAddText}>添加</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* 工单描述 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FontAwesome6 name="align-left" size={20} color="#F39C12" style={{ marginRight: 8 }} />
            <Text style={styles.sectionTitle}>工单描述</Text>
          </View>
          <View style={styles.sectionContent}>
            <Text style={styles.descriptionText}>{order.description || '暂无描述'}</Text>
          </View>
        </View>

        {/* 创建和更新时间 */}
        <View style={styles.section}>
          <View style={styles.sectionContent}>
            {renderInfoRow('创建时间', formatDate(order.created_at || ''))}
            {renderInfoRow('更新时间', formatDate(order.updated_at || ''))}
          </View>
        </View>
      </ScrollView>

      {/* 文本编辑 Modal */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                  <Text style={styles.modalCancelButton}>取消</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>编辑信息</Text>
                <TouchableOpacity
                  onPress={() => {
                    if (editingDemandField) {
                      handleSaveDemandField();
                    } else {
                      handleSave();
                    }
                  }}
                >
                  <Text style={styles.modalSaveButton}>保存</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.modalBody}>
                <TextInput
                  style={[
                    styles.modalInput,
                    (editingDemandField === 'demand_description' || editingDemandField === 'problem_description') && styles.modalTextArea,
                  ]}
                  value={editingDemandField ? demandEditValue : editValue}
                  onChangeText={(text) => {
                    if (editingDemandField) {
                      setDemandEditValue(text);
                    } else {
                      setEditValue(text);
                    }
                  }}
                  placeholder="请输入内容"
                  autoFocus
                  multiline={editingDemandField === 'demand_description' || editingDemandField === 'problem_description' || editingField === 'implement_subject'}
                  numberOfLines={
                    editingDemandField === 'demand_description' || editingDemandField === 'problem_description' ? 4 : 
                    editingField === 'implement_subject' ? 3 : 1
                  }
                />
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* 下拉选择 Modal */}
      <Modal
        visible={selectModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.selectModalContainer}
          activeOpacity={1}
          onPress={() => setSelectModalVisible(false)}
        >
          <View style={styles.selectModalContent}>
            <View style={styles.selectModalHeader}>
              <Text style={styles.selectModalTitle}>{selectTitle}</Text>
              <TouchableOpacity onPress={() => setSelectModalVisible(false)}>
                <FontAwesome6 name="xmark" size={24} color="#2D3436" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.selectModalBody}>
              {selectOptions.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.selectModalItem,
                    editValue === option && styles.selectModalItemSelected,
                  ]}
                  onPress={() => {
                    setEditValue(option);
                    handleSave();
                  }}
                >
                  <Text
                    style={[
                      styles.selectModalItemText,
                      editValue === option && styles.selectModalItemTextSelected,
                    ]}
                  >
                    {option}
                  </Text>
                  {editValue === option && (
                    <FontAwesome6 name="check" size={16} color="#6C63FF" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 联系人编辑 Modal */}
      <Modal
        visible={contactModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setContactModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setContactModalVisible(false)}>
                  <Text style={styles.modalCancelButton}>取消</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>
                  {editingContact ? '编辑联系人' : '添加联系人'}
                </Text>
                <TouchableOpacity onPress={handleSaveContact}>
                  <Text style={styles.modalSaveButton}>保存</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalBody}>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>联系人姓名 *</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={contactForm.name}
                    onChangeText={(text) => setContactForm({ ...contactForm, name: text })}
                    placeholder="请输入联系人姓名"
                    autoFocus
                  />
                </View>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>角色/职务</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={contactForm.role}
                    onChangeText={(text) => setContactForm({ ...contactForm, role: text })}
                    placeholder="请输入角色或职务"
                  />
                </View>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>联系电话 *</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={contactForm.phone}
                    onChangeText={(text) => setContactForm({ ...contactForm, phone: text })}
                    placeholder="请输入联系电话"
                    keyboardType="phone-pad"
                  />
                </View>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* 媒体选择 Modal */}
      <Modal
        visible={mediaPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setMediaPickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.selectModalContainer}
          activeOpacity={1}
          onPress={() => setMediaPickerVisible(false)}
        >
          <View style={styles.selectModalContent}>
            <View style={styles.selectModalHeader}>
              <Text style={styles.selectModalTitle}>添加设备照片/视频</Text>
              <TouchableOpacity onPress={() => setMediaPickerVisible(false)}>
                <FontAwesome6 name="xmark" size={24} color="#2D3436" />
              </TouchableOpacity>
            </View>
            <View style={styles.mediaPickerBody}>
              <TouchableOpacity
                style={styles.mediaPickerItem}
                onPress={() => {
                  setMediaPickerVisible(false);
                  takePhoto();
                }}
              >
                <FontAwesome6 name="camera" size={32} color="#6C63FF" />
                <Text style={styles.mediaPickerText}>拍照</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.mediaPickerItem}
                onPress={() => {
                  setMediaPickerVisible(false);
                  pickMedia('photo');
                }}
              >
                <FontAwesome6 name="image" size={32} color="#00B894" />
                <Text style={styles.mediaPickerText}>从相册选择照片</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.mediaPickerItem}
                onPress={() => {
                  setMediaPickerVisible(false);
                  pickMedia('video');
                }}
              >
                <FontAwesome6 name="video" size={32} color="#E74C3C" />
                <Text style={styles.mediaPickerText}>从相册选择视频</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </Screen>
  );
}

const styles = {
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#2D3436',
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#2D3436',
  },
  sectionContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  infoRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#636E72',
    width: 100,
  },
  infoValueContainer: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'flex-end' as const,
    gap: 8,
  },
  infoValue: {
    fontSize: 14,
    color: '#2D3436',
    textAlign: 'right' as const,
  },
  infoValuePlaceholder: {
    color: '#B2BEC3',
  },
  descriptionText: {
    fontSize: 14,
    color: '#2D3436',
    lineHeight: 22,
  },
  mediaSection: {
    marginTop: 8,
  },
  mediaGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 12,
  },
  mediaItem: {
    position: 'relative' as const,
    width: 70,
    height: 70,
  },
  mediaThumbnail: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: '#F0F0F3',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  mediaDeleteButton: {
    position: 'absolute' as const,
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E74C3C',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  mediaAddButton: {
    width: 70,
    height: 70,
    borderRadius: 8,
    borderWidth: 2,
    borderStyle: 'dashed' as const,
    borderColor: '#6C63FF',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  mediaAddText: {
    fontSize: 10,
    color: '#6C63FF',
    marginTop: 2,
  },
  mediaPickerBody: {
    flexDirection: 'row' as const,
    justifyContent: 'space-around' as const,
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  mediaPickerItem: {
    alignItems: 'center' as const,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    minWidth: 100,
  },
  mediaPickerText: {
    fontSize: 12,
    color: '#2D3436',
    marginTop: 8,
    textAlign: 'center' as const,
  },
  modalTextArea: {
    minHeight: 100,
    textAlignVertical: 'top' as const,
  },
  addButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginLeft: 'auto',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
  },
  addButtonText: {
    fontSize: 12,
    color: '#6C63FF',
    fontWeight: '500' as const,
    marginLeft: 4,
  },
  contactCard: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    marginBottom: 8,
  },
  contactInfo: {
    flex: 1,
  },
  contactRow: {
    flexDirection: 'row' as const,
    marginBottom: 4,
  },
  contactLabel: {
    fontSize: 12,
    color: '#636E72',
    width: 80,
  },
  contactValue: {
    fontSize: 12,
    color: '#2D3436',
    flex: 1,
  },
  contactActions: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  contactActionButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  emptyContacts: {
    alignItems: 'center' as const,
    paddingVertical: 24,
  },
  emptyContactsText: {
    fontSize: 14,
    color: '#B2BEC3',
    marginTop: 8,
  },
  addContactHint: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
  },
  addContactHintText: {
    fontSize: 12,
    color: '#6C63FF',
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    color: '#636E72',
    marginBottom: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end' as const,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: '#2D3436',
  },
  modalCancelButton: {
    fontSize: 14,
    color: '#636E72',
  },
  modalSaveButton: {
    fontSize: 14,
    color: '#6C63FF',
    fontWeight: '600' as const,
  },
  modalBody: {
    padding: 20,
  },
  modalInput: {
    fontSize: 16,
    color: '#2D3436',
    backgroundColor: '#F5F6FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    textAlignVertical: 'top' as const,
  },
  selectModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: 20,
  },
  selectModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxHeight: '60%',
  },
  selectModalHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  selectModalTitle: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: '#2D3436',
  },
  selectModalBody: {
    maxHeight: 400,
  },
  selectModalItem: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F6FA',
  },
  selectModalItemSelected: {
    backgroundColor: 'rgba(108, 99, 255, 0.05)',
  },
  selectModalItemText: {
    fontSize: 14,
    color: '#2D3436',
  },
  selectModalItemTextSelected: {
    color: '#6C63FF',
    fontWeight: '600' as const,
  },
} as const;
