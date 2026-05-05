import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert } from 'react-native';
import { useSafeSearchParams } from '@/hooks/useSafeRouter';
import { PCLayout } from '@/components/pc/PCLayout';
import { PCCard } from '@/components/pc/PCComponents';
import { PCTag } from '@/components/pc/PCComponents';
import { PCModal } from '@/components/pc/PCComponents';
import { FontAwesome6 } from '@expo/vector-icons';

import { storage } from '@/utils/storage';
import { getApiBaseUrl } from '@/utils/api';
const API_BASE = getApiBaseUrl();

interface WorkOrder {
  id: number;
  work_order_number: string;
  title?: string;
  description?: string;
  customer_name: string;
  device_name?: string;
  type: string;
  priority: string;
  status: string;
  stage?: string;
  plan_hours?: number;
  is_charge?: boolean;
  quote?: number;
  handler?: string;
  creator?: string;
  created_at?: string;
  updated_at?: string;
  contact_name?: string;
  contact_phone?: string;
  address?: string;
  report?: string;
  solution?: string;
  completion_date?: string;
}

const PRIORITIES = {
  urgent: { label: '紧急', type: 'danger' as const },
  high: { label: '高', type: 'warning' as const },
  medium: { label: '中', type: 'default' as const },
  low: { label: '低', type: 'default' as const },
};

const STATUS_MAP = {
  pending: { label: '待处理', type: 'warning' as const },
  processing: { label: '处理中', type: 'primary' as const },
  completed: { label: '已完成', type: 'success' as const },
  closed: { label: '已关闭', type: 'default' as const },
};

const STAGE_MAP = {
  queued: '排队中',
  assigned: '已派单',
  arrived: '已到达',
  diagnosing: '诊断中',
  repairing: '维修中',
  testing: '测试中',
  completed: '已完成',
  closed: '已关闭',
};

const WORK_ORDER_TYPES = ['日常巡检', '设备维修', '设备保养', '设备安装', '设备调试', '技术支持', '培训', '咨询', '其它'];

