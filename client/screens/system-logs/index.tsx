import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  Platform,
  Modal,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { useFocusEffect } from 'expo-router';
import { Screen } from '@/components/Screen';
import { FontAwesome5 } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import DateTimePicker from '@react-native-community/datetimepicker';

interface LoginLog {
  id: number;
  user_id: number;
  username: string;
  login_time: string;
  logout_time: string | null;
  duration: number | null;
  device_info: string | null;
  ip_address: string | null;
  platform: string | null;
}

interface OperationLog {
  id: number;
  user_id: number;
  username: string;
  action: string;
  module: string | null;
  description: string | null;
  ip_address: string | null;
  platform: string | null;
  created_at: string;
}

interface LogStats {
  total_logins: number;
  total_operations: number;
  active_users: number;
  avg_login_duration: number;
}

export default function SystemLogsScreen() {
  const router = useSafeRouter();
  const [activeTab, setActiveTab] = useState<'login' | 'operation'>('login');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // 登录日志
  const [loginLogs, setLoginLogs] = useState<LoginLog[]>([]);
  const [loginPage, setLoginPage] = useState(1);
  const [loginTotal, setLoginTotal] = useState(0);
  const [loginFilter, setLoginFilter] = useState({
    username: '',
    startDate: '',
    endDate: '',
  });
  
  // 操作日志
  const [operationLogs, setOperationLogs] = useState<OperationLog[]>([]);
  const [operationPage, setOperationPage] = useState(1);
  const [operationTotal, setOperationTotal] = useState(0);
  const [operationFilter, setOperationFilter] = useState({
    username: '',
    module: '',
    action: '',
    startDate: '',
    endDate: '',
  });
  
  // 统计数据
  const [stats, setStats] = useState<LogStats>({
    total_logins: 0,
    total_operations: 0,
    active_users: 0,
    avg_login_duration: 0,
  });

  // 日期选择器相关
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  // 用户选择器相关
  const [userList, setUserList] = useState<{id: number; username: string; name: string; phone: string}[]>([]);
  const [showUserSelector, setShowUserSelector] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');

  // 模块选择器相关
  const [moduleList] = useState([
    {id: 'all', name: '全部'},
    {id: 'user', name: '用户管理'},
    {id: 'device', name: '设备管理'},
    {id: 'contract', name: '合同管理'},
    {id: 'workorder', name: '工单管理'},
    {id: 'after_sales', name: '售后服务'},
    {id: 'inventory', name: '库存管理'},
    {id: 'report', name: '报表分析'},
    {id: 'file', name: '文件管理'},
    {id: 'log', name: '日志管理'},
  ]);
  const [showModuleSelector, setShowModuleSelector] = useState(false);

  const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || '';

  // 加载用户列表
  const fetchUserList = async () => {
    try {
      /**
       * 服务端文件：server/src/routes/users.ts
       * 接口：GET /api/v1/users
       */
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/users`);
      const data = await response.json();

      if (Array.isArray(data)) {
        setUserList(data.map((u: any) => ({
          id: u.id,
          username: u.username || '',
          name: u.name || '',
          phone: u.phone || '',
        })));
      }
    } catch (error) {
      console.error('获取用户列表错误:', error);
    }
  };

  const fetchLoginLogs = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });
      
      if (loginFilter.username) params.append('username', loginFilter.username);
      if (loginFilter.startDate) params.append('start_date', loginFilter.startDate);
      if (loginFilter.endDate) params.append('end_date', loginFilter.endDate);
      
      /**
       * 服务端文件：server/src/routes/logs.ts
       * 接口：GET /api/v1/logs/login
       * Query 参数：username?: string, start_date?: string, end_date?: string, page?: number, limit?: number
       */
      const response = await fetch(
        `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/logs/login?${params.toString()}`
      );
      const data = await response.json();
      
      if (data.code === 200) {
        setLoginLogs(data.data.list || []);
        setLoginTotal(data.data.total || 0);
        setLoginPage(page);
      } else {
        Alert.alert('错误', data.message || '获取登录日志失败');
      }
    } catch (error) {
      console.error('获取登录日志错误:', error);
      Alert.alert('错误', '网络请求失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchOperationLogs = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });
      
      if (operationFilter.username) params.append('username', operationFilter.username);
      if (operationFilter.module) params.append('module', operationFilter.module);
      if (operationFilter.action) params.append('action', operationFilter.action);
      if (operationFilter.startDate) params.append('start_date', operationFilter.startDate);
      if (operationFilter.endDate) params.append('end_date', operationFilter.endDate);
      
      /**
       * 服务端文件：server/src/routes/logs.ts
       * 接口：GET /api/v1/logs/operation
       * Query 参数：username?: string, module?: string, action?: string, start_date?: string, end_date?: string, page?: number, limit?: number
       */
      const response = await fetch(
        `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/logs/operation?${params.toString()}`
      );
      const data = await response.json();
      
      if (data.code === 200) {
        setOperationLogs(data.data.list || []);
        setOperationTotal(data.data.total || 0);
        setOperationPage(page);
      } else {
        Alert.alert('错误', data.message || '获取操作日志失败');
      }
    } catch (error) {
      console.error('获取操作日志错误:', error);
      Alert.alert('错误', '网络请求失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      let url = '';
      if (activeTab === 'login') {
        /**
         * 服务端文件：server/src/routes/logs.ts
         * 接口：GET /api/v1/logs/login/stats
         */
        url = `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/logs/login/stats`;
      } else {
        // 操作日志暂时没有统计接口
        setStats({
          total_logins: 0,
          total_operations: 0,
          active_users: 0,
          avg_login_duration: 0,
        });
        return;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.code === 200 && data.data) {
        // 将后端返回的字段映射为前端期望的格式
        setStats({
          total_logins: data.data.total_logins || 0,
          total_operations: 0, // 操作日志暂时没有统计
          active_users: data.data.unique_users || 0,
          avg_login_duration: data.data.avg_duration || 0,
        });
      } else {
        setStats({
          total_logins: 0,
          total_operations: 0,
          active_users: 0,
          avg_login_duration: 0,
        });
      }
    } catch (error) {
      console.error('获取统计数据错误:', error);
      setStats({
        total_logins: 0,
        total_operations: 0,
        active_users: 0,
        avg_login_duration: 0,
      });
    }
  };

  const handleExport = async (type: 'login' | 'operation') => {
    try {
      let url = '';
      let filename = '';
      
      if (type === 'login') {
        url = `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/logs/login/export`;
        filename = '登录日志.xlsx';
      } else {
        url = `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/logs/operation/export`;
        filename = '操作日志.xlsx';
      }
      
      /**
       * 服务端文件：server/src/routes/logs.ts
       * 接口：GET /api/v1/logs/login/export 或 /api/v1/logs/operation/export
       */
      const response = await fetch(url);
      
      if (response.ok) {
        const blob = await response.blob();
        
        if (Platform.OS === 'web') {
          const blobUrl = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = filename;
          a.click();
          window.URL.revokeObjectURL(blobUrl);
        } else {
          const base64 = await blobToBase64(blob);
          const fileUri = FileSystem.documentDirectory + filename;
          await (FileSystem as any).writeAsStringAsync(fileUri, base64, {
            encoding: FileSystem.EncodingType.Base64,
          });
          
          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(fileUri);
          } else {
            Alert.alert('成功', `文件已保存到：${fileUri}`);
          }
        }
      } else {
        Alert.alert('错误', '导出失败');
      }
    } catch (error) {
      console.error('导出错误:', error);
      Alert.alert('错误', '网络请求失败');
    }
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const onRefresh = () => {
    setRefreshing(true);
    Promise.all([
      activeTab === 'login' ? fetchLoginLogs(1) : fetchOperationLogs(1),
      fetchStats(),
    ]).finally(() => setRefreshing(false));
  };

  // 日期选择处理
  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      const dateStr = selectedDate.toISOString().split('T')[0];
      if (activeTab === 'login') {
        setLoginFilter({ ...loginFilter, startDate: dateStr });
      } else {
        setOperationFilter({ ...operationFilter, startDate: dateStr });
      }
    }
  };

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndDatePicker(false);
    if (selectedDate) {
      const dateStr = selectedDate.toISOString().split('T')[0];
      if (activeTab === 'login') {
        setLoginFilter({ ...loginFilter, endDate: dateStr });
      } else {
        setOperationFilter({ ...operationFilter, endDate: dateStr });
      }
    }
  };

  // 用户选择处理
  const handleUserSelect = (username: string) => {
    setShowUserSelector(false);
    setSearchKeyword('');
    if (activeTab === 'login') {
      setLoginFilter({ ...loginFilter, username });
    } else {
      setOperationFilter({ ...operationFilter, username });
    }
  };

  // 模块选择处理
  const handleModuleSelect = (moduleId: string) => {
    setShowModuleSelector(false);
    const selectedModule = moduleId === 'all' ? '' : moduleList.find(m => m.id === moduleId)?.name || '';
    setOperationFilter({ ...operationFilter, module: selectedModule });
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchLoginLogs(1);
      fetchStats();
      fetchUserList();
      return () => {};
    }, [])
  );

  useEffect(() => {
    if (activeTab === 'login') {
      fetchLoginLogs(1);
    } else {
      fetchOperationLogs(1);
    }
    // 切换tab时重新获取统计数据
    fetchStats();
  }, [activeTab]);

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '-';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}小时${minutes}分钟`;
    }
    return `${minutes}分钟`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Screen>
      <View className="flex-1 bg-gray-50">
        {/* Header */}
        <View className="bg-white px-4 py-3 border-b border-gray-200">
          <View className="flex-row items-center justify-between">
            <TouchableOpacity
              onPress={() => router.navigate('/(tabs)')}
              className="flex-row items-center"
            >
              <FontAwesome5 name="home" size={18} color="#3B82F6" />
              <Text className="text-sm text-blue-500 ml-1">工作台</Text>
            </TouchableOpacity>
            <Text className="text-lg font-bold text-gray-900">日志查询</Text>
            <TouchableOpacity
              onPress={() => router.back()}
              className="p-2"
            >
              <FontAwesome5 name="times" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          className="flex-1"
        >
          {/* 统计卡片 */}
          <View className="p-4">
            <View className="grid grid-cols-2 gap-3">
              <View className="bg-blue-50 p-4 rounded-xl">
                <FontAwesome5 name="sign-in-alt" size={24} color="#3B82F6" />
                <Text className="text-2xl font-bold text-blue-600 mt-2">
                  {stats.total_logins}
                </Text>
                <Text className="text-sm text-gray-600">总登录次数</Text>
              </View>
              
              <View className="bg-green-50 p-4 rounded-xl">
                <FontAwesome5 name="tasks" size={24} color="#10B981" />
                <Text className="text-2xl font-bold text-green-600 mt-2">
                  {stats.total_operations}
                </Text>
                <Text className="text-sm text-gray-600">总操作次数</Text>
              </View>
              
              <View className="bg-purple-50 p-4 rounded-xl">
                <FontAwesome5 name="users" size={24} color="#8B5CF6" />
                <Text className="text-2xl font-bold text-purple-600 mt-2">
                  {stats.active_users}
                </Text>
                <Text className="text-sm text-gray-600">活跃用户</Text>
              </View>
              
              <View className="bg-orange-50 p-4 rounded-xl">
                <FontAwesome5 name="clock" size={24} color="#F59E0B" />
                <Text className="text-2xl font-bold text-orange-600 mt-2">
                  {formatDuration(stats.avg_login_duration)}
                </Text>
                <Text className="text-sm text-gray-600">平均登录时长</Text>
              </View>
            </View>
          </View>

          {/* Tab切换 */}
          <View className="flex-row bg-white border-b border-gray-200 mx-4 rounded-t-lg">
            <TouchableOpacity
              onPress={() => setActiveTab('login')}
              className={`flex-1 py-3 ${
                activeTab === 'login' ? 'bg-blue-50 border-b-2 border-blue-500' : ''
              }`}
            >
              <Text
                className={`text-center font-medium ${
                  activeTab === 'login' ? 'text-blue-600' : 'text-gray-600'
                }`}
              >
                登录日志
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveTab('operation')}
              className={`flex-1 py-3 ${
                activeTab === 'operation' ? 'bg-blue-50 border-b-2 border-blue-500' : ''
              }`}
            >
              <Text
                className={`text-center font-medium ${
                  activeTab === 'operation' ? 'text-blue-600' : 'text-gray-600'
                }`}
              >
                操作日志
              </Text>
            </TouchableOpacity>
          </View>

          {/* 筛选条件 */}
          <View className="bg-white mx-4 mb-3 p-4 rounded-b-lg">
            <View className="flex-row items-center gap-2 mb-3">
              <FontAwesome5 name="filter" size={16} color="#6B7280" />
              <Text className="text-sm font-medium text-gray-700">筛选条件</Text>
            </View>

            <View className="space-y-3">
              {/* 用户名选择器 */}
              <TouchableOpacity
                onPress={() => setShowUserSelector(true)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
              >
                <Text className={
                  (activeTab === 'login' ? loginFilter.username : operationFilter.username)
                    ? 'text-gray-900'
                    : 'text-gray-400'
                }>
                  {(activeTab === 'login' ? loginFilter.username : operationFilter.username) || '选择用户'}
                </Text>
              </TouchableOpacity>

              {/* 模块选择器（仅操作日志） */}
              {activeTab === 'operation' && (
                <TouchableOpacity
                  onPress={() => setShowModuleSelector(true)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                >
                  <Text className={
                    operationFilter.module ? 'text-gray-900' : 'text-gray-400'
                  }>
                    {operationFilter.module || '选择模块'}
                  </Text>
                </TouchableOpacity>
              )}

              {/* 日期选择器 */}
              <View className="flex-row gap-2">
                <TouchableOpacity
                  onPress={() => setShowStartDatePicker(true)}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                >
                  <Text className={
                    (activeTab === 'login' ? loginFilter.startDate : operationFilter.startDate)
                      ? 'text-gray-900'
                      : 'text-gray-400'
                  }>
                    {(activeTab === 'login' ? loginFilter.startDate : operationFilter.startDate) || '开始日期'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setShowEndDatePicker(true)}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                >
                  <Text className={
                    (activeTab === 'login' ? loginFilter.endDate : operationFilter.endDate)
                      ? 'text-gray-900'
                      : 'text-gray-400'
                  }>
                    {(activeTab === 'login' ? loginFilter.endDate : operationFilter.endDate) || '结束日期'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* 查询按钮 */}
              <TouchableOpacity
                onPress={() => {
                  if (activeTab === 'login') {
                    fetchLoginLogs(1);
                  } else {
                    fetchOperationLogs(1);
                  }
                }}
                className="bg-blue-500 py-2 rounded-lg"
              >
                <Text className="text-white text-center font-medium">查询</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 用户选择器Modal */}
          <Modal
            visible={showUserSelector}
            transparent
            animationType="slide"
            onRequestClose={() => setShowUserSelector(false)}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => setShowUserSelector(false)}
              className="flex-1 bg-black/50 justify-end"
            >
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              >
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={() => {}}
                  className="bg-white rounded-t-2xl p-4 max-h-[80%]"
                >
                  <View className="flex-row items-center justify-between mb-3">
                    <Text className="text-lg font-bold text-gray-900">选择用户</Text>
                    <TouchableOpacity onPress={() => {
                      setShowUserSelector(false);
                      setSearchKeyword('');
                    }}>
                      <FontAwesome5 name="times" size={20} color="#6B7280" />
                    </TouchableOpacity>
                  </View>

                  {/* 搜索框 */}
                  <View className="mb-3">
                    <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
                      <FontAwesome5 name="search" size={16} color="#9CA3AF" />
                      <TextInput
                        className="flex-1 ml-2 text-sm text-gray-900"
                        placeholder="搜索账户名、姓名、电话"
                        placeholderTextColor="#9CA3AF"
                        value={searchKeyword}
                        onChangeText={setSearchKeyword}
                      />
                      {searchKeyword.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchKeyword('')}>
                          <FontAwesome5 name="times-circle" size={16} color="#9CA3AF" />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>

                  {/* 用户列表 */}
                  <ScrollView className="max-h-96">
                    <TouchableOpacity
                      onPress={() => {
                        handleUserSelect('');
                        setSearchKeyword('');
                      }}
                      className="py-3 border-b border-gray-100"
                    >
                      <Text className="text-blue-600 font-medium">全部用户</Text>
                    </TouchableOpacity>

                    {userList
                      .filter(user => {
                        if (!searchKeyword) return true;
                        const keyword = searchKeyword.toLowerCase();
                        return (
                          user.username.toLowerCase().includes(keyword) ||
                          (user.name && user.name.toLowerCase().includes(keyword)) ||
                          (user.phone && user.phone.includes(keyword))
                        );
                      })
                      .map((user) => (
                        <TouchableOpacity
                          key={user.id}
                          onPress={() => {
                            handleUserSelect(user.username);
                            setSearchKeyword('');
                          }}
                          className="py-3 border-b border-gray-100"
                        >
                          <View>
                            <Text className="text-gray-900 font-medium">{user.username}</Text>
                            {(user.name || user.phone) && (
                              <Text className="text-gray-500 text-sm mt-1">
                                {user.name ? user.name : ''}
                                {user.name && user.phone ? ' · ' : ''}
                                {user.phone ? user.phone : ''}
                              </Text>
                            )}
                          </View>
                        </TouchableOpacity>
                      ))}

                    {/* 搜索无结果提示 */}
                    {userList.filter(user => {
                      if (!searchKeyword) return true;
                      const keyword = searchKeyword.toLowerCase();
                      return (
                        user.username.toLowerCase().includes(keyword) ||
                        (user.name && user.name.toLowerCase().includes(keyword)) ||
                        (user.phone && user.phone.includes(keyword))
                      );
                    }).length === 0 && (
                      <View className="py-8 text-center">
                        <FontAwesome5 name="search" size={40} color="#D1D5DB" />
                        <Text className="text-gray-400 mt-2">未找到匹配的用户</Text>
                      </View>
                    )}
                  </ScrollView>
                </TouchableOpacity>
              </KeyboardAvoidingView>
            </TouchableOpacity>
          </Modal>

          {/* 模块选择器Modal */}
          <Modal
            visible={showModuleSelector}
            transparent
            animationType="slide"
            onRequestClose={() => setShowModuleSelector(false)}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => setShowModuleSelector(false)}
              className="flex-1 bg-black/50 justify-end"
            >
              <View className="bg-white rounded-t-2xl p-4 max-h-96">
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-lg font-bold text-gray-900">选择模块</Text>
                  <TouchableOpacity onPress={() => setShowModuleSelector(false)}>
                    <FontAwesome5 name="times" size={20} color="#6B7280" />
                  </TouchableOpacity>
                </View>
                <ScrollView className="max-h-80">
                  {moduleList.map((module) => (
                    <TouchableOpacity
                      key={module.id}
                      onPress={() => handleModuleSelect(module.id)}
                      className="py-3 border-b border-gray-100"
                    >
                      <Text className="text-gray-900">{module.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </TouchableOpacity>
          </Modal>

          {/* 日期选择器 */}
          {showStartDatePicker && (
            <DateTimePicker
              value={
                (activeTab === 'login' ? loginFilter.startDate : operationFilter.startDate)
                  ? new Date(activeTab === 'login' ? loginFilter.startDate : operationFilter.startDate)
                  : new Date()
              }
              mode="date"
              display="default"
              onChange={handleStartDateChange}
            />
          )}

          {showEndDatePicker && (
            <DateTimePicker
              value={
                (activeTab === 'login' ? loginFilter.endDate : operationFilter.endDate)
                  ? new Date(activeTab === 'login' ? loginFilter.endDate : operationFilter.endDate)
                  : new Date()
              }
              mode="date"
              display="default"
              onChange={handleEndDateChange}
            />
          )}

          {/* 导出按钮 */}
          <View className="px-4 mb-3">
            <TouchableOpacity
              onPress={() => handleExport(activeTab)}
              className="bg-green-500 py-2 rounded-lg flex-row items-center justify-center"
            >
              <FontAwesome5 name="file-export" size={16} color="white" />
              <Text className="text-white font-medium ml-2">
                导出{activeTab === 'login' ? '登录' : '操作'}日志
              </Text>
            </TouchableOpacity>
          </View>

          {/* 日志列表 */}
          <View className="px-4 pb-4">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-sm text-gray-600">
                共 {activeTab === 'login' ? loginTotal : operationTotal} 条记录
              </Text>
            </View>

            {activeTab === 'login' ? (
              loginLogs.map((log) => (
                <View key={log.id} className="bg-white p-4 rounded-lg mb-2 border border-gray-200">
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="font-medium text-gray-900">{log.username}</Text>
                    <Text className="text-xs text-gray-500">{log.platform}</Text>
                  </View>
                  
                  <View className="space-y-1">
                    <View className="flex-row items-center">
                      <FontAwesome5 name="sign-in-alt" size={12} color="#6B7280" />
                      <Text className="text-sm text-gray-600 ml-2">
                        {formatDate(log.login_time)}
                      </Text>
                    </View>
                    
                    {log.logout_time && (
                      <View className="flex-row items-center">
                        <FontAwesome5 name="sign-out-alt" size={12} color="#6B7280" />
                        <Text className="text-sm text-gray-600 ml-2">
                          {formatDate(log.logout_time)}
                        </Text>
                      </View>
                    )}
                    
                    <View className="flex-row items-center">
                      <FontAwesome5 name="clock" size={12} color="#6B7280" />
                      <Text className="text-sm text-gray-600 ml-2">
                        登录时长：{formatDuration(log.duration)}
                      </Text>
                    </View>
                    
                    {log.ip_address && (
                      <View className="flex-row items-center">
                        <FontAwesome5 name="globe" size={12} color="#6B7280" />
                        <Text className="text-sm text-gray-600 ml-2">
                          IP：{log.ip_address}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              ))
            ) : (
              operationLogs.map((log) => (
                <View key={log.id} className="bg-white p-4 rounded-lg mb-2 border border-gray-200">
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="font-medium text-gray-900">{log.username}</Text>
                    <Text className="text-xs text-gray-500">{log.module || '-'}</Text>
                  </View>
                  
                  <View className="space-y-1">
                    <View className="flex-row items-center">
                      <FontAwesome5 name="bolt" size={12} color="#6B7280" />
                      <Text className="text-sm text-gray-600 ml-2">
                        {log.action}
                      </Text>
                    </View>
                    
                    {log.description && (
                      <Text className="text-sm text-gray-600 ml-5">
                        {log.description}
                      </Text>
                    )}
                    
                    <View className="flex-row items-center">
                      <FontAwesome5 name="clock" size={12} color="#6B7280" />
                      <Text className="text-sm text-gray-600 ml-2">
                        {formatDate(log.created_at)}
                      </Text>
                    </View>
                    
                    {log.ip_address && (
                      <View className="flex-row items-center">
                        <FontAwesome5 name="globe" size={12} color="#6B7280" />
                        <Text className="text-sm text-gray-600 ml-2">
                          IP：{log.ip_address}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </View>
    </Screen>
  );
}
