import React, { useState } from 'react';
import '@/assets/styles/pc-global.css';
import { PCLayout } from '@/components/pc/PCLayout';
import { FontAwesome6 } from '@expo/vector-icons';
import { getApiBaseUrl } from '@/utils/api';

interface QueryMeeting {
  id: number;
  minute_id: string;
  meeting_name: string;
  meeting_type: string;
  meeting_date: string;
  meeting_location: string;
  attendees: string;
  topics: string;
  key_points: string;
  file_url?: string;
  customer_name?: string;
  project_name?: string;
  tags?: { id: number; tag: string }[];
  created_at: string;
}

const MEETING_TYPES: Record<string, string> = {
  'department-morning': '部门晨会',
  'department-weekly': '部门周例会',
  'project-start': '项目启动会',
  'project-push': '项目推进会',
  'pm-meeting': 'PM会议',
  'customer-meeting': '客户会议',
  'other': '其它会议',
};

export default function PCQueryMeeting() {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [results, setResults] = useState<QueryMeeting[]>([]);
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
        `${getApiBaseUrl()}/api/v1/query/meetings?keyword=${encodeURIComponent(searchKeyword)}`,
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
        <h1 className="pc-page-title">会议纪要查询</h1>
        <p className="pc-page-description">快速查询会议纪要信息</p>
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
              placeholder="输入会议名称、参会人、会议内容关键词"
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
            支持按标题、内容、参会人等多维度查询会议纪要
          </span>
        </div>
      </div>

      {/* 搜索结果 */}
      {loading ? (
        <div className="pc-card" style={{ textAlign: 'center', padding: 48 }}>
          <FontAwesome6 name="spinner" size={32} color="#F39C12" spin />
          <p style={{ marginTop: 16, color: '#636E72' }}>查询中...</p>
        </div>
      ) : hasSearched && results.length === 0 ? (
        <div className="pc-card" style={{ textAlign: 'center', padding: 48 }}>
          <FontAwesome6 name="calendar-xmark" size={48} color="#95A5A6" />
          <p style={{ marginTop: 16, color: '#636E72' }}>未找到相关会议纪要</p>
        </div>
      ) : !hasSearched ? (
        <div className="pc-card" style={{ textAlign: 'center', padding: 48 }}>
          <FontAwesome6 name="calendar" size={48} color="#95A5A6" />
          <p style={{ marginTop: 16, color: '#636E72' }}>请输入关键词进行搜索</p>
        </div>
      ) : (
        <div>
          <div style={{ marginBottom: 12, color: '#636E72', fontSize: 14, fontWeight: 500 }}>
            查询结果（{results.length}）
          </div>
          
          {results.map((meeting) => (
            <a
              key={meeting.id}
              href={`/pc/meeting-minute-detail?id=${meeting.id}`}
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
                  backgroundColor: 'rgba(243, 156, 18, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <FontAwesome6 name="calendar" size={24} color="#F39C12" />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: '#2D3436', marginBottom: 4 }}>
                    {meeting.meeting_name}
                  </h3>
                  <p style={{ fontSize: 13, color: '#95A5A6' }}>
                    编号：{meeting.minute_id}
                  </p>
                </div>
                <div style={{
                  padding: '6px 12px',
                  borderRadius: 16,
                  backgroundColor: 'rgba(243, 156, 18, 0.1)',
                }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#F39C12' }}>
                    {MEETING_TYPES[meeting.meeting_type] || meeting.meeting_type}
                  </span>
                </div>
              </div>

              {/* 会议详情 */}
              <div style={{ 
                backgroundColor: '#F5F7FA',
                borderRadius: 8,
                padding: 12,
                marginBottom: 12,
              }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 24px', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <FontAwesome6 name="calendar-day" size={12} color="#636E72" />
                    <span style={{ fontSize: 12, color: '#636E72' }}>日期：</span>
                    <span style={{ fontSize: 12, color: '#2D3436', fontWeight: 500 }}>
                      {meeting.meeting_date ? new Date(meeting.meeting_date).toLocaleDateString() : '未设置'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <FontAwesome6 name="location-dot" size={12} color="#636E72" />
                    <span style={{ fontSize: 12, color: '#636E72' }}>地点：</span>
                    <span style={{ fontSize: 12, color: '#2D3436', fontWeight: 500 }}>
                      {meeting.meeting_location || '未设置'}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                  <FontAwesome6 name="users" size={12} color="#636E72" style={{ marginTop: 2 }} />
                  <span style={{ fontSize: 12, color: '#636E72' }}>参会人：</span>
                  <span style={{ fontSize: 12, color: '#2D3436', fontWeight: 500 }}>
                    {meeting.attendees || '未设置'}
                  </span>
                </div>
              </div>

              {/* 关键要点 */}
              {meeting.key_points && (
                <div style={{ 
                  padding: 12,
                  borderRadius: 8,
                  backgroundColor: 'rgba(243, 156, 18, 0.05)',
                  borderLeft: '3px solid #F39C12',
                  marginBottom: 12,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <FontAwesome6 name="lightbulb" size={12} color="#F39C12" />
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#F39C12' }}>关键要点</span>
                  </div>
                  <p style={{ fontSize: 12, color: '#636E72', margin: 0, lineHeight: 1.6 }}>
                    {meeting.key_points.length > 100 ? meeting.key_points.substring(0, 100) + '...' : meeting.key_points}
                  </p>
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
                  创建于 {meeting.created_at ? new Date(meeting.created_at).toLocaleDateString() : '未设置'}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 12, color: '#F39C12' }}>查看详情</span>
                  <FontAwesome6 name="chevron-right" size={12} color="#F39C12" />
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </PCLayout>
  );
}
