import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { PageHeader } from '@/components/PageHeader';
import { FontAwesome6 } from '@expo/vector-icons';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
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

export default function MeetingMinuteDetail() {
  const router = useSafeRouter();
  const { id } = useSafeSearchParams<{ id: string }>();
  const [minute, setMinute] = useState<MeetingMinute | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      loadMeetingMinute();
    }
  }, [id]);

  const loadMeetingMinute = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/minutes/${id}`
      );
      const data = await response.json();
      if (response.ok) {
        setMinute(data);
      }
    } catch (error) {
      console.error('Fetch meeting minute error:', error);
      Alert.alert('错误', '加载会议纪要失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!minute?.file_url) {
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

  const handleEdit = () => {
    if (id) {
      router.push('/meeting-minute-edit', { id: parseInt(id) });
    }
  };

  const getMeetingTypeText = (type: string) => {
    return MEETING_TYPES[type as keyof typeof MEETING_TYPES] || type;
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

  if (loading) {
    return (
      <Screen>
        <PageHeader title="会议纪要详情" />
        <View style={styles.centerContainer}>
          <Text>加载中...</Text>
        </View>
      </Screen>
    );
  }

  if (!minute) {
    return (
      <Screen>
        <PageHeader title="会议纪要详情" />
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>会议纪要不存在</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <PageHeader title="会议纪要详情" />

      <ScrollView style={styles.container}>
        {/* 操作按钮 */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
            <FontAwesome6 name="pen" size={16} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>编辑</Text>
          </TouchableOpacity>
          {minute.file_url && (
            <TouchableOpacity style={styles.downloadButton} onPress={handleDownload}>
              <FontAwesome6 name="download" size={16} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>下载附件</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 基本信息 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FontAwesome6 name="circle-info" size={16} color="#1E88E5" />
            <Text style={styles.sectionTitle}>基本信息</Text>
          </View>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>会议名称</Text>
              <Text style={styles.infoValue}>{minute.meeting_name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>纪要编号</Text>
              <Text style={styles.infoValue}>{minute.minute_id}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>会议类型</Text>
              <View
                style={[
                  styles.typeBadge,
                  { backgroundColor: `${getMeetingTypeColor(minute.meeting_type)}20` },
                ]}
              >
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
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>会议时间</Text>
              <Text style={styles.infoValue}>
                {new Date(minute.meeting_date).toLocaleString()}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>会议地点</Text>
              <Text style={styles.infoValue}>{minute.meeting_location}</Text>
            </View>
          </View>
        </View>

        {/* 参会人员 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FontAwesome6 name="users" size={16} color="#1E88E5" />
            <Text style={styles.sectionTitle}>参会人员</Text>
          </View>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>主持人</Text>
              <Text style={styles.infoValue}>{minute.host}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>记录人</Text>
              <Text style={styles.infoValue}>{minute.recorder}</Text>
            </View>
            <View style={styles.attendeesRow}>
              <Text style={styles.infoLabel}>参会人员</Text>
              <Text style={styles.attendeesText}>{minute.attendees}</Text>
            </View>
          </View>
        </View>

        {/* 关联信息 */}
        {(minute.customer_id || minute.project_id) && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <FontAwesome6 name="link" size={16} color="#1E88E5" />
              <Text style={styles.sectionTitle}>关联信息</Text>
            </View>
            <View style={styles.relationCard}>
              {minute.customer_id && (
                <View style={styles.relationItem}>
                  <FontAwesome6 name="building" size={16} color="#1E88E5" />
                  <View>
                    <Text style={styles.relationLabel}>客户</Text>
                    <Text style={styles.relationValue}>{minute.customer_name}</Text>
                  </View>
                </View>
              )}
              {minute.project_id && (
                <View style={styles.relationItem}>
                  <FontAwesome6 name="folder-open" size={16} color="#1E88E5" />
                  <View>
                    <Text style={styles.relationLabel}>项目</Text>
                    <Text style={styles.relationValue}>{minute.project_name}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* 会议议题 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FontAwesome6 name="list" size={16} color="#1E88E5" />
            <Text style={styles.sectionTitle}>会议议题</Text>
          </View>
          <View style={styles.contentCard}>
            <Text style={styles.contentText}>{minute.topics}</Text>
          </View>
        </View>

        {/* 内容要点 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FontAwesome6 name="lightbulb" size={16} color="#1E88E5" />
            <Text style={styles.sectionTitle}>内容要点</Text>
          </View>
          <View style={styles.contentCard}>
            <Text style={styles.contentText}>{minute.key_points}</Text>
          </View>
        </View>

        {/* 会议总结 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FontAwesome6 name="clipboard-check" size={16} color="#1E88E5" />
            <Text style={styles.sectionTitle}>会议总结</Text>
          </View>
          <View style={styles.contentCard}>
            <Text style={styles.contentText}>{minute.summary}</Text>
          </View>
        </View>

        {/* 附件信息 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FontAwesome6 name="paperclip" size={16} color="#1E88E5" />
            <Text style={styles.sectionTitle}>附件信息</Text>
          </View>
          <View style={styles.fileCard}>
            {minute.file_url ? (
              <View style={styles.fileInfo}>
                <FontAwesome6 name="file-pdf" size={32} color="#E74C3C" />
                <View style={styles.fileInfoText}>
                  <Text style={styles.fileName}>{minute.minute_id}.pdf</Text>
                  <Text style={styles.fileStatusText}>已上传</Text>
                </View>
              </View>
            ) : (
              <View style={styles.noFile}>
                <FontAwesome6 name="file-circle-xmark" size={32} color="#95A5A6" />
                <Text style={styles.noFileText}>未上传附件</Text>
              </View>
            )}
          </View>
        </View>

        {/* 时间信息 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FontAwesome6 name="clock" size={16} color="#1E88E5" />
            <Text style={styles.sectionTitle}>时间信息</Text>
          </View>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>创建时间</Text>
              <Text style={styles.infoValue}>
                {new Date(minute.created_at).toLocaleString()}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>更新时间</Text>
              <Text style={styles.infoValue}>
                {new Date(minute.updated_at).toLocaleString()}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#636E72',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#1E88E5',
  },
  downloadButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#2ECC71',
  },
  actionButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3436',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#636E72',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#2D3436',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  attendeesRow: {
    paddingVertical: 8,
  },
  attendeesText: {
    fontSize: 14,
    color: '#2D3436',
    lineHeight: 20,
  },
  relationCard: {
    backgroundColor: '#F5F7FA',
    borderRadius: 8,
    padding: 16,
  },
  relationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  relationLabel: {
    fontSize: 12,
    color: '#95A5A6',
    marginBottom: 2,
  },
  relationValue: {
    fontSize: 14,
    color: '#2D3436',
    fontWeight: '500',
  },
  contentCard: {
    backgroundColor: '#F5F7FA',
    borderRadius: 8,
    padding: 16,
  },
  contentText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#2D3436',
  },
  fileCard: {
    backgroundColor: '#F5F7FA',
    borderRadius: 8,
    padding: 16,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fileInfoText: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    color: '#2D3436',
    fontWeight: '500',
    marginBottom: 2,
  },
  fileStatusText: {
    fontSize: 12,
    color: '#2ECC71',
  },
  noFile: {
    alignItems: 'center',
    padding: 20,
  },
  noFileText: {
    fontSize: 14,
    color: '#95A5A6',
    marginTop: 8,
  },
});
