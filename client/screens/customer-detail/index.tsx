import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Screen } from '@/components/Screen';
import { PageHeader } from '@/components/PageHeader';
import { FontAwesome6 } from '@expo/vector-icons';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';

export default function CustomerDetailScreen() {
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useSafeRouter();
  const { id } = useSafeSearchParams<{ id: string }>();

  useEffect(() => {
    fetchCustomer();
  }, [id]);

  const fetchCustomer = async () => {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/customers/${id}`);
      const data = await response.json();
      setCustomer(data);
    } catch (error) {
      console.error('Fetch customer error:', error);
      Alert.alert('错误', '获取客户信息失败');
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <Screen>
        <PageHeader title="客户详情" />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 14, color: '#636E72' }}>加载中...</Text>
        </View>
      </Screen>
    );
  }

  if (!customer) {
    return (
      <Screen>
        <PageHeader title="客户详情" />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 14, color: '#636E72' }}>客户不存在</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <PageHeader title="客户详情" />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 24 }}
      >
        {/* 客户基本信息卡片 */}
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
          <View style={{ alignItems: 'center', marginBottom: 20 }}>
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: 'rgba(30, 136, 229, 0.1)',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
              }}
            >
              <FontAwesome6 name="building" size={36} color="#1E88E5" />
            </View>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#2D3436', marginBottom: 4 }}>
              {customer.name}
            </Text>
            <Text style={{ fontSize: 14, color: '#636E72' }}>
              客户编号: #{customer.id}
            </Text>
          </View>

          <View style={{ borderTopWidth: 1, borderTopColor: '#DFE6E9', paddingTop: 20 }}>
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 12, color: '#B2BEC3', marginBottom: 8 }}>联系人</Text>
              <Text style={{ fontSize: 14, color: '#2D3436' }}>{customer.contact || '-'}</Text>
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 12, color: '#B2BEC3', marginBottom: 8 }}>联系电话</Text>
              <Text style={{ fontSize: 14, color: '#2D3436' }}>{customer.phone || '-'}</Text>
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 12, color: '#B2BEC3', marginBottom: 8 }}>地址</Text>
              <Text style={{ fontSize: 14, color: '#2D3436' }}>{customer.address || '-'}</Text>
            </View>

            <View>
              <Text style={{ fontSize: 12, color: '#B2BEC3', marginBottom: 8 }}>创建时间</Text>
              <Text style={{ fontSize: 14, color: '#2D3436' }}>{formatDate(customer.created_at)}</Text>
            </View>
          </View>
        </View>

        {/* 关联设备 */}
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
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <FontAwesome6 name="box" size={20} color="#1E88E5" style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#2D3436' }}>
              关联设备
            </Text>
          </View>
          <Text style={{ fontSize: 14, color: '#636E72' }}>
            暂无设备信息
          </Text>
        </View>

        {/* 关联工单 */}
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 24,
            marginTop: 16,
            marginBottom: 120,
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <FontAwesome6 name="clipboard-list" size={20} color="#1E88E5" style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#2D3436' }}>
              服务记录
            </Text>
          </View>
          <Text style={{ fontSize: 14, color: '#636E72' }}>
            暂无服务记录
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}
