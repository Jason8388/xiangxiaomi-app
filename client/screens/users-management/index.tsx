import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Image } from 'react-native';
import { Screen } from '@/components/Screen';
import { Button } from '@/components/Button';
import { getApiBaseUrl } from '@/utils/api';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { FontAwesome6 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: number;
  username: string;
  name: string;
  role: string;
  avatar?: string;
  created_at: string;
}

export default function UsersManagement() {
  const router = useSafeRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    checkAdminAndLoadUsers();
  }, []);

  const checkAdminAndLoadUsers = async () => {
    try {
      // 检查当前用户是否为管理员
      const userStr = await AsyncStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;

      if (!user || user.role !== 'admin') {
        Alert.alert('权限不足', '只有管理员才能访问账号管理');
        router.back();
        return;
      }

      setCurrentUser(user);
      await loadUsers();
    } catch (error) {
      console.error('[账号管理] 检查管理员权限错误:', error);
      Alert.alert('错误', '权限检查失败');
      router.back();
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${getApiBaseUrl()}/api/v1/users`);
      const data = await response.json();

      if (response.ok && data.data) {
        setUsers(data.data);
      }
    } catch (error) {
      console.error('[账号管理] 加载用户列表错误:', error);
      Alert.alert('错误', '加载用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionConfig = (user: User) => {
    router.push({
      pathname: '/permission-config',
      params: {
        userId: user.id.toString(),
        userName: user.name,
      },
    });
  };

  if (loading) {
    return (
      <Screen>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.container}>
        {/* 标题栏 */}
        <View style={styles.header}>
          <Text style={styles.title}>账号管理</Text>
          <Text style={styles.subtitle}>管理用户账号和权限</Text>
        </View>

        {/* 用户列表 */}
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {users.map((user) => (
            <View key={user.id} style={styles.userCard}>
              {/* 用户信息 */}
              <View style={styles.userInfo}>
                <View style={styles.avatarContainer}>
                  {user.avatar ? (
                    <Image source={{ uri: user.avatar }} style={styles.avatar} />
                  ) : (
                    <FontAwesome6 name="user-circle" size={48} color="#007AFF" />
                  )}
                </View>
                <View style={styles.userDetails}>
                  <Text style={styles.userName}>{user.name}</Text>
                  <Text style={styles.userUsername}>@{user.username}</Text>
                  <View style={styles.roleBadge}>
                    <Text style={styles.roleText}>{user.role}</Text>
                  </View>
                </View>
              </View>

              {/* 操作按钮 */}
              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.permissionButton}
                  onPress={() => handlePermissionConfig(user)}
                >
                  <FontAwesome6 name="shield-halved" size={14} color="#007AFF" />
                  <Text style={styles.permissionButtonText}>权限</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    marginTop: 5,
  },
  scrollContainer: {
    flex: 1,
    padding: 15,
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarContainer: {
    marginRight: 15,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  userUsername: {
    fontSize: 14,
    color: '#999999',
    marginTop: 2,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    marginTop: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
  },
  roleText: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  permissionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#E3F2FD',
    borderRadius: 20,
    gap: 6,
  },
  permissionButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666666',
  },
});
