import React, { useState, useEffect, useCallback } from 'react';
import { PCLayout } from '@/components/pc/PCLayout';
import { PCTable } from '@/components/pc/PCComponents';
import { PCTag } from '@/components/pc/PCComponents';
import { PCCard } from '@/components/pc/PCComponents';
import { PCToolbar } from '@/components/pc/PCComponents';
import { PCSearchBar } from '@/components/pc/PCComponents';
import { PCModal } from '@/components/pc/PCComponents';
import { PCPagination } from '@/components/pc/PCComponents';

const API_BASE = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || 'http://localhost:9091';

interface Knowledge {
  id: number;
  title: string;
  category: string;
  tags: string[];
  content: string;
  author: string;
  created_at: string;
  views: number;
}

export default function PCKnowledge() {
  const [items, setItems] = useState<Knowledge[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
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
      const response = await fetch(`${API_BASE}/api/v1/knowledge`);
      const data = await response.json();
      const list = Array.isArray(data) ? data : (data.knowledge || []);
      setItems(list);
      setPagination(prev => ({ ...prev, total: list.length }));
    } catch (error) {
      setItems([
        { id: 1, title: '变频器日常维护指南', category: '设备维护', tags: ['变频器', '维护'], content: '详细说明了变频器的日常维护步骤和注意事项...', author: '管理员', created_at: '2024-03-15', views: 156 },
        { id: 2, title: 'PLC编程入门教程', category: '技术文档', tags: ['PLC', '编程'], content: '本教程介绍PLC的基本原理和编程方法...', author: '技术部', created_at: '2024-03-10', views: 289 },
        { id: 3, title: '常见故障代码及解决方案', category: '故障排除', tags: ['故障', '代码'], content: '汇总了设备常见的故障代码及对应的解决方案...', author: '售后部', created_at: '2024-03-05', views: 423 },
      ]);
      setPagination(prev => ({ ...prev, total: 3 }));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const columns = [
    { key: 'title', title: '标题', width: 250 },
    { key: 'category', title: '分类', width: 100, render: (val: string) => <PCTag type="primary">{val}</PCTag> },
    { key: 'tags', title: '标签', width: 150, render: (val: string[]) => val?.map(t => <PCTag key={t} style={{ marginRight: 4 }}>{t}</PCTag>) },
    { key: 'author', title: '作者', width: 80 },
    { key: 'views', title: '浏览', width: 60, render: (val: number) => <span style={{ color: '#999' }}>{val}</span> },
    { key: 'created_at', title: '更新时间', width: 100 },
    { key: 'actions', title: '操作', width: 180, render: (_: any, record: Knowledge) => (
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="pc-btn pc-btn-text pc-btn-sm" onClick={() => setViewItem(record)}>查看</button>
        <button className="pc-btn pc-btn-text pc-btn-sm" onClick={() => { setEditingItem(record); setFormData({ title: record.title, category: record.category, tags: record.tags.join(','), content: record.content }); setModalVisible(true); }}>编辑</button>
        <button className="pc-btn pc-btn-text pc-btn-sm" style={{ color: '#FF4D4F' }} onClick={() => { if (confirm('确定删除吗？')) setItems(prev => prev.filter(i => i.id !== record.id)); }}>删除</button>
      </div>
    ) },
  ];

  const filteredItems = items.filter(i => {
    const matchSearch = !searchText || i.title.includes(searchText) || i.content.includes(searchText);
    const matchCategory = !categoryFilter || i.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  return (
    <>
      <style>{`<style>@import url('/assets/styles/pc-global.css');</style>`}</style>
      <PCLayout>
        <div className="pc-page-header"><h1 className="pc-page-title">知识库</h1><p className="pc-page-description">管理技术文档、操作手册、培训资料等知识内容</p></div>
        <PCCard>
          <PCToolbar left={<><PCSearchBar placeholder="搜索知识库..." value={searchText} onChange={setSearchText} onSearch={() => {}} /><div style={{ display: 'flex', gap: 8 }}><button key="" className={`pc-btn pc-btn-sm ${!categoryFilter ? 'pc-btn-primary' : 'pc-btn-default'}`} onClick={() => setCategoryFilter('')}>全部</button>{categories.map(cat => (<button key={cat} className={`pc-btn pc-btn-sm ${categoryFilter === cat ? 'pc-btn-primary' : 'pc-btn-default'}`} onClick={() => setCategoryFilter(categoryFilter === cat ? '' : cat)}>{cat}</button>))}</div></>} right={<button className="pc-btn pc-btn-primary" onClick={() => { setEditingItem(null); setFormData({ title: '', category: '', tags: '', content: '' }); setModalVisible(true); }}>+ 新增知识</button>} />
          <PCTable columns={columns} data={filteredItems} rowKey="id" loading={loading} selectedRowKeys={selectedRowKeys} onSelectChange={setSelectedRowKeys} />
          <PCPagination current={pagination.current} pageSize={pagination.pageSize} total={pagination.total} onChange={(page) => setPagination(prev => ({ ...prev, current: page }))} />
        </PCCard>

        {/* 查看详情弹窗 */}
        <PCModal visible={!!viewItem} title={viewItem?.title || ''} onClose={() => setViewItem(null)} width={700}
          footer={<button className="pc-btn pc-btn-default" onClick={() => setViewItem(null)}>关闭</button>}
        >
          {viewItem && (
            <div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <PCTag type="primary">{viewItem.category}</PCTag>
                {viewItem.tags?.map(t => <PCTag key={t}>{t}</PCTag>)}
              </div>
              <div style={{ color: '#666', fontSize: 13, marginBottom: 16 }}>
                作者: {viewItem.author} | 更新时间: {viewItem.created_at} | 浏览: {viewItem.views}
              </div>
              <div style={{ lineHeight: 1.8, color: '#333' }}>
                {viewItem.content}
              </div>
            </div>
          )}
        </PCModal>

        {/* 编辑弹窗 */}
        <PCModal visible={modalVisible} title={editingItem ? '编辑知识' : '新增知识'} onClose={() => setModalVisible(false)} width={600}
          footer={<><button className="pc-btn pc-btn-default" onClick={() => setModalVisible(false)}>取消</button><button className="pc-btn pc-btn-primary" onClick={() => { const newItem = { ...formData, tags: formData.tags.split(',').filter(t => t.trim()) }; if (editingItem) { setItems(prev => prev.map(i => i.id === editingItem.id ? { ...i, ...newItem } : i)); } else { setItems(prev => [...prev, { id: Date.now(), ...newItem, author: '管理员', created_at: new Date().toISOString().split('T')[0], views: 0 }]); setPagination(prev => ({ ...prev, total: prev.total + 1 })); } setModalVisible(false); }}>保存</button></>}
        >
          <div className="pc-form">
            <div className="pc-form-item"><label className="pc-form-label">标题</label><input type="text" className="pc-form-control" value={formData.title} onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))} /></div>
            <div className="pc-form-item"><label className="pc-form-label">分类</label><select className="pc-form-control pc-form-select" value={formData.category} onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}><option value="">请选择</option>{categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select></div>
            <div className="pc-form-item"><label className="pc-form-label">标签</label><input type="text" className="pc-form-control" placeholder="多个标签用逗号分隔" value={formData.tags} onChange={e => setFormData(prev => ({ ...prev, tags: e.target.value }))} /></div>
            <div className="pc-form-item"><label className="pc-form-label">内容</label><textarea className="pc-form-control pc-form-textarea" rows={8} value={formData.content} onChange={e => setFormData(prev => ({ ...prev, content: e.target.value }))} /></div>
          </div>
        </PCModal>
      </PCLayout>
    </>
  );
}
