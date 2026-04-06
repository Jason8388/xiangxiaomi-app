import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Screen } from '@/components/Screen';
import { FontAwesome6 } from '@expo/vector-icons';

export default function QueryScreen() {
  const [searchText, setSearchText] = useState('');
  const [searchType, setSearchType] = useState<'customers' | 'devices' | 'work_orders'>('customers');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchText.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const endpoint = `/api/v1/${searchType}`;
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}${endpoint}`);
      const data = await response.json();

      if (Array.isArray(data)) {
        const filtered = data.filter((item: any) => {
          const searchLower = searchText.toLowerCase();
          if (searchType === 'customers') {
            return (
              item.name?.toLowerCase().includes(searchLower) ||
              item.contact?.toLowerCase().includes(searchLower) ||
              item.phone?.includes(searchLower)
            );
          } else if (searchType === 'devices') {
            return (
              item.device_name?.toLowerCase().includes(searchLower) ||
              item.serial_no?.toLowerCase().includes(searchLower) ||
              item.model?.toLowerCase().includes(searchLower)
            );
          } else if (searchType === 'work_orders') {
            return (
              item.order_no?.toLowerCase().includes(searchLower) ||
              item.customer_name?.toLowerCase().includes(searchLower) ||
              item.description?.toLowerCase().includes(searchLower)
            );
          }
          return false;
        });
        setResults(filtered);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderCustomerItem = (item: any) => (
    <View
      key={item.id}
      className="rounded-3xl p-5 shadow-lg mb-4"
      style={{
        backgroundColor: '#F0F0F3',
        shadowColor: '#D1D9E6',
        shadowOffset: { width: 6, height: 6 },
        shadowOpacity: 0.7,
        shadowRadius: 8,
        elevation: 6,
      }}
    >
      <View className="flex-row items-center mb-3">
        <View
          className="w-12 h-12 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: 'rgba(108, 99, 255, 0.12)' }}
        >
          <FontAwesome6 name="building" size={20} color="#6C63FF" />
        </View>
        <View className="flex-1">
          <Text className="text-base font-bold text-[#2D3436] mb-1">
            {item.name}
          </Text>
          {item.contact && (
            <Text className="text-sm text-[#636E72]">
              联系人：{item.contact}
            </Text>
          )}
        </View>
      </View>
      {item.phone && (
        <View className="flex-row items-center mb-2">
          <FontAwesome6 name="phone" size={14} color="#B2BEC3" />
          <Text className="text-sm text-[#636E72] ml-2">
            {item.phone}
          </Text>
        </View>
      )}
      {item.address && (
        <View className="flex-row items-start">
          <FontAwesome6 name="location-dot" size={14} color="#B2BEC3" />
          <Text className="text-sm text-[#636E72] ml-2 flex-1">
            {item.address}
          </Text>
        </View>
      )}
    </View>
  );

  const renderDeviceItem = (item: any) => (
    <View
      key={item.id}
      className="rounded-3xl p-5 shadow-lg mb-4"
      style={{
        backgroundColor: '#F0F0F3',
        shadowColor: '#D1D9E6',
        shadowOffset: { width: 6, height: 6 },
        shadowOpacity: 0.7,
        shadowRadius: 8,
        elevation: 6,
      }}
    >
      <View className="flex-row items-center mb-3">
        <View
          className="w-12 h-12 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: 'rgba(0, 184, 148, 0.12)' }}
        >
          <FontAwesome6 name="microchip" size={20} color="#00B894" />
        </View>
        <View className="flex-1">
          <Text className="text-base font-bold text-[#2D3436] mb-1">
            {item.device_name}
          </Text>
          {item.model && (
            <Text className="text-sm text-[#636E72]">
              型号：{item.model}
            </Text>
          )}
        </View>
      </View>
      {item.serial_no && (
        <View className="flex-row items-center mb-2">
          <FontAwesome6 name="barcode" size={14} color="#B2BEC3" />
          <Text className="text-sm text-[#636E72] ml-2">
            序列号：{item.serial_no}
          </Text>
        </View>
      )}
      {item.customer_name && (
        <View className="flex-row items-center mb-2">
          <FontAwesome6 name="building" size={14} color="#B2BEC3" />
          <Text className="text-sm text-[#636E72] ml-2">
            所属客户：{item.customer_name}
          </Text>
        </View>
      )}
      <View className="flex-row gap-2 mt-3">
        <View
          className="px-3 py-1 rounded-full"
          style={{ backgroundColor: `${item.status === 'normal' ? '#00B894' : '#FF6B6B'}33` }}
        >
          <Text
            className="text-xs font-semibold"
            style={{ color: item.status === 'normal' ? '#00B894' : '#FF6B6B' }}
          >
            {item.status === 'normal' ? '正常' : '维修中'}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderWorkOrderItem = (item: any) => {
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

    return (
      <View
        key={item.id}
        className="rounded-3xl p-5 shadow-lg mb-4"
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
              {item.customer_name}
            </Text>
            <Text className="text-sm text-[#636E72] mb-1">
              {item.device_name || '未指定设备'}
            </Text>
            <Text className="text-xs text-[#B2BEC3]">
              {item.type} · {item.order_no}
            </Text>
          </View>
          <View
            className="px-3 py-1 rounded-full"
            style={{ backgroundColor: `${getStatusColor(item.status)}33` }}
          >
            <Text
              className="text-xs font-semibold"
              style={{ color: getStatusColor(item.status) }}
            >
              {getStatusText(item.status)}
            </Text>
          </View>
        </View>
        {item.description && (
          <Text className="text-sm text-[#636E72] mb-3" numberOfLines={2}>
            {item.description}
          </Text>
        )}
        <Text className="text-xs text-[#B2BEC3]">
          创建时间：{item.created_at?.split('T')[0] || ''}
        </Text>
      </View>
    );
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
            查询
          </Text>
          <Text className="text-sm text-[#636E72]">
            快速查询客户、设备、工单信息
          </Text>
        </View>

        {/* 搜索类型选择 */}
        <View className="px-6 mb-4 flex-row gap-2">
          <TouchableOpacity
            onPress={() => setSearchType('customers')}
            className={`flex-1 py-3 rounded-2xl items-center ${searchType === 'customers' ? 'bg-[#6C63FF]' : 'bg-[#E8E8EB]'}`}
          >
            <FontAwesome6
              name="users"
              size={20}
              color={searchType === 'customers' ? '#FFFFFF' : '#636E72'}
            />
            <Text className={`text-sm font-medium mt-1 ${searchType === 'customers' ? 'text-white' : 'text-[#636E72]'}`}>
              客户
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSearchType('devices')}
            className={`flex-1 py-3 rounded-2xl items-center ${searchType === 'devices' ? 'bg-[#6C63FF]' : 'bg-[#E8E8EB]'}`}
          >
            <FontAwesome6
              name="microchip"
              size={20}
              color={searchType === 'devices' ? '#FFFFFF' : '#636E72'}
            />
            <Text className={`text-sm font-medium mt-1 ${searchType === 'devices' ? 'text-white' : 'text-[#636E72]'}`}>
              设备
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSearchType('work_orders')}
            className={`flex-1 py-3 rounded-2xl items-center ${searchType === 'work_orders' ? 'bg-[#6C63FF]' : 'bg-[#E8E8EB]'}`}
          >
            <FontAwesome6
              name="clipboard-list"
              size={20}
              color={searchType === 'work_orders' ? '#FFFFFF' : '#636E72'}
            />
            <Text className={`text-sm font-medium mt-1 ${searchType === 'work_orders' ? 'text-white' : 'text-[#636E72]'}`}>
              工单
            </Text>
          </TouchableOpacity>
        </View>

        {/* 搜索框 */}
        <View className="px-6 mb-4">
          <View
            className="bg-[#E8E8EB] rounded-2xl px-4 py-3 flex-row items-center"
            style={{ borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)' }}
          >
            <FontAwesome6 name="magnifying-glass" size={18} color="#B2BEC3" />
            <TextInput
              className="flex-1 ml-3 text-[#2D3436] text-base"
              placeholder={
                searchType === 'customers'
                  ? '搜索客户名称、联系人、电话...'
                  : searchType === 'devices'
                  ? '搜索设备名称、序列号、型号...'
                  : '搜索工单号、客户、描述...'
              }
              placeholderTextColor="#B2BEC3"
              value={searchText}
              onChangeText={setSearchText}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            <TouchableOpacity
              onPress={handleSearch}
              disabled={loading}
              className="p-2"
            >
              <FontAwesome6
                name="magnifying-glass"
                size={18}
                color={loading ? '#B2BEC3' : '#6C63FF'}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* 搜索结果 */}
        <View className="px-6">
          {loading ? (
            <Text className="text-center text-[#636E72] py-8">
              搜索中...
            </Text>
          ) : searchText && results.length === 0 ? (
            <Text className="text-center text-[#636E72] py-8">
              未找到相关结果
            </Text>
          ) : !searchText ? (
            <Text className="text-center text-[#B2BEC3] py-8">
              请输入关键词开始搜索
            </Text>
          ) : (
            results.map((item) => {
              if (searchType === 'customers') {
                return renderCustomerItem(item);
              } else if (searchType === 'devices') {
                return renderDeviceItem(item);
              } else if (searchType === 'work_orders') {
                return renderWorkOrderItem(item);
              }
              return null;
            })
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}
