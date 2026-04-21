import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  FlatList,
  StyleSheet,
  ListRenderItem,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Screen } from '@/components/Screen';
import { PageHeader } from '@/components/PageHeader';
import { FontAwesome6 } from '@expo/vector-icons';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import * as DocumentPicker from 'expo-document-picker';
import { getSecureItem } from '@/utils/storage';
import { getApiBaseUrl } from '@/utils/api';
import { createFormDataFile } from '@/utils';

// 预计算的文件类型配置（避免每次渲染时计算）
const FILE_TYPE_CONFIG = {
  excel: { icon: 'file-excel', color: '#00B894' },
  xlsx: { icon: 'file-excel', color: '#00B894' },
  xls: { icon: 'file-excel', color: '#00B894' },
  ppt: { icon: 'file-powerpoint', color: '#FDCB6E' },
  pptx: { icon: 'file-powerpoint', color: '#FDCB6E' },
  word: { icon: 'file-word', color: '#1E88E5' },
  docx: { icon: 'file-word', color: '#1E88E5' },
  doc: { icon: 'file-word', color: '#1E88E5' },
  pdf: { icon: 'file-pdf', color: '#FF6B6B' },
};

interface FileTag {
  id: number;
  name: string;
  color: string;
  count?: number;
}

interface FileItem {
  id: number;
  original_name: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_url: string;
  upload_time: string;
  download_count: number;
  uploader_name?: string;
  tags: FileTag[];
}

// 文件图标颜色配置缓存
const getFileConfig = (fileType: string) => {
  const normalizedType = fileType?.replace('.', '').toLowerCase();
  return FILE_TYPE_CONFIG[normalizedType as keyof typeof FILE_TYPE_CONFIG] || { icon: 'file', color: '#B2BEC3' };
};

