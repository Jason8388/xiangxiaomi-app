import React, { useState } from 'react';

interface NavItem {
  key: string;
  icon: string;
  label: string;
  path?: string;
  children?: NavItem[];
}

const navItems: NavItem[] = [
  { key: 'dashboard', icon: '🏠', label: '工作台', path: '/pc/dashboard' },
  { key: 'customers', icon: '👥', label: '客户管理', path: '/pc/customers' },
  { key: 'devices', icon: '📱', label: '设备管理', path: '/pc/devices' },
  { key: 'contracts', icon: '📋', label: '合同管理', path: '/pc/contracts' },
  { key: 'after-sales', icon: '🔧', label: '售后服务', path: '/pc/after-sales' },
  { key: 'materials', icon: '📦', label: '物料管理', path: '/pc/materials' },
  { key: 'knowledge', icon: '📚', label: '知识库', path: '/pc/knowledge' },
  { key: 'meeting-minutes', icon: '📝', label: '会议纪要', path: '/pc/meeting-minutes' },
  { key: 'files', icon: '📁', label: '文件管理', path: '/pc/files' },
  { key: 'reports', icon: '📊', label: '统计报表', path: '/pc/reports' },
];

const systemItems: NavItem[] = [
  { key: 'settings', icon: '⚙️', label: '系统设置', path: '/pc/settings' },
  { key: 'help', icon: '❓', label: '帮助中心', path: '/pc/help' },
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
          style={{ paddingLeft: level === 0 ? undefined : 44 }}
          title={collapsed ? item.label : undefined}
        >
          <span className="pc-nav-icon">{item.icon}</span>
          <span className="pc-nav-text">{item.label}</span>
          {hasChildren && !collapsed && (
            <span style={{ marginLeft: 'auto', fontSize: 12 }}>
              {isExpanded ? '▼' : '▶'}
            </span>
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
      <div className="pc-sidebar-header">
        <img src="/assets/images/icon.png" alt="Logo" className="pc-sidebar-logo" />
        <span className="pc-sidebar-title">项小秘</span>
      </div>

      <nav className="pc-nav">
        <div style={{ padding: '8px 12px', fontSize: 11, color: '#999', textTransform: 'uppercase' }}>
          {collapsed ? '•••' : '功能菜单'}
        </div>
        {navItems.map(item => renderNavItem(item))}

        <div style={{ padding: '8px 12px', fontSize: 11, color: '#999', textTransform: 'uppercase', marginTop: 16 }}>
          {collapsed ? '•••' : '系统'}
        </div>
        {systemItems.map(item => renderNavItem(item))}
      </nav>

      <div style={{ padding: 16, borderTop: '1px solid var(--color-border)' }}>
        <div
          className="pc-nav-item"
          onClick={onToggle}
          style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}
        >
          <span className="pc-nav-icon">{collapsed ? '▶' : '◀'}</span>
          <span className="pc-nav-text">{collapsed ? '展开' : '收起'}</span>
        </div>
      </div>
    </aside>
  );
}

export { navItems, systemItems };
