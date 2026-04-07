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
        <Stack.Screen name="index" options={{ title: "" }} />
        <Stack.Screen name="(tabs)" options={{ title: "" }} />
        <Stack.Screen name="account-settings" options={{ title: "账号设置" }} />
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
        <Stack.Screen name="report-device" options={{ title: "" }} />
        <Stack.Screen name="report-after-sales" options={{ title: "" }} />
        <Stack.Screen name="reminders" options={{ title: "" }} />
        <Stack.Screen name="organization" options={{ title: "" }} />
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
