import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { PageHeader } from '@/components/PageHeader';
import { FontAwesome6 } from '@expo/vector-icons';
import { useSafeRouter } from '@/hooks/useSafeRouter';

interface QueryAfterSales {
  id: number;
  order_number: string;
  order_name: string;
  customer_name: string;
  product_name: string;
  responsible_person: string;
  order_type: string;
  status: string;
  created_at: string;
}

const ORDER_TYPES: Record<string, string> = {
  'paid': '收费工单',
  'free': '免费工单',
  'pending': '待定工单',
};

export default function QueryAfterSales() {
  const router = useSafeRouter();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [results, setResults] = useState<QueryAfterSales[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchKeyword.trim()) {
      Alert.alert('提示', '请输入搜索关键词');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/query/after-sales?keyword=${encodeURIComponent(searchKeyword)}`
      );
      const data = await response.json();
      if (response.ok) {
        setResults(data);
      }
    } catch (error) {
      Alert.alert('错误', '查询失败');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case '进行中':
        return '#2ECC71';
      case '已完成':
        return '#3498DB';
      case '已取消':
        return '#E74C3C';
      case '挂起':
        return '#F39C12';
      default:
        return '#636E72';
    }
  };

  const getOrderTypeColor = (type: string) => {
    switch (type) {
      case 'paid':
        return '#E74C3C';
      case 'free':
        return '#2ECC71';
      case 'pending':
        return '#F39C12';
      default:
        return '#636E72';
    }
  };

  return (
    <Screen>
      <PageHeader title="售后工单查询" />

      <View style={styles.container}>
        {/* 搜索框 */}
        <View style={styles.searchContainer}>
          <FontAwesome6 name="magnifying-glass" size={16} color="#636E72" />
          <TextInput
            style={styles.searchInput}
            placeholder="输入工单号、名称、客户、产品、负责人"
            value={searchKeyword}
            onChangeText={setSearchKeyword}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <Text style={styles.searchButtonText}>搜索</Text>
          </TouchableOpacity>
        </View>

        {/* 搜索提示 */}
        <View style={styles.tipContainer}>
          <FontAwesome6 name="circle-info" size={14} color="#F39C12" />
          <Text style={styles.tipText}>
            支持按工单号、工单名称、客户名称、产品名称、工单负责人信息模糊搜索查询售后工单
          </Text>
        </View>

        {/* 搜索结果 */}
        {loading ? (
          <View style={styles.centerContainer}>
            <Text>查询中...</Text>
          </View>
        ) : results.length === 0 && searchKeyword ? (
          <View style={styles.centerContainer}>
            <FontAwesome6 name="file-circle-xmark" size={48} color="#95A5A6" />
            <Text style={styles.emptyText}>未找到相关工单</Text>
          </View>
        ) : results.length === 0 ? (
          <View style={styles.centerContainer}>
            <FontAwesome6 name="screwdriver-wrench" size={48} color="#95A5A6" />
            <Text style={styles.emptyText}>请输入关键词进行搜索</Text>
          </View>
        ) : (
          <ScrollView style={styles.resultsContainer}>
            <Text style={styles.resultsTitle}>查询结果（{results.length}）</Text>
            {results.map((order) => (
              <TouchableOpacity
                key={order.id}
                style={styles.orderCard}
                onPress={() => router.push('/after-sales-detail', { id: order.id })}
              >
                <View style={styles.orderHeader}>
                  <View style={styles.orderTitleContainer}>
                    <FontAwesome6 name="screwdriver-wrench" size={18} color="#1E88E5" />
                    <Text style={styles.orderName}>{order.order_name}</Text>
                  </View>
                  <View style={styles.badgesContainer}>
                    <View
                      style={[
                        styles.typeBadge,
                        { backgroundColor: `${getOrderTypeColor(order.order_type)}20` },
                      ]}
                    >
                      <Text style={[styles.badgeText, { color: getOrderTypeColor(order.order_type) }]}>
                        {ORDER_TYPES[order.order_type] || order.order_type}
                      </Text>
                    </View>
                    <View
                      style={[styles.statusBadge, { backgroundColor: `${getStatusColor(order.status)}20` }]}
                    >
                      <FontAwesome6
                        name="circle-dot"
                        size={10}
                        color={getStatusColor(order.status)}
                      />
                      <Text style={[styles.badgeText, { color: getStatusColor(order.status) }]}>
                        {order.status}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* 工单详情 */}
                <View style={styles.orderDetails}>
                  <View style={styles.detailItem}>
                    <FontAwesome6 name="hashtag" size={12} color="#636E72" />
                    <Text style={styles.detailLabel}>工单号：</Text>
                    <Text style={styles.detailValue}>{order.order_number}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <FontAwesome6 name="building" size={12} color="#636E72" />
                    <Text style={styles.detailLabel}>客户：</Text>
                    <Text style={styles.detailValue}>{order.customer_name}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <FontAwesome6 name="box" size={12} color="#636E72" />
                    <Text style={styles.detailLabel}>产品：</Text>
                    <Text style={styles.detailValue}>{order.product_name}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <FontAwesome6 name="user" size={12} color="#636E72" />
                    <Text style={styles.detailLabel}>负责人：</Text>
                    <Text style={styles.detailValue}>{order.responsible_person}</Text>
                  </View>
                </View>

                <View style={styles.orderFooter}>
                  <Text style={styles.createdDate}>
                    创建于 {new Date(order.created_at).toLocaleDateString()}
                  </Text>
                  <FontAwesome6 name="chevron-right" size={16} color="#95A5A6" />
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  searchButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#1E88E5',
  },
  searchButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(243, 156, 18, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 12,
    marginBottom: 16,
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    color: '#F39C12',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 14,
    color: '#636E72',
    marginTop: 12,
  },
  resultsContainer: {
    flex: 1,
  },
  resultsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#636E72',
    marginBottom: 12,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
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
  orderTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  orderName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2D3436',
  },
  badgesContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  orderDetails: {
    backgroundColor: '#F5F7FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: '#636E72',
  },
  detailValue: {
    fontSize: 12,
    color: '#2D3436',
    fontWeight: '500',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  createdDate: {
    fontSize: 12,
    color: '#95A5A6',
  },
});
