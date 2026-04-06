import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome6 } from '@expo/vector-icons';
import { useCSSVariable } from 'uniwind';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const [background, muted, accent] = useCSSVariable([
    '--color-background',
    '--color-muted',
    '--color-accent',
  ]) as string[];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#F0F0F3',
          borderTopWidth: 1,
          borderTopColor: 'rgba(255,255,255,0.3)',
          height: Platform.OS === 'web' ? 60 : 55 + insets.bottom,
          paddingBottom: Platform.OS === 'web' ? 8 : insets.bottom,
          paddingTop: 8,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          shadowColor: '#D1D9E6',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.5,
          shadowRadius: 8,
          elevation: 8,
        },
        tabBarActiveTintColor: '#6C63FF',
        tabBarInactiveTintColor: '#B2BEC3',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '首页',
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="house" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="customers"
        options={{
          title: '客户',
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="users" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="knowledge"
        options={{
          title: '知识库',
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="book" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '我的',
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="user" size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
