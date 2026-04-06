import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  StyleSheet,
  Alert,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { PageHeader } from '@/components/PageHeader';
import { FontAwesome6 } from '@expo/vector-icons';

interface NotificationRecipient {
  user_id: number;
  user_name: string;
  status: 'unread' | 'read' | 'confirmed';
  read_at?: string;
  confirmed_at?: string;
}

interface MaterialNotification {
  id: number;
  title: string;
  content: string;
  recipients: NotificationRecipient[];
  created_at: string;
  created_by: string;
}

export default function MaterialNotifications() {
  const [notifications, setNotifications] = useState<MaterialNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
  });
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);

  useEffect(() => {
    loadNotifications();
    loadAvailableUsers();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/material-notifications`
      );
      const data = await response.json();
      if (response.ok) {
        setNotifications(data);
      }
    } catch (error) {
      console.error('Fetch notifications error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableUsers = async () => {
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/users`
      );
      const data = await response.json();
      if (response.ok) {
        setAvailableUsers(data);
      }
    } catch (error) {
      console.error('Fetch users error:', error);
    }
  };

  const handlePublish = () => {
    setFormData({ title: '', content: '' });
    setSelectedUsers([]);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.content) {
      Alert.alert('提示', '通知标题和内容不能为空');
      return;
    }

    if (selectedUsers.length === 0) {
      Alert.alert('提示', '请选择通知接收人');
      return;
    }

    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/material-notifications`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            recipient_ids: selectedUsers,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        Alert.alert('成功', '发布成功');
        setModalVisible(false);
        loadNotifications();
      } else {
        throw new Error(data.error || '操作失败');
      }
    } catch (error: any) {
      Alert.alert('错误', error.message);
    }
  };

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/material-notifications/${notificationId}/read`,
        {
          method: 'POST',
        }
      );
      if (response.ok) {
        loadNotifications();
      }
    } catch (error) {
      console.error('Mark as read error:', error);
    }
  };

  const handleConfirm = async (notificationId: number) => {
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/material-notifications/${notificationId}/confirm`,
        {
          method: 'POST',
        }
      );
      if (response.ok) {
        Alert.alert('成功', '已确认');
        loadNotifications();
      }
    } catch (error) {
      console.error('Confirm error:', error);
    }
  };

  const toggleUserSelection = (userId: number) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'unread':
        return '未查阅';
      case 'read':
        return '已查阅';
      case 'confirmed':
        return '已确认';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'unread':
        return '#E74C3C';
      case 'read':
        return '#F39C12';
      case 'confirmed':
        return '#2ECC71';
      default:
        return '#636E72';
    }
  };

  return (
    <Screen>
      <PageHeader title="领料通知" />

      {/* 操作按钮 */}
      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.addButton} onPress={handlePublish}>
          <FontAwesome6 name="bell" size={16} color="#FFFFFF" />
          <Text style={styles.addButtonText}>发布通知</Text>
        </TouchableOpacity>
      </View>

      {/* 通知列表 */}
      <ScrollView style={styles.listContainer}>
        {loading ? (
          <View style={styles.centerContainer}>
            <Text>加载中...</Text>
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>暂无领料通知</Text>
          </View>
        ) : (
          notifications.map((notification) => (
            <View key={notification.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleContainer}>
                  <FontAwesome6 name="bell" size={18} color="#E74C3C" />
                  <View>
                    <Text style={styles.cardTitle}>{notification.title}</Text>
                    <Text style={styles.cardMeta}>
                      {notification.created_by} · {new Date(notification.created_at).toLocaleString()}
                    </Text>
                  </View>
                </View>
              </View>

              <Text style={styles.content}>{notification.content}</Text>

              <View style={styles.recipientsSection}>
                <Text style={styles.recipientsTitle}>接收人状态:</Text>
                <View style={styles.recipientsList}>
                  {notification.recipients.map((recipient) => (
                    <View key={recipient.user_id} style={styles.recipientItem}>
                      <Text style={styles.recipientName}>{recipient.user_name}</Text>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: `${getStatusColor(recipient.status)}20` },
                        ]}
                      >
                        <Text
                          style={[styles.statusText, { color: getStatusColor(recipient.status) }]}
                        >
                          {getStatusText(recipient.status)}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.cardFooter}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleMarkAsRead(notification.id)}
                >
                  <FontAwesome6 name="eye" size={14} color="#1E88E5" />
                  <Text style={styles.actionButtonText}>查阅</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleConfirm(notification.id)}
                >
                  <FontAwesome6 name="check" size={14} color="#2ECC71" />
                  <Text style={styles.actionButtonText}>确认</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* 发布通知 Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>发布领料通知</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <FontAwesome6 name="xmark" size={20} color="#636E72" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>通知标题 *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="请输入通知标题"
                  value={formData.title}
                  onChangeText={(text) => setFormData({ ...formData, title: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>通知内容 *</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea]}
                  placeholder="请输入通知内容"
                  value={formData.content}
                  onChangeText={(text) => setFormData({ ...formData, content: text })}
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>选择接收人 *</Text>
                <View style={styles.usersList}>
                  {availableUsers.map((user) => (
                    <TouchableOpacity
                      key={user.id}
                      style={[
                        styles.userItem,
                        selectedUsers.includes(user.id) && styles.userItemSelected,
                      ]}
                      onPress={() => toggleUserSelection(user.id)}
                    >
                      <View style={styles.userInfo}>
                        <FontAwesome6 name="user" size={16} color="#636E72" />
                        <Text style={styles.userName}>{user.name}</Text>
                      </View>
                      <FontAwesome6
                        name={selectedUsers.includes(user.id) ? 'check-circle' : 'circle'}
                        size={20}
                        color={selectedUsers.includes(user.id) ? '#1E88E5' : '#BDC3C7'}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSave}
              >
                <Text style={styles.saveButtonText}>发布</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  actionBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#1E88E5',
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 14,
    color: '#636E72',
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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D3436',
  },
  cardMeta: {
    fontSize: 12,
    color: '#636E72',
    marginTop: 2,
  },
  content: {
    fontSize: 14,
    color: '#2D3436',
    marginBottom: 12,
    lineHeight: 20,
  },
  recipientsSection: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#F5F7FA',
    borderRadius: 8,
  },
  recipientsTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#636E72',
    marginBottom: 8,
  },
  recipientsList: {
    gap: 6,
  },
  recipientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  recipientName: {
    fontSize: 13,
    color: '#2D3436',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F5F7FA',
  },
  actionButtonText: {
    fontSize: 13,
    color: '#2D3436',
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3436',
  },
  modalBody: {
    padding: 16,
    maxHeight: 400,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2D3436',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#2D3436',
  },
  formTextArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  usersList: {
    maxHeight: 200,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 8,
  },
  userItemSelected: {
    borderColor: '#1E88E5',
    backgroundColor: 'rgba(30, 136, 229, 0.05)',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userName: {
    fontSize: 14,
    color: '#2D3436',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5F7FA',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#636E72',
  },
  saveButton: {
    backgroundColor: '#1E88E5',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
});
