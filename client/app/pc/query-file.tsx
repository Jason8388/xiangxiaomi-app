import React, { useState } from 'react';
import '@/assets/styles/pc-global.css';
import { PCLayout } from '@/components/pc/PCLayout';
import { FontAwesome6 } from '@expo/vector-icons';
import { storage } from '@/utils/storage';
import { getApiBaseUrl } from '@/utils/api';

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

export default function PCQueryFile() {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [results, setResults] = useState<QueryFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!searchKeyword.trim()) {
      alert('请输入搜索关键词');
      return;
    }

    try {
      setLoading(true);
      const sessionId = await storage.getItem('session_id');
      const response = await fetch(
        `${getApiBaseUrl()}/api/v1/query/files?keyword=${encodeURIComponent(searchKeyword)}`,
        sessionId ? { headers: { 'x-session-id': sessionId } } : {}
      );
      const data = await response.json();
      if (response.ok) {
        setResults(data);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
      setHasSearched(true);
    }
  };

  const getFileIcon = (fileType: string) => {
    const type = fileType?.toLowerCase() || '';
    if (type.includes('pdf')) return 'file-pdf';
    if (type.includes('word') || type.includes('doc')) return 'file-word';
    if (type.includes('excel') || type.includes('xls') || type.includes('csv')) return 'file-excel';
    if (type.includes('image') || type.includes('png') || type.includes('jpg') || type.includes('jpeg') || type.includes('gif')) return 'file-image';
    if (type.includes('video') || type.includes('mp4') || type.includes('mov')) return 'file-video';
    if (type.includes('audio') || type.includes('mp3') || type.includes('wav')) return 'file-audio';
    if (type.includes('zip') || type.includes('rar') || type.includes('7z')) return 'file-zipper';
    return 'file';
  };

  const getFileIconColor = (fileType: string) => {
    const type = fileType?.toLowerCase() || '';
    if (type.includes('pdf')) return '#E74C3C';
    if (type.includes('word') || type.includes('doc')) return '#3498DB';
    if (type.includes('excel') || type.includes('xls') || type.includes('csv')) return '#2ECC71';
    if (type.includes('image') || type.includes('png') || type.includes('jpg') || type.includes('jpeg') || type.includes('gif')) return '#9B59B6';
    return '#95A5A6';
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <PCLayout>
      <div className="pc-page-header">
        <h1 className="pc-page-title">文件查询</h1>
        <p className="pc-page-description">快速查询附件信息</p>
      </div>

      {/* 搜索框 */}
      <div className="pc-card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <FontAwesome6 
              name="magnifying-glass" 
              size={16} 
              color="#636E72" 
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              placeholder="输入客户、项目、设备名称、文件名"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              style={{
                width: '100%',
                padding: '12px 12px 12px 40px',
                border: '1px solid #E0E0E0',
                borderRadius: 8,
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <button 
            className="pc-btn pc-btn-primary"
            onClick={handleSearch}
            disabled={loading}
            style={{ padding: '12px 24px' }}
          >
            {loading ? '查询中...' : '搜索'}
          </button>
        </div>
        
        {/* 搜索提示 */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 8, 
          marginTop: 12,
          padding: '10px 12px',
          backgroundColor: 'rgba(46, 204, 113, 0.1)',
          borderRadius: 6,
        }}>
          <FontAwesome6 name="circle-info" size={14} color="#2ECC71" />
          <span style={{ fontSize: 13, color: '#2ECC71' }}>
            支持按客户名称、项目名称、设备名称、文件名多维度检索附件
          </span>
        </div>
      </div>

      {/* 搜索结果 */}
      {loading ? (
        <div className="pc-card" style={{ textAlign: 'center', padding: 48 }}>
          <FontAwesome6 name="spinner" size={32} color="#2ECC71" spin />
          <p style={{ marginTop: 16, color: '#636E72' }}>查询中...</p>
        </div>
      ) : hasSearched && results.length === 0 ? (
        <div className="pc-card" style={{ textAlign: 'center', padding: 48 }}>
          <FontAwesome6 name="folder-xmark" size={48} color="#95A5A6" />
          <p style={{ marginTop: 16, color: '#636E72' }}>未找到相关文件</p>
        </div>
      ) : !hasSearched ? (
        <div className="pc-card" style={{ textAlign: 'center', padding: 48 }}>
          <FontAwesome6 name="folder" size={48} color="#95A5A6" />
          <p style={{ marginTop: 16, color: '#636E72' }}>请输入关键词进行搜索</p>
        </div>
      ) : (
        <div>
          <div style={{ marginBottom: 12, color: '#636E72', fontSize: 14, fontWeight: 500 }}>
            查询结果（{results.length}）
          </div>
          
          {results.map((file) => (
            <div
              key={file.id}
              className="pc-card"
              style={{ 
                marginBottom: 12,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {/* 头部信息 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
                <div style={{
                  width: 56,
                  height: 56,
                  borderRadius: 12,
                  backgroundColor: `${getFileIconColor(file.file_type)}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <FontAwesome6 name={getFileIcon(file.file_type) as any} size={24} color={getFileIconColor(file.file_type)} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 600, color: '#2D3436', marginBottom: 4 }}>
                    {file.file_name}
                  </h3>
                  <p style={{ fontSize: 12, color: '#95A5A6', margin: 0 }}>
                    {formatFileSize(file.file_size)} · {file.uploaded_by || '未知上传者'}
                  </p>
                </div>
                <a 
                  href={`${getApiBaseUrl()}${file.file_url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: '8px 16px',
                    borderRadius: 6,
                    backgroundColor: '#1E88E5',
                    color: '#FFFFFF',
                    textDecoration: 'none',
                    fontSize: 12,
                    fontWeight: 500,
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  下载
                </a>
              </div>

              {/* 关联信息 */}
              {(file.customer_name || file.project_name || file.device_name) && (
                <div style={{ 
                  backgroundColor: '#F5F7FA',
                  borderRadius: 8,
                  padding: 10,
                  marginBottom: 12,
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 8,
                }}>
                  {file.customer_name && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <FontAwesome6 name="building" size={11} color="#636E72" />
                      <span style={{ fontSize: 11, color: '#636E72' }}>{file.customer_name}</span>
                    </div>
                  )}
                  {file.project_name && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <FontAwesome6 name="folder-open" size={11} color="#636E72" />
                      <span style={{ fontSize: 11, color: '#636E72' }}>{file.project_name}</span>
                    </div>
                  )}
                  {file.device_name && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <FontAwesome6 name="microchip" size={11} color="#636E72" />
                      <span style={{ fontSize: 11, color: '#636E72' }}>{file.device_name}</span>
                    </div>
                  )}
                </div>
              )}

              {/* 底部信息 */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                paddingTop: 10,
                borderTop: '1px solid #F0F0F0',
              }}>
                <span style={{ fontSize: 11, color: '#95A5A6' }}>
                  上传于 {file.created_at ? new Date(file.created_at).toLocaleDateString() : '未设置'}
                </span>
                {file.tags && file.tags.length > 0 && (
                  <div style={{ display: 'flex', gap: 4 }}>
                    {file.tags.slice(0, 2).map((tag, index) => (
                      <span 
                        key={index} 
                        style={{
                          padding: '2px 6px',
                          borderRadius: 8,
                          backgroundColor: 'rgba(46, 204, 113, 0.1)',
                          fontSize: 10,
                          color: '#2ECC71',
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </PCLayout>
  );
}
