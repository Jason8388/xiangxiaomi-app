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
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  const categories = ['设备维护', '操作手册', '故障排除', '技术文档', '培训资料'];

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

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(sessionId ? { 'Authorization': `Bearer ${sessionId}` } : {}),
        },
        body: JSON.stringify({
          title: formData.title,
          category: formData.category,
          content: formData.content,
          tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(t => t) : [],
        }),
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
    setModalVisible(true);
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
        width={600}
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
          <View className="pc-form-item">
            <Text className="pc-form-label">标签</Text>
            <TextInput
              style={styles.input}
              placeholder="多个标签用逗号分隔，如：维修,保养,培训"
              value={formData.tags}
              onChangeText={text => setFormData(prev => ({ ...prev, tags: text }))}
            />
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
});
