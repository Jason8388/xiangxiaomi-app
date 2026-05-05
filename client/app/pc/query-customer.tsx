import React, { useState } from 'react';
import '@/assets/styles/pc-global.css';
import { PCLayout } from '@/components/pc/PCLayout';
import { FontAwesome6 } from '@expo/vector-icons';
import { getApiBaseUrl } from '@/utils/api';

interface QueryCustomer {
  id: number;
  name: string;
  contact_person: string;
  contact_phone: string;
  email?: string;
  address?: string;
  contract_count: number;
  device_count: number;
  after_sales_count: number;
  created_at: string;
}

export default function PCQueryCustomer() {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [results, setResults] = useState<QueryCustomer[]>([]);
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
        `${getApiBaseUrl()}/api/v1/query/customers?keyword=${encodeURIComponent(searchKeyword)}`,
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

  const getStatusColor = (count: number) => {
    if (count > 0) return '#2ECC71';
    return '#95A5A6';
  };

  return (
    <PCLayout>
      <div className="pc-page-header">
        <h1 className="pc-page-title">客户查询</h1>
        <p className="pc-page-description">快速查询客户信息及关联业务数据</p>
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
              placeholder="输入客户名称关键词"
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
            支持按客户名称模糊搜索查询客户基础信息、归属合同、归属设备、归属售后服务
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
          <FontAwesome6 name="building-circle-xmark" size={48} color="#95A5A6" />
          <p style={{ marginTop: 16, color: '#636E72' }}>未找到相关客户</p>
        </div>
      ) : !hasSearched ? (
        <div className="pc-card" style={{ textAlign: 'center', padding: 48 }}>
          <FontAwesome6 name="building" size={48} color="#95A5A6" />
          <p style={{ marginTop: 16, color: '#636E72' }}>请输入关键词进行搜索</p>
        </div>
      ) : (
        <div>
          <div style={{ marginBottom: 12, color: '#636E72', fontSize: 14, fontWeight: 500 }}>
            查询结果（{results.length}）
          </div>
          
          {results.map((customer) => (
            <a
              key={customer.id}
              href={`/pc/customer-detail?id=${customer.id}`}
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
                  <FontAwesome6 name="building" size={24} color="#1E88E5" />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: '#2D3436', marginBottom: 4 }}>
                    {customer.name}
                  </h3>
                  <p style={{ fontSize: 13, color: '#636E72' }}>
                    {customer.contact_person} · {customer.contact_phone}
                  </p>
                </div>
                <FontAwesome6 name="chevron-right" size={16} color="#95A5A6" />
              </div>

              {/* 关联统计 */}
              <div style={{ 
                display: 'flex', 
                gap: 24,
                backgroundColor: '#F5F7FA',
                borderRadius: 8,
                padding: 16,
                marginBottom: 12,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FontAwesome6 name="file-contract" size={16} color="#3498DB" />
                  <span style={{ fontSize: 12, color: '#95A5A6' }}>合同</span>
                  <span style={{ fontSize: 15, fontWeight: 600, color: getStatusColor(customer.contract_count) }}>
                    {customer.contract_count}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FontAwesome6 name="microchip" size={16} color="#2ECC71" />
                  <span style={{ fontSize: 12, color: '#95A5A6' }}>设备</span>
                  <span style={{ fontSize: 15, fontWeight: 600, color: getStatusColor(customer.device_count) }}>
                    {customer.device_count}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FontAwesome6 name="screwdriver-wrench" size={16} color="#E67E22" />
                  <span style={{ fontSize: 12, color: '#95A5A6' }}>售后</span>
                  <span style={{ fontSize: 15, fontWeight: 600, color: getStatusColor(customer.after_sales_count) }}>
                    {customer.after_sales_count}
                  </span>
                </div>
              </div>

              {/* 底部信息 */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                paddingTop: 12,
                borderTop: '1px solid #F0F0F0',
              }}>
                <span style={{ fontSize: 12, color: '#95A5A6' }}>
                  创建于 {new Date(customer.created_at).toLocaleDateString()}
                </span>
                {customer.email && (
                  <span style={{ fontSize: 12, color: '#636E72' }}>{customer.email}</span>
                )}
              </div>
            </a>
          ))}
        </div>
      )}
    </PCLayout>
  );
}
