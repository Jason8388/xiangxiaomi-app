import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LogBox } from 'react-native';
import Toast from 'react-native-toast-message';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { Provider } from '@/components/Provider';
import { useVersionUpdate } from '@/components/VersionUpdate';

import '../global.css';

LogBox.ignoreLogs([
  "TurboModuleRegistry.getEnforcing(...): 'RNMapsAirModule' could not be found",
  // 忽略 Web 环境下的 expo-secure-store 错误
  "ExpoSecureStore.default.getValueWithKeyAsync is not a function",
  // 添加其它想暂时忽略的错误或警告信息
]);

function RootLayoutInner() {
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
        <Stack.Screen name="customer-detail" options={{ title: "" }} />
        <Stack.Screen name="work-order-detail" options={{ title: "" }} />
        <Stack.Screen name="files" options={{ title: "" }} />
        <Stack.Screen name="file-detail" options={{ title: "" }} />
        <Stack.Screen name="gallery" options={{ title: "" }} />
        <Stack.Screen name="media-detail" options={{ title: "" }} />
        <Stack.Screen name="employee-management" options={{ title: "" }} />
        <Stack.Screen name="version-management" options={{ title: "" }} />
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
