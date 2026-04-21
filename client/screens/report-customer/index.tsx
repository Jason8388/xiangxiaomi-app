import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { PageHeader } from '@/components/PageHeader';
import { FontAwesome6 } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { getApiBaseUrl } from '@/utils/api';
import { useSafeRouter } from '@/hooks/useSafeRouter';

interface SummaryData {
  total_customers: number;
  total_contracts: number;
  total_devices: number;
  total_after_sales: number;
  updated_at: string;
}

interface CustomerReportItem {
  customer_id: number;
  customer_name: string;
  contact_person: string;
  contact_phone: string;
  contract_count: number;
  device_count: number;
  after_sales_count: number;
  created_at: string;
}

const FILTER_OPTIONS = [
  { label: '全部', value: 'all' },
  { label: '本月', value: 'month' },
  { label: '本季度', value: 'quarter' },
  { label: '本年度', value: 'year' },
];

const EXPORT_OPTIONS = [
  { label: 'Excel 导出', value: 'excel', icon: 'file-excel', color: '#217346' },
  { label: 'PDF 导出', value: 'pdf', icon: 'file-pdf', color: '#E74C3C' },
];

export default function ReportCustomer() {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [details, setDetails] = useState<CustomerReportItem[]>([]);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchModal, setShowSearchModal] = useState(false);
  const router = useSafeRouter();

  useEffect(() => {
    loadReportData();
  }, [selectedFilter]);

  const loadReportData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedFilter !== 'all') {
        params.append('period', selectedFilter);
      }

      const response = await fetch(
        `${getApiBaseUrl()}/api/v1/reports/customers?${params.toString()}`
      );
      const data = await response.json();
      if (response.ok) {
        setSummary(data.summary);
        setDetails(data.details);
      }
    } catch (error) {
      Alert.alert('错误', '加载报表数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: string) => {
    setShowExportModal(false);

    try {
      const params = new URLSearchParams();
      params.append('format', format);
      if (selectedFilter !== 'all') {
        params.append('period', selectedFilter);
      }

      const response = await fetch(
        `${getApiBaseUrl()}/api/v1/reports/customers/export?${params.toString()}`
      );

      if (!response.ok) throw new Error('导出失败');

      // 检测平台
      if (typeof window !== 'undefined') {
        // Web端
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `客户统计表_${new Date().toLocaleDateString()}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        // 移动端
        const fileName = `客户统计表_${new Date().toLocaleDateString()}.${format}`;
        const fileUri = `${(FileSystem as any).cacheDirectory}${fileName}`;

        const fileInfo = await (FileSystem as any).downloadAsync(response.url, fileUri);
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(fileInfo.uri);
        } else {
          Alert.alert('提示', '分享功能不可用');
        }
      }

      Alert.alert('成功', '导出成功');
    } catch (error) {
      Alert.alert('错误', '导出失败');
    }
  };

  const handleViewDetail = (customerId: number, customerName: string) => {
    router.push('/report-customer-detail', {
      customerId,
      customerName,
    });
  };

  const handleSearch = () => {
    setShowSearchModal(false);
    // 根据搜索词过滤数据
    if (searchQuery.trim()) {
      const filtered = details.filter((item) =>
        item.customer_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (filtered.length === 0) {
        Alert.alert('提示', `未找到包含"${searchQuery}"的客户`);
      } else {
        Alert.alert('提示', `找到 ${filtered.length} 个匹配的客户`);
      }
    }
  };

  if (loading) {
    return (
      <Screen>
        <PageHeader title="客户统计表" />
        <View style={styles.centerContainer}>
          <Text>加载中...</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <PageHeader title="客户统计表" />

      <ScrollView style={styles.container}>
        {/* 统计概览 */}
        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>统计概览</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <FontAwesome6 name="building" size={28} color="#1E88E5" />
              <Text style={styles.summaryValue}>{summary?.total_customers || 0}</Text>
              <Text style={styles.summaryLabel}>客户总数</Text>
            </View>
            <View style={styles.summaryCard}>
              <FontAwesome6 name="file-contract" size={28} color="#3498DB" />
              <Text style={styles.summaryValue}>{summary?.total_contracts || 0}</Text>
              <Text style={styles.summaryLabel}>合同总数</Text>
            </View>
            <View style={styles.summaryCard}>
              <FontAwesome6 name="microchip" size={28} color="#2ECC71" />
              <Text style={styles.summaryValue}>{summary?.total_devices || 0}</Text>
              <Text style={styles.summaryLabel}>设备总数</Text>
            </View>
            <View style={styles.summaryCard}>
              <FontAwesome6 name="screwdriver-wrench" size={28} color="#E67E22" />
              <Text style={styles.summaryValue}>{summary?.total_after_sales || 0}</Text>
              <Text style={styles.summaryLabel}>售后工单总数</Text>
            </View>
          </View>
          {summary && (
            <Text style={styles.updateTime}>
              更新时间：{new Date(summary.updated_at).toLocaleString()}
            </Text>
          )}
        </View>

        {/* 操作栏 */}
        <View style={styles.actionBar}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilterModal(true)}
          >
            <FontAwesome6 name="filter" size={14} color="#1E88E5" />
            <Text style={styles.actionButtonText}>
              {FILTER_OPTIONS.find((f) => f.value === selectedFilter)?.label}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => setShowSearchModal(true)}
          >
            <FontAwesome6 name="search" size={14} color="#FFFFFF" />
            <Text style={styles.actionButtonTextWhite}>查询</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.exportButton}
            onPress={() => setShowExportModal(true)}
          >
            <FontAwesome6 name="file-export" size={14} color="#FFFFFF" />
            <Text style={styles.actionButtonTextWhite}>导出</Text>
          </TouchableOpacity>
        </View>

        {/* 明细列表 */}
        <View style={styles.detailsSection}>
          <Text style={styles.detailsTitle}>客户明细（{details?.length || 0}）</Text>
          {(details || []).map((item) => (
            <View key={item.customer_id} style={styles.detailCard}>
              <View style={styles.detailHeader}>
                <FontAwesome6 name="building" size={20} color="#1E88E5" />
                <View style={styles.detailInfo}>
                  <Text style={styles.customerName}>{item.customer_name}</Text>
                  <Text style={styles.contactInfo}>
                    {item.contact_person} · {item.contact_phone}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.viewButton}
                  onPress={() =>
                    handleViewDetail(item.customer_id, item.customer_name)
                  }
                >
                  <FontAwesome6 name="chevron-right" size={16} color="#636E72" />
                </TouchableOpacity>
              </View>
              <View style={styles.detailStats}>
                <View style={styles.statItem}>
                  <FontAwesome6 name="file-contract" size={14} color="#3498DB" />
                  <Text style={styles.statLabel}>合同</Text>
                  <Text style={styles.statValue}>{item.contract_count}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <FontAwesome6 name="microchip" size={14} color="#2ECC71" />
                  <Text style={styles.statLabel}>设备</Text>
                  <Text style={styles.statValue}>{item.device_count}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <FontAwesome6 name="screwdriver-wrench" size={14} color="#E67E22" />
                  <Text style={styles.statLabel}>售后</Text>
                  <Text style={styles.statValue}>{item.after_sales_count}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* 筛选弹窗 */}
      <Modal visible={showFilterModal} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowFilterModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>选择时间范围</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <FontAwesome6 name="xmark" size={20} color="#636E72" />
              </TouchableOpacity>
            </View>
            {FILTER_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionItem,
                  selectedFilter === option.value && styles.optionItemActive,
                ]}
                onPress={() => {
                  setSelectedFilter(option.value);
                  setShowFilterModal(false);
                }}
              >
                <Text
                  style={[
                    styles.optionText,
                    selectedFilter === option.value && styles.optionTextActive,
                  ]}
                >
                  {option.label}
                </Text>
                {selectedFilter === option.value && (
                  <FontAwesome6 name="check" size={16} color="#1E88E5" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 搜索弹窗 */}
      <Modal visible={showSearchModal} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSearchModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>查询客户</Text>
              <TouchableOpacity onPress={() => setShowSearchModal(false)}>
                <FontAwesome6 name="xmark" size={20} color="#636E72" />
              </TouchableOpacity>
            </View>
            <View style={styles.searchInputContainer}>
              <FontAwesome6 name="search" size={16} color="#95A5A6" />
              <TextInput
                style={styles.searchInput}
                placeholder="输入客户名称"
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#95A5A6"
              />
            </View>
            <TouchableOpacity
              style={styles.searchSubmitButton}
              onPress={handleSearch}
            >
              <Text style={styles.searchSubmitButtonText}>查询</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 导出弹窗 */}
      <Modal visible={showExportModal} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowExportModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>选择导出格式</Text>
              <TouchableOpacity onPress={() => setShowExportModal(false)}>
                <FontAwesome6 name="xmark" size={20} color="#636E72" />
              </TouchableOpacity>
            </View>
            {EXPORT_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={styles.exportOptionItem}
                onPress={() => handleExport(option.value)}
              >
                <FontAwesome6
                  name={option.icon as any}
                  size={24}
                  color={option.color}
                />
                <Text style={styles.exportOptionText}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summarySection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  summaryCard: {
    width: '47%',
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2D3436',
    marginTop: 8,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#636E72',
  },
  updateTime: {
    fontSize: 12,
    color: '#95A5A6',
    textAlign: 'center',
  },
  actionBar: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: '#F5F7FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  exportButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: '#1E88E5',
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#1E88E5',
    fontWeight: '500',
  },
  actionButtonTextWhite: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  searchButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: '#3498DB',
    borderRadius: 8,
  },
  detailsSection: {
    marginBottom: 20,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 12,
  },
  detailCard: {
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
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  detailInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 4,
  },
  contactInfo: {
    fontSize: 13,
    color: '#636E72',
  },
  viewButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F7FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailStats: {
    flexDirection: 'row',
    backgroundColor: '#F5F7FA',
    borderRadius: 8,
    padding: 12,
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  statLabel: {
    fontSize: 12,
    color: '#95A5A6',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3436',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E0E0E0',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '85%',
    maxWidth: 320,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3436',
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F7FA',
  },
  optionItemActive: {
    backgroundColor: 'rgba(30, 136, 229, 0.05)',
  },
  optionText: {
    fontSize: 15,
    color: '#2D3436',
  },
  optionTextActive: {
    color: '#1E88E5',
    fontWeight: '600',
  },
  exportOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F7FA',
  },
  exportOptionText: {
    fontSize: 15,
    color: '#2D3436',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F5F7FA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#2D3436',
  },
  searchSubmitButton: {
    backgroundColor: '#1E88E5',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  searchSubmitButtonText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
