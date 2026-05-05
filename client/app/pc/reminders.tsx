import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { PCLayout } from '@/components/pc/PCLayout';
import { FontAwesome6 } from '@expo/vector-icons';

interface Reminder {
  id: number;
  title: string;
  content: string;
  time: string;
  type: 'meeting' | 'task' | 'notice';
  status: 'pending' | 'done';
}

export default function PCReminders() {
  const [reminders, setReminders] = useState<Reminder[]>([
    { id: 1, title: '周例会提醒', content: '今天下午3点会议室A召开周例会', time: '15:00', type: 'meeting', status: 'pending' },
    { id: 2, title: '合同审批', content: '请尽快完成合同审批流程', time: '明天 10:00', type: 'task', status: 'pending' },
    { id: 3, title: '系统更新通知', content: '系统将于今晚23:00进行更新维护', time: '今天 23:00', type: 'notice', status: 'pending' },
    { id: 4, title: '客户回访', content: '需要联系客户进行回访', time: '后天 14:00', type: 'task', status: 'pending' },
  ]);
  const [activeTab, setActiveTab] = useState<'pending' | 'done'>('pending');

  const filteredReminders = reminders.filter(r => 
    activeTab === 'pending' ? r.status === 'pending' : r.status === 'done'
  );

  const toggleStatus = (id: number) => {
    setReminders(prev => prev.map(r => 
      r.id === id ? { ...r, status: r.status === 'pending' ? 'done' : 'pending' } : r
    ));
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'meeting': return 'users';
      case 'task': return 'tasks';
      case 'notice': return 'bullhorn';
      default: return 'bell';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'meeting': return '#3498DB';
      case 'task': return '#E74C3C';
      case 'notice': return '#F39C12';
      default: return '#95A5A6';
    }
  };

  const renderItem = ({ item }: { item: Reminder }) => (
    <TouchableOpacity style={styles.card} onPress={() => toggleStatus(item.id)}>
      <View style={[styles.iconBox, { backgroundColor: getTypeColor(item.type) + '20' }]}>
        <FontAwesome6 name={getTypeIcon(item.type) as any} size={20} color={getTypeColor(item.type)} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.desc} numberOfLines={2}>{item.content}</Text>
        <View style={styles.meta}>
          <FontAwesome6 name="clock" size={12} color="#95A5A6" />
          <Text style={styles.time}>{item.time}</Text>
          <View style={[styles.badge, { backgroundColor: getTypeColor(item.type) + '20' }]}>
            <Text style={[styles.badgeText, { color: getTypeColor(item.type) }]}>
              {item.type === 'meeting' ? '会议' : item.type === 'task' ? '任务' : '通知'}
            </Text>
          </View>
        </View>
      </View>
      <TouchableOpacity style={styles.checkBtn} onPress={() => toggleStatus(item.id)}>
        <FontAwesome6 
          name={item.status === 'done' ? 'check-circle' : 'circle'} 
          size={24} 
          color={item.status === 'done' ? '#27AE60' : '#BDC3C7'} 
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <PCLayout title="工作提醒" activePath="/reminders">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>工作提醒</Text>
          <Text style={styles.subtitle}>查看和管理您的待办事项</Text>
        </View>

        <View style={styles.tabs}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'pending' && styles.tabActive]}
            onPress={() => setActiveTab('pending')}
          >
            <Text style={[styles.tabText, activeTab === 'pending' && styles.tabTextActive]}>待处理</Text>
            <View style={[styles.tabBadge, activeTab === 'pending' && styles.tabBadgeActive]}>
              <Text style={styles.tabBadgeText}>
                {reminders.filter(r => r.status === 'pending').length}
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'done' && styles.tabActive]}
            onPress={() => setActiveTab('done')}
          >
            <Text style={[styles.tabText, activeTab === 'done' && styles.tabTextActive]}>已完成</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={filteredReminders}
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <FontAwesome6 name="check-double" size={48} color="#BDC3C7" />
              <Text style={styles.emptyText}>暂无{activeTab === 'pending' ? '待处理' : '已完成'}事项</Text>
            </View>
          }
        />
      </View>
    </PCLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6FA' },
  header: { padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#2C3E50', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#7F8C8D' },
  tabs: { flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, gap: 6 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#3498DB' },
  tabText: { fontSize: 15, color: '#7F8C8D' },
  tabTextActive: { color: '#3498DB', fontWeight: '600' },
  tabBadge: { backgroundColor: '#F0F0F0', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  tabBadgeActive: { backgroundColor: '#3498DB' },
  tabBadgeText: { fontSize: 12, color: '#fff', fontWeight: '600' },
  list: { padding: 16, gap: 12 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8, elevation: 2 },
  iconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  content: { flex: 1 },
  title: { fontSize: 15, fontWeight: '600', color: '#2C3E50', marginBottom: 4 },
  desc: { fontSize: 13, color: '#7F8C8D', marginBottom: 8, lineHeight: 18 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  time: { fontSize: 12, color: '#95A5A6' },
  badge: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  badgeText: { fontSize: 11, fontWeight: '500' },
  checkBtn: { padding: 8 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 14, color: '#95A5A6', marginTop: 12 },
});
