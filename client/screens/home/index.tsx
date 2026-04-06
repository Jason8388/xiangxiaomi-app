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

    fetchData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#FDCB6E';
      case 'processing':
        return '#1E88E5';
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

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return (
    <Screen>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Header */}
        <View style={{ paddingHorizontal: 24, paddingTop: 32, paddingBottom: 24 }}>
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#2D3436', marginBottom: 4 }}>
            工作台
          </Text>
          <Text style={{ fontSize: 14, color: '#636E72' }}>
            高效管理售后服务业务
          </Text>
        </View>

        {/* 统计卡片 */}
        <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              padding: 24,
              shadowColor: '#000000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#2D3436' }}>
                工单统计
              </Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/work-orders')}>
                <Text style={{ fontSize: 14, color: '#1E88E5', fontWeight: '600' }}>
                  查看全部
                </Text>
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ alignItems: 'center' }}>
                <View
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 8,
                    backgroundColor: 'rgba(253, 203, 110, 0.15)',
                  }}
                >
                  <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#FDCB6E' }}>
                    {stats.pending}
                  </Text>
                </View>
                <Text style={{ fontSize: 12, color: '#636E72' }}>待处理</Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <View
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 8,
                    backgroundColor: 'rgba(30, 136, 229, 0.15)',
                  }}
                >
                  <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1E88E5' }}>
                    {stats.processing}
                  </Text>
                </View>
                <Text style={{ fontSize: 12, color: '#636E72' }}>处理中</Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <View
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 8,
                    backgroundColor: 'rgba(0, 184, 148, 0.15)',
                  }}
                >
                  <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#00B894' }}>
                    {stats.completed}
                  </Text>
                </View>
                <Text style={{ fontSize: 12, color: '#636E72' }}>已完成</Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <View
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 8,
                    backgroundColor: 'rgba(30, 136, 229, 0.15)',
                  }}
                >
                  <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1E88E5' }}>
                    {stats.total}
                  </Text>
                </View>
                <Text style={{ fontSize: 12, color: '#636E72' }}>总计</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 快速入口 */}
        <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#2D3436', marginBottom: 16 }}>
            快速入口
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            <TouchableOpacity
              style={{ width: '48%', marginBottom: 16, marginHorizontal: '1%' }}
              onPress={() => router.push('/(tabs)/work-orders')}
            >
              <View
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 16,
                  padding: 20,
                  alignItems: 'center',
                  shadowColor: '#000000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.08,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 12,
                    backgroundColor: 'rgba(30, 136, 229, 0.1)',
                  }}
                >
                  <FontAwesome6 name="plus" size={22} color="#1E88E5" />
                </View>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#2D3436' }}>
                  新建工单
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ width: '48%', marginBottom: 16, marginHorizontal: '1%' }}
              onPress={() => router.push('/(tabs)/query')}
            >
              <View
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 16,
                  padding: 20,
                  alignItems: 'center',
                  shadowColor: '#000000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.08,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 12,
                    backgroundColor: 'rgba(0, 184, 148, 0.1)',
                  }}
                >
                  <FontAwesome6 name="magnifying-glass" size={22} color="#00B894" />
                </View>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#2D3436' }}>
                  信息查询
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ width: '48%', marginHorizontal: '1%' }}
              onPress={() => router.push('/(tabs)/knowledge')}
            >
              <View
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 16,
                  padding: 20,
                  alignItems: 'center',
                  shadowColor: '#000000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.08,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 12,
                    backgroundColor: 'rgba(253, 203, 110, 0.1)',
                  }}
                >
                  <FontAwesome6 name="book" size={22} color="#FDCB6E" />
                </View>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#2D3436' }}>
                  知识库
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* 最近工单 */}
        <View style={{ paddingHorizontal: 24 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#2D3436' }}>
              最近工单
            </Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/work-orders')}>
              <Text style={{ fontSize: 14, color: '#1E88E5', fontWeight: '600' }}>
                查看全部
              </Text>
            </TouchableOpacity>
          </View>

          {recentOrders.map((order: any) => (
            <TouchableOpacity
              key={order.id}
              onPress={() => router.push('/(tabs)/work-orders')}
              style={{ marginBottom: 16 }}
            >
              <View
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 16,
                  padding: 20,
                  shadowColor: '#000000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.08,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#2D3436', marginBottom: 4 }}>
                      {order.customer_name}
                    </Text>
                    <Text style={{ fontSize: 14, color: '#636E72' }}>
                      {order.device_name}
                    </Text>
                  </View>
                  <View
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 4,
                      borderRadius: 12,
                      backgroundColor: `${getStatusColor(order.status)}20`,
                    }}
                  >
                    <Text
                      style={{ fontSize: 12, fontWeight: '600', color: getStatusColor(order.status) }}
                    >
                      {getStatusText(order.status)}
                    </Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 12, color: '#B2BEC3' }}>
                    {formatDate(order.created_at)}
                  </Text>
                  <View
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 8,
                      backgroundColor: `${getPriorityColor(order.priority)}20`,
                    }}
                  >
                    <Text
                      style={{ fontSize: 12, fontWeight: '600', color: getPriorityColor(order.priority) }}
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
