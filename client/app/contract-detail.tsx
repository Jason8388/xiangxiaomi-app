import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Screen } from '@/components/Screen';
import { PageHeader } from '@/components/PageHeader';
import { FontAwesome6 } from '@expo/vector-icons';
import { useSafeSearchParams } from '@/hooks/useSafeRouter';

export default function ContractDetail() {
  const { id } = useSafeSearchParams<{ id: string }>();

  return (
    <Screen>
      <PageHeader title="合同详情" />

      <ScrollView style={styles.container}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <FontAwesome6 name="file-contract" size={18} color="#1E88E5" />
            <Text style={styles.cardTitle}>合同信息</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>合同编号</Text>
            <Text style={styles.infoValue}>HT2024001</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>合同名称</Text>
            <Text style={styles.infoValue}>示例合同</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>合同金额</Text>
            <Text style={styles.infoValue}>¥100,000</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>开始日期</Text>
            <Text style={styles.infoValue}>2024-01-01</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>结束日期</Text>
            <Text style={styles.infoValue}>2024-12-31</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <FontAwesome6 name="circle-info" size={18} color="#1E88E5" />
            <Text style={styles.cardTitle}>备注</Text>
          </View>
          <Text style={styles.remarksText}>合同备注信息...</Text>
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
  },
  infoRow: {
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 13,
    color: '#636E72',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#2D3436',
  },
  remarksText: {
    fontSize: 14,
    color: '#2D3436',
    lineHeight: 22,
  },
});
