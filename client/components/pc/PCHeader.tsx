import React from 'react';

interface PCHeaderProps {
  breadcrumbs: { label: string; path?: string }[];
  user?: {
    name: string;
    avatar?: string;
    role: string;
  };
  onLogout: () => void;
  onRefresh: () => void;
}

export function PCHeader({ breadcrumbs, user, onLogout, onRefresh }: PCHeaderProps) {
  const getInitials = (name: string) => {
    return name?.slice(0, 2).toUpperCase() || '用户';
  };

  return (
    <header className="pc-header">
      <div className="pc-header-left">
        {/* 面包屑导航 */}
        <div className="pc-breadcrumb">
          {breadcrumbs.map((item, index) => (
            <React.Fragment key={index}>
              {index > 0 && <span className="pc-breadcrumb-separator">/</span>}
              <span
                className={`pc-breadcrumb-item ${item.path ? '' : 'disabled'}`}
                onClick={() => item.path && window.location.href = item.path}
                style={{ cursor: item.path ? 'pointer' : 'default' }}
              >
                {item.label}
              </span>
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="pc-header-right">
        {/* 刷新按钮 */}
        <button
          className="pc-btn pc-btn-text pc-btn-sm"
          onClick={onRefresh}
          title="刷新数据"
        >
          🔄 刷新
        </button>

        {/* 通知 */}
        <button
          className="pc-btn pc-btn-text pc-btn-sm"
          title="通知"
          style={{ position: 'relative' }}
        >
          🔔
          <span style={{
            position: 'absolute',
            top: -2,
            right: -2,
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: '#FF4D4F'
          }} />
        </button>

        {/* 用户信息 */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              className="pc-avatar"
              style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
            >
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
              ) : (
                getInitials(user.name)
              )}
            </div>
            <div style={{ lineHeight: 1.3 }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{user.name}</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>{user.role}</div>
            </div>
          </div>
        )}

        {/* 退出登录 */}
        <button
          className="pc-btn pc-btn-default pc-btn-sm"
          onClick={onLogout}
        >
          退出
        </button>
      </div>
    </header>
  );
}
