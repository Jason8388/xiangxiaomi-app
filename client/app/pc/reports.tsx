import React, { useState, useEffect } from 'react';
import '@/assets/styles/pc-global.css';
import { PCLayout } from '@/components/pc/PCLayout';
import { PCStatCard } from '@/components/pc/PCComponents';
import { PCCard } from '@/components/pc/PCComponents';
import { PCTable } from '@/components/pc/PCComponents';
import { PCTag } from '@/components/pc/PCComponents';

import { getApiBaseUrl } from '@/utils/api';
const API_BASE = getApiBaseUrl();

export default function PCReports() {
  const [stats, setStats] = useState({
    customers: 156,
    devices: 324,
    contracts: 89,
    afterSales: 245,
  });
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 模拟月度数据
    setMonthlyData([
      { month: '1月', customers: 12, contracts: 8, afterSales: 18 },
      { month: '2月', customers: 15, contracts: 10, afterSales: 22 },
      { month: '3月', customers: 18, contracts: 12, afterSales: 25 },
    ]);
    setLoading(false);
  }, []);

  const customerColumns = [
    { key: 'name', title: '客户名称', width: 200 },
    { key: 'device_count', title: '设备数量', width: 100, render: (val: number) => <span style={{ fontWeight: 600 }}>{val}</span> },
    { key: 'contract_amount', title: '合同金额', width: 120, render: (val: number) => <span style={{ color: '#FF6B6B' }}>¥{val.toLocaleString()}</span> },
    { key: 'status', title: '状态', width: 80, render: () => <PCTag type="success">活跃</PCTag> },
    { key: 'last_contact', title: '最近联系', width: 100 },
  ];

  const topCustomers = [
    { id: 1, name: '北京科技有限公司', device_count: 45, contract_amount: 580000, status: 'active', last_contact: '2024-03-20' },
    { id: 2, name: '上海网络科技', device_count: 38, contract_amount: 420000, status: 'active', last_contact: '2024-03-18' },
    { id: 3, name: '广州智能制造', device_count: 32, contract_amount: 380000, status: 'active', last_contact: '2024-03-15' },
    { id: 4, name: '深圳电子科技', device_count: 28, contract_amount: 350000, status: 'active', last_contact: '2024-03-12' },
    { id: 5, name: '杭州软件集团', device_count: 25, contract_amount: 300000, status: 'active', last_contact: '2024-03-10' },
  ];

  return (
    <>
      
      <PCLayout>
        <div className="pc-page-header"><h1 className="pc-page-title">统计报表</h1><p className="pc-page-description">查看业务数据统计和分析报表</p></div>

        {/* 概览统计 */}
        <div className="pc-stat-grid" style={{ marginBottom: 24 }}>
          <PCStatCard title="客户总数" value={stats.customers} icon="👥" iconColor="#4F8EF7" change={12} changeLabel="较上月" />
          <PCStatCard title="设备总数" value={stats.devices} icon="📱" iconColor="#52C41A" change={8} changeLabel="较上月" />
          <PCStatCard title="合同总数" value={stats.contracts} icon="📋" iconColor="#FAAD14" change={5} changeLabel="较上月" />
          <PCStatCard title="售后工单" value={stats.afterSales} icon="🔧" iconColor="#722ED1" change={15} changeLabel="较上月" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* 月度趋势 */}
          <PCCard title="月度新增趋势">
            <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', height: 200, padding: '20px 0' }}>
              {monthlyData.map((item, index) => (
                <div key={item.month} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end' }}>
                    <div style={{ width: 20, height: item.customers * 4, background: '#4F8EF7', borderRadius: 4 }} title={`客户: ${item.customers}`} />
                    <div style={{ width: 20, height: item.contracts * 8, background: '#FAAD14', borderRadius: 4 }} title={`合同: ${item.contracts}`} />
                    <div style={{ width: 20, height: item.afterSales * 3, background: '#722ED1', borderRadius: 4 }} title={`售后: ${item.afterSales}`} />
                  </div>
                  <span style={{ fontSize: 12, color: '#999' }}>{item.month}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 16, fontSize: 12 }}>
              <span><span style={{ display: 'inline-block', width: 12, height: 12, background: '#4F8EF7', borderRadius: 2, marginRight: 4 }}></span>客户</span>
              <span><span style={{ display: 'inline-block', width: 12, height: 12, background: '#FAAD14', borderRadius: 2, marginRight: 4 }}></span>合同</span>
              <span><span style={{ display: 'inline-block', width: 12, height: 12, background: '#722ED1', borderRadius: 2, marginRight: 4 }}></span>售后</span>
            </div>
          </PCCard>

          {/* 设备状态分布 */}
          <PCCard title="设备状态分布">
            <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: 20 }}>
              <div style={{ position: 'relative', width: 150, height: 150 }}>
                <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#E4E7ED" strokeWidth="12" />
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#52C41A" strokeWidth="12" strokeDasharray="150.8 100.5" strokeDashoffset="0" />
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#FAAD14" strokeWidth="12" strokeDasharray="75.4 100.5" strokeDashoffset="-150.8" />
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#FF4D4F" strokeWidth="12" strokeDasharray="25.1 100.5" strokeDashoffset="-226.2" />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 24, fontWeight: 700 }}>324</span>
                  <span style={{ fontSize: 12, color: '#999' }}>设备总数</span>
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span style={{ width: 12, height: 12, background: '#52C41A', borderRadius: 2 }}></span>
                  <span>在线</span>
                  <span style={{ fontWeight: 600 }}>240</span>
                  <span style={{ color: '#999' }}>(74%)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span style={{ width: 12, height: 12, background: '#FAAD14', borderRadius: 2 }}></span>
                  <span>离线</span>
                  <span style={{ fontWeight: 600 }}>60</span>
                  <span style={{ color: '#999' }}>(19%)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 12, height: 12, background: '#FF4D4F', borderRadius: 2 }}></span>
                  <span>告警</span>
                  <span style={{ fontWeight: 600 }}>24</span>
                  <span style={{ color: '#999' }}>(7%)</span>
                </div>
              </div>
            </div>
          </PCCard>
        </div>

        {/* 客户排名 */}
        <div style={{ marginTop: 24 }}>
          <PCCard title="客户贡献排名" extra={<a href="/pc/customers" style={{ color: '#4F8EF7', fontSize: 13 }}>查看全部 ›</a>}>
            <PCTable columns={customerColumns} data={topCustomers} rowKey="id" loading={loading} />
          </PCCard>
        </div>
      </PCLayout>
    </>
  );
}
