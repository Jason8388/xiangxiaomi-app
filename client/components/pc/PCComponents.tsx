import React, { useState, useCallback } from 'react';

// ==================== 统计卡片 ====================
interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  iconColor?: string;
  change?: number;
  changeLabel?: string;
}

export function PCStatCard({ title, value, icon, iconColor = '#4F8EF7', change, changeLabel }: StatCardProps) {
  return (
    <div className="pc-stat-card">
      <div className="pc-stat-header">
        <span className="pc-stat-title">{title}</span>
        <div className="pc-stat-icon" style={{ background: `${iconColor}15` }}>
          <span style={{ fontSize: 20 }}>{icon}</span>
        </div>
      </div>
      <div className="pc-stat-value">{value}</div>
      {change !== undefined && (
        <div className={`pc-stat-change ${change >= 0 ? 'up' : 'down'}`}>
          <span>{change >= 0 ? '↑' : '↓'}</span>
          <span>{Math.abs(change)}%</span>
          {changeLabel && <span style={{ color: '#999', marginLeft: 4 }}>{changeLabel}</span>}
        </div>
      )}
    </div>
  );
}

// ==================== 表格组件 ====================
interface Column<T> {
  key: string;
  title: string;
  width?: string | number;
  render?: (value: any, record: T, index: number) => React.ReactNode;
}

interface PCTableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: keyof T | ((record: T) => string);
  loading?: boolean;
  emptyText?: string;
  onRowClick?: (record: T) => void;
  selectedRowKeys?: string[];
  onSelectChange?: (keys: string[]) => void;
}

