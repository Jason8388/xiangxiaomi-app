import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Screen } from '@/components/Screen';
import { FontAwesome6 } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { useSafeRouter } from '@/hooks/useSafeRouter';

export default function ProfileScreen() {
  const [user, setUser] = useState<any>(null);
  const router = useSafeRouter();

  useEffect(() => {
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    try {
      const userStr = await SecureStore.getItemAsync('user');
      if (userStr) {
        setUser(JSON.parse(userStr));
      }
    } catch (error) {
      console.error('Load user error:', error);
    }
  };

  const handleLogout = () => {
    Alert.alert('确认', '确定要退出登录吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '退出',
        style: 'destructive',
        onPress: async () => {
          try {
            await SecureStore.deleteItemAsync('user');
            await SecureStore.deleteItemAsync('token');
            router.replace('/login');
          } catch (error) {
            console.error('Logout error:', error);
          }
        },
      },
    ]);
  };

  const menuItems = [
    {
      icon: 'users',
      title: '客户管理',
      subtitle: '管理客户信息',
      color: '#6C63FF',
      onPress: () => router.push('/(tabs)/query'),
    },
    {
      icon: 'clipboard-list',
      title: '工单管理',
      subtitle: '查看和处理工单',
      color: '#FF6584',
      onPress: () => router.push('/(tabs)/work-orders'),
    },
    {
      icon: 'search',
      title: '信息查询',
      subtitle: '查询客户、设备、工单',
      color: '#00B894',
      onPress: () => router.push('/(tabs)/query'),
    },
    {
      icon: 'cog',
      title: '系统设置',
      subtitle: '应用配置',
      color: '#B2BEC3',
      onPress: () => Alert.alert('提示', '功能开发中'),
    },
    {
      icon: 'circle-info',
      title: '关于我们',
      subtitle: '版本信息',
      color: '#B2BEC3',
      onPress: () => Alert.alert('关于', '项小秘售后助手 v1.0.0'),
    },
  ];

  return (
    <Screen>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Header */}
        <View className="px-6 pt-8 pb-6">
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
            <View className="flex-row items-center mb-4">
              <View
                className="w-20 h-20 rounded-full items-center justify-center mr-4"
                style={{ backgroundColor: 'rgba(108, 99, 255, 0.12)' }}
              >
                <FontAwesome6 name="user" size={40} color="#6C63FF" />
              </View>
              <View className="flex-1">
                <Text className="text-2xl font-bold text-[#2D3436] mb-1">
                  {user?.name || '未登录'}
                </Text>
                <Text className="text-sm text-[#636E72]">
                  {user?.role === 'admin' ? '管理员' : '售后工程师'}
                </Text>
              </View>
            </View>
            {user && (
              <View className="flex-row gap-3">
                <View
                  className="flex-1 p-4 rounded-2xl items-center"
                  style={{ backgroundColor: 'rgba(108, 99, 255, 0.08)' }}
                >
                  <FontAwesome6 name="phone" size={20} color="#6C63FF" />
                  <Text className="text-xs text-[#636E72] mt-2">
                    {user.username}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* 功能菜单 */}
        <View className="px-6">
          <Text className="text-lg font-bold text-[#2D3436] mb-4">
            功能菜单
          </Text>

          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              onPress={item.onPress}
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
                <View className="flex-row items-center">
                  <View
                    className="w-12 h-12 rounded-full items-center justify-center"
                    style={{ backgroundColor: `${item.color}1E` }}
                  >
                    <FontAwesome6 name={item.icon as any} size={20} color={item.color} />
                  </View>
                  <View className="flex-1 ml-4">
                    <Text className="text-base font-bold text-[#2D3436] mb-1">
                      {item.title}
                    </Text>
                    <Text className="text-sm text-[#636E72]">
                      {item.subtitle}
                    </Text>
                  </View>
                  <FontAwesome6 name="chevron-right" size={18} color="#B2BEC3" />
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* 退出登录 */}
        <View className="px-6 mt-6">
          <TouchableOpacity
            onPress={handleLogout}
            className="py-4 rounded-full items-center"
            style={{ backgroundColor: '#FF6B6B' }}
          >
            <Text className="text-white font-bold text-base">退出登录</Text>
          </TouchableOpacity>
        </View>

        {/* 版本信息 */}
        <View className="px-6 mt-8 mb-6">
          <Text className="text-center text-xs text-[#B2BEC3]">
            项小秘售后助手 v1.0.0
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}
