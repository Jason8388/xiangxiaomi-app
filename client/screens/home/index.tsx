import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Screen } from '@/components/Screen';
import { FontAwesome6 } from '@expo/vector-icons';
import { useSafeRouter } from '@/hooks/useSafeRouter';

export default function HomeScreen() {
  const [stats, setStats] = useState({
    pending: 0,
    processing: 0,
    completed: 0,
    total: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const router = useSafeRouter();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // 获取工单统计
      const ordersRes = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/work-orders`);
      const ordersData = await ordersRes.json();

      if (Array.isArray(ordersData)) {
        const pending = ordersData.filter((o: any) => o.status === 'pending').length;
        const processing = ordersData.filter((o: any) => o.status === 'processing').length;
        const completed = ordersData.filter((o: any) => o.status === 'completed').length;

        setStats({
          pending,
          processing,
          completed,
          total: ordersData.length,
        });

        // 获取最近5条工单
        setRecentOrders(ordersData.slice(0, 5));
      }
    } catch (error) {
      console.error('Fetch data error:', error);
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

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high':
        return '高';
      case 'medium':
        return '中';
      case 'low':
        return '低';
      default:
        return priority;
    }
  };

  return (
    <Screen>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Header */}
        <View className="px-6 pt-8 pb-6">
          <Text className="text-3xl font-bold text-[#2D3436] mb-1">
            工作台
          </Text>
          <Text className="text-sm text-[#636E72]">
            高效管理售后服务业务
          </Text>
        </View>

        {/* 统计卡片 */}
        <View className="px-6 mb-6">
          <View
            className="rounded-3xl p-6 shadow-lg"
            style={{
              backgroundColor: '#F0F0F3',
              shadowColor: '#D1D9E6',
              shadowOffset: { width: 6, height: 6 },
              shadowOpacity: 0.7,
              shadowRadius: 8,
              elevation: 6,
            }}
          >
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-bold text-[#2D3436]">
                工单统计
              </Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/work-orders')}>
                <Text className="text-sm text-[#6C63FF] font-medium">
                  查看全部
                </Text>
              </TouchableOpacity>
            </View>
            <View className="flex-row justify-between">
              <View className="items-center">
                <View
                  className="w-16 h-16 rounded-full items-center justify-center mb-2"
                  style={{ backgroundColor: 'rgba(253, 203, 110, 0.2)' }}
                >
                  <Text className="text-2xl font-bold" style={{ color: '#FDCB6E' }}>
                    {stats.pending}
                  </Text>
                </View>
                <Text className="text-xs text-[#636E72]">待处理</Text>
              </View>
              <View className="items-center">
                <View
                  className="w-16 h-16 rounded-full items-center justify-center mb-2"
                  style={{ backgroundColor: 'rgba(108, 99, 255, 0.2)' }}
                >
                  <Text className="text-2xl font-bold" style={{ color: '#6C63FF' }}>
                    {stats.processing}
                  </Text>
                </View>
                <Text className="text-xs text-[#636E72]">处理中</Text>
              </View>
              <View className="items-center">
                <View
                  className="w-16 h-16 rounded-full items-center justify-center mb-2"
                  style={{ backgroundColor: 'rgba(0, 184, 148, 0.2)' }}
                >
                  <Text className="text-2xl font-bold" style={{ color: '#00B894' }}>
                    {stats.completed}
                  </Text>
                </View>
                <Text className="text-xs text-[#636E72]">已完成</Text>
              </View>
              <View className="items-center">
                <View
                  className="w-16 h-16 rounded-full items-center justify-center mb-2"
                  style={{ backgroundColor: 'rgba(108, 99, 255, 0.2)' }}
                >
                  <Text className="text-2xl font-bold" style={{ color: '#6C63FF' }}>
                    {stats.total}
                  </Text>
                </View>
                <Text className="text-xs text-[#636E72]">总计</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 快速入口 */}
        <View className="px-6 mb-6">
          <Text className="text-lg font-bold text-[#2D3436] mb-4">
            快速入口
          </Text>
          <View className="flex-row flex-wrap justify-between">
            <TouchableOpacity
              className="w-[47%] mb-4"
              style={{ marginHorizontal: '1.5%' }}
              onPress={() => router.push('/(tabs)/work-orders')}
            >
              <View
                className="rounded-3xl p-5 shadow-lg items-center"
                style={{
                  backgroundColor: '#F0F0F3',
                  shadowColor: '#D1D9E6',
                  shadowOffset: { width: 6, height: 6 },
                  shadowOpacity: 0.7,
                  shadowRadius: 8,
                  elevation: 6,
                }}
              >
                <View
                  className="w-12 h-12 rounded-full items-center justify-center mb-3"
                  style={{ backgroundColor: 'rgba(255, 101, 132, 0.12)' }}
                >
                  <FontAwesome6 name="user-plus" size={22} color="#FF6584" />
                </View>
                <Text className="text-sm font-semibold text-[#2D3436]">
                  新建工单
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              className="w-[47%] mb-4"
              style={{ marginHorizontal: '1.5%' }}
              onPress={() => router.push('/(tabs)/query')}
            >
              <View
                className="rounded-3xl p-5 shadow-lg items-center"
                style={{
                  backgroundColor: '#F0F0F3',
                  shadowColor: '#D1D9E6',
                  shadowOffset: { width: 6, height: 6 },
                  shadowOpacity: 0.7,
                  shadowRadius: 8,
                  elevation: 6,
                }}
              >
                <View
                  className="w-12 h-12 rounded-full items-center justify-center mb-3"
                  style={{ backgroundColor: 'rgba(0, 184, 148, 0.12)' }}
                >
                  <FontAwesome6 name="search" size={22} color="#00B894" />
                </View>
                <Text className="text-sm font-semibold text-[#2D3436]">
                  信息查询
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* 最近工单 */}
        <View className="px-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-bold text-[#2D3436]">
              最近工单
            </Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/work-orders')}>
              <Text className="text-sm text-[#6C63FF] font-medium">
                查看全部
              </Text>
            </TouchableOpacity>
          </View>

          {recentOrders.map((order: any) => (
            <TouchableOpacity
              key={order.id}
              onPress={() => router.push('/(tabs)/work-orders')}
              className="mb-4"
            >
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
                <View className="flex-row justify-between items-start mb-3">
                  <View className="flex-1">
                    <Text className="text-base font-bold text-[#2D3436] mb-1">
                      {order.customer_name}
                    </Text>
                    <Text className="text-sm text-[#636E72]">
                      {order.device_name}
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
                <View className="flex-row justify-between items-center">
                  <Text className="text-xs text-[#B2BEC3]">
                    {order.created_at?.split('T')[0] || ''}
                  </Text>
                  <View
                    className="px-2 py-1 rounded"
                    style={{ backgroundColor: `${getPriorityColor(order.priority)}33` }}
                  >
                    <Text
                      className="text-xs font-medium"
                      style={{ color: getPriorityColor(order.priority) }}
                    >
                      {getPriorityText(order.priority)}优先级
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}
