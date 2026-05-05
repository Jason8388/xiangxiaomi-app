import React, { useState } from 'react';
import '@/assets/styles/pc-global.css';
import { PCLayout } from '@/components/pc/PCLayout';
import { FontAwesome6 } from '@expo/vector-icons';
import { getApiBaseUrl } from '@/utils/api';

interface WorkOrder {
  id: number;
  order_no: string;
  name: string;
  task_no: string;
  customer_name: string;
  sales_sub_project_no: string;
  contract_no: string;
  contract_name: string;
  task_progress: string;
  task_phase: string;
  created_at: string;
}

export default function PCQueryWorkOrder() {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [results, setResults] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!searchKeyword.trim()) {
      alert('请输入搜索关键词');
      return;
    }

    try {
      setLoading(true);
      setHasSearched(true);
      const sessionId = typeof window !== 'undefined' ? localStorage.getItem('session_id') : null;
      const response = await fetch(
        `${getApiBaseUrl()}/api/v1/work-orders/search?keyword=${encodeURIComponent(searchKeyword)}`,
        sessionId ? { headers: { 'x-session-id': sessionId } } : {}
      );
      const data = await response.json();
      if (response.ok) {
        setResults(data.orders || []);
      } else {
        setResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case '需求阶段': return '#6C63FF';
      case '实施阶段': return '#00B894';
      case '回款阶段': return '#F39C12';
      case '关单存档': return '#3498DB';
      case '异常状态': return '#E74C3C';
      default: return '#636E72';
    }
  };

  return (
    <PCLayout>
      <div className="pc-page-header">
        <h1 className="pc-page-title">工单查询</h1>
        <p className="pc-page-description">快速查询工单信息及关联业务数据</p>
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
              placeholder="输入工单号、工单名称、任务号、客户名称、销售子项目号、合同名称、合同编号"
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
          backgroundColor: 'rgba(108, 99, 255, 0.1)',
          borderRadius: 6,
        }}>
          <FontAwesome6 name="circle-info" size={14} color="#6C63FF" />
          <span style={{ fontSize: 13, color: '#6C63FF' }}>
            支持按工单号、工单名称、任务号、客户名称、销售子项目号、合同名称、合同编号查询
          </span>
        </div>
      </div>

      {/* 搜索结果 */}
      {loading ? (
        <div className="pc-card" style={{ textAlign: 'center', padding: 48 }}>
          <FontAwesome6 name="spinner" size={32} color="#6C63FF" spin />
          <p style={{ marginTop: 16, color: '#636E72' }}>查询中...</p>
        </div>
      ) : hasSearched && results.length === 0 ? (
        <div className="pc-card" style={{ textAlign: 'center', padding: 48 }}>
          <FontAwesome6 name="clipboard-list" size={48} color="#95A5A6" />
          <p style={{ marginTop: 16, color: '#636E72' }}>未找到相关工单</p>
        </div>
      ) : !hasSearched ? (
        <div className="pc-card" style={{ textAlign: 'center', padding: 48 }}>
          <FontAwesome6 name="clipboard-list" size={48} color="#95A5A6" />
          <p style={{ marginTop: 16, color: '#636E72' }}>请输入关键词进行搜索</p>
        </div>
      ) : (
        <div>
          <div style={{ marginBottom: 12, color: '#636E72', fontSize: 14, fontWeight: 500 }}>
            查询结果（{results.length}）
          </div>
          
          {results.map((order) => (
            <a
              key={order.id}
              href={`/pc/work-order-detail?id=${order.id}`}
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
                  backgroundColor: 'rgba(108, 99, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <FontAwesome6 name="clipboard-list" size={24} color="#6C63FF" />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: '#2D3436', marginBottom: 4 }}>
                    {order.name}
                  </h3>
                  <p style={{ fontSize: 13, color: '#95A5A6' }}>
                    工单号：{order.order_no}
                  </p>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  borderRadius: 16,
                  backgroundColor: `${getPhaseColor(order.task_phase)}20`,
                }}>
                  <FontAwesome6 name="circle" size={8} color={getPhaseColor(order.task_phase)} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: getPhaseColor(order.task_phase) }}>
                    {order.task_phase}
                  </span>
                </div>
              </div>

              {/* 工单详情 */}
              <div style={{ 
                backgroundColor: '#F5F7FA',
                borderRadius: 8,
                padding: 12,
                marginBottom: 12,
              }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <FontAwesome6 name="hashtag" size={12} color="#636E72" />
                    <span style={{ fontSize: 12, color: '#636E72' }}>任务号：</span>
                    <span style={{ fontSize: 12, color: '#2D3436', fontWeight: 500 }}>
                      {order.task_no || '无'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <FontAwesome6 name="building" size={12} color="#636E72" />
                    <span style={{ fontSize: 12, color: '#636E72' }}>客户：</span>
                    <span style={{ fontSize: 12, color: '#2D3436', fontWeight: 500 }}>
                      {order.customer_name || '无'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <FontAwesome6 name="file-contract" size={12} color="#636E72" />
                    <span style={{ fontSize: 12, color: '#636E72' }}>合同：</span>
                    <span style={{ fontSize: 12, color: '#2D3436', fontWeight: 500 }}>
                      {order.contract_name || '无'}
                    </span>
                  </div>
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
                  创建于 {new Date(order.created_at).toLocaleDateString()}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 12, color: '#6C63FF' }}>查看详情</span>
                  <FontAwesome6 name="chevron-right" size={12} color="#6C63FF" />
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </PCLayout>
  );
}
