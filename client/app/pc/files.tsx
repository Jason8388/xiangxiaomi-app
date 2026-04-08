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

interface FileItem {
  id: number;
  file_name: string;
  original_name: string;
  file_type: string;
  file_size: number;
  file_url: string;
  upload_time: string;
  download_count: number;
  uploader_name: string;
  tags: string[];
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

export default function PCFiles() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [searchText, setSearchText] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/v1/files`);
      const data = await response.json();
      const list = Array.isArray(data) ? data : (data.files || []);
      setFiles(list);
      setPagination(prev => ({ ...prev, total: list.length }));
    } catch (error) {
      setFiles([
        { id: 1, file_name: '项目进度报告.xlsx', original_name: '项目进度报告.xlsx', file_type: 'xlsx', file_size: 1024000, file_url: '#', upload_time: '2024-03-20', download_count: 15, uploader_name: '张三', tags: ['报表', '项目'] },
        { id: 2, file_name: '会议纪要.docx', original_name: '会议纪要.docx', file_type: 'docx', file_size: 512000, file_url: '#', upload_time: '2024-03-18', download_count: 8, uploader_name: '李四', tags: ['会议'] },
        { id: 3, file_name: '技术方案.pdf', original_name: '技术方案.pdf', file_type: 'pdf', file_size: 2048000, file_url: '#', upload_time: '2024-03-15', download_count: 22, uploader_name: '王五', tags: ['技术'] },
        { id: 4, file_name: '产品介绍.pptx', original_name: '产品介绍.pptx', file_type: 'pptx', file_size: 3584000, file_url: '#', upload_time: '2024-03-10', download_count: 35, uploader_name: '赵六', tags: ['产品'] },
      ]);
      setPagination(prev => ({ ...prev, total: 4 }));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchFiles(); }, [fetchFiles]);

  const columns = [
    { key: 'original_name', title: '文件名', width: 250, render: (val: string, record: FileItem) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 20 }}>{fileTypeIcons[record.file_type]?.icon || '📁'}</span>
        <span>{val}</span>
      </div>
    )},
    { key: 'file_type', title: '类型', width: 60, render: (val: string) => <span style={{ textTransform: 'uppercase', color: '#999' }}>{val}</span> },
    { key: 'file_size', title: '大小', width: 80, render: (val: number) => formatFileSize(val) },
    { key: 'tags', title: '标签', width: 150, render: (val: string[]) => val?.slice(0, 2).map(t => <PCTag key={t} style={{ marginRight: 4 }}>{t}</PCTag>) },
    { key: 'uploader_name', title: '上传人', width: 80 },
    { key: 'upload_time', title: '上传时间', width: 100 },
    { key: 'download_count', title: '下载', width: 60, render: (val: number) => <span style={{ color: '#4F8EF7' }}>{val}</span> },
    { key: 'actions', title: '操作', width: 160, render: (_: any, record: FileItem) => (
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="pc-btn pc-btn-text pc-btn-sm" onClick={() => window.open(record.file_url, '_blank')}>下载</button>
        <button className="pc-btn pc-btn-text pc-btn-sm" style={{ color: '#FF4D4F' }} onClick={() => { if (confirm('确定删除吗？')) setFiles(prev => prev.filter(f => f.id !== record.id)); }}>删除</button>
      </div>
    ) },
  ];

  const filteredFiles = files.filter(f => {
    const matchSearch = !searchText || f.original_name.includes(searchText);
    const matchType = !typeFilter || f.file_type === typeFilter;
    return matchSearch && matchType;
  });

  const fileTypes = [...new Set(files.map(f => f.file_type))];

  return (
    <>
      <style>{`<style>@import url('/assets/styles/pc-global.css');</style>`}</style>
      <PCLayout>
        <div className="pc-page-header"><h1 className="pc-page-title">文件管理</h1><p className="pc-page-description">统一管理项目文件，包括合同、文档、报表等资料</p></div>
        <PCCard>
          <PCToolbar left={<><PCSearchBar placeholder="搜索文件名..." value={searchText} onChange={setSearchText} onSearch={() => {}} /><div style={{ display: 'flex', gap: 8 }}><button className={`pc-btn pc-btn-sm ${!typeFilter ? 'pc-btn-primary' : 'pc-btn-default'}`} onClick={() => setTypeFilter('')}>全部</button>{fileTypes.map(type => (<button key={type} className={`pc-btn pc-btn-sm ${typeFilter === type ? 'pc-btn-primary' : 'pc-btn-default'}`} onClick={() => setTypeFilter(typeFilter === type ? '' : type)}>{type.toUpperCase()}</button>))}</div></>} right={<button className="pc-btn pc-btn-primary">+ 上传文件</button>} />
          <PCTable columns={columns} data={filteredFiles} rowKey="id" loading={loading} selectedRowKeys={selectedRowKeys} onSelectChange={setSelectedRowKeys} />
          <PCPagination current={pagination.current} pageSize={pagination.pageSize} total={pagination.total} onChange={(page) => setPagination(prev => ({ ...prev, current: page }))} />
        </PCCard>
      </PCLayout>
    </>
  );
}
