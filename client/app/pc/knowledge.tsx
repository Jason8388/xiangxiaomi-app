import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Image } from 'react-native';
import { PCLayout } from '@/components/pc/PCLayout';
import { PCTag } from '@/components/pc/PCComponents';
import { PCCard } from '@/components/pc/PCComponents';
import { PCToolbar } from '@/components/pc/PCComponents';
import { PCSearchBar } from '@/components/pc/PCComponents';
import { PCModal } from '@/components/pc/PCComponents';
import { PCImportModal } from '@/components/pc/PCComponents';
import { FontAwesome6 } from '@expo/vector-icons';

import { storage } from '@/utils/storage';
import { getApiBaseUrl } from '@/utils/api';
const API_BASE = getApiBaseUrl();

interface Knowledge {
  id: number;
  title: string;
  category: string;
  tags: string[];
  content: string;
  author_name: string;
  created_at: string;
  updated_at: string;
  views: number;
  attachments?: { id: number; url: string; filename: string; file_type: string }[];
}

export default function PCKnowledge() {
  const [items, setItems] = useState<Knowledge[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<Knowledge | null>(null);
  const [viewItem, setViewItem] = useState<Knowledge | null>(null);
  const [formData, setFormData] = useState({ title: '', category: '', tags: '', content: '' });
  const [attachments, setAttachments] = useState<{ uri: string; name: string; type: string }[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');
  const [tagInput, setTagInput] = useState<any>(null);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 12, total: 0 });

  const categories = ['设备维护', '操作手册', '故障排除', '技术文档', '培训资料'];
  const defaultTags = ['技术文档', '操作指南', '故障处理', '最佳实践', '经验总结', '项目经验', '常见问题', '培训材料', '流程规范', '工具使用'];

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const sessionId = await storage.getItem('session_id');
      const response = await fetch(`${API_BASE}/api/v1/knowledge`, {
        headers: sessionId ? { 'Authorization': `Bearer ${sessionId}` } : {},
      });
      const data = await response.json();
      // 支持两种格式：直接数组 或 { code, data, message }
      let list: Knowledge[] = [];
      if (Array.isArray(data)) {
        list = data;
      } else if (data.data && Array.isArray(data.data)) {
        list = data.data;
      } else if (data.knowledge && Array.isArray(data.knowledge)) {
        list = data.knowledge;
      }
      setItems(list);
      setPagination(prev => ({ ...prev, total: list.length }));
    } catch (error) {
      console.error('Fetch knowledge error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleSearch = useCallback(async () => {
    if (!searchText) {
      fetchItems();
      return;
    }
    setLoading(true);
    try {
      const sessionId = await storage.getItem('session_id');
      const response = await fetch(`${API_BASE}/api/v1/knowledge/search/${searchText}`, {
        headers: sessionId ? { 'Authorization': `Bearer ${sessionId}` } : {},
      });
      const data = await response.json();
      let list: Knowledge[] = [];
      if (Array.isArray(data)) {
        list = data;
      } else if (data.data && Array.isArray(data.data)) {
        list = data.data;
      }
      setItems(list);
      setPagination(prev => ({ ...prev, total: list.length }));
    } catch (error) {
      console.error('Search knowledge error:', error);
    } finally {
      setLoading(false);
    }
  }, [searchText, fetchItems]);

  const handleSave = async () => {
    if (!formData.title || !formData.content) {
      Alert.alert('错误', '标题和内容不能为空');
      return;
    }

    try {
      const sessionId = await storage.getItem('session_id');
      const url = editingItem
        ? `${API_BASE}/api/v1/knowledge/${editingItem.id}`
        : `${API_BASE}/api/v1/knowledge`;
      const method = editingItem ? 'PUT' : 'POST';

      // 使用FormData上传附件
      const formDataObj = new FormData();
      formDataObj.append('title', formData.title);
      formDataObj.append('category', formData.category);
      formDataObj.append('content', formData.content);
      // 标签：优先使用selectedTags，如果没有则解析formData.tags
      const tagsToSave = selectedTags.length > 0 ? selectedTags : (formData.tags ? formData.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t) : []);
      formDataObj.append('tags', JSON.stringify(tagsToSave));

      // 添加附件文件
      for (const attachment of attachments) {
        try {
          // 从 blob URL 获取文件
          const response = await fetch(attachment.uri);
          const blob = await response.blob();
          const file = new File([blob], attachment.name, { type: attachment.type });
          formDataObj.append('files', file);
        } catch (e) {
          console.error('Error processing attachment:', e);
        }
      }

      const response = await fetch(url, {
        method,
        body: formDataObj,
        headers: sessionId ? { 'Authorization': `Bearer ${sessionId}` } : {},
      });

      if (!response.ok) {
        throw new Error('保存失败');
      }

      setModalVisible(false);
      fetchItems();
      Alert.alert('成功', editingItem ? '知识更新成功' : '知识创建成功');
    } catch (error: any) {
      Alert.alert('错误', error.message);
    }
  };

  const handleDelete = async (id: number) => {
    Alert.alert('确认', '确定要删除此知识吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '确定',
        style: 'destructive',
        onPress: async () => {
          try {
            const sessionId = await storage.getItem('session_id');
            const response = await fetch(`${API_BASE}/api/v1/knowledge/${id}`, {
              method: 'DELETE',
              headers: sessionId ? { 'Authorization': `Bearer ${sessionId}` } : {},
            });

            if (!response.ok) {
              throw new Error('删除失败');
            }

            fetchItems();
            Alert.alert('成功', '知识删除成功');
          } catch (error: any) {
            Alert.alert('错误', error.message);
          }
        },
      },
    ]);
  };

  const handleAdd = () => {
    setEditingItem(null);
    setFormData({ title: '', category: '', tags: '', content: '' });
    setAttachments([]);
    setSelectedTags([]);
    setModalVisible(true);
  };

  const handleEdit = (item: Knowledge) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      category: item.category || '',
      content: item.content,
      tags: Array.isArray(item.tags) ? item.tags.join(', ') : '',
    });
    // 解析已有标签
    const tags = item.tags || [];
    setSelectedTags(tags);
    setAttachments([]);
    setModalVisible(true);
  };

  // 处理附件选择
  const handleSelectAttachment = () => {
    if (typeof window !== 'undefined' && tagInput) {
      tagInput.click();
    }
  };

  const handleFileChange = (e: any) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const remaining = 10 - attachments.length;
      const filesToAdd = Array.from(files).slice(0, remaining);
      const newAttachments = filesToAdd.map((file: any) => ({
        uri: URL.createObjectURL(file),
        name: file.name,
        type: file.type,
      }));
      setAttachments(prev => [...prev, ...newAttachments]);
    }
    // 清空input以便重复选择同一文件
    if (tagInput) {
      tagInput.value = '';
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // 处理标签
  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(prev => prev.filter(t => t !== tag));
    } else if (selectedTags.length < 10) {
      setSelectedTags(prev => [...prev, tag]);
    }
  };

  const handleAddCustomTag = () => {
    const tag = customTag.trim();
    if (tag && !selectedTags.includes(tag) && selectedTags.length < 10) {
      setSelectedTags(prev => [...prev, tag]);
      setCustomTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setSelectedTags(prev => prev.filter(t => t !== tag));
  };

  const filteredItems = items.filter(i => {
    const matchSearch =
      !searchText ||
      i.title.toLowerCase().includes(searchText.toLowerCase()) ||
      i.content.toLowerCase().includes(searchText.toLowerCase());
    const matchCategory = !categoryFilter || i.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return dateStr.split('T')[0];
  };

  // 分类颜色映射
  const getCategoryColor = (category: string) => {
    const colorMap: Record<string, string> = {
      '设备维护': '#00B894',
      '操作手册': '#0984E3',
      '故障排除': '#E17055',
      '技术文档': '#6C5CE7',
      '培训资料': '#FDCB6E',
    };
    return colorMap[category] || '#6C63FF';
  };

  return (
    <PCLayout>
      <View className="pc-page-header">
        <Text className="pc-page-title">知识库</Text>
        <Text className="pc-page-description">共 {items.length} 条知识</Text>
      </View>
      <PCCard>
        <PCToolbar
          left={
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <PCSearchBar
                placeholder="搜索知识标题或内容..."
                value={searchText}
                onChange={setSearchText}
                onSearch={handleSearch}
              />
              <View style={{ flexDirection: 'row', gap: 8, marginLeft: 16 }}>
                <TouchableOpacity
                  className={`pc-btn pc-btn-sm ${!categoryFilter ? 'pc-btn-primary' : 'pc-btn-default'}`}
                  onPress={() => setCategoryFilter('')}
                >
                  <Text style={[!categoryFilter && styles.btnPrimaryText, categoryFilter && styles.btnDefaultText]}>全部</Text>
                </TouchableOpacity>
                {categories.map(cat => (
                  <TouchableOpacity
                    key={cat}
                    className={`pc-btn pc-btn-sm ${categoryFilter === cat ? 'pc-btn-primary' : 'pc-btn-default'}`}
                    onPress={() => setCategoryFilter(categoryFilter === cat ? '' : cat)}
                  >
                    <Text style={[categoryFilter === cat && styles.btnPrimaryText, categoryFilter !== cat && styles.btnDefaultText]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          }
          right={
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity
                className="pc-btn pc-btn-default"
                onPress={() => setImportModalVisible(true)}
                style={{ marginRight: 8 }}
              >
                <FontAwesome6 name="upload" size={14} style={{ marginRight: 6 }} />
                <Text style={styles.btnDefaultText}>批量导入</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="pc-btn pc-btn-default"
                style={{ marginRight: 8, backgroundColor: '#E8F5E9', borderWidth: 1, borderColor: '#1E88E5' }}
                onPress={() => {
                  Alert.alert('提示', '导出功能正在开发中');
                }}
              >
                <FontAwesome6 name="download" size={14} style={{ marginRight: 6 }} />
                <Text style={{ color: '#1E88E5' }}>批量导出</Text>
              </TouchableOpacity>
              <TouchableOpacity className="pc-btn pc-btn-primary" onPress={handleAdd}>
                <Text style={styles.btnPrimaryText}>+ 新增知识</Text>
              </TouchableOpacity>
            </View>
          }
        />

        {/* 卡片网格展示 */}
        <View style={styles.cardGrid}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>加载中...</Text>
            </View>
          ) : filteredItems.length === 0 ? (
            <View style={styles.emptyContainer}>
              <FontAwesome6 name="folder-open" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>暂无知识内容</Text>
              <Text style={styles.emptyHint}>点击右上角"新增知识"创建第一条知识</Text>
            </View>
          ) : (
            filteredItems.map(item => (
              <TouchableOpacity
                key={item.id}
                style={styles.knowledgeCard}
                onPress={() => setViewItem(item)}
                activeOpacity={0.7}
              >
                {/* 卡片头部：图标 + 标题 + 分类 */}
                <View style={styles.cardHeader}>
                  <View style={styles.iconContainer}>
                    <FontAwesome6 name="book" size={22} color="#6C63FF" />
                  </View>
                  <View style={styles.titleContainer}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                    {item.category && (
                      <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(item.category) + '15' }]}>
                        <Text style={[styles.categoryText, { color: getCategoryColor(item.category) }]}>
                          {item.category}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* 内容摘要 */}
                <Text style={styles.contentPreview} numberOfLines={3}>
                  {item.content}
                </Text>

                {/* 标签 */}
                {item.tags && item.tags.length > 0 && (
                  <View style={styles.tagList}>
                    {item.tags.slice(0, 3).map((tag, index) => (
                      <View key={index} style={styles.tagItem}>
                        <Text style={styles.tagText}>{tag}</Text>
                      </View>
                    ))}
                    {item.tags.length > 3 && (
                      <View style={styles.moreTag}>
                        <Text style={styles.moreTagText}>+{item.tags.length - 3}</Text>
                      </View>
                    )}
                  </View>
                )}

                {/* 附件指示 */}
                {item.attachments && item.attachments.length > 0 && (
                  <View style={styles.attachmentIndicator}>
                    <FontAwesome6 name="paperclip" size={12} color="#9CA3AF" />
                    <Text style={styles.attachmentCount}>{item.attachments.length}个附件</Text>
                  </View>
                )}

                {/* 卡片底部：作者 + 浏览 + 操作 */}
                <View style={styles.cardFooter}>
                  <View style={styles.metaInfo}>
                    <View style={styles.authorAvatar}>
                      <FontAwesome6 name="user" size={12} color="#6B7280" />
                    </View>
                    <Text style={styles.authorName}>{item.author_name || '未知'}</Text>
                  </View>
                  <View style={styles.viewInfo}>
                    <FontAwesome6 name="eye" size={12} color="#9CA3AF" />
                    <Text style={styles.viewCount}>{item.views}</Text>
                  </View>
                  <View style={styles.dateInfo}>
                    <FontAwesome6 name="clock" size={12} color="#9CA3AF" />
                    <Text style={styles.dateText}>{formatDate(item.updated_at)}</Text>
                  </View>
                </View>

                {/* 操作按钮 */}
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={(e) => { e.stopPropagation(); handleEdit(item); }}
                  >
                    <FontAwesome6 name="pen" size={14} color="#6C63FF" />
                    <Text style={styles.actionBtnText}>编辑</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.deleteBtn]}
                    onPress={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                  >
                    <FontAwesome6 name="trash" size={14} color="#EF4444" />
                    <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>删除</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </PCCard>

      {/* 查看详情弹窗 */}
      <PCModal
        visible={!!viewItem}
        title={viewItem?.title || ''}
        onClose={() => setViewItem(null)}
        width={800}
        footer={
          <TouchableOpacity className="pc-btn pc-btn-default" onPress={() => setViewItem(null)}>
            <Text style={styles.btnDefaultText}>关闭</Text>
          </TouchableOpacity>
        }
      >
        {viewItem && (
          <ScrollView style={styles.detailScrollView}>
            {/* 分类和标签 */}
            <View style={styles.detailTags}>
              {viewItem.category && (
                <View style={[styles.detailCategoryBadge, { backgroundColor: getCategoryColor(viewItem.category) }]}>
                  <Text style={styles.detailCategoryText}>{viewItem.category}</Text>
                </View>
              )}
              {viewItem.tags?.map((t, i) => (
                <View key={i} style={styles.detailTag}>
                  <Text style={styles.detailTagText}>{t}</Text>
                </View>
              ))}
            </View>

            {/* 元信息 */}
            <View style={styles.detailMeta}>
              <View style={styles.metaItem}>
                <FontAwesome6 name="user" size={14} color="#6B7280" />
                <Text style={styles.metaLabel}>作者：</Text>
                <Text style={styles.metaValue}>{viewItem.author_name || '未知'}</Text>
              </View>
              <View style={styles.metaItem}>
                <FontAwesome6 name="clock" size={14} color="#6B7280" />
                <Text style={styles.metaLabel}>更新时间：</Text>
                <Text style={styles.metaValue}>{formatDate(viewItem.updated_at)}</Text>
              </View>
              <View style={styles.metaItem}>
                <FontAwesome6 name="eye" size={14} color="#6B7280" />
                <Text style={styles.metaLabel}>浏览：</Text>
                <Text style={styles.metaValue}>{viewItem.views}</Text>
              </View>
            </View>

            {/* 附件 */}
            {viewItem.attachments && viewItem.attachments.length > 0 && (
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>
                  <FontAwesome6 name="paperclip" size={14} color="#6C63FF" /> 附件信息
                </Text>
                <View style={styles.attachmentGrid}>
                  {viewItem.attachments.map((att, index) => (
                    <View key={index} style={styles.attachmentItem}>
                      <FontAwesome6 name="file" size={24} color="#6C63FF" />
                      <Text style={styles.attachmentName} numberOfLines={1}>{att.filename}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* 内容 */}
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>
                <FontAwesome6 name="file-alt" size={14} color="#6C63FF" /> 知识内容
              </Text>
              <View style={styles.contentBox}>
                <Text style={styles.contentText}>{viewItem.content}</Text>
              </View>
            </View>
          </ScrollView>
        )}
      </PCModal>

      {/* 编辑/新增弹窗 */}
      <PCModal
        visible={modalVisible}
        title={editingItem ? '编辑知识' : '新增知识'}
        onClose={() => setModalVisible(false)}
        width={700}
        footer={
          <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'flex-end' }}>
            <TouchableOpacity className="pc-btn pc-btn-default" onPress={() => setModalVisible(false)}>
              <Text style={styles.btnDefaultText}>取消</Text>
            </TouchableOpacity>
            <TouchableOpacity className="pc-btn pc-btn-primary" onPress={handleSave}>
              <Text style={styles.btnPrimaryText}>保存</Text>
            </TouchableOpacity>
          </View>
        }
      >
        <View className="pc-form">
          <View className="pc-form-item">
            <Text className="pc-form-label">
              标题 <Text style={{ color: '#ff4d4f' }}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="请输入标题"
              value={formData.title}
              onChangeText={text => setFormData(prev => ({ ...prev, title: text }))}
            />
          </View>
          <View className="pc-form-item">
            <Text className="pc-form-label">分类</Text>
            <View style={styles.selectWrapper}>
              <TextInput
                style={[styles.input, { paddingHorizontal: 12 }]}
                placeholder="请输入分类"
                value={formData.category}
                onChangeText={text => setFormData(prev => ({ ...prev, category: text }))}
              />
            </View>
          </View>

          {/* 知识标签 */}
          <View className="pc-form-item">
            <Text className="pc-form-label">知识标签</Text>
            <View style={styles.tagContainer}>
              {/* 预设标签 */}
              <View style={styles.tagButtons}>
                {defaultTags.map(tag => (
                  <TouchableOpacity
                    key={tag}
                    style={[
                      styles.tagButton,
                      selectedTags.includes(tag) && styles.tagButtonActive,
                    ]}
                    onPress={() => toggleTag(tag)}
                  >
                    <Text
                      style={[
                        styles.tagButtonText,
                        selectedTags.includes(tag) && styles.tagButtonTextActive,
                      ]}
                    >
                      {tag}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {/* 自定义标签 */}
              <View style={styles.customTagRow}>
                <TextInput
                  style={[styles.input, styles.customTagInput]}
                  placeholder="添加自定义标签"
                  value={customTag}
                  onChangeText={setCustomTag}
                  onSubmitEditing={handleAddCustomTag}
                />
                <TouchableOpacity className="pc-btn pc-btn-default" onPress={handleAddCustomTag}>
                  <Text style={styles.btnDefaultText}>添加</Text>
                </TouchableOpacity>
              </View>
              {/* 已选标签显示 */}
              {selectedTags.length > 0 && (
                <View style={styles.selectedTags}>
                  {selectedTags.map(tag => (
                    <View key={tag} style={styles.selectedTag}>
                      <Text style={styles.selectedTagText}>{tag}</Text>
                      <TouchableOpacity onPress={() => handleRemoveTag(tag)}>
                        <Text style={styles.tagRemove}>×</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* 附件信息 */}
          <View className="pc-form-item">
            <Text className="pc-form-label">附件信息</Text>
            <View style={styles.attachmentArea}>
              {/* 隐藏的文件输入 */}
              <input
                type="file"
                multiple
                accept="image/*,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.pdf"
                ref={tagInput as any}
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
              {/* 已有附件列表 */}
              {attachments.length > 0 && (
                <View style={styles.attachmentList}>
                  {attachments.map((file, index) => {
                    const isImage = file.type?.startsWith('image');
                    return (
                      <View key={index} style={styles.attachmentItem}>
                        {isImage ? (
                          <Image source={{ uri: file.uri }} style={{ width: 40, height: 40, borderRadius: 4 }} />
                        ) : (
                          <View style={styles.fileIcon}>
                            <FontAwesome6 name="file" size={20} color="#95A5A6" />
                          </View>
                        )}
                        <Text style={styles.attachmentName} numberOfLines={1}>{file.name}</Text>
                        <TouchableOpacity onPress={() => handleRemoveAttachment(index)} style={styles.removeBtn}>
                          <Text style={{ color: '#FF4D4F' }}>×</Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              )}
              {/* 添加附件按钮 */}
              {attachments.length < 10 && (
                <TouchableOpacity style={styles.addAttachmentBtn} onPress={handleSelectAttachment}>
                  <FontAwesome6 name="plus" size={16} color="#1E88E5" />
                  <Text style={styles.addAttachmentText}>添加附件</Text>
                </TouchableOpacity>
              )}
              <Text style={styles.attachmentHint}>
                支持格式：JPG、PNG、GIF、Word(.doc/.docx)、Excel(.xls/.xlsx)、PPT(.ppt/.pptx)、PDF，最多10个附件
              </Text>
            </View>
          </View>

          <View className="pc-form-item">
            <Text className="pc-form-label">
              内容 <Text style={{ color: '#ff4d4f' }}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="请输入知识内容"
              value={formData.content}
              onChangeText={text => setFormData(prev => ({ ...prev, content: text }))}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
            />
          </View>
        </View>
      </PCModal>

      {/* 批量导入弹窗 */}
      <PCImportModal
        visible={importModalVisible}
        title="批量导入知识"
        onClose={() => setImportModalVisible(false)}
        templateUrl={`${API_BASE}/api/v1/knowledge/template`}
        importApiUrl={`${API_BASE}/api/v1/knowledge/import`}
        onSuccess={() => {
          setImportModalVisible(false);
          fetchItems();
        }}
      />
    </PCLayout>
  );
}

const styles = StyleSheet.create({
  btnText: {
    fontSize: 13,
  },
  btnPrimaryText: {
    color: '#fff',
    fontSize: 13,
  },
  btnDefaultText: {
    color: '#333',
    fontSize: 13,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d9d9d9',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  textarea: {
    minHeight: 160,
    textAlignVertical: 'top',
  },
  selectWrapper: {
    position: 'relative',
  },
  // 标签相关样式
  tagContainer: {
    gap: 12,
  },
  tagButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d9d9d9',
    backgroundColor: '#fff',
  },
  tagButtonActive: {
    backgroundColor: '#E6F7FF',
    borderColor: '#1890FF',
  },
  tagButtonText: {
    fontSize: 13,
    color: '#666',
  },
  tagButtonTextActive: {
    color: '#1890FF',
  },
  customTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  customTagInput: {
    flex: 1,
  },
  selectedTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#6C63FF',
    gap: 4,
  },
  selectedTagText: {
    fontSize: 12,
    color: '#fff',
  },
  tagRemove: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  // 附件相关样式
  attachmentArea: {
    borderWidth: 1,
    borderColor: '#d9d9d9',
    borderRadius: 6,
    padding: 12,
    backgroundColor: '#fafafa',
    gap: 12,
  },
  attachmentList: {
    gap: 8,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#fff',
    gap: 8,
  },
  fileIcon: {
    width: 40,
    height: 40,
    borderRadius: 4,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachmentName: {
    flex: 1,
    fontSize: 13,
    color: '#333',
  },
  removeBtn: {
    padding: 4,
  },
  addAttachmentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#1E88E5',
    borderStyle: 'dashed',
    gap: 6,
  },
  addAttachmentText: {
    fontSize: 13,
    color: '#1E88E5',
  },
  attachmentHint: {
    fontSize: 12,
    color: '#999',
  },
  // 卡片网格
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    paddingVertical: 16,
  },
  knowledgeCard: {
    width: 'calc(33.333% - 12px)',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    position: 'relative',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
    gap: 6,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    lineHeight: 22,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
  },
  contentPreview: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  tagList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  tagItem: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  tagText: {
    fontSize: 11,
    color: '#6B7280',
  },
  moreTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
  },
  moreTagText: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  attachmentIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  attachmentCount: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 16,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  authorAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  authorName: {
    fontSize: 12,
    color: '#6B7280',
  },
  viewInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewCount: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    position: 'absolute',
    top: 16,
    right: 16,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(108, 99, 255, 0.08)',
  },
  deleteBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  actionBtnText: {
    fontSize: 12,
    color: '#6C63FF',
    fontWeight: '500',
  },
  // 加载和空状态
  loadingContainer: {
    width: '100%',
    padding: 60,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  emptyContainer: {
    width: '100%',
    padding: 60,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  emptyHint: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  // 详情弹窗
  detailScrollView: {
    maxHeight: 500,
  },
  detailTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  detailCategoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  detailCategoryText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  detailTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  detailTagText: {
    fontSize: 12,
    color: '#6B7280',
  },
  detailMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  metaValue: {
    fontSize: 13,
    color: '#1F2937',
    fontWeight: '500',
  },
  detailSection: {
    marginBottom: 16,
  },
  detailSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  attachmentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  contentBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
  },
  contentText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 24,
  },
});
