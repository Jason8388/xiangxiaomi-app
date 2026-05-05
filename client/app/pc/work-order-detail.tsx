import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert, Image, ActivityIndicator } from 'react-native';
import { useSafeSearchParams } from '@/hooks/useSafeRouter';
import { PCLayout } from '@/components/pc/PCLayout';
import { PCCard } from '@/components/pc/PCComponents';
import { PCTag } from '@/components/pc/PCComponents';
import { PCModal } from '@/components/pc/PCComponents';
import { FontAwesome6 } from '@expo/vector-icons';

import { storage } from '@/utils/storage';
import { getApiBaseUrl } from '@/utils/api';

const API_BASE = getApiBaseUrl();

// 完整的工单详情接口（与APP端一致）
interface WorkOrderDetail {
  id?: number;
  order_no?: string;
  task_no?: string;
  title?: string;
  description?: string;
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
  contacts?: Array<{ name: string; role: string; phone: string }>;
  demand_date?: string;
  requirement_date?: string;
  requirement_description?: string;
  requirement_photos?: string[];
  service_plan?: string;
  plan_hours?: number;
  planned_completion_date?: string;
  material_requirements?: string;
  warranty_status?: string;
  is_charged?: boolean;
  quoted_price?: number;
  service_docs?: string[];
  consensus_docs?: string[];
  consensus_date?: string;
  sales_sub_project_no?: string;
  material_code?: string;
  oa_work_order_no?: string;
  erp_outbound_no?: string;
  contract_id?: number;
  contract_no?: string;
  contract_name?: string;
  progress_notes?: Array<{ id: string; content: string; created_at: string }>;
  implementer?: string;
  implementation_complete_date?: string;
  actual_hours?: number;
  work_order_docs?: string[];
  site_completion_docs?: string[];
  work_order_signer?: string;
  invoice_application?: string;
  invoice_completed?: string;
  invoice_delivered?: string;
  planned_payment_date?: string;
  actual_payment_date?: string;
  payment_progress?: Array<{ id: string; progress: string; updated_at?: string }>;
  created_at?: string;
  updated_at?: string;
}

// 任务阶段选项
const TASK_PHASE_OPTIONS = ['需求阶段', '实施阶段', '回款阶段', '关单存档', '异常状态'];
// 任务进度选项
const TASK_PROGRESS_OPTIONS = [
  '10%收到服务需求', '20%确定方案与报价', '30%客户方案和报价共识',
  '40%完成实施准备', '50%完成实施', '60%完成客户确认', '70%完成对账',
  '80%完成开票和送达', '90%完成回款', '100%完成资料归档',
  '已关单', '挂起暂停', '终止'
];
// 任务状态选项
const TASK_STATUS_OPTIONS = ['计划中', '延期风险', '已延期', '关单完成', '挂起或暂停'];
// 质保期状态选项
const WARRANTY_STATUS_OPTIONS = ['质保期内', '质保期外'];
// 是否收费选项
const IS_CHARGED_OPTIONS = ['收费', '免费'];
// 开票选项
const INVOICE_OPTIONS = ['已申请', '未申请'];
const INVOICE_COMPLETED_OPTIONS = ['已开票', '待开票'];
const INVOICE_DELIVERED_OPTIONS = ['是', '否'];

