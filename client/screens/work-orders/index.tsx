import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { Screen } from '@/components/Screen';
import { FontAwesome6 } from '@expo/vector-icons';
import { useSafeRouter } from '@/hooks/useSafeRouter';

export default function WorkOrdersScreen() {
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    customer_id: '',
    device_id: '',
    type: '维修',
    priority: 'normal',
    description: '',
  });
  const router = useSafeRouter();

  useEffect(() => {
    fetchWorkOrders();
    fetchCustomers();
    fetchDevices();
  }, []);

  useEffect(() => {
    let filtered = workOrders;

    // 状态筛选
    if (filterStatus !== 'all') {
      filtered = filtered.filter((order) => order.status === filterStatus);
    }

    // 搜索筛选
    if (searchKeyword.trim()) {
      const keyword = searchKeyword.toLowerCase();
      filtered = filtered.filter(
        (order) =>
          (order.order_no && order.order_no.toLowerCase().includes(keyword)) ||
          (order.description && order.description.toLowerCase().includes(keyword)) ||
          (order.customer_name && order.customer_name.toLowerCase().includes(keyword))
      );
    }

    setFilteredOrders(filtered);
  }, [filterStatus, searchKeyword, workOrders]);

  const fetchWorkOrders = async () => {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/work-orders`);
      const data = await response.json();
      if (Array.isArray(data)) {
        setWorkOrders(data);
      }
    } catch (error) {
      console.error('Fetch work orders error:', error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/customers`);
      const data = await response.json();
      if (Array.isArray(data)) {
        setCustomers(data);
      }
    } catch (error) {
      console.error('Fetch customers error:', error);
    }
  };

  const fetchDevices = async () => {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/devices`);
      const data = await response.json();
      if (Array.isArray(data)) {
        setDevices(data);
      }
    } catch (error) {
      console.error('Fetch devices error:', error);
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
    });
    setModalVisible(true);
  };

  const handleEdit = (order: any) => {
    setEditingOrder(order);
    setFormData({
      customer_id: order.customer_id?.toString() || '',
      device_id: order.device_id?.toString() || '',
      type: order.type || '维修',
      priority: order.priority || 'normal',
      description: order.description || '',
    });
    setModalVisible(true);
  };

  const handleDelete = (order: any) => {
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
              fetchWorkOrders();
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

  const handleSave = async () => {
    if (!formData.customer_id || !formData.description) {
      Alert.alert('提示', '请填写完整信息');
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
              }),
            }
          )
        : await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/work-orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...formData,
              customer_id: parseInt(formData.customer_id),
              device_id: formData.device_id ? parseInt(formData.device_id) : null,
              order_no: `WO${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(4, '0')}${String(new Date().getDate()).padStart(2, '0')}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
              status: 'pending',
              assignee_id: 2,
              created_by: 2,
            }),
          });

      if (!response.ok) {
        throw new Error(editingOrder ? '更新失败' : '创建失败');
      }

      setModalVisible(false);
      fetchWorkOrders();
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
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Header */}
        <View className="px-6 pt-8 pb-4">
          <Text className="text-3xl font-bold text-[#2D3436] mb-2">
            工单管理
          </Text>
          <Text className="text-sm text-[#636E72]">
            共 {workOrders.length} 个工单
          </Text>
        </View>

        {/* 搜索栏 */}
        <View className="px-6 mb-4">
          <View className="flex-row items-center bg-[#E8E8EB] rounded-2xl px-4 py-3">
            <FontAwesome6 name="magnifying-glass" size={16} color="#636E72" />
            <TextInput
              className="flex-1 ml-2 text-[#2D3436] text-base"
              placeholder="搜索工单编号、工单名称、客户"
              placeholderTextColor="#B2BEC3"
              value={searchKeyword}
              onChangeText={setSearchKeyword}
            />
          </View>
        </View>

        {/* 筛选按钮 */}
        <View className="px-6 mb-4 flex-row gap-2">
          <TouchableOpacity
            onPress={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-full ${filterStatus === 'all' ? 'bg-[#6C63FF]' : 'bg-[#E8E8EB]'}`}
          >
            <Text className={`text-sm font-medium ${filterStatus === 'all' ? 'text-white' : 'text-[#636E72]'}`}>
              全部
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setFilterStatus('pending')}
            className={`px-4 py-2 rounded-full ${filterStatus === 'pending' ? 'bg-[#6C63FF]' : 'bg-[#E8E8EB]'}`}
          >
            <Text className={`text-sm font-medium ${filterStatus === 'pending' ? 'text-white' : 'text-[#636E72]'}`}>
              待处理
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setFilterStatus('processing')}
            className={`px-4 py-2 rounded-full ${filterStatus === 'processing' ? 'bg-[#6C63FF]' : 'bg-[#E8E8EB]'}`}
          >
            <Text className={`text-sm font-medium ${filterStatus === 'processing' ? 'text-white' : 'text-[#636E72]'}`}>
              处理中
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setFilterStatus('completed')}
            className={`px-4 py-2 rounded-full ${filterStatus === 'completed' ? 'bg-[#6C63FF]' : 'bg-[#E8E8EB]'}`}
          >
            <Text className={`text-sm font-medium ${filterStatus === 'completed' ? 'text-white' : 'text-[#636E72]'}`}>
              已完成
            </Text>
          </TouchableOpacity>
        </View>

        {/* 工单列表 */}
        <View className="px-6">
          {filteredOrders.map((order) => (
            <View key={order.id} className="mb-4">
              <View
                className="rounded-3xl p-5 shadow-lg"
                style={{
                  backgroundColor: '#F0F0F3',
                  shadowColor: '#D1D9E6',
                  shadowOffset: { width: 6, height: 6 },
                  shadowOpacity: 0.7,
                  shadowRadius: 8,
                  elevation: 6,
                }}
              >
                {/* 卡片头部 */}
                <View className="flex-row justify-between items-start mb-3">
                  <View className="flex-1">
                    <Text className="text-base font-bold text-[#2D3436] mb-1">
                      {order.description || '无描述'}
                    </Text>
                    <Text className="text-xs text-[#636E72] mb-1">
                      {order.order_no}
                    </Text>
                  </View>
                  <View
                    className="px-3 py-1 rounded-full"
                    style={{ backgroundColor: `${getStatusColor(order.status)}33` }}
                  >
                    <Text
                      className="text-xs font-semibold"
                      style={{ color: getStatusColor(order.status) }}
                    >
                      {getStatusText(order.status)}
                    </Text>
                  </View>
                </View>

                {/* 卡片信息 */}
                <View className="mb-3">
                  <View className="flex-row items-center mb-2">
                    <FontAwesome6 name="building" size={14} color="#636E72" />
                    <Text className="text-sm text-[#636E72] ml-2">
                      {order.customer_name || '未指定客户'}
                    </Text>
                  </View>
                  <View className="flex-row items-center mb-2">
                    <FontAwesome6 name="user" size={14} color="#636E72" />
                    <Text className="text-sm text-[#636E72] ml-2">
                      {order.creator_name || order.assignee_name || '系统'}
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <FontAwesome6 name="calendar" size={14} color="#636E72" />
                    <Text className="text-sm text-[#636E72] ml-2">
                      {order.created_at?.split('T')[0] || ''}
                    </Text>
                  </View>
                </View>

                {/* 操作按钮 */}
                <View className="flex-row justify-between items-center">
                  <View className="flex-row gap-2">
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        handleEdit(order);
                      }}
                      className="px-3 py-1.5 rounded-full bg-[#F39C12]"
                    >
                      <Text className="text-xs text-white font-medium">修改</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDelete(order);
                      }}
                      className="px-3 py-1.5 rounded-full bg-[#E74C3C]"
                    >
                      <Text className="text-xs text-white font-medium">删除</Text>
                    </TouchableOpacity>
                  </View>
                  <View className="flex-row gap-2">
                    <View
                      className="px-2 py-1 rounded"
                      style={{ backgroundColor: `${getPriorityColor(order.priority)}33` }}
                    >
                      <Text
                        className="text-xs font-medium"
                        style={{ color: getPriorityColor(order.priority) }}
                      >
                        {order.priority === 'high' ? '高' : order.priority === 'medium' ? '中' : '低'}优先级
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* 详情跳转 */}
              <TouchableOpacity
                onPress={() => router.push('/work-order-detail', { id: order.id })}
                className="mt-2"
              >
                <Text className="text-xs text-[#6C63FF] text-center">查看详情 →</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* 新增按钮 */}
      <TouchableOpacity
        onPress={handleAdd}
        className="absolute bottom-6 right-6"
        style={{
          width: 60,
          height: 60,
          borderRadius: 30,
          backgroundColor: '#6C63FF',
          justifyContent: 'center',
          alignItems: 'center',
          shadowColor: '#6C63FF',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.35,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <FontAwesome6 name="plus" size={26} color="#FFFFFF" />
      </TouchableOpacity>

      {/* 新增工单 Modal */}
      {modalVisible && (
        <Modal visible={modalVisible} transparent animationType="slide">
          <View className="flex-1 bg-black/50 justify-center items-center px-6">
            <ScrollView
              className="w-full"
              contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
            >
              <View
                className="w-full rounded-3xl p-6"
                style={{ backgroundColor: '#F0F0F3' }}
              >
                <Text className="text-xl font-bold text-[#2D3436] mb-6">
                  {editingOrder ? '编辑工单' : '新建工单'}
                </Text>

                <View className="mb-4">
                  <Text className="text-sm font-medium text-[#636E72] mb-2 ml-1">
                    客户 *
                  </Text>
                  <View className="bg-[#E8E8EB] rounded-2xl px-4 py-3">
                    <TextInput
                      className="text-[#2D3436] text-base"
                      placeholder="选择客户"
                      placeholderTextColor="#B2BEC3"
                      value={customers.find(c => c.id === parseInt(formData.customer_id))?.name || ''}
                      editable={false}
                    />
                  </View>
                  <View>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      className="mt-2"
                    >
                      {customers.map((customer) => (
                        <TouchableOpacity
                          key={customer.id}
                          onPress={() => setFormData({ ...formData, customer_id: customer.id.toString() })}
                          className={`px-4 py-2 rounded-full mr-2 ${formData.customer_id === customer.id.toString() ? 'bg-[#6C63FF]' : 'bg-[#E8E8EB]'}`}
                        >
                          <Text className={`text-sm ${formData.customer_id === customer.id.toString() ? 'text-white' : 'text-[#636E72]'}`}>
                            {customer.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>

                <View className="mb-4">
                  <Text className="text-sm font-medium text-[#636E72] mb-2 ml-1">
                    设备
                  </Text>
                  <View className="bg-[#E8E8EB] rounded-2xl px-4 py-3">
                    <TextInput
                      className="text-[#2D3436] text-base"
                      placeholder="选择设备"
                      placeholderTextColor="#B2BEC3"
                      value={devices.find(d => d.id === parseInt(formData.device_id))?.device_name || ''}
                      editable={false}
                    />
                  </View>
                  <View>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      className="mt-2"
                    >
                      {devices
                        .filter(d => !formData.customer_id || d.customer_id === parseInt(formData.customer_id))
                        .map((device) => (
                          <TouchableOpacity
                            key={device.id}
                            onPress={() => setFormData({ ...formData, device_id: device.id.toString() })}
                            className={`px-4 py-2 rounded-full mr-2 ${formData.device_id === device.id.toString() ? 'bg-[#6C63FF]' : 'bg-[#E8E8EB]'}`}
                          >
                            <Text className={`text-sm ${formData.device_id === device.id.toString() ? 'text-white' : 'text-[#636E72]'}`}>
                              {device.device_name}
                            </Text>
                          </TouchableOpacity>
                        ))}
                    </ScrollView>
                  </View>
                </View>

                <View className="mb-4">
                  <Text className="text-sm font-medium text-[#636E72] mb-2 ml-1">
                    工单类型
                  </Text>
                  <View className="flex-row gap-2">
                    {['维修', '保养', '安装', '其他'].map((type) => (
                      <TouchableOpacity
                        key={type}
                        onPress={() => setFormData({ ...formData, type })}
                        className={`flex-1 py-3 rounded-2xl items-center ${formData.type === type ? 'bg-[#6C63FF]' : 'bg-[#E8E8EB]'}`}
                      >
                        <Text className={`text-sm font-medium ${formData.type === type ? 'text-white' : 'text-[#636E72]'}`}>
                          {type}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View className="mb-4">
                  <Text className="text-sm font-medium text-[#636E72] mb-2 ml-1">
                    优先级
                  </Text>
                  <View className="flex-row gap-2">
                    {[
                      { label: '低', value: 'low' },
                      { label: '中', value: 'normal' },
                      { label: '高', value: 'high' },
                    ].map((priority) => (
                      <TouchableOpacity
                        key={priority.value}
                        onPress={() => setFormData({ ...formData, priority: priority.value })}
                        className={`flex-1 py-3 rounded-2xl items-center ${formData.priority === priority.value ? 'bg-[#6C63FF]' : 'bg-[#E8E8EB]'}`}
                      >
                        <Text className={`text-sm font-medium ${formData.priority === priority.value ? 'text-white' : 'text-[#636E72]'}`}>
                          {priority.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View className="mb-6">
                  <Text className="text-sm font-medium text-[#636E72] mb-2 ml-1">
                    问题描述 *
                  </Text>
                  <TextInput
                    className="w-full bg-[#E8E8EB] rounded-2xl px-4 py-3 text-[#2D3436] text-base"
                    placeholder="请详细描述问题"
                    placeholderTextColor="#B2BEC3"
                    value={formData.description}
                    onChangeText={(text) => setFormData({ ...formData, description: text })}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>

                <View className="flex-row gap-3">
                  <TouchableOpacity
                    onPress={() => setModalVisible(false)}
                    className="flex-1 py-4 rounded-full items-center"
                    style={{ backgroundColor: '#E8E8EB' }}
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
              </View>
            </ScrollView>
          </View>
        </Modal>
      )}
    </Screen>
  );
}
