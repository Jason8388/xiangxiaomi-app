import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ScrollView, Alert } from 'react-native';
import { PCLayout } from '@/components/pc/PCLayout';
import { PCTable } from '@/components/pc/PCComponents';
import { PCTag } from '@/components/pc/PCComponents';
import { PCCard } from '@/components/pc/PCComponents';
import { PCToolbar } from '@/components/pc/PCComponents';
import { PCSearchBar } from '@/components/pc/PCComponents';
import { PCModal } from '@/components/pc/PCComponents';
import { PCPagination } from '@/components/pc/PCComponents';
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
}

const WORK_ORDER_TYPES = ['日常巡检', '设备维修', '设备保养', '设备安装', '设备调试', '技术支持', '培训', '咨询', '其它'];
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
  const [formData, setFormData] = useState({
    work_order_number: '',
    title: '',
    description: '',
    customer_name: '',
    device_name: '',
    type: '',
    priority: 'medium',
    status: 'pending',
    stage: 'queued',
    plan_hours: '',
    is_charge: false,
    quote: '',
    handler: '',
    creator: 'admin',
  });
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  const fetchWorkOrders = useCallback(async () => {
    setLoading(true);
    try {
      const sessionId = await storage.getItem('session_id');
      const response = await fetch(`${API_BASE}/api/v1/work-orders`, {
        headers: sessionId ? { Authorization: `Bearer ${sessionId}` } : {},
      });
      const data = await response.json();
      // 与APP端保持一致的数据解析逻辑
      const list: WorkOrder[] = Array.isArray(data) ? data : (data.data || data.work_orders || []);
      const sorted = list.sort((a: WorkOrder, b: WorkOrder) =>
        new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      );
      setWorkOrders(sorted);
      setPagination(prev => ({ ...prev, total: sorted.length }));
    } catch (error) {
      console.error('获取工单列表失败:', error);
      Alert.alert('错误', '获取工单列表失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkOrders();
  }, [fetchWorkOrders]);

  const filteredOrders = workOrders.filter(o => {
    const matchSearch = !searchText ||
      (o.work_order_number?.includes(searchText) || false) ||
      (o.title?.includes(searchText) || false) ||
      (o.customer_name?.includes(searchText) || false) ||
      (o.handler?.includes(searchText) || false);
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
            setPagination(prev => ({ ...prev, total: prev.total - 1 }));
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
          ...formData,
          plan_hours: Number(formData.plan_hours) || 0,
          quote: Number(formData.quote) || 0,
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
      work_order_number: `WO-${Date.now()}`,
      title: '',
      description: '',
      customer_name: '',
      device_name: '',
      type: '',
      priority: 'medium',
      status: 'pending',
      stage: 'queued',
      plan_hours: '',
      is_charge: false,
      quote: '',
      handler: '',
      creator: 'admin',
    });
    setModalVisible(true);
  };

  const handleEdit = (record: WorkOrder) => {
    setEditingOrder(record);
    setFormData({
      work_order_number: record.work_order_number,
      title: record.title || '',
      description: record.description || '',
      customer_name: record.customer_name,
      device_name: record.device_name || '',
      type: record.type,
      priority: record.priority,
      status: record.status,
      stage: record.stage || 'queued',
      plan_hours: String(record.plan_hours || ''),
      is_charge: record.is_charge || false,
      quote: String(record.quote || ''),
      handler: record.handler || '',
      creator: record.creator || '',
    });
    setModalVisible(true);
  };

  const columns = [
    { key: 'order_no', title: '工单编号', width: 120 },
    { key: 'title', title: '工单名称', width: 150 },
    { key: 'customer_name', title: '客户名称', width: 150 },
    { key: 'device_name', title: '设备名称', width: 120 },
    { key: 'type', title: '工单类型', width: 100 },
    {
      key: 'priority',
      title: '优先级',
      width: 70,
      render: (val: string) => {
        const p = PRIORITIES[val as keyof typeof PRIORITIES] || { label: val, type: 'default' as const };
        return <PCTag type={p.type}>{p.label}</PCTag>;
      },
    },
    {
      key: 'status',
      title: '状态',
      width: 80,
      render: (val: string) => {
        const s = STATUS_MAP[val as keyof typeof STATUS_MAP] || { label: val, type: 'default' as const };
        return <PCTag type={s.type}>{s.label}</PCTag>;
      },
    },
    {
      key: 'stage',
      title: '阶段',
      width: 80,
      render: (val: string) => (STAGE_MAP[val as keyof typeof STAGE_MAP] || val || '-'),
    },
    { key: 'handler', title: '处理人', width: 80 },
    { key: 'plan_hours', title: '计划工时', width: 80, render: (val: number) => (val ? `${val}h` : '-') },
    {
      key: 'is_charge',
      title: '是否收费',
      width: 80,
      render: (val: boolean) => (val ? <PCTag type="warning">是</PCTag> : <PCTag type="default">否</PCTag>),
    },
    { key: 'quote', title: '报价', width: 80, render: (val: number) => (val ? `¥${val}` : '-') },
    { key: 'created_at', title: '创建时间', width: 150 },
    {
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
    },
  ];

  return (
    <PCLayout>
      <View className="pc-page-header">
        <Text className="pc-page-title">工单管理</Text>
        <Text className="pc-page-description">管理所有工单信息，包括客户、设备、类型、优先级、阶段、计划工时、是否收费、报价等完整信息</Text>
      </View>

      <PCCard>
        <PCToolbar
          left={
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <PCSearchBar
                placeholder="搜索工单编号、名称、客户或处理人..."
                value={searchText}
                onChange={setSearchText}
                onSearch={() => {}}
              />
              <View style={{ flexDirection: 'row', gap: 8, marginLeft: 16 }}>
                <TouchableOpacity
                  style={[styles.filterSelect, !typeFilter && styles.filterSelectActive]}
                  onPress={() => setTypeFilter('')}
                >
                  <Text style={[styles.filterSelectText, !typeFilter && styles.filterSelectTextActive]}>
                    {typeFilter || '全部类型'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterSelect, !priorityFilter && styles.filterSelectActive]}
                  onPress={() => setPriorityFilter('')}
                >
                  <Text style={[styles.filterSelectText, !priorityFilter && styles.filterSelectTextActive]}>
                    {priorityFilter ? PRIORITIES[priorityFilter as keyof typeof PRIORITIES]?.label : '全部优先级'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterSelect, !statusFilter && styles.filterSelectActive]}
                  onPress={() => setStatusFilter('')}
                >
                  <Text style={[styles.filterSelectText, !statusFilter && styles.filterSelectTextActive]}>
                    {statusFilter ? STATUS_MAP[statusFilter as keyof typeof STATUS_MAP]?.label : '全部状态'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          }
          right={
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <TouchableOpacity
                style={{ backgroundColor: '#f0f0f0', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 }}
                onPress={() => setImportModalVisible(true)}
              >
                <Text style={styles.btnDefaultText}>批量导入</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ backgroundColor: '#E8F5E9', borderWidth: 1, borderColor: '#1E88E5', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 }}
                onPress={() => Alert.alert('提示', '导出功能正在开发中')}
              >
                <Text style={{ color: '#1E88E5' }}>批量导出</Text>
              </TouchableOpacity>
              <TouchableOpacity className="pc-btn pc-btn-primary" onPress={handleAdd}>
                <Text style={styles.btnPrimaryText}>+ 新增工单</Text>
              </TouchableOpacity>
            </View>
          }
        />

        <PCTable
          columns={columns}
          data={filteredOrders}
          rowKey="id"
          loading={loading}
        />

        <PCPagination
          current={pagination.current}
          pageSize={pagination.pageSize}
          total={pagination.total}
          onChange={page => setPagination(prev => ({ ...prev, current: page }))}
        />
      </PCCard>

      {/* 编辑/新增弹窗 */}
      <PCModal
        visible={modalVisible}
        title={editingOrder ? '编辑工单' : '新增工单'}
        onClose={() => setModalVisible(false)}
        width={700}
        footer={
          <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'flex-end' }}>
            <TouchableOpacity className="pc-btn pc-btn-default" onPress={() => setModalVisible(false)}>
              <Text style={styles.btnDefaultText}>取消</Text>
            </TouchableOpacity>
            <TouchableOpacity className="pc-btn pc-btn-primary" onPress={handleSave}>
              <Text style={styles.btnPrimaryText}>保存</Text>
            </TouchableOpacity>
          </View>
        }
      >
        <ScrollView style={{ maxHeight: 500 }}>
          <View style={styles.formRow}>
            <View style={styles.formCol}>
              <Text style={styles.formLabel}>
                工单编号 <Text style={{ color: '#ff4d4f' }}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="请输入工单编号"
                value={formData.work_order_number}
                onChangeText={text => setFormData(prev => ({ ...prev, work_order_number: text }))}
              />
            </View>
            <View style={styles.formCol}>
              <Text style={styles.formLabel}>工单名称</Text>
              <TextInput
                style={styles.input}
                placeholder="请输入工单名称"
                value={formData.title}
                onChangeText={text => setFormData(prev => ({ ...prev, title: text }))}
              />
            </View>
          </View>
          <View style={styles.formRow}>
            <View style={styles.formColFull}>
              <Text style={styles.formLabel}>
                客户名称 <Text style={{ color: '#ff4d4f' }}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="请输入客户名称"
                value={formData.customer_name}
                onChangeText={text => setFormData(prev => ({ ...prev, customer_name: text }))}
              />
            </View>
          </View>
          <View style={styles.formRow}>
            <View style={styles.formColFull}>
              <Text style={styles.formLabel}>设备名称</Text>
              <TextInput
                style={styles.input}
                placeholder="请输入设备名称"
                value={formData.device_name}
                onChangeText={text => setFormData(prev => ({ ...prev, device_name: text }))}
              />
            </View>
          </View>
          <View style={styles.formRow}>
            <View style={styles.formCol}>
              <Text style={styles.formLabel}>工单类型</Text>
              <TextInput
                style={styles.input}
                placeholder="请输入工单类型"
                value={formData.type}
                onChangeText={text => setFormData(prev => ({ ...prev, type: text }))}
              />
            </View>
            <View style={styles.formCol}>
              <Text style={styles.formLabel}>优先级</Text>
              <TextInput
                style={styles.input}
                placeholder="medium/high/low/urgent"
                value={formData.priority}
                onChangeText={text => setFormData(prev => ({ ...prev, priority: text }))}
              />
            </View>
            <View style={styles.formCol}>
              <Text style={styles.formLabel}>状态</Text>
              <TextInput
                style={styles.input}
                placeholder="pending/processing/completed/closed"
                value={formData.status}
                onChangeText={text => setFormData(prev => ({ ...prev, status: text }))}
              />
            </View>
          </View>
          <View style={styles.formRow}>
            <View style={styles.formCol}>
              <Text style={styles.formLabel}>阶段</Text>
              <TextInput
                style={styles.input}
                placeholder="queued/assigned/diagnosing/repairing"
                value={formData.stage}
                onChangeText={text => setFormData(prev => ({ ...prev, stage: text }))}
              />
            </View>
            <View style={styles.formCol}>
              <Text style={styles.formLabel}>计划工时</Text>
              <TextInput
                style={styles.input}
                placeholder="小时"
                value={formData.plan_hours}
                onChangeText={text => setFormData(prev => ({ ...prev, plan_hours: text }))}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.formCol}>
              <Text style={styles.formLabel}>报价</Text>
              <TextInput
                style={styles.input}
                placeholder="元"
                value={formData.quote}
                onChangeText={text => setFormData(prev => ({ ...prev, quote: text }))}
                keyboardType="numeric"
              />
            </View>
          </View>
          <View style={styles.formRow}>
            <View style={styles.formCol}>
              <Text style={styles.formLabel}>处理人</Text>
              <TextInput
                style={styles.input}
                placeholder="请输入处理人"
                value={formData.handler}
                onChangeText={text => setFormData(prev => ({ ...prev, handler: text }))}
              />
            </View>
          </View>
          <View style={styles.formRow}>
            <View style={styles.formColFull}>
              <Text style={styles.formLabel}>描述</Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                placeholder="请输入工单描述"
                value={formData.description}
                onChangeText={text => setFormData(prev => ({ ...prev, description: text }))}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>
        </ScrollView>
      </PCModal>

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
        templateFields={['工单编号*', '工单名称*', '客户名称', '设备名称', '工单类型', '优先级', '状态', '处理人', '描述']}
      />
    </PCLayout>
  );
}

const styles = StyleSheet.create({
  btnText: {
    fontSize: 13,
    color: '#1E88E5',
  },
  btnPrimaryText: {
    color: '#fff',
    fontSize: 13,
  },
  btnDefaultText: {
    color: '#333',
    fontSize: 13,
  },
  filterSelect: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: '#f0f0f0',
  },
  filterSelectActive: {
    backgroundColor: '#1E88E5',
  },
  filterSelectText: {
    fontSize: 13,
    color: '#666',
  },
  filterSelectTextActive: {
    color: '#fff',
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
  textarea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  formRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
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
    fontWeight: 500,
  },
});
