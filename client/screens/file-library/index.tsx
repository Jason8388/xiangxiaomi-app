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

interface FileItem {
  id: number;
  file_name: string;
  original_name: string;
  file_type: string;
  file_size: number;
  category: string;
  description: string;
  created_at: string;
}

const FILE_CATEGORIES = [
  { label: '全部', value: '' },
  { label: '项目文档', value: '项目文档' },
  { label: '会议记录', value: '会议记录' },
  { label: '技术资料', value: '技术资料' },
  { label: '合同文件', value: '合同文件' },
  { label: '其他', value: '其他' },
];

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

  useEffect(() => {
    loadFiles();
  }, []);

  // 搜索过滤
  useEffect(() => {
    let filtered = files;

    // 按分类过滤
    if (selectedCategory) {
      filtered = filtered.filter((f) => f.category === selectedCategory);
    }

    // 按关键词搜索
    if (searchKeyword.trim()) {
      const keyword = searchKeyword.toLowerCase();
      filtered = filtered.filter(
        (f) =>
          f.original_name.toLowerCase().includes(keyword) ||
          (f.description && f.description.toLowerCase().includes(keyword))
      );
    }

    setFilteredFiles(filtered);
  }, [searchKeyword, selectedCategory, files]);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/files`);
      const data = await response.json();
      if (Array.isArray(data)) {
        setFiles(data);
      }
    } catch (error) {
      console.error('Load files error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      setSelectedFile(file);
      setUploadModalVisible(true);
    } catch (error) {
      console.error('Pick document error:', error);
      Alert.alert('提示', '选择文件失败');
    }
  };

  const handleSubmitUpload = async () => {
    if (!selectedFile) {
      Alert.alert('提示', '请选择要上传的文件');
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append('file', {
        uri: selectedFile.uri,
        type: selectedFile.mimeType || 'application/octet-stream',
        name: selectedFile.name,
      } as any);
      formData.append('category', uploadCategory);
      formData.append('description', uploadDescription);
      formData.append('uploaded_by', user?.id?.toString() || '1');

      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/files`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        Alert.alert('成功', '文件上传成功');
        setUploadModalVisible(false);
        setSelectedFile(null);
        setUploadCategory('未分类');
        setUploadDescription('');
        loadFiles();
      } else {
        throw new Error('上传失败');
      }
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('提示', '文件上传失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (file: FileItem) => {
    Alert.alert(
      '确认删除',
      `确定要删除文件"${file.original_name}"吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(
                `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/files/${file.id}`,
                { method: 'DELETE' }
              );
              if (response.ok) {
                loadFiles();
              }
            } catch (error) {
              Alert.alert('提示', '删除失败');
            }
          },
        },
      ]
    );
  };

  const handleDownload = async (file: FileItem) => {
    try {
      const url = `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/files/${file.id}/download`;
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('提示', '无法打开下载链接');
      }
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('提示', '下载失败');
    }
  };

  const getFileIcon = (type: string) => {
    const iconMap: Record<string, string> = {
      pdf: 'file-pdf',
      doc: 'file-word',
      docx: 'file-word',
      xls: 'file-excel',
      xlsx: 'file-excel',
      ppt: 'file-powerpoint',
      pptx: 'file-powerpoint',
    };
    return iconMap[type.toLowerCase()] || 'file';
  };

  const getFileColor = (type: string) => {
    const colorMap: Record<string, string> = {
      pdf: '#E74C3C',
      doc: '#2E86AB',
      docx: '#2E86AB',
      xls: '#27AE60',
      xlsx: '#27AE60',
      ppt: '#E67E22',
      pptx: '#E67E22',
    };
    return colorMap[type.toLowerCase()] || '#95A5A6';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const renderFileItem = ({ item }: { item: FileItem }) => (
    <TouchableOpacity style={styles.fileCard} onPress={() => handleDownload(item)}>
      <View style={[styles.fileIconContainer, { backgroundColor: getFileColor(item.file_type) + '20' }]}>
        <FontAwesome6 name={getFileIcon(item.file_type) as any} size={28} color={getFileColor(item.file_type)} />
      </View>
      <View style={styles.fileInfo}>
        <Text style={styles.fileName} numberOfLines={1}>{item.original_name}</Text>
        <View style={styles.fileMeta}>
          <Text style={styles.fileSize}>{formatFileSize(item.file_size)}</Text>
          <Text style={styles.fileDate}>{formatDate(item.created_at)}</Text>
        </View>
        {item.description ? (
          <Text style={styles.fileDesc} numberOfLines={1}>{item.description}</Text>
        ) : null}
      </View>
      <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
        <FontAwesome6 name="trash" size={16} color="#E74C3C" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <Screen>
      <PageHeader title="文件库" showHome />
      <View style={styles.container}>
        {/* 上传按钮 */}
        <View style={styles.uploadBar}>
          <TouchableOpacity style={styles.uploadBtn} onPress={handleUpload}>
            <FontAwesome6 name="cloud-upload-alt" size={16} color="#FFFFFF" />
            <Text style={styles.uploadBtnText}>上传文件</Text>
          </TouchableOpacity>
        </View>

        {/* 搜索栏 */}
        <View style={styles.searchContainer}>
          <FontAwesome6 name="search" size={16} color="#95A5A6" />
          <TextInput
            style={styles.searchInput}
            placeholder="搜索文件名或描述"
            value={searchKeyword}
            onChangeText={setSearchKeyword}
            placeholderTextColor="#95A5A6"
          />
          {searchKeyword ? (
            <TouchableOpacity onPress={() => setSearchKeyword('')}>
              <FontAwesome6 name="times-circle" size={18} color="#95A5A6" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* 分类筛选 */}
        <View style={styles.categoryContainer}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={FILE_CATEGORIES}
            keyExtractor={(item) => item.value}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.categoryItem,
                  selectedCategory === item.value && styles.categoryItemActive,
                ]}
                onPress={() => setSelectedCategory(item.value)}
              >
                <Text
                  style={[
                    styles.categoryText,
                    selectedCategory === item.value && styles.categoryTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* 文件列表 */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1E88E5" />
            <Text style={styles.loadingText}>加载中...</Text>
          </View>
        ) : filteredFiles.length === 0 ? (
          <View style={styles.emptyContainer}>
            <FontAwesome6 name="folder-open" size={60} color="#E0E0E0" />
            <Text style={styles.emptyText}>暂无文件</Text>
            <Text style={styles.emptySubText}>点击上方"上传文件"按钮添加文件</Text>
          </View>
        ) : (
          <FlatList
            data={filteredFiles}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderFileItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* 上传弹窗 */}
        <Modal
          visible={uploadModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setUploadModalVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setUploadModalVisible(false)}
          >
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={{ flex: 1, justifyContent: 'flex-end' }}
            >
              <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>上传文件</Text>
                  <TouchableOpacity onPress={() => setUploadModalVisible(false)}>
                    <FontAwesome6 name="times" size={20} color="#666" />
                  </TouchableOpacity>
                </View>

                {/* 已选文件 */}
                {selectedFile && (
                  <View style={styles.selectedFileContainer}>
                    <FontAwesome6
                      name={getFileIcon(selectedFile.name?.split('.').pop() || '') as any}
                      size={24}
                      color={getFileColor(selectedFile.name?.split('.').pop() || '')}
                    />
                    <Text style={styles.selectedFileName} numberOfLines={1}>
                      {selectedFile.name}
                    </Text>
                  </View>
                )}

                {/* 文件分类 */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>文件分类</Text>
                  <View style={styles.categorySelect}>
                    {FILE_CATEGORIES.slice(1).map((cat) => (
                      <TouchableOpacity
                        key={cat.value}
                        style={[
                          styles.categoryOption,
                          uploadCategory === cat.value && styles.categoryOptionActive,
                        ]}
                        onPress={() => setUploadCategory(cat.value || '其他')}
                      >
                        <Text
                          style={[
                            styles.categoryOptionText,
                            uploadCategory === cat.value && styles.categoryOptionTextActive,
                          ]}
                        >
                          {cat.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* 文件描述 */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>文件描述</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="请输入文件描述（可选）"
                    value={uploadDescription}
                    onChangeText={setUploadDescription}
                    multiline
                    numberOfLines={3}
                  />
                </View>

                {/* 提交按钮 */}
                <TouchableOpacity
                  style={styles.submitBtn}
                  onPress={handleSubmitUpload}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitBtnText}>确认上传</Text>
                  )}
                </TouchableOpacity>
              </TouchableOpacity>
            </KeyboardAvoidingView>
          </TouchableOpacity>
        </Modal>
      </View>
    </Screen>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },
  uploadBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2D3436',
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E88E5',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  uploadBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    height: 44,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#2D3436',
  },
  categoryContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  categoryItem: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    marginRight: 8,
  },
  categoryItemActive: {
    backgroundColor: '#1E88E5',
  },
  categoryText: {
    fontSize: 13,
    color: '#666',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
  },
  emptySubText: {
    marginTop: 8,
    fontSize: 13,
    color: '#CCC',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  fileIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileInfo: {
    flex: 1,
    marginLeft: 12,
  },
  fileName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#2D3436',
    marginBottom: 4,
  },
  fileMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  fileSize: {
    fontSize: 12,
    color: '#999',
  },
  fileDate: {
    fontSize: 12,
    color: '#999',
  },
  fileDesc: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  deleteBtn: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3436',
  },
  selectedFileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 10,
  },
  selectedFileName: {
    flex: 1,
    fontSize: 14,
    color: '#2D3436',
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2D3436',
    marginBottom: 8,
  },
  categorySelect: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryOption: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
  },
  categoryOptionActive: {
    backgroundColor: '#1E88E5',
  },
  categoryOptionText: {
    fontSize: 13,
    color: '#666',
  },
  categoryOptionTextActive: {
    color: '#FFFFFF',
  },
  formInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#2D3436',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitBtn: {
    backgroundColor: '#1E88E5',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
