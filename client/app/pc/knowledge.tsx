import React, { useState, useEffect, useCallback } from 'react';
import '@/assets/styles/pc-global.css';
import { PCLayout } from '@/components/pc/PCLayout';
import { PCTable } from '@/components/pc/PCComponents';
import { PCTag } from '@/components/pc/PCComponents';
import { PCCard } from '@/components/pc/PCComponents';
import { PCToolbar } from '@/components/pc/PCComponents';
import { PCSearchBar } from '@/components/pc/PCComponents';
import { PCModal } from '@/components/pc/PCComponents';
import { PCImportModal } from '@/components/pc/PCComponents';
import { PCPagination } from '@/components/pc/PCComponents';

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
      const sessionId = typeof window !== 'undefined' ? localStorage.getItem('session_id') : null;
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
      const sessionId = typeof window !== 'undefined' ? localStorage.getItem('session_id') : null;
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
      alert('标题和内容不能为空');
      return;
    }

    try {
      const sessionId = typeof window !== 'undefined' ? localStorage.getItem('session_id') : null;
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
      alert(editingItem ? '知识更新成功' : '知识创建成功');
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除此知识吗？')) return;

    try {
      const sessionId = typeof window !== 'undefined' ? localStorage.getItem('session_id') : null;
      const response = await fetch(`${API_BASE}/api/v1/knowledge/${id}`, {
        method: 'DELETE',
        headers: sessionId ? { 'Authorization': `Bearer ${sessionId}` } : {},
      });

      if (!response.ok) {
        throw new Error('删除失败');
      }

      fetchItems();
      alert('知识删除成功');
    } catch (error: any) {
      alert(error.message);
    }
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
    { key: 'title', title: '标题', width: 280, render: (val: string, record: Knowledge) => (
      <div>
        <div style={{ fontWeight: 500, color: '#333' }}>{val}</div>
        <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>{record.content?.substring(0, 40)}...</div>
      </div>
    )},
    { key: 'category', title: '分类', width: 100, render: (val: string) => val ? <PCTag type="primary">{val}</PCTag> : '-' },
    { key: 'tags', title: '标签', width: 180, render: (val: string[]) => val?.length ? val.map((t, i) => <PCTag key={i} style={{ marginRight: 4, marginBottom: 2 }}>{t}</PCTag>) : '-' },
    { key: 'author_name', title: '作者', width: 80, render: (val: string) => val || '未知' },
    { key: 'views', title: '浏览', width: 60, render: (val: number) => <span style={{ color: '#999' }}>{val}</span> },
    { key: 'updated_at', title: '更新时间', width: 120, render: (val: string) => val ? val.split('T')[0] : '-' },
    { key: 'actions', title: '操作', width: 180, fixed: 'right' as const, render: (_: any, record: Knowledge) => (
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="pc-btn pc-btn-text pc-btn-sm" onClick={() => setViewItem(record)}>查看</button>
        <button className="pc-btn pc-btn-text pc-btn-sm" onClick={() => handleEdit(record)}>编辑</button>
        <button className="pc-btn pc-btn-text pc-btn-sm" style={{ color: '#FF4D4F' }} onClick={() => handleDelete(record.id)}>删除</button>
      </div>
    )},
  ];

  const filteredItems = items.filter(i => {
    const matchSearch = !searchText || i.title.toLowerCase().includes(searchText.toLowerCase()) || i.content.toLowerCase().includes(searchText.toLowerCase());
    const matchCategory = !categoryFilter || i.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  return (
    <>
      <PCLayout>
        <div className="pc-page-header">
          <h1 className="pc-page-title">知识库</h1>
          <p className="pc-page-description">共 {items.length} 条知识</p>
        </div>
        <PCCard>
          <PCToolbar 
            left={<>
              <PCSearchBar 
                placeholder="搜索知识标题或内容..." 
                value={searchText} 
                onChange={setSearchText} 
                onSearch={handleSearch}
              />
              <div style={{ display: 'flex', gap: 8, marginLeft: 16 }}>
                <button 
                  className={`pc-btn pc-btn-sm ${!categoryFilter ? 'pc-btn-primary' : 'pc-btn-default'}`} 
                  onClick={() => setCategoryFilter('')}
                >
                  全部
                </button>
                {categories.map(cat => (
                  <button 
                    key={cat} 
                    className={`pc-btn pc-btn-sm ${categoryFilter === cat ? 'pc-btn-primary' : 'pc-btn-default'}`} 
                    onClick={() => setCategoryFilter(categoryFilter === cat ? '' : cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </>} 
            right={<>
              <button className="pc-btn pc-btn-default" onClick={() => setImportModalVisible(true)} style={{ marginRight: 8 }}>
                <FontAwesome6 name="upload" size={14} style={{ marginRight: 6 }} />
                批量导入
              </button>
              <button className="pc-btn pc-btn-primary" onClick={handleAdd}>+ 新增知识</button>
            </>} 
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
            onChange={(page) => setPagination(prev => ({ ...prev, current: page }))} 
          />
        </PCCard>

        {/* 查看详情弹窗 */}
        <PCModal 
          visible={!!viewItem} 
          title={viewItem?.title || ''} 
          onClose={() => setViewItem(null)} 
          width={700}
          footer={<button className="pc-btn pc-btn-default" onClick={() => setViewItem(null)}>关闭</button>}
        >
          {viewItem && (
            <div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                {viewItem.category && <PCTag type="primary">{viewItem.category}</PCTag>}
                {viewItem.tags?.map((t, i) => <PCTag key={i}>{t}</PCTag>)}
              </div>
              <div style={{ color: '#666', fontSize: 13, marginBottom: 16 }}>
                作者: {viewItem.author_name || '未知'} | 更新时间: {viewItem.updated_at ? viewItem.updated_at.split('T')[0] : '-'} | 浏览: {viewItem.views}
              </div>
              <div style={{ 
                lineHeight: 1.8, 
                color: '#333',
                padding: '16px',
                background: '#f5f5f5',
                borderRadius: 8,
                maxHeight: 400,
                overflow: 'auto'
              }}>
                {viewItem.content}
              </div>
            </div>
          )}
        </PCModal>

        {/* 编辑/新增弹窗 */}
        <PCModal 
          visible={modalVisible} 
          title={editingItem ? '编辑知识' : '新增知识'} 
          onClose={() => setModalVisible(false)} 
          width={600}
          footer={
            <>
              <button className="pc-btn pc-btn-default" onClick={() => setModalVisible(false)}>取消</button>
              <button className="pc-btn pc-btn-primary" onClick={handleSave}>保存</button>
            </>
          }
        >
          <div className="pc-form">
            <div className="pc-form-item">
              <label className="pc-form-label">标题 <span style={{ color: '#ff4d4f' }}>*</span></label>
              <input 
                type="text" 
                className="pc-form-control" 
                placeholder="请输入标题" 
                value={formData.title} 
                onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))} 
              />
            </div>
            <div className="pc-form-item">
              <label className="pc-form-label">分类</label>
              <select 
                className="pc-form-control pc-form-select" 
                value={formData.category} 
                onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
              >
                <option value="">请选择分类</option>
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div className="pc-form-item">
              <label className="pc-form-label">标签</label>
              <input 
                type="text" 
                className="pc-form-control" 
                placeholder="多个标签用逗号分隔，如：维修,保养,培训" 
                value={formData.tags} 
                onChange={e => setFormData(prev => ({ ...prev, tags: e.target.value }))} 
              />
            </div>
            <div className="pc-form-item">
              <label className="pc-form-label">内容 <span style={{ color: '#ff4d4f' }}>*</span></label>
              <textarea 
                className="pc-form-control pc-form-textarea" 
                rows={8} 
                placeholder="请输入知识内容" 
                value={formData.content} 
                onChange={e => setFormData(prev => ({ ...prev, content: e.target.value }))} 
              />
            </div>
          </div>
        </PCModal>
      </PCLayout>
    </>
  );
}
