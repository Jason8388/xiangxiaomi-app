import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Screen } from '@/components/Screen';
import { PageHeader } from '@/components/PageHeader';
import { FontAwesome6 } from '@expo/vector-icons';
import { useSafeSearchParams } from '@/hooks/useSafeRouter';

export default function DeviceDetail() {
  const { id } = useSafeSearchParams<{ id: string }>();

  return (
    <Screen>
      <PageHeader title="设备详情" />

      <ScrollView style={styles.container}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <FontAwesome6 name="microchip" size={18} color="#2ECC71" />
            <Text style={styles.cardTitle}>设备信息</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>设备编号</Text>
            <Text style={styles.infoValue}>SB2024001</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>设备名称</Text>
            <Text style={styles.infoValue}>示例设备</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>设备型号</Text>
            <Text style={styles.infoValue}>MODEL-001</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>设备状态</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>正常</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <FontAwesome6 name="circle-info" size={18} color="#1E88E5" />
            <Text style={styles.cardTitle}>备注</Text>
          </View>
          <Text style={styles.remarksText}>设备备注信息...</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 13,
    color: '#636E72',
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#2D3436',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(46, 204, 113, 0.1)',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2ECC71',
  },
  remarksText: {
    fontSize: 14,
    color: '#2D3436',
    lineHeight: 22,
  },
});