export function PCTable<T extends Record<string, any>>({
  columns,
  data,
  rowKey,
  loading,
  emptyText = '暂无数据',
  onRowClick,
  selectedRowKeys = [],
  onSelectChange,
}: PCTableProps<T>) {
  const getRowKey = (record: T) => {
    if (typeof rowKey === 'function') {
      return rowKey(record);
    }
    return String(record[rowKey]);
  };

  const isSelected = (record: T) => selectedRowKeys.includes(getRowKey(record));

  const handleSelectAll = () => {
    if (!onSelectChange) return;
    if (selectedRowKeys.length === data.length) {
      onSelectChange([]);
    } else {
      onSelectChange(data.map(d => getRowKey(d)));
    }
  };

  return (
    <div className="pc-table-wrapper">
      <table className="pc-table">
        <thead>
          <tr>
            {onSelectChange && (
              <th className="pc-table-checkbox">
                <input
                  type="checkbox"
                  checked={data.length > 0 && selectedRowKeys.length === data.length}
                  onChange={handleSelectAll}
                />
              </th>
            )}
            {columns.map(col => (
              <th key={col.key} style={{ width: col.width }}>
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length + (onSelectChange ? 1 : 0)} style={{ textAlign: 'center', padding: 40 }}>
                <div className="pc-spin" style={{ margin: '0 auto' }} />
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (onSelectChange ? 1 : 0)} style={{ textAlign: 'center', padding: 40 }}>
                <div className="pc-empty">
                  <div className="pc-empty-icon">📭</div>
                  <div className="pc-empty-text">{emptyText}</div>
                </div>
              </td>
            </tr>
          ) : (
            data.map((record, index) => (
              <tr
                key={getRowKey(record)}
                onClick={() => onRowClick?.(record)}
                style={{ cursor: onRowClick ? 'pointer' : 'default' }}
              >
                {onSelectChange && (
                  <td className="pc-table-checkbox" onClick={e => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected(record)}
                      onChange={() => {
                        const key = getRowKey(record);
                        if (isSelected(record)) {
                          onSelectChange(selectedRowKeys.filter(k => k !== key));
                        } else {
                          onSelectChange([...selectedRowKeys, key]);
                        }
                      }}
                    />
                  </td>
                )}
                {columns.map(col => (
                  <td key={col.key}>
                    {col.render
                      ? col.render(record[col.key], record, index)
                      : record[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// ==================== 分页组件 ====================
interface PCPaginationProps {
  current: number;
  pageSize: number;
  total: number;
  onChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  showSizeChanger?: boolean;
  pageSizeOptions?: number[];
}

export function PCPagination({
  current,
  pageSize,
  total,
  onChange,
  showSizeChanger,
  pageSizeOptions = [10, 20, 50, 100],
}: PCPaginationProps) {
  const totalPages = Math.ceil(total / pageSize);
  const start = (current - 1) * pageSize + 1;
  const end = Math.min(current * pageSize, total);

  const getPages = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (current <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (current >= totalPages - 3) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = current - 1; i <= current + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="pc-pagination">
      <div className="pc-pagination-info">
        显示 {start}-{end} 条，共 {total} 条
      </div>
      <div className="pc-pagination-controls">
        <button
          className="pc-pagination-btn"
          disabled={current === 1}
          onClick={() => onChange(current - 1)}
        >
          ‹
        </button>
        {getPages().map((page, index) => (
          <button
            key={index}
            className={`pc-pagination-btn ${page === current ? 'active' : ''}`}
            disabled={page === '...'}
            onClick={() => typeof page === 'number' && onChange(page)}
          >
            {page}
          </button>
        ))}
        <button
          className="pc-pagination-btn"
          disabled={current === totalPages}
          onClick={() => onChange(current + 1)}
        >
          ›
        </button>
      </div>
    </div>
  );
}

// ==================== 搜索栏 ====================
interface PCSearchBarProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  children?: React.ReactNode;
}

export function PCSearchBar({ placeholder = '搜索...', value, onChange, onSearch, children }: PCSearchBarProps) {
  return (
    <div className="pc-search-bar">
      <input
        type="text"
        className="pc-search-input"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && onSearch()}
      />
      <button className="pc-btn pc-btn-primary" onClick={onSearch}>
        🔍 搜索
      </button>
      {children}
    </div>
  );
}

// ==================== 模态框 ====================
interface PCModalProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: string | number;
}

export function PCModal({ visible, title, onClose, children, footer, width = 520 }: PCModalProps) {
  if (!visible) return null;

  return (
    <div className="pc-modal-overlay" onClick={onClose}>
      <div
        className="pc-modal"
        style={{ width }}
        onClick={e => e.stopPropagation()}
      >
        <div className="pc-modal-header">
          <h3 className="pc-modal-title">{title}</h3>
          <button className="pc-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="pc-modal-body">{children}</div>
        {footer && <div className="pc-modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

// ==================== 标签 ====================
interface PCTagProps {
  children: React.ReactNode;
  type?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
}

export function PCTag({ children, type = 'default' }: PCTagProps) {
  const typeClass = type !== 'default' ? `pc-tag-${type}` : '';
  return <span className={`pc-tag ${typeClass}`}>{children}</span>;
}

// ==================== 工具栏 ====================
interface PCToolbarProps {
  left?: React.ReactNode;
  right?: React.ReactNode;
}

export function PCToolbar({ left, right }: PCToolbarProps) {
  return (
    <div className="pc-toolbar">
      <div className="pc-toolbar-left">{left}</div>
      <div className="pc-toolbar-right">{right}</div>
    </div>
  );
}

// ==================== 卡片 ====================
interface PCCardProps {
  title?: string;
  children: React.ReactNode;
  extra?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function PCCard({ title, children, extra, footer, className = '' }: PCCardProps) {
  return (
    <div className={`pc-card ${className}`}>
      {title && (
        <div className="pc-card-header">
          <h3 className="pc-card-title">{title}</h3>
          {extra}
        </div>
      )}
      <div className="pc-card-body">{children}</div>
      {footer && <div className="pc-card-footer">{footer}</div>}
    </div>
  );
}

// ==================== 消息提示 ====================
type MessageType = 'success' | 'error' | 'warning';

interface MessageOptions {
  content: string;
  type?: MessageType;
  duration?: number;
}

let messageTimer: NodeJS.Timeout | null = null;

export function PCMessage({ content, type = 'success', duration = 3000 }: MessageOptions) {
  const messageClass = `pc-message ${type}`;
  const iconMap = { success: '✓', error: '✕', warning: '⚠' };

  const el = document.createElement('div');
  el.className = messageClass;
  el.innerHTML = `<span>${iconMap[type]}</span><span>${content}</span>`;
  document.body.appendChild(el);

  setTimeout(() => {
    el.remove();
  }, duration);
}

// 导出确认对话框
export function PCConfirm(options: {
  title: string;
  content: string;
  onOk: () => void;
  onCancel?: () => void;
  okText?: string;
  cancelText?: string;
  type?: 'warning' | 'danger';
}) {
  const {
    title,
    content,
    onOk,
    onCancel,
    okText = '确定',
    cancelText = '取消',
    type = 'warning',
  } = options;

  const overlay = document.createElement('div');
  overlay.className = 'pc-modal-overlay';
  overlay.innerHTML = `
    <div class="pc-modal" style="min-width: 400px;">
      <div class="pc-modal-header">
        <h3 class="pc-modal-title">${title}</h3>
      </div>
      <div class="pc-modal-body">
        <p style="font-size: 14px; color: #666;">${content}</p>
      </div>
      <div class="pc-modal-footer">
        <button class="pc-btn pc-btn-default" id="pc-confirm-cancel">${cancelText}</button>
        <button class="pc-btn ${type === 'danger' ? 'pc-btn-danger' : 'pc-btn-primary'}" id="pc-confirm-ok">${okText}</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  overlay.querySelector('#pc-confirm-cancel')?.addEventListener('click', () => {
    overlay.remove();
    onCancel?.();
  });

  overlay.querySelector('#pc-confirm-ok')?.addEventListener('click', () => {
    overlay.remove();
    onOk();
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.remove();
      onCancel?.();
    }
  });
}
