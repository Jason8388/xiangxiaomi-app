import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Modal, TextInput, Platform, Image } from 'react-native';
import { Screen } from '@/components/Screen';
import { PageHeader } from '@/components/PageHeader';
import { FontAwesome6 } from '@expo/vector-icons';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { Video } from 'expo-av';

export default function MediaDetailScreen() {
  const [media, setMedia] = useState<any>(null);
  const [allTags, setAllTags] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#1E88E5');
  const [loading, setLoading] = useState(true);
  const router = useSafeRouter();
  const { id } = useSafeSearchParams<{ id: string }>();

  useEffect(() => {
    fetchMediaDetail();
    fetchAllTags();
  }, [id]);

  const fetchMediaDetail = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/media/${id}`);
      const data = await response.json();
      setMedia(data);
    } catch (error) {
      console.error('Fetch media detail error:', error);
      Alert.alert('错误', '获取媒体详情失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllTags = async () => {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/media/tags/list`);
      const data = await response.json();
      if (Array.isArray(data)) {
        setAllTags(data);
      }
    } catch (error) {
      console.error('Fetch tags error:', error);
    }
  };

  const handleAddTag = async (tagId: number) => {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/media/${id}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag_id: tagId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '添加标签失败');
      }

      Alert.alert('成功', '标签添加成功');
      fetchMediaDetail();
      fetchAllTags();
    } catch (error: any) {
      Alert.alert('错误', error.message);
    }
  };

  const handleRemoveTag = async (tagId: number) => {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/media/${id}/tags/${tagId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '删除标签失败');
      }

      Alert.alert('成功', '标签删除成功');
      fetchMediaDetail();
      fetchAllTags();
    } catch (error: any) {
      Alert.alert('错误', error.message);
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) {
      Alert.alert('提示', '标签名称不能为空');
      return;
    }

    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/files/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTagName.trim(), color: newTagColor }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '创建标签失败');
      }

      Alert.alert('成功', '标签创建成功');
      setNewTagName('');
      setModalVisible(false);
      fetchMediaDetail();
      fetchAllTags();
    } catch (error: any) {
      Alert.alert('错误', error.message);
    }
  };

  const handleDownload = async () => {
    try {
      await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/media/download/${id}`, {
        method: 'POST',
      });

      Alert.alert('提示', '下载记录已更新');
      fetchMediaDetail();
    } catch (error) {
      Alert.alert('错误', '下载失败');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const mediaTags = media?.tags || [];
  const availableTags = allTags.filter(tag => !mediaTags.find((mt: any) => mt.id === tag.id));

  if (loading) {
    return (
      <Screen>
        <PageHeader title="媒体详情" />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 14, color: '#636E72' }}>加载中...</Text>
        </View>
      </Screen>
    );
  }

  if (!media) {
    return (
      <Screen>
        <PageHeader title="媒体详情" />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 14, color: '#636E72' }}>媒体不存在</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <PageHeader title="媒体详情" />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 24 }}
      >
        {/* 媒体预览 */}
        <View
          style={{
            backgroundColor: '#000000',
            borderRadius: 16,
            overflow: 'hidden',
            marginBottom: 16,
            aspectRatio: 1,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {media.media_type === 'video' ? (
            <>
              <FontAwesome6 name="play-circle" size={64} color="#FFFFFF" />
              {media.duration && (
                <View style={styles.durationBadgeLarge}>
                  <Text style={styles.durationTextLarge}>{formatDuration(media.duration)}</Text>
                </View>
              )}
            </>
          ) : (
            <FontAwesome6 name="image" size={64} color="#FFFFFF" />
          )}
        </View>

        {/* 媒体信息卡片 */}
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 24,
            marginBottom: 16,
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <View style={{ marginBottom: 16 }}>
            <Text style={styles.fileName} numberOfLines={1}>
              {media.original_name}
            </Text>
            <Text style={styles.fileMetaLarge}>
              {formatFileSize(media.file_size)} · {media.media_type === 'video' ? '视频' : '照片'}
            </Text>
          </View>

          {media.duration && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>时长</Text>
              <Text style={styles.infoValue}>{formatDuration(media.duration)}</Text>
            </View>
          )}

          {media.width && media.height && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>尺寸</Text>
              <Text style={styles.infoValue}>{media.width} × {media.height}</Text>
            </View>
          )}

          <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingTop: 16, borderTopWidth: 1, borderTopColor: '#DFE6E9' }}>
            <TouchableOpacity onPress={handleDownload} style={styles.actionButton}>
              <FontAwesome6 name="download" size={24} color="#1E88E5" />
              <Text style={styles.actionButtonText}>下载</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 媒体详细信息 */}
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 24,
            marginBottom: 16,
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <Text style={styles.sectionTitle}>媒体信息</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>上传者</Text>
            <Text style={styles.infoValue}>{media.uploader_name || '-'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>上传时间</Text>
            <Text style={styles.infoValue}>
              {formatDate(media.upload_time)} {formatTime(media.upload_time)}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>下载次数</Text>
            <Text style={styles.infoValue}>{media.download_count} 次</Text>
          </View>

          {media.description && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>描述</Text>
              <Text style={styles.infoValue}>{media.description}</Text>
            </View>
          )}
        </View>

        {/* 标签管理 */}
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 24,
            marginBottom: 120,
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={styles.sectionTitle}>标签 ({mediaTags.length}/5)</Text>
            <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addButton}>
              <FontAwesome6 name="plus" size={16} color="#FFFFFF" />
              <Text style={styles.addButtonText}>新建标签</Text>
            </TouchableOpacity>
          </View>

          {/* 已添加的标签 */}
          {mediaTags.length > 0 ? (
            <View style={styles.tagsContainer}>
              {mediaTags.map((tag: any) => (
                <View
                  key={tag.id}
                  style={[styles.tagItem, { borderColor: tag.color, backgroundColor: `${tag.color}20` }]}
                >
                  <Text style={[styles.tagItemText, { color: tag.color }]}>
                    {tag.name}
                  </Text>
                  <TouchableOpacity onPress={() => handleRemoveTag(tag.id)} style={styles.removeTagButton}>
                    <FontAwesome6 name="xmark" size={12} color={tag.color} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>暂无标签</Text>
          )}

          {/* 可添加的标签 */}
          {availableTags.length > 0 && mediaTags.length < 5 && (
            <View style={{ marginTop: 16 }}>
              <Text style={styles.subsectionTitle}>可添加标签</Text>
              <View style={styles.tagsContainer}>
                {availableTags.map((tag) => (
                  <TouchableOpacity
                    key={tag.id}
                    onPress={() => handleAddTag(tag.id)}
                    style={[styles.addTagButton, { borderColor: tag.color }]}
                  >
                    <FontAwesome6 name="plus" size={12} color={tag.color} />
                    <Text style={[styles.addTagButtonText, { color: tag.color }]}>
                      {tag.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {mediaTags.length >= 5 && (
            <Text style={styles.limitText}>已达到标签上限（5个）</Text>
          )}
        </View>
      </ScrollView>

      {/* 新建标签弹窗 */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>新建标签</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <FontAwesome6 name="xmark" size={24} color="#2D3436" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={{ marginBottom: 16 }}>
                <Text style={styles.inputLabel}>标签名称</Text>
                <TextInput
                  style={styles.input}
                  placeholder="请输入标签名称"
                  placeholderTextColor="#B2BEC3"
                  value={newTagName}
                  onChangeText={setNewTagName}
                />
              </View>

              <View style={{ marginBottom: 16 }}>
                <Text style={styles.inputLabel}>标签颜色</Text>
                <View style={styles.colorPicker}>
                  {['#1E88E5', '#00B894', '#FDCB6E', '#FF6B6B', '#6C63FF', '#00CEC9', '#E74C3C', '#95A5A6'].map((color) => (
                    <TouchableOpacity
                      key={color}
                      onPress={() => setNewTagColor(color)}
                      style={[
                        styles.colorOption,
                        { backgroundColor: color },
                        newTagColor === color && styles.colorOptionSelected,
                      ]}
                    >
                      {newTagColor === color && (
                        <FontAwesome6 name="check" size={16} color="#FFFFFF" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={[styles.modalButton, styles.cancelButton]}
              >
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCreateTag}
                style={[styles.modalButton, styles.confirmButton]}
              >
                <Text style={styles.confirmButtonText}>创建</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = {
  durationBadgeLarge: {
    position: 'absolute' as const,
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  durationTextLarge: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: 'bold' as const,
  },
  fileName: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#2D3436',
    marginBottom: 8,
  },
  fileMetaLarge: {
    fontSize: 14,
    color: '#636E72',
  },
  actionButton: {
    alignItems: 'center' as const,
  },
  actionButtonText: {
    fontSize: 12,
    color: '#636E72',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#2D3436',
    marginBottom: 16,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#636E72',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#636E72',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#2D3436',
  },
  tagsContainer: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
  },
  tagItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  tagItemText: {
    fontSize: 12,
    fontWeight: '600' as const,
    marginRight: 6,
  },
  removeTagButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  addTagButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
  },
  addTagButtonText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '600' as const,
  },
  emptyText: {
    fontSize: 14,
    color: '#B2BEC3',
    textAlign: 'center' as const,
    paddingVertical: 20,
  },
  limitText: {
    fontSize: 12,
    color: '#FF6B6B',
    marginTop: 16,
    textAlign: 'center' as const,
  },
  addButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#1E88E5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600' as const,
    marginLeft: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end' as const,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#DFE6E9',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#2D3436',
  },
  modalBody: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    maxHeight: 400,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#636E72',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#2D3436',
  },
  colorPicker: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 12,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: '#2D3436',
  },
  modalFooter: {
    flexDirection: 'row' as const,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#DFE6E9',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center' as const,
  },
  cancelButton: {
    backgroundColor: '#F5F7FA',
    marginRight: 12,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#636E72',
  },
  confirmButton: {
    backgroundColor: '#1E88E5',
    marginLeft: 12,
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
};
