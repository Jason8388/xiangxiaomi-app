import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { PageHeader } from '@/components/PageHeader';
import { FontAwesome6 } from '@expo/vector-icons';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

interface MeetingMinute {
  id: number;
  minute_id: string;
  meeting_name: string;
  meeting_type: string;
  meeting_date: string;
  meeting_location: string;
  attendees: string;
  host: string;
  recorder: string;
  topics: string;
  key_points: string;
  summary: string;
  file_url?: string;
  customer_id?: number;
  customer_name?: string;
  project_id?: number;
  project_name?: string;
  tags?: { id: number; tag: string }[];
  created_at: string;
  updated_at: string;
}

const MEETING_TYPES = {
  'department-morning': '部门晨会',
  'department-weekly': '部门周例会',
  'project-start': '项目启动会',
  'project-push': '项目推进会',
  'pm-meeting': 'PM会议',
  'customer-meeting': '客户会议',
  'other': '其它会议',
};

export default function MeetingMinutes() {
  const router = useSafeRouter();
  const [minutes, setMinutes] = useState<MeetingMinute[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');

  useEffect(() => {
    loadMeetingMinutes();
  }, []);

  const loadMeetingMinutes = async (keyword?: string) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (keyword) {
        params.append('keyword', keyword);
      }

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/minutes?${params.toString()}`
      );
      const data = await response.json();
      if (response.ok) {
        setMinutes(data);
      }
    } catch (error) {
      console.error('Fetch meeting minutes error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadMeetingMinutes(searchKeyword);
  };

  const handleCreate = () => {
    router.push('/meeting-minute-create');
  };

  const handleViewDetail = (minuteId: number) => {
    router.push('/meeting-minute-detail', { id: minuteId });
  };

  const handleEdit = (minuteId: number) => {
    router.push('/meeting-minute-edit', { id: minuteId });
  };

  const handleDelete = (minute: MeetingMinute) => {
    Alert.alert('确认删除', `确定要删除会议纪要"${minute.meeting_name}"吗？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            const response = await fetch(
              `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/minutes/${minute.id}`,
              {
                method: 'DELETE',
              }
            );
            if (response.ok) {
              Alert.alert('成功', '删除成功');
              loadMeetingMinutes();
            }
          } catch (error) {
            Alert.alert('错误', '删除失败');
          }
        },
      },
    ]);
  };

  const handleDownload = async (minute: MeetingMinute) => {
    if (!minute.file_url) {
      Alert.alert('提示', '该会议纪要未上传附件');
      return;
    }

    try {
      const response = await fetch(minute.file_url);
      if (!response.ok) throw new Error('下载失败');

      // 检测平台
      if (typeof window !== 'undefined') {
        // Web端
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${minute.minute_id}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        // 移动端
        const fileName = `${minute.minute_id}.pdf`;
        const fileUri = `${(FileSystem as any).cacheDirectory}${fileName}`;

        const fileInfo = await (FileSystem as any).downloadAsync(minute.file_url, fileUri);
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(fileInfo.uri);
        } else {
          Alert.alert('提示', '分享功能不可用');
        }
      }
    } catch (error) {
      Alert.alert('错误', '下载失败');
    }
  };

  const getMeetingTypeText = (type: string) => {
    return MEETING_TYPES[type as keyof typeof MEETING_TYPES] || type;
  };

  const getMeetingTypeIcon = (type: string) => {
    switch (type) {
      case 'department-morning':
        return 'sun';
      case 'department-weekly':
        return 'calendar-week';
      case 'project-start':
        return 'rocket';
      case 'project-push':
        return 'forward';
      case 'pm-meeting':
        return 'list-check';
      case 'customer-meeting':
        return 'handshake';
      default:
        return 'file-lines';
    }
  };

  const getMeetingTypeColor = (type: string) => {
    switch (type) {
      case 'department-morning':
        return '#F39C12';
      case 'department-weekly':
        return '#3498DB';
      case 'project-start':
        return '#2ECC71';
      case 'project-push':
        return '#E74C3C';
      case 'pm-meeting':
        return '#9B59B6';
      case 'customer-meeting':
        return '#1ABC9C';
      default:
        return '#95A5A6';
    }
  };

  return (
    <Screen>
      <PageHeader title="会议纪要" />

      <ScrollView style={styles.container}>
        {/* 操作栏 */}
        <View style={styles.actionBar}>
          <TouchableOpacity style={styles.createButton} onPress={handleCreate}>
            <FontAwesome6 name="plus" size={16} color="#FFFFFF" />
            <Text style={styles.createButtonText}>新建纪要</Text>
          </TouchableOpacity>
        </View>

        {/* 搜索框 */}
        <View style={styles.searchBar}>
          <FontAwesome6 name="magnifying-glass" size={16} color="#636E72" />
          <TextInput
            style={styles.searchInput}
            placeholder="搜索日期、名称、内容、参会人员"
            value={searchKeyword}
            onChangeText={setSearchKeyword}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <Text style={styles.searchButtonText}>搜索</Text>
          </TouchableOpacity>
        </View>

        {/* 会议纪要列表 */}
        {loading ? (
          <View style={styles.centerContainer}>
            <Text>加载中...</Text>
          </View>
        ) : minutes.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>暂无会议纪要</Text>
          </View>
        ) : (
          minutes.map((minute) => (
            <View key={minute.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.titleContainer}>
                  <View
                    style={[
                      styles.typeBadge,
                      { backgroundColor: `${getMeetingTypeColor(minute.meeting_type)}20` },
                    ]}
                  >
                    <FontAwesome6
                      name={getMeetingTypeIcon(minute.meeting_type) as any}
                      size={14}
                      color={getMeetingTypeColor(minute.meeting_type)}
                    />
                    <Text
                      style={[
                        styles.typeText,
                        { color: getMeetingTypeColor(minute.meeting_type) },
                      ]}
                    >
                      {getMeetingTypeText(minute.meeting_type)}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => handleViewDetail(minute.id)}
                  >
                    <FontAwesome6 name="eye" size={16} color="#1E88E5" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => handleEdit(minute.id)}
                  >
                    <FontAwesome6 name="pen" size={16} color="#F39C12" />
                  </TouchableOpacity>
                  {minute.file_url && (
                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={() => handleDownload(minute)}
                    >
                      <FontAwesome6 name="download" size={16} color="#2ECC71" />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => handleDelete(minute)}
                  >
                    <FontAwesome6 name="trash" size={16} color="#E74C3C" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* 关联信息 */}
              {(minute.customer_id || minute.project_id) && (
                <View style={styles.relationContainer}>
                  {minute.customer_id && (
                    <View style={styles.relationItem}>
                      <FontAwesome6 name="building" size={12} color="#636E72" />
                      <Text style={styles.relationText}>{minute.customer_name}</Text>
                    </View>
                  )}
                  {minute.project_id && (
                    <View style={styles.relationItem}>
                      <FontAwesome6 name="folder-open" size={12} color="#636E72" />
                      <Text style={styles.relationText}>{minute.project_name}</Text>
                    </View>
                  )}
                </View>
              )}

              <View style={styles.cardTitleRow}>
                <Text style={styles.cardTitle}>{minute.meeting_name}</Text>
                <Text style={styles.minuteId}>#{minute.minute_id}</Text>
              </View>

              <View style={styles.cardBody}>
                <View style={styles.infoRow}>
                  <FontAwesome6 name="calendar" size={14} color="#636E72" />
                  <Text style={styles.infoText}>
                    {new Date(minute.meeting_date).toLocaleString()}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <FontAwesome6 name="location-dot" size={14} color="#636E72" />
                  <Text style={styles.infoText}>{minute.meeting_location}</Text>
                </View>
                <View style={styles.infoRow}>
                  <FontAwesome6 name="user" size={14} color="#636E72" />
                  <Text style={styles.infoText}>主持人: {minute.host}</Text>
                </View>
                <View style={styles.infoRow}>
                  <FontAwesome6 name="users" size={14} color="#636E72" />
                  <Text style={styles.infoText} numberOfLines={1}>
                    参会: {minute.attendees}
                  </Text>
                </View>
              </View>

              <View style={styles.topicsContainer}>
                <FontAwesome6 name="list" size={14} color="#1E88E5" />
                <Text style={styles.topicsText} numberOfLines={2}>
                  {minute.topics}
                </Text>
              </View>

              {minute.tags && minute.tags.length > 0 && (
                <View style={styles.tagsContainer}>
                  {minute.tags.map((tagItem, index) => (
                    <View key={index} style={styles.tagBadge}>
                      <FontAwesome6 name="tag" size={10} color="#9B59B6" />
                      <Text style={styles.tagText}>{tagItem.tag}</Text>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.cardFooter}>
                <View style={styles.fileStatus}>
                  <FontAwesome6
                    name={minute.file_url ? 'file-pdf' : 'file-circle-xmark'}
                    size={14}
                    color={minute.file_url ? '#E74C3C' : '#95A5A6'}
                  />
                  <Text
                    style={[
                      styles.fileStatusText,
                      { color: minute.file_url ? '#E74C3C' : '#95A5A6' },
                    ]}
                  >
                    {minute.file_url ? '已上传附件' : '未上传附件'}
                  </Text>
                </View>
                <Text style={styles.updateDate}>
                  {new Date(minute.updated_at).toLocaleDateString()}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  actionBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#1E88E5',
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  searchButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#1E88E5',
  },
  searchButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
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
  titleContainer: {
    flex: 1,
    marginRight: 8,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 4,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#F5F7FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  relationContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  relationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(30, 136, 229, 0.1)',
  },
  relationText: {
    fontSize: 11,
    color: '#1E88E5',
    fontWeight: '500',
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3436',
  },
  minuteId: {
    fontSize: 12,
    color: '#95A5A6',
    fontWeight: '500',
  },
  cardBody: {
    marginBottom: 12,
    gap: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#636E72',
  },
  topicsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#F5F7FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  topicsText: {
    flex: 1,
    fontSize: 13,
    color: '#2D3436',
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  fileStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fileStatusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  updateDate: {
    fontSize: 12,
    color: '#95A5A6',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(155, 89, 182, 0.1)',
  },
  tagText: {
    fontSize: 11,
    color: '#9B59B6',
    fontWeight: '500',
  },
});
