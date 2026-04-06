import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { Screen } from '@/components/Screen';
import { PageHeader } from '@/components/PageHeader';
import { FontAwesome6 } from '@expo/vector-icons';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import * as SecureStore from 'expo-secure-store';
import * as DocumentPicker from 'expo-document-picker';

export default function FilesScreen() {
  const [files, setFiles] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [searchText, setSearchText] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<number[]>([]);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useSafeRouter();

  useEffect(() => {
    loadUserInfo();
    fetchFiles();
    fetchTags();
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

  const fetchFiles = async (tagId?: string) => {
    setLoading(true);
    try {
      let url = `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/files`;
      const params = new URLSearchParams();
      if (searchText) params.append('search', searchText);
      if (tagId) params.append('tag_id', tagId);
      if (params.toString()) url += `?${params.toString()}`;

      const response = await fetch(url);
      const data = await response.json();

      if (Array.isArray(data.files)) {
        setFiles(data.files);
      }
    } catch (error) {
      console.error('Fetch files error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/files/tags/list`);
      const data = await response.json();
      if (Array.isArray(data)) {
        setTags(data);
      }
    } catch (error) {
      console.error('Fetch tags error:', error);
    }
  };

  const handleSearch = () => {
    fetchFiles(selectedTag || undefined);
  };

  const handleTagFilter = (tagId: string) => {
    if (selectedTag === tagId) {
      setSelectedTag(null);
      fetchFiles();
    } else {
      setSelectedTag(tagId);
      fetchFiles(tagId);
    }
  };

  const handleSelectFile = (fileId: number) => {
    if (selectedFiles.includes(fileId)) {
      setSelectedFiles(selectedFiles.filter(id => id !== fileId));
    } else {
      setSelectedFiles([...selectedFiles, fileId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedFiles.length === files.length) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(files.map(f => f.id));
    }
  };

  const handleUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-powerpoint',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/pdf',
        ],
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const file = result.assets[0];
      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        name: file.name,
        type: file.mimeType || 'application/octet-stream',
      } as any);
      formData.append('uploader_id', user?.id || '1');

      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/files/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '上传失败');
      }

      Alert.alert('成功', '文件上传成功');
      fetchFiles(selectedTag || undefined);
    } catch (error: any) {
      Alert.alert('错误', error.message);
    }
  };

  const handleBatchDelete = async () => {
    if (selectedFiles.length === 0) {
      Alert.alert('提示', '请选择要删除的文件');
      return;
    }

    if (user?.role !== 'admin') {
      Alert.alert('提示', '只有管理员可以批量删除文件');
      return;
    }

    Alert.alert('确认', `确定要删除${selectedFiles.length}个文件吗？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/files/batch`, {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ids: selectedFiles,
                user_id: user.id,
              }),
            });

            const data = await response.json();

            if (!response.ok) {
              throw new Error(data.error || '删除失败');
            }

            Alert.alert('成功', data.message);
            setSelectedFiles([]);
            setIsSelectMode(false);
            fetchFiles(selectedTag || undefined);
          } catch (error: any) {
            Alert.alert('错误', error.message);
          }
        },
      },
    ]);
  };

  const handleFileDetail = (file: any) => {
    router.push('/file-detail', { id: file.id });
  };

  const handleDownload = async (file: any) => {
    try {
      await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/files/download/${file.id}`, {
        method: 'POST',
      });

      Alert.alert('提示', '下载记录已更新');
      fetchFiles(selectedTag || undefined);
    } catch (error) {
      Alert.alert('错误', '下载失败');
    }
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'excel':
        return 'file-excel';
      case 'ppt':
        return 'file-powerpoint';
      case 'word':
        return 'file-word';
      case 'pdf':
        return 'file-pdf';
      default:
        return 'file';
    }
  };

  const getFileColor = (fileType: string) => {
    switch (fileType) {
      case 'excel':
        return '#00B894';
      case 'ppt':
        return '#FDCB6E';
      case 'word':
        return '#1E88E5';
      case 'pdf':
        return '#FF6B6B';
      default:
        return '#B2BEC3';
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
        title="文件库"
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
            <TouchableOpacity onPress={handleUpload} style={styles.iconButton}>
              <FontAwesome6 name="cloud-arrow-up" size={20} color="#00B894" />
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
            placeholder="搜索文件名..."
            placeholderTextColor="#B2BEC3"
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={handleSearch}
          />
          <TouchableOpacity onPress={handleSearch} style={styles.searchButton}>
            <FontAwesome6 name="magnifying-glass" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* 标签筛选 */}
        <View style={{ marginBottom: 24 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              onPress={() => handleTagFilter('')}
              style={[styles.tagChip, !selectedTag && styles.tagChipActive]}
            >
              <Text style={[styles.tagChipText, !selectedTag && styles.tagChipTextActive]}>
                全部
              </Text>
            </TouchableOpacity>
            {tags.map((tag) => (
              <TouchableOpacity
                key={tag.id}
                onPress={() => handleTagFilter(tag.id)}
                style={[
                  styles.tagChip,
                  selectedTag === tag.id && styles.tagChipActive,
                  { borderColor: tag.color },
                ]}
              >
                <Text
                  style={[
                    styles.tagChipText,
                    selectedTag === tag.id && styles.tagChipTextActive,
                  ]}
                >
                  {tag.name} ({tag.count})
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* 选择模式操作 */}
        {isSelectMode && (
          <View style={styles.selectModeContainer}>
            <TouchableOpacity onPress={handleSelectAll} style={styles.selectAllButton}>
              <FontAwesome6
                name={selectedFiles.length === files.length ? 'square-check' : 'square'}
                size={20}
                color="#1E88E5"
              />
              <Text style={styles.selectAllText}>
                {selectedFiles.length === files.length ? '取消全选' : '全选'}
              </Text>
            </TouchableOpacity>
            <Text style={styles.selectedCountText}>已选择 {selectedFiles.length} 个文件</Text>
          </View>
        )}

        {/* 文件列表 */}
        {loading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <Text style={{ fontSize: 14, color: '#636E72' }}>加载中...</Text>
          </View>
        ) : files.length === 0 ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <FontAwesome6 name="folder-open" size={48} color="#DFE6E9" />
            <Text style={{ fontSize: 14, color: '#636E72', marginTop: 16 }}>
              暂无文件
            </Text>
          </View>
        ) : (
          files.map((file) => (
            <TouchableOpacity
              key={file.id}
              onPress={() => isSelectMode ? handleSelectFile(file.id) : handleFileDetail(file)}
              style={styles.fileCard}
              activeOpacity={0.7}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                {/* 选择框 */}
                {isSelectMode && (
                  <TouchableOpacity
                    onPress={() => handleSelectFile(file.id)}
                    style={{ marginRight: 12 }}
                  >
                    <FontAwesome6
                      name={selectedFiles.includes(file.id) ? 'square-check' : 'square'}
                      size={24}
                      color={selectedFiles.includes(file.id) ? '#1E88E5' : '#B2BEC3'}
                    />
                  </TouchableOpacity>
                )}

                {/* 文件图标 */}
                <View
                  style={[
                    styles.fileIcon,
                    { backgroundColor: `${getFileColor(file.file_type)}20` },
                  ]}
                >
                  <FontAwesome6
                    name={getFileIcon(file.file_type) as any}
                    size={32}
                    color={getFileColor(file.file_type)}
                  />
                </View>

                {/* 文件信息 */}
                <View style={{ flex: 1, marginLeft: 16 }}>
                  <Text style={styles.fileName} numberOfLines={1}>
                    {file.original_name}
                  </Text>
                  <Text style={styles.fileMeta}>
                    {formatFileSize(file.file_size)} · {formatDate(file.upload_time)}
                  </Text>
                  {file.tags && file.tags.length > 0 && (
                    <View style={styles.fileTags}>
                      {file.tags.slice(0, 3).map((tag: any) => (
                        <View
                          key={tag.id}
                          style={[styles.fileTag, { borderColor: tag.color }]}
                        >
                          <Text style={[styles.fileTagText, { color: tag.color }]}>
                            {tag.name}
                          </Text>
                        </View>
                      ))}
                      {file.tags.length > 3 && (
                        <Text style={styles.moreTagsText}>+{file.tags.length - 3}</Text>
                      )}
                    </View>
                  )}
                </View>
              </View>

              {/* 下载按钮 */}
              {!isSelectMode && (
                <TouchableOpacity
                  onPress={() => handleDownload(file)}
                  style={styles.downloadButton}
                >
                  <FontAwesome6 name="download" size={20} color="#1E88E5" />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
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
  tagChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DFE6E9',
    backgroundColor: '#FFFFFF',
    marginRight: 8,
  },
  tagChipActive: {
    backgroundColor: '#1E88E5',
    borderColor: '#1E88E5',
  },
  tagChipText: {
    fontSize: 12,
    color: '#636E72',
  },
  tagChipTextActive: {
    color: '#FFFFFF',
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
  fileCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  fileIcon: {
    width: 64,
    height: 64,
    borderRadius: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#2D3436',
    marginBottom: 4,
  },
  fileMeta: {
    fontSize: 12,
    color: '#B2BEC3',
    marginBottom: 8,
  },
  fileTags: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 6,
  },
  fileTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  fileTagText: {
    fontSize: 10,
  },
  moreTagsText: {
    fontSize: 10,
    color: '#B2BEC3',
  },
  downloadButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: 'rgba(30, 136, 229, 0.1)',
    marginLeft: 12,
  },
};