// 格式化文件大小（带缓存）
const formatFileSizeCache: Record<number, string> = {};
const formatFileSize = (bytes: number): string => {
  if (formatFileSizeCache[bytes]) return formatFileSizeCache[bytes];
  let result: string;
  if (bytes < 1024) result = bytes + ' B';
  else if (bytes < 1024 * 1024) result = (bytes / 1024).toFixed(1) + ' KB';
  else result = (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  formatFileSizeCache[bytes] = result;
  return result;
};

// 格式化日期（带缓存）
const formatDateCache: Record<string, string> = {};
const formatDate = (dateStr: string): string => {
  if (!dateStr) return '';
  if (formatDateCache[dateStr]) return formatDateCache[dateStr];
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const result = `${year}-${month}-${day}`;
  formatDateCache[dateStr] = result;
  return result;
};

// 文件卡片组件（使用 React.memo 避免不必要的重渲染）
interface FileCardProps {
  file: FileItem;
  isSelectMode: boolean;
  selectedFiles: number[];
  onPress: (file: FileItem) => void;
  onSelect: (fileId: number) => void;
  onEditTags: (file: FileItem) => void;
  onDownload: (file: FileItem) => void;
}

const FileCard = React.memo<FileCardProps>(({ file, isSelectMode, selectedFiles, onPress, onSelect, onEditTags, onDownload }) => {
  const fileConfig = getFileConfig(file.file_type);
  const fileSize = formatFileSize(file.file_size);
  const fileDate = formatDate(file.upload_time);
  const isSelected = selectedFiles.includes(file.id);

  return (
    <TouchableOpacity
      onPress={() => isSelectMode ? onSelect(file.id) : onPress(file)}
      style={styles.fileCard}
      activeOpacity={0.7}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        {/* 选择框 */}
        {isSelectMode && (
          <TouchableOpacity
            onPress={() => onSelect(file.id)}
            style={{ marginRight: 12 }}
          >
            <FontAwesome6
              name={isSelected ? 'square-check' : 'square'}
              size={24}
              color={isSelected ? '#1E88E5' : '#B2BEC3'}
            />
          </TouchableOpacity>
        )}

        {/* 文件图标 */}
        <View style={[styles.fileIcon, { backgroundColor: `${fileConfig.color}20` }]}>
          <FontAwesome6 name={fileConfig.icon as any} size={32} color={fileConfig.color} />
        </View>

        {/* 文件信息 */}
        <View style={{ flex: 1, marginLeft: 16 }}>
          <Text style={styles.fileName} numberOfLines={1}>
            {file.original_name}
          </Text>
          <Text style={styles.fileMeta}>
            {fileSize} · {fileDate}
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

      {/* 下载和标签编辑按钮 */}
      {!isSelectMode && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity onPress={() => onEditTags(file)} style={styles.tagEditButton}>
            <FontAwesome6 name="tags" size={18} color="#9B59B6" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onDownload(file)} style={styles.downloadButton}>
            <FontAwesome6 name="download" size={20} color="#1E88E5" />
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
});

export default function FilesScreen() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [tags, setTags] = useState<FileTag[]>([]);
  const [searchText, setSearchText] = useState('');
  const [selectedTag, setSelectedTag] = useState<number | null>(null);
  const [selectedFileType, setSelectedFileType] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<number[]>([]);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [tagModalVisible, setTagModalVisible] = useState(false);
  const [editingFile, setEditingFile] = useState<FileItem | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [fileTypeModalVisible, setFileTypeModalVisible] = useState(false);
  const router = useSafeRouter();

  // 初始加载
  useEffect(() => {
    loadUserInfo();
    fetchFilesList();
    fetchTagsList();
  }, []);

  // 页面返回时刷新数据
  useFocusEffect(
    useCallback(() => {
      fetchFilesList();
      fetchTagsList();
    }, [])
  );

  // 加载用户信息
  const loadUserInfo = async () => {
    try {
      const userStr = await getSecureItem('user');
      if (userStr) {
        setUser(JSON.parse(userStr));
      }
    } catch (error) {
      console.error('Load user error:', error);
    }
  };

  // 获取文件列表
  const fetchFilesList = async (): Promise<FileItem[]> => {
    try {
      setLoading(true);
      const response = await fetch(`${getApiBaseUrl()}/api/v1/files`);
      const data = await response.json();
      const fileList = Array.isArray(data.files) ? data.files : Array.isArray(data) ? data : [];
      setFiles(fileList);
      return fileList;
    } catch (error) {
      console.error('Fetch files error:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // 获取标签列表
  const fetchTagsList = async (): Promise<FileTag[]> => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/v1/files/tags/list`);
      const data = await response.json();
      const tagList = Array.isArray(data) ? data.map((name: string, index: number) => ({
        id: index + 1,
        name,
        color: ['#1E88E5', '#00B894', '#F39C12', '#9B59B6', '#E74C3C', '#2ECC71', '#3498DB', '#E91E63'][index % 8],
      })) : [];
      setTags(tagList);
      return tagList;
    } catch (error) {
      console.error('Fetch tags error:', error);
      return [];
    }
  };

  // 使用 useMemo 缓存筛选后的文件类型选项（必须在 fetchFiles 之前定义）
  const fileTypeOptions = useMemo(() => [
    { type: 'excel', label: 'Excel', icon: 'file-excel', color: '#00B894', extensions: ['xlsx', 'xls'] },
    { type: 'ppt', label: 'PPT', icon: 'file-powerpoint', color: '#FDCB6E', extensions: ['pptx', 'ppt'] },
    { type: 'word', label: 'Word', icon: 'file-word', color: '#1E88E5', extensions: ['docx', 'doc'] },
    { type: 'pdf', label: 'PDF', icon: 'file-pdf', color: '#FF6B6B', extensions: ['pdf'] },
  ], []);

  // 筛选文件（带 useCallback 稳定引用）
  const fetchFiles = useCallback(async (tagId?: number, fileType?: string) => {
    setLoading(true);
    try {
      let url = `${getApiBaseUrl()}/api/v1/files`;
      const params = new URLSearchParams();
      if (searchText) params.append('search', searchText);
      if (tagId) params.append('tag_id', tagId.toString());
      if (fileType) {
        // 将文件类型映射到实际的文件扩展名（多个扩展名用逗号分隔）
        const option = fileTypeOptions.find(f => f.type === fileType);
        if (option) {
          params.append('file_type', option.extensions.join(','));
        }
      }
      if (params.toString()) url += `?${params.toString()}`;

      const response = await fetch(url);
      const data = await response.json();
      const fileList = Array.isArray(data.files) ? data.files : Array.isArray(data) ? data : [];
      setFiles(fileList);
    } catch (error) {
      console.error('Fetch files error:', error);
    } finally {
      setLoading(false);
    }
  }, [searchText, fileTypeOptions]);

  // 搜索处理
  const handleSearch = useCallback(() => {
    fetchFiles(selectedTag || undefined, selectedFileType || undefined);
  }, [fetchFiles, selectedTag, selectedFileType]);

  // 标签筛选
  const handleTagFilter = useCallback((tagId: number) => {
    if (selectedTag === tagId) {
      setSelectedTag(null);
      fetchFiles();
    } else {
      setSelectedTag(tagId);
      fetchFiles(tagId);
    }
  }, [selectedTag, fetchFiles]);

  // 选择文件
  const handleSelectFile = useCallback((fileId: number) => {
    setSelectedFiles(prev =>
      prev.includes(fileId) ? prev.filter(id => id !== fileId) : [...prev, fileId]
    );
  }, []);

  // 全选
  const handleSelectAll = useCallback(() => {
    setSelectedFiles(prev =>
      prev.length === files.length ? [] : files.map(f => f.id)
    );
  }, [files]);

  // 编辑标签
  const handleEditTags = useCallback((file: FileItem) => {
    setEditingFile(file);
    setSelectedTagIds(file.tags?.map(t => t.id) || []);
    setNewTagName('');
    setTagModalVisible(true);
  }, []);

  // 切换标签选中
  const toggleTagSelection = useCallback((tagId: number) => {
    setSelectedTagIds(prev => {
      if (prev.includes(tagId)) {
        return prev.filter(id => id !== tagId);
      } else {
        if (prev.length >= 10) {
          Alert.alert('提示', '每个文件最多只能添加10个标签');
          return prev;
        }
        return [...prev, tagId];
      }
    });
  }, []);

  // 创建标签
  const handleCreateTag = useCallback(async () => {
    if (!newTagName.trim()) {
      Alert.alert('提示', '请输入标签名称');
      return;
    }

    try {
      const response = await fetch(`${getApiBaseUrl()}/api/v1/files/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTagName.trim(),
          color: ['#1E88E5', '#00B894', '#F39C12', '#9B59B6', '#E74C3C', '#2ECC71', '#3498DB'][Math.floor(Math.random() * 7)],
        }),
      });

      const data = await response.json();
      if (response.ok) {
        Alert.alert('成功', '标签创建成功');
        fetchTagsList();
        setNewTagName('');
        if (selectedTagIds.length < 10) {
          setSelectedTagIds(prev => [...prev, data.id]);
        }
      } else {
        throw new Error(data.error || '创建失败');
      }
    } catch (error: any) {
      Alert.alert('错误', error.message);
    }
  }, [newTagName, selectedTagIds]);

  // 保存标签
  const handleSaveTags = useCallback(async () => {
    if (!editingFile) return;
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/v1/files/${editingFile.id}/tags`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag_ids: selectedTagIds }),
      });
      const data = await response.json();
      if (response.ok) {
        Alert.alert('成功', '标签更新成功');
        setTagModalVisible(false);
        fetchFiles(selectedTag || undefined, selectedFileType || undefined);
      } else {
        throw new Error(data.error || '更新失败');
      }
    } catch (error: any) {
      Alert.alert('错误', error.message);
    }
  }, [editingFile, selectedTagIds, selectedTag, selectedFileType, fetchFiles]);

  // 文件类型筛选
  const handleFileTypeFilter = useCallback((type: string | null) => {
    const tagId = selectedTag ?? undefined;
    if (selectedFileType === type) {
      setSelectedFileType(null);
      fetchFiles(tagId, undefined);
    } else {
      setSelectedFileType(type);
      fetchFiles(tagId, type ?? undefined);
    }
  }, [selectedFileType, selectedTag, fetchFiles]);

  // 上传文件
  const handleUpload = useCallback(async () => {
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

      if (result.canceled || !result.assets || result.assets.length === 0) return;

      const file = result.assets[0];
      if (file.size && file.size > 50 * 1024 * 1024) {
        Alert.alert('提示', `${file.name} 超过50MB限制，无法上传`);
        return;
      }

      const formData = new FormData();
      const fileObj = await createFormDataFile(
        file.uri,
        file.name,
        file.mimeType || 'application/octet-stream'
      );
      formData.append('files', fileObj as any);
      formData.append('uploader_id', user?.id || '1');

      const response = await fetch(`${getApiBaseUrl()}/api/v1/files/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '上传失败');
      Alert.alert('成功', data.message || '文件上传成功');
      fetchFiles(selectedTag || undefined);
    } catch (error: any) {
      Alert.alert('错误', error.message);
    }
  }, [user?.id, selectedTag, fetchFiles]);

  // 批量删除
  const handleBatchDelete = useCallback(async () => {
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
            const response = await fetch(`${getApiBaseUrl()}/api/v1/files/batch`, {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ids: selectedFiles, user_id: user.id }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || '删除失败');
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
  }, [selectedFiles, user?.role, user?.id, selectedTag, fetchFiles]);

  // 查看详情
  const handleFileDetail = useCallback((file: FileItem) => {
    router.push('/file-detail', { id: file.id });
  }, [router]);

  // 下载
  const handleDownload = useCallback(async (file: FileItem) => {
    try {
      // 显示下载提示
      Alert.alert('提示', '开始下载文件...');

      // 下载文件到本地
      const downloadUrl = `${getApiBaseUrl()}/api/v1/files/download/${file.id}`;
      const fileUri = `${FileSystem.documentDirectory}${file.original_name}`;

      const downloadResult = await FileSystem.downloadAsync(downloadUrl, fileUri);

      if (downloadResult.status === 200) {
        // 更新下载记录
        try {
          await fetch(`${getApiBaseUrl()}/api/v1/files/download/${file.id}`, { method: 'POST' });
        } catch (error) {
          console.error('Update download count error:', error);
        }

        // 保存文件到设备
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'application/octet-stream',
            dialogTitle: `保存文件: ${file.original_name}`,
          });
        } else {
          Alert.alert('成功', '文件已下载到本地');
        }

        // 刷新文件列表
        fetchFiles();
      } else {
        Alert.alert('错误', '下载失败，请重试');
      }
    } catch (error: any) {
      console.error('Download error:', error);
      Alert.alert('错误', error.message || '下载失败');
    }
  }, []);

  // 渲染文件卡片
  const renderFileItem: ListRenderItem<FileItem> = useCallback(({ item }) => (
    <FileCard
      file={item}
      isSelectMode={isSelectMode}
      selectedFiles={selectedFiles}
      onPress={handleFileDetail}
      onSelect={handleSelectFile}
      onEditTags={handleEditTags}
      onDownload={handleDownload}
    />
  ), [isSelectMode, selectedFiles, handleFileDetail, handleSelectFile, handleEditTags, handleDownload]);

  // 空列表组件
  const renderEmptyComponent = useCallback(() => (
    <View style={{ paddingVertical: 40, alignItems: 'center' }}>
      <FontAwesome6 name="folder-open" size={48} color="#DFE6E9" />
      <Text style={{ fontSize: 14, color: '#636E72', marginTop: 16 }}>
        暂无文件
      </Text>
    </View>
  ), []);

  // 加载组件
  const renderLoadingComponent = useCallback(() => (
    <View style={{ paddingVertical: 40, alignItems: 'center' }}>
      <Text style={{ fontSize: 14, color: '#636E72' }}>加载中...</Text>
    </View>
  ), []);

  return (
    <Screen>
      <PageHeader
        title="文件库"
        rightAction={
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {user?.role === 'admin' && isSelectMode && (
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

      <View style={styles.container}>
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

        {/* 文件类型筛选 - 下拉框 */}
        <View style={styles.fileTypeFilter}>
          <TouchableOpacity
            onPress={() => setFileTypeModalVisible(true)}
            style={styles.fileTypeDropdown}
          >
            <FontAwesome6
              name={selectedFileType ? (fileTypeOptions.find(f => f.type === selectedFileType)?.icon || 'file') as any : 'filter'}
              size={16}
              color={selectedFileType ? '#1E88E5' : '#636E72'}
              style={{ marginRight: 8 }}
            />
            <Text style={styles.fileTypeDropdownText}>
              {selectedFileType ? fileTypeOptions.find(f => f.type === selectedFileType)?.label : '文件类型'}
            </Text>
            <FontAwesome6 name="chevron-down" size={14} color="#636E72" />
          </TouchableOpacity>
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

        {/* 文件列表 - 使用 FlatList 实现虚拟化 */}
        <FlatList
          data={files}
          renderItem={renderFileItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={loading ? renderLoadingComponent : renderEmptyComponent}
          showsVerticalScrollIndicator={false}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={10}
        />
      </View>

      {/* 标签编辑弹窗 */}
      <Modal
        visible={tagModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setTagModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                编辑标签 - {editingFile?.original_name}
              </Text>
              <TouchableOpacity onPress={() => setTagModalVisible(false)}>
                <FontAwesome6 name="times" size={20} color="#636E72" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.selectedCountText}>
                已选择 {selectedTagIds.length}/10 个标签
              </Text>

              {/* 标签网格 */}
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
                    {selectedTagIds.includes(tag.id) && (
                      <FontAwesome6 name="check" size={14} color="#FFF" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {/* 创建新标签 */}
              <View style={styles.createTagSection}>
                <Text style={styles.createTagLabel}>创建新标签</Text>
                <View style={styles.createTagRow}>
                  <TextInput
                    style={styles.createTagInput}
                    placeholder="输入标签名称"
                    value={newTagName}
                    onChangeText={setNewTagName}
                    maxLength={20}
                  />
                  <TouchableOpacity style={styles.createTagButton} onPress={handleCreateTag}>
                    <FontAwesome6 name="plus" size={18} color="#FFF" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setTagModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveTags}
              >
                <Text style={styles.saveButtonText}>保存</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 文件类型选择Modal */}
      <Modal visible={fileTypeModalVisible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setFileTypeModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.fileTypeModalContent}>
                <View style={styles.fileTypeModalHeader}>
                  <Text style={styles.fileTypeModalTitle}>选择文件类型</Text>
                  <TouchableOpacity onPress={() => setFileTypeModalVisible(false)}>
                    <FontAwesome6 name="xmark" size={20} color="#636E72" />
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.fileTypeModalBody}>
                  <TouchableOpacity
                    style={styles.fileTypeOption}
                    onPress={() => {
                      setSelectedFileType(null);
                      setFileTypeModalVisible(false);
                      fetchFiles(selectedTag || undefined);
                    }}
                  >
                    <FontAwesome6 name="filter" size={18} color="#636E72" />
                    <Text style={styles.fileTypeOptionText}>全部</Text>
                    {selectedFileType === null && <FontAwesome6 name="check" size={16} color="#1E88E5" />}
                  </TouchableOpacity>
                  {fileTypeOptions.map((item) => (
                    <TouchableOpacity
                      key={item.type}
                      style={styles.fileTypeOption}
                      onPress={() => {
                        setSelectedFileType(item.type);
                        setFileTypeModalVisible(false);
                        fetchFiles(selectedTag || undefined, item.type);
                      }}
                    >
                      <FontAwesome6 name={item.icon as any} size={18} color={item.color} />
                      <Text style={styles.fileTypeOptionText}>{item.label}</Text>
                      {selectedFileType === item.type && <FontAwesome6 name="check" size={16} color="#1E88E5" />}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginHorizontal: 24,
    marginTop: 16,
    height: 48,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  searchButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#1E88E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileTypeFilter: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  fileTypeDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  fileTypeDropdownText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  fileTypeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    gap: 4,
  },
  fileTypeText: {
    fontSize: 12,
    color: '#636E72',
  },
  selectModeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#F0F9FF',
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
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  fileIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
  },
  fileMeta: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  fileTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 6,
  },
  fileTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
  },
  fileTagText: {
    fontSize: 11,
  },
  moreTagsText: {
    fontSize: 11,
    color: '#9CA3AF',
    marginLeft: 4,
  },
  tagEditButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
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
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalBody: {
    padding: 20,
  },
  tagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tagOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  tagOptionText: {
    fontSize: 14,
    color: '#4B5563',
  },
  createTagSection: {
    marginTop: 20,
  },
  createTagLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 10,
  },
  createTagRow: {
    flexDirection: 'row',
    gap: 10,
  },
  createTagInput: {
    flex: 1,
    height: 44,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#1F2937',
  },
  createTagButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#1E88E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  modalButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#1E88E5',
  },
  saveButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  fileTypeModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '60%',
  },
  fileTypeModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  fileTypeModalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
  },
  fileTypeModalBody: {
    paddingVertical: 8,
  },
  fileTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
  },
  fileTypeOptionText: {
    flex: 1,
    fontSize: 15,
    color: '#374151',
  },
});
