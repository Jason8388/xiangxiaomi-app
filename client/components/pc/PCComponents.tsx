import React, { useState, useCallback, useEffect } from 'react';

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

// PC批量导入弹窗组件
export function PCImportModal({ visible, onClose, title, apiUrl, templateUrl, templateFields, onSuccess }: {
  visible: boolean;
  onClose: () => void;
  title: string;
  apiUrl: string;
  templateUrl?: string;
  templateFields?: string[];
  onSuccess?: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [xlsxReady, setXlsxReady] = useState(false);

  // 动态加载xlsx库
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const loadXlsx = async () => {
      if ((window as any).XLSX) {
        setXlsxReady(true);
        return;
      }
      
      return new Promise<void>((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
        
        // 设置超时
        const timeout = setTimeout(() => {
          console.error('xlsx library load timeout');
          resolve();
        }, 5000);
        
        script.onload = () => {
          clearTimeout(timeout);
          setXlsxReady(true);
          resolve();
        };
        script.onerror = () => {
          clearTimeout(timeout);
          console.error('Failed to load xlsx library');
          resolve();
        };
        document.head.appendChild(script);
      });
    };
    
    loadXlsx();
  }, []);

  if (!visible) return null;

  const sessionId = typeof window !== 'undefined' ? localStorage.getItem('session_id') : null;

  const handleFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setResult(null);
    
    // 预览Excel文件
    if (xlsxReady && (selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls'))) {
      const data = await selectedFile.arrayBuffer();
      const workbook = new (window as any).XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = (window as any).XLSX.utils.sheet_to_json(worksheet);
      setPreviewData(jsonData.slice(0, 3));
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${sessionId}` },
        body: formData,
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult({ success: data.success || 0, failed: data.failed || 0, errors: data.errors || [] });
        if (data.success > 0) {
          onSuccess?.();
        }
      } else {
        setResult({ success: 0, failed: 1, errors: [data.error || '上传失败'] });
      }
    } catch (error) {
      setResult({ success: 0, failed: 1, errors: ['上传失败，请检查网络连接'] });
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    try {
      if (templateUrl) {
        // 直接从URL下载模板，使用完整的API地址
        const fullUrl = templateUrl.startsWith('http') ? templateUrl : `${API_BASE}${templateUrl}`;
        const link = document.createElement('a');
        link.href = fullUrl;
        // 根据URL后缀判断文件类型
        const isCsv = templateUrl.includes('.csv') || fullUrl.includes('/template');
        link.download = isCsv ? 'import_template.csv' : 'import_template.xlsx';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (xlsxReady && templateFields && templateFields.length > 0) {
        // 使用XLSX库生成模板
        try {
          const worksheet = (window as any).XLSX.utils.json_to_sheet(
            templateFields.map(field => ({ '字段名': field.replace('*', '') }))
          );
          const workbook = (window as any).XLSX.utils.book_new();
          (window as any).XLSX.utils.book_append_sheet(workbook, worksheet, '导入模板');
          (window as any).XLSX.writeFile(workbook, 'import_template.xlsx');
        } catch (xlsxError) {
          console.error('Error generating template with xlsx:', xlsxError);
          alert('生成模板失败，请稍后重试');
        }
      } else {
        console.warn('xlsx ready:', xlsxReady, 'templateFields:', templateFields);
        alert('模板生成库未就绪，请刷新页面后重试');
      }
    } catch (error) {
      console.error('Error downloading template:', error);
      alert('下载模板失败，请稍后重试');
    }
  };

  const overlay = document.createElement('div');
  overlay.className = 'pc-modal-overlay';
  overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:1000;display:flex;align-items:center;justify-content:center;';
  overlay.innerHTML = `
    <div class="pc-modal" style="width:600px;max-height:80vh;display:flex;flex-direction:column;">
      <div class="pc-modal-header" style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid #eee;">
        <h3 class="pc-modal-title" style="margin:0;font-size:16px;font-weight:600;">${title}</h3>
        <button id="pc-import-close" style="background:none;border:none;font-size:20px;cursor:pointer;color:#999;">&times;</button>
      </div>
      <div style="flex:1;overflow-y:auto;padding:20px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
          <span style="font-size:14px;color:#666;">支持 .xlsx, .xls 格式</span>
          <button id="pc-download-template" style="background:none;border:none;color:#4F46E5;cursor:pointer;font-size:14px;">下载导入模板</button>
        </div>
        
        <div id="pc-drop-zone" style="border:2px dashed ${dragOver ? '#4F46E5' : '#ddd'};border-radius:8px;padding:40px;text-align:center;transition:all 0.3s;${dragOver ? 'background:#f5f5ff;' : ''}">
          <input type="file" id="pc-file-input" accept=".xlsx,.xls" style="display:none;" />
          <div style="font-size:32px;margin-bottom:8px;">📁</div>
          <div style="font-size:14px;color:#666;margin-bottom:8px;">${file ? file.name : '拖拽文件到此处，或点击选择文件'}</div>
          ${file ? `<button id="pc-remove-file" style="background:none;border:none;color:#FF4D4F;cursor:pointer;font-size:14px;">移除文件</button>` : ''}
        </div>
        
        ${previewData.length > 0 ? `
          <div style="margin-top:16px;">
            <div style="font-size:14px;font-weight:500;margin-bottom:8px;">数据预览（前3条）：</div>
            <table style="width:100%;border-collapse:collapse;font-size:12px;">
              <thead>
                <tr style="background:#f5f5f5;">
                  ${Object.keys(previewData[0]).slice(0, 5).map(key => `<th style="padding:8px;border:1px solid #eee;text-align:left;">${key}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${previewData.map((row, i) => `<tr style="background:${i % 2 === 0 ? '#fff' : '#fafafa'};">${Object.keys(previewData[0]).slice(0, 5).map(key => `<td style="padding:8px;border:1px solid #eee;">${row[key] || '-'}</td>`).join('')}</tr>`).join('')}
              </tbody>
            </table>
          </div>
        ` : ''}
        
        ${result ? `
          <div style="margin-top:16px;padding:16px;background:${result.failed > 0 ? '#fff2f0' : '#f6ffed'};border-radius:8px;">
            <div style="font-size:14px;font-weight:500;margin-bottom:8px;">导入结果</div>
            <div style="font-size:14px;">成功: <span style="color:#52c41a;font-weight:600;">${result.success}</span> | 失败: <span style="color:#ff4d4f;font-weight:600;">${result.failed}</span></div>
            ${result.errors.length > 0 ? `<div style="margin-top:8px;font-size:12px;color:#666;">${result.errors.slice(0, 3).join('<br/>')}</div>` : ''}
          </div>
        ` : ''}
      </div>
      <div class="pc-modal-footer" style="display:flex;justify-content:flex-end;gap:12px;padding:16px 20px;border-top:1px solid #eee;">
        <button id="pc-import-cancel" class="pc-btn pc-btn-default">取消</button>
        <button id="pc-import-submit" class="pc-btn pc-btn-primary" ${loading || !file ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''}>${loading ? '导入中...' : '开始导入'}</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // 事件绑定
  overlay.querySelector('#pc-import-close')?.addEventListener('click', () => { document.body.removeChild(overlay); onClose(); });
  overlay.querySelector('#pc-import-cancel')?.addEventListener('click', () => { document.body.removeChild(overlay); onClose(); });
  overlay.querySelector('#pc-download-template')?.addEventListener('click', downloadTemplate);
  
  overlay.querySelector('#pc-drop-zone')?.addEventListener('click', () => {
    (overlay.querySelector('#pc-file-input') as HTMLInputElement)?.click();
  });

  overlay.querySelector('#pc-file-input')?.addEventListener('change', (e: any) => {
    if (e.target.files?.[0]) handleFile(e.target.files[0]);
  });

  overlay.querySelector('#pc-remove-file')?.addEventListener('click', (e) => {
    e.stopPropagation();
    setFile(null);
    setPreviewData([]);
    (overlay.querySelector('#pc-file-input') as HTMLInputElement).value = '';
  });

  overlay.querySelector('#pc-import-submit')?.addEventListener('click', handleUpload);

  // 拖拽事件
  overlay.addEventListener('dragover', (e) => { e.preventDefault(); setDragOver(true); });
  overlay.addEventListener('dragleave', () => setDragOver(false));
  overlay.addEventListener('drop', (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer?.files?.[0]) handleFile(e.dataTransfer.files[0]);
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) { document.body.removeChild(overlay); onClose(); }
  });
}
