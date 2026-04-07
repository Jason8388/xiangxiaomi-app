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
import { getApiBaseUrl } from '@/utils/api';

interface QueryCustomer {
  id: number;
  name: string;
  contact_person: string;
  contact_phone: string;
  email?: string;
  address?: string;
  contract_count: number;
  device_count: number;
  after_sales_count: number;
  created_at: string;
}

export default function QueryCustomer() {
  const router = useSafeRouter();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [results, setResults] = useState<QueryCustomer[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchKeyword.trim()) {
      Alert.alert('提示', '请输入搜索关键词');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `${getApiBaseUrl()}/api/v1/query/customers?keyword=${encodeURIComponent(searchKeyword)}`
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

  return (
    <Screen>
      <PageHeader title="客户查询" />

      <View style={styles.container}>
        {/* 搜索框 */}
        <View style={styles.searchContainer}>
          <FontAwesome6 name="magnifying-glass" size={16} color="#636E72" />
          <TextInput
            style={styles.searchInput}
            placeholder="输入客户名称"
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
            支持按客户名称模糊搜索查询客户基础信息、归属合同、归属设备、归属售后服务
          </Text>
        </View>

        {/* 搜索结果 */}
        {loading ? (
          <View style={styles.centerContainer}>
            <Text>查询中...</Text>
          </View>
        ) : results.length === 0 && searchKeyword ? (
          <View style={styles.centerContainer}>
            <FontAwesome6 name="building-circle-xmark" size={48} color="#95A5A6" />
            <Text style={styles.emptyText}>未找到相关客户</Text>
          </View>
        ) : results.length === 0 ? (
          <View style={styles.centerContainer}>
            <FontAwesome6 name="building" size={48} color="#95A5A6" />
            <Text style={styles.emptyText}>请输入关键词进行搜索</Text>
          </View>
        ) : (
          <ScrollView style={styles.resultsContainer}>
            <Text style={styles.resultsTitle}>查询结果（{results.length}）</Text>
            {results.map((customer) => (
              <TouchableOpacity
                key={customer.id}
                style={styles.customerCard}
                onPress={() => router.push('/customer-detail', { id: customer.id })}
              >
                <View style={styles.customerHeader}>
                  <View style={styles.customerIcon}>
                    <FontAwesome6 name="building" size={24} color="#1E88E5" />
                  </View>
                  <View style={styles.customerInfo}>
                    <Text style={styles.customerName}>{customer.name}</Text>
                    <Text style={styles.customerContact}>
                      {customer.contact_person} · {customer.contact_phone}
                    </Text>
                  </View>
                </View>

                {/* 关联统计 */}
                <View style={styles.statsContainer}>
                  <View style={styles.statItem}>
                    <FontAwesome6 name="file-contract" size={16} color="#3498DB" />
                    <Text style={styles.statLabel}>合同</Text>
                    <Text style={styles.statValue}>{customer.contract_count}</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <FontAwesome6 name="microchip" size={16} color="#2ECC71" />
                    <Text style={styles.statLabel}>设备</Text>
                    <Text style={styles.statValue}>{customer.device_count}</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <FontAwesome6 name="screwdriver-wrench" size={16} color="#E67E22" />
                    <Text style={styles.statLabel}>售后</Text>
                    <Text style={styles.statValue}>{customer.after_sales_count}</Text>
                  </View>
                </View>

                <View style={styles.customerFooter}>
                  <Text style={styles.createdDate}>
                    创建于 {new Date(customer.created_at).toLocaleDateString()}
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
  customerCard: {
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
  customerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  customerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(30, 136, 229, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 4,
  },
  customerContact: {
    fontSize: 13,
    color: '#636E72',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#95A5A6',
  },
  statValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2D3436',
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#E0E0E0',
  },
  customerFooter: {
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
