import React, { useState, useEffect, useCallback } from 'react';
import '@/assets/styles/pc-global.css';
import { PCLayout } from '@/components/pc/PCLayout';
import { PCCard } from '@/components/pc/PCComponents';
import { FontAwesome6 } from '@expo/vector-icons';
import { storage } from '@/utils/storage';

import { getApiBaseUrl } from '@/utils/api';
const API_BASE = getApiBaseUrl();

interface QuickLink {
  icon: string;
  label: string;
  path: string;
  color: string;
  description: string;
}

// PC端快捷入口配置 - 与APP端保持一致
const quickLinks: QuickLink[] = [
  { icon: 'clipboard-list', label: '工单管理', path: '/pc/work-orders', color: '#1E88E5', description: '工单任务处理' },
  { icon: 'users', label: '客户管理', path: '/pc/customers', color: '#00B894', description: '客户信息管理' },
  { icon: 'file-signature', label: '合同管理', path: '/pc/contracts', color: '#F39C12', description: '合同文档管理' },
  { icon: 'microchip', label: '设备管理', path: '/pc/devices', color: '#9B59B6', description: '设备档案维护' },
  { icon: 'box-open', label: '仓库管理', path: '/pc/materials', color: '#E74C3C', description: '物料仓储管理' },
  { icon: 'magnifying-glass', label: '查询助手', path: '/pc/query-assistant', color: '#2ECC71', description: '多维度数据查询' },
  { icon: 'book', label: '知识库', path: '/pc/knowledge', color: '#F1C40F', description: '知识文档库' },
  { icon: 'chart-pie', label: '统计报表', path: '/pc/reports', color: '#3498DB', description: '数据统计分析' },
  { icon: 'user-gear', label: '账号管理', path: '/pc/account-settings', color: '#E91E63', description: '用户账号设置' },
  { icon: 'file-lines', label: '日志查询', path: '/pc/logs', color: '#7F8C8D', description: '系统日志查询' },
  { icon: 'broom', label: '系统清理', path: '/pc/cleanup', color: '#95A5A6', description: '清理系统缓存' },
  { icon: 'images', label: '相册管理', path: '/pc/gallery', color: '#FF6B9D', description: '图片相册管理' },
  { icon: 'folder', label: '文件管理', path: '/pc/files', color: '#5D6D7E', description: '文件资料管理' },
  { icon: 'comments', label: '会议纪要', path: '/pc/meeting-minutes', color: '#27AE60', description: '会议记录管理' },
  { icon: 'bell', label: '工作提醒', path: '/pc/reminders', color: '#E74C3C', description: '待办事项提醒' },
  { icon: 'clipboard-check', label: '工单待填提醒', path: '/pc/work-order-reminders', color: '#FF6B6B', description: '待填写工单提醒' },
  { icon: 'sitemap', label: '组织结构', path: '/pc/organization', color: '#00CEC9', description: '公司组织架构' },
  { icon: 'code-branch', label: '版本管理', path: '/pc/version-management', color: '#8E44AD', description: 'APP版本管理' },
];

interface RecentActivity {
  id: number;
  type: string;
  action: string;
  target: string;
  time: string;
  user: string;
  icon: string;
  color: string;
}

