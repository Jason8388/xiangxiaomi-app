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
      <Stack.Screen name="after-sales" />
      <Stack.Screen name="materials" />
      <Stack.Screen name="knowledge" />
      <Stack.Screen name="meeting-minutes" />
      <Stack.Screen name="files" />
      <Stack.Screen name="reports" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="help" />
    </Stack>
  );
}
