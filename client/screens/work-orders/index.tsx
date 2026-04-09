import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Modal, Platform, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { Screen } from '@/components/Screen';
import { PageHeader } from '@/components/PageHeader';
import { FontAwesome6 } from '@expo/vector-icons';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { getSecureItem } from '@/utils/storage';
import { getApiBaseUrl } from '@/utils/api';

interface WorkOrder {
  id: number;
  order_no: string;
  name?: string;
  description: string;
  customer_id: number;
  device_id?: number;
  type: string;
  priority: string;
  status: string;
  stage: string;
  plan_hours: number;
  is_charged: boolean;
  quoted_price: number;
  assignee_id?: number;
  created_by: number;
  customer_name?: string;
  device_name?: string;
  assignee_name?: string;
  created_at: string;
}

interface FormDataType {
  customer_id: string;
  device_id: string;
  type: string;
  priority: string;
  description: string;
  stage: string;
  status: string;
  plan_hours: string;
  is_charged: boolean;
  quoted_price: string;
  assignee_id: string;
}

export default function WorkOrdersScreen() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<WorkOrder[]>([]);
  const [stats, setStats] = useState({
    totalWorkOrders: 0,
    chargedWorkOrders: 0,
    performanceAmount: 0,
    pendingPaymentAmount: 0,
    paidAmount: 0,
  });
  const [searchKeyword, setSearchKeyword] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingOrder, setEditingOrder] = useState<WorkOrder | null>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [formData, setFormData] = useState<FormDataType>({
    customer_id: '',
    device_id: '',
    type: '维修',
    priority: 'normal',
    description: '',
    stage: 'pending',
    status: 'pending',
    plan_hours: '',
    is_charged: false,
    quoted_price: '',
    assignee_id: '',
  });
  const router = useSafeRouter();

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchWorkOrders(),
        fetchStats(),
        fetchCustomers(),
        fetchDevices(),
        fetchUsers(),
      ]);
    };
    loadData();
  }, []);

  useEffect(() => {
    let filtered = workOrders;

    if (searchKeyword.trim()) {
      const keyword = searchKeyword.toLowerCase();
      filtered = filtered.filter(
        (order) =>
          (order.order_no && order.order_no.toLowerCase().includes(keyword)) ||
          (order.description && order.description.toLowerCase().includes(keyword)) ||
          (order.customer_name && order.customer_name.toLowerCase().includes(keyword)) ||
          (order.device_name && order.device_name.toLowerCase().includes(keyword)) ||
          (order.assignee_name && order.assignee_name.toLowerCase().includes(keyword))
      );
    }

    setFilteredOrders(filtered);
  }, [searchKeyword, workOrders]);

  const fetchWorkOrders = async (): Promise<WorkOrder[]> => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/v1/work-orders`);
      const data = await response.json();
      if (Array.isArray(data)) {
        setWorkOrders(data);
        return data;
      }
      return [];
    } catch (error) {
      console.error('Fetch work orders error:', error);
      return [];
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/v1/work-orders/stats`);
      const data = await response.json();
      if (data) {
        setStats(data);
      }
    } catch (error) {
      console.error('Fetch stats error:', error);
    }
  };

  const fetchCustomers = async (): Promise<any[]> => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/v1/customers`);
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

  const fetchDevices = async (): Promise<any[]> => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/v1/devices`);
      const data = await response.json();
      if (Array.isArray(data)) {
        setDevices(data);
        return data;
      }
      return [];
    } catch (error) {
      console.error('Fetch devices error:', error);
      return [];
    }
  };

  const fetchUsers = async (): Promise<any[]> => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/v1/users`);
      const data = await response.json();
      if (Array.isArray(data)) {
        setUsers(data);
        return data;
      }
      return [];
    } catch (error) {
      console.error('Fetch users error:', error);
      return [];
    }
  };

  const handleAdd = () => {
    router.push('/work-order-detail', { id: 'new' });
  };

  const handleExport = (format: 'excel' | 'csv') => {
    const url = format === 'excel'
      ? `${getApiBaseUrl()}/api/v1/export/export/excel`
      : `${getApiBaseUrl()}/api/v1/export/export/csv`;

    if (Platform.OS === 'web') {
      const link = document.createElement('a');
      link.href = url;
      link.download = format === 'excel' ? '工单列表.xlsx' : '工单列表.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      Alert.alert('提示', '移动端暂不支持导出功能，请在PC端操作');
    }
  };

  const showExportOptions = () => {
    Alert.alert(
      '导出工单',
      '请选择导出格式',
      [
        { text: 'Excel 格式 (.xlsx)', onPress: () => handleExport('excel') },
        { text: 'CSV 格式 (.csv)', onPress: () => handleExport('csv') },
        { text: '取消', style: 'cancel' },
      ]
    );
  };

  const handleEdit = (order: WorkOrder) => {
    setEditingOrder(order);
    setFormData({
      customer_id: order.customer_id?.toString() || '',
      device_id: order.device_id?.toString() || '',
      type: order.type || '维修',
      priority: order.priority || 'normal',
      description: order.description || '',
      stage: order.stage || 'pending',
      status: order.status || 'pending',
      plan_hours: order.plan_hours?.toString() || '',
      is_charged: order.is_charged || false,
      quoted_price: order.quoted_price?.toString() || '',
      assignee_id: order.assignee_id?.toString() || '',
    });
    setModalVisible(true);
  };

  const handleDelete = (order: WorkOrder) => {
    Alert.alert('确认删除', `确定要删除工单"${order.order_no}"吗？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            const response = await fetch(
              `${getApiBaseUrl()}/api/v1/work-orders/${order.id}`,
              {
                method: 'DELETE',
              }
            );
            if (response.ok) {
              Alert.alert('成功', '删除成功');
              fetchWorkOrders();
              fetchStats();
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

  const handleDownload = async (order: WorkOrder) => {
    Alert.alert('提示', '工单下载功能正在开发中，敬请期待！');
  };

  const handleSave = async () => {
    if (!formData.customer_id || !formData.description) {
      Alert.alert('提示', '请填写客户和工单描述');
      return;
    }

    try {
      const response = editingOrder
        ? await fetch(
            `${getApiBaseUrl()}/api/v1/work-orders/${editingOrder.id}`,
            {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                description: formData.description,
                priority: formData.priority,
                status: formData.status,
                stage: formData.stage,
                plan_hours: formData.plan_hours ? parseFloat(formData.plan_hours) : 0,
                is_charged: formData.is_charged,
                quoted_price: formData.quoted_price ? parseFloat(formData.quoted_price) : 0,
                assignee_id: formData.assignee_id ? parseInt(formData.assignee_id) : null,
              }),
            }
          )
        : await fetch(`${getApiBaseUrl()}/api/v1/work-orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              customer_id: parseInt(formData.customer_id),
              device_id: formData.device_id ? parseInt(formData.device_id) : null,
              order_no: `WO${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
              type: formData.type,
              priority: formData.priority,
              status: 'pending',
              description: formData.description,
              stage: formData.stage,
              plan_hours: formData.plan_hours ? parseFloat(formData.plan_hours) : 0,
              is_charged: formData.is_charged,
              quoted_price: formData.quoted_price ? parseFloat(formData.quoted_price) : 0,
              assignee_id: formData.assignee_id ? parseInt(formData.assignee_id) : 2,
              created_by: 2,
            }),
          });

      if (!response.ok) {
        throw new Error(editingOrder ? '更新失败' : '创建失败');
      }

      setModalVisible(false);
      fetchWorkOrders();
      fetchStats();
      Alert.alert('成功', editingOrder ? '修改成功' : '创建成功');
    } catch (error: any) {
      Alert.alert('错误', error.message);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return { text: '待派工', color: '#F5A623', bgColor: 'rgba(245, 166, 35, 0.15)' };
      case 'assigned':
        return { text: '已派工', color: '#F5A623', bgColor: 'rgba(245, 166, 35, 0.15)' };
      case 'processing':
        return { text: '处理中', color: '#6C63FF', bgColor: 'rgba(108, 99, 255, 0.15)' };
      case 'completed':
        return { text: '已完成', color: '#00B894', bgColor: 'rgba(0, 184, 148, 0.15)' };
      default:
        return { text: status, color: '#B2BEC3', bgColor: 'rgba(178, 190, 195, 0.15)' };
    }
  };

  return (
    <Screen>
      <PageHeader title="工单管理" showHome />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* 操作按钮区 */}
        <View className="px-5 mb-4 flex-row gap-3">
          <TouchableOpacity
            onPress={handleAdd}
            className="flex-1 py-3 rounded-2xl items-center justify-center"
            style={{ backgroundColor: '#8B5CF6' }}
          >
            <Text className="text-white font-semibold text-base">新建工单</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={showExportOptions}
            className="flex-1 py-3 rounded-2xl items-center justify-center"
            style={{ backgroundColor: '#00B894' }}
          >
            <Text className="text-white font-semibold text-base">导出工单</Text>
          </TouchableOpacity>
        </View>

        {/* 统计区域 */}
        <View className="px-5 mb-5">
          <Text className="text-lg font-bold text-gray-800 mb-3">工单统计</Text>

          {/* 第一行：2列小卡片 */}
          <View className="flex-row gap-3 mb-3">
            <View className="flex-1 bg-white rounded-2xl p-4">
              <Text className="text-sm text-gray-500 mb-1">总工单数</Text>
              <Text className="text-3xl font-bold text-gray-800">{stats.totalWorkOrders}</Text>
              <Text className="text-sm text-gray-500 mt-1">总收费工单数</Text>
              <Text className="text-2xl font-bold text-green-600">{stats.chargedWorkOrders}</Text>
            </View>
          </View>

          {/* 第二行：通栏卡片 */}
          <View className="bg-white rounded-2xl p-4 mb-3">
            <Text className="text-sm text-gray-500 mb-1">售后业绩金额</Text>
            <Text className="text-2xl font-bold" style={{ color: '#E53935' }}>¥{stats.performanceAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</Text>
          </View>

          {/* 第三行：通栏卡片 */}
          <View className="bg-white rounded-2xl p-4">
            <Text className="text-sm text-gray-500 mb-1">售后待收款金额</Text>
            <Text className="text-2xl font-bold" style={{ color: '#E53935' }}>¥{stats.pendingPaymentAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</Text>
            <View className="h-px bg-gray-200 my-2" />
            <Text className="text-sm text-gray-500 mb-1">售后已收款金额</Text>
            <Text className="text-2xl font-bold text-green-600">¥{stats.paidAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</Text>
          </View>
        </View>

        {/* 搜索框 */}
        <View className="px-5 mb-4">
          <View className="flex-row items-center bg-white rounded-2xl px-4 py-3">
            <FontAwesome6 name="magnifying-glass" size={16} color="#9CA3AF" />
            <TextInput
              className="flex-1 ml-2 text-gray-800 text-base"
              placeholder="搜索工单名称、客户名称、工单编号、任务号、任务负责人"
              placeholderTextColor="#9CA3AF"
              value={searchKeyword}
              onChangeText={setSearchKeyword}
            />
          </View>
        </View>

        {/* 工单列表 */}
        <View className="px-5 mb-4">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-lg font-bold text-gray-800">最近工单</Text>
            <TouchableOpacity onPress={() => {}}>
              <Text className="text-sm text-purple-600">查看全部</Text>
            </TouchableOpacity>
          </View>

          {filteredOrders.length === 0 ? (
            <View className="bg-white rounded-2xl p-8 items-center">
              <FontAwesome6 name="clipboard-list" size={48} color="#D1D5DB" />
              <Text className="text-base text-gray-500 mt-3">暂无工单数据</Text>
            </View>
          ) : (
            <View className="gap-3">
              {filteredOrders.map((order) => {
                const statusConfig = getStatusConfig(order.stage);
                return (
                  <TouchableOpacity
                    key={order.id}
                    onPress={() => router.push('/work-order-detail', { id: order.id.toString() })}
                    activeOpacity={0.7}
                  >
                    <View className="bg-white rounded-2xl p-4">
                      {/* 标题行：工单名称 + 状态标签 */}
                      <View className="flex-row justify-between items-start mb-2">
                        <View className="flex-1 pr-2">
                          <Text className="text-base font-bold text-gray-800" numberOfLines={2}>
                            {order.name || order.description || '无描述'}
                          </Text>
                          <Text className="text-sm text-gray-500 mt-1">
                            {order.order_no}
                          </Text>
                        </View>
                        <View
                          className="px-3 py-1 rounded-full"
                          style={{ backgroundColor: statusConfig.bgColor }}
                        >
                          <Text
                            className="text-xs font-semibold"
                            style={{ color: statusConfig.color }}
                          >
                            {statusConfig.text}
                          </Text>
                        </View>
                      </View>

                      {/* 信息行：客户 + 负责人 */}
                      <View className="flex-row gap-4 mb-3">
                        <View className="flex-1 flex-row items-center">
                          <FontAwesome6 name="building" size={14} color="#9CA3AF" />
                          <Text className="text-sm text-gray-600 ml-2" numberOfLines={1}>
                            {order.customer_name || '未指定'}
                          </Text>
                        </View>
                        <View className="flex-1 flex-row items-center">
                          <FontAwesome6 name="user" size={14} color="#9CA3AF" />
                          <Text className="text-sm text-gray-600 ml-2" numberOfLines={1}>
                            {order.assignee_name || '未指定'}
                          </Text>
                        </View>
                      </View>

                      {/* 详情行：类型 + 工时 + 报价 */}
                      <View className="flex-row items-center mb-3 flex-wrap gap-2">
                        <View className="flex-row items-center bg-gray-100 px-2 py-1 rounded-lg">
                          <FontAwesome6 name="wrench" size={12} color="#6B7280" />
                          <Text className="text-xs text-gray-600 ml-1">{order.type || '维修'}</Text>
                        </View>
                        {order.plan_hours > 0 && (
                          <View className="flex-row items-center bg-gray-100 px-2 py-1 rounded-lg">
                            <FontAwesome6 name="clock" size={12} color="#6B7280" />
                            <Text className="text-xs text-gray-600 ml-1">{order.plan_hours}h</Text>
                          </View>
                        )}
                        {order.quoted_price > 0 && (
                          <View className="flex-row items-center bg-gray-100 px-2 py-1 rounded-lg">
                            <FontAwesome6 name="yen-sign" size={12} color="#6B7280" />
                            <Text className="text-xs text-gray-600 ml-1">¥{order.quoted_price}</Text>
                          </View>
                        )}
                        <View
                          className="px-2 py-1 rounded-full"
                          style={{
                            backgroundColor: order.is_charged ? 'rgba(0, 184, 148, 0.15)' : 'rgba(156, 163, 175, 0.15)'
                          }}
                        >
                          <Text
                            className="text-xs font-semibold"
                            style={{ color: order.is_charged ? '#00B894' : '#9CA3AF' }}
                          >
                            {order.is_charged ? '有偿' : '免费'}
                          </Text>
                        </View>
                      </View>

                      {/* 操作按钮行 */}
                      <View className="flex-row gap-2 mt-2">
                        <TouchableOpacity
                          onPress={() => router.push('/work-order-detail', { id: order.id })}
                          className="flex-1 py-2.5 rounded-full items-center justify-center"
                          style={{ backgroundColor: '#F3F4F6' }}
                        >
                          <Text className="text-sm font-semibold text-gray-700">查看</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={(e) => {
                            e.stopPropagation();
                            handleEdit(order);
                          }}
                          className="flex-1 py-2.5 rounded-full items-center justify-center"
                          style={{ backgroundColor: '#F59E0B' }}
                        >
                          <Text className="text-sm font-semibold text-white">修改</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={(e) => {
                            e.stopPropagation();
                            handleDownload(order);
                          }}
                          className="flex-1 py-2.5 rounded-full items-center justify-center"
                          style={{ backgroundColor: '#00B894' }}
                        >
                          <Text className="text-sm font-semibold text-white">下载</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* 新建/编辑工单弹窗 */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View className="flex-1 justify-end bg-black-50">
              <View className="bg-white rounded-t-3xl p-5" style={{ maxHeight: '90%' }}>
                <View className="flex-row justify-between items-center mb-5">
                  <Text className="text-xl font-bold text-gray-800">
                    {editingOrder ? '编辑工单' : '新建工单'}
                  </Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <FontAwesome6 name="xmark" size={24} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                  {/* 表单内容 */}
                  <View className="mb-4">
                    <Text className="text-sm font-semibold text-gray-700 mb-2">工单名称 *</Text>
                    <TextInput
                      className="bg-gray-100 rounded-xl px-4 py-3 text-gray-800"
                      placeholder="请输入工单名称"
                      value={formData.description}
                      onChangeText={(text) => setFormData({ ...formData, description: text })}
                    />
                  </View>

                  <View className="mb-4">
                    <Text className="text-sm font-semibold text-gray-700 mb-2">客户 *</Text>
                    <View className="bg-gray-100 rounded-xl px-4 py-3">
                      <Text className="text-gray-800">
                        {customers.find((c) => c.id.toString() === formData.customer_id)?.name || '请选择客户'}
                      </Text>
                    </View>
                  </View>

                  <View className="mb-4">
                    <Text className="text-sm font-semibold text-gray-700 mb-2">任务负责人</Text>
                    <View className="bg-gray-100 rounded-xl px-4 py-3">
                      <Text className="text-gray-800">
                        {users.find((u) => u.id.toString() === formData.assignee_id)?.username || '请选择负责人'}
                      </Text>
                    </View>
                  </View>

                  <View className="mb-4">
                    <Text className="text-sm font-semibold text-gray-700 mb-2">设备</Text>
                    <View className="bg-gray-100 rounded-xl px-4 py-3">
                      <Text className="text-gray-800">
                        {devices.find((d) => d.id.toString() === formData.device_id)?.device_name || '请选择设备'}
                      </Text>
                    </View>
                  </View>

                  <View className="mb-4">
                    <Text className="text-sm font-semibold text-gray-700 mb-2">工单类型</Text>
                    <View className="flex-row gap-2 flex-wrap">
                      {['维修', '保养', '安装', '其他'].map((type) => (
                        <TouchableOpacity
                          key={type}
                          onPress={() => setFormData({ ...formData, type })}
                          className={`px-4 py-2 rounded-xl ${formData.type === type ? 'bg-purple-600' : 'bg-gray-100'}`}
                        >
                          <Text className={`text-sm font-semibold ${formData.type === type ? 'text-white' : 'text-gray-700'}`}>
                            {type}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View className="mb-4">
                    <Text className="text-sm font-semibold text-gray-700 mb-2">工单阶段</Text>
                    <View className="flex-row gap-2 flex-wrap">
                      {[
                        { label: '待派工', value: 'pending' },
                        { label: '已派工', value: 'assigned' },
                        { label: '处理中', value: 'processing' },
                        { label: '已完成', value: 'completed' },
                      ].map((stage) => (
                        <TouchableOpacity
                          key={stage.value}
                          onPress={() => setFormData({ ...formData, stage: stage.value })}
                          className={`px-4 py-2 rounded-xl ${formData.stage === stage.value ? 'bg-purple-600' : 'bg-gray-100'}`}
                        >
                          <Text className={`text-sm font-semibold ${formData.stage === stage.value ? 'text-white' : 'text-gray-700'}`}>
                            {stage.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View className="mb-4">
                    <Text className="text-sm font-semibold text-gray-700 mb-2">优先级</Text>
                    <View className="flex-row gap-2 flex-wrap">
                      {[
                        { label: '低', value: 'low' },
                        { label: '中', value: 'normal' },
                        { label: '高', value: 'high' },
                      ].map((priority) => (
                        <TouchableOpacity
                          key={priority.value}
                          onPress={() => setFormData({ ...formData, priority: priority.value })}
                          className={`px-4 py-2 rounded-xl ${formData.priority === priority.value ? 'bg-purple-600' : 'bg-gray-100'}`}
                        >
                          <Text className={`text-sm font-semibold ${formData.priority === priority.value ? 'text-white' : 'text-gray-700'}`}>
                            {priority.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View className="mb-4">
                    <Text className="text-sm font-semibold text-gray-700 mb-2">计划工时（小时）</Text>
                    <TextInput
                      className="bg-gray-100 rounded-xl px-4 py-3 text-gray-800"
                      placeholder="请输入计划工时"
                      keyboardType="decimal-pad"
                      value={formData.plan_hours}
                      onChangeText={(text) => setFormData({ ...formData, plan_hours: text })}
                    />
                  </View>

                  <View className="mb-4">
                    <Text className="text-sm font-semibold text-gray-700 mb-2">有偿服务</Text>
                    <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3">
                      <TouchableOpacity
                        onPress={() => setFormData({ ...formData, is_charged: !formData.is_charged })}
                        className={`w-12 h-7 rounded-full p-1 ${formData.is_charged ? 'bg-purple-600 justify-end' : 'bg-gray-300 justify-start'}`}
                      >
                        <View className="w-5 h-5 bg-white rounded-full shadow" />
                      </TouchableOpacity>
                      <Text className="text-sm text-gray-700 ml-3">
                        {formData.is_charged ? '是' : '否'}
                      </Text>
                    </View>
                  </View>

                  <View className="mb-4">
                    <Text className="text-sm font-semibold text-gray-700 mb-2">报价金额（元）</Text>
                    <TextInput
                      className="bg-gray-100 rounded-xl px-4 py-3 text-gray-800"
                      placeholder="请输入报价金额"
                      keyboardType="decimal-pad"
                      value={formData.quoted_price}
                      onChangeText={(text) => setFormData({ ...formData, quoted_price: text })}
                    />
                  </View>

                  {editingOrder && (
                    <View className="mb-6">
                      <Text className="text-sm font-semibold text-gray-700 mb-2">工单状态</Text>
                      <View className="flex-row gap-2 flex-wrap">
                        {[
                          { label: '待处理', value: 'pending' },
                          { label: '处理中', value: 'processing' },
                          { label: '已完成', value: 'completed' },
                        ].map((status) => (
                          <TouchableOpacity
                            key={status.value}
                            onPress={() => setFormData({ ...formData, status: status.value })}
                            className={`px-4 py-2 rounded-xl ${formData.status === status.value ? 'bg-purple-600' : 'bg-gray-100'}`}
                          >
                            <Text className={`text-sm font-semibold ${formData.status === status.value ? 'text-white' : 'text-gray-700'}`}>
                              {status.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}
                </ScrollView>

                {/* 操作按钮 */}
                <View className="flex-row gap-3 mt-4">
                  <TouchableOpacity
                    onPress={() => setModalVisible(false)}
                    className="flex-1 py-3 rounded-2xl bg-gray-100 items-center justify-center"
                  >
                    <Text className="text-base font-semibold text-gray-700">取消</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSave}
                    className="flex-1 py-3 rounded-2xl items-center justify-center"
                    style={{ backgroundColor: '#8B5CF6' }}
                  >
                    <Text className="text-base font-semibold text-white">保存</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Modal>
    </Screen>
  );
}
