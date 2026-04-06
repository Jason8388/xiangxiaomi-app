import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Screen } from '@/components/Screen';
import { PageHeader } from '@/components/PageHeader';
import { FontAwesome6 } from '@expo/vector-icons';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';

export default function WorkOrderDetailScreen() {
  const [order, setOrder] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useSafeRouter();
  const { id } = useSafeSearchParams<{ id: string }>();

  useEffect(() => {
    fetchOrderDetail();
  }, [id]);

  const fetchOrderDetail = async () => {
    try {
      const [orderRes, logsRes] = await Promise.all([
        fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/work-orders/${id}`),
        fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/work-orders/${id}/logs`),
      ]);

      const orderData = await orderRes.json();
      const logsData = await logsRes.json();

      setOrder(orderData);
      setLogs(Array.isArray(logsData) ? logsData : []);
    } catch (error) {
      console.error('Fetch order detail error:', error);
      Alert.alert('错误', '获取工单详情失败');
    } finally {
      setLoading(false);
    }
  };

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

  const formatTime = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  if (loading) {
    return (
      <Screen>
        <PageHeader title="工单详情" />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 14, color: '#636E72' }}>加载中...</Text>
        </View>
      </Screen>
    );
  }

  if (!order) {
    return (
      <Screen>
        <PageHeader title="工单详情" />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 14, color: '#636E72' }}>工单不存在</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <PageHeader title="工单详情" />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 24 }}
      >
        {/* 工单基本信息 */}
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 24,
            marginBottom: 16,
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <View>
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#2D3436', marginBottom: 4 }}>
                {order.order_no}
              </Text>
              <Text style={{ fontSize: 14, color: '#636E72' }}>
                {order.customer_name}
              </Text>
            </View>
            <View
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 12,
                backgroundColor: `${getStatusColor(order.status)}20`,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: 'bold', color: getStatusColor(order.status) }}>
                {getStatusText(order.status)}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
            <View
              style={{
                flex: 1,
                backgroundColor: 'rgba(0,0,0,0.02)',
                borderRadius: 8,
                padding: 12,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 12, color: '#B2BEC3', marginBottom: 4 }}>优先级</Text>
              <Text style={{ fontSize: 14, fontWeight: 'bold', color: getPriorityColor(order.priority) }}>
                {getPriorityText(order.priority)}
              </Text>
            </View>
            <View
              style={{
                flex: 1,
                backgroundColor: 'rgba(0,0,0,0.02)',
                borderRadius: 8,
                padding: 12,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 12, color: '#B2BEC3', marginBottom: 4 }}>类型</Text>
              <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#2D3436' }}>
                {order.type}
              </Text>
            </View>
          </View>

          <View style={{ borderTopWidth: 1, borderTopColor: '#DFE6E9', paddingTop: 16 }}>
            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: 12, color: '#B2BEC3', marginBottom: 4 }}>客户联系人</Text>
              <Text style={{ fontSize: 14, color: '#2D3436' }}>{order.customer_contact || '-'}</Text>
            </View>
            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: 12, color: '#B2BEC3', marginBottom: 4 }}>联系电话</Text>
              <Text style={{ fontSize: 14, color: '#2D3436' }}>{order.customer_phone || '-'}</Text>
            </View>
            <View>
              <Text style={{ fontSize: 12, color: '#B2BEC3', marginBottom: 4 }}>服务地址</Text>
              <Text style={{ fontSize: 14, color: '#2D3436' }}>{order.address || '-'}</Text>
            </View>
          </View>
        </View>

        {/* 设备信息 */}
        {order.device_name && (
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              padding: 24,
              marginBottom: 16,
              shadowColor: '#000000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <FontAwesome6 name="box" size={20} color="#1E88E5" style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#2D3436' }}>
                设备信息
              </Text>
            </View>
            <View style={{ marginBottom: 8 }}>
              <Text style={{ fontSize: 12, color: '#B2BEC3', marginBottom: 4 }}>设备名称</Text>
              <Text style={{ fontSize: 14, color: '#2D3436' }}>{order.device_name}</Text>
            </View>
            {order.serial_number && (
              <View>
                <Text style={{ fontSize: 12, color: '#B2BEC3', marginBottom: 4 }}>序列号</Text>
                <Text style={{ fontSize: 14, color: '#2D3436' }}>{order.serial_number}</Text>
              </View>
            )}
          </View>
        )}

        {/* 故障描述 */}
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 24,
            marginBottom: 16,
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <FontAwesome6 name="triangle-exclamation" size={20} color="#FDCB6E" style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#2D3436' }}>
              故障描述
            </Text>
          </View>
          <Text style={{ fontSize: 14, color: '#2D3436', lineHeight: 24 }}>
            {order.description || '暂无描述'}
          </Text>
        </View>

        {/* 处理记录 */}
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 24,
            marginBottom: 120,
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <FontAwesome6 name="clock-rotate-left" size={20} color="#1E88E5" style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#2D3436' }}>
              处理记录
            </Text>
          </View>

          {logs.length === 0 ? (
            <Text style={{ fontSize: 14, color: '#636E72', textAlign: 'center', paddingVertical: 20 }}>
              暂无处理记录
            </Text>
          ) : (
            logs.map((log, index) => (
              <View
                key={log.id}
                style={{
                  flexDirection: 'row',
                  marginBottom: index < logs.length - 1 ? 16 : 0,
                  paddingBottom: index < logs.length - 1 ? 16 : 0,
                  borderBottomWidth: index < logs.length - 1 ? 1 : 0,
                  borderBottomColor: '#F0F0F0',
                }}
              >
                <View style={{ marginRight: 12 }}>
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: 'rgba(30, 136, 229, 0.1)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <FontAwesome6 name="user" size={18} color="#1E88E5" />
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#2D3436' }}>
                      {log.operator_name || '系统'}
                    </Text>
                    <Text style={{ fontSize: 12, color: '#B2BEC3' }}>
                      {formatDate(log.created_at)} {formatTime(log.created_at)}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 14, color: '#636E72' }}>
                    {log.action}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}
