import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import Screen from '@/components/Screen';
import { FontAwesome6 } from '@expo/vector-icons';

const API_BASE = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || 'http://localhost:9091';

interface WorkOrderReminder {
  id: number;
  order_no: string;
  customer_name: string;
  assignee_name: string | null;
  status: string;
  priority: string;
  urgencyLevel: 'urgent' | 'normal' | 'low';
  urgencyLabel: string;
  urgencyColor: string;
  missingFields: string[];
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
      if (data.orders && Array.isArray(data.orders)) {
        setReminders(data.orders);
      }
    } catch (error) {
      console.error('获取待填写工单失败:', error);
      // 使用模拟数据
      setReminders([
        { id: 1, order_no: 'WO20240601001', customer_name: '某某公司', assignee_name: '张三', status: 'pending', priority: 'high', urgencyLevel: 'urgent', urgencyLabel: '紧急', urgencyColor: '#E74C3C', missingFields: ['需求描述', '联系人'] },
        { id: 2, order_no: 'WO20240602002', customer_name: '另一家公司', assignee_name: '李四', status: 'pending', priority: 'normal', urgencyLevel: 'normal', urgencyLabel: '待处理', urgencyColor: '#F39C12', missingFields: ['处理人', '计划完成日期'] },
        { id: 3, order_no: 'WO20240603003', customer_name: '测试客户', assignee_name: null, status: 'pending', priority: 'normal', urgencyLevel: 'low', urgencyLabel: '一般', urgencyColor: '#27AE60', missingFields: ['联系人', '计划完成日期'] },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = reminders.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'urgent') return item.urgencyLevel === 'urgent';
    return item.urgencyLevel === 'normal';
  });

  const renderItem = ({ item }: { item: WorkOrderReminder }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.orderNo}>
          <FontAwesome6 name="file-alt" size={14} color="#3498DB" />
          <Text style={styles.orderNoText}>{item.order_no}</Text>
        </View>
        <View style={[styles.urgencyBadge, { backgroundColor: item.urgencyColor + '20' }]}>
          <Text style={[styles.urgencyText, { color: item.urgencyColor }]}>
            {item.urgencyLabel}
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
          <Text style={styles.infoText}>{item.assignee_name || '未分配'}</Text>
        </View>
        <View style={styles.infoRow}>
          <FontAwesome6 name="exclamation-circle" size={14} color="#F39C12" />
          <Text style={styles.infoText}>缺失字段: {item.missingFields.join(', ')}</Text>
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
