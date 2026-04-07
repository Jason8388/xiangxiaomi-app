import React, { useState } from 'react';
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

interface WorkOrder {
  id: number;
  order_no: string;
  name: string;
  task_no: string;
  customer_name: string;
  sales_sub_project_no: string;
  contract_no: string;
  contract_name: string;
  task_progress: string;
  task_phase: string;
  created_at: string;
}

export default function WorkOrderQuery() {
  const router = useSafeRouter();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [results, setResults] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!searchKeyword.trim()) {
      return;
    }

    try {
      setLoading(true);
      setHasSearched(true);
      const response = await fetch(
        `${getApiBaseUrl()}/api/v1/work-orders/search?keyword=${encodeURIComponent(searchKeyword)}`
      );
      const data = await response.json();
      if (response.ok) {
        setResults(data.orders || []);
      } else {
        setResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case '需求阶段': return '#6C63FF';
      case '实施阶段': return '#00B894';
      case '回款阶段': return '#F39C12';
      case '关单存档': return '#3498DB';
      case '异常状态': return '#E74C3C';
      default: return '#636E72';
    }
  };

  return (
    <Screen>
      <PageHeader title="工单查询" />

      <View style={styles.container}>
        <View style={styles.searchContainer}>
          <FontAwesome6 name="magnifying-glass" size={18} color="#636E72" />
          <TextInput
            style={styles.searchInput}
            placeholder="输入工单号、工单名称、任务号、客户名称、销售子项目号、合同名称、合同编号"
            placeholderTextColor="#B2BEC3"
            value={searchKeyword}
            onChangeText={setSearchKeyword}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchKeyword.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchKeyword(''); setResults([]); setHasSearched(false); }}>
              <FontAwesome6 name="xmark" size={16} color="#95A5A6" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.tipContainer}>
          <FontAwesome6 name="circle-info" size={14} color="#6C63FF" />
          <Text style={styles.tipText}>
            支持按工单号、工单名称、任务号、客户名称、销售子项目号、合同名称、合同编号查询
          </Text>
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <FontAwesome6 name="spinner" size={32} color="#6C63FF" />
            <Text style={styles.loadingText}>搜索中...</Text>
          </View>
        ) : results.length === 0 && hasSearched ? (
          <View style={styles.centerContainer}>
            <FontAwesome6 name="file-circle-xmark" size={48} color="#95A5A6" />
            <Text style={styles.emptyText}>未找到相关工单</Text>
            <Text style={styles.emptySubText}>请尝试其他关键词</Text>
          </View>
        ) : results.length === 0 ? (
          <View style={styles.centerContainer}>
            <FontAwesome6 name="screwdriver-wrench" size={48} color="#95A5A6" />
            <Text style={styles.emptyText}>请输入关键词进行搜索</Text>
            <Text style={styles.emptySubText}>支持多种查询条件组合</Text>
          </View>
        ) : (
          <ScrollView style={styles.resultsContainer} showsVerticalScrollIndicator={false}>
            <Text style={styles.resultsTitle}>查询结果（{results.length}）</Text>
            {results.map((order) => (
              <TouchableOpacity
                key={order.id}
                style={styles.orderCard}
                onPress={() => router.push('/work-order-detail', { id: order.id.toString() })}
                activeOpacity={0.7}
              >
                <View style={styles.orderHeader}>
                  <View style={styles.orderTitleContainer}>
                    <FontAwesome6 name="screwdriver-wrench" size={18} color="#6C63FF" />
                    <Text style={styles.orderName} numberOfLines={1}>
                      {order.name || '无名称'}
                    </Text>
                  </View>
                  <View
                    style={[styles.phaseBadge, { backgroundColor: `${getPhaseColor(order.task_phase)}20` }]}
                  >
                    <Text style={[styles.phaseBadgeText, { color: getPhaseColor(order.task_phase) }]}>
                      {order.task_phase}
                    </Text>
                  </View>
                </View>

                <View style={styles.orderDetails}>
                  <View style={styles.detailRow}>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>工单号</Text>
                      <Text style={styles.detailValue}>{order.order_no}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>任务号</Text>
                      <Text style={styles.detailValue}>{order.task_no || '-'}</Text>
                    </View>
                  </View>
                  <View style={styles.detailRow}>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>客户名称</Text>
                      <Text style={styles.detailValue}>{order.customer_name || '-'}</Text>
                    </View>
                  </View>
                  <View style={styles.detailRow}>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>销售子项目号</Text>
                      <Text style={styles.detailValue}>{order.sales_sub_project_no || '-'}</Text>
                    </View>
                  </View>
                  <View style={styles.detailRow}>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>合同编号</Text>
                      <Text style={styles.detailValue}>{order.contract_no || '-'}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>合同名称</Text>
                      <Text style={styles.detailValue} numberOfLines={1}>{order.contract_name || '-'}</Text>
                    </View>
                  </View>
                  <View style={styles.detailRow}>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>任务进度</Text>
                      <Text style={styles.detailValue}>{order.task_progress || '-'}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.orderFooter}>
                  <Text style={styles.createdDate}>
                    创建于 {order.created_at ? new Date(order.created_at).toLocaleDateString() : '-'}
                  </Text>
                  <View style={styles.viewDetail}>
                    <Text style={styles.viewDetailText}>查看详情</Text>
                    <FontAwesome6 name="chevron-right" size={14} color="#6C63FF" />
                  </View>
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
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#D1D9E6',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#2D3436',
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(108, 99, 255, 0.08)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 12,
    marginBottom: 16,
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    color: '#6C63FF',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    fontSize: 14,
    color: '#6C63FF',
    marginTop: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#636E72',
    marginTop: 12,
  },
  emptySubText: {
    fontSize: 13,
    color: '#95A5A6',
    marginTop: 6,
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
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#D1D9E6',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  orderTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 10,
  },
  orderName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3436',
    flex: 1,
  },
  phaseBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  phaseBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  orderDetails: {
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailItem: {
    flex: 1,
    marginRight: 12,
  },
  detailLabel: {
    fontSize: 11,
    color: '#95A5A6',
    marginBottom: 3,
  },
  detailValue: {
    fontSize: 13,
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
  viewDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewDetailText: {
    fontSize: 13,
    color: '#6C63FF',
    fontWeight: '500',
  },
});
