import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { PageHeader } from '@/components/PageHeader';
import { FontAwesome6 } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

interface SummaryData {
  total_orders: number;
  charged_orders: number;
  free_orders: number;
  pending_orders: number;
  completed_orders: number;
  total_amount: number;
  updated_at: string;
}

interface OrderReportItem {
  order_id: number;
  order_number: string;
  order_name: string;
  customer_name: string;
  product_name: string;
  order_type: string;
  status: string;
  owner: string;
  amount: number;
  created_date: string;
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

const TYPE_CONFIG = {
  '收费': { color: '#1E88E5', icon: 'dollar-sign' },
  '免费': { color: '#2ECC71', icon: 'hand-holding-heart' },
};

const STATUS_CONFIG = {
  '待处理': { color: '#F39C12', icon: 'clock' },
  '处理中': { color: '#3498DB', icon: 'cog' },
  '待客户确认': { color: '#9B59B6', icon: 'clipboard-check' },
  '已完成': { color: '#2ECC71', icon: 'check-circle' },
  '已关闭': { color: '#95A5A6', icon: 'archive' },
};

export default function ReportAfterSales() {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [details, setDetails] = useState<OrderReportItem[]>([]);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [loading, setLoading] = useState(false);

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
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/reports/after-sales?${params.toString()}`
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
    Alert.alert('提示', '导出功能待实现');
  };

  const handleViewDetail = (orderId: number) => {
    Alert.alert('提示', '查看工单详情功能待实现');
  };

  if (loading) {
    return (
      <Screen>
        <PageHeader title="售后工单统计表" />
        <View style={styles.centerContainer}>
          <Text>加载中...</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <PageHeader title="售后工单统计表" />

      <ScrollView style={styles.container}>
        {/* 统计概览 */}
        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>统计概览</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <FontAwesome6 name="clipboard-list" size={28} color="#1E88E5" />
              <Text style={styles.summaryValue}>{summary?.total_orders || 0}</Text>
              <Text style={styles.summaryLabel}>工单总数</Text>
            </View>
            <View style={styles.summaryCard}>
              <FontAwesome6 name="dollar-sign" size={28} color="#2ECC71" />
              <Text style={styles.summaryValue}>{summary?.charged_orders || 0}</Text>
              <Text style={styles.summaryLabel}>收费工单</Text>
            </View>
            <View style={styles.summaryCard}>
              <FontAwesome6 name="hand-holding-heart" size={28} color="#F39C12" />
              <Text style={styles.summaryValue}>{summary?.free_orders || 0}</Text>
              <Text style={styles.summaryLabel}>免费工单</Text>
            </View>
            <View style={styles.summaryCard}>
              <FontAwesome6 name="circle-check" size={28} color="#E74C3C" />
              <Text style={styles.summaryValue}>{summary?.completed_orders || 0}</Text>
              <Text style={styles.summaryLabel}>已完成</Text>
            </View>
          </View>

          <View style={styles.amountCard}>
            <FontAwesome6 name="coins" size={32} color="#F39C12" />
            <View>
              <Text style={styles.amountLabel}>总金额</Text>
              <Text style={styles.amountValue}>
                ¥{(summary?.total_amount || 0).toLocaleString()}
              </Text>
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
            style={styles.exportButton}
            onPress={() => setShowExportModal(true)}
          >
            <FontAwesome6 name="file-export" size={14} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>导出</Text>
          </TouchableOpacity>
        </View>

        {/* 明细列表 */}
        <View style={styles.detailsSection}>
          <Text style={styles.detailsTitle}>工单明细（{details.length}）</Text>
          {details.map((item) => {
            const typeConfig = TYPE_CONFIG[item.order_type as keyof typeof TYPE_CONFIG] || TYPE_CONFIG['免费'];
            const statusConfig = STATUS_CONFIG[item.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG['待处理'];
            return (
              <View key={item.order_id} style={styles.detailCard}>
                <View style={styles.detailHeader}>
                  <View style={styles.orderIcon}>
                    <FontAwesome6 name="wrench" size={20} color="#1E88E5" />
                  </View>
                  <View style={styles.detailInfo}>
                    <Text style={styles.orderName}>{item.order_name}</Text>
                    <Text style={styles.orderNumber}>{item.order_number}</Text>
                  </View>
                  <View style={[styles.typeBadge, { backgroundColor: `${typeConfig.color}20` }]}>
                    <FontAwesome6 name={typeConfig.icon as any} size={12} color={typeConfig.color} />
                    <Text style={[styles.typeText, { color: typeConfig.color }]}>
                      {item.order_type}
                    </Text>
                  </View>
                </View>

                <View style={styles.statusRow}>
                  <View style={[styles.statusBadge, { backgroundColor: `${statusConfig.color}20` }]}>
                    <FontAwesome6 name={statusConfig.icon as any} size={12} color={statusConfig.color} />
                    <Text style={[styles.statusText, { color: statusConfig.color }]}>
                      {item.status}
                    </Text>
                  </View>
                  {item.amount > 0 && (
                    <Text style={styles.amount}>¥{item.amount.toLocaleString()}</Text>
                  )}
                </View>

                <View style={styles.detailContent}>
                  <View style={styles.detailRow}>
                    <FontAwesome6 name="building" size={12} color="#636E72" />
                    <Text style={styles.detailLabel}>客户：</Text>
                    <Text style={styles.detailValue}>{item.customer_name}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <FontAwesome6 name="box" size={12} color="#636E72" />
                    <Text style={styles.detailLabel}>产品：</Text>
                    <Text style={styles.detailValue}>{item.product_name}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <FontAwesome6 name="user" size={12} color="#636E72" />
                    <Text style={styles.detailLabel}>负责人：</Text>
                    <Text style={styles.detailValue}>{item.owner}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <FontAwesome6 name="calendar" size={12} color="#636E72" />
                    <Text style={styles.detailLabel}>创建日期：</Text>
                    <Text style={styles.detailValue}>
                      {new Date(item.created_date).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
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
    marginBottom: 16,
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
  amountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#FFFBF0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  amountLabel: {
    fontSize: 14,
    color: '#636E72',
  },
  amountValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F39C12',
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
    marginBottom: 8,
  },
  orderIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(30, 136, 229, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailInfo: {
    flex: 1,
  },
  orderName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 4,
  },
  orderNumber: {
    fontSize: 13,
    color: '#95A5A6',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
  amount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F39C12',
  },
  detailContent: {
    backgroundColor: '#F5F7FA',
    borderRadius: 8,
    padding: 12,
  },
  detailRow: {
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
});
