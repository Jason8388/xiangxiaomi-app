import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Screen } from '@/components/Screen';
import { FontAwesome6 } from '@expo/vector-icons';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { storage } from '@/utils/storage';
import { useVersionCheck } from '@/components/UpdateDialog';

// 当前APP版本号
const CURRENT_VERSION = '1.0.0';

interface User {
  id: number;
  username: string;
  name: string;
  role: string;
  position: string;
}

interface NavigationItem {
  id: string;
  title: string;
  icon: string;
  color: string;
  route: string;
}

// 管理员功能导航配置
const adminNavItems: NavigationItem[] = [
  {
    id: 'work-orders',
    title: '工单管理',
    icon: 'clipboard-list',
    color: '#1E88E5',
    route: '/work-orders',
  },
  {
    id: 'customers',
    title: '客户管理',
    icon: 'users',
    color: '#00B894',
    route: '/customers',
  },
  {
    id: 'contracts',
    title: '合同管理',
    icon: 'file-signature',
    color: '#F39C12',
    route: '/contracts',
  },
  {
    id: 'devices',
    title: '设备管理',
    icon: 'microchip',
    color: '#9B59B6',
    route: '/devices',
  },
  {
    id: 'warehouses',
    title: '仓库管理',
    icon: 'box-open',
    color: '#E74C3C',
    route: '/materials',
  },
  {
    id: 'query-assistant',
    title: '查询助手',
    icon: 'magnifying-glass',
    color: '#2ECC71',
    route: '/query-assistant',
  },
  {
    id: 'knowledge',
    title: '知识库',
    icon: 'book',
    color: '#F1C40F',
    route: '/knowledge-base',
  },
  {
    id: 'statistics',
    title: '统计报表',
    icon: 'chart-pie',
    color: '#3498DB',
    route: '/reports',
  },
  {
    id: 'account',
    title: '账号管理',
    icon: 'user-gear',
    color: '#E91E63',
    route: '/employee-management',
  },
  {
    id: 'album',
    title: '相册管理',
    icon: 'images',
    color: '#FF6B9D',
    route: '/gallery',
  },
  {
    id: 'file',
    title: '文件管理',
    icon: 'folder',
    color: '#5D6D7E',
    route: '/files',
  },
  {
    id: 'meeting',
    title: '会议纪要',
    icon: 'comments',
    color: '#27AE60',
    route: '/meeting-minutes',
  },
  {
    id: 'reminder',
    title: '工作提醒',
    icon: 'bell',
    color: '#E74C3C',
    route: '/reminders',
  },
  {
    id: 'organization',
    title: '组织结构',
    icon: 'sitemap',
    color: '#00CEC9',
    route: '/organization',
  },
  {
    id: 'version',
    title: '版本管理',
    icon: 'code-branch',
    color: '#8E44AD',
    route: '/version-management',
  },
];

export default function HomeScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useSafeRouter();

  // 版本更新检测
  const {
    checkForUpdate,
    UpdateDialogComponent,
  } = useVersionCheck(CURRENT_VERSION);

  useEffect(() => {
    loadUserInfo();
    // 延迟检查版本更新，确保用户已登录
    setTimeout(() => {
      checkForUpdate();
    }, 2000);
  }, []);

  const loadUserInfo = async () => {
    try {
      const userStr = await storage.getItem('user');
      if (userStr) {
        const userData = JSON.parse(userStr);
        setUser(userData);
      }
    } catch (error) {
      console.error('Load user error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Screen>
        <View style={styles.loadingContainer}>
          <Text>加载中...</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      {UpdateDialogComponent}
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>工作台</Text>
            <Text style={styles.headerSubtitle}>
              欢迎回来，{user?.name || '用户'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => router.push('/profile')}
          >
            <FontAwesome6 name="bell" size={20} color="#2D3436" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>功能导航</Text>
          <View style={styles.navGrid}>
            {adminNavItems.map(item => (
              <TouchableOpacity
                key={item.id}
                style={styles.navItem}
                onPress={() => router.push(item.route)}
                activeOpacity={0.7}
              >
                <View style={[styles.navIcon, { backgroundColor: `${item.color}15` }]}>
                  <FontAwesome6 name={item.icon as any} size={24} color={item.color} />
                </View>
                <Text style={styles.navTitle}>{item.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2D3436',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#636E72',
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#636E72',
    marginBottom: 16,
  },
  navGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  navItem: {
    width: '31%',
    alignItems: 'center',
    marginBottom: 16,
  },
  navIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  navTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#2D3436',
    textAlign: 'center',
  },
});
