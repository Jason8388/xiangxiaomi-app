import React, { useState, useEffect, useCallback } from 'react';
import '@/assets/styles/pc-global.css';
import { PCLayout } from '@/components/pc/PCLayout';
import { PCStatCard } from '@/components/pc/PCComponents';
import { PCTable } from '@/components/pc/PCComponents';
import { PCCard } from '@/components/pc/PCComponents';
import { PCSearchBar } from '@/components/pc/PCComponents';
import { PCModal } from '@/components/pc/PCComponents';
import { PCPagination } from '@/components/pc/PCComponents';

const API_BASE = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || 'http://localhost:9091';

// 色彩规范
const COLORS = {
  primary: '#1677ff',           // 专业商务蓝 - 主色
  primaryLight: '#e6f4ff',      // 主色浅色
  success: '#52c41a',           // 绿色 - 正面数据
  danger: '#ff4d4f',            // 红色 - 负面数据
  warning: '#faad14',           // 警告色
  bg: '#f5f7fa',                // 背景色
  card: '#ffffff',              // 卡片背景
  title: '#333333',             // 标题
  text: '#666666',              // 正文
  secondary: '#999999',         // 辅助文字
  border: '#e8e8e8',            // 边框
};

interface WorkOrder {
  id: number;
  order_no: string;
  title: string;
  customer_name: string;
  device_name: string;
  type: 'repair' | 'maintenance' | 'installation';
  priority: 'urgent' | 'normal' | 'low';
  status: 'pending' | 'processing' | 'completed';
  created_at: string;
  description?: string;
  handler?: string;
  completion_time?: string;
}

const typeMap = { repair: '维修', maintenance: '保养', installation: '安装' };
const typeIconMap = { repair: '🔧', maintenance: '⚙️', installation: '📦' };

