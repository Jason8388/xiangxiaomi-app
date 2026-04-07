import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { PageHeader } from '@/components/PageHeader';
import { FontAwesome6 } from '@expo/vector-icons';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { getApiBaseUrl } from '@/utils/api';

interface AuditOrder {
  id: number;
  order_name: string;
  order_number: string;
  customer_name: string;
  task_owner: string;
  quote_amount: number;
  is_charged: boolean;
  quote_audit_result?: string;
  created_at: string;
}

export default function AfterSalesAudit() {
  const router = useSafeRouter();
  const [orders, setOrders] = useState<AuditOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${getApiBaseUrl()}/api/v1/after-sales/orders?status=pending_audit`
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

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  const handleViewDetail = (id: number) => {
    router.push('/after-sales-detail', { id });
  };

  const getStatusBadge = (result?: string) => {
    if (!result) {
      return { text: '待审核', color: '#F39C12', bg: 'rgba(243, 156, 18, 0.1)' };
    }
    switch (result) {
      case 'approved':
        return { text: '已通过', color: '#2ECC71', bg: 'rgba(46, 204, 113, 0.1)' };
      case 'rejected':
        return { text: '已驳回', color: '#E74C3C', bg: 'rgba(231, 76, 60, 0.1)' };
      default:
        return { text: '待审核', color: '#F39C12', bg: 'rgba(243, 156, 18, 0.1)' };
    }
  };

  const renderOrder = ({ item }: { item: AuditOrder }) => {
    const badge = getStatusBadge(item.quote_audit_result);
    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => handleViewDetail(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.orderHeader}>
          <Text style={styles.orderName} numberOfLines={1}>
            {item.order_name}
          </Text>
          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.badgeText, { color: badge.color }]}>{badge.text}</Text>
          </View>
        </View>

        <View style={styles.orderInfo}>
          <View style={styles.infoRow}>
            <FontAwesome6 name="hashtag" size={12} color="#636E72" />
            <Text style={styles.infoText}>{item.order_number}</Text>
          </View>
          <View style={styles.infoRow}>
            <FontAwesome6 name="building" size={12} color="#636E72" />
            <Text style={styles.infoText}>{item.customer_name}</Text>
          </View>
          <View style={styles.infoRow}>
            <FontAwesome6 name="user" size={12} color="#636E72" />
            <Text style={styles.infoText}>{item.task_owner || '未分配'}</Text>
          </View>
        </View>

        {item.is_charged && (
          <View style={styles.quoteContainer}>
            <Text style={styles.quoteLabel}>报价金额</Text>
            <Text style={styles.quoteAmount}>¥{item.quote_amount.toFixed(2)}</Text>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.dateText}>
            {new Date(item.created_at).toLocaleDateString('zh-CN')}
          </Text>
          <FontAwesome6 name="chevron-right" size={14} color="#B2BEC3" />
        </View>
      </TouchableOpacity>
    );
  };

  const filteredOrders = orders.filter((order) =>
    order.order_name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
    order.customer_name.toLowerCase().includes(searchKeyword.toLowerCase())
  );

  return (
    <Screen>
      <PageHeader title="待审核工单" />

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <FontAwesome6 name="magnifying-glass" size={16} color="#B2BEC3" />
          <TextInput
            style={styles.searchInput}
            value={searchKeyword}
            onChangeText={setSearchKeyword}
            placeholder="搜索工单名称或客户"
            placeholderTextColor="#B2BEC3"
          />
        </View>
      </View>

      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderOrder}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <FontAwesome6 name="clipboard-list" size={48} color="#B2BEC3" />
            <Text style={styles.emptyText}>暂无待审核工单</Text>
          </View>
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F5F7FA',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#2D3436',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3436',
    flex: 1,
    marginRight: 12,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  orderInfo: {
    gap: 6,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#636E72',
  },
  quoteContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(108, 99, 255, 0.06)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  quoteLabel: {
    fontSize: 13,
    color: '#636E72',
  },
  quoteAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6C63FF',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    color: '#B2BEC3',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    color: '#B2BEC3',
    marginTop: 12,
  },
});
