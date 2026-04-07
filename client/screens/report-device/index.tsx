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
import { getApiBaseUrl } from '@/utils/api';

interface SummaryData {
  total_devices: number;
  within_warranty: number;
  out_of_warranty: number;
  updated_at: string;
}

interface DeviceTypeStat {
  device_type: string;
  total: number;
  within_warranty: number;
  out_of_warranty: number;
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

// 设备类型图标映射
const DEVICE_TYPE_ICONS: Record<string, { icon: string; color: string }> = {
  '服务器类': { icon: 'server', color: '#1E88E5' },
  '网络设备': { icon: 'wifi', color: '#00B894' },
  '存储设备': { icon: 'database', color: '#9B59B6' },
  '电源设备': { icon: 'bolt', color: '#F39C12' },
  '办公设备': { icon: 'laptop', color: '#E74C3C' },
  '安全设备': { icon: 'shield-halved', color: '#2ECC71' },
  '机房配套': { icon: 'fan', color: '#3498DB' },
  '未知类型': { icon: 'microchip', color: '#95A5A6' },
};

export default function ReportDevice() {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [typeStats, setTypeStats] = useState<DeviceTypeStat[]>([]);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set());
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
        `${getApiBaseUrl()}/api/v1/reports/devices?${params.toString()}`
      );
      const data = await response.json();
      if (response.ok) {
        setSummary(data.summary);
        setTypeStats(data.type_stats || []);
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

  const toggleTypeExpand = (deviceType: string) => {
    const newExpanded = new Set(expandedTypes);
    if (newExpanded.has(deviceType)) {
      newExpanded.delete(deviceType);
    } else {
      newExpanded.add(deviceType);
    }
    setExpandedTypes(newExpanded);
  };

  const getTypeIcon = (deviceType: string) => {
    return DEVICE_TYPE_ICONS[deviceType] || DEVICE_TYPE_ICONS['未知类型'];
  };

  const renderDeviceTypeCard = (stat: DeviceTypeStat) => {
    const { icon, color } = getTypeIcon(stat.device_type);
    const isExpanded = expandedTypes.has(stat.device_type);
    const withinPercent = stat.total > 0 ? Math.round((stat.within_warranty / stat.total) * 100) : 0;

    return (
      <View key={stat.device_type} style={styles.typeCard}>
        <TouchableOpacity
          style={styles.typeCardHeader}
          onPress={() => toggleTypeExpand(stat.device_type)}
          activeOpacity={0.7}
        >
          <View style={styles.typeIconContainer}>
            <FontAwesome6 name={icon as any} size={24} color={color} />
          </View>
          <View style={styles.typeInfo}>
            <Text style={styles.typeName}>{stat.device_type}</Text>
            <View style={styles.typeStatsRow}>
              <View style={[styles.statBadge, { backgroundColor: `${color}15` }]}>
                <Text style={[styles.statBadgeText, { color }]}>
                  总计 {stat.total} 台
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.expandIcon}>
            <FontAwesome6
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={18}
              color="#95A5A6"
            />
          </View>
        </TouchableOpacity>

        {/* 统计指标 */}
        <View style={styles.typeStatsContainer}>
          <View style={styles.typeStatItem}>
            <View style={styles.typeStatIconWrap}>
              <FontAwesome6 name="check-circle" size={16} color="#2ECC71" />
            </View>
            <View style={styles.typeStatInfo}>
              <Text style={styles.typeStatValue}>{stat.within_warranty}</Text>
              <Text style={styles.typeStatLabel}>质保期内</Text>
            </View>
          </View>
          <View style={styles.typeStatDivider} />
          <View style={styles.typeStatItem}>
            <View style={[styles.typeStatIconWrap, { backgroundColor: 'rgba(231, 76, 60, 0.1)' }]}>
              <FontAwesome6 name="clock" size={16} color="#E74C3C" />
            </View>
            <View style={styles.typeStatInfo}>
              <Text style={[styles.typeStatValue, { color: '#E74C3C' }]}>{stat.out_of_warranty}</Text>
              <Text style={styles.typeStatLabel}>质保期外</Text>
            </View>
          </View>
          <View style={styles.typeStatDivider} />
          <View style={styles.typeStatItem}>
            <View style={[styles.typeStatIconWrap, { backgroundColor: `${color}15` }]}>
              <FontAwesome6 name="percent" size={16} color={color} />
            </View>
            <View style={styles.typeStatInfo}>
              <Text style={[styles.typeStatValue, { color }]}>{withinPercent}%</Text>
              <Text style={styles.typeStatLabel}>质保率</Text>
            </View>
          </View>
        </View>

        {/* 进度条 */}
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${withinPercent}%`,
                  backgroundColor: '#2ECC71',
                },
              ]}
            />
          </View>
        </View>

        {/* 展开详情 */}
        {isExpanded && (
          <View style={styles.typeDetailSection}>
            <Text style={styles.typeDetailTitle}>设备类型统计</Text>
            <View style={styles.typeDetailRow}>
              <View style={styles.typeDetailItem}>
                <Text style={styles.typeDetailValue}>{stat.total}</Text>
                <Text style={styles.typeDetailLabel}>设备总数</Text>
              </View>
              <View style={[styles.typeDetailItem, { borderLeftWidth: 1, borderLeftColor: '#F0F0F0' }]}>
                <Text style={[styles.typeDetailValue, { color: '#2ECC71' }]}>{stat.within_warranty}</Text>
                <Text style={styles.typeDetailLabel}>质保期内</Text>
              </View>
              <View style={[styles.typeDetailItem, { borderLeftWidth: 1, borderLeftColor: '#F0F0F0' }]}>
                <Text style={[styles.typeDetailValue, { color: '#E74C3C' }]}>{stat.out_of_warranty}</Text>
                <Text style={styles.typeDetailLabel}>质保期外</Text>
              </View>
            </View>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <Screen>
        <PageHeader title="设备统计表" />
        <View style={styles.centerContainer}>
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <PageHeader title="设备统计表" />

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* 总体统计概览 */}
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>总体概览</Text>
          <View style={styles.summaryCards}>
            <View style={[styles.summaryCard, styles.summaryCardPrimary]}>
              <View style={styles.summaryIconWrap}>
                <FontAwesome6 name="microchip" size={28} color="#FFFFFF" />
              </View>
              <View style={styles.summaryCardContent}>
                <Text style={styles.summaryCardValue}>{summary?.total_devices || 0}</Text>
                <Text style={styles.summaryCardLabel}>设备总数</Text>
              </View>
            </View>
          </View>
          <View style={styles.summaryStatsRow}>
            <View style={styles.summaryStatItem}>
              <View style={[styles.summaryStatDot, { backgroundColor: '#2ECC71' }]} />
              <Text style={styles.summaryStatLabel}>质保期内</Text>
              <Text style={[styles.summaryStatValue, { color: '#2ECC71' }]}>
                {summary?.within_warranty || 0}
              </Text>
            </View>
            <View style={styles.summaryStatDivider} />
            <View style={styles.summaryStatItem}>
              <View style={[styles.summaryStatDot, { backgroundColor: '#E74C3C' }]} />
              <Text style={styles.summaryStatLabel}>质保期外</Text>
              <Text style={[styles.summaryStatValue, { color: '#E74C3C' }]}>
                {summary?.out_of_warranty || 0}
              </Text>
            </View>
          </View>
          {summary?.updated_at && (
            <Text style={styles.updateTime}>
              更新时间：{new Date(summary.updated_at).toLocaleString('zh-CN')}
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
            <Text style={[styles.actionButtonText, { color: '#FFFFFF' }]}>导出</Text>
          </TouchableOpacity>
        </View>

        {/* 按设备类型统计 */}
        <View style={styles.typeStatsSection}>
          <Text style={styles.sectionTitle}>按设备类型统计</Text>
          <Text style={styles.sectionSubtitle}>
            共 {typeStats.length} 种设备类型，{typeStats.reduce((sum, t) => sum + t.total, 0)} 台设备
          </Text>
          {typeStats.map(renderDeviceTypeCard)}
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
  summarySection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#95A5A6',
    marginBottom: 16,
  },
  summaryCards: {
    marginBottom: 16,
  },
  summaryCard: {
    borderRadius: 14,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryCardPrimary: {
    backgroundColor: '#1E88E5',
  },
  summaryIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  summaryCardContent: {
    flex: 1,
  },
  summaryCardValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  summaryCardLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 4,
  },
  summaryStatsRow: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  summaryStatItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  summaryStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E0E0E0',
  },
  summaryStatDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  summaryStatLabel: {
    fontSize: 13,
    color: '#636E72',
  },
  summaryStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3436',
  },
  updateTime: {
    fontSize: 12,
    color: '#95A5A6',
    textAlign: 'center',
    marginTop: 12,
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
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
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
    borderRadius: 10,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#1E88E5',
    fontWeight: '500',
  },
  typeStatsSection: {
    marginBottom: 24,
  },
  typeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  typeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  typeIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: 'rgba(30, 136, 229, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  typeInfo: {
    flex: 1,
  },
  typeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 8,
  },
  typeStatsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  expandIcon: {
    padding: 8,
  },
  typeStatsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 14,
    alignItems: 'center',
  },
  typeStatItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  typeStatDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 8,
  },
  typeStatIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(46, 204, 113, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeStatInfo: {
    flex: 1,
  },
  typeStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2ECC71',
  },
  typeStatLabel: {
    fontSize: 11,
    color: '#95A5A6',
    marginTop: 2,
  },
  progressBarContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#F0F0F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  typeDetailSection: {
    backgroundColor: '#F8F9FA',
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  typeDetailTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#636E72',
    marginBottom: 12,
  },
  typeDetailRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
  },
  typeDetailItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  typeDetailValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2D3436',
  },
  typeDetailLabel: {
    fontSize: 11,
    color: '#95A5A6',
    marginTop: 4,
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
