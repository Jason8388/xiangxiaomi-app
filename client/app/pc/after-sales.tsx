import React, { useState, useEffect, useCallback } from 'react';
import '@/assets/styles/pc-global.css';
import { PCLayout } from '@/components/pc/PCLayout';
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
  description: string;
  customer_id: number;
  device_id?: number;
  type: string;
  priority: string;
  status: string;
  stage: string;
  plan_hours: number;
  is_charged: boolean;
  quoted_price: number;
  assignee_id?: number;
  created_by: number;
  customer_name?: string;
  device_name?: string;
  assignee_name?: string;
  created_at: string;
}

interface WorkOrderStats {
  totalWorkOrders: number;
  chargedWorkOrders: number;
  performanceAmount: number;
  pendingPaymentAmount: number;
  paidAmount: number;
}

export default function PCAfterSales() {
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [searchText, setSearchText] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [editingOrder, setEditingOrder] = useState<WorkOrder | null>(null);
  const [viewingOrder, setViewingOrder] = useState<WorkOrder | null>(null);
  const [stats, setStats] = useState<WorkOrderStats>({
    totalWorkOrders: 0,
    chargedWorkOrders: 0,
    performanceAmount: 0,
    pendingPaymentAmount: 0,
    paidAmount: 0,
  });
  const [formData, setFormData] = useState({ 
    description: '', 
    customer_id: '', 
    device_id: '', 
    type: '维修', 
    priority: 'normal', 
    status: 'pending',
    stage: 'pending',
    plan_hours: '',
    is_charged: false,
    quoted_price: '',
    assignee_id: '' 
  });
  const [customers, setCustomers] = useState<any[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/v1/work-orders`);
      const data = await response.json();
      const list = Array.isArray(data) ? data : (data.data || []);
      setOrders(list);
      setPagination(prev => ({ ...prev, total: list.length }));
    } catch (error) {
      console.error('获取工单列表失败:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/v1/work-orders/stats`);
      const data = await response.json();
      if (data) {
        setStats(data);
      }
    } catch (error) {
      console.error('获取统计数据失败:', error);
    }
  }, []);

  const fetchCustomers = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/v1/customers`);
      const data = await response.json();
      setCustomers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('获取客户列表失败:', error);
    }
  }, []);

  const fetchDevices = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/v1/devices`);
      const data = await response.json();
      setDevices(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('获取设备列表失败:', error);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/v1/users`);
      const data = await response.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('获取用户列表失败:', error);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    fetchStats();
    fetchCustomers();
    fetchDevices();
    fetchUsers();
  }, [fetchOrders, fetchStats, fetchCustomers, fetchDevices, fetchUsers]);

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
      key: 'description', 
      title: '工单描述', 
      width: 200,
      render: (val: string) => (
        <span style={{ fontSize: 14, color: COLORS.title }}>{val}</span>
      )
    },
    { 
      key: 'customer_name', 
      title: '客户名称', 
      width: 140,
      render: (val: string) => (
        <span style={{ fontSize: 14, color: COLORS.text }}>{val || '-'}</span>
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
      key: 'type', 
      title: '类型', 
      width: 80,
      render: (val: string) => (
        <span style={{ fontSize: 13, color: COLORS.text }}>{val}</span>
      )
    },
    {
      key: 'priority',
      title: '优先级',
      width: 90,
      render: (val: string) => {
        const config = {
          high: { label: '高', color: COLORS.danger, bg: '#fff1f0' },
          normal: { label: '中', color: COLORS.warning, bg: '#fffbe6' },
          low: { label: '低', color: COLORS.success, bg: '#f6ffed' }
        };
        const { label, color, bg } = config[val as keyof typeof config] || config.normal;
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
          completed: { label: '已完成', color: COLORS.success, bg: '#f6ffed' },
          in_progress: { label: '处理中', color: COLORS.primary, bg: COLORS.primaryLight }
        };
        const { label, color, bg } = config[val as keyof typeof config] || config.pending;
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
      key: 'assignee_name', 
      title: '负责人', 
      width: 80,
      render: (val: string) => (
        <span style={{ fontSize: 14, color: val ? COLORS.text : COLORS.secondary }}>
          {val || '待指派'}
        </span>
      )
    },
    { 
      key: 'quoted_price', 
      title: '报价', 
      width: 100,
      render: (val: number) => (
        <span style={{ fontSize: 14, color: COLORS.title, fontWeight: 500 }}>
          {val ? `¥${val.toLocaleString()}` : '-'}
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
              setFormData({ 
                description: record.description,
                customer_id: String(record.customer_id),
                device_id: String(record.device_id || ''),
                type: record.type,
                priority: record.priority,
                status: record.status,
                stage: record.stage,
                plan_hours: String(record.plan_hours || ''),
                is_charged: record.is_charged,
                quoted_price: String(record.quoted_price || ''),
                assignee_id: String(record.assignee_id || '')
              }); 
              setModalVisible(true); 
            }}
          >
            编辑
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
                fetch(`${API_BASE}/api/v1/work-orders/${record.id}`, { method: 'DELETE' })
                  .then(() => {
                    fetchOrders();
                    fetchStats();
                  });
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
    const keyword = searchText.toLowerCase();
    return !keyword || 
      (o.order_no && o.order_no.toLowerCase().includes(keyword)) ||
      (o.description && o.description.toLowerCase().includes(keyword)) ||
      (o.customer_name && o.customer_name.toLowerCase().includes(keyword));
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
          grid-template-columns: repeat(5, 1fr);
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
                description: '', 
                customer_id: '', 
                device_id: '', 
                type: '维修', 
                priority: 'normal', 
                status: 'pending',
                stage: 'pending',
                plan_hours: '',
                is_charged: false,
                quoted_price: '',
                assignee_id: '' 
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
                工单描述: o.description,
                客户名称: o.customer_name,
                设备名称: o.device_name,
                类型: o.type,
                优先级: o.priority,
                状态: o.status,
                负责人: o.assignee_name || '',
                报价: o.quoted_price || '',
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

        {/* 数据概览区 - 5个统计卡片 */}
        <div className="workorder-stats-grid">
          <div className="workorder-stat-card">
            <div className="workorder-stat-icon" style={{ background: COLORS.primaryLight, color: COLORS.primary }}>
              📋
            </div>
            <div className="workorder-stat-value">{stats.totalWorkOrders}</div>
            <div className="workorder-stat-label">工单总数</div>
          </div>
          <div className="workorder-stat-card">
            <div className="workorder-stat-icon" style={{ background: '#fffbe6', color: COLORS.warning }}>
              💰
            </div>
            <div className="workorder-stat-value">{stats.chargedWorkOrders}</div>
            <div className="workorder-stat-label">收费工单</div>
          </div>
          <div className="workorder-stat-card">
            <div className="workorder-stat-icon" style={{ background: COLORS.primaryLight, color: COLORS.primary }}>
              💵
            </div>
            <div className="workorder-stat-value">¥{stats.performanceAmount.toLocaleString()}</div>
            <div className="workorder-stat-label">业绩金额</div>
          </div>
          <div className="workorder-stat-card">
            <div className="workorder-stat-icon" style={{ background: '#fff1f0', color: COLORS.danger }}>
              📥
            </div>
            <div className="workorder-stat-value">¥{stats.pendingPaymentAmount.toLocaleString()}</div>
            <div className="workorder-stat-label">待收款</div>
          </div>
          <div className="workorder-stat-card">
            <div className="workorder-stat-icon" style={{ background: '#f6ffed', color: COLORS.success }}>
              ✅
            </div>
            <div className="workorder-stat-value">¥{stats.paidAmount.toLocaleString()}</div>
            <div className="workorder-stat-label">已收款</div>
          </div>
        </div>

        {/* 筛选标签 */}
        <div className="workorder-filter-tabs">
          <button 
            className={`workorder-filter-tab ${!searchText ? 'active' : ''}`}
            onClick={() => setSearchText('')}
          >
            全部
          </button>
          <button 
            className={`workorder-filter-tab ${searchText === 'pending' ? 'active' : ''}`}
            onClick={() => setSearchText(searchText === 'pending' ? '' : 'pending')}
          >
            待处理
          </button>
          <button 
            className={`workorder-filter-tab ${searchText === 'in_progress' ? 'active' : ''}`}
            onClick={() => setSearchText(searchText === 'in_progress' ? '' : 'in_progress')}
          >
            处理中
          </button>
          <button 
            className={`workorder-filter-tab ${searchText === 'completed' ? 'active' : ''}`}
            onClick={() => setSearchText(searchText === 'completed' ? '' : 'completed')}
          >
            已完成
          </button>
        </div>

        {/* 数据表格 */}
        <div className="workorder-table-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <PCSearchBar 
              placeholder="搜索工单编号、描述或客户..." 
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
          title={editingOrder ? '编辑工单' : '新建工单'} 
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
                onClick={async () => {
                  if (!formData.description) {
                    alert('请输入工单名称');
                    return;
                  }
                  if (!formData.customer_id) {
                    alert('请选择客户');
                    return;
                  }

                  const payload = {
                    description: formData.description,
                    customer_id: parseInt(formData.customer_id),
                    device_id: formData.device_id ? parseInt(formData.device_id) : null,
                    type: formData.type,
                    priority: formData.priority,
                    status: formData.status,
                    stage: formData.stage,
                    plan_hours: formData.plan_hours ? parseFloat(formData.plan_hours) : 0,
                    is_charged: formData.is_charged,
                    quoted_price: formData.quoted_price ? parseFloat(formData.quoted_price) : 0,
                    assignee_id: formData.assignee_id ? parseInt(formData.assignee_id) : null,
                  };

                  const url = editingOrder
                    ? `${API_BASE}/api/v1/work-orders/${editingOrder.id}`
                    : `${API_BASE}/api/v1/work-orders`;
                  
                  const method = editingOrder ? 'PUT' : 'POST';
                  
                  await fetch(url, {
                    method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                  });
                  
                  fetchOrders();
                  fetchStats();
                  setModalVisible(false);
                }}
              >
                保存
              </button>
            </div>
          }
        >
          <div className="workorder-modal-form">
            {/* 工单名称 */}
            <div className="workorder-modal-form-item">
              <label className="workorder-modal-form-label">工单名称 <span style={{ color: COLORS.danger }}>*</span></label>
              <input
                type="text"
                className="workorder-modal-form-control"
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="请输入工单名称"
              />
            </div>

            {/* 客户选择 */}
            <div className="workorder-modal-form-item">
              <label className="workorder-modal-form-label">客户 <span style={{ color: COLORS.danger }}>*</span></label>
              <select
                className="workorder-modal-form-select"
                value={formData.customer_id}
                onChange={e => setFormData(prev => ({ ...prev, customer_id: e.target.value }))}
              >
                <option value="">请选择客户</option>
                {customers.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* 任务负责人 */}
            <div className="workorder-modal-form-item">
              <label className="workorder-modal-form-label">任务负责人</label>
              <select
                className="workorder-modal-form-select"
                value={formData.assignee_id}
                onChange={e => setFormData(prev => ({ ...prev, assignee_id: e.target.value }))}
              >
                <option value="">请选择负责人</option>
                {users.map((u: any) => (
                  <option key={u.id} value={u.id}>{u.username}</option>
                ))}
              </select>
            </div>

            {/* 设备选择 */}
            <div className="workorder-modal-form-item">
              <label className="workorder-modal-form-label">设备</label>
              <select
                className="workorder-modal-form-select"
                value={formData.device_id}
                onChange={e => setFormData(prev => ({ ...prev, device_id: e.target.value }))}
              >
                <option value="">请选择设备</option>
                {devices.filter((d: any) => !formData.customer_id || d.customer_id === parseInt(formData.customer_id)).map((d: any) => (
                  <option key={d.id} value={d.id}>{d.device_name}</option>
                ))}
              </select>
            </div>

            {/* 工单类型 */}
            <div className="workorder-modal-form-item">
              <label className="workorder-modal-form-label">工单类型</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {['维修', '保养', '安装', '其他'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, type: t }))}
                    style={{
                      padding: '10px',
                      border: '1px solid',
                      borderRadius: '8px',
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      background: formData.type === t ? COLORS.primary : COLORS.card,
                      borderColor: formData.type === t ? COLORS.primary : COLORS.border,
                      color: formData.type === t ? 'white' : COLORS.text,
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* 工单阶段 */}
            <div className="workorder-modal-form-item">
              <label className="workorder-modal-form-label">工单阶段</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {[
                  { label: '待派工', value: 'pending' },
                  { label: '已派工', value: 'assigned' },
                  { label: '处理中', value: 'processing' },
                  { label: '已完成', value: 'completed' },
                ].map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, stage: s.value }))}
                    style={{
                      padding: '10px',
                      border: '1px solid',
                      borderRadius: '8px',
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      background: formData.stage === s.value ? COLORS.primary : COLORS.card,
                      borderColor: formData.stage === s.value ? COLORS.primary : COLORS.border,
                      color: formData.stage === s.value ? 'white' : COLORS.text,
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 优先级 */}
            <div className="workorder-modal-form-item">
              <label className="workorder-modal-form-label">优先级</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {[
                  { label: '低', value: 'low' },
                  { label: '中', value: 'normal' },
                  { label: '高', value: 'high' },
                ].map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, priority: p.value }))}
                    style={{
                      padding: '10px',
                      border: '1px solid',
                      borderRadius: '8px',
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      background: formData.priority === p.value ? COLORS.primary : COLORS.card,
                      borderColor: formData.priority === p.value ? COLORS.primary : COLORS.border,
                      color: formData.priority === p.value ? 'white' : COLORS.text,
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 计划工时 */}
            <div className="workorder-modal-form-item">
              <label className="workorder-modal-form-label">计划工时（小时）</label>
              <input
                type="number"
                className="workorder-modal-form-control"
                value={formData.plan_hours}
                onChange={e => setFormData(prev => ({ ...prev, plan_hours: e.target.value }))}
                placeholder="请输入计划工时"
              />
            </div>

            {/* 有偿服务开关 */}
            <div className="workorder-modal-form-item">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: COLORS.bg, borderRadius: '8px' }}>
                <span style={{ fontSize: 14, fontWeight: 500, color: COLORS.title }}>有偿服务</span>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, is_charged: !prev.is_charged }))}
                  style={{
                    width: 48,
                    height: 28,
                    borderRadius: 14,
                    padding: 2,
                    cursor: 'pointer',
                    transition: 'background 0.3s ease',
                    background: formData.is_charged ? COLORS.primary : COLORS.secondary,
                    border: 'none',
                    position: 'relative',
                  }}
                >
                  <span
                    style={{
                      display: 'block',
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      background: 'white',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                      transition: 'transform 0.3s ease',
                      transform: formData.is_charged ? 'translateX(20px)' : 'translateX(0)',
                    }}
                  />
                </button>
              </div>
            </div>

            {/* 报价金额 */}
            <div className="workorder-modal-form-item">
              <label className="workorder-modal-form-label">报价金额（元）</label>
              <input
                type="number"
                className="workorder-modal-form-control"
                value={formData.quoted_price}
                onChange={e => setFormData(prev => ({ ...prev, quoted_price: e.target.value }))}
                placeholder="请输入报价金额"
              />
            </div>

            {/* 工单状态（仅编辑时显示） */}
            {editingOrder && (
              <div className="workorder-modal-form-item">
                <label className="workorder-modal-form-label">工单状态</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {[
                    { label: '待处理', value: 'pending' },
                    { label: '处理中', value: 'processing' },
                    { label: '已完成', value: 'completed' },
                  ].map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, status: s.value }))}
                      style={{
                        padding: '10px',
                        border: '1px solid',
                        borderRadius: '8px',
                        fontSize: 13,
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        background: formData.status === s.value ? COLORS.primary : COLORS.card,
                        borderColor: formData.status === s.value ? COLORS.primary : COLORS.border,
                        color: formData.status === s.value ? 'white' : COLORS.text,
                      }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
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
                    setFormData({ 
                      description: viewingOrder.description,
                      customer_id: String(viewingOrder.customer_id),
                      device_id: String(viewingOrder.device_id || ''),
                      type: viewingOrder.type,
                      priority: viewingOrder.priority,
                      status: viewingOrder.status,
                      stage: viewingOrder.stage,
                      plan_hours: String(viewingOrder.plan_hours || ''),
                      is_charged: viewingOrder.is_charged,
                      quoted_price: String(viewingOrder.quoted_price || ''),
                      assignee_id: String(viewingOrder.assignee_id || '')
                    });
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
                    <div className="workorder-detail-item-label">工单描述</div>
                    <div className="workorder-detail-item-value">{viewingOrder.description}</div>
                  </div>
                  <div className="workorder-detail-item">
                    <div className="workorder-detail-item-label">客户名称</div>
                    <div className="workorder-detail-item-value">{viewingOrder.customer_name || '-'}</div>
                  </div>
                  <div className="workorder-detail-item">
                    <div className="workorder-detail-item-label">设备名称</div>
                    <div className="workorder-detail-item-value">{viewingOrder.device_name || '-'}</div>
                  </div>
                  <div className="workorder-detail-item">
                    <div className="workorder-detail-item-label">类型</div>
                    <div className="workorder-detail-item-value">{viewingOrder.type}</div>
                  </div>
                  <div className="workorder-detail-item">
                    <div className="workorder-detail-item-label">优先级</div>
                    <div className="workorder-detail-item-value" style={{ 
                      color: viewingOrder.priority === 'urgent' ? COLORS.danger : 
                            viewingOrder.priority === 'high' ? '#ff7a45' : COLORS.text 
                    }}>
                      {viewingOrder.priority === 'urgent' ? '🔥 ' : ''}
                      {viewingOrder.priority === 'urgent' ? '紧急' : viewingOrder.priority === 'high' ? '高' : viewingOrder.priority === 'normal' ? '普通' : '低'}
                    </div>
                  </div>
                  <div className="workorder-detail-item">
                    <div className="workorder-detail-item-label">状态</div>
                    <div className="workorder-detail-item-value" style={{ 
                      display: 'inline-block',
                      padding: '4px 12px', 
                      borderRadius: 4, 
                      fontSize: 13,
                      background: viewingOrder.status === 'pending' ? '#fffbe6' :
                                viewingOrder.status === 'in_progress' ? COLORS.primaryLight : 
                                viewingOrder.status === 'completed' ? '#f6ffed' : '#f5f5f5',
                      color: viewingOrder.status === 'pending' ? COLORS.warning :
                            viewingOrder.status === 'in_progress' ? COLORS.primary : 
                            viewingOrder.status === 'completed' ? COLORS.success : COLORS.secondary
                    }}>
                      {viewingOrder.status === 'pending' ? '待处理' :
                       viewingOrder.status === 'in_progress' ? '处理中' : 
                       viewingOrder.status === 'completed' ? '已完成' : '已取消'}
                    </div>
                  </div>
                  <div className="workorder-detail-item">
                    <div className="workorder-detail-item-label">负责人</div>
                    <div className="workorder-detail-item-value">{viewingOrder.assignee_name || '待指派'}</div>
                  </div>
                  <div className="workorder-detail-item">
                    <div className="workorder-detail-item-label">报价</div>
                    <div className="workorder-detail-item-value" style={{ fontWeight: 600 }}>
                      {viewingOrder.quoted_price ? `¥${viewingOrder.quoted_price.toLocaleString()}` : '-'}
                    </div>
                  </div>
                  <div className="workorder-detail-item">
                    <div className="workorder-detail-item-label">创建时间</div>
                    <div className="workorder-detail-item-value">{viewingOrder.created_at}</div>
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
