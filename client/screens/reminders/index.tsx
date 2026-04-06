import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
  StyleSheet,
  Alert,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { FontAwesome6 } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';

interface Reminder {
  id: number;
  title: string;
  content: string;
  remind_at: string;
  is_completed: boolean;
  created_at: string;
}

const ReminderStatus = {
  TODO: { label: '待提醒', color: '#FDCB6E' },
  DONE: { label: '已完成', color: '#00B894' },
  OVERDUE: { label: '已逾期', color: '#E74C3C' },
};

export default function RemindersScreen() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [remindAt, setRemindAt] = useState('');
  const [filter, setFilter] = useState<'all' | 'todo' | 'done'>('all');

  const fetchReminders = async () => {
    try {
      const res = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/reminders`);
      if (res.ok) {
        const data = await res.json();
        setReminders(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Failed to fetch reminders:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchReminders();
    }, [])
  );

  const getStatus = (reminder: Reminder) => {
    if (reminder.is_completed) return ReminderStatus.DONE;
    const remindDate = new Date(reminder.remind_at);
    if (remindDate < new Date()) return ReminderStatus.OVERDUE;
    return ReminderStatus.TODO;
  };

  const filteredReminders = reminders.filter(r => {
    if (filter === 'todo') return !r.is_completed;
    if (filter === 'done') return r.is_completed;
    return true;
  });

  const handleAdd = () => {
    setEditingReminder(null);
    setTitle('');
    setContent('');
    setRemindAt(new Date().toISOString().slice(0, 16));
    setModalVisible(true);
  };

  const handleEdit = (item: Reminder) => {
    setEditingReminder(item);
    setTitle(item.title);
    setContent(item.content);
    setRemindAt(item.remind_at.slice(0, 16));
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('提示', '请输入提醒标题');
      return;
    }

    try {
      const url = editingReminder
        ? `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/reminders/${editingReminder.id}`
        : `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/reminders`;
      const method = editingReminder ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, remind_at: remindAt }),
      });

      if (res.ok) {
        setModalVisible(false);
        fetchReminders();
      }
    } catch (error) {
      console.error('Failed to save reminder:', error);
    }
  };

  const handleToggleComplete = async (item: Reminder) => {
    try {
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/reminders/${item.id}/toggle`,
        { method: 'PATCH' }
      );
      if (res.ok) {
        fetchReminders();
      }
    } catch (error) {
      console.error('Failed to toggle:', error);
    }
  };

  const handleDelete = (item: Reminder) => {
    Alert.alert('确认删除', '确定要删除这条提醒吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await fetch(
              `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/reminders/${item.id}`,
              { method: 'DELETE' }
            );
            if (res.ok) fetchReminders();
          } catch (error) {
            console.error('Failed to delete:', error);
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: Reminder }) => {
    const status = getStatus(item);
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <TouchableOpacity onPress={() => handleToggleComplete(item)}>
            <FontAwesome6
              name={item.is_completed ? 'check-circle' : 'circle'}
              size={22}
              color={item.is_completed ? '#00B894' : '#B2BEC3'}
            />
          </TouchableOpacity>
          <View style={styles.cardTitleRow}>
            <Text style={[styles.cardTitle, item.is_completed && styles.completed]}>
              {item.title}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: `${status.color}20` }]}>
              <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
            </View>
          </View>
        </View>
        {item.content ? (
          <Text style={styles.cardContent}>{item.content}</Text>
        ) : null}
        <View style={styles.cardFooter}>
          <View style={styles.remindTime}>
            <FontAwesome6 name="clock" size={12} color="#636E72" />
            <Text style={styles.remindText}>
              {item.remind_at.replace('T', ' ').slice(0, 16)}
            </Text>
          </View>
          <View style={styles.cardActions}>
            <TouchableOpacity onPress={() => handleEdit(item)} style={styles.actionBtn}>
              <FontAwesome6 name="edit" size={16} color="#636E72" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item)} style={styles.actionBtn}>
              <FontAwesome6 name="trash" size={16} color="#E74C3C" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>工作提醒</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
          <FontAwesome6 name="plus" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.filterRow}>
        {(['all', 'todo', 'done'] as const).map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'all' ? '全部' : f === 'todo' ? '待提醒' : '已完成'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredReminders}
        keyExtractor={item => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={fetchReminders}
        ListEmptyComponent={
          <View style={styles.empty}>
            <FontAwesome6 name="bell" size={48} color="#DFE6E9" />
            <Text style={styles.emptyText}>暂无提醒</Text>
          </View>
        }
      />

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingReminder ? '编辑提醒' : '新建提醒'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <FontAwesome6 name="times" size={20} color="#636E72" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>提醒标题</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="请输入提醒标题"
              />
              <Text style={styles.inputLabel}>提醒内容</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={content}
                onChangeText={setContent}
                placeholder="请输入提醒内容（选填）"
                multiline
                numberOfLines={3}
              />
              <Text style={styles.inputLabel}>提醒时间</Text>
              <TextInput
                style={styles.input}
                value={remindAt}
                onChangeText={setRemindAt}
                placeholder="格式: 2024-01-01T10:00"
              />
            </View>
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.btn, styles.cancelBtn]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.saveBtn]} onPress={handleSave}>
                <Text style={styles.saveBtnText}>保存</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F4',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2D3436',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E88E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    padding: 12,
    gap: 12,
    backgroundColor: '#FFF',
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#F5F7FA',
  },
  filterActive: {
    backgroundColor: '#1E88E5',
  },
  filterText: {
    fontSize: 14,
    color: '#636E72',
  },
  filterTextActive: {
    color: '#FFF',
  },
  list: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  cardTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3436',
    flex: 1,
  },
  completed: {
    textDecorationLine: 'line-through',
    color: '#B2BEC3',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  cardContent: {
    fontSize: 14,
    color: '#636E72',
    marginLeft: 34,
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginLeft: 34,
  },
  remindTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  remindText: {
    fontSize: 12,
    color: '#636E72',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionBtn: {
    padding: 4,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#B2BEC3',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F4',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3436',
  },
  modalBody: {
    padding: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#636E72',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#F5F7FA',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#2D3436',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F3F4',
  },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: '#F5F7FA',
  },
  cancelBtnText: {
    fontSize: 16,
    color: '#636E72',
  },
  saveBtn: {
    backgroundColor: '#1E88E5',
  },
  saveBtnText: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '600',
  },
});
