import React, { useState, useEffect, useCallback } from 'react';
import { PCLayout } from '@/components/pc/PCLayout';
import { PCStatCard } from '@/components/pc/PCComponents';
import { PCTable } from '@/components/pc/PCComponents';
import { PCTag } from '@/components/pc/PCComponents';
import { PCCard } from '@/components/pc/PCComponents';
import { PCMessage } from '@/components/pc/PCComponents';

const API_BASE = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || 'http://localhost:9091';

export default function PCDashboard() {
  const [stats, setStats] = useState({
    customers: 0,
    devices: 0,
    contracts: 0,
    pendingTasks: 0,
  });
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [customersRes, devicesRes, contractsRes] = await Promise.all([
        fetch(`${API_BASE}/api/v1/customers`).catch(() => ({ ok: false, json: () => ({ customers: [] }) })),
        fetch(`${API_BASE}/api/v1/devices`).catch(() => ({ ok: false, json: () => ({ devices: [] }) })),
        fetch(`${API_BASE}/api/v1/contracts`).catch(() => ({ ok: false, json: () => ({ contracts: [] }) })),
      ]);

      const [customers, devices, contracts] = await Promise.all([
        customersRes.json().catch(() => ({ customers: [] })),
        devicesRes.json().catch(() => ({ devices: [] })),
        contractsRes.json().catch(() => ({ contracts: [] })),
      ]);

      setStats({
        customers: Array.isArray(customers) ? customers.length : (customers.customers?.length || 0),
        devices: Array.isArray(devices) ? devices.length : (devices.devices?.length || 0),
        contracts: Array.isArray(contracts) ? contracts.length : (contracts.contracts?.length || 0),
        pendingTasks: 8,
      });

      // 模拟最近活动
      setRecentActivities([
        { id: 1, action: '新增客户', target: '北京科技有限公司', time: '2小时前', user: '管理员' },
        { id: 2, action: '设备报修', target: '设备编号 A-001', time: '3小时前', user: '张三' },
        { id: 3, action: '合同签署', target: '合同编号 HT-2024-001', time: '5小时前', user: '李四' },
        { id: 4, action: '物料出库', target: '物料名称 变频器', time: '1天前', user: '王五' },
        { id: 5, action: '知识更新', target: '设备维护手册 v2.0', time: '2天前', user: '管理员' },
      ]);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      // 使用默认数据
      setStats({
        customers: 156,
        devices: 324,
        contracts: 89,
        pendingTasks: 12,
      });
      setRecentActivities([
        { id: 1, action: '新增客户', target: '北京科技有限公司', time: '2小时前', user: '管理员' },
        { id: 2, action: '设备报修', target: '设备编号 A-001', time: '3小时前', user: '张三' },
        { id: 3, action: '合同签署', target: '合同编号 HT-2024-001', time: '5小时前', user: '李四' },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const activityColumns = [
    { key: 'action', title: '操作', render: (val: string) => <PCTag type="primary">{val}</PCTag> },
    { key: 'target', title: '对象' },
    { key: 'user', title: '操作人' },
    { key: 'time', title: '时间', render: (val: string) => <span style={{ color: '#999' }}>{val}</span> },
  ];

  return (
    <>
      <style>{`
        @import url('/assets/styles/pc-global.css');
      `}</style>
      <PCLayout>
        <div className="pc-page-header">
          <h1 className="pc-page-title">工作台</h1>
          <p className="pc-page-description">欢迎回来，今天是 {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        {/* 统计卡片 */}
        <div className="pc-stat-grid">
          <PCStatCard
            title="客户总数"
            value={stats.customers}
            icon="👥"
            iconColor="#4F8EF7"
            change={12}
            changeLabel="较上月"
          />
          <PCStatCard
            title="设备总数"
            value={stats.devices}
            icon="📱"
            iconColor="#52C41A"
            change={8}
            changeLabel="较上月"
          />
          <PCStatCard
            title="合同总数"
            value={stats.contracts}
            icon="📋"
            iconColor="#FAAD14"
            change={-3}
            changeLabel="较上月"
          />
          <PCStatCard
            title="待处理任务"
            value={stats.pendingTasks}
            icon="⏰"
            iconColor="#FF4D4F"
          />
        </div>

        {/* 快捷入口 */}
        <div style={{ marginTop: 24 }}>
          <PCCard
            title="快捷入口"
            extra={<a href="/pc/customers" style={{ color: '#4F8EF7', fontSize: 13 }}>更多 ›</a>}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
              {[
                { icon: '👥', label: '客户管理', path: '/pc/customers', color: '#4F8EF7' },
                { icon: '📱', label: '设备管理', path: '/pc/devices', color: '#52C41A' },
                { icon: '📋', label: '合同管理', path: '/pc/contracts', color: '#FAAD14' },
                { icon: '🔧', label: '售后服务', path: '/pc/after-sales', color: '#722ED1' },
                { icon: '📦', label: '物料管理', path: '/pc/materials', color: '#EB2F96' },
                { icon: '📚', label: '知识库', path: '/pc/knowledge', color: '#13C2C2' },
                { icon: '📝', label: '会议纪要', path: '/pc/meeting-minutes', color: '#FA8C16' },
                { icon: '📁', label: '文件管理', path: '/pc/files', color: '#8B5CF6' },
                { icon: '📊', label: '统计报表', path: '/pc/reports', color: '#F5222D' },
              ].map((item, index) => (
                <a
                  key={index}
                  href={item.path}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '20px 12px',
                    background: 'var(--color-bg-base)',
                    borderRadius: 8,
                    textDecoration: 'none',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.background = 'var(--color-bg-hover)';
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.background = 'var(--color-bg-base)';
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                  }}
                >
                  <span style={{ fontSize: 32, marginBottom: 8 }}>{item.icon}</span>
                  <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{item.label}</span>
                </a>
              ))}
            </div>
          </PCCard>
        </div>

        {/* 最近活动 */}
        <div style={{ marginTop: 24 }}>
          <PCCard
            title="最近活动"
            extra={<a href="#" style={{ color: '#4F8EF7', fontSize: 13 }}>查看全部 ›</a>}
          >
            <PCTable
              columns={activityColumns}
              data={recentActivities}
              rowKey="id"
              loading={loading}
            />
          </PCCard>
        </div>
      </PCLayout>
    </>
  );
}
