import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { PCLayout } from '@/components/pc/PCLayout';
import { PCTable } from '@/components/pc/PCComponents';
import { PCTag } from '@/components/pc/PCComponents';
import { PCCard } from '@/components/pc/PCComponents';
import { PCToolbar } from '@/components/pc/PCComponents';
import { PCSearchBar } from '@/components/pc/PCComponents';
import { PCModal } from '@/components/pc/PCComponents';
import { PCImportModal } from '@/components/pc/PCComponents';
import { PCPagination } from '@/components/pc/PCComponents';
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
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

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

  const columns = [
    {
      key: 'title',
      title: '标题',
      width: 280,
      render: (val: string, record: Knowledge) => (
        <View>
          <Text style={{ fontWeight: 500, color: '#333' }}>{val}</Text>
          <Text style={{ fontSize: 12, color: '#999', marginTop: 2 }}>{record.content?.substring(0, 40)}...</Text>
        </View>
      ),
    },
    {
      key: 'category',
      title: '分类',
      width: 100,
      render: (val: string) => (val ? <PCTag type="primary">{val}</PCTag> : <Text>-</Text>),
    },
    {
      key: 'tags',
      title: '标签',
      width: 180,
      render: (val: string[]) =>
        val?.length ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {val.map((t, i) => (
              <PCTag key={i} style={{ marginRight: 4, marginBottom: 2 }}>
                {t}
              </PCTag>
            ))}
          </View>
        ) : (
          <Text>-</Text>
        ),
    },
    {
      key: 'author_name',
      title: '作者',
      width: 80,
      render: (val: string) => <Text>{val || '未知'}</Text>,
    },
    {
      key: 'views',
      title: '浏览',
      width: 60,
      render: (val: number) => <Text style={{ color: '#999' }}>{val}</Text>,
    },
    {
      key: 'updated_at',
      title: '更新时间',
      width: 120,
      render: (val: string) => <Text>{val ? val.split('T')[0] : '-'}</Text>,
    },
    {
      key: 'actions',
      title: '操作',
      width: 180,
      fixed: 'right' as const,
      render: (_: any, record: Knowledge) => (
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity className="pc-btn pc-btn-text pc-btn-sm" onPress={() => setViewItem(record)}>
            <Text style={styles.btnText}>查看</Text>
          </TouchableOpacity>
          <TouchableOpacity className="pc-btn pc-btn-text pc-btn-sm" onPress={() => handleEdit(record)}>
            <Text style={styles.btnText}>编辑</Text>
          </TouchableOpacity>
          <TouchableOpacity className="pc-btn pc-btn-text pc-btn-sm" onPress={() => handleDelete(record.id)}>
            <Text style={[styles.btnText, { color: '#FF4D4F' }]}>删除</Text>
          </TouchableOpacity>
        </View>
      ),
    },
  ];

  const filteredItems = items.filter(i => {
    const matchSearch =
      !searchText ||
      i.title.toLowerCase().includes(searchText.toLowerCase()) ||
      i.content.toLowerCase().includes(searchText.toLowerCase());
    const matchCategory = !categoryFilter || i.category === categoryFilter;
    return matchSearch && matchCategory;
  });

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
        <PCTable
          columns={columns}
          data={filteredItems}
          rowKey="id"
          loading={loading}
          selectedRowKeys={selectedRowKeys}
          onSelectChange={setSelectedRowKeys}
        />
        <PCPagination
          current={pagination.current}
          pageSize={pagination.pageSize}
          total={pagination.total}
          onChange={page => setPagination(prev => ({ ...prev, current: page }))}
        />
      </PCCard>

      {/* 查看详情弹窗 */}
      <PCModal
        visible={!!viewItem}
        title={viewItem?.title || ''}
        onClose={() => setViewItem(null)}
        width={700}
        footer={
          <TouchableOpacity className="pc-btn pc-btn-default" onPress={() => setViewItem(null)}>
            <Text style={styles.btnDefaultText}>关闭</Text>
          </TouchableOpacity>
        }
      >
        {viewItem && (
          <View>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              {viewItem.category && <PCTag type="primary">{viewItem.category}</PCTag>}
              {viewItem.tags?.map((t, i) => (
                <PCTag key={i}>{t}</PCTag>
              ))}
            </View>
            <View style={{ color: '#666', fontSize: 13, marginBottom: 16 }}>
              <Text>作者: {viewItem.author_name || '未知'} | 更新时间: {viewItem.updated_at ? viewItem.updated_at.split('T')[0] : '-'} | 浏览: {viewItem.views}</Text>
            </View>
            <View
              style={{
                lineHeight: 28.8,
                color: '#333',
                padding: 16,
                backgroundColor: '#f5f5f5',
                borderRadius: 8,
                maxHeight: 400,
              }}
            >
              <ScrollView style={{ maxHeight: 368 }}>
                <Text>{viewItem.content}</Text>
              </ScrollView>
            </View>
          </View>
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
                          <img src={file.uri} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }} />
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
    marginTop: 8,
  },
  selectedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: '#E6F7FF',
    borderWidth: 1,
    borderColor: '#1890FF',
  },
  selectedTagText: {
    fontSize: 13,
    color: '#1890FF',
  },
  tagRemove: {
    fontSize: 16,
    color: '#1890FF',
    fontWeight: 'bold',
  },
  // 附件相关样式
  attachmentArea: {
    gap: 12,
  },
  attachmentList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#F5F7FA',
    borderRadius: 6,
    maxWidth: 200,
  },
  fileIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 4,
  },
  attachmentName: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  removeBtn: {
    padding: 4,
  },
  addAttachmentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#1E88E5',
    borderStyle: 'dashed',
    alignSelf: 'flex-start',
  },
  addAttachmentText: {
    fontSize: 13,
    color: '#1E88E5',
  },
  attachmentHint: {
    fontSize: 12,
    color: '#999',
  },
});
