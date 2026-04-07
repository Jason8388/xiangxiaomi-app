import React, { useState } from 'react';
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
import { getApiBaseUrl } from '@/utils/api';

interface QueryMeeting {
  id: number;
  minute_id: string;
  meeting_name: string;
  meeting_type: string;
  meeting_date: string;
  meeting_location: string;
  attendees: string;
  topics: string;
  key_points: string;
  file_url?: string;
  customer_name?: string;
  project_name?: string;
  tags?: { id: number; tag: string }[];
  created_at: string;
}

const MEETING_TYPES: Record<string, string> = {
  'department-morning': '部门晨会',
  'department-weekly': '部门周例会',
  'project-start': '项目启动会',
  'project-push': '项目推进会',
  'pm-meeting': 'PM会议',
  'customer-meeting': '客户会议',
  'other': '其它会议',
};

export default function QueryMeeting() {
  const router = useSafeRouter();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [results, setResults] = useState<QueryMeeting[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchKeyword.trim()) {
      Alert.alert('提示', '请输入搜索关键词');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `${getApiBaseUrl()}/api/v1/minutes/search?keyword=${encodeURIComponent(searchKeyword)}`
      );
      const data = await response.json();
      if (response.ok) {
        setResults(data);
      }
    } catch (error) {
      Alert.alert('错误', '查询失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <PageHeader title="会议纪要查询" />

      <View style={styles.container}>
        {/* 搜索框 */}
        <View style={styles.searchContainer}>
          <FontAwesome6 name="magnifying-glass" size={16} color="#636E72" />
          <TextInput
            style={styles.searchInput}
            placeholder="输入标题、内容、参会人、类型、日期、项目、客户"
            value={searchKeyword}
            onChangeText={setSearchKeyword}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <Text style={styles.searchButtonText}>搜索</Text>
          </TouchableOpacity>
        </View>

        {/* 搜索提示 */}
        <View style={styles.tipContainer}>
          <FontAwesome6 name="circle-info" size={14} color="#F39C12" />
          <Text style={styles.tipText}>
            支持按会议纪要标题、会议内容、参会人、会议类型、日期、项目名称、客户名称、内容标签查询
          </Text>
        </View>

        {/* 搜索结果 */}
        {loading ? (
          <View style={styles.centerContainer}>
            <Text>查询中...</Text>
          </View>
        ) : results.length === 0 && searchKeyword ? (
          <View style={styles.centerContainer}>
            <FontAwesome6 name="calendar-xmark" size={48} color="#95A5A6" />
            <Text style={styles.emptyText}>未找到相关会议纪要</Text>
          </View>
        ) : results.length === 0 ? (
          <View style={styles.centerContainer}>
            <FontAwesome6 name="calendar" size={48} color="#95A5A6" />
            <Text style={styles.emptyText}>请输入关键词进行搜索</Text>
          </View>
        ) : (
          <ScrollView style={styles.resultsContainer}>
            <Text style={styles.resultsTitle}>查询结果（{results.length}）</Text>
            {results.map((meeting) => (
              <TouchableOpacity
                key={meeting.id}
                style={styles.meetingCard}
                onPress={() => router.push('/meeting-minute-detail', { id: meeting.id })}
              >
                <View style={styles.meetingHeader}>
                  <View style={styles.meetingTitleContainer}>
                    <FontAwesome6 name="calendar-days" size={18} color="#1E88E5" />
                    <Text style={styles.meetingTitle}>{meeting.meeting_name}</Text>
                  </View>
                  <View style={styles.meetingTypeBadge}>
                    <Text style={styles.meetingTypeText}>
                      {MEETING_TYPES[meeting.meeting_type] || meeting.meeting_type}
                    </Text>
                  </View>
                </View>

                <View style={styles.meetingMeta}>
                  <View style={styles.metaItem}>
                    <FontAwesome6 name="calendar" size={12} color="#636E72" />
                    <Text style={styles.metaText}>
                      {new Date(meeting.meeting_date).toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.metaItem}>
                    <FontAwesome6 name="location-dot" size={12} color="#636E72" />
                    <Text style={styles.metaText}>{meeting.meeting_location}</Text>
                  </View>
                </View>

                {/* 关联信息 */}
                {(meeting.customer_name || meeting.project_name) && (
                  <View style={styles.relations}>
                    {meeting.customer_name && (
                      <View style={styles.relationTag}>
                        <FontAwesome6 name="building" size={10} color="#636E72" />
                        <Text style={styles.relationText}>{meeting.customer_name}</Text>
                      </View>
                    )}
                    {meeting.project_name && (
                      <View style={styles.relationTag}>
                        <FontAwesome6 name="folder-open" size={10} color="#636E72" />
                        <Text style={styles.relationText}>{meeting.project_name}</Text>
                      </View>
                    )}
                  </View>
                )}

                {/* 会议议题 */}
                <View style={styles.topicsContainer}>
                  <Text style={styles.topicsLabel}>会议议题：</Text>
                  <Text style={styles.topicsText} numberOfLines={2}>
                    {meeting.topics}
                  </Text>
                </View>

                {meeting.tags && meeting.tags.length > 0 && (
                  <View style={styles.tagsContainer}>
                    {meeting.tags.slice(0, 5).map((tagItem, index) => (
                      <View key={index} style={styles.tagBadge}>
                        <FontAwesome6 name="tag" size={10} color="#9B59B6" />
                        <Text style={styles.tagText}>{tagItem.tag}</Text>
                      </View>
                    ))}
                    {meeting.tags.length > 5 && (
                      <Text style={styles.moreTagsText}>+{meeting.tags.length - 5}</Text>
                    )}
                  </View>
                )}

                <View style={styles.meetingFooter}>
                  <View style={styles.fileStatus}>
                    <FontAwesome6
                      name={meeting.file_url ? 'file-pdf' : 'file-circle-xmark'}
                      size={12}
                      color={meeting.file_url ? '#E74C3C' : '#95A5A6'}
                    />
                    <Text
                      style={[
                        styles.fileStatusText,
                        { color: meeting.file_url ? '#E74C3C' : '#95A5A6' },
                      ]}
                    >
                      {meeting.file_url ? '有附件' : '无附件'}
                    </Text>
                  </View>
                  <Text style={styles.uploadDate}>
                    {new Date(meeting.created_at).toLocaleDateString()}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(243, 156, 18, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 12,
    marginBottom: 16,
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    color: '#F39C12',
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
    marginTop: 12,
  },
  resultsContainer: {
    flex: 1,
  },
  resultsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#636E72',
    marginBottom: 12,
  },
  meetingCard: {
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
  meetingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  meetingTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  meetingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2D3436',
  },
  meetingTypeBadge: {
    backgroundColor: 'rgba(30, 136, 229, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  meetingTypeText: {
    fontSize: 11,
    color: '#1E88E5',
    fontWeight: '500',
  },
  meetingMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#636E72',
  },
  relations: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  relationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#F5F7FA',
  },
  relationText: {
    fontSize: 11,
    color: '#636E72',
  },
  topicsContainer: {
    backgroundColor: '#F5F7FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  topicsLabel: {
    fontSize: 12,
    color: '#636E72',
    marginBottom: 4,
  },
  topicsText: {
    fontSize: 13,
    color: '#2D3436',
    lineHeight: 18,
  },
  meetingFooter: {
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
    gap: 4,
  },
  fileStatusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  uploadDate: {
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
  moreTagsText: {
    fontSize: 11,
    color: '#95A5A6',
    alignSelf: 'center',
  },
});
