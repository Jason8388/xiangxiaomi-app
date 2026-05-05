import React, { useState } from 'react';
import '@/assets/styles/pc-global.css';
import { PCLayout } from '@/components/pc/PCLayout';
import { FontAwesome6 } from '@expo/vector-icons';
import { storage } from '@/utils/storage';
import { getApiBaseUrl } from '@/utils/api';

interface ScanResult {
  type: 'device' | 'material' | 'unknown';
  id?: number;
  data?: any;
  message?: string;
}

export default function PCQueryScan() {
  const [scanCode, setScanCode] = useState('');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!scanCode.trim()) {
      alert('请输入二维码编号');
      return;
    }

    try {
      setLoading(true);
      const sessionId = await storage.getItem('session_id');
      const response = await fetch(
        `${getApiBaseUrl()}/api/v1/query/scan?code=${encodeURIComponent(scanCode)}`,
        sessionId ? { headers: { 'x-session-id': sessionId } } : {}
      );
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Scan error:', error);
      setResult({ type: 'unknown', message: '查询失败，请重试' });
    } finally {
      setLoading(false);
    }
  };

  const getResultLink = () => {
    if (!result || result.type === 'unknown') return null;
    if (result.type === 'device' && result.id) {
      return `/pc/device-detail?id=${result.id}`;
    }
    return null;
  };

  return (
    <PCLayout>
      <div className="pc-page-header">
        <h1 className="pc-page-title">扫码查询</h1>
        <p className="pc-page-description">扫描物料、设备二维码快速定位信息</p>
      </div>

      {/* 扫码输入 */}
      <div className="pc-card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <FontAwesome6 
              name="qrcode" 
              size={16} 
              color="#636E72" 
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              placeholder="输入物料编码、设备二维码编号"
              value={scanCode}
              onChange={(e) => setScanCode(e.target.value)}
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
            {loading ? '查询中...' : '查询'}
          </button>
        </div>
        
        {/* 使用提示 */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 8, 
          padding: '10px 12px',
          backgroundColor: 'rgba(30, 136, 229, 0.1)',
          borderRadius: 6,
        }}>
          <FontAwesome6 name="circle-info" size={14} color="#1E88E5" />
          <span style={{ fontSize: 13, color: '#1E88E5' }}>
            支持扫描物料、设备上的二维码，输入对应的编码进行快速查询定位
          </span>
        </div>
      </div>

      {/* 查询结果 */}
      {loading ? (
        <div className="pc-card" style={{ textAlign: 'center', padding: 48 }}>
          <FontAwesome6 name="spinner" size={32} color="#1E88E5" spin />
          <p style={{ marginTop: 16, color: '#636E72' }}>查询中...</p>
        </div>
      ) : result ? (
        <div>
          {result.type === 'unknown' ? (
            <div className="pc-card" style={{ textAlign: 'center', padding: 48 }}>
              <FontAwesome6 name="circle-xmark" size={48} color="#E74C3C" />
              <h3 style={{ fontSize: 18, fontWeight: 600, color: '#2D3436', marginTop: 16, marginBottom: 8 }}>
                未找到匹配记录
              </h3>
              <p style={{ fontSize: 14, color: '#636E72', margin: 0 }}>
                {result.message || '请确认二维码编号是否正确'}
              </p>
            </div>
          ) : result.type === 'device' && result.data ? (
            <a
              href={getResultLink() || '#'}
              className="pc-card"
              style={{ 
                display: 'block',
                textDecoration: 'none',
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
              {/* 设备图标 */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: 'rgba(30, 136, 229, 0.1)',
                margin: '0 auto 20px',
              }}>
                <FontAwesome6 name="microchip" size={40} color="#1E88E5" />
              </div>

              <h3 style={{ fontSize: 20, fontWeight: 700, color: '#2D3436', textAlign: 'center', marginBottom: 4 }}>
                {result.data.device_name}
              </h3>
              <p style={{ fontSize: 14, color: '#95A5A6', textAlign: 'center', marginBottom: 20 }}>
                设备编号：{result.data.device_number}
              </p>

              {/* 设备详情 */}
              <div style={{ 
                backgroundColor: '#F5F7FA',
                borderRadius: 12,
                padding: 16,
                marginBottom: 16,
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <p style={{ fontSize: 12, color: '#95A5A6', marginBottom: 4 }}>设备ID</p>
                    <p style={{ fontSize: 14, fontWeight: 500, color: '#2D3436' }}>
                      {result.data.device_id || '未设置'}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: 12, color: '#95A5A6', marginBottom: 4 }}>设备型号</p>
                    <p style={{ fontSize: 14, fontWeight: 500, color: '#2D3436' }}>
                      {result.data.device_model || '未设置'}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: 12, color: '#95A5A6', marginBottom: 4 }}>客户</p>
                    <p style={{ fontSize: 14, fontWeight: 500, color: '#2D3436' }}>
                      {result.data.customer_name || '未关联'}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: 12, color: '#95A5A6', marginBottom: 4 }}>项目</p>
                    <p style={{ fontSize: 14, fontWeight: 500, color: '#2D3436' }}>
                      {result.data.project_name || '未关联'}
                    </p>
                  </div>
                </div>
              </div>

              {/* 状态指示 */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                gap: 8,
                marginBottom: 16,
              }}>
                <div style={{
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: result.data.status === '正常' ? '#2ECC71' : 
                                  result.data.status === '故障' ? '#E74C3C' : '#F39C12',
                }} />
                <span style={{ fontSize: 14, fontWeight: 500, color: '#2D3436' }}>
                  {result.data.status || '未知状态'}
                </span>
              </div>

              {/* 查看详情按钮 */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                gap: 8,
                padding: '12px 0',
                color: '#1E88E5',
                fontSize: 14,
                fontWeight: 500,
              }}>
                <span>查看设备详情</span>
                <FontAwesome6 name="arrow-right" size={14} />
              </div>
            </a>
          ) : (
            <div className="pc-card" style={{ textAlign: 'center', padding: 48 }}>
              <FontAwesome6 name="circle-xmark" size={48} color="#E74C3C" />
              <h3 style={{ fontSize: 18, fontWeight: 600, color: '#2D3436', marginTop: 16, marginBottom: 8 }}>
                查询结果异常
              </h3>
              <p style={{ fontSize: 14, color: '#636E72', margin: 0 }}>
                数据格式不正确，请重试
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="pc-card" style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            width: 100,
            height: 100,
            borderRadius: 50,
            backgroundColor: 'rgba(30, 136, 229, 0.1)',
            margin: '0 auto 20px',
          }}>
            <FontAwesome6 name="qrcode" size={48} color="#1E88E5" />
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: '#2D3436', marginBottom: 8 }}>
            扫码查询
          </h3>
          <p style={{ fontSize: 14, color: '#636E72', margin: 0 }}>
            输入物料或设备的二维码编号开始查询
          </p>
        </div>
      )}

      {/* 操作示例 */}
      <div className="pc-card" style={{ marginTop: 24, background: 'rgba(30, 136, 229, 0.03)' }}>
        <h4 style={{ fontSize: 14, fontWeight: 600, color: '#2D3436', marginBottom: 12 }}>
          <FontAwesome6 name="lightbulb" size={14} color="#F39C12" style={{ marginRight: 6 }} />
          使用示例
        </h4>
        <ul style={{ fontSize: 13, color: '#636E72', margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
          <li>扫描设备上的二维码，获取设备编码后在此查询</li>
          <li>扫描物料标签上的编码，获取物料信息</li>
          <li>可直接点击查询结果跳转到详情页面</li>
        </ul>
      </div>
    </PCLayout>
  );
}
