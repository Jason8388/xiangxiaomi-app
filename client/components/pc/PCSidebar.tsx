import React, { useState } from 'react';
import { FontAwesome6 } from '@expo/vector-icons';

interface NavItem {
  key: string;
  icon: keyof typeof FontAwesome6.glyphMap;
  label: string;
  path?: string;
  children?: NavItem[];
}

const navItems: NavItem[] = [
  { key: 'dashboard', icon: 'gauge-high', label: '工作台', path: '/pc/dashboard' },
  { key: 'customers', icon: 'users', label: '客户管理', path: '/pc/customers' },
  { key: 'devices', icon: 'mobile-screen', label: '设备管理', path: '/pc/devices' },
  { key: 'contracts', icon: 'file-contract', label: '合同管理', path: '/pc/contracts' },
  { key: 'after-sales', icon: 'screwdriver-wrench', label: '售后服务', path: '/pc/after-sales' },
  { key: 'materials', icon: 'box-open', label: '物料管理', path: '/pc/materials' },
  { key: 'knowledge', icon: 'book-open', label: '知识库', path: '/pc/knowledge' },
  { key: 'meeting-minutes', icon: 'clipboard-list', label: '会议纪要', path: '/pc/meeting-minutes' },
  { key: 'files', icon: 'folder-open', label: '文件管理', path: '/pc/files' },
  { key: 'reports', icon: 'chart-pie', label: '统计报表', path: '/pc/reports' },
];

const systemItems: NavItem[] = [
  { key: 'settings', icon: 'gear', label: '系统设置', path: '/pc/settings' },
  { key: 'help', icon: 'circle-question', label: '帮助中心', path: '/pc/help' },
];

interface PCSidebarProps {
  collapsed: boolean;
  activeKey: string;
  onToggle: () => void;
  onNavigate: (path: string) => void;
}

export function PCSidebar({ collapsed, activeKey, onToggle, onNavigate }: PCSidebarProps) {
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);

  const handleItemClick = (item: NavItem) => {
    if (item.children) {
      setExpandedKeys(prev =>
        prev.includes(item.key)
          ? prev.filter(k => k !== item.key)
          : [...prev, item.key]
      );
    } else if (item.path) {
      onNavigate(item.path);
    }
  };

  const renderNavItem = (item: NavItem, level: number = 0) => {
    const isActive = activeKey === item.key;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedKeys.includes(item.key);

    return (
      <div key={item.key}>
        <div
          className={`pc-nav-item ${isActive ? 'active' : ''}`}
          onClick={() => handleItemClick(item)}
          title={collapsed ? item.label : undefined}
        >
          <FontAwesome6 name={item.icon} size={16} style={{ width: 24, textAlign: 'center' }} />
          <span className="pc-nav-text">{item.label}</span>
          {hasChildren && !collapsed && (
            <FontAwesome6
              name={isExpanded ? 'chevron-down' : 'chevron-right'}
              size={12}
              style={{ marginLeft: 'auto' }}
            />
          )}
        </div>
        {hasChildren && isExpanded && !collapsed && (
          <div className="pc-nav-submenu">
            {item.children!.map(child => renderNavItem(child, 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside className={`pc-sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* 侧边栏头部 */}
      <div className="pc-sidebar-header">
        <div
          className="pc-avatar"
          style={{
            width: 32,
            height: 32,
            background: 'linear-gradient(135deg, #1677ff 0%, #0958d9 100%)',
            color: '#ffffff',
            fontSize: 16,
            fontWeight: 'bold',
          }}
        >
          项
        </div>
        <span className="pc-sidebar-title">项小秘</span>
      </div>

      {/* 侧边栏导航 */}
      <nav className="pc-nav">
        <div className="pc-nav-group-title">
          {collapsed ? '•••' : '功能菜单'}
        </div>
        {navItems.map(item => renderNavItem(item))}

        <div className="pc-nav-group-title" style={{ marginTop: 16 }}>
          {collapsed ? '•••' : '系统'}
        </div>
        {systemItems.map(item => renderNavItem(item))}
      </nav>

      {/* 侧边栏底部 */}
      <div className="pc-sidebar-footer">
        <div
          className="pc-nav-item"
          onClick={onToggle}
          style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}
        >
          <FontAwesome6
            name={collapsed ? 'chevron-right' : 'chevron-left'}
            size={14}
            style={{ width: 24, textAlign: 'center' }}
          />
          <span className="pc-nav-text">{collapsed ? '展开' : '收起'}</span>
        </div>
      </div>
    </aside>
  );
}

export { navItems, systemItems };
