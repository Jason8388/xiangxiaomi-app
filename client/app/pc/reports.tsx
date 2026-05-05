import React from 'react';
import '@/assets/styles/pc-global.css';
import { PCLayout } from '@/components/pc/PCLayout';

const REPORTS = [
  {
    id: 'customer-report',
    title: '客户统计表',
    icon: '👥',
    color: '#1E88E5',
    description: '统计各客户数、合同数、设备数、售后工单数',
    href: '/pc/report-customer',
  },
  {
    id: 'device-report',
    title: '设备统计表',
    icon: '📱',
    color: '#2ECC71',
    description: '统计设备数量、设备明细、对应客户、合同信息',
    href: '/pc/report-device',
  },
  {
    id: 'after-sales-report',
    title: '工单统计表',
    icon: '🔧',
    color: '#E67E22',
    description: '统计售后工单数、收费工单数、免费工单数、工单明细',
    href: '/pc/report-after-sales',
  },
];

export default function PCReports() {
  return (
    <PCLayout>
      <div className="pc-page-header">
        <h1 className="pc-page-title">统计报表</h1>
        <p className="pc-page-description">查看业务数据统计和分析报表</p>
      </div>

      {/* 权限提示 */}
      <div className="pc-card" style={{ marginBottom: 24, background: 'rgba(243, 156, 18, 0.1)', border: '1px solid rgba(243, 156, 18, 0.3)' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 20 }}>🛡️</span>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#2D3436', marginBottom: 8 }}>报表权限说明</h3>
            <p style={{ fontSize: 13, color: '#636E72', lineHeight: 1.6, marginBottom: 4 }}>运营总监、项目总监：可查看所有报表，下载自己负责范围内的明细</p>
            <p style={{ fontSize: 13, color: '#636E72', lineHeight: 1.6 }}>管理员：可查看、下载所有报表明细</p>
          </div>
        </div>
      </div>

      {/* 报表卡片 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
        {REPORTS.map((report) => (
          <a
            key={report.id}
            href={report.href}
            className="pc-card"
            style={{ textDecoration: 'none', textAlign: 'center', padding: 32, cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
            }}
          >
            <div style={{
              width: 72,
              height: 72,
              borderRadius: 18,
              backgroundColor: `${report.color}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              fontSize: 32,
            }}>
              {report.icon}
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: '#2D3436', marginBottom: 12 }}>{report.title}</h3>
            <p style={{ fontSize: 13, color: '#636E72', lineHeight: 1.6 }}>{report.description}</p>
            <div style={{ marginTop: 20, color: report.color, fontSize: 14, fontWeight: 500 }}>
              查看详情 →
            </div>
          </a>
        ))}
      </div>

      {/* 导出说明 */}
      <div className="pc-card" style={{ marginTop: 24, background: 'rgba(30, 136, 229, 0.1)', border: '1px solid rgba(30, 136, 229, 0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 18 }}>📊</span>
          <span style={{ fontSize: 14, color: '#1E88E5', fontWeight: 500 }}>支持 Excel、PDF 格式导出</span>
        </div>
      </div>

      {/* 更新时间 */}
      <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8, color: '#636E72', fontSize: 13 }}>
        <span>🔄</span>
        <span>核心数据实时更新，详细数据每日凌晨更新</span>
      </div>
    </PCLayout>
  );
}
