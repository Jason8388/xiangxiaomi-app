import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import Screen from '@/components/Screen';
import { FontAwesome6 } from '@expo/vector-icons';

const API_BASE = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || 'http://localhost:9091';

interface WorkOrderReminder {
  id: number;
  work_order_no: string;
  customer_name: string;
  contact_person: string;
  contact_phone: string;
  created_at: string;
  days_pending: number;
}

export default function PCWorkOrderReminders() {
  const [reminders, setReminders] = useState<WorkOrderReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'urgent' | 'normal'>('all');

  useEffect(() => {
    fetchReminders();
  }, []);

  const fetchReminders = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/v1/work-orders/pending-fill`);
      const data = await response.json();
      if (data.code === 0 && data.data) {
        setReminders(data.data);
      }
    } catch (error) {
      console.error('获取待填写工单失败:', error);
      // 使用模拟数据
      setReminders([
        { id: 1, work_order_no: 'WO20240601001', customer_name: '某某公司', contact_person: '张三', contact_phone: '13800138000', created_at: '2024-06-01', days_pending: 5 },
        { id: 2, work_order_no: 'WO20240602002', customer_name: '另一家公司', contact_person: '李四', contact_phone: '13900139000', created_at: '2024-06-02', days_pending: 3 },
        { id: 3, work_order_no: 'WO20240603003', customer_name: '测试客户', contact_person: '王五', contact_phone: '13700137000', created_at: '2024-06-03', days_pending: 7 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = reminders.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'urgent') return item.days_pending >= 5;
    return item.days_pending < 5;
  });

  const getUrgencyColor = (days: number) => {
    if (days >= 7) return '#E74C3C';
    if (days >= 5) return '#F39C12';
    return '#27AE60';
  };

  const renderItem = ({ item }: { item: WorkOrderReminder }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.orderNo}>
          <FontAwesome6 name="file-alt" size={14} color="#3498DB" />
          <Text style={styles.orderNoText}>{item.work_order_no}</Text>
        </View>
        <View style={[styles.urgencyBadge, { backgroundColor: getUrgencyColor(item.days_pending) + '20' }]}>
          <Text style={[styles.urgencyText, { color: getUrgencyColor(item.days_pending) }]}>
            {item.days_pending}天未填写
          </Text>
        </View>
      </View>
      
      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <FontAwesome6 name="building" size={14} color="#95A5A6" />
          <Text style={styles.infoText}>{item.customer_name}</Text>
        </View>
        <View style={styles.infoRow}>
          <FontAwesome6 name="user" size={14} color="#95A5A6" />
          <Text style={styles.infoText}>{item.contact_person}</Text>
        </View>
        <View style={styles.infoRow}>
          <FontAwesome6 name="phone" size={14} color="#95A5A6" />
          <Text style={styles.infoText}>{item.contact_phone}</Text>
        </View>
        <View style={styles.infoRow}>
          <FontAwesome6 name="calendar-alt" size={14} color="#95A5A6" />
          <Text style={styles.infoText}>创建于 {item.created_at}</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <TouchableOpacity style={styles.fillBtn}>
          <FontAwesome6 name="edit" size={14} color="#fff" />
          <Text style={styles.fillBtnText}>填写工单</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.viewBtn}>
          <FontAwesome6 name="eye" size={14} color="#3498DB" />
          <Text style={styles.viewBtnText}>查看详情</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>工单待填提醒</Text>
          <Text style={styles.subtitle}>有 {reminders.length} 个工单待填写</Text>
        </View>

        <View style={styles.filters}>
          <TouchableOpacity 
            style={[styles.filterBtn, filter === 'all' && styles.filterBtnActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>全部</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterBtn, filter === 'urgent' && styles.filterBtnActive]}
            onPress={() => setFilter('urgent')}
          >
            <Text style={[styles.filterText, filter === 'urgent' && styles.filterTextActive]}>紧急</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterBtn, filter === 'normal' && styles.filterBtnActive]}
            onPress={() => setFilter('normal')}
          >
            <Text style={[styles.filterText, filter === 'normal' && styles.filterTextActive]}>一般</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color="#3498DB" />
            <Text style={styles.loadingText}>加载中...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredData}
            renderItem={renderItem}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.empty}>
                <FontAwesome6 name="check-circle" size={48} color="#27AE60" />
                <Text style={styles.emptyText}>太棒了！暂无待填写工单</Text>
              </View>
            }
          />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6FA' },
  header: { padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#2C3E50', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#E74C3C' },
  filters: { flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  filterBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F0F0F0' },
  filterBtnActive: { backgroundColor: '#3498DB' },
  filterText: { fontSize: 14, color: '#7F8C8D' },
  filterTextActive: { color: '#fff', fontWeight: '600' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#7F8C8D' },
  list: { padding: 16, gap: 12 },
  card: { backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, backgroundColor: '#F8F9FA', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  orderNo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  orderNoText: { fontSize: 14, fontWeight: '600', color: '#2C3E50' },
  urgencyBadge: { borderRadius: 4, paddingHorizontal: 8, paddingVertical: 4 },
  urgencyText: { fontSize: 12, fontWeight: '600' },
  cardBody: { padding: 12, gap: 8 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoText: { fontSize: 14, color: '#2C3E50' },
  cardFooter: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  fillBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, backgroundColor: '#3498DB' },
  fillBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  viewBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderLeftWidth: 1, borderLeftColor: '#F0F0F0' },
  viewBtnText: { color: '#3498DB', fontSize: 14, fontWeight: '600' },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, color: '#27AE60', marginTop: 12 },
});
