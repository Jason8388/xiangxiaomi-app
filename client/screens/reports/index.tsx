import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { PageHeader } from '@/components/PageHeader';
import { FontAwesome6 } from '@expo/vector-icons';
import { useSafeRouter } from '@/hooks/useSafeRouter';

interface ReportCard {
  id: string;
  title: string;
  icon: string;
  color: string;
  description: string;
}

const REPORTS: ReportCard[] = [
  {
    id: 'customer-report',
    title: '客户统计表',
    icon: 'building',
    color: '#1E88E5',
    description: '统计各客户数、合同数、设备数、售后工单数',
  },
  {
    id: 'device-report',
    title: '设备统计表',
    icon: 'microchip',
    color: '#2ECC71',
    description: '统计设备数量、设备明细、对应客户、合同信息',
  },
  {
    id: 'after-sales-report',
    title: '工单统计表',
    icon: 'screwdriver-wrench',
    color: '#E67E22',
    description: '统计售后工单数、收费工单数、免费工单数、工单明细',
  },
];

export default function Reports() {
  const router = useSafeRouter();

  const handlePress = (reportId: string) => {
    switch (reportId) {
      case 'customer-report':
        router.push('/report-customer');
        break;
      case 'device-report':
        router.push('/report-device');
        break;
      case 'after-sales-report':
        router.push('/report-after-sales');
        break;
    }
  };

  return (
    <Screen>
      <PageHeader title="统计报表" />

      <ScrollView style={styles.container}>
        {/* 权限提示 */}
        <View style={styles.tipContainer}>
          <FontAwesome6 name="shield-halved" size={16} color="#F39C12" />
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>报表权限说明</Text>
            <Text style={styles.tipText}>
              运营总监、项目总监：可查看所有报表，下载自己负责范围内的明细
            </Text>
            <Text style={styles.tipText}>
              管理员：可查看、下载所有报表明细
            </Text>
          </View>
        </View>

        {/* 更新时间 */}
        <View style={styles.updateInfo}>
          <FontAwesome6 name="rotate" size={14} color="#636E72" />
          <Text style={styles.updateText}>
            核心数据实时更新，详细数据每日凌晨更新
          </Text>
        </View>

        {/* 报表卡片 */}
        <View style={styles.grid}>
          {REPORTS.map((report) => (
            <TouchableOpacity
              key={report.id}
              style={styles.card}
              onPress={() => handlePress(report.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconContainer, { backgroundColor: `${report.color}15` }]}>
                <FontAwesome6 name={report.icon as any} size={32} color={report.color} />
              </View>
              <Text style={styles.cardTitle}>{report.title}</Text>
              <Text style={styles.cardDescription} numberOfLines={2}>
                {report.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 导出说明 */}
        <View style={styles.exportInfo}>
          <FontAwesome6 name="file-export" size={16} color="#1E88E5" />
          <Text style={styles.exportText}>支持 Excel、PDF 格式导出</Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  tipContainer: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: 'rgba(243, 156, 18, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 13,
    color: '#636E72',
    lineHeight: 18,
    marginBottom: 4,
  },
  updateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F5F7FA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 20,
  },
  updateText: {
    fontSize: 13,
    color: '#636E72',
  },
  grid: {
    gap: 16,
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 8,
    textAlign: 'center',
  },
  cardDescription: {
    fontSize: 13,
    color: '#636E72',
    textAlign: 'center',
    lineHeight: 18,
  },
  exportInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(30, 136, 229, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  exportText: {
    fontSize: 13,
    color: '#1E88E5',
    fontWeight: '500',
  },
});
