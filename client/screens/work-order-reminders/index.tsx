import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  RefreshControl,
  Modal,
  ScrollView,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { PageHeader } from '@/components/PageHeader';
import { FontAwesome6 } from '@expo/vector-icons';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { getApiBaseUrl } from '@/utils/api';
import { useFocusEffect } from 'expo-router';

interface Reminder {
  id: number;
  work_order_id: number;
  work_order_name: string;
  work_order_no: string;
  missing_fields: string[];
  created_at: string;
  is_read: boolean;
  assigned_to?: string;
}

export default function WorkOrderReminders() {
  const router = useSafeRouter();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadReminders();
    }, [])
  );

  const loadReminders = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${getApiBaseUrl()}/api/v1/work-order-reminders`);
      const data = await response.json();
      setReminders(data);
    } catch (error) {
      console.error('Failed to load reminders:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await fetch(`${getApiBaseUrl()}/api/v1/work-order-reminders/${id}/read`, {
        method: 'PUT',
      });
      loadReminders();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadReminders = reminders.filter(r => !r.is_read);
      for (const reminder of unreadReminders) {
        await fetch(`${getApiBaseUrl()}/api/v1/work-order-reminders/${reminder.id}/read`, {
          method: 'PUT',
        });
      }
      loadReminders();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleViewDetail = (reminder: Reminder) => {
    setSelectedReminder(reminder);
    setDetailModalVisible(true);
    if (!reminder.is_read) {
      markAsRead(reminder.id);
    }
  };

  const handleGoToWorkOrder = () => {
    if (selectedReminder) {
      setDetailModalVisible(false);
      router.push('/work-order-detail', { id: selectedReminder.work_order_id.toString() });
    }
  };

  const getFieldLabel = (field: string) => {
    const labels: Record<string, string> = {
      'task_phase': '任务阶段',
      'task_progress': '任务进度',
      'task_status': '任务状态',
      'customer_name': '客户名称',
      'contacts': '客户联系人',
      'service_plan': '服务方案',
      'is_charged': '是否收费',
      'consensus_docs': '客户共识凭证',
      'oa_work_order_no': 'OA系统工单编号',
      'work_order_docs': '派工单照片',
      'work_order_signer': '派工单签字人',
      'actual_hours': '实际工时',
    };
    return labels[field] || field;
  };

  const filteredReminders = reminders.filter(r => {
    if (filter === 'unread') return !r.is_read;
    if (filter === 'read') return r.is_read;
    return true;
  });

  const unreadCount = reminders.filter(r => !r.is_read).length;

  const renderReminderItem = ({ item }: { item: Reminder }) => (
    <TouchableOpacity
      style={[styles.reminderItem, !item.is_read && styles.reminderItemUnread]}
      onPress={() => handleViewDetail(item)}
      activeOpacity={0.7}
    >
      <View style={styles.reminderHeader}>
        <View style={styles.reminderTitleRow}>
          {!item.is_read && <View style={styles.unreadDot} />}
          <Text style={[styles.reminderTitle, !item.is_read && styles.reminderTitleBold]} numberOfLines={1}>
            {item.work_order_name}
          </Text>
        </View>
        <Text style={styles.reminderTime}>
          {new Date(item.created_at).toLocaleDateString('zh-CN')}
        </Text>
      </View>
      <Text style={styles.reminderNo}>工单号: {item.work_order_no || '无'}</Text>
      <View style={styles.missingFieldsPreview}>
        <FontAwesome6 name="exclamation-circle" size={14} color="#E74C3C" />
        <Text style={styles.missingFieldsText}>
          {item.missing_fields.slice(0, 3).map(f => getFieldLabel(f)).join('、')}
          {item.missing_fields.length > 3 && `...等${item.missing_fields.length}项`}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <Screen>
      <PageHeader title="工单提醒" />

      {/* 筛选栏 */}
      <View style={styles.filterBar}>
        <TouchableOpacity
          style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterChipText, filter === 'all' && styles.filterChipTextActive]}>
            全部 ({reminders.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filter === 'unread' && styles.filterChipActive]}
          onPress={() => setFilter('unread')}
        >
          <Text style={[styles.filterChipText, filter === 'unread' && styles.filterChipTextActive]}>
            未读 ({unreadCount})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filter === 'read' && styles.filterChipActive]}
          onPress={() => setFilter('read')}
        >
          <Text style={[styles.filterChipText, filter === 'read' && styles.filterChipTextActive]}>
            已读 ({reminders.length - unreadCount})
          </Text>
        </TouchableOpacity>
        {unreadCount > 0 && (
          <TouchableOpacity style={styles.markAllBtn} onPress={markAllAsRead}>
            <Text style={styles.markAllBtnText}>全部已读</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 提醒列表 */}
      {filteredReminders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <FontAwesome6 name="bell-slash" size={64} color="#D1D5DB" />
          <Text style={styles.emptyText}>
            {filter === 'unread' ? '暂无未读提醒' : filter === 'read' ? '暂无已读提醒' : '暂无提醒'}
          </Text>
          <Text style={styles.emptySubText}>
            {filter === 'all' ? '所有工单信息都已填写完整' : ''}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredReminders}
          renderItem={renderReminderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={loadReminders} colors={['#6C63FF']} />
          }
        />
      )}

      {/* 详情弹窗 */}
      <Modal
        visible={detailModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setDetailModalVisible(false)}
        >
          <View style={styles.detailModal}>
            <View style={styles.detailModalHeader}>
              <Text style={styles.detailModalTitle}>待填写信息</Text>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                <FontAwesome6 name="times" size={20} color="#636E72" />
              </TouchableOpacity>
            </View>

            {selectedReminder && (
              <ScrollView style={styles.detailModalContent}>
                <View style={styles.workOrderInfo}>
                  <View style={styles.workOrderIcon}>
                    <FontAwesome6 name="clipboard-list" size={28} color="#6C63FF" />
                  </View>
                  <View style={styles.workOrderDetails}>
                    <Text style={styles.workOrderName}>{selectedReminder.work_order_name}</Text>
                    <Text style={styles.workOrderNo}>工单号: {selectedReminder.work_order_no || '无'}</Text>
                    <Text style={styles.workOrderDate}>
                      创建时间: {new Date(selectedReminder.created_at).toLocaleString('zh-CN')}
                    </Text>
                  </View>
                </View>

                <View style={styles.missingSection}>
                  <View style={styles.missingSectionHeader}>
                    <FontAwesome6 name="exclamation-triangle" size={18} color="#E74C3C" />
                    <Text style={styles.missingSectionTitle}>
                      以下 {selectedReminder.missing_fields.length} 项信息待填写
                    </Text>
                  </View>
                  <View style={styles.missingFieldsList}>
                    {selectedReminder.missing_fields.map((field, index) => (
                      <View key={index} style={styles.missingFieldItem}>
                        <View style={styles.missingFieldNumber}>
                          <Text style={styles.missingFieldNumberText}>{index + 1}</Text>
                        </View>
                        <Text style={styles.missingFieldLabel}>{getFieldLabel(field)}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </ScrollView>
            )}

            <View style={styles.detailModalFooter}>
              <TouchableOpacity
                style={styles.goToWorkOrderBtn}
                onPress={handleGoToWorkOrder}
              >
                <FontAwesome6 name="external-link-alt" size={16} color="#FFFFFF" />
                <Text style={styles.goToWorkOrderBtnText}>前往工单填写</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  filterChipActive: {
    backgroundColor: '#6C63FF',
    borderColor: '#6C63FF',
  },
  filterChipText: {
    fontSize: 13,
    color: '#636E72',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  markAllBtn: {
    marginLeft: 'auto',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
  },
  markAllBtnText: {
    fontSize: 13,
    color: '#6C63FF',
    fontWeight: '500',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  reminderItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#D1D9E6',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  },
  reminderItemUnread: {
    borderLeftWidth: 4,
    borderLeftColor: '#E74C3C',
  },
  reminderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  reminderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E74C3C',
    marginRight: 8,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2D3436',
    flex: 1,
  },
  reminderTitleBold: {
    fontWeight: '700',
  },
  reminderTime: {
    fontSize: 12,
    color: '#95A5A6',
    marginLeft: 8,
  },
  reminderNo: {
    fontSize: 13,
    color: '#636E72',
    marginBottom: 10,
  },
  missingFieldsPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(231, 76, 60, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  missingFieldsText: {
    flex: 1,
    fontSize: 13,
    color: '#E74C3C',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#636E72',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: '#95A5A6',
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  detailModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '75%',
  },
  detailModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  detailModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3436',
  },
  detailModalContent: {
    padding: 18,
  },
  workOrderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 14,
    padding: 16,
    marginBottom: 18,
  },
  workOrderIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: 'rgba(108, 99, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  workOrderDetails: {
    flex: 1,
  },
  workOrderName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 4,
  },
  workOrderNo: {
    fontSize: 13,
    color: '#636E72',
    marginBottom: 2,
  },
  workOrderDate: {
    fontSize: 12,
    color: '#95A5A6',
  },
  missingSection: {
    marginBottom: 10,
  },
  missingSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  missingSectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#E74C3C',
  },
  missingFieldsList: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
  },
  missingFieldItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  missingFieldNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E74C3C',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  missingFieldNumberText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  missingFieldLabel: {
    fontSize: 14,
    color: '#2D3436',
    flex: 1,
  },
  detailModalFooter: {
    padding: 18,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  goToWorkOrderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#6C63FF',
    borderRadius: 12,
    paddingVertical: 14,
  },
  goToWorkOrderBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
