import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Screen } from '@/components/Screen';
import { FontAwesome6 } from '@expo/vector-icons';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { Platform } from 'react-native';
import { storage } from '@/utils/storage';

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
];

export default function HomeScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pending: 0,
    processing: 0,
    completed: 0,
    total: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const router = useSafeRouter();

  useEffect(() => {
    loadUserInfo();
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

  useEffect(() => {
    if (user) {
      fetchWorkOrderStats();
    }
  }, [user]);

  const fetchWorkOrderStats = async () => {
    try {
      const ordersRes = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/work-orders`);
      const ordersData = await ordersRes.json();

      if (Array.isArray(ordersData)) {
        const pending = ordersData.filter((o: any) => o.status === 'pending').length;
        const processing = ordersData.filter((o: any) => o.status === 'processing').length;
        const completed = ordersData.filter((o: any) => o.status === 'completed').length;

        setStats({
          pending,
          processing,
          completed,
          total: ordersData.length,
        });

        setRecentOrders(ordersData.slice(0, 5));
      }
    } catch (error) {
      console.error('Fetch stats error:', error);
    }
  };

  // 加载中状态
  if (loading) {
    return (
      <Screen>
        <View style={styles.loadingContainer}>
          <Text>加载中...</Text>
        </View>
      </Screen>
    );
  }

  // 统一工作台（所有用户都看到完整功能导航）
  return (
      <Screen>
        <ScrollView
          style={styles.container}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          {/* Header */}
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

          {/* 工单统计 */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>工单统计</Text>
              <TouchableOpacity onPress={() => router.push('/work-orders')}>
                <Text style={styles.sectionAction}>查看全部</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.statsGrid}>
              <View style={[styles.statCard, styles.statPending]}>
                <Text style={styles.statValue}>{stats.pending}</Text>
                <Text style={styles.statLabel}>待处理</Text>
              </View>
              <View style={[styles.statCard, styles.statProcessing]}>
                <Text style={styles.statValue}>{stats.processing}</Text>
                <Text style={styles.statLabel}>处理中</Text>
              </View>
              <View style={[styles.statCard, styles.statCompleted]}>
                <Text style={styles.statValue}>{stats.completed}</Text>
                <Text style={styles.statLabel}>已完成</Text>
              </View>
              <View style={[styles.statCard, styles.statTotal]}>
                <Text style={styles.statValue}>{stats.total}</Text>
                <Text style={styles.statLabel}>总计</Text>
              </View>
            </View>
          </View>

          {/* 功能导航 */}
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

          {/* 最近工单 */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>最近工单</Text>
              <TouchableOpacity onPress={() => router.push('/work-orders')}>
                <Text style={styles.sectionAction}>查看全部</Text>
              </TouchableOpacity>
            </View>

            {recentOrders.map((order: any) => (
              <TouchableOpacity
                key={order.id}
                onPress={() => router.push('/work-order-detail', { id: order.id })}
                style={styles.orderCard}
                activeOpacity={0.7}
              >
                <View style={styles.orderHeader}>
                  <View style={styles.orderInfo}>
                    <Text style={styles.orderTitle}>{order.customer_name}</Text>
                    <Text style={styles.orderDevice}>{order.device_name}</Text>
                  </View>
                  <View style={[styles.orderStatus, { backgroundColor: `${getStatusColor(order.status)}20` }]}>
                    <Text style={[styles.orderStatusText, { color: getStatusColor(order.status) }]}>
                      {getStatusText(order.status)}
                    </Text>
                  </View>
                </View>
                <View style={styles.orderFooter}>
                  <Text style={styles.orderDate}>{formatDate(order.created_at)}</Text>
                  <View style={[styles.priorityBadge, { backgroundColor: `${getPriorityColor(order.priority)}20` }]}>
                    <Text style={[styles.priorityText, { color: getPriorityColor(order.priority) }]}>
                      {getPriorityText(order.priority)}优先级
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </Screen>
    );
  }

// 辅助函数
const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return '#FDCB6E';
    case 'processing':
      return '#1E88E5';
    case 'completed':
      return '#00B894';
    default:
      return '#B2BEC3';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'pending':
      return '待处理';
    case 'processing':
      return '处理中';
    case 'completed':
      return '已完成';
    default:
      return status;
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high':
      return '#FF6B6B';
    case 'medium':
      return '#FDCB6E';
    case 'low':
      return '#00B894';
    default:
      return '#B2BEC3';
  }
};

const getPriorityText = (priority: string) => {
  switch (priority) {
    case 'high':
      return '高';
    case 'medium':
      return '中';
    case 'low':
      return '低';
    default:
      return priority;
  }
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3436',
  },
  sectionAction: {
    fontSize: 14,
    color: '#1E88E5',
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  statCard: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: 16,
  },
  statPending: {
    borderLeftWidth: 4,
    borderLeftColor: '#FDCB6E',
  },
  statProcessing: {
    borderLeftWidth: 4,
    borderLeftColor: '#1E88E5',
  },
  statCompleted: {
    borderLeftWidth: 4,
    borderLeftColor: '#00B894',
  },
  statTotal: {
    borderLeftWidth: 4,
    borderLeftColor: '#1E88E5',
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2D3436',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#636E72',
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
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#2D3436',
    marginBottom: 4,
  },
  orderDevice: {
    fontSize: 13,
    color: '#636E72',
  },
  orderStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  orderStatusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderDate: {
    fontSize: 11,
    color: '#B2BEC3',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
