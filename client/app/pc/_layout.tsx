import { Stack } from 'expo-router';

export default function PCLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="customers" />
      <Stack.Screen name="devices" />
      <Stack.Screen name="contracts" />
      <Stack.Screen name="work-orders" />
      <Stack.Screen name="materials" />
      <Stack.Screen name="knowledge" />
      <Stack.Screen name="meeting-minutes" />
      <Stack.Screen name="files" />
      <Stack.Screen name="reports" />
      <Stack.Screen name="gallery" />
      <Stack.Screen name="account-settings" />
      <Stack.Screen name="logs" />
      <Stack.Screen name="query-assistant" />
      <Stack.Screen name="query-customer" />
      <Stack.Screen name="query-device" />
      <Stack.Screen name="query-contract" />
      <Stack.Screen name="query-material" />
      <Stack.Screen name="query-meeting" />
      <Stack.Screen name="query-file" />
      <Stack.Screen name="query-scan" />
      <Stack.Screen name="query-work-order" />
      <Stack.Screen name="report-customer" />
      <Stack.Screen name="report-device" />
      <Stack.Screen name="report-after-sales" />
      <Stack.Screen name="employee-management" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="help" />
    </Stack>
  );
}
