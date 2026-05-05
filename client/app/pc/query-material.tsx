import React, { useState } from 'react';
import '@/assets/styles/pc-global.css';
import { PCLayout } from '@/components/pc/PCLayout';
import { FontAwesome6 } from '@expo/vector-icons';
import { storage } from '@/utils/storage';
import { getApiBaseUrl } from '@/utils/api';

interface QueryMaterial {
  id: number;
  material_name: string;
  material_code: string;
  material_model: string;
  unit: string;
  quantity: number;
  tags: string[];
  created_at: string;
}

export default function PCQueryMaterial() {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [results, setResults] = useState<QueryMaterial[]>([]);
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
        `${getApiBaseUrl()}/api/v1/query/materials?keyword=${encodeURIComponent(searchKeyword)}`,
        sessionId ? { headers: { 'x-session-id': sessionId } } : {}
      );
      const data = await response.json();
      if (response.ok) {
        setResults(data || []);
      } else {
        alert(data.message || '查询失败');
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
      setHasSearched(true);
    }
  };

  return (
    <PCLayout>
      <div className="pc-page-header">
        <h1 className="pc-page-title">物料查询</h1>
        <p className="pc-page-description">快速查询物料信息及关联数据</p>
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
              placeholder="输入物料名称、型号、编码、标签"
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
          backgroundColor: 'rgba(26, 188, 156, 0.1)',
          borderRadius: 6,
        }}>
          <FontAwesome6 name="circle-info" size={14} color="#1ABC9C" />
          <span style={{ fontSize: 13, color: '#1ABC9C' }}>
            支持按物料名称、型号、编码、标签模糊搜索查询物料信息
          </span>
        </div>
      </div>

      {/* 搜索结果 */}
      {loading ? (
        <div className="pc-card" style={{ textAlign: 'center', padding: 48 }}>
          <FontAwesome6 name="spinner" size={32} color="#1ABC9C" spin />
          <p style={{ marginTop: 16, color: '#636E72' }}>查询中...</p>
        </div>
      ) : hasSearched && results.length === 0 ? (
        <div className="pc-card" style={{ textAlign: 'center', padding: 48 }}>
          <FontAwesome6 name="box-open" size={48} color="#95A5A6" />
          <p style={{ marginTop: 16, color: '#636E72' }}>未找到相关物料</p>
        </div>
      ) : !hasSearched ? (
        <div className="pc-card" style={{ textAlign: 'center', padding: 48 }}>
          <FontAwesome6 name="box" size={48} color="#95A5A6" />
          <p style={{ marginTop: 16, color: '#636E72' }}>请输入关键词进行搜索</p>
        </div>
      ) : (
        <div>
          <div style={{ marginBottom: 12, color: '#636E72', fontSize: 14, fontWeight: 500 }}>
            查询结果（{results.length}）
          </div>
          
          {results.map((material) => (
            <div
              key={material.id}
              className="pc-card"
              style={{ 
                marginBottom: 12,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {/* 头部信息 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                <div style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: 'rgba(26, 188, 156, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <FontAwesome6 name="box" size={24} color="#1ABC9C" />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: '#2D3436', marginBottom: 4 }}>
                    {material.material_name}
                  </h3>
                  <p style={{ fontSize: 13, color: '#95A5A6' }}>
                    编码：{material.material_code}
                  </p>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 16px',
                  borderRadius: 8,
                  backgroundColor: 'rgba(26, 188, 156, 0.1)',
                }}>
                  <span style={{ fontSize: 18, fontWeight: 700, color: '#1ABC9C' }}>
                    {material.quantity}
                  </span>
                  <span style={{ fontSize: 12, color: '#636E72' }}>
                    {material.unit}
                  </span>
                </div>
              </div>

              {/* 物料详情 */}
              <div style={{ 
                backgroundColor: '#F5F7FA',
                borderRadius: 8,
                padding: 12,
                marginBottom: 12,
              }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <FontAwesome6 name="cube" size={12} color="#636E72" />
                    <span style={{ fontSize: 12, color: '#636E72' }}>型号：</span>
                    <span style={{ fontSize: 12, color: '#2D3436', fontWeight: 500 }}>
                      {material.material_model || '未设置'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 标签 */}
              {material.tags && Array.isArray(material.tags) && material.tags.length > 0 && (
                <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                  {material.tags.slice(0, 3).map((tag, index) => (
                    <span 
                      key={index} 
                      style={{
                        padding: '4px 8px',
                        borderRadius: 12,
                        backgroundColor: 'rgba(26, 188, 156, 0.1)',
                        fontSize: 11,
                        color: '#1ABC9C',
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* 底部信息 */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                paddingTop: 12,
                borderTop: '1px solid #F0F0F0',
              }}>
                <span style={{ fontSize: 12, color: '#95A5A6' }}>
                  创建于 {material.created_at ? new Date(material.created_at).toLocaleDateString() : '未设置'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </PCLayout>
  );
}
