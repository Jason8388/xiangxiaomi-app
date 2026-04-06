import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LogBox } from 'react-native';
import Toast from 'react-native-toast-message';
import { useEffect } from 'react';
import { Provider } from '@/components/Provider';
import { useVersionUpdate } from '@/components/VersionUpdate';

import '../global.css';

LogBox.ignoreLogs([
  "TurboModuleRegistry.getEnforcing(...): 'RNMapsAirModule' could not be found",
  // 添加其它想暂时忽略的错误或警告信息
]);

function RootLayoutInner() {
  const { checkVersionUpdate, renderDialog } = useVersionUpdate({
    enabled: true,
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
      </Stack>
      {renderDialog()}
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
