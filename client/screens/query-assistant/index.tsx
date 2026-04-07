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

interface FunctionCard {
  id: string;
  title: string;
  icon: string;
  color: string;
  description: string;
}

const FUNCTIONS: FunctionCard[] = [
  {
    id: 'scan-query',
    title: '扫码查询',
    icon: 'qrcode',
    color: '#1E88E5',
    description: '扫描物料、设备二维码快速查询',
  },
  {
    id: 'file-query',
    title: '文件查询',
    icon: 'file-lines',
    color: '#2ECC71',
    description: '按客户、项目、设备、文件名查询附件',
  },
  {
    id: 'meeting-query',
    title: '会议纪要查询',
    icon: 'calendar-days',
    color: '#F39C12',
    description: '按标题、内容、参会人查询纪要',
  },
  {
    id: 'customer-query',
    title: '客户查询',
    icon: 'building',
    color: '#9B59B6',
    description: '按客户名称查询客户信息',
  },
  {
    id: 'device-query',
    title: '设备查询',
    icon: 'microchip',
    color: '#E74C3C',
    description: '按名称、编号、型号查询设备',
  },
  {
    id: 'contract-query',
    title: '合同查询',
    icon: 'file-contract',
    color: '#3498DB',
    description: '按客户、名称、编号查询合同',
  },
  {
    id: 'material-query',
    title: '物料查询',
    icon: 'box',
    color: '#1ABC9C',
    description: '按名称、型号、编码查询物料',
  },
  {
    id: 'work-order-query',
    title: '工单查询',
    icon: 'screwdriver-wrench',
    color: '#E67E22',
    description: '按工单号、名称、任务号、客户查询工单',
  },
];

export default function QueryAssistant() {
  const router = useSafeRouter();

  const handlePress = (functionId: string) => {
    switch (functionId) {
      case 'scan-query':
        router.push('/query-scan');
        break;
      case 'file-query':
        router.push('/query-file');
        break;
      case 'meeting-query':
        router.push('/query-meeting');
        break;
      case 'customer-query':
        router.push('/query-customer');
        break;
      case 'device-query':
        router.push('/query-device');
        break;
      case 'contract-query':
        router.push('/query-contract');
        break;
      case 'material-query':
        router.push('/query-material');
        break;
      case 'work-order-query':
        router.push('/query-after-sales');
        break;
    }
  };

  return (
    <Screen>
      <PageHeader title="查询助手" />

      <ScrollView style={styles.container}>
        <View style={styles.grid}>
          {FUNCTIONS.map((func) => (
            <TouchableOpacity
              key={func.id}
              style={styles.card}
              onPress={() => handlePress(func.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconContainer, { backgroundColor: `${func.color}15` }]}>
                <FontAwesome6 name={func.icon as any} size={28} color={func.color} />
              </View>
              <Text style={styles.cardTitle}>{func.title}</Text>
              <Text style={styles.cardDescription} numberOfLines={2}>
                {func.description}
              </Text>
            </TouchableOpacity>
          ))}
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 6,
    textAlign: 'center',
  },
  cardDescription: {
    fontSize: 12,
    color: '#636E72',
    textAlign: 'center',
    lineHeight: 16,
  },
});