export default function PCDashboard() {
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const fetchRecentActivities = useCallback(async () => {
    setLoading(true);
    try {
      // 并行获取各模块最新数据
      const [customersRes, devicesRes, contractsRes, workOrdersRes] = await Promise.all([
        fetch(`${API_BASE}/api/v1/customers`).catch(() => ({ ok: false, json: () => ({ customers: [] }) })),
        fetch(`${API_BASE}/api/v1/devices`).catch(() => ({ ok: false, json: () => ({ devices: [] }) })),
        fetch(`${API_BASE}/api/v1/contracts`).catch(() => ({ ok: false, json: () => ({ contracts: [] }) })),
        fetch(`${API_BASE}/api/v1/work-orders`).catch(() => ({ ok: false, json: () => ({ work_orders: [] }) })),
      ]);

      const [customersData, devicesData, contractsData, workOrdersData] = await Promise.all([
        customersRes.json().catch(() => ({ customers: [] })),
        devicesRes.json().catch(() => ({ devices: [] })),
        contractsRes.json().catch(() => ({ contracts: [] })),
        workOrdersRes.json().catch(() => ({ work_orders: [] })),
      ]);

      // 整合最近活动
      const activities: RecentActivity[] = [];

      // 添加客户
      const customers = Array.isArray(customersData) ? customersData : (customersData.customers || []);
      customers.slice(0, 2).forEach((c: any) => {
        activities.push({
          id: `c-${c.id}`,
          type: 'customer',
          action: '新增客户',
          target: c.name || c.customer_name || '未知客户',
          time: formatTime(c.created_at || c.created_at),
          user: c.created_by || '系统',
          icon: 'user-plus',
          color: '#4F8EF7',
        });
      });

      // 添加设备
      const devices = Array.isArray(devicesData) ? devicesData : (devicesData.devices || []);
      devices.slice(0, 2).forEach((d: any) => {
        activities.push({
          id: `d-${d.id}`,
          type: 'device',
          action: d.status === '在线' ? '设备上线' : '新增设备',
          target: d.name || d.device_name || '未知设备',
          time: formatTime(d.created_at),
          user: d.created_by || '系统',
          icon: 'tablet-screen-button',
          color: '#52C41A',
        });
      });

      // 添加合同
      const contracts = Array.isArray(contractsData) ? contractsData : (contractsData.contracts || []);
      contracts.slice(0, 2).forEach((c: any) => {
        activities.push({
          id: `co-${c.id}`,
          type: 'contract',
          action: '新增合同',
          target: c.name || c.contract_name || c.contract_number || '未知合同',
          time: formatTime(c.created_at),
          user: c.created_by || '系统',
          icon: 'file-contract',
          color: '#FAAD14',
        });
      });

      // 添加工单
      const workOrders = Array.isArray(workOrdersData) ? workOrdersData : (workOrdersData.work_orders || []);
      workOrders.slice(0, 2).forEach((w: any) => {
        activities.push({
          id: `w-${w.id}`,
          type: 'work-order',
          action: getWorkOrderAction(w.status),
          target: w.title || w.work_order_number || '未知工单',
          time: formatTime(w.created_at),
          user: w.handler || w.created_by || '系统',
          icon: 'clipboard-list',
          color: '#722ED1',
        });
      });

      // 按时间排序
      activities.sort((a, b) => {
        if (!a.time || a.time === '刚刚') return 1;
        if (!b.time || b.time === '刚刚') return -1;
        return a.time.localeCompare(b.time, 'zh-CN', { numeric: true });
      });

      setRecentActivities(activities.slice(0, 8));
    } catch (error) {
      console.error('Failed to fetch recent activities:', error);
      // 使用默认数据
      setRecentActivities([
        { id: 1, type: 'customer', action: '系统运行中', target: '数据同步完成', time: '刚刚', user: '系统', icon: 'check-circle', color: '#52C41A' },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecentActivities();
  }, [fetchRecentActivities]);

  // 格式化时间
  function formatTime(dateStr?: string): string {
    if (!dateStr) return '未知';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  }

  function getWorkOrderAction(status?: string): string {
    const actions: Record<string, string> = {
      '待处理': '新增工单',
      '处理中': '工单进行中',
      '已完成': '工单已完成',
      '已取消': '工单已取消',
    };
    return actions[status || ''] || '新增工单';
  }

  // 获取用户信息
  const [userInfo, setUserInfo] = useState<any>({});
  
  useEffect(() => {
    const loadUserInfo = async () => {
      const userStr = await storage.getItem('user');
      if (userStr) {
        try {
          setUserInfo(JSON.parse(userStr));
        } catch {
          setUserInfo({});
        }
      }
    };
    loadUserInfo();
  }, []);
  
  const greeting = getGreeting();

  function getGreeting(): string {
    const hour = currentTime.getHours();
    if (hour < 6) return '凌晨好';
    if (hour < 9) return '早上好';
    if (hour < 12) return '上午好';
    if (hour < 14) return '中午好';
    if (hour < 18) return '下午好';
    if (hour < 22) return '晚上好';
    return '夜深了';
  }

  return (
    <PCLayout>
      {/* 欢迎区域 */}
      <div className="dashboard-welcome">
        <div className="welcome-content">
          <h1 className="welcome-title">{greeting}，{userInfo.name || userInfo.username || '管理员'}</h1>
          <p className="welcome-date">
            {currentTime.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
          </p>
        </div>
        <div className="welcome-decoration">
          <div className="decoration-circle circle-1"></div>
          <div className="decoration-circle circle-2"></div>
          <div className="decoration-circle circle-3"></div>
        </div>
      </div>

      <div className="dashboard-content">
        {/* 快捷入口 */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2 className="section-title">
              <FontAwesome6 name="th-large" size={16} color="#4F8EF7" style={{ marginRight: 8 }} />
              快捷入口
            </h2>
          </div>
          <div className="quick-links-grid">
            {quickLinks.map((link, index) => (
              <a
                key={index}
                href={link.path}
                className="quick-link-card"
                style={{ '--link-color': link.color } as React.CSSProperties}
              >
                <div className="quick-link-icon">
                  <FontAwesome6 name={link.icon as any} size={24} color={link.color} />
                </div>
                <div className="quick-link-info">
                  <span className="quick-link-label">{link.label}</span>
                  <span className="quick-link-desc">{link.description}</span>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* 最近活动 */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2 className="section-title">
              <FontAwesome6 name="clock-rotate-left" size={16} color="#722ED1" style={{ marginRight: 8 }} />
              最近活动
            </h2>
            <button className="section-refresh" onClick={fetchRecentActivities}>
              <FontAwesome6 name="refresh" size={14} color="#999" />
              刷新
            </button>
          </div>
          <div className="recent-activities">
            {loading ? (
              <div className="activities-loading">
                <div className="loading-spinner"></div>
                <span>加载中...</span>
              </div>
            ) : recentActivities.length === 0 ? (
              <div className="activities-empty">
                <FontAwesome6 name="inbox" size={40} color="#ccc" />
                <span>暂无最近活动</span>
              </div>
            ) : (
              recentActivities.map((activity) => (
                <div key={activity.id} className="activity-item">
                  <div className="activity-icon" style={{ backgroundColor: `${activity.color}15`, color: activity.color }}>
                    <FontAwesome6 name={activity.icon as any} size={16} />
                  </div>
                  <div className="activity-content">
                    <div className="activity-main">
                      <span className="activity-action">{activity.action}</span>
                      <span className="activity-target">{activity.target}</span>
                    </div>
                    <div className="activity-meta">
                      <span className="activity-user">
                        <FontAwesome6 name="user" size={11} style={{ marginRight: 4 }} />
                        {activity.user}
                      </span>
                      <span className="activity-time">
                        <FontAwesome6 name="clock" size={11} style={{ marginRight: 4 }} />
                        {activity.time}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <style>{`
        .dashboard-welcome {
          position: relative;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 16px;
          padding: 32px 40px;
          margin-bottom: 24px;
          overflow: hidden;
          color: white;
        }

        .welcome-content {
          position: relative;
          z-index: 1;
        }

        .welcome-title {
          font-size: 28px;
          font-weight: 600;
          margin: 0 0 8px 0;
          color: white;
        }

        .welcome-date {
          font-size: 14px;
          margin: 0;
          opacity: 0.9;
        }

        .welcome-decoration {
          position: absolute;
          right: 0;
          top: 0;
          bottom: 0;
          width: 300px;
        }

        .decoration-circle {
          position: absolute;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
        }

        .circle-1 {
          width: 200px;
          height: 200px;
          right: -50px;
          top: -80px;
        }

        .circle-2 {
          width: 150px;
          height: 150px;
          right: 80px;
          bottom: -60px;
        }

        .circle-3 {
          width: 80px;
          height: 80px;
          right: 20px;
          top: 50%;
          transform: translateY(-50%);
        }

        .dashboard-content {
          display: grid;
          grid-template-columns: 1fr 400px;
          gap: 24px;
        }

        .dashboard-section {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
        }

        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid #f0f0f0;
        }

        .section-title {
          font-size: 16px;
          font-weight: 600;
          color: #333;
          margin: 0;
          display: flex;
          align-items: center;
        }

        .section-refresh {
          display: flex;
          align-items: center;
          gap: 4px;
          background: none;
          border: none;
          color: #999;
          font-size: 12px;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 4px;
          transition: all 0.2s;
        }

        .section-refresh:hover {
          background: #f5f5f5;
          color: #666;
        }

        /* 快捷入口网格 - 适配18个入口 */
        .quick-links-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 12px;
        }

        .quick-link-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 16px 8px;
          background: #fafafa;
          border-radius: 10px;
          text-decoration: none;
          transition: all 0.25s ease;
          border: 1px solid transparent;
        }

        .quick-link-card:hover {
          background: white;
          border-color: var(--link-color);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          transform: translateY(-2px);
        }

        .quick-link-icon {
          width: 42px;
          height: 42px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
          margin-bottom: 10px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }

        .quick-link-info {
          text-align: center;
        }

        .quick-link-label {
          display: block;
          font-size: 13px;
          font-weight: 500;
          color: #333;
          margin-bottom: 3px;
        }

        .quick-link-desc {
          display: block;
          font-size: 11px;
          color: #999;
        }

        /* 最近活动 */
        .recent-activities {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .activities-loading,
        .activities-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          color: #999;
          gap: 12px;
        }

        .loading-spinner {
          width: 24px;
          height: 24px;
          border: 2px solid #f0f0f0;
          border-top-color: #4F8EF7;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .activity-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px;
          background: #fafafa;
          border-radius: 8px;
          transition: all 0.2s;
        }

        .activity-item:hover {
          background: #f0f7ff;
        }

        .activity-icon {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .activity-content {
          flex: 1;
          min-width: 0;
        }

        .activity-main {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
        }

        .activity-action {
          font-size: 13px;
          font-weight: 500;
          color: #333;
        }

        .activity-target {
          font-size: 13px;
          color: #666;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .activity-meta {
          display: flex;
          align-items: center;
          gap: 16px;
          font-size: 12px;
          color: #999;
        }

        .activity-user,
        .activity-time {
          display: flex;
          align-items: center;
        }

        /* 响应式 */
        @media (max-width: 1400px) {
          .quick-links-grid {
            grid-template-columns: repeat(5, 1fr);
          }
        }

        @media (max-width: 1200px) {
          .dashboard-content {
            grid-template-columns: 1fr;
          }
          
          .quick-links-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        @media (max-width: 900px) {
          .quick-links-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (max-width: 768px) {
          .quick-links-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .dashboard-welcome {
            padding: 24px;
          }
          
          .welcome-title {
            font-size: 22px;
          }
        }
      `}</style>
    </PCLayout>
  );
}
