import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LogBox } from 'react-native';
import Toast from 'react-native-toast-message';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { useSegments, useRootNavigationState } from 'expo-router';
import { Provider } from '@/components/Provider';
import { useVersionUpdate } from '@/components/VersionUpdate';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 检查用户登录状态
const checkAuth = async () => {
  try {
    if (Platform.OS === 'web') {
      const token = typeof window !== 'undefined' ? localStorage.getItem('session_id') : null;
      return !!token;
    } else {
      const token = await AsyncStorage.getItem('session_id');
      return !!token;
    }
  } catch (error) {
    console.error('[认证] 检查登录状态失败:', error);
    return false;
  }
};

import '../global.css';

LogBox.ignoreLogs([
  "TurboModuleRegistry.getEnforcing(...): 'RNMapsAirModule' could not be found",
  // 忽略 Web 环境下的 expo-secure-store 错误
  "ExpoSecureStore.default.getValueWithKeyAsync is not a function",
  // 忽略 Expo Router 版本检查错误（Web 平台网络请求失败，不影响应用功能）
  "Version check error",
  // 忽略 View 内文本节点错误（React Native 警告，不影响功能）
  "Unexpected text node",
  // 添加其它想暂时忽略的错误或警告信息
]);

function RootLayoutInner() {
  const router = useSafeRouter();
  const segments = useSegments();
  const rootState = useRootNavigationState();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const { checkVersionUpdate, renderDialog } = useVersionUpdate({
    // Web 环境下禁用版本更新检查
    enabled: Platform.OS !== 'web',
    onUpgradeStart: () => {
      console.log('升级开始');
    },
    onUpgradeSuccess: () => {
      console.log('升级成功');
    },
    onUpgradeError: (error) => {
      console.error('升级失败:', error);
    },
  });

  // 应用启动时检查版本更新
  useEffect(() => {
    checkVersionUpdate();
  }, []);

  // 认证检查逻辑
  useEffect(() => {
    // 等待导航挂载
    if (!rootState?.key) return;

    const checkAuthStatus = async () => {
      const isAuth = await checkAuth();
      console.log('[认证] 登录状态:', isAuth);
      setIsAuthenticated(isAuth);
      setIsLoading(false);
    };

    checkAuthStatus();
  }, [rootState?.key]);

  // 路由守卫
  useEffect(() => {
    if (isLoading || !rootState?.key) return;

    const inLoginRoute = segments[0] === 'login';

    console.log('[认证] 路由守卫检查:', {
      isAuthenticated,
      inLoginRoute,
      segments,
    });

    // 未登录且不在登录页 → 跳转登录页
    if (!isAuthenticated && !inLoginRoute) {
      console.log('[认证] 未登录，跳转到登录页');
      router.replace('/login');
    }

    // 已登录但在登录页 → 跳转首页
    if (isAuthenticated && inLoginRoute) {
      console.log('[认证] 已登录，跳转到首页');
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, segments, isLoading, rootState?.key, router]);

  return (
    <>
      <Stack
        screenOptions={{
          animation: 'slide_from_right',
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          headerShown: false
        }}
      >
        <Stack.Screen name="login" options={{ title: "" }} />
        <Stack.Screen name="(tabs)" options={{ title: "" }} />
        <Stack.Screen name="account-settings" options={{ title: "账号设置" }} />
        <Stack.Screen name="help-feedback" options={{ title: "帮助与反馈" }} />
        <Stack.Screen name="help-manual" options={{ title: "产品操作手册" }} />
        <Stack.Screen name="help-faq" options={{ title: "常见问题" }} />
        <Stack.Screen name="customer-detail" options={{ title: "" }} />
        <Stack.Screen name="work-order-detail" options={{ title: "" }} />
        <Stack.Screen name="files" options={{ title: "" }} />
        <Stack.Screen name="file-detail" options={{ title: "" }} />
        <Stack.Screen name="gallery" options={{ title: "" }} />
        <Stack.Screen name="media-detail" options={{ title: "" }} />
        <Stack.Screen name="employee-management" options={{ title: "" }} />
        <Stack.Screen name="department-management" options={{ title: "" }} />
        <Stack.Screen name="version-management" options={{ title: "" }} />
        <Stack.Screen name="customers" options={{ title: "" }} />
        <Stack.Screen name="customer-ledger" options={{ title: "" }} />
        <Stack.Screen name="contracts" options={{ title: "" }} />
        <Stack.Screen name="contract-detail" options={{ title: "" }} />
        <Stack.Screen name="contract-ledger" options={{ title: "" }} />
        <Stack.Screen name="devices" options={{ title: "" }} />
        <Stack.Screen name="device-detail" options={{ title: "" }} />
        <Stack.Screen name="device-history" options={{ title: "" }} />
        <Stack.Screen name="materials" options={{ title: "" }} />
        <Stack.Screen name="material-detail" options={{ title: "" }} />
        <Stack.Screen name="standard-material-lists" options={{ title: "" }} />
        <Stack.Screen name="standard-material-detail" options={{ title: "" }} />
        <Stack.Screen name="material-requirements" options={{ title: "" }} />
        <Stack.Screen name="material-requirement-detail" options={{ title: "" }} />
        <Stack.Screen name="material-notifications" options={{ title: "" }} />
        <Stack.Screen name="after-sales" options={{ title: "" }} />
        <Stack.Screen name="after-sales-detail" options={{ title: "" }} />
        <Stack.Screen name="after-sales-create" options={{ title: "" }} />
        <Stack.Screen name="after-sales-audit" options={{ title: "" }} />
        <Stack.Screen name="knowledge-base" options={{ title: "" }} />
        <Stack.Screen name="knowledge-detail" options={{ title: "" }} />
        <Stack.Screen name="knowledge-create" options={{ title: "" }} />
        <Stack.Screen name="knowledge-edit" options={{ title: "" }} />
        <Stack.Screen name="meeting-minutes" options={{ title: "" }} />
        <Stack.Screen name="meeting-minute-detail" options={{ title: "" }} />
        <Stack.Screen name="meeting-minute-create" options={{ title: "" }} />
        <Stack.Screen name="meeting-minute-edit" options={{ title: "" }} />
        <Stack.Screen name="permission-config" options={{ title: "权限配置" }} />
        <Stack.Screen name="system-logs" options={{ title: "日志查询" }} />
        <Stack.Screen name="system-cleanup" options={{ title: "系统清理" }} />
        <Stack.Screen name="query-assistant" options={{ title: "" }} />
        <Stack.Screen name="query-scan" options={{ title: "" }} />
        <Stack.Screen name="query-file" options={{ title: "" }} />
        <Stack.Screen name="query-meeting" options={{ title: "" }} />
        <Stack.Screen name="query-customer" options={{ title: "" }} />
        <Stack.Screen name="query-device" options={{ title: "" }} />
        <Stack.Screen name="query-contract" options={{ title: "" }} />
        <Stack.Screen name="query-material" options={{ title: "" }} />
        <Stack.Screen name="query-after-sales" options={{ title: "" }} />
        <Stack.Screen name="reports" options={{ title: "" }} />
        <Stack.Screen name="report-customer" options={{ title: "" }} />
        <Stack.Screen name="report-customer-detail" options={{ title: "" }} />
        <Stack.Screen name="report-device" options={{ title: "" }} />
        <Stack.Screen name="report-after-sales" options={{ title: "" }} />
        <Stack.Screen name="reminders" options={{ title: "" }} />
        <Stack.Screen name="work-order-reminders" options={{ title: "" }} />
        <Stack.Screen name="organization" options={{ title: "" }} />
        {/* PC端管理平台 */}
        <Stack.Screen name="pc" options={{ title: "" }} />
      </Stack>
      {Platform.OS !== 'web' && renderDialog()}
      <Toast />
    </>
  );
}

export default function RootLayout() {
  return (
    <Provider>
      <RootLayoutInner />
    </Provider>
  );
}
