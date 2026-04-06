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

interface QueryFile {
  id: number;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  uploaded_by: string;
  customer_name?: string;
  project_name?: string;
  device_name?: string;
  device_number?: string;
  tags: string[];
  created_at: string;
}

export default function QueryFile() {
  const router = useSafeRouter();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [results, setResults] = useState<QueryFile[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchKeyword.trim()) {
      Alert.alert('提示', '请输入搜索关键词');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/query/files?keyword=${encodeURIComponent(searchKeyword)}`
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

  const getFileIcon = (fileType: string) => {
    const type = fileType.toLowerCase();
    if (type.includes('word') || type.includes('doc')) return 'file-word';
    if (type.includes('excel') || type.includes('xls')) return 'file-excel';
    if (type.includes('powerpoint') || type.includes('ppt')) return 'file-powerpoint';
    if (type.includes('pdf')) return 'file-pdf';
    return 'file';
  };

  const getFileColor = (fileType: string) => {
    const type = fileType.toLowerCase();
    if (type.includes('word') || type.includes('doc')) return '#2B579A';
    if (type.includes('excel') || type.includes('xls')) return '#217346';
    if (type.includes('powerpoint') || type.includes('ppt')) return '#D24726';
    if (type.includes('pdf')) return '#E74C3C';
    return '#636E72';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <Screen>
      <PageHeader title="文件查询" />

      <View style={styles.container}>
        {/* 搜索框 */}
        <View style={styles.searchContainer}>
          <FontAwesome6 name="magnifying-glass" size={16} color="#636E72" />
          <TextInput
            style={styles.searchInput}
            placeholder="输入账号、客户、项目、设备、文件名、标签"
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
            支持按账号、客户、项目名称、设备名称、设备编号、文件名称、文件标签查询
          </Text>
        </View>

        {/* 搜索结果 */}
        {loading ? (
          <View style={styles.centerContainer}>
            <Text>查询中...</Text>
          </View>
        ) : results.length === 0 && searchKeyword ? (
          <View style={styles.centerContainer}>
            <FontAwesome6 name="file-circle-xmark" size={48} color="#95A5A6" />
            <Text style={styles.emptyText}>未找到相关文件</Text>
          </View>
        ) : results.length === 0 ? (
          <View style={styles.centerContainer}>
            <FontAwesome6 name="folder-open" size={48} color="#95A5A6" />
            <Text style={styles.emptyText}>请输入关键词进行搜索</Text>
          </View>
        ) : (
          <ScrollView style={styles.resultsContainer}>
            <Text style={styles.resultsTitle}>查询结果（{results.length}）</Text>
            {results.map((file) => (
              <TouchableOpacity
                key={file.id}
                style={styles.fileCard}
                onPress={() => router.push('/file-detail', { id: file.id })}
              >
                <View style={styles.fileHeader}>
                  <View
                    style={[
                      styles.fileIcon,
                      { backgroundColor: `${getFileColor(file.file_type)}15` },
                    ]}
                  >
                    <FontAwesome6
                      name={getFileIcon(file.file_type) as any}
                      size={32}
                      color={getFileColor(file.file_type)}
                    />
                  </View>
                  <View style={styles.fileInfo}>
                    <Text style={styles.fileName}>{file.file_name}</Text>
                    <Text style={styles.fileMeta}>
                      {file.file_type} · {formatFileSize(file.file_size)}
                    </Text>
                  </View>
                </View>

                {/* 关联信息 */}
                {(file.customer_name || file.project_name || file.device_name) && (
                  <View style={styles.relations}>
                    {file.customer_name && (
                      <View style={styles.relationTag}>
                        <FontAwesome6 name="building" size={10} color="#636E72" />
                        <Text style={styles.relationText}>{file.customer_name}</Text>
                      </View>
                    )}
                    {file.project_name && (
                      <View style={styles.relationTag}>
                        <FontAwesome6 name="folder-open" size={10} color="#636E72" />
                        <Text style={styles.relationText}>{file.project_name}</Text>
                      </View>
                    )}
                    {file.device_name && (
                      <View style={styles.relationTag}>
                        <FontAwesome6 name="microchip" size={10} color="#636E72" />
                        <Text style={styles.relationText}>{file.device_name}</Text>
                      </View>
                    )}
                  </View>
                )}

                {/* 标签 */}
                {file.tags.length > 0 && (
                  <View style={styles.tagsContainer}>
                    {file.tags.slice(0, 3).map((tag, index) => (
                      <View key={index} style={styles.tagBadge}>
                        <Text style={styles.tagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                )}

                <View style={styles.fileFooter}>
                  <Text style={styles.uploadedBy}>{file.uploaded_by}</Text>
                  <Text style={styles.uploadDate}>
                    {new Date(file.created_at).toLocaleDateString()}
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
  fileCard: {
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
  fileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  fileIcon: {
    width: 56,
    height: 56,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 4,
  },
  fileMeta: {
    fontSize: 12,
    color: '#95A5A6',
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
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  tagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(30, 136, 229, 0.1)',
  },
  tagText: {
    fontSize: 11,
    color: '#1E88E5',
  },
  fileFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  uploadedBy: {
    fontSize: 12,
    color: '#636E72',
  },
  uploadDate: {
    fontSize: 12,
    color: '#95A5A6',
  },
});
