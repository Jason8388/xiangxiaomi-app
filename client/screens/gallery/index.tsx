import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, TextInput, Modal, Platform } from 'react-native';
import { Screen } from '@/components/Screen';
import { PageHeader } from '@/components/PageHeader';
import { FontAwesome6 } from '@expo/vector-icons';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import * as SecureStore from 'expo-secure-store';
import * as ImagePicker from 'expo-image-picker';

export default function GalleryScreen() {
  const [mediaList, setMediaList] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [uploaders, setUploaders] = useState<any[]>([]);
  const [searchText, setSearchText] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedUploader, setSelectedUploader] = useState<string | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<number[]>([]);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useSafeRouter();

  useEffect(() => {
    loadUserInfo();
    fetchMedia();
    fetchTags();
    fetchUploaders();
  }, []);

  const loadUserInfo = async () => {
    try {
      const userStr = await SecureStore.getItemAsync('user');
      if (userStr) {
        setUser(JSON.parse(userStr));
      }
    } catch (error) {
      console.error('Load user error:', error);
    }
  };

  const fetchMedia = async (tagId?: string, uploaderId?: string) => {
    setLoading(true);
    try {
      let url = `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/media`;
      const params = new URLSearchParams();
      if (searchText) params.append('search', searchText);
      if (tagId) params.append('tag_id', tagId);
      if (uploaderId) params.append('uploader_id', uploaderId);
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      if (params.toString()) url += `?${params.toString()}`;

      const response = await fetch(url);
      const data = await response.json();

      if (Array.isArray(data.media)) {
        setMediaList(data.media);
      }
    } catch (error) {
      console.error('Fetch media error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/media/tags/list`);
      const data = await response.json();
      if (Array.isArray(data)) {
        setTags(data);
      }
    } catch (error) {
      console.error('Fetch tags error:', error);
    }
  };

  const fetchUploaders = async () => {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/media/uploaders/list`);
      const data = await response.json();
      if (Array.isArray(data)) {
        setUploaders(data);
      }
    } catch (error) {
      console.error('Fetch uploaders error:', error);
    }
  };

  const handleSearch = () => {
    fetchMedia(selectedTag || undefined, selectedUploader || undefined);
  };

  const handleFilterApply = () => {
    fetchMedia(selectedTag || undefined, selectedUploader || undefined);
    setFilterModalVisible(false);
  };

  const handleResetFilter = () => {
    setSearchText('');
    setSelectedTag(null);
    setSelectedUploader(null);
    setStartDate('');
    setEndDate('');
    fetchMedia();
    setFilterModalVisible(false);
  };

  const handleSelectMedia = (mediaId: number) => {
    if (selectedMedia.includes(mediaId)) {
      setSelectedMedia(selectedMedia.filter(id => id !== mediaId));
    } else {
      setSelectedMedia([...selectedMedia, mediaId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedMedia.length === mediaList.length) {
      setSelectedMedia([]);
    } else {
      setSelectedMedia(mediaList.map(m => m.id));
    }
  };

  const handlePickMedia = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsEditing: false,
      quality: 0.8,
    });

    if (result.canceled) {
      return;
    }

    if (!result.assets || result.assets.length === 0) {
      return;
    }

    const asset = result.assets[0];
    const formData = new FormData();
    formData.append('file', {
      uri: asset.uri,
      name: asset.fileName || 'media',
      type: asset.mimeType || 'image/jpeg',
    } as any);
    formData.append('uploader_id', user?.id || '1');

    if (asset.width) formData.append('width', asset.width.toString());
    if (asset.height) formData.append('height', asset.height.toString());
    if (asset.duration) formData.append('duration', asset.duration.toString());

    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/media/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '上传失败');
      }

      Alert.alert('成功', '媒体上传成功');
      fetchMedia(selectedTag || undefined, selectedUploader || undefined);
    } catch (error: any) {
      Alert.alert('错误', error.message);
    }
  };

  const handleBatchDelete = async () => {
    if (selectedMedia.length === 0) {
      Alert.alert('提示', '请选择要删除的媒体');
      return;
    }

    if (user?.role !== 'admin') {
      Alert.alert('提示', '只有管理员可以批量删除媒体');
      return;
    }

    Alert.alert('确认', `确定要删除${selectedMedia.length}个媒体吗？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/media/batch`, {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ids: selectedMedia,
                user_id: user.id,
              }),
            });

            const data = await response.json();

            if (!response.ok) {
              throw new Error(data.error || '删除失败');
            }

            Alert.alert('成功', data.message);
            setSelectedMedia([]);
            setIsSelectMode(false);
            fetchMedia(selectedTag || undefined, selectedUploader || undefined);
          } catch (error: any) {
            Alert.alert('错误', error.message);
          }
        },
      },
    ]);
  };

  const handleMediaDetail = (media: any) => {
    router.push('/media-detail', { id: media.id });
  };

  const handleDownload = async (media: any) => {
    try {
      await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/media/download/${media.id}`, {
        method: 'POST',
      });

      Alert.alert('提示', '下载记录已更新');
      fetchMedia(selectedTag || undefined, selectedUploader || undefined);
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

  const formatDuration = (seconds: number) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Screen>
      <PageHeader
        title="相册"
        rightAction={
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {isSelectMode && (
              <TouchableOpacity onPress={handleBatchDelete} style={styles.iconButton}>
                <FontAwesome6 name="trash" size={20} color="#FF6B6B" />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => setIsSelectMode(!isSelectMode)} style={styles.iconButton}>
              <FontAwesome6 name={isSelectMode ? 'check' : 'check-double'} size={20} color="#1E88E5" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handlePickMedia} style={styles.iconButton}>
              <FontAwesome6 name="camera" size={20} color="#00B894" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setFilterModalVisible(true)} style={styles.iconButton}>
              <FontAwesome6 name="filter" size={20} color="#6C63FF" />
            </TouchableOpacity>
          </View>
        }
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 24 }}
      >
        {/* 搜索框 */}
        <View style={styles.searchContainer}>
          <FontAwesome6 name="magnifying-glass" size={18} color="#B2BEC3" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="搜索媒体名称..."
            placeholderTextColor="#B2BEC3"
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={handleSearch}
          />
          <TouchableOpacity onPress={handleSearch} style={styles.searchButton}>
            <FontAwesome6 name="magnifying-glass" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* 筛选标签显示 */}
        {(selectedTag || selectedUploader || startDate || endDate) && (
          <View style={styles.filterTagsContainer}>
            {selectedTag && (
              <TouchableOpacity
                onPress={() => {
                  setSelectedTag(null);
                  fetchMedia(null, selectedUploader || undefined);
                }}
                style={styles.filterTag}
              >
                <Text style={styles.filterTagText}>
                  标签: {tags.find((t) => t.id === selectedTag)?.name}
                </Text>
                <FontAwesome6 name="xmark" size={12} color="#FFFFFF" />
              </TouchableOpacity>
            )}
            {selectedUploader && (
              <TouchableOpacity
                onPress={() => {
                  setSelectedUploader(null);
                  fetchMedia(selectedTag || undefined, null);
                }}
                style={styles.filterTag}
              >
                <Text style={styles.filterTagText}>
                  上传者: {uploaders.find((u) => u.id === selectedUploader)?.username}
                </Text>
                <FontAwesome6 name="xmark" size={12} color="#FFFFFF" />
              </TouchableOpacity>
            )}
            {startDate && (
              <TouchableOpacity
                onPress={() => {
                  setStartDate('');
                  fetchMedia(selectedTag || undefined, selectedUploader || undefined);
                }}
                style={styles.filterTag}
              >
                <Text style={styles.filterTagText}>起始: {startDate}</Text>
                <FontAwesome6 name="xmark" size={12} color="#FFFFFF" />
              </TouchableOpacity>
            )}
            {endDate && (
              <TouchableOpacity
                onPress={() => {
                  setEndDate('');
                  fetchMedia(selectedTag || undefined, selectedUploader || undefined);
                }}
                style={styles.filterTag}
              >
                <Text style={styles.filterTagText}>截止: {endDate}</Text>
                <FontAwesome6 name="xmark" size={12} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* 选择模式操作 */}
        {isSelectMode && (
          <View style={styles.selectModeContainer}>
            <TouchableOpacity onPress={handleSelectAll} style={styles.selectAllButton}>
              <FontAwesome6
                name={selectedMedia.length === mediaList.length ? 'square-check' : 'square'}
                size={20}
                color="#1E88E5"
              />
              <Text style={styles.selectAllText}>
                {selectedMedia.length === mediaList.length ? '取消全选' : '全选'}
              </Text>
            </TouchableOpacity>
            <Text style={styles.selectedCountText}>已选择 {selectedMedia.length} 个</Text>
          </View>
        )}

        {/* 媒体网格 */}
        {loading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <Text style={{ fontSize: 14, color: '#636E72' }}>加载中...</Text>
          </View>
        ) : mediaList.length === 0 ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <FontAwesome6 name="images" size={48} color="#DFE6E9" />
            <Text style={{ fontSize: 14, color: '#636E72', marginTop: 16 }}>
              暂无媒体
            </Text>
          </View>
        ) : (
          <View style={styles.gridContainer}>
            {mediaList.map((media) => (
              <TouchableOpacity
                key={media.id}
                onPress={() => isSelectMode ? handleSelectMedia(media.id) : handleMediaDetail(media)}
                style={styles.mediaCard}
                activeOpacity={0.7}
              >
                {/* 选择框 */}
                {isSelectMode && (
                  <TouchableOpacity
                    onPress={() => handleSelectMedia(media.id)}
                    style={styles.selectCheckbox}
                  >
                    <FontAwesome6
                      name={selectedMedia.includes(media.id) ? 'square-check' : 'square'}
                      size={24}
                      color={selectedMedia.includes(media.id) ? '#1E88E5' : '#FFFFFF'}
                    />
                  </TouchableOpacity>
                )}

                {/* 媒体预览 */}
                <View style={styles.mediaPreview}>
                  {media.media_type === 'video' ? (
                    <>
                      <FontAwesome6 name="play-circle" size={40} color="#FFFFFF" />
                      {media.duration && (
                        <View style={styles.durationBadge}>
                          <Text style={styles.durationText}>{formatDuration(media.duration)}</Text>
                        </View>
                      )}
                    </>
                  ) : (
                    <FontAwesome6 name="image" size={40} color="#FFFFFF" />
                  )}
                </View>

                {/* 媒体信息 */}
                <View style={styles.mediaInfo}>
                  <Text style={styles.mediaName} numberOfLines={1}>
                    {media.original_name}
                  </Text>
                  <Text style={styles.mediaMeta}>
                    {formatFileSize(media.file_size)} · {formatDate(media.upload_time)}
                  </Text>
                  {media.tags && media.tags.length > 0 && (
                    <View style={styles.mediaTags}>
                      {media.tags.slice(0, 2).map((tag: any) => (
                        <View
                          key={tag.id}
                          style={[styles.mediaTag, { backgroundColor: tag.color }]}
                        >
                          <Text style={styles.mediaTagText}>{tag.name}</Text>
                        </View>
                      ))}
                      {media.tags.length > 2 && (
                        <Text style={styles.moreTagsText}>+{media.tags.length - 2}</Text>
                      )}
                    </View>
                  )}
                </View>

                {/* 下载按钮 */}
                {!isSelectMode && (
                  <TouchableOpacity
                    onPress={() => handleDownload(media)}
                    style={styles.downloadButton}
                  >
                    <FontAwesome6 name="download" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* 筛选弹窗 */}
      <Modal visible={filterModalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>筛选条件</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <FontAwesome6 name="xmark" size={24} color="#2D3436" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={{ marginBottom: 16 }}>
                <Text style={styles.inputLabel}>上传者</Text>
                <View style={styles.chipsContainer}>
                  <TouchableOpacity
                    onPress={() => setSelectedUploader(null)}
                    style={[
                      styles.chip,
                      !selectedUploader && styles.chipActive,
                    ]}
                  >
                    <Text style={[styles.chipText, !selectedUploader && styles.chipTextActive]}>
                      全部
                    </Text>
                  </TouchableOpacity>
                  {uploaders.map((uploader) => (
                    <TouchableOpacity
                      key={uploader.id}
                      onPress={() => setSelectedUploader(uploader.id.toString())}
                      style={[
                        styles.chip,
                        selectedUploader === uploader.id.toString() && styles.chipActive,
                      ]}
                    >
                      <Text style={[styles.chipText, selectedUploader === uploader.id.toString() && styles.chipTextActive]}>
                        {uploader.username} ({uploader.media_count})
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={{ marginBottom: 16 }}>
                <Text style={styles.inputLabel}>标签</Text>
                <View style={styles.chipsContainer}>
                  <TouchableOpacity
                    onPress={() => setSelectedTag(null)}
                    style={[
                      styles.chip,
                      !selectedTag && styles.chipActive,
                    ]}
                  >
                    <Text style={[styles.chipText, !selectedTag && styles.chipTextActive]}>
                      全部
                    </Text>
                  </TouchableOpacity>
                  {tags.map((tag) => (
                    <TouchableOpacity
                      key={tag.id}
                      onPress={() => setSelectedTag(tag.id)}
                      style={[
                        styles.chip,
                        selectedTag === tag.id && styles.chipActive,
                        { borderColor: tag.color },
                      ]}
                    >
                      <Text style={[styles.chipText, selectedTag === tag.id && styles.chipTextActive]}>
                        {tag.name} ({tag.count})
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={{ marginBottom: 16 }}>
                <Text style={styles.inputLabel}>上传时间范围</Text>
                <TextInput
                  style={styles.input}
                  placeholder="起始日期 (YYYY-MM-DD)"
                  placeholderTextColor="#B2BEC3"
                  value={startDate}
                  onChangeText={setStartDate}
                />
                <TextInput
                  style={[styles.input, { marginTop: 12 }]}
                  placeholder="截止日期 (YYYY-MM-DD)"
                  placeholderTextColor="#B2BEC3"
                  value={endDate}
                  onChangeText={setEndDate}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                onPress={handleResetFilter}
                style={[styles.modalButton, styles.cancelButton]}
              >
                <Text style={styles.cancelButtonText}>重置</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleFilterApply}
                style={[styles.modalButton, styles.confirmButton]}
              >
                <Text style={styles.confirmButtonText}>应用</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = {
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: '#F5F7FA',
  },
  searchContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#2D3436',
  },
  searchButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E88E5',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  filterTagsContainer: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
    marginBottom: 16,
  },
  filterTag: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#1E88E5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  filterTagText: {
    fontSize: 12,
    color: '#FFFFFF',
    marginRight: 6,
  },
  selectModeContainer: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    backgroundColor: 'rgba(30, 136, 229, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  selectAllButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  selectAllText: {
    fontSize: 14,
    color: '#1E88E5',
    marginLeft: 8,
    fontWeight: '600' as const,
  },
  selectedCountText: {
    fontSize: 14,
    color: '#636E72',
  },
  gridContainer: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 12,
  },
  mediaCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  selectCheckbox: {
    position: 'absolute' as const,
    top: 8,
    left: 8,
    zIndex: 1,
  },
  mediaPreview: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: 'rgba(30, 136, 229, 0.1)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  durationBadge: {
    position: 'absolute' as const,
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  durationText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600' as const,
  },
  mediaInfo: {
    padding: 12,
  },
  mediaName: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#2D3436',
    marginBottom: 4,
  },
  mediaMeta: {
    fontSize: 10,
    color: '#B2BEC3',
    marginBottom: 8,
  },
  mediaTags: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 4,
  },
  mediaTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  mediaTagText: {
    fontSize: 8,
    color: '#FFFFFF',
  },
  moreTagsText: {
    fontSize: 8,
    color: '#B2BEC3',
  },
  downloadButton: {
    position: 'absolute' as const,
    bottom: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1E88E5',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
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
    maxHeight: '80%',
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
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#636E72',
    marginBottom: 8,
  },
  chipsContainer: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DFE6E9',
    backgroundColor: '#FFFFFF',
  },
  chipActive: {
    backgroundColor: '#1E88E5',
    borderColor: '#1E88E5',
  },
  chipText: {
    fontSize: 12,
    color: '#636E72',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  input: {
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#2D3436',
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
