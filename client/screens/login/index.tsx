import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Screen } from '@/components/Screen';
import { storage, setSecureItem } from '@/utils/storage';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { getApiBaseUrl } from '@/utils/api';
import Constants from 'expo-constants';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useSafeRouter();

  // 获取设备信息
  const getDeviceInfo = () => {
    return JSON.stringify({
      platform: Platform.OS,
      version: Platform.Version,
      model: Constants.deviceName,
      deviceId: Constants.deviceId,
    });
  };

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('提示', '请输入用户名/手机号和密码');
      return;
    }

    console.log('[APP登录] 开始登录...');
    console.log('[APP登录] 用户名:', username);
    console.log('[APP登录] 设备ID:', Constants.deviceId);

    setLoading(true);
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/v1/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
          device_id: Constants.deviceId,
          device_info: getDeviceInfo(),
        }),
      });

      const data = await response.json();

      console.log('[APP登录] 响应数据:', data);

      if (!response.ok) {
        throw new Error(data.error || '登录失败');
      }

      // 保存用户信息
      if (data.user) {
        await storage.setItem('user', JSON.stringify(data.user));
        console.log('[APP登录] 用户信息已保存');
      }

      if (data.session && data.session.session_id) {
        await storage.setItem('session_id', data.session.session_id);
        await storage.setItem('token', data.session.session_id);
        console.log('[APP登录] 会话ID已保存');
      }

      Alert.alert('成功', '登录成功', [
        {
          text: '确定',
          onPress: () => router.replace('/(tabs)')
        }
      ]);
    } catch (error: any) {
      console.error('[APP登录] 错误:', error);
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
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
          <View style={{ marginBottom: 32 }}>
            <Text style={{ fontSize: 36, fontWeight: 'bold', color: '#1E88E5', textAlign: 'center', marginBottom: 8 }}>
              项小秘
            </Text>
          </View>

          <View style={{ width: '100%', marginBottom: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#636E72', marginBottom: 8, marginLeft: 4 }}>
              用户名 / 手机号
            </Text>
            <TextInput
              style={{
                width: '100%',
                backgroundColor: '#F5F7FA',
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 12,
                fontSize: 14,
                color: '#2D3436',
                borderWidth: 1,
                borderColor: '#DFE6E9',
              }}
              placeholder="请输入用户名或手机号"
              placeholderTextColor="#B2BEC3"
              value={username}
              onChangeText={setUsername}
              keyboardType="default"
              autoCapitalize="none"
            />
          </View>

          <View style={{ width: '100%', marginBottom: 32 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#636E72', marginBottom: 8, marginLeft: 4 }}>
              密码
            </Text>
            <TextInput
              style={{
                width: '100%',
                backgroundColor: '#F5F7FA',
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 12,
                fontSize: 14,
                color: '#2D3436',
                borderWidth: 1,
                borderColor: '#DFE6E9',
              }}
              placeholder="请输入密码"
              placeholderTextColor="#B2BEC3"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            onPress={() => {
              Alert.alert(
                '忘记密码',
                '如需重置密码，请联系管理员。\n\n管理员将通过员工管理功能为您重置密码。'
              );
            }}
            style={{ width: '100%', alignItems: 'flex-end', marginBottom: 16 }}
          >
            <Text style={{ fontSize: 13, color: '#1E88E5' }}>
              忘记密码？
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
            style={{
              width: '100%',
              backgroundColor: '#1E88E5',
              borderRadius: 25,
              paddingVertical: 16,
              alignItems: 'center',
              shadowColor: '#1E88E5',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 }}>
              {loading ? '登录中...' : '登录'}
            </Text>
          </TouchableOpacity>

          
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
