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

interface QueryDevice {
  id: number;
  device_name: string;
  device_number: string;
  device_id: string;
  device_model: string;
  customer_name?: string;
  project_name?: string;
  status: string;
  created_at: string;
}

export default function QueryDevice() {
  const router = useSafeRouter();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [results, setResults] = useState<QueryDevice[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchKeyword.trim()) {
      Alert.alert('提示', '请输入搜索关键词');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `${getApiBaseUrl()}/api/v1/query/devices?keyword=${encodeURIComponent(searchKeyword)}`
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
      case '正常':
        return '#2ECC71';
      case '故障':
        return '#E74C3C';
      case '维修中':
        return '#F39C12';
      case '报废':
        return '#95A5A6';
      default:
        return '#636E72';
    }
  };

  return (
    <Screen>
      <PageHeader title="设备查询" />

      <View style={styles.container}>
        {/* 搜索框 */}
        <View style={styles.searchContainer}>
          <FontAwesome6 name="magnifying-glass" size={16} color="#636E72" />
          <TextInput
            style={styles.searchInput}
            placeholder="输入客户、项目、设备名称、编号、ID、型号"
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
            支持按客户名称、项目名称、设备名称、设备出厂编号、设备ID、设备型号搜索
          </Text>
        </View>

        {/* 搜索结果 */}
        {loading ? (
          <View style={styles.centerContainer}>
            <Text>查询中...</Text>
          </View>
        ) : results.length === 0 && searchKeyword ? (
          <View style={styles.centerContainer}>
            <FontAwesome6 name="circle-xmark" size={48} color="#95A5A6" />
            <Text style={styles.emptyText}>未找到相关设备</Text>
          </View>
        ) : results.length === 0 ? (
          <View style={styles.centerContainer}>
            <FontAwesome6 name="microchip" size={48} color="#95A5A6" />
            <Text style={styles.emptyText}>请输入关键词进行搜索</Text>
          </View>
        ) : (
          <ScrollView style={styles.resultsContainer}>
            <Text style={styles.resultsTitle}>查询结果（{results.length}）</Text>
            {results.map((device) => (
              <TouchableOpacity
                key={device.id}
                style={styles.deviceCard}
                onPress={() => router.push('/device-detail', { id: device.id })}
              >
                <View style={styles.deviceHeader}>
                  <View style={styles.deviceIcon}>
                    <FontAwesome6 name="microchip" size={24} color="#1E88E5" />
                  </View>
                  <View style={styles.deviceInfo}>
                    <Text style={styles.deviceName}>{device.device_name}</Text>
                    <Text style={styles.deviceNumber}>{device.device_number}</Text>
                  </View>
                  <View
                    style={[styles.statusBadge, { backgroundColor: `${getStatusColor(device.status)}20` }]}
                  >
                    <FontAwesome6
                      name="circle-dot"
                      size={10}
                      color={getStatusColor(device.status)}
                    />
                    <Text style={[styles.statusText, { color: getStatusColor(device.status) }]}>
                      {device.status}
                    </Text>
                  </View>
                </View>

                {/* 设备详情 */}
                <View style={styles.deviceDetails}>
                  <View style={styles.detailItem}>
                    <FontAwesome6 name="fingerprint" size={12} color="#636E72" />
                    <Text style={styles.detailLabel}>设备ID：</Text>
                    <Text style={styles.detailValue}>{device.device_id}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <FontAwesome6 name="cube" size={12} color="#636E72" />
                    <Text style={styles.detailLabel}>型号：</Text>
                    <Text style={styles.detailValue}>{device.device_model}</Text>
                  </View>
                </View>

                {/* 关联信息 */}
                {(device.customer_name || device.project_name) && (
                  <View style={styles.relations}>
                    {device.customer_name && (
                      <View style={styles.relationTag}>
                        <FontAwesome6 name="building" size={10} color="#636E72" />
                        <Text style={styles.relationText}>{device.customer_name}</Text>
                      </View>
                    )}
                    {device.project_name && (
                      <View style={styles.relationTag}>
                        <FontAwesome6 name="folder-open" size={10} color="#636E72" />
                        <Text style={styles.relationText}>{device.project_name}</Text>
                      </View>
                    )}
                  </View>
                )}

                <View style={styles.deviceFooter}>
                  <Text style={styles.createdDate}>
                    创建于 {new Date(device.created_at).toLocaleDateString()}
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
  deviceCard: {
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
  deviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  deviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(30, 136, 229, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 4,
  },
  deviceNumber: {
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
  deviceDetails: {
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
  relations: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  relationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#F5F7FA',
  },
  relationText: {
    fontSize: 11,
    color: '#636E72',
  },
  deviceFooter: {
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
