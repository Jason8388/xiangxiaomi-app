import React from 'react';
import '@/assets/styles/pc-global.css';
import { PCLayout } from '@/components/pc/PCLayout';

interface FunctionCard {
  id: string;
  title: string;
  icon: string;
  color: string;
  description: string;
  href: string;
}

const FUNCTIONS: FunctionCard[] = [
  {
    id: 'scan-query',
    title: '扫码查询',
    icon: '📷',
    color: '#1E88E5',
    description: '扫描物料、设备二维码快速查询',
    href: '/pc/query-scan',
  },
  {
    id: 'file-query',
    title: '文件查询',
    icon: '📄',
    color: '#2ECC71',
    description: '按客户、项目、设备、文件名查询附件',
    href: '/pc/query-file',
  },
  {
    id: 'meeting-query',
    title: '会议纪要查询',
    icon: '📅',
    color: '#F39C12',
    description: '按标题、内容、参会人查询纪要',
    href: '/pc/query-meeting',
  },
  {
    id: 'customer-query',
    title: '客户查询',
    icon: '🏢',
    color: '#9B59B6',
    description: '按客户名称查询客户信息',
    href: '/pc/query-customer',
  },
  {
    id: 'device-query',
    title: '设备查询',
    icon: '💻',
    color: '#E74C3C',
    description: '按名称、编号、型号查询设备',
    href: '/pc/query-device',
  },
  {
    id: 'contract-query',
    title: '合同查询',
    icon: '📋',
    color: '#3498DB',
    description: '按客户、名称、编号查询合同',
    href: '/pc/query-contract',
  },
  {
    id: 'material-query',
    title: '物料查询',
    icon: '📦',
    color: '#1ABC9C',
    description: '按名称、型号、编码查询物料',
    href: '/pc/query-material',
  },
  {
    id: 'work-order-query',
    title: '工单查询',
    icon: '🔧',
    color: '#E67E22',
    description: '按工单号、名称、任务号、客户查询工单',
    href: '/pc/query-work-order',
  },
];

export default function PCQueryAssistant() {
  return (
    <PCLayout>
      <div className="pc-page-header">
        <h1 className="pc-page-title">查询助手</h1>
        <p className="pc-page-description">快速查询各类业务数据</p>
      </div>

      {/* 查询功能卡片 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
        {FUNCTIONS.map((func) => (
          <a
            key={func.id}
            href={func.href}
            className="pc-card"
            style={{ 
              textDecoration: 'none', 
              padding: 24, 
              cursor: 'pointer', 
              transition: 'all 0.2s',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.12)';
              e.currentTarget.style.borderColor = func.color;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
              e.currentTarget.style.borderColor = 'transparent';
            }}
          >
            <div style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              backgroundColor: `${func.color}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
              fontSize: 28,
            }}>
              {func.icon}
            </div>
            <h3 style={{ 
              fontSize: 16, 
              fontWeight: 600, 
              color: '#2D3436', 
              marginBottom: 8,
            }}>
              {func.title}
            </h3>
            <p style={{ 
              fontSize: 13, 
              color: '#636E72', 
              lineHeight: 1.5,
              marginBottom: 0,
            }}>
              {func.description}
            </p>
          </a>
        ))}
      </div>

      {/* 使用提示 */}
      <div className="pc-card" style={{ marginTop: 32, background: 'rgba(30, 136, 229, 0.05)', border: '1px solid rgba(30, 136, 229, 0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <span style={{ fontSize: 20 }}>💡</span>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#2D3436', marginBottom: 8 }}>使用说明</h3>
            <ul style={{ fontSize: 13, color: '#636E72', lineHeight: 1.8, margin: 0, paddingLeft: 20 }}>
              <li>扫码查询：支持扫描物料、设备上的二维码快速定位信息</li>
              <li>文件查询：支持按客户名称、项目名称、设备名称、文件名等多维度检索</li>
              <li>客户查询：输入客户名称关键词即可快速查找客户信息</li>
              <li>设备查询：支持按设备名称、设备编号、型号等多条件查询</li>
              <li>工单查询：按工单号、客户名称快速定位工单详情</li>
            </ul>
          </div>
        </div>
      </div>
    </PCLayout>
  );
}
