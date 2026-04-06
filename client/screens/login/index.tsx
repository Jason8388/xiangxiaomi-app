import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Screen } from '@/components/Screen';
import * as SecureStore from 'expo-secure-store';
import { useSafeRouter } from '@/hooks/useSafeRouter';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useSafeRouter();

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('提示', '请输入用户名和密码');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '登录失败');
      }

      // 保存用户信息
      await SecureStore.setItemAsync('user', JSON.stringify(data.user));
      await SecureStore.setItemAsync('token', 'mock_token');

      Alert.alert('成功', '登录成功', [
        {
          text: '确定',
          onPress: () => router.replace('/(tabs)')
        }
      ]);
    } catch (error: any) {
      Alert.alert('错误', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View className="flex-1 justify-center items-center px-8">
          <View className="mb-12">
            <Text className="text-4xl font-bold text-[#6C63FF] text-center mb-2">
              项小秘
            </Text>
            <Text className="text-xl text-[#636E72] text-center">
              售后助手
            </Text>
          </View>

          <View className="w-full mb-4">
            <Text className="text-sm font-medium text-[#636E72] mb-2 ml-1">
              用户名
            </Text>
            <TextInput
              className="w-full bg-[#E8E8EB] rounded-2xl px-4 py-4 text-[#2D3436] text-base"
              placeholder="请输入用户名"
              placeholderTextColor="#B2BEC3"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          </View>

          <View className="w-full mb-8">
            <Text className="text-sm font-medium text-[#636E72] mb-2 ml-1">
              密码
            </Text>
            <TextInput
              className="w-full bg-[#E8E8EB] rounded-2xl px-4 py-4 text-[#2D3436] text-base"
              placeholder="请输入密码"
              placeholderTextColor="#B2BEC3"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
            className="w-full bg-[#6C63FF] rounded-full py-4 items-center shadow-lg"
            style={{
              shadowColor: '#6C63FF',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.35,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            <Text className="text-white font-bold text-base">
              {loading ? '登录中...' : '登录'}
            </Text>
          </TouchableOpacity>

          <View className="mt-8">
            <Text className="text-[#B2BEC3] text-sm">
              测试账号：admin / admin123
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
