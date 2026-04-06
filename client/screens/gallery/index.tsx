import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, TextInput, Modal, Image, StyleSheet } from 'react-native';
import { Screen } from '@/components/Screen';
import { PageHeader } from '@/components/PageHeader';
import { FontAwesome6 } from '@expo/vector-icons';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { storage } from '@/utils/storage';

interface MediaItem {
  id: number;
  original_name: string;
  file_name: string;
  media_type: string;
  file_size: number;
  file_url: string;
  thumbnail_url?: string;
  upload_time: string;
  download_count: number;
  uploader_name?: string;
  tags: Array<{ id: number; name: string; color: string }>;
}

interface Tag {
  id: number;
  name: string;
  color: string;
  count?: number;
}

export default function GalleryScreen() {
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [uploaders, setUploaders] = useState<any[]>([]);
  const [searchText, setSearchText] = useState('');
  const [selectedTag, setSelectedTag] = useState<number | null>(null);
  const [selectedUploader, setSelectedUploader] = useState<string | null>(null);
  const [selectedMediaType, setSelectedMediaType] = useState<string | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<number[]>([]);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [tagModalVisible, setTagModalVisible] = useState(false);
  const [editingMedia, setEditingMedia] = useState<MediaItem | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [newTagName, setNewTagName] = useState('');
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
      const userStr = await storage.getItem('user');
      if (userStr) {
        setUser(JSON.parse(userStr));
      }
    } catch (error) {
      console.error('Load user error:', error);
    }
  };

  const fetchMedia = async (tagId?: number, uploaderId?: string, mediaType?: string) => {
    setLoading(true);
    try {
      let url = `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/media`;
      const params = new URLSearchParams();
      if (searchText) params.append('search', searchText);
      if (tagId) params.append('tag_id', tagId.toString());
      if (uploaderId) params.append('uploader_id', uploaderId);
      if (mediaType) params.append('media_type', mediaType);
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
            fetchMedia(selectedTag || undefined, selectedUploader || undefined, selectedMediaType || undefined);
          } catch (error: any) {
            Alert.alert('错误', error.message);
          }
        },
      },
    ]);
  };

  const handleEditTags = (media: MediaItem) => {
    setEditingMedia(media);
    setSelectedTagIds(media.tags?.map(t => t.id) || []);
    setNewTagName('');
    setTagModalVisible(true);
  };

  const toggleTagSelection = (tagId: number) => {
    if (selectedTagIds.includes(tagId)) {
      setSelectedTagIds(selectedTagIds.filter(id => id !== tagId));
    } else {
      if (selectedTagIds.length >= 5) {
        Alert.alert('提示', '最多只能选择5个标签');
        return;
      }
      setSelectedTagIds([...selectedTagIds, tagId]);
    }
  };

  const handleSaveTags = async () => {
    if (!editingMedia) return;

    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/media/tags/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          media_id: editingMedia.id,
          tag_ids: selectedTagIds,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '保存失败');
      }

      Alert.alert('成功', '标签更新成功');
      setTagModalVisible(false);
      fetchMedia(selectedTag || undefined, selectedUploader || undefined, selectedMediaType || undefined);
    } catch (error: any) {
      Alert.alert('错误', error.message);
    }
  };

  const handleMediaTypeFilter = (type: string | null) => {
    if (selectedMediaType === type) {
      setSelectedMediaType(null);
      fetchMedia(selectedTag || undefined, selectedUploader || undefined, undefined);
    } else {
      setSelectedMediaType(type);
      fetchMedia(selectedTag || undefined, selectedUploader || undefined, type || undefined);
    }
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
            <TouchableOpacity onPress={() => setFilterModalVisible(true)} style={styles.iconButton}>
              <FontAwesome6 name="filter" size={20} color="#6C63FF" />
            </TouchableOpacity>
          </View>
        }
      />

      <ScrollView style={styles.container} contentContainerStyle={styles.containerContent}>
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

        {/* 媒体类型筛选 */}
        <View style={styles.mediaTypeFilter}>
          <TouchableOpacity
            style={[styles.typeButton, !selectedMediaType && styles.typeButtonActive]}
            onPress={() => handleMediaTypeFilter(null)}
          >
            <Text style={[styles.typeButtonText, !selectedMediaType && styles.typeButtonTextActive]}>全部</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeButton, selectedMediaType === 'photo' && styles.typeButtonActive]}
            onPress={() => handleMediaTypeFilter('photo')}
          >
            <FontAwesome6 name="image" size={14} color={selectedMediaType === 'photo' ? '#FFFFFF' : '#636E72'} />
            <Text style={[styles.typeButtonText, selectedMediaType === 'photo' && styles.typeButtonTextActive]}>照片</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeButton, selectedMediaType === 'video' && styles.typeButtonActive]}
            onPress={() => handleMediaTypeFilter('video')}
          >
            <FontAwesome6 name="video" size={14} color={selectedMediaType === 'video' ? '#FFFFFF' : '#636E72'} />
            <Text style={[styles.typeButtonText, selectedMediaType === 'video' && styles.typeButtonTextActive]}>视频</Text>
          </TouchableOpacity>
        </View>

        {/* 已选中的筛选标签 */}
        {(selectedMediaType || selectedTag || selectedUploader || startDate || endDate) && (
          <View style={styles.filterTagsContainer}>
            {selectedMediaType && (
              <TouchableOpacity
                onPress={() => handleMediaTypeFilter(null)}
                style={styles.filterTag}
              >
                <Text style={styles.filterTagText}>
                  {selectedMediaType === 'photo' ? '照片' : '视频'}
                </Text>
                <FontAwesome6 name="xmark" size={12} color="#FFFFFF" />
              </TouchableOpacity>
            )}
            {selectedTag && (
              <TouchableOpacity
                onPress={() => {
                  setSelectedTag(null);
                  fetchMedia(undefined, selectedUploader || undefined, selectedMediaType || undefined);
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
                  fetchMedia(selectedTag || undefined, undefined, selectedMediaType || undefined);
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
                  fetchMedia(selectedTag || undefined, selectedUploader || undefined, selectedMediaType || undefined);
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
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>加载中...</Text>
          </View>
        ) : mediaList.length === 0 ? (
          <View style={styles.emptyContainer}>
            <FontAwesome6 name="images" size={48} color="#DFE6E9" />
            <Text style={styles.emptyText}>暂无媒体</Text>
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
                  <Image
                    source={{ uri: media.thumbnail_url || media.file_url }}
                    style={styles.mediaImage}
                    resizeMode="cover"
                  />
                  {media.media_type === 'video' && (
                    <View style={styles.playOverlay}>
                      <FontAwesome6 name="circle-play" size={32} color="#FFFFFF" />
                    </View>
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

                {/* 下载和标签编辑按钮 */}
                {!isSelectMode && (
                  <View style={styles.mediaActions}>
                    <TouchableOpacity
                      onPress={() => handleEditTags(media)}
                      style={styles.tagEditButton}
                    >
                      <FontAwesome6 name="tags" size={14} color="#FFFFFF" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDownload(media)}
                      style={styles.downloadButton}
                    >
                      <FontAwesome6 name="download" size={14} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
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
              <View style={styles.filterSection}>
                <Text style={styles.inputLabel}>上传者</Text>
                <View style={styles.chipsContainer}>
                  <TouchableOpacity
                    onPress={() => setSelectedUploader(null)}
                    style={[styles.chip, !selectedUploader && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, !selectedUploader && styles.chipTextActive]}>全部</Text>
                  </TouchableOpacity>
                  {uploaders.map((uploader) => (
                    <TouchableOpacity
                      key={uploader.id}
                      onPress={() => setSelectedUploader(uploader.id.toString())}
                      style={[styles.chip, selectedUploader === uploader.id.toString() && styles.chipActive]}
                    >
                      <Text style={[styles.chipText, selectedUploader === uploader.id.toString() && styles.chipTextActive]}>
                        {uploader.username}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.inputLabel}>标签</Text>
                <View style={styles.chipsContainer}>
                  <TouchableOpacity
                    onPress={() => setSelectedTag(null)}
                    style={[styles.chip, !selectedTag && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, !selectedTag && styles.chipTextActive]}>全部</Text>
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
                        {tag.name} ({tag.count || 0})
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.filterSection}>
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

      {/* 标签编辑弹窗 */}
      <Modal visible={tagModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                编辑标签 - {editingMedia?.original_name}
              </Text>
              <TouchableOpacity onPress={() => setTagModalVisible(false)}>
                <FontAwesome6 name="times" size={20} color="#636E72" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.tagCountText}>
                已选择 {selectedTagIds.length}/5 个标签
              </Text>

              {/* 现有标签选择 */}
              <View style={styles.tagGrid}>
                {tags.map((tag) => (
                  <TouchableOpacity
                    key={tag.id}
                    onPress={() => toggleTagSelection(tag.id)}
                    style={[
                      styles.tagOption,
                      selectedTagIds.includes(tag.id) && {
                        backgroundColor: tag.color,
                        borderColor: tag.color,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.tagOptionText,
                        selectedTagIds.includes(tag.id) && { color: '#FFF' },
                      ]}
                    >
                      {tag.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                onPress={() => setTagModalVisible(false)}
                style={[styles.modalButton, styles.cancelButton]}
              >
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveTags}
                style={[styles.modalButton, styles.confirmButton]}
              >
                <Text style={styles.confirmButtonText}>保存</Text>
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
  containerContent: {
    padding: 16,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#2D3436',
  },
  searchButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#6C63FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaTypeFilter: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
  },
  typeButtonActive: {
    backgroundColor: '#6C63FF',
  },
  typeButtonText: {
    fontSize: 13,
    color: '#636E72',
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
  },
  filterTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
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
  selectModeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  selectAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectAllText: {
    fontSize: 14,
    color: '#1E88E5',
  },
  selectedCountText: {
    fontSize: 14,
    color: '#636E72',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  mediaCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  selectCheckbox: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaPreview: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#F0F0F3',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  mediaInfo: {
    padding: 10,
  },
  mediaName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 4,
  },
  mediaMeta: {
    fontSize: 11,
    color: '#636E72',
    marginBottom: 6,
  },
  mediaTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    alignItems: 'center',
  },
  mediaTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  mediaTagText: {
    fontSize: 10,
    color: '#FFFFFF',
  },
  moreTagsText: {
    fontSize: 10,
    color: '#636E72',
  },
  mediaActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  tagEditButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#F39C12',
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#00B894',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    color: '#636E72',
    marginTop: 12,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
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
    maxHeight: '80%' as const,
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
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 10,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F7FA',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  chipActive: {
    backgroundColor: '#6C63FF',
    borderColor: '#6C63FF',
  },
  chipText: {
    fontSize: 13,
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
    fontSize: 15,
    color: '#2D3436',
    borderWidth: 1,
    borderColor: '#E8E8E8',
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
  tagCountText: {
    fontSize: 13,
    color: '#636E72',
    marginBottom: 16,
  },
  tagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tagOption: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F5F7FA',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  tagOptionText: {
    fontSize: 13,
    color: '#2D3436',
  },
});
