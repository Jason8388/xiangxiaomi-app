import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Platform,
  Linking,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useAuth } from '@/contexts/AuthContext';
import { Screen } from '@/components/Screen';
import { PageHeader } from '@/components/PageHeader';
import { getApiBaseUrl } from '@/utils/api';

interface FileItem {
  id: number;
  file_name: string;
  original_name: string;
  file_type: string;
  file_size: number;
  category: string;
  description: string;
  created_at: string;
  uploader_name?: string;
  tags?: string[];
}

const FILE_CATEGORIES = [
  { label: '全部', value: '' },
  { label: '项目文档', value: '项目文档' },
  { label: '会议记录', value: '会议记录' },
  { label: '技术资料', value: '技术资料' },
  { label: '合同文件', value: '合同文件' },
  { label: '其他', value: '其他' },
];

// 支持的文件格式
const ALLOWED_EXTENSIONS = ['doc', 'docx', 'ppt', 'pptx', 'pdf', 'xls', 'xlsx'];

export default function FileLibrary() {
  const { user } = useAuth();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [uploadCategory, setUploadCategory] = useState('未分类');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadTags, setUploadTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [fileDetailModalVisible, setFileDetailModalVisible] = useState(false);

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${getApiBaseUrl()}/api/v1/files`);
      const data = await response.json();
      setFiles(data);
      filterFiles(data, searchKeyword, selectedCategory);
    } catch (error) {
      console.error('Failed to load files:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterFiles = (allFiles: FileItem[], keyword: string, category: string) => {
    let filtered = allFiles;
    if (keyword) {
      filtered = filtered.filter(
        (f) =>
          f.original_name.toLowerCase().includes(keyword.toLowerCase()) ||
          f.description?.toLowerCase().includes(keyword.toLowerCase()) ||
          f.tags?.some((tag) => tag.toLowerCase().includes(keyword.toLowerCase()))
      );
    }
    if (category) {
      filtered = filtered.filter((f) => f.category === category);
    }
    setFilteredFiles(filtered);
  };

  const handleSearch = (text: string) => {
    setSearchKeyword(text);
    filterFiles(files, text, selectedCategory);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    filterFiles(files, searchKeyword, category);
    setCategoryModalVisible(false);
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-powerpoint',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'application/pdf',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const fileExt = asset.name.split('.').pop()?.toLowerCase() || '';
        
        if (!ALLOWED_EXTENSIONS.includes(fileExt)) {
          Alert.alert('格式不支持', '仅支持 Word、PPT、PDF、Excel 格式文件');
          return;
        }

        setSelectedFile({
          uri: asset.uri,
          name: asset.name,
          type: asset.mimeType || 'application/octet-stream',
          size: asset.size || 0,
        });
        setUploadModalVisible(true);
      }
    } catch (error) {
      console.error('Document picker error:', error);
      Alert.alert('错误', '选择文件失败');
    }
  };

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !uploadTags.includes(trimmedTag) && uploadTags.length < 10) {
      setUploadTags([...uploadTags, trimmedTag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setUploadTags(uploadTags.filter((t) => t !== tag));
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      Alert.alert('错误', '请先选择文件');
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('file', {
        uri: selectedFile.uri,
        name: selectedFile.name,
        type: selectedFile.type,
      } as any);
      formData.append('category', uploadCategory);
      formData.append('description', uploadDescription);
      formData.append('tags', JSON.stringify(uploadTags));
      formData.append('uploader_name', user?.name || '未知用户');

      const response = await fetch(`${getApiBaseUrl()}/api/v1/files`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        Alert.alert('成功', '文件上传成功');
        setUploadModalVisible(false);
        setSelectedFile(null);
        setUploadCategory('未分类');
        setUploadDescription('');
        setUploadTags([]);
        loadFiles();
      } else {
        const error = await response.json();
        Alert.alert('错误', error.error || '上传失败');
      }
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('错误', '文件上传失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (file: FileItem) => {
    Alert.alert('确认删除', `确定要删除文件 "${file.original_name}" 吗？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            const response = await fetch(`${getApiBaseUrl()}/api/v1/files/${file.id}`, {
              method: 'DELETE',
            });
            if (response.ok) {
              loadFiles();
            }
          } catch (error) {
            console.error('Delete error:', error);
          }
        },
      },
    ]);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf':
        return 'file-pdf';
      case 'doc':
      case 'docx':
        return 'file-word';
      case 'ppt':
      case 'pptx':
        return 'file-powerpoint';
      case 'xls':
      case 'xlsx':
        return 'file-excel';
      default:
        return 'file';
    }
  };

  const getFileIconColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf':
        return '#E74C3C';
      case 'doc':
      case 'docx':
        return '#3498DB';
      case 'ppt':
      case 'pptx':
        return '#E67E22';
      case 'xls':
      case 'xlsx':
        return '#27AE60';
      default:
        return '#95A5A6';
    }
  };

  const renderFileItem = ({ item }: { item: FileItem }) => (
    <TouchableOpacity
      style={styles.fileItem}
      onPress={() => {
        setSelectedFile(item);
        setFileDetailModalVisible(true);
      }}
    >
      <View style={[styles.fileIcon, { backgroundColor: `${getFileIconColor(item.file_type)}15` }]}>
        <FontAwesome6 name={getFileIcon(item.file_type)} size={28} color={getFileIconColor(item.file_type)} />
      </View>
      <View style={styles.fileInfo}>
        <Text style={styles.fileName} numberOfLines={1}>{item.original_name}</Text>
        <View style={styles.fileMeta}>
          <Text style={styles.fileMetaText}>{formatFileSize(item.file_size)}</Text>
          <Text style={styles.fileMetaDot}>·</Text>
          <Text style={styles.fileMetaText}>{item.category}</Text>
        </View>
        <View style={styles.fileMeta}>
          <FontAwesome6 name="user" size={10} color="#95A5A6" />
          <Text style={styles.fileMetaText}>{item.uploader_name || '未知'}</Text>
          <Text style={styles.fileMetaDot}>·</Text>
          <FontAwesome6 name="clock" size={10} color="#95A5A6" />
          <Text style={styles.fileMetaText}>
            {new Date(item.created_at).toLocaleDateString('zh-CN')}
          </Text>
        </View>
        {item.tags && item.tags.length > 0 && (
          <View style={styles.tagContainer}>
            {item.tags.slice(0, 3).map((tag, index) => (
              <View key={index} style={styles.tagBadge}>
                <Text style={styles.tagBadgeText}>{tag}</Text>
              </View>
            ))}
            {item.tags.length > 3 && (
              <Text style={styles.moreTagsText}>+{item.tags.length - 3}</Text>
            )}
          </View>
        )}
      </View>
      <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item)}>
        <FontAwesome6 name="trash" size={16} color="#E74C3C" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <Screen>
      <PageHeader title="文件库" />

      {/* 搜索栏 */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <FontAwesome6 name="magnifying-glass" size={16} color="#95A5A6" />
          <TextInput
            style={styles.searchInput}
            placeholder="搜索文件名、描述、标签..."
            placeholderTextColor="#B2BEC3"
            value={searchKeyword}
            onChangeText={handleSearch}
          />
          {searchKeyword.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <FontAwesome6 name="xmark" size={14} color="#95A5A6" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 分类选择 */}
      <View style={styles.categoryContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {FILE_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.value}
              style={[
                styles.categoryChip,
                selectedCategory === cat.value && styles.categoryChipActive,
              ]}
              onPress={() => handleCategoryChange(cat.value)}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategory === cat.value && styles.categoryChipTextActive,
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 上传按钮 */}
      <View style={styles.uploadButtonContainer}>
        <TouchableOpacity style={styles.uploadButton} onPress={handlePickDocument}>
          <FontAwesome6 name="cloud-upload-alt" size={20} color="#FFFFFF" />
          <Text style={styles.uploadButtonText}>上传文件</Text>
        </TouchableOpacity>
      </View>

      {/* 文件列表 */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6C63FF" />
        </View>
      ) : filteredFiles.length === 0 ? (
        <View style={styles.emptyContainer}>
          <FontAwesome6 name="folder-open" size={64} color="#D1D5DB" />
          <Text style={styles.emptyText}>暂无文件</Text>
          <Text style={styles.emptySubText}>点击上方按钮上传文件</Text>
        </View>
      ) : (
        <FlatList
          data={filteredFiles}
          renderItem={renderFileItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* 上传弹窗 */}
      <Modal
        visible={uploadModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setUploadModalVisible(false)}
      >
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <TouchableOpacity
            style={styles.modalBackground}
            activeOpacity={1}
            onPress={() => setUploadModalVisible(false)}
          />
          <View style={styles.uploadModal}>
            <View style={styles.uploadModalHeader}>
              <Text style={styles.uploadModalTitle}>上传文件</Text>
              <TouchableOpacity onPress={() => setUploadModalVisible(false)}>
                <FontAwesome6 name="times" size={20} color="#636E72" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.uploadModalContent}>
              {/* 文件信息 */}
              {selectedFile && (
                <View style={styles.selectedFileInfo}>
                  <View style={styles.selectedFileIcon}>
                    <FontAwesome6
                      name={getFileIcon(selectedFile.name.split('.').pop() || '')}
                      size={32}
                      color={getFileIconColor(selectedFile.name.split('.').pop() || '')}
                    />
                  </View>
                  <View style={styles.selectedFileDetails}>
                    <Text style={styles.selectedFileName} numberOfLines={2}>{selectedFile.name}</Text>
                    <Text style={styles.selectedFileSize}>{formatFileSize(selectedFile.size)}</Text>
                  </View>
                </View>
              )}

              {/* 分类选择 */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>文件分类</Text>
                <TouchableOpacity
                  style={styles.categorySelector}
                  onPress={() => setCategoryModalVisible(true)}
                >
                  <Text style={styles.categorySelectorText}>{uploadCategory}</Text>
                  <FontAwesome6 name="chevron-down" size={14} color="#95A5A6" />
                </TouchableOpacity>
              </View>

              {/* 文件描述 */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>文件描述</Text>
                <TextInput
                  style={styles.descriptionInput}
                  placeholder="请输入文件描述（可选）"
                  placeholderTextColor="#B2BEC3"
                  value={uploadDescription}
                  onChangeText={setUploadDescription}
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* 标签 */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>标签（{uploadTags.length}/10）</Text>
                <View style={styles.tagInputRow}>
                  <TextInput
                    style={styles.tagInput}
                    placeholder="输入标签后点击添加"
                    placeholderTextColor="#B2BEC3"
                    value={tagInput}
                    onChangeText={setTagInput}
                    onSubmitEditing={handleAddTag}
                  />
                  <TouchableOpacity
                    style={[styles.addTagButton, uploadTags.length >= 10 && styles.addTagButtonDisabled]}
                    onPress={handleAddTag}
                    disabled={uploadTags.length >= 10}
                  >
                    <FontAwesome6 name="plus" size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
                {uploadTags.length > 0 && (
                  <View style={styles.tagList}>
                    {uploadTags.map((tag, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.tagItem}
                        onPress={() => handleRemoveTag(tag)}
                      >
                        <Text style={styles.tagItemText}>{tag}</Text>
                        <FontAwesome6 name="times" size={12} color="#6C63FF" />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* 上传人 */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>上传人</Text>
                <View style={styles.uploaderInfo}>
                  <FontAwesome6 name="user-circle" size={18} color="#6C63FF" />
                  <Text style={styles.uploaderName}>{user?.name || '未知用户'}</Text>
                </View>
              </View>
            </ScrollView>

            <View style={styles.uploadModalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setUploadModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmButton} onPress={handleUpload}>
                <Text style={styles.confirmButtonText}>确认上传</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* 分类选择弹窗 */}
      <Modal
        visible={categoryModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCategoryModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.selectModalOverlay}
          activeOpacity={1}
          onPress={() => setCategoryModalVisible(false)}
        >
          <View style={styles.selectModalContent}>
            <Text style={styles.selectModalTitle}>选择分类</Text>
            {FILE_CATEGORIES.filter((c) => c.value !== '').map((cat) => (
              <TouchableOpacity
                key={cat.value}
                style={[
                  styles.selectOption,
                  uploadCategory === cat.value && styles.selectOptionActive,
                ]}
                onPress={() => {
                  setUploadCategory(cat.value);
                  setCategoryModalVisible(false);
                }}
              >
                <Text
                  style={[
                    styles.selectOptionText,
                    uploadCategory === cat.value && styles.selectOptionTextActive,
                  ]}
                >
                  {cat.label}
                </Text>
                {uploadCategory === cat.value && (
                  <FontAwesome6 name="check" size={16} color="#6C63FF" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 文件详情弹窗 */}
      <Modal
        visible={fileDetailModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFileDetailModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setFileDetailModalVisible(false)}
        >
          <View style={styles.detailModal}>
            <View style={styles.detailModalHeader}>
              <Text style={styles.detailModalTitle}>文件详情</Text>
              <TouchableOpacity onPress={() => setFileDetailModalVisible(false)}>
                <FontAwesome6 name="times" size={20} color="#636E72" />
              </TouchableOpacity>
            </View>

            {selectedFile && (
              <ScrollView style={styles.detailModalContent}>
                <View style={styles.detailFileInfo}>
                  <View style={[styles.detailFileIcon, { backgroundColor: `${getFileIconColor(selectedFile.file_type)}15` }]}>
                    <FontAwesome6
                      name={getFileIcon(selectedFile.file_type)}
                      size={48}
                      color={getFileIconColor(selectedFile.file_type)}
                    />
                  </View>
                  <Text style={styles.detailFileName}>{selectedFile.original_name}</Text>
                  <Text style={styles.detailFileSize}>{formatFileSize(selectedFile.file_size)}</Text>
                </View>

                <View style={styles.detailSection}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>文件分类</Text>
                    <Text style={styles.detailValue}>{selectedFile.category}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>上传人</Text>
                    <Text style={styles.detailValue}>{selectedFile.uploader_name || '未知'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>上传日期</Text>
                    <Text style={styles.detailValue}>
                      {new Date(selectedFile.created_at).toLocaleString('zh-CN')}
                    </Text>
                  </View>
                  {selectedFile.description && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>文件描述</Text>
                      <Text style={styles.detailValue}>{selectedFile.description}</Text>
                    </View>
                  )}
                  {selectedFile.tags && selectedFile.tags.length > 0 && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>标签</Text>
                      <View style={styles.detailTags}>
                        {selectedFile.tags.map((tag: string, index: number) => (
                          <View key={index} style={styles.detailTagBadge}>
                            <Text style={styles.detailTagText}>{tag}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              </ScrollView>
            )}

            <View style={styles.detailModalFooter}>
              <TouchableOpacity
                style={styles.deleteFileButton}
                onPress={() => {
                  setFileDetailModalVisible(false);
                  handleDelete(selectedFile);
                }}
              >
                <FontAwesome6 name="trash" size={16} color="#E74C3C" />
                <Text style={styles.deleteFileText}>删除</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    shadowColor: '#D1D9E6',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#2D3436',
  },
  categoryContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  categoryChipActive: {
    backgroundColor: '#6C63FF',
    borderColor: '#6C63FF',
  },
  categoryChipText: {
    fontSize: 13,
    color: '#636E72',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  uploadButtonContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#6C63FF',
    borderRadius: 12,
    paddingVertical: 14,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#636E72',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: '#95A5A6',
    marginTop: 8,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#D1D9E6',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  },
  fileIcon: {
    width: 52,
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 6,
  },
  fileMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  fileMetaText: {
    fontSize: 12,
    color: '#95A5A6',
  },
  fileMetaDot: {
    fontSize: 12,
    color: '#D1D5DB',
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  tagBadge: {
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  tagBadgeText: {
    fontSize: 11,
    color: '#6C63FF',
  },
  moreTagsText: {
    fontSize: 11,
    color: '#95A5A6',
    alignSelf: 'center',
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  uploadModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
  },
  uploadModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  uploadModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3436',
  },
  uploadModalContent: {
    padding: 18,
  },
  selectedFileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 14,
    marginBottom: 18,
  },
  selectedFileIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  selectedFileDetails: {
    flex: 1,
  },
  selectedFileName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 4,
  },
  selectedFileSize: {
    fontSize: 13,
    color: '#95A5A6',
  },
  formGroup: {
    marginBottom: 18,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 8,
  },
  categorySelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  categorySelectorText: {
    fontSize: 14,
    color: '#2D3436',
  },
  descriptionInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#2D3436',
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  tagInputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  tagInput: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#2D3436',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  addTagButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#6C63FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addTagButtonDisabled: {
    backgroundColor: '#CCC',
  },
  tagList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  tagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagItemText: {
    fontSize: 13,
    color: '#6C63FF',
  },
  uploaderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  uploaderName: {
    fontSize: 14,
    color: '#2D3436',
  },
  uploadModalFooter: {
    flexDirection: 'row',
    padding: 18,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#636E72',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#6C63FF',
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  selectModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  selectModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '80%',
  },
  selectModalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 16,
    textAlign: 'center',
  },
  selectOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  selectOptionActive: {
    backgroundColor: 'rgba(108, 99, 255, 0.05)',
  },
  selectOptionText: {
    fontSize: 15,
    color: '#2D3436',
  },
  selectOptionTextActive: {
    color: '#6C63FF',
    fontWeight: '500',
  },
  detailModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  detailModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  detailModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3436',
  },
  detailModalContent: {
    padding: 18,
  },
  detailFileInfo: {
    alignItems: 'center',
    marginBottom: 24,
  },
  detailFileIcon: {
    width: 88,
    height: 88,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  detailFileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3436',
    textAlign: 'center',
    marginBottom: 6,
  },
  detailFileSize: {
    fontSize: 14,
    color: '#95A5A6',
  },
  detailSection: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
  },
  detailRow: {
    marginBottom: 14,
  },
  detailLabel: {
    fontSize: 13,
    color: '#95A5A6',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    color: '#2D3436',
  },
  detailTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  detailTagBadge: {
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  detailTagText: {
    fontSize: 12,
    color: '#6C63FF',
  },
  detailModalFooter: {
    padding: 18,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  deleteFileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
  },
  deleteFileText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#E74C3C',
  },
});
