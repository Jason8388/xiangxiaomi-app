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

interface QueryContract {
  id: number;
  contract_name: string;
  contract_number: string;
  customer_name: string;
  contract_amount: number;
  start_date: string;
  end_date: string;
  status: string;
  tags: string[];
  created_at: string;
}

export default function QueryContract() {
  const router = useSafeRouter();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [results, setResults] = useState<QueryContract[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchKeyword.trim()) {
      Alert.alert('提示', '请输入搜索关键词');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `${getApiBaseUrl()}/api/v1/query/contracts?keyword=${encodeURIComponent(searchKeyword)}`
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
      case '执行中':
        return '#2ECC71';
      case '已终止':
        return '#E74C3C';
      case '已完成':
        return '#3498DB';
      case '未开始':
        return '#F39C12';
      default:
        return '#636E72';
    }
  };

  return (
    <Screen>
      <PageHeader title="合同查询" />

      <View style={styles.container}>
        {/* 搜索框 */}
        <View style={styles.searchContainer}>
          <FontAwesome6 name="magnifying-glass" size={16} color="#636E72" />
          <TextInput
            style={styles.searchInput}
            placeholder="输入客户、合同名称、编号、标签"
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
            支持按客户名称、合同名称、合同编号、合同标签模糊搜索查询合同信息
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
            <Text style={styles.emptyText}>未找到相关合同</Text>
          </View>
        ) : results.length === 0 ? (
          <View style={styles.centerContainer}>
            <FontAwesome6 name="file-contract" size={48} color="#95A5A6" />
            <Text style={styles.emptyText}>请输入关键词进行搜索</Text>
          </View>
        ) : (
          <ScrollView style={styles.resultsContainer}>
            <Text style={styles.resultsTitle}>查询结果（{results.length}）</Text>
            {results.map((contract) => (
              <TouchableOpacity
                key={contract.id}
                style={styles.contractCard}
                onPress={() => router.push('/contract-detail', { id: contract.id })}
              >
                <View style={styles.contractHeader}>
                  <View style={styles.contractIcon}>
                    <FontAwesome6 name="file-contract" size={24} color="#1E88E5" />
                  </View>
                  <View style={styles.contractInfo}>
                    <Text style={styles.contractName}>{contract.contract_name}</Text>
                    <Text style={styles.contractNumber}>{contract.contract_number}</Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: `${getStatusColor(contract.status)}20` },
                    ]}
                  >
                    <FontAwesome6
                      name="circle-dot"
                      size={10}
                      color={getStatusColor(contract.status)}
                    />
                    <Text style={[styles.statusText, { color: getStatusColor(contract.status) }]}>
                      {contract.status}
                    </Text>
                  </View>
                </View>

                {/* 合同详情 */}
                <View style={styles.contractDetails}>
                  <View style={styles.detailRow}>
                    <View style={styles.detailItem}>
                      <FontAwesome6 name="building" size={12} color="#636E72" />
                      <Text style={styles.detailLabel}>客户：</Text>
                      <Text style={styles.detailValue}>{contract.customer_name}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <FontAwesome6 name="money-bill-wave" size={12} color="#636E72" />
                      <Text style={styles.detailLabel}>金额：</Text>
                      <Text style={styles.detailValue}>
                        ¥{contract.contract_amount.toLocaleString()}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.detailRow}>
                    <View style={styles.detailItem}>
                      <FontAwesome6 name="calendar" size={12} color="#636E72" />
                      <Text style={styles.detailLabel}>起止：</Text>
                      <Text style={styles.detailValue}>
                        {new Date(contract.start_date).toLocaleDateString()} ~{' '}
                        {new Date(contract.end_date).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* 标签 */}
                {contract.tags.length > 0 && (
                  <View style={styles.tagsContainer}>
                    {contract.tags.slice(0, 3).map((tag, index) => (
                      <View key={index} style={styles.tagBadge}>
                        <Text style={styles.tagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                )}

                <View style={styles.contractFooter}>
                  <Text style={styles.createdDate}>
                    创建于 {new Date(contract.created_at).toLocaleDateString()}
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
  contractCard: {
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
  contractHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  contractIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(30, 136, 229, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contractInfo: {
    flex: 1,
  },
  contractName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 4,
  },
  contractNumber: {
    fontSize: 13,
    color: '#95A5A6',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  contractDetails: {
    backgroundColor: '#F5F7FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  detailRow: {
    marginBottom: 8,
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
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  tagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(30, 136, 229, 0.1)',
  },
  tagText: {
    fontSize: 11,
    color: '#1E88E5',
  },
  contractFooter: {
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
