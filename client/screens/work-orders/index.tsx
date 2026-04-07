import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Modal, Platform, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { Screen } from '@/components/Screen';
import { PageHeader } from '@/components/PageHeader';
import { FontAwesome6 } from '@expo/vector-icons';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { cachedFetch, clearCache } from '@/utils/storage';

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
    plan_hours: '',
    is_charged: false,
    quoted_price: '',
    assignee_id: '',
  });
  const router = useSafeRouter();

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        cachedFetch('work-orders-list', fetchWorkOrders, 'short'),
        cachedFetch('work-orders-stats', fetchStats, 'short'),
        cachedFetch('customers-list', fetchCustomers, 'medium'),
        cachedFetch('devices-list', fetchDevices, 'medium'),
        cachedFetch('users-list', fetchUsers, 'medium'),
      ]);
    };
    loadData();
  }, []);

  useEffect(() => {
    let filtered = workOrders;

    // 搜索筛选（支持多字段）
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
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/work-orders`);
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
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/work-orders/stats`);
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

  const fetchDevices = async (): Promise<any[]> => {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/devices`);
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
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/users`);
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
    setEditingOrder(null);
    setFormData({
      customer_id: '',
      device_id: '',
      type: '维修',
      priority: 'normal',
      description: '',
      stage: 'pending',
      plan_hours: '',
      is_charged: false,
      quoted_price: '',
      assignee_id: '',
    });
    setModalVisible(true);
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
              `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/work-orders/${order.id}`,
              {
                method: 'DELETE',
              }
            );
            if (response.ok) {
              Alert.alert('成功', '删除成功');
              clearCache('work-orders-list');
              clearCache('work-orders-stats');
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
    try {
      Alert.alert('提示', '工单下载功能正在开发中，敬请期待！');
    } catch (error: any) {
      Alert.alert('错误', error.message);
    }
  };

  const handleSave = async () => {
    if (!formData.customer_id || !formData.description) {
      Alert.alert('提示', '请填写客户和工单描述');
      return;
    }

    try {
      const response = editingOrder
        ? await fetch(
            `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/work-orders/${editingOrder.id}`,
            {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                description: formData.description,
                priority: formData.priority,
                status: editingOrder.status,
                stage: formData.stage,
                plan_hours: formData.plan_hours ? parseFloat(formData.plan_hours) : 0,
                is_charged: formData.is_charged,
                quoted_price: formData.quoted_price ? parseFloat(formData.quoted_price) : 0,
                assignee_id: formData.assignee_id ? parseInt(formData.assignee_id) : null,
              }),
            }
          )
        : await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/work-orders`, {
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
      clearCache('work-orders-list');
      clearCache('work-orders-stats');
      fetchWorkOrders();
      fetchStats();
      Alert.alert('成功', editingOrder ? '修改成功' : '创建成功');
    } catch (error: any) {
      Alert.alert('错误', error.message);
    }
  };

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/work-orders/${orderId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!response.ok) {
        throw new Error('更新失败');
      }

      clearCache('work-orders-list');
      clearCache('work-orders-stats');
      fetchWorkOrders();
      Alert.alert('成功', '工单状态已更新');
    } catch (error: any) {
      Alert.alert('错误', error.message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#FDCB6E';
      case 'processing':
        return '#6C63FF';
      case 'completed':
        return '#00B894';
      default:
        return '#B2BEC3';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return '待处理';
      case 'processing':
        return '处理中';
      case 'completed':
        return '已完成';
      default:
        return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return '#FF6B6B';
      case 'medium':
        return '#FDCB6E';
      case 'low':
        return '#00B894';
      default:
        return '#B2BEC3';
    }
  };

  return (
    <Screen>
      <PageHeader title="工单管理" showHome />
      
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* 栏1：操作按钮 */}
        <View className="px-6 mb-4 flex-row gap-3">
          <TouchableOpacity
            onPress={handleAdd}
            className="flex-1 py-3 rounded-2xl bg-[#6C63FF] items-center justify-center"
          >
            <Text className="text-white font-semibold text-base">新建工单</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/after-sales-audit')}
            className="flex-1 py-3 rounded-2xl bg-[#F39C12] items-center justify-center"
          >
            <Text className="text-white font-semibold text-base">待审工单</Text>
          </TouchableOpacity>
        </View>

        {/* 栏2：工单统计 */}
        <View className="px-6 mb-4">
          <View
            className="rounded-3xl p-5"
            style={{
              backgroundColor: '#F0F0F3',
              shadowColor: '#D1D9E6',
              shadowOffset: { width: 6, height: 6 },
              shadowOpacity: 0.7,
              shadowRadius: 8,
              elevation: 6,
            }}
          >
            <Text className="text-lg font-bold text-[#2D3436] mb-4">工单统计</Text>
            <View className="grid grid-cols-2 gap-4">
              <View className="bg-white rounded-2xl p-4">
                <Text className="text-xs text-[#636E72] mb-1">总工单数</Text>
                <Text className="text-2xl font-bold text-[#6C63FF]">{stats.totalWorkOrders}</Text>
              </View>
              <View className="bg-white rounded-2xl p-4">
                <Text className="text-xs text-[#636E72] mb-1">总收费工单数</Text>
                <Text className="text-2xl font-bold text-[#00B894]">{stats.chargedWorkOrders}</Text>
              </View>
              <View className="bg-white rounded-2xl p-4">
                <Text className="text-xs text-[#636E72] mb-1">售后业绩金额</Text>
                <Text className="text-xl font-bold text-[#F39C12]">¥{stats.performanceAmount.toFixed(2)}</Text>
              </View>
              <View className="bg-white rounded-2xl p-4">
                <Text className="text-xs text-[#636E72] mb-1">售后待收款金额</Text>
                <Text className="text-xl font-bold text-[#E74C3C]">¥{stats.pendingPaymentAmount.toFixed(2)}</Text>
              </View>
              <View className="bg-white rounded-2xl p-4 col-span-2">
                <Text className="text-xs text-[#636E72] mb-1">售后已收款金额</Text>
                <Text className="text-2xl font-bold text-[#6C63FF]">¥{stats.paidAmount.toFixed(2)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 栏3：工单查询 */}
        <View className="px-6 mb-4">
          <View
            className="rounded-3xl p-5"
            style={{
              backgroundColor: '#F0F0F3',
              shadowColor: '#D1D9E6',
              shadowOffset: { width: 6, height: 6 },
              shadowOpacity: 0.7,
              shadowRadius: 8,
              elevation: 6,
            }}
          >
            <Text className="text-lg font-bold text-[#2D3436] mb-4">工单查询</Text>

            {/* 搜索栏 */}
            <View className="flex-row items-center bg-white rounded-2xl px-4 py-3 mb-4">
              <FontAwesome6 name="magnifying-glass" size={16} color="#636E72" />
              <TextInput
                className="flex-1 ml-2 text-[#2D3436] text-base"
                placeholder="搜索工单名称、客户名称、工单编号、任务号、任务负责人、设备名称、设备编号"
                placeholderTextColor="#B2BEC3"
                value={searchKeyword}
                onChangeText={setSearchKeyword}
              />
            </View>

            {/* 工单列表 */}
            <View>
              {filteredOrders.map((order) => (
                <TouchableOpacity
                  key={order.id}
                  onPress={() => router.push('/work-order-detail', { id: order.id.toString() })}
                  activeOpacity={0.7}
                >
                  <View
                    className="rounded-2xl p-4 mb-3"
                    style={{
                      backgroundColor: '#FFFFFF',
                      shadowColor: '#D1D9E6',
                      shadowOffset: { width: 4, height: 4 },
                      shadowOpacity: 0.5,
                      shadowRadius: 6,
                      elevation: 4,
                    }}
                  >
                    {/* 工单名称和任务号 */}
                    <View className="flex-row justify-between items-start mb-2">
                      <View className="flex-1">
                        <Text className="text-base font-bold text-[#2D3436] mb-1" numberOfLines={1}>
                          {order.name || order.description || '无描述'}
                        </Text>
                        <Text className="text-xs text-[#636E72]">
                          任务号: {order.order_no}
                        </Text>
                      </View>
                      {/* 工单阶段标识 */}
                      <View
                        className="px-2 py-1 rounded-full ml-2"
                        style={{
                          backgroundColor: order.stage === 'completed' ? 'rgba(0, 184, 148, 0.2)' :
                            order.stage === 'processing' ? 'rgba(108, 99, 255, 0.2)' :
                            order.stage === 'assigned' ? 'rgba(243, 156, 18, 0.2)' : 'rgba(253, 203, 110, 0.2)'
                        }}
                      >
                        <Text
                          className="text-xs font-semibold"
                          style={{
                            color: order.stage === 'completed' ? '#00B894' :
                              order.stage === 'processing' ? '#6C63FF' :
                              order.stage === 'assigned' ? '#F39C12' : '#FDCB6E'
                          }}
                        >
                          {order.stage === 'completed' ? '已完成' :
                            order.stage === 'processing' ? '处理中' :
                            order.stage === 'assigned' ? '已派工' : '待派工'}
                        </Text>
                      </View>
                    </View>

                    {/* 客户名称和任务负责人 */}
                    <View className="flex-row items-center mb-2">
                      <View className="flex-row items-center flex-1">
                        <FontAwesome6 name="building" size={12} color="#636E72" />
                        <Text className="text-xs text-[#636E72] ml-1" numberOfLines={1}>
                          {order.customer_name || '未指定客户'}
                        </Text>
                      </View>
                      <View className="flex-row items-center flex-1">
                        <FontAwesome6 name="user" size={12} color="#636E72" />
                        <Text className="text-xs text-[#636E72] ml-1" numberOfLines={1}>
                          {order.assignee_name || '未指定负责人'}
                        </Text>
                      </View>
                    </View>

                    {/* 工单类型、计划工时、报价金额 */}
                    <View className="flex-row items-center mb-2 flex-wrap gap-2">
                      <View className="flex-row items-center">
                        <FontAwesome6 name="wrench" size={10} color="#6C63FF" />
                        <Text className="text-xs text-[#636E72] ml-1">{order.type || '维修'}</Text>
                      </View>
                      {order.plan_hours > 0 && (
                        <View className="flex-row items-center">
                          <FontAwesome6 name="clock" size={10} color="#F39C12" />
                          <Text className="text-xs text-[#636E72] ml-1">{order.plan_hours}h</Text>
                        </View>
                      )}
                      {order.quoted_price > 0 && (
                        <View className="flex-row items-center">
                          <FontAwesome6 name="yen-sign" size={10} color="#00B894" />
                          <Text className="text-xs font-semibold text-[#00B894] ml-1">¥{order.quoted_price}</Text>
                        </View>
                      )}
                      <View
                        className="px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: order.is_charged ? 'rgba(0, 184, 148, 0.15)' : 'rgba(178, 190, 195, 0.15)' }}
                      >
                        <Text
                          className="text-xs font-semibold"
                          style={{ color: order.is_charged ? '#00B894' : '#B2BEC3' }}
                        >
                          {order.is_charged ? '有偿' : '免费'}
                        </Text>
                      </View>
                    </View>

                    {/* 操作按钮 */}
                    <View className="flex-row gap-2 mt-3">
                      <TouchableOpacity
                        onPress={() => router.push('/work-order-detail', { id: order.id })}
                        className="flex-1 py-2 rounded-full bg-[#6C63FF] items-center justify-center"
                      >
                        <Text className="text-white text-xs font-semibold">查看</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          handleEdit(order);
                        }}
                        className="flex-1 py-2 rounded-full bg-[#F39C12] items-center justify-center"
                      >
                        <Text className="text-white text-xs font-semibold">修改</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          handleDownload(order);
                        }}
                        className="flex-1 py-2 rounded-full bg-[#00B894] items-center justify-center"
                      >
                        <Text className="text-white text-xs font-semibold">下载</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}

              {filteredOrders.length === 0 && (
                <View className="py-8 items-center">
                  <Text className="text-sm text-[#636E72]">暂无工单数据</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* 新增工单 Modal */}
      {modalVisible && (
        <Modal visible={modalVisible} transparent animationType="slide">
          <View className="flex-1 bg-black/50 justify-end">
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={{ flex: 1 }}
            >
              <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View className="bg-white rounded-t-3xl p-6 max-h-[90%]">
                  {/* Header */}
                  <View className="flex-row justify-between items-center mb-6">
                    <Text className="text-xl font-bold text-[#2D3436]">
                      {editingOrder ? '编辑工单' : '新建工单'}
                    </Text>
                    <TouchableOpacity onPress={() => setModalVisible(false)}>
                      <FontAwesome6 name="times" size={20} color="#636E72" />
                    </TouchableOpacity>
                  </View>

                  <ScrollView showsVerticalScrollIndicator={false}>
                    {/* 工单名称 */}
                    <View className="mb-4">
                      <Text className="text-sm font-medium text-[#636E72] mb-2 ml-1">工单名称 *</Text>
                      <TextInput
                        className="w-full bg-[#F5F5F5] rounded-2xl px-4 py-3 text-[#2D3436] text-base"
                        placeholder="请输入工单名称"
                        placeholderTextColor="#B2BEC3"
                        value={formData.description}
                        onChangeText={(text) => setFormData({ ...formData, description: text })}
                      />
                    </View>

                    {/* 客户选择 */}
                    <View className="mb-4">
                      <Text className="text-sm font-medium text-[#636E72] mb-2 ml-1">客户 *</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
                        {customers.map((c) => (
                          <TouchableOpacity
                            key={c.id}
                            onPress={() => setFormData({ ...formData, customer_id: c.id.toString() })}
                            className={`px-4 py-2 rounded-full mr-2 ${formData.customer_id === c.id.toString() ? 'bg-[#6C63FF]' : 'bg-[#F5F5F5]'}`}
                          >
                            <Text className={`text-sm ${formData.customer_id === c.id.toString() ? 'text-white' : 'text-[#636E72]'}`} numberOfLines={1}>{c.name}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>

                    {/* 任务负责人 */}
                    <View className="mb-4">
                      <Text className="text-sm font-medium text-[#636E72] mb-2 ml-1">任务负责人</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
                        {users.map((u) => (
                          <TouchableOpacity
                            key={u.id}
                            onPress={() => setFormData({ ...formData, assignee_id: u.id.toString() })}
                            className={`px-4 py-2 rounded-full mr-2 ${formData.assignee_id === u.id.toString() ? 'bg-[#6C63FF]' : 'bg-[#F5F5F5]'}`}
                          >
                            <Text className={`text-sm ${formData.assignee_id === u.id.toString() ? 'text-white' : 'text-[#636E72]'}`}>{u.name}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>

                    {/* 设备选择 */}
                    <View className="mb-4">
                      <Text className="text-sm font-medium text-[#636E72] mb-2 ml-1">设备</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
                        {devices.filter(d => !formData.customer_id || d.customer_id === parseInt(formData.customer_id)).map((d) => (
                          <TouchableOpacity
                            key={d.id}
                            onPress={() => setFormData({ ...formData, device_id: d.id.toString() })}
                            className={`px-4 py-2 rounded-full mr-2 ${formData.device_id === d.id.toString() ? 'bg-[#6C63FF]' : 'bg-[#F5F5F5]'}`}
                          >
                            <Text className={`text-sm ${formData.device_id === d.id.toString() ? 'text-white' : 'text-[#636E72]'}`} numberOfLines={1}>{d.device_name}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>

                    {/* 工单类型 */}
                    <View className="mb-4">
                      <Text className="text-sm font-medium text-[#636E72] mb-2 ml-1">工单类型</Text>
                      <View className="flex-row gap-2">
                        {['维修', '保养', '安装', '其他'].map((t) => (
                          <TouchableOpacity
                            key={t}
                            onPress={() => setFormData({ ...formData, type: t })}
                            className={`flex-1 py-3 rounded-2xl items-center ${formData.type === t ? 'bg-[#6C63FF]' : 'bg-[#F5F5F5]'}`}
                          >
                            <Text className={`text-sm font-medium ${formData.type === t ? 'text-white' : 'text-[#636E72]'}`}>{t}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    {/* 工单阶段 */}
                    <View className="mb-4">
                      <Text className="text-sm font-medium text-[#636E72] mb-2 ml-1">工单阶段</Text>
                      <View className="flex-row gap-2">
                        {[
                          { label: '待派工', value: 'pending' },
                          { label: '已派工', value: 'assigned' },
                          { label: '处理中', value: 'processing' },
                          { label: '已完成', value: 'completed' },
                        ].map((s) => (
                          <TouchableOpacity
                            key={s.value}
                            onPress={() => setFormData({ ...formData, stage: s.value })}
                            className={`flex-1 py-3 rounded-2xl items-center ${formData.stage === s.value ? 'bg-[#6C63FF]' : 'bg-[#F5F5F5]'}`}
                          >
                            <Text className={`text-xs font-medium ${formData.stage === s.value ? 'text-white' : 'text-[#636E72]'}`}>{s.label}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    {/* 优先级 */}
                    <View className="mb-4">
                      <Text className="text-sm font-medium text-[#636E72] mb-2 ml-1">优先级</Text>
                      <View className="flex-row gap-2">
                        {[
                          { label: '低', value: 'low', color: '#00B894' },
                          { label: '中', value: 'normal', color: '#F39C12' },
                          { label: '高', value: 'high', color: '#FF6B6B' },
                        ].map((p) => (
                          <TouchableOpacity
                            key={p.value}
                            onPress={() => setFormData({ ...formData, priority: p.value })}
                            className={`flex-1 py-3 rounded-2xl items-center ${formData.priority === p.value ? 'bg-[#6C63FF]' : 'bg-[#F5F5F5]'}`}
                          >
                            <Text className={`text-sm font-medium ${formData.priority === p.value ? 'text-white' : 'text-[#636E72]'}`}>{p.label}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    {/* 计划工时 */}
                    <View className="mb-4">
                      <Text className="text-sm font-medium text-[#636E72] mb-2 ml-1">计划工时（小时）</Text>
                      <TextInput
                        className="w-full bg-[#F5F5F5] rounded-2xl px-4 py-3 text-[#2D3436] text-base"
                        placeholder="请输入计划工时"
                        placeholderTextColor="#B2BEC3"
                        keyboardType="decimal-pad"
                        value={formData.plan_hours}
                        onChangeText={(text) => setFormData({ ...formData, plan_hours: text })}
                      />
                    </View>

                    {/* 有偿服务开关 */}
                    <View className="mb-4">
                      <View className="flex-row justify-between items-center bg-[#F5F5F5] rounded-2xl px-4 py-3">
                        <Text className="text-base text-[#2D3436]">有偿服务</Text>
                        <TouchableOpacity
                          onPress={() => setFormData({ ...formData, is_charged: !formData.is_charged })}
                          className={`w-12 h-7 rounded-full p-1 justify-center ${formData.is_charged ? 'bg-[#6C63FF]' : 'bg-[#B2BEC3]'}`}
                        >
                          <View className={`w-5 h-5 rounded-full bg-white shadow-sm ${formData.is_charged ? 'self-end' : 'self-start'}`} />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* 报价金额 */}
                    <View className="mb-4">
                      <Text className="text-sm font-medium text-[#636E72] mb-2 ml-1">报价金额（元）</Text>
                      <TextInput
                        className="w-full bg-[#F5F5F5] rounded-2xl px-4 py-3 text-[#2D3436] text-base"
                        placeholder="请输入报价金额"
                        placeholderTextColor="#B2BEC3"
                        keyboardType="decimal-pad"
                        value={formData.quoted_price}
                        onChangeText={(text) => setFormData({ ...formData, quoted_price: text })}
                      />
                    </View>

                    {/* 工单状态（仅编辑时显示） */}
                    {editingOrder && (
                      <View className="mb-4">
                        <Text className="text-sm font-medium text-[#636E72] mb-2 ml-1">工单状态</Text>
                        <View className="flex-row gap-2">
                          {[
                            { label: '待处理', value: 'pending', color: '#FDCB6E' },
                            { label: '处理中', value: 'processing', color: '#6C63FF' },
                            { label: '已完成', value: 'completed', color: '#00B894' },
                          ].map((s) => (
                            <TouchableOpacity
                              key={s.value}
                              onPress={() => setEditingOrder(editingOrder ? { ...editingOrder, status: s.value } : null)}
                              className={`flex-1 py-3 rounded-2xl items-center ${editingOrder?.status === s.value ? 'bg-[#6C63FF]' : 'bg-[#F5F5F5]'}`}
                            >
                              <Text className={`text-sm font-medium ${editingOrder?.status === s.value ? 'text-white' : 'text-[#636E72]'}`}>{s.label}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    )}

                    {/* 操作按钮 */}
                    <View className="flex-row gap-3 mt-4 mb-6">
                      <TouchableOpacity
                        onPress={() => setModalVisible(false)}
                        className="flex-1 py-4 rounded-full items-center"
                        style={{ backgroundColor: '#F5F5F5' }}
                      >
                        <Text className="text-[#636E72] font-semibold text-base">取消</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={handleSave}
                        className="flex-1 py-4 rounded-full items-center"
                        style={{ backgroundColor: '#6C63FF' }}
                      >
                        <Text className="text-white font-semibold text-base">
                          {editingOrder ? '保存' : '创建'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </ScrollView>
                </View>
              </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
          </View>
        </Modal>
      )}
    </Screen>
  );
}
