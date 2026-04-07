import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { PageHeader } from '@/components/PageHeader';
import { FontAwesome6 } from '@expo/vector-icons';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { getApiBaseUrl } from '@/utils/api';

interface LedgerItem {
  id: number;
  name?: string;
  device_number?: string;
  device_model?: string;
  status?: string;
  order_number?: string;
  service_type?: string;
  created_at?: string;
}

export default function ContractLedger() {
  const router = useSafeRouter();
  const { contractId, type } = useSafeSearchParams<{ contractId: string; type: string }>();
  const [items, setItems] = useState<LedgerItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadLedger = async () => {
      if (!contractId || !type) return;

      try {
        setLoading(true);
        let endpoint = '';
        switch (type) {
          case 'device':
            endpoint = `${getApiBaseUrl()}/api/v1/contracts/${contractId}/devices`;
            break;
          case 'workorder':
            endpoint = `${getApiBaseUrl()}/api/v1/contracts/${contractId}/work-orders`;
            break;
        }

        const response = await fetch(endpoint);
        const data = await response.json();
        if (response.ok) {
          setItems(data);
        }
      } catch (error) {
        console.error('Fetch ledger error:', error);
      } finally {
        setLoading(false);
      }
    };

    loadLedger();
  }, [contractId, type]);

  const getTitle = () => {
    switch (type) {
      case 'device':
        return '设备台账';
      case 'workorder':
        return '售后工单台账';
      default:
        return '台账';
    }
  };

  const handleItemPress = (item: LedgerItem) => {
    if (type === 'device') {
      router.push('/device-detail', { id: item.id });
    } else if (type === 'workorder') {
      router.push('/work-order-detail', { id: item.id });
    }
  };

  const renderItem = (item: LedgerItem) => {
    if (type === 'device') {
      return (
        <TouchableOpacity
          key={item.id}
          style={styles.card}
          onPress={() => handleItemPress(item)}
          activeOpacity={0.7}
        >
          <View style={styles.cardHeader}>
            <FontAwesome6 name="microchip" size={18} color="#2ECC71" />
            <Text style={styles.cardTitle}>{item.device_number}</Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.infoLabel}>设备型号:</Text>
            <Text style={styles.infoValue}>{item.device_model || '-'}</Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.infoLabel}>状态:</Text>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    item.status === '正常'
                      ? 'rgba(46, 204, 113, 0.1)'
                      : 'rgba(231, 76, 60, 0.1)',
                },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  {
                    color: item.status === '正常' ? '#2ECC71' : '#E74C3C',
                  },
                ]}
              >
                {item.status || '-'}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      );
    } else if (type === 'workorder') {
      return (
        <TouchableOpacity
          key={item.id}
          style={styles.card}
          onPress={() => handleItemPress(item)}
          activeOpacity={0.7}
        >
          <View style={styles.cardHeader}>
            <FontAwesome6 name="clipboard-list" size={18} color="#9B59B6" />
            <Text style={styles.cardTitle}>{item.order_number}</Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.infoLabel}>服务类型:</Text>
            <Text style={styles.infoValue}>{item.service_type || '-'}</Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.infoLabel}>创建时间:</Text>
            <Text style={styles.infoValue}>{item.created_at || '-'}</Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.infoLabel}>状态:</Text>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    item.status === '已完成'
                      ? 'rgba(46, 204, 113, 0.1)'
                      : 'rgba(241, 196, 15, 0.1)',
                },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  {
                    color: item.status === '已完成' ? '#2ECC71' : '#F1C40F',
                  },
                ]}
              >
                {item.status || '-'}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      );
    }
  };

  if (loading) {
    return (
      <Screen>
        <View style={styles.centerContainer}>
          <Text>加载中...</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <PageHeader title={getTitle()} />

      <ScrollView style={styles.container}>
        {items.length === 0 ? (
          <View style={styles.centerContainer}>
            <FontAwesome6 name="folder-open" size={48} color="#BDC3C7" />
            <Text style={styles.emptyText}>暂无记录</Text>
          </View>
        ) : (
          items.map(renderItem)
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3436',
    flex: 1,
  },
  cardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    justifyContent: 'space-between',
  },
  infoLabel: {
    fontSize: 13,
    color: '#636E72',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2D3436',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    color: '#636E72',
    marginTop: 12,
  },
});
