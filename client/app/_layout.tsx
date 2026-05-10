import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LogBox, Platform } from 'react-native';
import Toast from 'react-native-toast-message';
import { useEffect, useState } from 'react';
import { useSegments, useRootNavigationState } from 'expo-router';
import { Provider } from '@/components/Provider';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { storage } from '@/utils/storage';

// 检查用户登录状态
const checkAuth = async () => {
  try {
    const token = await storage.getItem('session_id');
    return !!token;
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

  // 全局错误处理 - 隐藏失败的图片和资源
  useEffect(() => {
    // 仅在 Web 环境下处理 Coze 平台代理图片（React Native 原生环境不支持 document）
    if (typeof document === 'undefined') return;
    
    const handleImageError = (event: Event) => {
      const target = event.target as HTMLElement;
      target.style.display = 'none';
    };

    // 立即处理现有元素
    document.querySelectorAll('img').forEach(el => {
      const imgEl = el as HTMLImageElement;
      imgEl.onerror = () => handleImageError({ target: imgEl } as any);
      // 检查是否是 Coze 平台代理的图片
      if (imgEl.src && imgEl.src.includes('coze.cn')) {
        imgEl.style.display = 'none';
      }
    });

    // 监听新添加的元素
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as HTMLImageElement;
            if (el.tagName === 'IMG') {
              el.onerror = () => handleImageError({ target: el } as any);
              // 检查是否是 Coze 平台代理的图片，立即隐藏
              if (el.src && el.src.includes('coze.cn')) {
                el.style.display = 'none';
              }
            }
          }
        });
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // 定时检查并隐藏所有 Coze 代理的图片
    const intervalId = setInterval(() => {
      document.querySelectorAll('img').forEach(el => {
        const img = el as HTMLImageElement;
        if (img.src.includes('coze.cn')) {
          img.style.display = 'none';
        }
      });
    }, 100);

    return () => {
      observer.disconnect();
      clearInterval(intervalId);
    };
  }, []);

  // 认证检查逻辑 - 应用启动时检查
  useEffect(() => {
    // 等待导航挂载
    if (!rootState?.key) return;

    const checkAuthStatus = async () => {
      const isAuth = await checkAuth();
      console.log('[认证] 应用启动检查登录状态:', isAuth);
      setIsAuthenticated(isAuth);
      setIsLoading(false);
    };

    checkAuthStatus();
  }, [rootState?.key]);

  // 认证检查逻辑 - 路由变化时检查
  useEffect(() => {
    if (!rootState?.key) return;

    const checkAuthStatus = async () => {
      const isAuth = await checkAuth();
      console.log('[认证] 路由变化检查登录状态:', isAuth);
      setIsAuthenticated(isAuth);
    };

    checkAuthStatus();
  }, [segments]);

  // 路由守卫 - 在路由变化时直接检查登录状态（避免竞态条件）
  useEffect(() => {
    if (isLoading || !rootState?.key) return;

    const checkRouteGuard = async () => {
      const inLoginRoute = segments[0] === 'login';
      const isAuth = await checkAuth();

      console.log('[认证] 路由守卫检查 - 路由:', segments, '登录页:', inLoginRoute, '已登录:', isAuth);

      // 未登录且不在登录页 → 跳转登录页
      if (!isAuth && !inLoginRoute) {
        console.log('[认证] 未登录，跳转到登录页');
        router.replace('/login');
      }

      // 注意：不要在登录页面自动跳转，避免与用户手动点击"确定"按钮冲突
      // 用户登录成功后，会手动点击"确定"按钮跳转到首页
    };

    checkRouteGuard();
  }, [segments, isLoading, rootState?.key, router]);

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
        <Stack.Screen name="device-history-detail" options={{ title: "" }} />
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
      </Stack>
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
