import React, { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import { PCSidebar } from './PCSidebar';
import { PCHeader } from './PCHeader';
import { storage } from '@/utils/storage';

interface PCLayoutProps {
  children: React.ReactNode;
  activePath?: string;
}

const routeMap: Record<string, { label: string; path: string }[]> = {
  '/pc/dashboard': [{ label: '首页' }],
  '/pc/customers': [{ label: '客户管理' }],
  '/pc/customer-detail': [{ label: '客户管理', path: '/pc/customers' }, { label: '客户详情' }],
  '/pc/devices': [{ label: '设备管理' }],
  '/pc/device-detail': [{ label: '设备管理', path: '/pc/devices' }, { label: '设备详情' }],
  '/pc/contracts': [{ label: '合同管理' }],
  '/pc/contract-detail': [{ label: '合同管理', path: '/pc/contracts' }, { label: '合同详情' }],
  '/pc/work-orders': [{ label: '工单管理' }],
  '/pc/materials': [{ label: '仓库管理' }],
  '/pc/knowledge': [{ label: '知识库' }],
  '/pc/meeting-minutes': [{ label: '会议纪要' }],
  '/pc/files': [{ label: '文件管理' }],
  '/pc/reports': [{ label: '统计报表' }],
  '/pc/gallery': [{ label: '相册管理' }],
  '/pc/logs': [{ label: '日志查询' }],
  '/pc/account-settings': [{ label: '账号管理' }],
  '/pc/settings': [{ label: '系统设置' }],
  '/pc/help': [{ label: '帮助中心' }],
  '/pc/query-assistant': [{ label: '查询助手' }],
};

export function PCLayout({ children, activePath }: PCLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState<any>(null);

  const currentPath = activePath || (typeof window !== 'undefined' ? window.location.pathname : '/pc/dashboard');
  const breadcrumbs = routeMap[currentPath] || [{ label: '首页' }];

  // 获取当前激活的菜单key
  const getActiveKey = () => {
    const path = currentPath.split('/').slice(0, 3).join('/');
    for (const key in routeMap) {
      if (key.includes(path) || currentPath.includes(key.replace('/pc/', ''))) {
        return key.replace('/pc/', '').split('/')[0] || 'dashboard';
      }
    }
    return currentPath.replace('/pc/', '').split('/')[0] || 'dashboard';
  };

  useEffect(() => {
    // 获取用户信息
    const loadUser = async () => {
      const storedUser = await storage.getItem('user');
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          setUser({ name: '管理员', role: '管理员' });
        }
      } else {
        setUser({ name: '管理员', role: '管理员' });
      }
    };
    loadUser();
  }, []);

  const handleNavigate = useCallback((path: string) => {
    if (typeof window !== 'undefined') {
      window.location.href = path;
    }
  }, []);

  const handleToggle = useCallback(() => {
    setCollapsed(prev => !prev);
  }, []);

  const handleRefresh = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }, []);

  const handleLogout = useCallback(async () => {
    if (typeof window !== 'undefined') {
      try {
        // 获取 session_id
        const sessionId = localStorage.getItem('session_id');

        // 如果有 session_id，调用后端退出登录 API
        if (sessionId) {
          try {
            const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL || 'http://localhost:9091'}/api/v1/sessions/logout/${sessionId}`, {
              method: 'POST',
            });

            if (response.ok) {
              console.log('[PCLayout] 后端会话已注销');
            } else {
              console.warn('[PCLayout] 后端会话注销失败:', response.status);
            }
          } catch (apiError) {
            console.warn('[PCLayout] 后端 API 调用失败，继续清理本地数据:', apiError);
          }
        }

        // 清理所有登录相关的存储数据
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('session_id');

        console.log('[PCLayout] 已清理用户登录数据，准备跳转到登录页');

        // 跳转到登录页
        window.location.href = '/pc/login';
      } catch (error) {
        console.error('[PCLayout] 退出登录失败:', error);
      }
    }
  }, []);

  return (
    <div className="pc-layout">
      <PCSidebar
        collapsed={collapsed}
        activeKey={getActiveKey()}
        onToggle={handleToggle}
        onNavigate={handleNavigate}
      />
      <div className={`pc-main ${collapsed ? 'collapsed' : ''}`}>
        <PCHeader
          breadcrumbs={breadcrumbs}
          user={user}
          onLogout={handleLogout}
          onRefresh={handleRefresh}
        />
        <main className="pc-content">
          {children}
        </main>
      </div>
    </div>
  );
}