export default function PCWorkOrderDetail() {
  const { id } = useSafeSearchParams<{ id: string }>();
  const orderId = id;

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<WorkOrder | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editField, setEditField] = useState('');
  const [editValue, setEditValue] = useState('');

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
        // 兼容处理：可能返回直接对象或包装在某个字段中
        const orderData = data.work_order || data.data || data;
        setOrder(orderData);
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

  const handleEdit = (field: string, currentValue: string) => {
    setEditField(field);
    setEditValue(currentValue || '');
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!order || !editField) return;

    try {
      const sessionId = await storage.getItem('session_id');
      const response = await fetch(`${API_BASE}/api/v1/work-orders/${order.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(sessionId ? { Authorization: `Bearer ${sessionId}` } : {}),
        },
        body: JSON.stringify({ [editField]: editValue }),
      });

      if (response.ok) {
        setOrder(prev => prev ? { ...prev, [editField]: editValue } : null);
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

  const handleStatusChange = async (newStatus: string) => {
    if (!order) return;

    try {
      const sessionId = await storage.getItem('session_id');
      const response = await fetch(`${API_BASE}/api/v1/work-orders/${order.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(sessionId ? { Authorization: `Bearer ${sessionId}` } : {}),
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setOrder(prev => prev ? { ...prev, status: newStatus } : null);
        Alert.alert('成功', '状态更新成功');
      } else {
        throw new Error('更新失败');
      }
    } catch (error) {
      console.error('更新失败:', error);
      Alert.alert('错误', '状态更新失败');
    }
  };

  if (loading) {
    return (
      <PCLayout>
        <View style={styles.loadingContainer}>
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
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => window.location.href = '/pc/work-orders'}
          >
            <Text style={styles.backButtonText}>返回工单列表</Text>
          </TouchableOpacity>
        </View>
      </PCLayout>
    );
  }

  const priority = PRIORITIES[order.priority as keyof typeof PRIORITIES] || { label: order.priority, type: 'default' as const };
  const status = STATUS_MAP[order.status as keyof typeof STATUS_MAP] || { label: order.status, type: 'default' as const };

  const InfoRow = ({ label, value, canEdit, field }: { label: string; value?: string; canEdit?: boolean; field?: string }) => (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <View style={styles.infoValueContainer}>
        <Text style={styles.infoValue}>{value || '-'}</Text>
        {canEdit && (
          <TouchableOpacity onPress={() => handleEdit(field || '', value || '')}>
            <FontAwesome6 name="pen" size={14} color="#1E88E5" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <PCLayout>
      {/* 页面头部 */}
      <View style={styles.pageHeader}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backLink}
            onPress={() => window.location.href = '/pc/work-orders'}
          >
            <FontAwesome6 name="arrow-left" size={16} color="#1E88E5" />
            <Text style={styles.backLinkText}>返回工单列表</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.headerMain}>
          <View style={styles.headerTitle}>
            <Text style={styles.title}>{order.title || order.work_order_number}</Text>
            <View style={styles.tags}>
              <PCTag type={priority.type}>{priority.label}</PCTag>
              <PCTag type={status.type}>{status.label}</PCTag>
              {order.stage && <PCTag type="default">{STAGE_MAP[order.stage as keyof typeof STAGE_MAP] || order.stage}</PCTag>}
            </View>
          </View>
          <Text style={styles.orderNo}>工单编号: {order.work_order_number}</Text>
        </View>
      </View>

      {/* 操作按钮 */}
      <View style={styles.actionBar}>
        <Text style={styles.actionLabel}>状态变更:</Text>
        {Object.entries(STATUS_MAP).map(([key, { label }]) => (
          <TouchableOpacity
            key={key}
            style={[
              styles.statusButton,
              order.status === key && styles.statusButtonActive,
            ]}
            onPress={() => handleStatusChange(key)}
          >
            <Text style={[
              styles.statusButtonText,
              order.status === key && styles.statusButtonTextActive,
            ]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.content}>
        {/* 基本信息 */}
        <PCCard title="基本信息" style={styles.card}>
          <View style={styles.infoGrid}>
            <InfoRow label="工单编号" value={order.work_order_number} />
            <InfoRow label="工单名称" value={order.title} canEdit field="title" />
            <InfoRow label="工单类型" value={order.type} />
            <InfoRow label="客户名称" value={order.customer_name} canEdit field="customer_name" />
            <InfoRow label="设备名称" value={order.device_name} canEdit field="device_name" />
            <InfoRow label="服务地址" value={order.address} canEdit field="address" />
            <InfoRow label="联系人" value={order.contact_name} canEdit field="contact_name" />
            <InfoRow label="联系电话" value={order.contact_phone} canEdit field="contact_phone" />
            <InfoRow label="处理人" value={order.handler} canEdit field="handler" />
            <InfoRow label="创建人" value={order.creator} />
            <InfoRow label="创建时间" value={order.created_at} />
            <InfoRow label="更新时间" value={order.updated_at} />
          </View>
        </PCCard>

        {/* 工单信息 */}
        <PCCard title="工单信息" style={styles.card}>
          <View style={styles.infoGrid}>
            <InfoRow label="优先级" value={priority.label} />
            <InfoRow label="当前状态" value={status.label} />
            <InfoRow label="当前阶段" value={order.stage ? STAGE_MAP[order.stage as keyof typeof STAGE_MAP] : '-'} />
            <InfoRow label="计划工时" value={order.plan_hours ? `${order.plan_hours}小时` : '-'} canEdit field="plan_hours" />
            <InfoRow label="是否收费" value={order.is_charge ? '是' : '否'} />
            <InfoRow label="报价" value={order.quote ? `¥${order.quote}` : '-'} canEdit field="quote" />
            <InfoRow label="完成时间" value={order.completion_date} canEdit field="completion_date" />
          </View>
        </PCCard>

        {/* 问题描述 */}
        <PCCard title="问题描述" style={styles.card}>
          <Text style={styles.descriptionText}>{order.description || '暂无描述'}</Text>
          <TouchableOpacity
            style={styles.editDescriptionButton}
            onPress={() => handleEdit('description', order.description || '')}
          >
            <FontAwesome6 name="pen" size={14} color="#1E88E5" />
            <Text style={styles.editDescriptionText}>编辑描述</Text>
          </TouchableOpacity>
        </PCCard>

        {/* 维修报告 */}
        <PCCard title="维修报告" style={styles.card}>
          <View style={styles.reportSection}>
            <Text style={styles.reportLabel}>故障分析</Text>
            <Text style={styles.reportContent}>{order.report || '暂无报告'}</Text>
          </View>
          <View style={styles.reportSection}>
            <Text style={styles.reportLabel}>解决方案</Text>
            <Text style={styles.reportContent}>{order.solution || '暂无方案'}</Text>
          </View>
          <TouchableOpacity
            style={styles.editDescriptionButton}
            onPress={() => handleEdit('report', order.report || '')}
          >
            <FontAwesome6 name="pen" size={14} color="#1E88E5" />
            <Text style={styles.editDescriptionText}>编辑报告</Text>
          </TouchableOpacity>
        </PCCard>
      </View>

      {/* 编辑弹窗 */}
      <PCModal
        visible={editModalVisible}
        title={`编辑${editField === 'title' ? '工单名称' : editField === 'description' ? '问题描述' : editField === 'report' ? '维修报告' : editField === 'solution' ? '解决方案' : '信息'}`}
        onClose={() => setEditModalVisible(false)}
        width={500}
        footer={
          <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'flex-end' }}>
            <TouchableOpacity className="pc-btn pc-btn-default" onPress={() => setEditModalVisible(false)}>
              <Text style={styles.btnDefaultText}>取消</Text>
            </TouchableOpacity>
            <TouchableOpacity className="pc-btn pc-btn-primary" onPress={handleSaveEdit}>
              <Text style={styles.btnPrimaryText}>保存</Text>
            </TouchableOpacity>
          </View>
        }
      >
        <TextInput
          style={[styles.editInput, (editField === 'description' || editField === 'report' || editField === 'solution') && styles.editTextarea]}
          value={editValue}
          onChangeText={setEditValue}
          placeholder={`请输入${editField}`}
          multiline={editField === 'description' || editField === 'report' || editField === 'solution'}
          numberOfLines={editField === 'description' || editField === 'report' || editField === 'solution' ? 5 : 1}
          textAlignVertical="top"
        />
      </PCModal>
    </PCLayout>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  loadingText: {
    fontSize: 16,
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
    backgroundColor: '#1E88E5',
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
  headerTop: {
    marginBottom: 12,
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backLinkText: {
    color: '#1E88E5',
    fontSize: 14,
  },
  headerMain: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 600,
    color: '#333',
  },
  tags: {
    flexDirection: 'row',
    gap: 8,
  },
  orderNo: {
    fontSize: 13,
    color: '#999',
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  actionLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: 500,
  },
  statusButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    backgroundColor: '#f0f0f0',
  },
  statusButtonActive: {
    backgroundColor: '#1E88E5',
  },
  statusButtonText: {
    fontSize: 13,
    color: '#666',
  },
  statusButtonTextActive: {
    color: '#fff',
  },
  content: {
    gap: 16,
  },
  card: {
    marginBottom: 0,
  },
  infoGrid: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    width: 100,
    fontSize: 13,
    color: '#999',
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
  descriptionText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
  },
  editDescriptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  editDescriptionText: {
    fontSize: 13,
    color: '#1E88E5',
  },
  reportSection: {
    marginBottom: 16,
  },
  reportLabel: {
    fontSize: 13,
    color: '#999',
    marginBottom: 8,
  },
  reportContent: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
  },
  editInput: {
    borderWidth: 1,
    borderColor: '#d9d9d9',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  editTextarea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  btnPrimaryText: {
    color: '#fff',
    fontSize: 13,
  },
  btnDefaultText: {
    color: '#333',
    fontSize: 13,
  },
});
