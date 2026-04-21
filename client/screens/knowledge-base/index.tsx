import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { Screen } from '@/components/Screen';
import { PageHeader } from '@/components/PageHeader';
import { FontAwesome6 } from '@expo/vector-icons';
import { useSafeRouter } from '@/hooks/useSafeRouter';

import { getApiBaseUrl } from '@/utils/api';

interface KnowledgeCard {
  id: number;
  title: string;
  content: string;
  tags: string[];
  creator: string;
  created_at: string;
  updated_at: string;
  views: number;
}

export default function KnowledgeBase() {
  const router = useSafeRouter();
  const [cards, setCards] = useState<KnowledgeCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [deletingCard, setDeletingCard] = useState<KnowledgeCard | null>(null);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);

  const loadKnowledgeCards = useCallback(async (keyword?: string) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (keyword) {
        params.append('keyword', keyword);
      }

      const response = await fetch(
        `${getApiBaseUrl()}/api/v1/knowledge?${params.toString()}`
      );
      const data = await response.json();
      if (response.ok) {
        const list = Array.isArray(data) ? data : (data.data || []);
        setCards(list);
      }
    } catch (error) {
      console.error('Fetch knowledge cards error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 页面聚焦时刷新列表
  useFocusEffect(
    useCallback(() => {
      loadKnowledgeCards();
    }, [loadKnowledgeCards])
  );

  const handleCreate = () => {
    router.push('/knowledge-create');
  };

  const handleViewDetail = (cardId: number) => {
    router.push('/knowledge-detail', { id: cardId });
  };

  const handleEdit = (cardId: number) => {
    router.push('/knowledge-create', { id: cardId });
  };

  const handleSearch = () => {
    loadKnowledgeCards(searchKeyword);
  };

  const handleDelete = (card: KnowledgeCard) => {
    console.log('[知识库删除] 删除知识卡:', card);
    setDeletingCard(card);
    setDeleteConfirmVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingCard) return;

    console.log('[知识库删除] 确认删除，ID:', deletingCard.id);
    try {
      const response = await fetch(
        `${getApiBaseUrl()}/api/v1/knowledge/${deletingCard.id}`,
        {
          method: 'DELETE',
        }
      );
      console.log('[知识库删除] 删除响应:', response);
      if (response.ok) {
        setDeleteConfirmVisible(false);
        setDeletingCard(null);
        loadKnowledgeCards();
      } else {
        console.error('[知识库删除] 删除失败:', response.status);
        Alert.alert('错误', '删除失败');
      }
    } catch (error) {
      console.error('[知识库删除] 删除异常:', error);
      Alert.alert('错误', '删除失败');
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmVisible(false);
    setDeletingCard(null);
  };

  // 批量导入知识卡
  const handleImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const file = result.assets[0];
      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        type: file.mimeType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        name: file.name,
      } as any);

      const response = await fetch(`${getApiBaseUrl()}/api/v1/knowledge/import`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        Alert.alert('导入成功', `成功导入 ${data.imported || 0} 条知识卡`);
        loadKnowledgeCards();
      } else {
        Alert.alert('导入失败', '请上传正确的Excel文件');
      }
    } catch (error) {
      console.error('[知识库导入] 错误:', error);
      Alert.alert('导入失败', '请上传.xlsx格式的文件');
    }
  };

  // 批量下载知识卡
  const handleExport = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/v1/knowledge/export`);

      if (response.ok) {
        const blob = await response.blob();

        if (Platform.OS === 'web') {
          const url = window.URL.createObjectURL(blob);
          const link = window.document.createElement('a');
          link.href = url;
          const fileName = `知识库导出_${new Date().toISOString().split('T')[0]}.xlsx`;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        } else {
          Alert.alert('提示', '移动端暂不支持直接下载，请在PC端操作');
        }
      } else {
        Alert.alert('导出失败', '请稍后重试');
      }
    } catch (error) {
      console.error('[知识库导出] 错误:', error);
      Alert.alert('导出失败', '请稍后重试');
    }
  };

  // 下载导入模板
  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/v1/knowledge/template`);

      if (response.ok) {
        const blob = await response.blob();

        if (Platform.OS === 'web') {
          const url = window.URL.createObjectURL(blob);
          const link = window.document.createElement('a');
          link.href = url;
          link.download = 'knowledge_import_template.xlsx';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        } else {
          Alert.alert('提示', '移动端暂不支持直接下载，请在PC端操作');
        }
      } else {
        Alert.alert('下载失败', '请稍后重试');
      }
    } catch (error) {
      console.error('[知识库模板下载] 错误:', error);
      Alert.alert('下载失败', '请稍后重试');
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  return (
    <Screen>
      <PageHeader title="知识库" />

      <ScrollView style={styles.container}>
        {/* 操作栏 */}
        <View style={styles.actionBar}>
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton} onPress={handleImport}>
              <FontAwesome6 name="file-import" size={20} color="#6C63FF" />
              <Text style={styles.actionButtonText}>导入</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleExport}>
              <FontAwesome6 name="file-export" size={20} color="#00B894" />
              <Text style={styles.actionButtonText}>导出</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleDownloadTemplate}>
              <FontAwesome6 name="download" size={20} color="#F39C12" />
              <Text style={styles.actionButtonText}>模板</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.createButton} onPress={handleCreate}>
            <FontAwesome6 name="plus" size={16} color="#FFFFFF" />
            <Text style={styles.createButtonText}>新建知识卡</Text>
          </TouchableOpacity>
        </View>

        {/* 搜索框 */}
        <View style={styles.searchBar}>
          <FontAwesome6 name="magnifying-glass" size={16} color="#636E72" />
          <TextInput
            style={styles.searchInput}
            placeholder="搜索标题、内容、标签"
            value={searchKeyword}
            onChangeText={setSearchKeyword}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <Text style={styles.searchButtonText}>搜索</Text>
          </TouchableOpacity>
        </View>

        {/* 知识卡列表 */}
        {loading ? (
          <View style={styles.centerContainer}>
            <Text>加载中...</Text>
          </View>
        ) : cards.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>暂无知识卡</Text>
          </View>
        ) : (
          cards.map((card) => (
            <View key={card.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleContainer}>
                  <FontAwesome6 name="lightbulb" size={18} color="#6C63FF" />
                  <Text style={styles.cardTitle} numberOfLines={1}>{card.title}</Text>
                </View>
              </View>

              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => handleViewDetail(card.id)}
                >
                  <FontAwesome6 name="eye" size={16} color="#1E88E5" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => handleEdit(card.id)}
                >
                  <FontAwesome6 name="pen" size={16} color="#6C63FF" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => handleDelete(card)}
                >
                  <FontAwesome6 name="trash" size={16} color="#FF6B6B" />
                </TouchableOpacity>
              </View>

              <Text style={styles.cardContent} numberOfLines={3}>
                {card.content}
              </Text>

              {card.tags && card.tags.length > 0 && (
                <View style={styles.tagContainer}>
                  {card.tags.slice(0, 5).map((tag, index) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.cardFooter}>
                <Text style={styles.footerText}>
                  {card.creator || '未知'} · {formatDate(card.created_at)}
                </Text>
                <View style={styles.footerRight}>
                  <FontAwesome6 name="eye" size={12} color="#B2BEC3" />
                  <Text style={styles.footerText}> {card.views || 0}</Text>
                </View>
              </View>
            </View>
          ))
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* 删除确认 Modal */}
      <Modal
        visible={deleteConfirmVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCancelDelete}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>确认删除</Text>
            <Text style={styles.modalMessage}>
              确定要删除知识卡"{deletingCard?.title}"吗？
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={handleCancelDelete}
              >
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.deleteButton]}
                onPress={handleConfirmDelete}
              >
                <Text style={styles.deleteButtonText}>删除</Text>
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
    backgroundColor: '#F8F9FA',
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    width: 80,
    height: 80,
    borderRadius: 12,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#2D3436',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6C63FF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#2D3436',
  },
  searchButton: {
    backgroundColor: '#6C63FF',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#B2BEC3',
  },
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3436',
    flex: 1,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 6,
  },
  cardContent: {
    fontSize: 14,
    color: '#636E72',
    lineHeight: 20,
    marginBottom: 10,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  tag: {
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    color: '#6C63FF',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 10,
  },
  footerText: {
    fontSize: 12,
    color: '#B2BEC3',
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bottomPadding: {
    height: 30,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxWidth: 320,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 14,
    color: '#636E72',
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F0F0F0',
  },
  cancelButtonText: {
    color: '#636E72',
    fontSize: 14,
    fontWeight: '500',
  },
  deleteButton: {
    backgroundColor: '#FF6B6B',
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
