import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, TextInput, Keyboard } from 'react-native';
import { Screen } from '@/components/Screen';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { FontAwesome6 } from '@expo/vector-icons';
import { getApiBaseUrl } from '@/utils/api';

interface Customer {
  id: number;
  customer_name: string;
}

interface Contract {
  id: number;
  contract_name: string;
  contract_number: string;
  contract_date: string;
  contract_amount: number;
  payment_status: string;
}

interface Device {
  id: number;
  device_name: string;
  device_sn: string;
  device_model: string;
  device_type: string;
  delivery_date: string;
  acceptance_date: string;
}

interface WorkOrder {
  id: number;
  work_order_number: string;
  work_order_type: string;
  priority: string;
  status: string;
  created_at: string;
}

export default function CustomerReportDetailScreen() {
  const router = useSafeRouter();
  const { customerId } = useSafeSearchParams<{ customerId: string }>();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'contracts' | 'devices' | 'workorders'>('contracts');

  useEffect(() => {
    if (customerId) {
      fetchData();
    }
  }, [customerId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const baseUrl = getApiBaseUrl();

      // Fetch customer info
      const customerRes = await fetch(`${baseUrl}/api/v1/customers/${customerId}`);
      if (customerRes.ok) {
        const customerData = await customerRes.json();
        setCustomer(customerData);
      }

      // Fetch contracts
      const contractsRes = await fetch(`${baseUrl}/api/v1/reports/customers/${customerId}/contracts`);
      if (contractsRes.ok) {
        const contractsData = await contractsRes.json();
        setContracts(contractsData.contracts || []);
      }

      // Fetch devices
      const devicesRes = await fetch(`${baseUrl}/api/v1/reports/customers/${customerId}/devices`);
      if (devicesRes.ok) {
        const devicesData = await devicesRes.json();
        setDevices(devicesData.devices || []);
      }

      // Fetch work orders
      const workOrdersRes = await fetch(`${baseUrl}/api/v1/reports/customers/${customerId}/workorders`);
      if (workOrdersRes.ok) {
        const workOrdersData = await workOrdersRes.json();
        setWorkOrders(workOrdersData.work_orders || []);
      }
    } catch (error) {
      console.error('Failed to fetch customer report detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPaymentStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      '已支付': '#2ECC71',
      '部分支付': '#F39C12',
      '未支付': '#E74C3C',
    };
    return colors[status] || '#95A5A6';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      '紧急': '#E74C3C',
      '高': '#F39C12',
      '中': '#3498DB',
      '低': '#95A5A6',
    };
    return colors[priority] || '#95A5A6';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      '待处理': '#F39C12',
      '处理中': '#3498DB',
      '已完成': '#2ECC71',
      '已取消': '#95A5A6',
    };
    return colors[status] || '#95A5A6';
  };

  const renderContracts = () => (
    <View style={styles.listContainer}>
      {contracts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <FontAwesome6 name="file-contract" size={48} color="#E0E0E0" />
          <Text style={styles.emptyText}>暂无合同</Text>
        </View>
      ) : (
        contracts.map((contract) => (
          <View key={contract.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{contract.contract_name}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getPaymentStatusColor(contract.payment_status) }]}>
                <Text style={styles.statusText}>{contract.payment_status}</Text>
              </View>
            </View>
            <View style={styles.cardRow}>
              <FontAwesome6 name="hashtag" size={12} color="#95A5A6" />
              <Text style={styles.cardLabel}>合同编号：</Text>
              <Text style={styles.cardValue}>{contract.contract_number}</Text>
            </View>
            <View style={styles.cardRow}>
              <FontAwesome6 name="calendar" size={12} color="#95A5A6" />
              <Text style={styles.cardLabel}>合同日期：</Text>
              <Text style={styles.cardValue}>
                {contract.contract_date ? new Date(contract.contract_date).toLocaleDateString() : '-'}
              </Text>
            </View>
            <View style={styles.cardRow}>
              <FontAwesome6 name="yuan-sign" size={12} color="#95A5A6" />
              <Text style={styles.cardLabel}>合同金额：</Text>
              <Text style={styles.cardValue}>¥{contract.contract_amount?.toLocaleString()}</Text>
            </View>
          </View>
        ))
      )}
    </View>
  );

  const renderDevices = () => (
    <View style={styles.listContainer}>
      {devices.length === 0 ? (
        <View style={styles.emptyContainer}>
          <FontAwesome6 name="microchip" size={48} color="#E0E0E0" />
          <Text style={styles.emptyText}>暂无设备</Text>
        </View>
      ) : (
        devices.map((device) => (
          <View key={device.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{device.device_name}</Text>
            </View>
            <View style={styles.cardRow}>
              <FontAwesome6 name="hashtag" size={12} color="#95A5A6" />
              <Text style={styles.cardLabel}>出厂编号：</Text>
              <Text style={styles.cardValue}>{device.device_sn}</Text>
            </View>
            <View style={styles.cardRow}>
              <FontAwesome6 name="cube" size={12} color="#95A5A6" />
              <Text style={styles.cardLabel}>设备型号：</Text>
              <Text style={styles.cardValue}>{device.device_model}</Text>
            </View>
            <View style={styles.cardRow}>
              <FontAwesome6 name="tag" size={12} color="#95A5A6" />
              <Text style={styles.cardLabel}>设备类型：</Text>
              <Text style={styles.cardValue}>{device.device_type}</Text>
            </View>
            <View style={styles.cardRow}>
              <FontAwesome6 name="truck" size={12} color="#95A5A6" />
              <Text style={styles.cardLabel}>交付日期：</Text>
              <Text style={styles.cardValue}>
                {device.delivery_date ? new Date(device.delivery_date).toLocaleDateString() : '-'}
              </Text>
            </View>
            {device.acceptance_date && (
              <View style={styles.cardRow}>
                <FontAwesome6 name="check-circle" size={12} color="#95A5A6" />
                <Text style={styles.cardLabel}>验收日期：</Text>
                <Text style={styles.cardValue}>
                  {new Date(device.acceptance_date).toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>
        ))
      )}
    </View>
  );

  const renderWorkOrders = () => (
    <View style={styles.listContainer}>
      {workOrders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <FontAwesome6 name="screwdriver-wrench" size={48} color="#E0E0E0" />
          <Text style={styles.emptyText}>暂无工单</Text>
        </View>
      ) : (
        workOrders.map((workOrder) => (
          <View key={workOrder.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{workOrder.work_order_number}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(workOrder.status) }]}>
                <Text style={styles.statusText}>{workOrder.status}</Text>
              </View>
            </View>
            <View style={styles.cardRow}>
              <FontAwesome6 name="tag" size={12} color="#95A5A6" />
              <Text style={styles.cardLabel}>工单类型：</Text>
              <Text style={styles.cardValue}>{workOrder.work_order_type}</Text>
            </View>
            <View style={styles.cardRow}>
              <FontAwesome6 name="flag" size={12} color="#95A5A6" />
              <Text style={styles.cardLabel}>优先级：</Text>
              <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(workOrder.priority) }]}>
                <Text style={styles.statusText}>{workOrder.priority}</Text>
              </View>
            </View>
            <View style={styles.cardRow}>
              <FontAwesome6 name="clock" size={12} color="#95A5A6" />
              <Text style={styles.cardLabel}>创建时间：</Text>
              <Text style={styles.cardValue}>
                {workOrder.created_at ? new Date(workOrder.created_at).toLocaleString() : '-'}
              </Text>
            </View>
          </View>
        ))
      )}
    </View>
  );

  if (loading) {
    return (
      <Screen style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>加载中...</Text>
      </Screen>
    );
  }

  return (
    <Screen style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <FontAwesome6 name="arrow-left" size={20} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>客户统计详情</Text>
        </View>

        {/* Customer Info */}
        {customer && (
          <View style={styles.customerInfo}>
            <View style={styles.customerHeader}>
              <FontAwesome6 name="building" size={24} color="#007AFF" />
              <Text style={styles.customerName}>{customer.customer_name}</Text>
            </View>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{contracts.length}</Text>
                <Text style={styles.statLabel}>合同数</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{devices.length}</Text>
                <Text style={styles.statLabel}>设备数</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{workOrders.length}</Text>
                <Text style={styles.statLabel}>工单数</Text>
              </View>
            </View>
          </View>
        )}

        {/* Tabs */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'contracts' && styles.activeTab]}
            onPress={() => setActiveTab('contracts')}
          >
            <FontAwesome6 name="file-contract" size={16} color={activeTab === 'contracts' ? '#007AFF' : '#95A5A6'} />
            <Text style={[styles.tabText, activeTab === 'contracts' && styles.activeTabText]}>
              合同（{contracts.length}）
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'devices' && styles.activeTab]}
            onPress={() => setActiveTab('devices')}
          >
            <FontAwesome6 name="microchip" size={16} color={activeTab === 'devices' ? '#007AFF' : '#95A5A6'} />
            <Text style={[styles.tabText, activeTab === 'devices' && styles.activeTabText]}>
              设备（{devices.length}）
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'workorders' && styles.activeTab]}
            onPress={() => setActiveTab('workorders')}
          >
            <FontAwesome6 name="screwdriver-wrench" size={16} color={activeTab === 'workorders' ? '#007AFF' : '#95A5A6'} />
            <Text style={[styles.tabText, activeTab === 'workorders' && styles.activeTabText]}>
              工单（{workOrders.length}）
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {activeTab === 'contracts' && renderContracts()}
        {activeTab === 'devices' && renderDevices()}
        {activeTab === 'workorders' && renderWorkOrders()}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  headerTitle: {
    flex: 1,
    marginLeft: 12,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  customerInfo: {
    margin: 16,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  customerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  customerName: {
    marginLeft: 12,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E0E0E0',
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  listContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  cardValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: '#999',
  },
});