export default function PCWorkOrderDetail() {
  const { id } = useSafeSearchParams<{ id: string }>();
  const orderId = id;

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<WorkOrderDetail | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectModalVisible, setSelectModalVisible] = useState(false);
  const [editingField, setEditingField] = useState('');
  const [selectTitle, setSelectTitle] = useState('');
  const [selectOptions, setSelectOptions] = useState<string[]>([]);
  const [editValue, setEditValue] = useState('');
  const [progressNoteText, setProgressNoteText] = useState('');

  // 计算日期差
  const calculateDaysDiff = (startDate: string, endDate: string): number => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
    const diffTime = end.getTime() - start.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getDemandPeriod = () => calculateDaysDiff(order?.demand_date || '', order?.consensus_date || '');
  const getServicePeriod = () => calculateDaysDiff(order?.consensus_date || '', order?.implementation_complete_date || '');
  const getPaymentPeriod = () => calculateDaysDiff(order?.implementation_complete_date || '', order?.actual_payment_date || '');

  const fetchOrderDetail = useCallback(async () => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const sessionId = await storage.getItem('session_id');
      const response = await fetch(`${API_BASE}/api/v1/work-orders/${orderId}`, {
        headers: sessionId ? { Authorization: `Bearer ${sessionId}` } : {},
      });
      const data = await response.json();

      if (response.ok) {
        setOrder(data);
      } else {
        throw new Error(data.error || '获取工单详情失败');
      }
    } catch (error) {
      console.error('获取工单详情失败:', error);
      Alert.alert('错误', '获取工单详情失败');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrderDetail();
  }, [fetchOrderDetail]);

  // 编辑字段
  const handleEdit = (field: string, currentValue: string) => {
    setEditingField(field);
    setEditValue(currentValue || '');

    if (field === 'task_phase') {
      setSelectOptions(TASK_PHASE_OPTIONS);
      setSelectTitle('选择任务阶段');
      setSelectModalVisible(true);
    } else if (field === 'task_progress') {
      setSelectOptions(TASK_PROGRESS_OPTIONS);
      setSelectTitle('选择任务进度');
      setSelectModalVisible(true);
    } else if (field === 'task_status') {
      setSelectOptions(TASK_STATUS_OPTIONS);
      setSelectTitle('选择任务状态');
      setSelectModalVisible(true);
    } else if (field === 'warranty_status') {
      setSelectOptions(WARRANTY_STATUS_OPTIONS);
      setSelectTitle('选择质保期状态');
      setSelectModalVisible(true);
    } else if (field === 'is_charged') {
      setSelectOptions(IS_CHARGED_OPTIONS);
      setSelectTitle('选择是否收费');
      setSelectModalVisible(true);
    } else if (field === 'invoice_application') {
      setSelectOptions(INVOICE_OPTIONS);
      setSelectTitle('选择是否申请开票');
      setSelectModalVisible(true);
    } else if (field === 'invoice_completed') {
      setSelectOptions(INVOICE_COMPLETED_OPTIONS);
      setSelectTitle('选择开票是否完成');
      setSelectModalVisible(true);
    } else if (field === 'invoice_delivered') {
      setSelectOptions(INVOICE_DELIVERED_OPTIONS);
      setSelectTitle('选择发票是否送达');
      setSelectModalVisible(true);
    } else {
      setEditModalVisible(true);
    }
  };

  // 保存编辑
  const handleSaveEdit = async () => {
    if (!order || !editingField) return;

    try {
      const sessionId = await storage.getItem('session_id');
      const response = await fetch(`${API_BASE}/api/v1/work-orders/${order.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(sessionId ? { Authorization: `Bearer ${sessionId}` } : {}),
        },
        body: JSON.stringify({ [editingField]: editValue }),
      });

      if (response.ok) {
        setOrder(prev => prev ? { ...prev, [editingField]: editValue } : null);
        setEditModalVisible(false);
        Alert.alert('成功', '修改成功');
      } else {
        throw new Error('修改失败');
      }
    } catch (error) {
      console.error('修改失败:', error);
      Alert.alert('错误', '修改失败');
    }
  };

  // 选择确认
  const handleSelectConfirm = async () => {
    if (!order || !editingField || !editValue) return;

    try {
      const sessionId = await storage.getItem('session_id');
      const response = await fetch(`${API_BASE}/api/v1/work-orders/${order.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(sessionId ? { Authorization: `Bearer ${sessionId}` } : {}),
        },
        body: JSON.stringify({ [editingField]: editValue }),
      });

      if (response.ok) {
        setOrder(prev => prev ? { ...prev, [editingField]: editValue } : null);
        Alert.alert('成功', '修改成功');
      }
      setSelectModalVisible(false);
    } catch (error) {
      Alert.alert('错误', '操作失败');
    }
  };

  // 添加进度记录
  const handleAddProgressNote = async () => {
    if (!order || !progressNoteText.trim()) return;

    try {
      const sessionId = await storage.getItem('session_id');
      const response = await fetch(`${API_BASE}/api/v1/work-orders/${order.id}/progress-notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(sessionId ? { Authorization: `Bearer ${sessionId}` } : {}),
        },
        body: JSON.stringify({ content: progressNoteText.trim() }),
      });

      if (response.ok) {
        const newNote = await response.json();
        setOrder(prev => prev ? {
          ...prev,
          progress_notes: [...(prev.progress_notes || []), newNote]
        } : null);
        setProgressNoteText('');
        Alert.alert('成功', '进度已添加');
      }
    } catch (error) {
      Alert.alert('错误', '添加失败');
    }
  };

  // 返回列表
  const handleBack = () => {
    window.location.href = '/pc/work-orders';
  };

  // 获取字段标签
  const getFieldLabel = (field: string) => {
    const labels: Record<string, string> = {
      'task_phase': '任务阶段',
      'task_progress': '任务进度',
      'task_status': '任务状态',
      'customer_name': '客户名称',
      'task_leader': '任务负责人',
      'implementation_entity': '实施主体',
      'service_plan': '服务方案说明',
      'plan_hours': '计划工时',
      'planned_completion_date': '计划完成日期',
      'material_requirements': '物料需求',
      'warranty_status': '质保期状态',
      'is_charged': '是否收费',
      'quoted_price': '收费金额',
      'consensus_date': '共识日期',
      'sales_sub_project_no': '销售子项目号',
      'oa_work_order_no': 'OA工单编号',
      'erp_outbound_no': 'ERP出库单号',
      'implementer': '实施人',
      'implementation_complete_date': '实施完成日期',
      'actual_hours': '实际工时',
      'work_order_signer': '派工单签字人',
      'invoice_application': '是否申请开票',
      'invoice_completed': '开票是否完成',
      'invoice_delivered': '发票是否送达',
      'planned_payment_date': '计划回款日期',
      'actual_payment_date': '实际回款日期',
    };
    return labels[field] || field;
  };

  // 格式化布尔值
  const formatBoolean = (val: any, trueText: string, falseText: string) => {
    if (val === true || val === 'true') return trueText;
    if (val === false || val === 'false') return falseText;
    return val || '-';
  };

  if (loading) {
    return (
      <PCLayout>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6C63FF" />
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      </PCLayout>
    );
  }

  if (!order) {
    return (
      <PCLayout>
        <View style={styles.errorContainer}>
          <FontAwesome6 name="exclamation-circle" size={48} color="#FF4D4F" />
          <Text style={styles.errorText}>工单不存在或已被删除</Text>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>返回工单列表</Text>
          </TouchableOpacity>
        </View>
      </PCLayout>
    );
  }

  // 渲染信息行
  const InfoRow = ({ label, value, editable, unit }: { label: string; value?: any; editable?: string; unit?: string }) => {
    const displayValue = value !== undefined && value !== null && value !== ''
      ? (typeof value === 'boolean' ? (value ? '是' : '否') : String(value))
      : '-';
    return (
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>{label}</Text>
        <View style={styles.infoValueContainer}>
          <Text style={styles.infoValue}>
            {displayValue}{unit && displayValue !== '-' ? unit : ''}
          </Text>
          {editable && (
            <TouchableOpacity onPress={() => handleEdit(editable, String(value || ''))} style={styles.editIcon}>
              <FontAwesome6 name="pen" size={12} color="#6C63FF" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <PCLayout>
      <ScrollView style={styles.container}>
        {/* 页面头部 */}
        <View style={styles.pageHeader}>
          <TouchableOpacity style={styles.backLink} onPress={handleBack}>
            <FontAwesome6 name="arrow-left" size={16} color="#6C63FF" />
            <Text style={styles.backLinkText}>返回工单列表</Text>
          </TouchableOpacity>
          <View style={styles.headerMain}>
            <View style={styles.headerTitle}>
              <Text style={styles.title}>{order.title || order.order_no || '工单详情'}</Text>
            </View>
            <Text style={styles.orderNo}>工单编号: {order.order_no || '-'}</Text>
          </View>
        </View>

        {/* 信息栏1：基本情况 */}
        <PCCard title="基本情况" icon="clipboard-list" iconColor="#6C63FF" style={styles.card}>
          <View style={styles.infoGrid}>
            <InfoRow label="工单名称" value={order.title} editable="title" />
            <InfoRow label="工单编号" value={order.order_no} />
            <InfoRow label="任务号" value={order.task_no} />
            <InfoRow label="客户名称" value={order.customer_name} />
            <InfoRow label="任务负责人" value={order.task_leader} editable="task_leader" />
            <InfoRow label="实施主体" value={order.implementation_entity} editable="implementation_entity" />
          </View>
        </PCCard>

        {/* 信息栏2：工单状态 */}
        <PCCard title="工单状态" icon="tasks" iconColor="#00B894" style={styles.card}>
          <View style={styles.infoGrid}>
            <InfoRow label="任务阶段" value={order.task_phase} editable="task_phase" />
            <InfoRow label="任务进度" value={order.task_progress} editable="task_progress" />
            <InfoRow label="任务状态" value={order.task_status} editable="task_status" />
            <InfoRow label="需求对接周期" value={order.demand_assessment_period || getDemandPeriod()} unit="天" />
            <InfoRow label="服务实施周期" value={order.service_implementation_period || getServicePeriod()} unit="天" />
            <InfoRow label="回款周期" value={order.payment_period || getPaymentPeriod()} unit="天" />
          </View>
        </PCCard>

        {/* 项目最新进度 */}
        <PCCard title="项目最新进度" icon="chart-line" iconColor="#9B59B6" style={styles.card}>
          <View style={styles.progressInputContainer}>
            <TextInput
              style={styles.progressInput}
              placeholder="输入项目最新进度说明..."
              value={progressNoteText}
              onChangeText={setProgressNoteText}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
            <TouchableOpacity
              style={[styles.progressSaveBtn, !progressNoteText.trim() && styles.progressSaveBtnDisabled]}
              onPress={handleAddProgressNote}
              disabled={!progressNoteText.trim()}
            >
              <Text style={styles.progressSaveBtnText}>保存</Text>
            </TouchableOpacity>
          </View>
          {order.progress_notes && order.progress_notes.length > 0 ? (
            <View style={styles.progressHistory}>
              {[...order.progress_notes].reverse().map((note, index) => (
                <View key={note.id || index} style={styles.progressNoteItem}>
                  <View style={styles.progressNoteHeader}>
                    <Text style={styles.progressNoteDate}>
                      {new Date(note.created_at).toLocaleString('zh-CN')}
                    </Text>
                  </View>
                  <Text style={styles.progressNoteContent}>{note.content}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>暂无进度记录</Text>
          )}
        </PCCard>

        {/* 信息栏3：客户信息 */}
        <PCCard title="客户信息" icon="user-tie" iconColor="#E74C3C" style={styles.card}>
          <View style={styles.infoGrid}>
            <InfoRow label="接到服务需求日期" value={order.demand_date} />
            {order.contacts && order.contacts.length > 0 ? (
              order.contacts.map((contact, index) => (
                <View key={index} style={styles.contactItem}>
                  <Text style={styles.contactText}>
                    联系人{index + 1}：{contact.name}
                    {contact.role ? ` | ${contact.role}` : ''}
                    {contact.phone ? ` | ${contact.phone}` : ''}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>暂无联系人</Text>
            )}
          </View>
        </PCCard>

        {/* 信息栏4：需求信息 */}
        <PCCard title="需求信息" icon="lightbulb" iconColor="#FDCB6E" style={styles.card}>
          <View style={styles.infoGrid}>
            <InfoRow label="接到需求日期" value={order.requirement_date} />
            <View style={styles.multiLineRow}>
              <Text style={styles.infoLabel}>需求说明</Text>
              <Text style={styles.multiLineValue}>{order.requirement_description || '-'}</Text>
            </View>
            {order.requirement_photos && order.requirement_photos.length > 0 && (
              <View style={styles.photosRow}>
                <Text style={styles.infoLabel}>需求照片/视频</Text>
                <View style={styles.photoList}>
                  {order.requirement_photos.map((photo, index) => (
                    <Image key={index} source={{ uri: photo }} style={styles.thumbnail} />
                  ))}
                </View>
              </View>
            )}
          </View>
        </PCCard>

        {/* 信息栏5：服务方案 */}
        <PCCard title="服务方案" icon="file-alt" iconColor="#3498DB" style={styles.card}>
          <View style={styles.infoGrid}>
            <InfoRow label="服务方案说明" value={order.service_plan} editable="service_plan" />
            <InfoRow label="计划工时" value={order.plan_hours} unit="天" editable="plan_hours" />
            <InfoRow label="计划完成日期" value={order.planned_completion_date} editable="planned_completion_date" />
            <InfoRow label="物料需求" value={order.material_requirements} editable="material_requirements" />
            <InfoRow label="质保期状态" value={order.warranty_status} editable="warranty_status" />
            <InfoRow label="是否收费" value={order.is_charged ? '收费' : '免费'} editable="is_charged" />
            <InfoRow label="收费金额" value={order.quoted_price} unit="元" editable="quoted_price" />
            <InfoRow label="服务方案客户共识日期" value={order.consensus_date} editable="consensus_date" />
            <InfoRow label="销售子项目号" value={order.sales_sub_project_no} editable="sales_sub_project_no" />
            {order.contract_no && (
              <InfoRow label="合同编号" value={order.contract_no} />
            )}
            {order.contract_name && (
              <InfoRow label="合同名称" value={order.contract_name} />
            )}
            <InfoRow label="物料编码" value={order.material_code} />
            <InfoRow label="OA系统工单编号" value={order.oa_work_order_no} editable="oa_work_order_no" />
            <InfoRow label="ERP出库申请单号" value={order.erp_outbound_no} editable="erp_outbound_no" />
          </View>
        </PCCard>

        {/* 信息栏6：实施情况 */}
        <PCCard title="实施情况" icon="hard-hat" iconColor="#F39C12" style={styles.card}>
          <View style={styles.infoGrid}>
            <InfoRow label="实施人" value={order.implementer} editable="implementer" />
            <InfoRow label="实施完成日期" value={order.implementation_complete_date} editable="implementation_complete_date" />
            <InfoRow label="实际工时投入" value={order.actual_hours} unit="天" editable="actual_hours" />
            <InfoRow label="派工单签字人" value={order.work_order_signer} editable="work_order_signer" />
            {order.work_order_docs && order.work_order_docs.length > 0 && (
              <View style={styles.photosRow}>
                <Text style={styles.infoLabel}>派工单照片</Text>
                <View style={styles.photoList}>
                  {order.work_order_docs.map((doc, index) => (
                    <Image key={index} source={{ uri: doc }} style={styles.thumbnail} />
                  ))}
                </View>
              </View>
            )}
            {order.site_completion_docs && order.site_completion_docs.length > 0 && (
              <View style={styles.photosRow}>
                <Text style={styles.infoLabel}>现场实施照片</Text>
                <View style={styles.photoList}>
                  {order.site_completion_docs.map((doc, index) => (
                    <Image key={index} source={{ uri: doc }} style={styles.thumbnail} />
                  ))}
                </View>
              </View>
            )}
          </View>
        </PCCard>

        {/* 信息栏7：回款情况 */}
        <PCCard title="回款情况" icon="money-bill" iconColor="#27AE60" style={styles.card}>
          <View style={styles.infoGrid}>
            <InfoRow label="是否申请开票" value={order.invoice_application} editable="invoice_application" />
            <InfoRow label="开票是否完成" value={order.invoice_completed} editable="invoice_completed" />
            <InfoRow label="发票是否送达客户" value={order.invoice_delivered} editable="invoice_delivered" />
            <InfoRow label="计划回款日期" value={order.planned_payment_date} editable="planned_payment_date" />
            <InfoRow label="实际回款日期" value={order.actual_payment_date} editable="actual_payment_date" />
          </View>
          {order.payment_progress && order.payment_progress.length > 0 && (
            <View style={styles.paymentProgress}>
              <Text style={styles.sectionSubTitle}>回款进度记录</Text>
              {order.payment_progress.map((item, index) => (
                <View key={item.id || index} style={styles.progressItem}>
                  <Text style={styles.progressText}>{item.progress}</Text>
                  <Text style={styles.progressDate}>{item.updated_at?.split('T')[0] || ''}</Text>
                </View>
              ))}
            </View>
          )}
        </PCCard>

        {/* 时间信息 */}
        <PCCard title="时间信息" icon="clock" iconColor="#95A5A6" style={styles.card}>
          <View style={styles.infoGrid}>
            <InfoRow label="创建时间" value={order.created_at} />
            <InfoRow label="更新时间" value={order.updated_at} />
          </View>
        </PCCard>
      </ScrollView>

      {/* 文本编辑弹窗 */}
      <PCModal
        visible={editModalVisible}
        title={`编辑${getFieldLabel(editingField)}`}
        onClose={() => setEditModalVisible(false)}
        width={500}
        footer={
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditModalVisible(false)}>
              <Text style={styles.cancelBtnText}>取消</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.submitBtn} onPress={handleSaveEdit}>
              <Text style={styles.submitBtnText}>保存</Text>
            </TouchableOpacity>
          </View>
        }
      >
        <TextInput
          style={styles.editInput}
          value={editValue}
          onChangeText={setEditValue}
          placeholder={`请输入${getFieldLabel(editingField)}`}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </PCModal>

      {/* 下拉选择弹窗 */}
      <PCModal
        visible={selectModalVisible}
        title={selectTitle}
        onClose={() => setSelectModalVisible(false)}
        width={400}
        footer={
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setSelectModalVisible(false)}>
              <Text style={styles.cancelBtnText}>取消</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.submitBtn} onPress={handleSelectConfirm}>
              <Text style={styles.submitBtnText}>确定</Text>
            </TouchableOpacity>
          </View>
        }
      >
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
      </PCModal>
    </PCLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F5F7FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
    gap: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
  },
  backButton: {
    backgroundColor: '#6C63FF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  pageHeader: {
    marginBottom: 16,
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  backLinkText: {
    color: '#6C63FF',
    fontSize: 14,
  },
  headerMain: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
  },
  headerTitle: {
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 600,
    color: '#333',
  },
  orderNo: {
    fontSize: 13,
    color: '#999',
  },
  card: {
    marginBottom: 16,
  },
  infoGrid: {
    gap: 0,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
  },
  infoLabel: {
    width: 140,
    fontSize: 13,
    color: '#666',
    flexShrink: 0,
  },
  infoValueContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  editIcon: {
    marginLeft: 8,
    padding: 4,
  },
  multiLineRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
  },
  multiLineValue: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
    marginTop: 4,
  },
  contactItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
  },
  contactText: {
    fontSize: 14,
    color: '#333',
  },
  emptyText: {
    fontSize: 13,
    color: '#999',
    paddingVertical: 12,
    textAlign: 'center',
  },
  photosRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
  },
  photoList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 6,
    backgroundColor: '#F0F2F5',
  },
  progressInputContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  progressInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  progressSaveBtn: {
    backgroundColor: '#6C63FF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  progressSaveBtnDisabled: {
    backgroundColor: '#CCC',
  },
  progressSaveBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 500,
  },
  progressHistory: {
    borderTopWidth: 1,
    borderTopColor: '#F0F2F5',
    paddingTop: 12,
  },
  progressNoteItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
  },
  progressNoteHeader: {
    marginBottom: 6,
  },
  progressNoteDate: {
    fontSize: 12,
    color: '#999',
  },
  progressNoteContent: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
  },
  sectionSubTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: '#333',
    marginBottom: 12,
  },
  paymentProgress: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F2F5',
  },
  progressItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
  },
  progressText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  progressDate: {
    fontSize: 12,
    color: '#999',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
  },
  cancelBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: '#F0F2F5',
  },
  cancelBtnText: {
    fontSize: 14,
    color: '#666',
  },
  submitBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: '#6C63FF',
  },
  submitBtnText: {
    fontSize: 14,
    color: '#fff',
  },
  editInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  selectList: {
    maxHeight: 300,
  },
  selectItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
  },
  selectItemActive: {
    backgroundColor: '#F5F3FF',
  },
  selectItemText: {
    fontSize: 14,
    color: '#333',
  },
  selectItemTextActive: {
    color: '#6C63FF',
    fontWeight: 500,
  },
});
