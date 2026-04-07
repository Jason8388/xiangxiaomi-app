import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { PageHeader } from '@/components/PageHeader';
import { FontAwesome6 } from '@expo/vector-icons';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { getApiBaseUrl } from '@/utils/api';

interface Statistics {
  total_orders: number;
  total_charged_orders: number;
  total_revenue: number;
  pending_collection: number;
  collected_amount: number;
}

interface WorkOrder {
  id: number;
  order_name: string;
  order_number: string;
  task_number: string;
  customer_name: string;
  task_owner: string;
  is_charged: boolean;
  created_at: string;
}

export default function AfterSalesService() {
  const router = useSafeRouter();
  const [statistics, setStatistics] = useState<Statistics>({
    total_orders: 0,
    total_charged_orders: 0,
    total_revenue: 0,
    pending_collection: 0,
    collected_amount: 0,
  });
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');

  useEffect(() => {
    loadStatistics();
    loadOrders();
  }, []);

  const loadStatistics = async () => {
    try {
      const response = await fetch(
        `${getApiBaseUrl()}/api/v1/after-sales/statistics`
      );
      const data = await response.json();
      if (response.ok) {
        setStatistics(data);
      }
    } catch (error) {
      console.error('Fetch statistics error:', error);
    }
  };

  const loadOrders = async (keyword?: string) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (keyword) {
        params.append('keyword', keyword);
      }

      const response = await fetch(
        `${getApiBaseUrl()}/api/v1/after-sales/orders?${params.toString()}`
      );
      const data = await response.json();
      if (response.ok) {
        setOrders(data);
      }
    } catch (error) {
      console.error('Fetch orders error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadOrders(searchKeyword);
  };

  const handleCreateOrder = () => {
    router.push('/after-sales-create');
  };

  const handleViewPendingAudit = () => {
    router.push('/after-sales-audit');
  };

  const handleViewDetail = (orderId: number) => {
    router.push('/after-sales-detail', { id: orderId });
  };

  const handleEdit = (orderId: number) => {
    router.push('/after-sales-edit', { id: orderId });
  };

  const handleDownload = async (orderId: number) => {
    // 下载PDF工单
    alert('下载PDF工单功能开发中');
  };

  return (
    <Screen>
      <PageHeader title="售后服务" />

      <ScrollView style={styles.container}>
        {/* 栏1：快捷操作 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FontAwesome6 name="bolt" size={18} color="#1E88E5" />
            <Text style={styles.sectionTitle}>快捷操作</Text>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton} onPress={handleCreateOrder}>
              <FontAwesome6 name="circle-plus" size={24} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>新建工单</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionButton, styles.auditButton]} onPress={handleViewPendingAudit}>
              <FontAwesome6 name="clipboard-check" size={24} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>待审工单</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 栏2：工单统计 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FontAwesome6 name="chart-pie" size={18} color="#1E88E5" />
            <Text style={styles.sectionTitle}>工单统计</Text>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <FontAwesome6 name="file-contract" size={20} color="#1E88E5" />
              <Text style={styles.statValue}>{statistics.total_orders}</Text>
              <Text style={styles.statLabel}>总工单数</Text>
            </View>

            <View style={styles.statCard}>
              <FontAwesome6 name="dollar-sign" size={20} color="#F39C12" />
              <Text style={styles.statValue}>{statistics.total_charged_orders}</Text>
              <Text style={styles.statLabel}>总收费工单</Text>
            </View>

            <View style={styles.statCard}>
              <FontAwesome6 name="money-bill-trend-up" size={20} color="#2ECC71" />
              <Text style={styles.statValue}>{formatMoney(statistics.total_revenue)}</Text>
              <Text style={styles.statLabel}>售后业绩</Text>
            </View>

            <View style={styles.statCard}>
              <FontAwesome6 name="clock" size={20} color="#E74C3C" />
              <Text style={styles.statValue}>{formatMoney(statistics.pending_collection)}</Text>
              <Text style={styles.statLabel}>代收款</Text>
            </View>

            <View style={[styles.statCard, styles.fullWidthCard]}>
              <FontAwesome6 name="circle-check" size={20} color="#3498DB" />
              <Text style={styles.statValue}>{formatMoney(statistics.collected_amount)}</Text>
              <Text style={styles.statLabel}>已收款</Text>
            </View>
          </View>
        </View>

        {/* 栏3：工单查询 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FontAwesome6 name="magnifying-glass" size={18} color="#1E88E5" />
            <Text style={styles.sectionTitle}>工单查询</Text>
          </View>

          {/* 搜索框 */}
          <View style={styles.searchBar}>
            <FontAwesome6 name="magnifying-glass" size={16} color="#636E72" />
            <TextInput
              style={styles.searchInput}
              placeholder="搜索工单名称、客户名称、工单编号、任务号、负责人、设备名称、设备编号"
              value={searchKeyword}
              onChangeText={setSearchKeyword}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
              <Text style={styles.searchButtonText}>搜索</Text>
            </TouchableOpacity>
          </View>

          {/* 工单列表 */}
          {loading ? (
            <View style={styles.centerContainer}>
              <Text>加载中...</Text>
            </View>
          ) : orders.length === 0 ? (
            <View style={styles.centerContainer}>
              <Text style={styles.emptyText}>暂无工单</Text>
            </View>
          ) : (
            orders.map((order) => (
              <View key={order.id} style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <View style={styles.orderTitleContainer}>
                    <FontAwesome6 name="file-contract" size={18} color="#1E88E5" />
                    <View>
                      <Text style={styles.orderTitle}>{order.order_name}</Text>
                      <Text style={styles.orderMeta}>
                        任务号: {order.task_number} · {new Date(order.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>

                  {order.is_charged && (
                    <View style={styles.chargedBadge}>
                      <FontAwesome6 name="dollar-sign" size={10} color="#FFFFFF" />
                      <Text style={styles.chargedText}>收费</Text>
                    </View>
                  )}
                </View>

                <View style={styles.orderInfo}>
                  <View style={styles.infoItem}>
                    <FontAwesome6 name="user" size={12} color="#636E72" />
                    <Text style={styles.infoText}>客户: {order.customer_name}</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <FontAwesome6 name="user-tie" size={12} color="#636E72" />
                    <Text style={styles.infoText}>负责人: {order.task_owner}</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <FontAwesome6 name="hashtag" size={12} color="#636E72" />
                    <Text style={styles.infoText}>工单编号: {order.order_number}</Text>
                  </View>
                </View>

                <View style={styles.orderActions}>
                  <TouchableOpacity
                    style={styles.orderActionButton}
                    onPress={() => handleViewDetail(order.id)}
                  >
                    <FontAwesome6 name="eye" size={14} color="#1E88E5" />
                    <Text style={styles.orderActionText}>查看</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.orderActionButton}
                    onPress={() => handleEdit(order.id)}
                  >
                    <FontAwesome6 name="pen" size={14} color="#F39C12" />
                    <Text style={styles.orderActionText}>修改</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.orderActionButton}
                    onPress={() => handleDownload(order.id)}
                  >
                    <FontAwesome6 name="file-pdf" size={14} color="#E74C3C" />
                    <Text style={styles.orderActionText}>下载</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

function formatMoney(amount: number): string {
  return `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3436',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 8,
    backgroundColor: '#1E88E5',
  },
  auditButton: {
    backgroundColor: '#F39C12',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  fullWidthCard: {
    width: '100%',
    minWidth: '100%',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3436',
  },
  statLabel: {
    fontSize: 12,
    color: '#636E72',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  searchButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#1E88E5',
  },
  searchButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  centerContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#636E72',
  },
  orderCard: {
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  orderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 4,
  },
  orderMeta: {
    fontSize: 12,
    color: '#636E72',
  },
  chargedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#F39C12',
  },
  chargedText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  orderInfo: {
    marginBottom: 12,
    gap: 6,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 13,
    color: '#636E72',
  },
  orderActions: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  orderActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
  },
  orderActionText: {
    fontSize: 13,
    color: '#2D3436',
    fontWeight: '500',
  },
});
