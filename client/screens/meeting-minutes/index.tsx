import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Screen } from '@/components/Screen';
import { PageHeader } from '@/components/PageHeader';
import { FontAwesome6 } from '@expo/vector-icons';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { storage } from '@/utils/storage';
import { getApiBaseUrl } from '@/utils/api';

interface MeetingMinute {
  id: number;
  meeting_name: string;
  meeting_date: string;
  meeting_location: string;
  attendees: string;
  recorder: string;
  topics: string;
  summary: string;
  tags: Array<{ id: number; name: string; color: string }>;
  created_at: string;
  updated_at: string;
}

interface Tag {
  id: number;
  name: string;
  color: string;
  count?: number;
}

export default function MeetingMinutes() {
  const router = useSafeRouter();
  const [minutes, setMinutes] = useState<MeetingMinute[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedTag, setSelectedTag] = useState<number | null>(null);
  const [user, setUser] = useState<any>(null);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedMinute, setSelectedMinute] = useState<MeetingMinute | null>(null);

  useEffect(() => {
    const loadData = async () => {
      await loadUserInfo();
      await Promise.all([
        fetchTags(),
      ]);
    };
    loadData();
  }, []);

  // 使用useFocusEffect确保从其他页面返回时自动刷新列表
  useFocusEffect(
    useCallback(() => {
      fetchMeetingMinutes();
    }, [searchKeyword, selectedTag])
  );

  const loadUserInfo = async () => {
    try {
      const userStr = await storage.getItem('user');
      if (userStr) {
        setUser(JSON.parse(userStr));
      }
    } catch (error) {
      console.error('Load user error:', error);
    }
  };

  const fetchMeetingMinutes = async (): Promise<MeetingMinute[]> => {
    try {
      setLoading(true);
      let url = `${getApiBaseUrl()}/api/v1/meeting-minutes?limit=10`;
      const response = await fetch(url);
      const data = await response.json();
      if (response.ok) {
        const list = Array.isArray(data) ? data.slice(0, 10) : (data.list || data.data || []);
        setMinutes(list);
        return list;
      }
      return [];
    } catch (error) {
      console.error('Fetch meeting minutes error:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchTags = async (): Promise<Tag[]> => {
    try {
      const response = await fetch(
        `${getApiBaseUrl()}/api/v1/meeting-minutes/tags`
      );
      const data = await response.json();
      if (Array.isArray(data)) {
        setTags(data);
        return data;
      }
      return [];
    } catch (error) {
      console.error('Fetch tags error:', error);
      return [];
    }
  };

  const loadMeetingMinutes = async (keyword?: string, tagId?: number) => {
    try {
      setLoading(true);
      let url = `${getApiBaseUrl()}/api/v1/meeting-minutes?limit=10`;
      if (keyword) {
        url += `&keyword=${encodeURIComponent(keyword)}`;
      }
      if (tagId) {
        url += `&tag_id=${tagId}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      if (response.ok) {
        const list = Array.isArray(data) ? data.slice(0, 10) : (data.list || data.data || []);
        setMinutes(list);
      }
    } catch (error) {
      console.error('Fetch meeting minutes error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadMeetingMinutes(searchKeyword || undefined, selectedTag || undefined);
  };

  const handleFilterApply = () => {
    loadMeetingMinutes(searchKeyword || undefined, selectedTag || undefined);
    setFilterModalVisible(false);
  };

  const handleResetFilter = () => {
    setSearchKeyword('');
    setSelectedTag(null);
    loadMeetingMinutes();
    setFilterModalVisible(false);
  };

  const handleCreate = () => {
    router.push('/meeting-minute-create');
  };

  const handleEdit = (minuteId: number) => {
    router.push('/meeting-minute-create', { id: minuteId });
  };

  const handleViewDetail = (minuteId: number) => {
    router.push('/meeting-minute-create', { id: minuteId, view: 'detail' });
  };

  const handleDeletePress = (minute: MeetingMinute) => {
    setSelectedMinute(minute);
    setDeleteModalVisible(true);
  };

  const handleDelete = async () => {
    if (!selectedMinute) return;

    try {
      const response = await fetch(
        `${getApiBaseUrl()}/api/v1/meeting-minutes/${selectedMinute.id}`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (response.ok) {
        Alert.alert('成功', '删除成功');
        setDeleteModalVisible(false);
        setSelectedMinute(null);
        fetchMeetingMinutes();
      } else {
        const error = await response.json();
        Alert.alert('错误', error.message || '删除失败');
      }
    } catch (error) {
      console.error('删除错误:', error);
      Alert.alert('错误', '删除失败');
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const renderMinuteCard = ({ item }: { item: MeetingMinute }) => (
    <View style={styles.card}>
      {/* 卡片头部 */}
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleContainer}>
          <FontAwesome6 name="file-lines" size={18} color="#6C63FF" />
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.meeting_name}
          </Text>
        </View>
        <Text style={styles.cardDate}>{formatDate(item.meeting_date)}</Text>
      </View>

      {/* 会议信息 */}
      <View style={styles.cardInfo}>
        {item.meeting_location && (
          <View style={styles.infoRow}>
            <FontAwesome6 name="location-dot" size={12} color="#636E72" />
            <Text style={styles.infoText}>{item.meeting_location}</Text>
          </View>
        )}
        {item.attendees && (
          <View style={styles.infoRow}>
            <FontAwesome6 name="users" size={12} color="#636E72" />
            <Text style={styles.infoText} numberOfLines={1}>
              {item.attendees}
            </Text>
          </View>
        )}
        {item.recorder && (
          <View style={styles.infoRow}>
            <FontAwesome6 name="pen" size={12} color="#636E72" />
            <Text style={styles.infoText}>{item.recorder}</Text>
          </View>
        )}
      </View>

      {/* 标签 */}
      {item.tags && item.tags.length > 0 && (
        <View style={styles.tagContainer}>
          {item.tags.slice(0, 5).map((tag, index) => (
            <View
              key={tag.id || index}
              style={[styles.tag, { backgroundColor: tag.color || '#6C63FF' }]}
            >
              <Text style={styles.tagText}>{tag.name}</Text>
            </View>
          ))}
          {item.tags.length > 5 && (
            <Text style={styles.moreTagsText}>+{item.tags.length - 5}</Text>
          )}
        </View>
      )}

      {/* 操作按钮 */}
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleViewDetail(item.id)}
        >
          <FontAwesome6 name="eye" size={14} color="#1E88E5" />
          <Text style={styles.actionButtonText}>查看</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleEdit(item.id)}
        >
          <FontAwesome6 name="pen" size={14} color="#00B894" />
          <Text style={[styles.actionButtonText, { color: '#00B894' }]}>修改</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleDeletePress(item)}
        >
          <FontAwesome6 name="trash" size={14} color="#E74C3C" />
          <Text style={[styles.actionButtonText, { color: '#E74C3C' }]}>删除</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Screen>
      <PageHeader
        title="会议纪要"
        rightAction={
          <TouchableOpacity onPress={handleCreate} style={styles.addButton}>
            <FontAwesome6 name="plus" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />

      <View style={styles.container}>
        {/* 搜索栏 */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <FontAwesome6 name="magnifying-glass" size={16} color="#B2BEC3" />
            <TextInput
              style={styles.searchInput}
              placeholder="搜索会议纪要..."
              placeholderTextColor="#B2BEC3"
              value={searchKeyword}
              onChangeText={setSearchKeyword}
              onSubmitEditing={handleSearch}
            />
          </View>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setFilterModalVisible(true)}
          >
            <FontAwesome6 name="filter" size={18} color="#6C63FF" />
          </TouchableOpacity>
        </View>

        {/* 筛选标签显示 */}
        {(selectedTag || searchKeyword) && (
          <View style={styles.activeFilters}>
            {searchKeyword && (
              <TouchableOpacity
                style={styles.filterTag}
                onPress={() => {
                  setSearchKeyword('');
                  loadMeetingMinutes(undefined, selectedTag || undefined);
                }}
              >
                <Text style={styles.filterTagText}>关键词: {searchKeyword}</Text>
                <FontAwesome6 name="xmark" size={10} color="#FFFFFF" />
              </TouchableOpacity>
            )}
            {selectedTag && (
              <TouchableOpacity
                style={styles.filterTag}
                onPress={() => {
                  setSelectedTag(null);
                  loadMeetingMinutes(searchKeyword || undefined, undefined);
                }}
              >
                <Text style={styles.filterTagText}>
                  标签: {tags.find((t) => t.id === selectedTag)?.name}
                </Text>
                <FontAwesome6 name="xmark" size={10} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* 会议纪要列表 */}
        <FlatList
          data={minutes}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderMinuteCard}
          contentContainerStyle={styles.listContainer}
          refreshing={loading}
          onRefresh={() => loadMeetingMinutes(searchKeyword || undefined, selectedTag || undefined)}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <FontAwesome6 name="file-circle-xmark" size={48} color="#DFE6E9" />
              <Text style={styles.emptyText}>暂无会议纪要</Text>
              <Text style={styles.emptyHint}>点击右上角"+"按钮新增</Text>
            </View>
          }
          ListHeaderComponent={
            <Text style={styles.listHeader}>最新10条记录</Text>
          }
        />
      </View>

      {/* 筛选弹窗 */}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>筛选条件</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <FontAwesome6 name="xmark" size={20} color="#636E72" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>标签筛选</Text>
                <View style={styles.tagGrid}>
                  <TouchableOpacity
                    style={[styles.tagOption, !selectedTag && styles.tagOptionActive]}
                    onPress={() => setSelectedTag(null)}
                  >
                    <Text style={[styles.tagOptionText, !selectedTag && styles.tagOptionTextActive]}>
                      全部
                    </Text>
                  </TouchableOpacity>
                  {tags.map((tag) => (
                    <TouchableOpacity
                      key={tag.id}
                      style={[
                        styles.tagOption,
                        selectedTag === tag.id && styles.tagOptionActive,
                        { borderColor: tag.color },
                      ]}
                      onPress={() => setSelectedTag(tag.id)}
                    >
                      <Text
                        style={[
                          styles.tagOptionText,
                          selectedTag === tag.id && styles.tagOptionTextActive,
                        ]}
                      >
                        {tag.name} ({tag.count || 0})
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={handleResetFilter}
              >
                <Text style={styles.cancelButtonText}>重置</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleFilterApply}
              >
                <Text style={styles.confirmButtonText}>应用</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 删除确认弹窗 */}
      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.deleteOverlay}>
          <View style={styles.deleteContent}>
            <View style={styles.deleteIconContainer}>
              <FontAwesome6 name="exclamation-triangle" size={40} color="#E74C3C" />
            </View>
            <Text style={styles.deleteTitle}>确认删除</Text>
            <Text style={styles.deleteMessage}>
              确定要删除会议纪要"{selectedMinute?.meeting_name}"吗？
            </Text>
            <Text style={styles.deleteHint}>此操作不可恢复</Text>
            <View style={styles.deleteActions}>
              <TouchableOpacity
                style={[styles.deleteButton, styles.deleteCancelButton]}
                onPress={() => setDeleteModalVisible(false)}
              >
                <Text style={styles.deleteCancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.deleteButton, styles.deleteConfirmButton]}
                onPress={handleDelete}
              >
                <Text style={styles.deleteConfirmText}>删除</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#6C63FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#2D3436',
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  filterTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#6C63FF',
  },
  filterTagText: {
    fontSize: 12,
    color: '#FFFFFF',
  },
  listContainer: {
    padding: 16,
    paddingTop: 0,
  },
  listHeader: {
    fontSize: 13,
    color: '#636E72',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3436',
    flex: 1,
  },
  cardDate: {
    fontSize: 12,
    color: '#6C63FF',
    fontWeight: '500',
  },
  cardInfo: {
    gap: 6,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#636E72',
    flex: 1,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 11,
    color: '#FFFFFF',
  },
  moreTagsText: {
    fontSize: 11,
    color: '#636E72',
    alignSelf: 'center',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F3',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionButtonText: {
    fontSize: 13,
    color: '#1E88E5',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 15,
    color: '#636E72',
    marginTop: 12,
  },
  emptyHint: {
    fontSize: 13,
    color: '#B2BEC3',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3436',
  },
  modalBody: {
    marginBottom: 20,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 12,
  },
  tagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tagOption: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F5F7FA',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  tagOptionActive: {
    backgroundColor: '#6C63FF',
    borderColor: '#6C63FF',
  },
  tagOptionText: {
    fontSize: 13,
    color: '#636E72',
  },
  tagOptionTextActive: {
    color: '#FFFFFF',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5F7FA',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#636E72',
  },
  confirmButton: {
    backgroundColor: '#6C63FF',
  },
  confirmButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  deleteOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  deleteContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    alignItems: 'center',
  },
  deleteIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  deleteTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3436',
    marginBottom: 8,
  },
  deleteMessage: {
    fontSize: 14,
    color: '#636E72',
    textAlign: 'center',
    marginBottom: 4,
  },
  deleteHint: {
    fontSize: 12,
    color: '#E74C3C',
    marginBottom: 20,
  },
  deleteActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  deleteButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  deleteCancelButton: {
    backgroundColor: '#F5F7FA',
  },
  deleteCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#636E72',
  },
  deleteConfirmButton: {
    backgroundColor: '#E74C3C',
  },
  deleteConfirmText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