export default function PCAfterSales() {
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [editingOrder, setEditingOrder] = useState<WorkOrder | null>(null);
  const [viewingOrder, setViewingOrder] = useState<WorkOrder | null>(null);
  const [formData, setFormData] = useState({ 
    order_no: '', 
    title: '', 
    customer_name: '', 
    device_name: '', 
    type: 'repair' as const, 
    priority: 'normal' as const, 
    status: 'pending' as const, 
    description: '', 
    handler: '' 
  });
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/v1/after-sales`);
      const data = await response.json();
      const list = Array.isArray(data) ? data : (data.orders || []);
      setOrders(list);
      setPagination(prev => ({ ...prev, total: list.length }));
    } catch (error) {
      setOrders([
        { id: 1, order_no: 'WO-2024-001', title: '设备故障维修', customer_name: '北京科技有限公司', device_name: '变频器A-001', type: 'repair', priority: 'urgent', status: 'pending', created_at: '2024-03-20', description: '设备无法启动，需要紧急维修', handler: '张师傅' },
        { id: 2, order_no: 'WO-2024-002', title: '定期保养服务', customer_name: '上海网络技术', device_name: 'PLC控制柜', type: 'maintenance', priority: 'normal', status: 'processing', created_at: '2024-03-18', description: '季度例行保养维护', handler: '李师傅' },
        { id: 3, order_no: 'WO-2024-003', title: '新设备安装调试', customer_name: '广州智能科技', device_name: '伺服驱动器', type: 'installation', priority: 'low', status: 'completed', created_at: '2024-03-15', description: '新采购设备安装调试完成', handler: '王师傅', completion_time: '2024-03-18' },
        { id: 4, order_no: 'WO-2024-004', title: '电路板更换', customer_name: '深圳电子厂', device_name: '工业主板', type: 'repair', priority: 'urgent', status: 'processing', created_at: '2024-03-19', description: '电路板损坏需要更换', handler: '赵师傅' },
        { id: 5, order_no: 'WO-2024-005', title: '年度设备体检', customer_name: '杭州制造', device_name: '数控机床', type: 'maintenance', priority: 'normal', status: 'pending', created_at: '2024-03-21', description: '年度设备全面体检', handler: '' },
      ]);
      setPagination(prev => ({ ...prev, total: 5 }));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    completed: orders.filter(o => o.status === 'completed').length,
  };

  const columns = [
    { 
      key: 'order_no', 
      title: '工单编号', 
      width: 140,
      render: (val: string) => (
        <span style={{ 
          fontFamily: 'Consolas, Monaco, monospace', 
          fontSize: 13, 
          fontWeight: 500, 
          color: COLORS.primary 
        }}>{val}</span>
      )
    },
    { 
      key: 'title', 
      title: '工单标题', 
      width: 200,
      render: (val: string, record: WorkOrder) => (
        <div>
          <div style={{ fontSize: 14, fontWeight: 500, color: COLORS.title, marginBottom: 2 }}>{val}</div>
          <div style={{ fontSize: 12, color: COLORS.secondary }}>{typeIconMap[record.type]} {typeMap[record.type]}</div>
        </div>
      )
    },
    { 
      key: 'customer_name', 
      title: '客户名称', 
      width: 140,
      render: (val: string) => (
        <span style={{ fontSize: 14, color: COLORS.text }}>{val}</span>
      )
    },
    { 
      key: 'device_name', 
      title: '设备名称', 
      width: 140,
      render: (val: string) => (
        <span style={{ fontSize: 14, color: COLORS.text }}>{val || '-'}</span>
      )
    },
    { 
      key: 'priority', 
      title: '优先级', 
      width: 90,
      render: (val: string) => {
        const config = {
          urgent: { label: '紧急', color: COLORS.danger, bg: '#fff1f0' },
          normal: { label: '普通', color: COLORS.warning, bg: '#fffbe6' },
          low: { label: '低', color: COLORS.secondary, bg: '#f5f5f5' }
        };
        const { label, color, bg } = config[val as keyof typeof config];
        return (
          <span style={{ 
            display: 'inline-block', 
            padding: '3px 10px', 
            borderRadius: 4, 
            fontSize: 12, 
            color: color,
            background: bg,
            fontWeight: 500
          }}>
            {label}
          </span>
        );
      }
    },
    { 
      key: 'status', 
      title: '状态', 
      width: 90,
      render: (val: string) => {
        const config = {
          pending: { label: '待处理', color: COLORS.warning, bg: '#fffbe6' },
          processing: { label: '处理中', color: COLORS.primary, bg: COLORS.primaryLight },
          completed: { label: '已完成', color: COLORS.success, bg: '#f6ffed' }
        };
        const { label, color, bg } = config[val as keyof typeof config];
        return (
          <span style={{ 
            display: 'inline-block', 
            padding: '3px 10px', 
            borderRadius: 4, 
            fontSize: 12, 
            color: color,
            background: bg,
            fontWeight: 500
          }}>
            {label}
          </span>
        );
      }
    },
    { 
      key: 'handler', 
      title: '负责人', 
      width: 80,
      render: (val: string) => (
        <span style={{ fontSize: 14, color: val ? COLORS.text : COLORS.secondary }}>
          {val || '待指派'}
        </span>
      )
    },
    { 
      key: 'created_at', 
      title: '创建时间', 
      width: 100,
      render: (val: string) => (
        <span style={{ fontSize: 13, color: COLORS.secondary }}>{val}</span>
      )
    },
    { 
      key: 'actions', 
      title: '操作', 
      width: 140, 
      render: (_: any, record: WorkOrder) => (
        <div style={{ display: 'flex', gap: 12 }}>
          <button 
            style={{ 
              border: 'none', 
              background: 'none', 
              padding: 0,
              fontSize: 13, 
              color: COLORS.primary, 
              cursor: 'pointer' 
            }}
            onClick={() => { setViewingOrder(record); setDetailVisible(true); }}
          >
            详情
          </button>
          <button 
            style={{ 
              border: 'none', 
              background: 'none', 
              padding: 0,
              fontSize: 13, 
              color: COLORS.primary, 
              cursor: 'pointer' 
            }}
            onClick={() => { 
              setEditingOrder(record); 
              setFormData({ ...record }); 
              setModalVisible(true); 
            }}
          >
            {record.status === 'pending' ? '处理' : '编辑'}
          </button>
          <button 
            style={{ 
              border: 'none', 
              background: 'none', 
              padding: 0,
              fontSize: 13, 
              color: COLORS.secondary, 
              cursor: 'pointer' 
            }}
            onClick={() => { 
              if (confirm('确定要删除该工单吗？')) {
                setOrders(prev => prev.filter(o => o.id !== record.id));
              }
            }}
          >
            删除
          </button>
        </div>
      ) 
    },
  ];

  const filteredOrders = orders.filter(o => {
    const matchSearch = !searchText || o.title.includes(searchText) || o.order_no.includes(searchText) || o.customer_name.includes(searchText);
    const matchStatus = !statusFilter || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <>
      <style>{`
        .workorder-page {
          background: ${COLORS.bg};
          min-height: 100vh;
          padding: 24px;
        }
        .workorder-header {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px 20px;
          background: ${COLORS.card};
          border-radius: 12px;
          margin-bottom: 24px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
        }
        .workorder-header-title {
          flex: 1;
          font-size: 18px;
          font-weight: 600;
          color: ${COLORS.title};
        }
        .workorder-actions {
          display: flex;
          gap: 16px;
          margin-bottom: 24px;
        }
        .workorder-btn {
          padding: 8px 20px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          border: none;
          transition: all 0.2s ease;
        }
        .workorder-btn-primary {
          background: ${COLORS.primary};
          color: white;
          box-shadow: 0 2px 6px rgba(22, 119, 255, 0.2);
        }
        .workorder-btn-primary:hover {
          background: #1890ff;
          box-shadow: 0 3px 8px rgba(22, 119, 255, 0.3);
        }
        .workorder-btn-secondary {
          background: white;
          color: ${COLORS.primary};
          border: 1px solid ${COLORS.primary};
        }
        .workorder-btn-secondary:hover {
          background: ${COLORS.primaryLight};
        }
        .workorder-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }
        .workorder-stat-card {
          background: ${COLORS.card};
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
          transition: all 0.2s ease;
        }
        .workorder-stat-card:hover {
          box-shadow: 0 3px 8px rgba(0, 0, 0, 0.08);
          transform: translateY(-2px);
        }
        .workorder-stat-icon {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          margin-bottom: 12px;
        }
        .workorder-stat-value {
          font-size: 24px;
          font-weight: 700;
          color: ${COLORS.title};
          line-height: 1;
          margin-bottom: 6px;
        }
        .workorder-stat-label {
          font-size: 13px;
          color: ${COLORS.text};
        }
        .workorder-filter-tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
        }
        .workorder-filter-tab {
          padding: 6px 16px;
          border-radius: 6px;
          font-size: 13px;
          cursor: pointer;
          border: 1px solid ${COLORS.border};
          background: ${COLORS.card};
          color: ${COLORS.text};
          transition: all 0.15s ease;
        }
        .workorder-filter-tab:hover {
          border-color: ${COLORS.primary};
          color: ${COLORS.primary};
        }
        .workorder-filter-tab.active {
          background: ${COLORS.primary};
          border-color: ${COLORS.primary};
          color: white;
        }
        .workorder-table-container {
          background: ${COLORS.card};
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
        }
        .workorder-table-row {
          transition: background 0.15s ease;
        }
        .workorder-table-row:hover {
          background: ${COLORS.bg} !important;
        }
        .workorder-pagination {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          padding-top: 20px;
          border-top: 1px solid ${COLORS.border};
        }
        .workorder-modal-form {
          padding: 8px 0;
        }
        .workorder-modal-form-item {
          margin-bottom: 20px;
        }
        .workorder-modal-form-label {
          display: block;
          font-size: 14px;
          font-weight: 500;
          color: ${COLORS.title};
          margin-bottom: 8px;
        }
        .workorder-modal-form-control {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid ${COLORS.border};
          border-radius: 8px;
          font-size: 14px;
          color: ${COLORS.title};
          background: ${COLORS.card};
          transition: border-color 0.2s ease;
        }
        .workorder-modal-form-control:focus {
          outline: none;
          border-color: ${COLORS.primary};
        }
        .workorder-modal-form-select {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid ${COLORS.border};
          border-radius: 8px;
          font-size: 14px;
          color: ${COLORS.title};
          background: ${COLORS.card};
          cursor: pointer;
        }
        .workorder-modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding-top: 20px;
          border-top: 1px solid ${COLORS.border};
        }
        .workorder-detail-section {
          margin-bottom: 24px;
        }
        .workorder-detail-section-title {
          font-size: 16px;
          font-weight: 600;
          color: ${COLORS.title};
          margin-bottom: 16px;
        }
        .workorder-detail-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }
        .workorder-detail-item {
          padding: 16px;
          background: ${COLORS.bg};
          border-radius: 8px;
        }
        .workorder-detail-item-label {
          font-size: 12px;
          color: ${COLORS.secondary};
          margin-bottom: 4px;
        }
        .workorder-detail-item-value {
          font-size: 14px;
          color: ${COLORS.title};
          font-weight: 500;
        }
        @media (max-width: 1366px) {
          .workorder-stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
      
      <div className="workorder-page">
        {/* 顶部导航栏 */}
        <div className="workorder-header">
          <div style={{ fontSize: 20 }}>←</div>
          <div className="workorder-header-title">工单管理</div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button style={{ fontSize: 18, background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>🔍</button>
            <button style={{ fontSize: 18, background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>⚙️</button>
          </div>
        </div>

        {/* 操作按钮区 */}
        <div className="workorder-actions">
          <button 
            className="workorder-btn workorder-btn-primary"
            onClick={() => { 
              setEditingOrder(null); 
              setFormData({ 
                order_no: `WO-${new Date().getFullYear()}-${String(orders.length + 1).padStart(3, '0')}`, 
                title: '', 
                customer_name: '', 
                device_name: '', 
                type: 'repair', 
                priority: 'normal', 
                status: 'pending',
                description: '',
                handler: ''
              }); 
              setModalVisible(true); 
            }}
          >
            新建工单
          </button>
          <button 
            className="workorder-btn workorder-btn-secondary"
            onClick={() => {
              const data = filteredOrders.map(o => ({
                工单编号: o.order_no,
                工单标题: o.title,
                客户名称: o.customer_name,
                设备名称: o.device_name,
                工单类型: typeMap[o.type],
                优先级: o.priority === 'urgent' ? '紧急' : o.priority === 'normal' ? '普通' : '低',
                状态: o.status === 'pending' ? '待处理' : o.status === 'processing' ? '处理中' : '已完成',
                负责人: o.handler || '',
                创建时间: o.created_at
              }));
              const csv = [Object.keys(data[0]).join(','), ...data.map(row => Object.values(row).join(','))].join('\n');
              const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
              const link = document.createElement('a');
              link.href = URL.createObjectURL(blob);
              link.download = `工单列表_${new Date().toISOString().split('T')[0]}.csv`;
              link.click();
            }}
          >
            导出工单
          </button>
        </div>

        {/* 数据概览区 - 4个统计卡片 */}
        <div className="workorder-stats-grid">
          <div className="workorder-stat-card">
            <div className="workorder-stat-icon" style={{ background: COLORS.primaryLight, color: COLORS.primary }}>
              📋
            </div>
            <div className="workorder-stat-value">{stats.total}</div>
            <div className="workorder-stat-label">工单总数</div>
          </div>
          <div className="workorder-stat-card">
            <div className="workorder-stat-icon" style={{ background: '#fffbe6', color: COLORS.warning }}>
              ⏳
            </div>
            <div className="workorder-stat-value">{stats.pending}</div>
            <div className="workorder-stat-label">待处理</div>
          </div>
          <div className="workorder-stat-card">
            <div className="workorder-stat-icon" style={{ background: COLORS.primaryLight, color: COLORS.primary }}>
              🔄
            </div>
            <div className="workorder-stat-value">{stats.processing}</div>
            <div className="workorder-stat-label">处理中</div>
          </div>
          <div className="workorder-stat-card">
            <div className="workorder-stat-icon" style={{ background: '#f6ffed', color: COLORS.success }}>
              ✅
            </div>
            <div className="workorder-stat-value">{stats.completed}</div>
            <div className="workorder-stat-label">已完成</div>
          </div>
        </div>

        {/* 筛选标签 */}
        <div className="workorder-filter-tabs">
          <button 
            className={`workorder-filter-tab ${!statusFilter ? 'active' : ''}`}
            onClick={() => setStatusFilter('')}
          >
            全部
          </button>
          <button 
            className={`workorder-filter-tab ${statusFilter === 'pending' ? 'active' : ''}`}
            onClick={() => setStatusFilter(statusFilter === 'pending' ? '' : 'pending')}
          >
            待处理
          </button>
          <button 
            className={`workorder-filter-tab ${statusFilter === 'processing' ? 'active' : ''}`}
            onClick={() => setStatusFilter(statusFilter === 'processing' ? '' : 'processing')}
          >
            处理中
          </button>
          <button 
            className={`workorder-filter-tab ${statusFilter === 'completed' ? 'active' : ''}`}
            onClick={() => setStatusFilter(statusFilter === 'completed' ? '' : 'completed')}
          >
            已完成
          </button>
        </div>

        {/* 数据表格 */}
        <div className="workorder-table-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <PCSearchBar 
              placeholder="搜索工单编号、标题或客户..." 
              value={searchText} 
              onChange={setSearchText} 
              onSearch={() => {}} 
            />
            <div style={{ fontSize: 12, color: COLORS.secondary }}>
              共 {filteredOrders.length} 条记录
            </div>
          </div>
          
          <PCTable 
            columns={columns} 
            data={filteredOrders} 
            rowKey="id" 
            loading={loading} 
            selectedRowKeys={selectedRowKeys} 
            onSelectChange={setSelectedRowKeys}
            rowClassName="workorder-table-row"
          />
          
          <div className="workorder-pagination">
            <PCPagination 
              current={pagination.current} 
              pageSize={pagination.pageSize} 
              total={pagination.total} 
              onChange={(page) => setPagination(prev => ({ ...prev, current: page }))} 
            />
          </div>
        </div>

        {/* 新建/编辑工单弹窗 */}
        <PCModal 
          visible={modalVisible} 
          title={editingOrder ? '处理工单' : '新建工单'} 
          onClose={() => setModalVisible(false)} 
          width={560}
          footer={
            <div className="workorder-modal-footer">
              <button 
                className="workorder-btn workorder-btn-secondary"
                onClick={() => setModalVisible(false)}
              >
                取消
              </button>
              <button 
                className="workorder-btn workorder-btn-primary"
                onClick={() => {
                  if (!formData.title) {
                    alert('请输入工单标题');
                    return;
                  }
                  if (!formData.customer_name) {
                    alert('请输入客户名称');
                    return;
                  }
                  if (editingOrder) {
                    setOrders(prev => prev.map(o => o.id === editingOrder.id ? { ...o, ...formData } : o));
                  } else {
                    setOrders(prev => [...prev, { id: Date.now(), ...formData, created_at: new Date().toISOString().split('T')[0] }]);
                  }
                  setModalVisible(false);
                }}
              >
                保存
              </button>
            </div>
          }
        >
          <div className="workorder-modal-form">
            <div className="workorder-modal-form-item">
              <label className="workorder-modal-form-label">工单编号</label>
              <input 
                className="workorder-modal-form-control" 
                value={formData.order_no} 
                onChange={e => setFormData(prev => ({ ...prev, order_no: e.target.value }))} 
                placeholder="自动生成"
              />
            </div>
            <div className="workorder-modal-form-item">
              <label className="workorder-modal-form-label">工单标题 <span style={{ color: COLORS.danger }}>*</span></label>
              <input 
                className="workorder-modal-form-control" 
                value={formData.title} 
                onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))} 
                placeholder="请输入工单标题"
              />
            </div>
            <div className="workorder-modal-form-item">
              <label className="workorder-modal-form-label">客户名称 <span style={{ color: COLORS.danger }}>*</span></label>
              <input 
                className="workorder-modal-form-control" 
                value={formData.customer_name} 
                onChange={e => setFormData(prev => ({ ...prev, customer_name: e.target.value }))} 
                placeholder="请输入客户名称"
              />
            </div>
            <div className="workorder-modal-form-item">
              <label className="workorder-modal-form-label">设备名称</label>
              <input 
                className="workorder-modal-form-control" 
                value={formData.device_name} 
                onChange={e => setFormData(prev => ({ ...prev, device_name: e.target.value }))} 
                placeholder="请输入设备名称"
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="workorder-modal-form-item">
                <label className="workorder-modal-form-label">工单类型</label>
                <select 
                  className="workorder-modal-form-select"
                  value={formData.type} 
                  onChange={e => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                >
                  <option value="repair">🔧 维修</option>
                  <option value="maintenance">⚙️ 保养</option>
                  <option value="installation">📦 安装</option>
                </select>
              </div>
              <div className="workorder-modal-form-item">
                <label className="workorder-modal-form-label">优先级</label>
                <select 
                  className="workorder-modal-form-select"
                  value={formData.priority} 
                  onChange={e => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                >
                  <option value="urgent">🔥 紧急</option>
                  <option value="normal">一般</option>
                  <option value="low">○ 低</option>
                </select>
              </div>
            </div>
            <div className="workorder-modal-form-item">
              <label className="workorder-modal-form-label">负责人</label>
              <input 
                className="workorder-modal-form-control" 
                value={formData.handler} 
                onChange={e => setFormData(prev => ({ ...prev, handler: e.target.value }))} 
                placeholder="请输入负责人姓名"
              />
            </div>
            {editingOrder && (
              <div className="workorder-modal-form-item">
                <label className="workorder-modal-form-label">工单状态</label>
                <select 
                  className="workorder-modal-form-select"
                  value={formData.status} 
                  onChange={e => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                >
                  <option value="pending">⏳ 待处理</option>
                  <option value="processing">🔄 处理中</option>
                  <option value="completed">✅ 已完成</option>
                </select>
              </div>
            )}
            <div className="workorder-modal-form-item">
              <label className="workorder-modal-form-label">工单描述</label>
              <textarea 
                className="workorder-modal-form-control" 
                style={{ height: 100, resize: 'vertical' }}
                value={formData.description} 
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))} 
                placeholder="请输入工单详细描述..."
              />
            </div>
          </div>
        </PCModal>

        {/* 工单详情弹窗 */}
        <PCModal 
          visible={detailVisible} 
          title="工单详情" 
          onClose={() => setDetailVisible(false)} 
          width={600}
          footer={
            <div className="workorder-modal-footer">
              <button 
                className="workorder-btn workorder-btn-secondary"
                onClick={() => setDetailVisible(false)}
              >
                关闭
              </button>
              <button 
                className="workorder-btn workorder-btn-primary"
                onClick={() => {
                  setDetailVisible(false);
                  if (viewingOrder) {
                    setEditingOrder(viewingOrder);
                    setFormData({ ...viewingOrder });
                    setModalVisible(true);
                  }
                }}
              >
                编辑工单
              </button>
            </div>
          }
        >
          {viewingOrder && (
            <div>
              <div className="workorder-detail-section">
                <div className="workorder-detail-section-title">基本信息</div>
                <div className="workorder-detail-grid">
                  <div className="workorder-detail-item">
                    <div className="workorder-detail-item-label">工单编号</div>
                    <div className="workorder-detail-item-value">{viewingOrder.order_no}</div>
                  </div>
                  <div className="workorder-detail-item">
                    <div className="workorder-detail-item-label">工单标题</div>
                    <div className="workorder-detail-item-value">{viewingOrder.title}</div>
                  </div>
                  <div className="workorder-detail-item">
                    <div className="workorder-detail-item-label">客户名称</div>
                    <div className="workorder-detail-item-value">{viewingOrder.customer_name}</div>
                  </div>
                  <div className="workorder-detail-item">
                    <div className="workorder-detail-item-label">设备名称</div>
                    <div className="workorder-detail-item-value">{viewingOrder.device_name || '-'}</div>
                  </div>
                  <div className="workorder-detail-item">
                    <div className="workorder-detail-item-label">工单类型</div>
                    <div className="workorder-detail-item-value">{typeIconMap[viewingOrder.type]} {typeMap[viewingOrder.type]}</div>
                  </div>
                  <div className="workorder-detail-item">
                    <div className="workorder-detail-item-label">优先级</div>
                    <div className="workorder-detail-item-value" style={{ 
                      color: viewingOrder.priority === 'urgent' ? COLORS.danger : 
                            viewingOrder.priority === 'normal' ? COLORS.warning : COLORS.secondary 
                    }}>
                      {viewingOrder.priority === 'urgent' ? '🔥 ' : ''}
                      {viewingOrder.priority === 'urgent' ? '紧急' : viewingOrder.priority === 'normal' ? '普通' : '低'}
                    </div>
                  </div>
                  <div className="workorder-detail-item">
                    <div className="workorder-detail-item-label">负责人</div>
                    <div className="workorder-detail-item-value">{viewingOrder.handler || '待指派'}</div>
                  </div>
                  <div className="workorder-detail-item">
                    <div className="workorder-detail-item-label">创建时间</div>
                    <div className="workorder-detail-item-value">{viewingOrder.created_at}</div>
                  </div>
                </div>
              </div>
              {viewingOrder.description && (
                <div className="workorder-detail-section">
                  <div className="workorder-detail-section-title">工单描述</div>
                  <div className="workorder-detail-item">
                    <div className="workorder-detail-item-value" style={{ lineHeight: 1.8 }}>
                      {viewingOrder.description}
                    </div>
                  </div>
                </div>
              )}
              <div className="workorder-detail-section">
                <div className="workorder-detail-section-title">处理状态</div>
                <div className="workorder-detail-item">
                  <div className="workorder-detail-item-value" style={{ 
                    display: 'inline-block',
                    padding: '4px 12px', 
                    borderRadius: 4, 
                    fontSize: 13,
                    background: viewingOrder.status === 'pending' ? '#fffbe6' :
                              viewingOrder.status === 'processing' ? COLORS.primaryLight : '#f6ffed',
                    color: viewingOrder.status === 'pending' ? COLORS.warning :
                            viewingOrder.status === 'processing' ? COLORS.primary : COLORS.success
                  }}>
                    {viewingOrder.status === 'pending' ? '⏳ 待处理' :
                     viewingOrder.status === 'processing' ? '🔄 处理中' : '✅ 已完成'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </PCModal>
      </div>
    </>
  );
}
