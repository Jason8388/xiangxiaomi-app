import React, { useState } from 'react';
import '@/assets/styles/pc-global.css';
import { PCLayout } from '@/components/pc/PCLayout';
import { FontAwesome6 } from '@expo/vector-icons';
import { getApiBaseUrl } from '@/utils/api';

interface QueryDevice {
  id: number;
  device_name: string;
  device_number: string;
  device_id: string;
  device_model: string;
  customer_name?: string;
  project_name?: string;
  status: string;
  created_at: string | null;
}

export default function PCQueryDevice() {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [results, setResults] = useState<QueryDevice[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!searchKeyword.trim()) {
      alert('请输入搜索关键词');
      return;
    }

    try {
      setLoading(true);
      const sessionId = typeof window !== 'undefined' ? localStorage.getItem('session_id') : null;
      const response = await fetch(
        `${getApiBaseUrl()}/api/v1/query/devices?keyword=${encodeURIComponent(searchKeyword)}`,
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case '正常': return '#2ECC71';
      case '故障': return '#E74C3C';
      case '维修中': return '#F39C12';
      case '报废': return '#95A5A6';
      default: return '#636E72';
    }
  };

  return (
    <PCLayout>
      <div className="pc-page-header">
        <h1 className="pc-page-title">设备查询</h1>
        <p className="pc-page-description">快速查询设备信息及关联业务数据</p>
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
              placeholder="输入客户、项目、设备名称、编号、ID、型号"
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
          backgroundColor: 'rgba(243, 156, 18, 0.1)',
          borderRadius: 6,
        }}>
          <FontAwesome6 name="circle-info" size={14} color="#F39C12" />
          <span style={{ fontSize: 13, color: '#F39C12' }}>
            支持按客户名称、项目名称、设备名称、设备出厂编号、设备ID、设备型号搜索
          </span>
        </div>
      </div>

      {/* 搜索结果 */}
      {loading ? (
        <div className="pc-card" style={{ textAlign: 'center', padding: 48 }}>
          <FontAwesome6 name="spinner" size={32} color="#1E88E5" spin />
          <p style={{ marginTop: 16, color: '#636E72' }}>查询中...</p>
        </div>
      ) : hasSearched && results.length === 0 ? (
        <div className="pc-card" style={{ textAlign: 'center', padding: 48 }}>
          <FontAwesome6 name="microchip" size={48} color="#95A5A6" />
          <p style={{ marginTop: 16, color: '#636E72' }}>未找到相关设备</p>
        </div>
      ) : !hasSearched ? (
        <div className="pc-card" style={{ textAlign: 'center', padding: 48 }}>
          <FontAwesome6 name="microchip" size={48} color="#95A5A6" />
          <p style={{ marginTop: 16, color: '#636E72' }}>请输入关键词进行搜索</p>
        </div>
      ) : (
        <div>
          <div style={{ marginBottom: 12, color: '#636E72', fontSize: 14, fontWeight: 500 }}>
            查询结果（{results.length}）
          </div>
          
          {results.map((device) => (
            <a
              key={device.id}
              href={`/pc/device-detail?id=${device.id}`}
              className="pc-card"
              style={{ 
                display: 'block',
                textDecoration: 'none',
                marginBottom: 12,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
              }}
            >
              {/* 头部信息 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                <div style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: 'rgba(30, 136, 229, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <FontAwesome6 name="microchip" size={24} color="#1E88E5" />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: '#2D3436', marginBottom: 4 }}>
                    {device.device_name}
                  </h3>
                  <p style={{ fontSize: 13, color: '#95A5A6' }}>
                    编号：{device.device_number}
                  </p>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  borderRadius: 16,
                  backgroundColor: `${getStatusColor(device.status)}20`,
                }}>
                  <FontAwesome6 name="circle-dot" size={10} color={getStatusColor(device.status)} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: getStatusColor(device.status) }}>
                    {device.status}
                  </span>
                </div>
              </div>

              {/* 设备详情 */}
              <div style={{ 
                backgroundColor: '#F5F7FA',
                borderRadius: 8,
                padding: 12,
                marginBottom: 12,
              }}>
                <div style={{ display: 'flex', gap: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <FontAwesome6 name="fingerprint" size={12} color="#636E72" />
                    <span style={{ fontSize: 12, color: '#636E72' }}>设备ID：</span>
                    <span style={{ fontSize: 12, color: '#2D3436', fontWeight: 500 }}>
                      {device.device_id || '未设置'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <FontAwesome6 name="cube" size={12} color="#636E72" />
                    <span style={{ fontSize: 12, color: '#636E72' }}>型号：</span>
                    <span style={{ fontSize: 12, color: '#2D3436', fontWeight: 500 }}>
                      {device.device_model || '未设置'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 关联信息 */}
              {(device.customer_name || device.project_name) && (
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  {device.customer_name && (
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 4,
                      padding: '4px 8px',
                      borderRadius: 12,
                      backgroundColor: '#F5F7FA',
                    }}>
                      <FontAwesome6 name="building" size={10} color="#636E72" />
                      <span style={{ fontSize: 11, color: '#636E72' }}>{device.customer_name}</span>
                    </div>
                  )}
                  {device.project_name && (
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 4,
                      padding: '4px 8px',
                      borderRadius: 12,
                      backgroundColor: '#F5F7FA',
                    }}>
                      <FontAwesome6 name="folder-open" size={10} color="#636E72" />
                      <span style={{ fontSize: 11, color: '#636E72' }}>{device.project_name}</span>
                    </div>
                  )}
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
                  创建于 {device.created_at ? new Date(device.created_at).toLocaleDateString() : '未设置'}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 12, color: '#1E88E5' }}>查看详情</span>
                  <FontAwesome6 name="chevron-right" size={12} color="#1E88E5" />
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </PCLayout>
  );
}
