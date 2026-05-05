import React, { useState, useEffect, useCallback, useRef } from 'react';
import '@/assets/styles/pc-global.css';
import { PCLayout } from '@/components/pc/PCLayout';
import { PCTable } from '@/components/pc/PCComponents';
import { PCTag } from '@/components/pc/PCComponents';
import { PCCard } from '@/components/pc/PCComponents';
import { PCToolbar } from '@/components/pc/PCComponents';
import { PCSearchBar } from '@/components/pc/PCComponents';
import { PCModal } from '@/components/pc/PCComponents';
import { PCPagination } from '@/components/pc/PCComponents';

import { storage } from '@/utils/storage';
import { getApiBaseUrl } from '@/utils/api';
const API_BASE = getApiBaseUrl();

interface FileItem {
  id: number;
  file_name: string;
  original_name: string;
  file_type: string;
  file_size: number;
  file_path?: string;
  file_url?: string;
  category: string;
  description?: string;
  tags: string[];
  uploader_name: string;
  download_count: number;
  created_at: string;
}

const fileTypeIcons: Record<string, { icon: string; color: string }> = {
  xlsx: { icon: '📊', color: '#52C41A' },
  xls: { icon: '📊', color: '#52C41A' },
  doc: { icon: '📄', color: '#1890FF' },
  docx: { icon: '📄', color: '#1890FF' },
  pdf: { icon: '📕', color: '#FF4D4F' },
  ppt: { icon: '📙', color: '#FAAD14' },
  pptx: { icon: '📙', color: '#FAAD14' },
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const categories = ['项目文档', '会议记录', '技术资料', '合同文件', '培训资料', '其他'];

export default function PCFiles() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [modalVisible, setModalVisible] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({ category: '', description: '', tags: '' });
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const sessionId = await storage.getItem('session_id');
      const response = await fetch(`${API_BASE}/api/v1/files`, {
        headers: sessionId ? { 'Authorization': `Bearer ${sessionId}` } : {},
      });
      const data = await response.json();
      const list = Array.isArray(data) ? data : (data.files || []);
      setFiles(list);
      setPagination(prev => ({ ...prev, total: list.length }));
    } catch (error) {
      console.error('Fetch files error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchFiles(); }, [fetchFiles]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 检查文件类型
      const allowedTypes = ['.xlsx', '.xls', '.doc', '.docx', '.ppt', '.pptx', '.pdf'];
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!allowedTypes.includes(ext)) {
        alert('只允许上传 Excel、Word、PPT、PDF 格式文件');
        return;
      }
      setSelectedFile(file);
      setModalVisible(true);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('请选择文件');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const sessionId = await storage.getItem('session_id');
      const formDataObj = new FormData();
      formDataObj.append('file', selectedFile);
      formDataObj.append('category', formData.category || '未分类');
      formDataObj.append('description', formData.description || '');
      formDataObj.append('tags', JSON.stringify(formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(t => t) : []));

      // 模拟上传进度
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch(`${API_BASE}/api/v1/files`, {
        method: 'POST',
        headers: sessionId ? { 'Authorization': `Bearer ${sessionId}` } : {},
        body: formDataObj,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        throw new Error('上传失败');
      }

      alert('文件上传成功');
      setModalVisible(false);
      setSelectedFile(null);
      setFormData({ category: '', description: '', tags: '' });
      fetchFiles();
    } catch (error: any) {
      alert('上传失败: ' + error.message);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDownload = async (file: FileItem) => {
    try {
      const sessionId = await storage.getItem('session_id');
      
      // 获取文件下载链接
      const response = await fetch(`${API_BASE}/api/v1/files/${file.id}/download`, {
        headers: sessionId ? { 'Authorization': `Bearer ${sessionId}` } : {},
      });

      if (!response.ok) {
        throw new Error('文件不存在');
      }

      // 获取文件名
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = file.original_name;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (match) {
          filename = match[1].replace(/['"]/g, '');
        }
      }

      // 创建Blob并下载
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // 更新下载次数
      await fetch(`${API_BASE}/api/v1/files/${file.id}/download`, {
        method: 'POST',
        headers: sessionId ? { 'Authorization': `Bearer ${sessionId}` } : {},
      });

      fetchFiles();
    } catch (error: any) {
      alert('下载失败: ' + error.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除此文件吗？')) return;

    try {
      const sessionId = await storage.getItem('session_id');
      const response = await fetch(`${API_BASE}/api/v1/files/${id}`, {
        method: 'DELETE',
        headers: sessionId ? { 'Authorization': `Bearer ${sessionId}` } : {},
      });

      if (!response.ok) {
        throw new Error('删除失败');
      }

      alert('文件删除成功');
      fetchFiles();
    } catch (error: any) {
      alert('删除失败: ' + error.message);
    }
  };

  const columns = [
    { key: 'original_name', title: '文件名', width: 280, render: (val: string, record: FileItem) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 20 }}>{fileTypeIcons[record.file_type]?.icon || '📁'}</span>
        <div>
          <div style={{ fontWeight: 500, color: '#333' }}>{val}</div>
          <div style={{ fontSize: 12, color: '#999' }}>{formatFileSize(record.file_size)}</div>
        </div>
      </div>
    )},
    { key: 'file_type', title: '类型', width: 70, render: (val: string) => (
      <span style={{ textTransform: 'uppercase', color: '#999', fontSize: 12 }}>{val}</span>
    )},
    { key: 'category', title: '分类', width: 90, render: (val: string) => val ? <PCTag type="primary">{val}</PCTag> : '-' },
    { key: 'tags', title: '标签', width: 150, render: (val: string[]) => val?.slice(0, 2).map((t, i) => <PCTag key={i} style={{ marginRight: 4, marginBottom: 2 }}>{t}</PCTag>) },
    { key: 'uploader_name', title: '上传人', width: 80, render: (val: string) => val || '未知' },
    { key: 'created_at', title: '上传时间', width: 110, render: (val: string) => val ? val.split('T')[0] : '-' },
    { key: 'download_count', title: '下载', width: 60, render: (val: number) => <span style={{ color: '#4F8EF7' }}>{val || 0}</span> },
    { key: 'actions', title: '操作', width: 160, fixed: 'right' as const, render: (_: any, record: FileItem) => (
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="pc-btn pc-btn-text pc-btn-sm" onClick={() => handleDownload(record)}>下载</button>
        <button className="pc-btn pc-btn-text pc-btn-sm" style={{ color: '#FF4D4F' }} onClick={() => handleDelete(record.id)}>删除</button>
      </div>
    )},
  ];

  const filteredFiles = files.filter(f => {
    const matchSearch = !searchText || f.original_name.toLowerCase().includes(searchText.toLowerCase()) || f.description?.toLowerCase().includes(searchText.toLowerCase());
    const matchCategory = !categoryFilter || f.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  return (
    <>
      <PCLayout>
        <div className="pc-page-header">
          <h1 className="pc-page-title">文件管理</h1>
          <p className="pc-page-description">统一管理项目文件，包括合同、文档、报表等资料</p>
        </div>
        <PCCard>
          <PCToolbar 
            left={
              <>
                <PCSearchBar 
                  placeholder="搜索文件名或描述..." 
                  value={searchText} 
                  onChange={setSearchText} 
                  onSearch={() => {}}
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
              </>
            } 
            right={
              <>
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  accept=".xlsx,.xls,.doc,.docx,.ppt,.pptx,.pdf"
                  onChange={handleFileSelect}
                />
                <button className="pc-btn pc-btn-primary" onClick={() => fileInputRef.current?.click()}>
                  + 上传文件
                </button>
              </>
            } 
          />
          <PCTable 
            columns={columns} 
            data={filteredFiles} 
            rowKey="id" 
            loading={loading} 
          />
          <PCPagination 
            current={pagination.current} 
            pageSize={pagination.pageSize} 
            total={pagination.total} 
            onChange={(page) => setPagination(prev => ({ ...prev, current: page }))} 
          />
        </PCCard>
      </PCLayout>

      {/* 上传弹窗 */}
      <PCModal 
        visible={modalVisible} 
        title="上传文件" 
        onClose={() => { setModalVisible(false); setSelectedFile(null); }} 
        width={500}
        footer={
          <>
            <button className="pc-btn pc-btn-default" onClick={() => { setModalVisible(false); setSelectedFile(null); }}>取消</button>
            <button className="pc-btn pc-btn-primary" onClick={handleUpload} disabled={uploading || !selectedFile}>
              {uploading ? '上传中...' : '开始上传'}
            </button>
          </>
        }
      >
        <div className="pc-form">
          <div className="pc-form-item">
            <label className="pc-form-label">已选文件</label>
            <div style={{ padding: '12px', background: '#f5f5f5', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 24 }}>
                {selectedFile ? fileTypeIcons[selectedFile.name.split('.').pop()?.toLowerCase() || '']?.icon || '📁' : '📁'}
              </span>
              <div>
                <div style={{ fontWeight: 500 }}>{selectedFile?.name}</div>
                <div style={{ fontSize: 12, color: '#999' }}>{selectedFile ? formatFileSize(selectedFile.size) : ''}</div>
              </div>
            </div>
          </div>

          {uploading && (
            <div className="pc-form-item">
              <label className="pc-form-label">上传进度</label>
              <div style={{ padding: '12px', background: '#f5f5f5', borderRadius: 8 }}>
                <div style={{ height: 8, background: '#e0e0e0', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ 
                    width: `${uploadProgress}%`, 
                    height: '100%', 
                    background: 'linear-gradient(90deg, #667eea, #764ba2)', 
                    transition: 'width 0.2s' 
                  }} />
                </div>
                <div style={{ fontSize: 12, color: '#666', marginTop: 8, textAlign: 'center' }}>{uploadProgress}%</div>
              </div>
            </div>
          )}

          <div className="pc-form-item">
            <label className="pc-form-label">文件分类</label>
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
            <label className="pc-form-label">文件描述</label>
            <textarea 
              className="pc-form-control pc-form-textarea"
              rows={3}
              placeholder="请输入文件描述（可选）"
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <div className="pc-form-item">
            <label className="pc-form-label">文件标签</label>
            <input 
              type="text" 
              className="pc-form-control"
              placeholder="多个标签用逗号分隔，如：报表,项目,2024"
              value={formData.tags}
              onChange={e => setFormData(prev => ({ ...prev, tags: e.target.value }))}
            />
          </div>
        </div>
      </PCModal>
    </>
  );
}
