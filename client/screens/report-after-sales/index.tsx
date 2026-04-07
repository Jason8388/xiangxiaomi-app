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

interface SummaryData {
  total_orders: number;
  charged_orders: number;
  free_orders: number;
  completed_orders: number;
  total_amount: number;
  paid_amount: number;
  pending_amount: number;
  updated_at: string;
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

// 统计卡片配置
const STAT_CARDS = [
  { key: 'total_orders', label: '总工单数', icon: 'clipboard-list', color: '#1E88E5', bgColor: 'rgba(30, 136, 229, 0.1)' },
  { key: 'charged_orders', label: '收费工单数', icon: 'dollar-sign', color: '#2ECC71', bgColor: 'rgba(46, 204, 113, 0.1)' },
  { key: 'free_orders', label: '免费工单数', icon: 'gift', color: '#9B59B6', bgColor: 'rgba(155, 89, 182, 0.1)' },
  { key: 'completed_orders', label: '已完成工单数', icon: 'check-circle', color: '#27AE60', bgColor: 'rgba(39, 174, 96, 0.1)' },
];

export default function ReportAfterSales() {
  const [summary, setSummary] = useState<SummaryData | null>(null);
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
      }
    } catch (error) {
      console.error('Load report data error:', error);
      Alert.alert('错误', '加载报表数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: string) => {
    setShowExportModal(false);
    Alert.alert('提示', '导出功能待实现');
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('zh-CN');
  };

  const renderStatCard = (card: typeof STAT_CARDS[0], index: number) => {
    const value = summary?.[card.key as keyof SummaryData] as number || 0;
    return (
      <View
        key={card.key}
        style={[
          styles.statCard,
          index % 2 === 0 ? styles.statCardLeft : styles.statCardRight,
        ]}
      >
        <View style={[styles.statIconContainer, { backgroundColor: card.bgColor }]}>
          <FontAwesome6 name={card.icon as any} size={22} color={card.color} />
        </View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{card.label}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <Screen>
        <PageHeader title="工单统计表" />
        <View style={styles.centerContainer}>
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <PageHeader title="工单统计表" />

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* 主要统计卡片 */}
        <View style={styles.mainStatsSection}>
          <View style={styles.mainStatCard}>
            <View style={styles.mainStatIconWrap}>
              <FontAwesome6 name="clipboard-list" size={36} color="#FFFFFF" />
            </View>
            <View style={styles.mainStatContent}>
              <Text style={styles.mainStatValue}>{summary?.total_orders || 0}</Text>
              <Text style={styles.mainStatLabel}>工单总数</Text>
            </View>
          </View>
        </View>

        {/* 工单数量统计 */}
        <View style={styles.statsGridSection}>
          <Text style={styles.sectionTitle}>工单数量统计</Text>
          <View style={styles.statsGrid}>
            {STAT_CARDS.map((card, index) => renderStatCard(card, index))}
          </View>
        </View>

        {/* 金额统计 */}
        <View style={styles.amountSection}>
          <Text style={styles.sectionTitle}>金额统计</Text>

          {/* 总收费金额 */}
          <View style={styles.amountCard}>
            <View style={[styles.amountIconContainer, { backgroundColor: 'rgba(243, 156, 18, 0.15)' }]}>
              <FontAwesome6 name="coins" size={28} color="#F39C12" />
            </View>
            <View style={styles.amountInfo}>
              <Text style={styles.amountLabel}>总收费金额</Text>
              <Text style={styles.amountValue}>¥{formatCurrency(summary?.total_amount || 0)}</Text>
            </View>
          </View>

          {/* 已回款与待回款 */}
          <View style={styles.amountRow}>
            <View style={[styles.amountSubCard, styles.amountSubCardLeft]}>
              <View style={[styles.amountSubIcon, { backgroundColor: 'rgba(46, 204, 113, 0.15)' }]}>
                <FontAwesome6 name="check-double" size={22} color="#2ECC71" />
              </View>
              <View style={styles.amountSubInfo}>
                <Text style={styles.amountSubLabel}>已回款金额</Text>
                <Text style={[styles.amountSubValue, { color: '#2ECC71' }]}>
                  ¥{formatCurrency(summary?.paid_amount || 0)}
                </Text>
              </View>
            </View>

            <View style={[styles.amountSubCard, styles.amountSubCardRight]}>
              <View style={[styles.amountSubIcon, { backgroundColor: 'rgba(231, 76, 60, 0.15)' }]}>
                <FontAwesome6 name="clock" size={22} color="#E74C3C" />
              </View>
              <View style={styles.amountSubInfo}>
                <Text style={styles.amountSubLabel}>待回款金额</Text>
                <Text style={[styles.amountSubValue, { color: '#E74C3C' }]}>
                  ¥{formatCurrency(summary?.pending_amount || 0)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* 回款进度 */}
        <View style={styles.progressSection}>
          <Text style={styles.sectionTitle}>回款进度</Text>
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>回款完成率</Text>
              <Text style={styles.progressPercent}>
                {summary?.total_amount && summary.total_amount > 0
                  ? Math.round((summary.paid_amount / summary.total_amount) * 100)
                  : 0}%
              </Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBar,
                  {
                    width: `${
                      summary?.total_amount && summary.total_amount > 0
                        ? (summary.paid_amount / summary.total_amount) * 100
                        : 0
                    }%`,
                  },
                ]}
              />
            </View>
            <View style={styles.progressStats}>
              <View style={styles.progressStatItem}>
                <View style={[styles.progressDot, { backgroundColor: '#2ECC71' }]} />
                <Text style={styles.progressStatLabel}>已回款</Text>
                <Text style={[styles.progressStatValue, { color: '#2ECC71' }]}>
                  ¥{formatCurrency(summary?.paid_amount || 0)}
                </Text>
              </View>
              <View style={styles.progressStatItem}>
                <View style={[styles.progressDot, { backgroundColor: '#E74C3C' }]} />
                <Text style={styles.progressStatLabel}>待回款</Text>
                <Text style={[styles.progressStatValue, { color: '#E74C3C' }]}>
                  ¥{formatCurrency(summary?.pending_amount || 0)}
                </Text>
              </View>
            </View>
          </View>
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
            <Text style={[styles.actionButtonText, { color: '#FFFFFF' }]}>导出报表</Text>
          </TouchableOpacity>
        </View>

        {/* 更新时间 */}
        {summary?.updated_at && (
          <Text style={styles.updateTime}>
            更新时间：{new Date(summary.updated_at).toLocaleString('zh-CN')}
          </Text>
        )}
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
                <FontAwesome6 name={option.icon as any} size={24} color={option.color} />
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
    backgroundColor: '#F5F7FA',
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#95A5A6',
  },
  mainStatsSection: {
    marginBottom: 20,
  },
  mainStatCard: {
    backgroundColor: '#1E88E5',
    borderRadius: 20,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#1E88E5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  mainStatIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 20,
  },
  mainStatContent: {
    flex: 1,
  },
  mainStatValue: {
    fontSize: 48,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  mainStatLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 14,
  },
  statsGridSection: {
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  statCardLeft: {},
  statCardRight: {},
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2D3436',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#95A5A6',
  },
  amountSection: {
    marginBottom: 20,
  },
  amountCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  amountIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  amountInfo: {
    flex: 1,
  },
  amountLabel: {
    fontSize: 14,
    color: '#636E72',
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#F39C12',
  },
  amountRow: {
    flexDirection: 'row',
    gap: 12,
  },
  amountSubCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  amountSubCardLeft: {},
  amountSubCardRight: {},
  amountSubIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  amountSubInfo: {
    flex: 1,
  },
  amountSubLabel: {
    fontSize: 12,
    color: '#95A5A6',
    marginBottom: 2,
  },
  amountSubValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  progressSection: {
    marginBottom: 20,
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  progressLabel: {
    fontSize: 14,
    color: '#636E72',
  },
  progressPercent: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2D3436',
  },
  progressBarContainer: {
    height: 10,
    backgroundColor: '#F0F0F0',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#2ECC71',
    borderRadius: 5,
  },
  progressStats: {
    flexDirection: 'row',
  },
  progressStatItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  progressStatLabel: {
    fontSize: 12,
    color: '#95A5A6',
  },
  progressStatValue: {
    fontSize: 14,
    fontWeight: '600',
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
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  exportButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: '#1E88E5',
    borderRadius: 12,
  },
  actionButtonText: {
    fontSize: 15,
    color: '#1E88E5',
    fontWeight: '500',
  },
  updateTime: {
    fontSize: 12,
    color: '#95A5A6',
    textAlign: 'center',
    marginBottom: 24,
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
    paddingVertical: 14,
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
