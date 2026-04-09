import React, { useState, useEffect, useCallback } from 'react';
import '@/assets/styles/pc-global.css';
import { PCLayout } from '@/components/pc/PCLayout';
import { PCStatCard } from '@/components/pc/PCComponents';
import { PCTable } from '@/components/pc/PCComponents';
import { PCTag } from '@/components/pc/PCComponents';
import { PCCard } from '@/components/pc/PCComponents';
import { PCToolbar } from '@/components/pc/PCComponents';
import { PCSearchBar } from '@/components/pc/PCComponents';
import { PCModal } from '@/components/pc/PCComponents';
import { PCPagination } from '@/components/pc/PCComponents';
import { PCMessage } from '@/components/pc/PCComponents';

const API_BASE = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || 'http://localhost:9091';

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
const priorityMap = { 
  urgent: { label: '紧急', type: 'danger' as const, color: '#FF4D4F', bg: '#FFF1F0' }, 
  normal: { label: '普通', type: 'warning' as const, color: '#FAAD14', bg: '#FFFBE6' }, 
  low: { label: '低', type: 'default' as const, color: '#999999', bg: '#F5F5F5' } 
};
const statusMap = { 
  pending: { label: '待处理', type: 'warning' as const, color: '#FAAD14', bg: '#FFFBE6', icon: '⏳' }, 
  processing: { label: '处理中', type: 'primary' as const, color: '#4F8EF7', bg: '#E8F0FE', icon: '🔄' }, 
  completed: { label: '已完成', type: 'success' as const, color: '#52C41A', bg: '#F6FFED', icon: '✅' } 
};

export default function PCAfterSales() {
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingOrder, setEditingOrder] = useState<WorkOrder | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [viewingOrder, setViewingOrder] = useState<WorkOrder | null>(null);
  const [formData, setFormData] = useState({ order_no: '', title: '', customer_name: '', device_name: '', type: 'repair' as const, priority: 'normal' as const, status: 'pending' as const, description: '', handler: '' });
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
      // 使用模拟数据
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

  // 统计数据
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    completed: orders.filter(o => o.status === 'completed').length,
    urgent: orders.filter(o => o.priority === 'urgent' && o.status !== 'completed').length,
  };

  const columns = [
    { 
      key: 'order_no', 
      title: '工单编号', 
      width: 130,
      render: (val: string, record: WorkOrder) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--color-primary)' }}>{val}</span>
        </div>
      )
    },
    { 
      key: 'title', 
      title: '工单标题', 
      width: 200,
      render: (val: string, record: WorkOrder) => (
        <div>
          <div style={{ fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 2 }}>{val}</div>
          <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>{typeIconMap[record.type]} {typeMap[record.type]}</div>
        </div>
      )
    },
    { 
      key: 'customer_name', 
      title: '客户名称', 
      width: 150,
      render: (val: string) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'var(--color-primary)', fontWeight: 600 }}>
            {val.charAt(0)}
          </div>
          <span style={{ color: 'var(--color-text-secondary)' }}>{val}</span>
        </div>
      )
    },
    { 
      key: 'priority', 
      title: '优先级', 
      width: 80,
      render: (val: keyof typeof priorityMap) => {
        const { label, color, bg } = priorityMap[val];
        return (
          <span style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: 4,
            padding: '2px 10px', 
            borderRadius: 12, 
            fontSize: 12, 
            fontWeight: 500,
            background: bg,
            color: color
          }}>
            {val === 'urgent' && '●'}
            {label}
          </span>
        );
      }
    },
    { 
      key: 'status', 
      title: '状态', 
      width: 90,
      render: (val: keyof typeof statusMap) => {
        const { label, color, bg, icon } = statusMap[val];
        return (
          <span style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: 6,
            padding: '4px 12px', 
            borderRadius: 6, 
            fontSize: 12, 
            fontWeight: 500,
            background: bg,
            color: color
          }}>
            {icon} {label}
          </span>
        );
      }
    },
    { 
      key: 'handler', 
      title: '负责人', 
      width: 80,
      render: (val: string) => (
        <span style={{ color: val ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)' }}>
          {val || '待指派'}
        </span>
      )
    },
    { 
      key: 'created_at', 
      title: '创建时间', 
      width: 100,
      render: (val: string) => (
        <span style={{ color: 'var(--color-text-tertiary)', fontSize: 13 }}>{val}</span>
      )
    },
    { 
      key: 'actions', 
      title: '操作', 
      width: 160, 
      render: (_: any, record: WorkOrder) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <button 
            className="pc-btn pc-btn-text pc-btn-sm" 
            onClick={() => { setViewingOrder(record); setDetailVisible(true); }}
            style={{ color: 'var(--color-primary)' }}
          >
            详情
          </button>
          <button 
            className="pc-btn pc-btn-text pc-btn-sm" 
            onClick={() => { setEditingOrder(record); setFormData({ ...record }); setModalVisible(true); }}
          >
            {record.status === 'pending' ? '处理' : '编辑'}
          </button>
          <button 
            className="pc-btn pc-btn-text pc-btn-sm" 
            style={{ color: '#FF4D4F' }} 
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
    const matchType = !typeFilter || o.type === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  return (
    <>
      <style>{`
        .workorder-stat-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }
        .workorder-stat-card {
          background: var(--color-bg-white);
          border-radius: 12px;
          padding: 20px;
          border: 1px solid var(--color-border);
          transition: all 0.2s ease;
        }
        .workorder-stat-card:hover {
          box-shadow: var(--shadow-md);
          transform: translateY(-2px);
        }
        .workorder-stat-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          margin-bottom: 12px;
        }
        .workorder-stat-value {
          font-size: 28px;
          font-weight: 700;
          color: var(--color-text-primary);
          line-height: 1;
          margin-bottom: 4px;
        }
        .workorder-stat-label {
          font-size: 13px;
          color: var(--color-text-tertiary);
        }
        .workorder-stat-card.urgent {
          background: linear-gradient(135deg, #FFF1F0 0%, #FFebe8 100%);
          border-color: #FFCCC7;
        }
        .workorder-stat-card.urgent .workorder-stat-icon {
          background: #FF4D4F;
          color: white;
        }
        .workorder-table-row:hover {
          background: var(--color-bg-hover) !important;
        }
        .workorder-filter-tabs {
          display: flex;
          gap: 8px;
          margin-left: 16px;
        }
        .workorder-filter-tab {
          padding: 6px 14px;
          border-radius: 6px;
          font-size: 13px;
          cursor: pointer;
          border: 1px solid var(--color-border);
          background: var(--color-bg-white);
          color: var(--color-text-secondary);
          transition: all 0.15s ease;
        }
        .workorder-filter-tab:hover {
          border-color: var(--color-primary);
          color: var(--color-primary);
        }
        .workorder-filter-tab.active {
          background: var(--color-primary);
          border-color: var(--color-primary);
          color: white;
        }
        .workorder-detail-header {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding-bottom: 20px;
          border-bottom: 1px solid var(--color-border);
          margin-bottom: 20px;
        }
        .workorder-detail-icon {
          width: 56px;
          height: 56px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
        }
        .workorder-detail-info {
          flex: 1;
        }
        .workorder-detail-title {
          font-size: 18px;
          font-weight: 600;
          color: var(--color-text-primary);
          margin-bottom: 8px;
        }
        .workorder-detail-meta {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }
        .workorder-detail-meta-item {
          font-size: 13px;
          color: var(--color-text-secondary);
        }
        .workorder-timeline {
          position: relative;
          padding-left: 24px;
        }
        .workorder-timeline::before {
          content: '';
          position: absolute;
          left: 7px;
          top: 4px;
          bottom: 4px;
          width: 2px;
          background: var(--color-border);
        }
        .workorder-timeline-item {
          position: relative;
          padding-bottom: 20px;
        }
        .workorder-timeline-item::before {
          content: '';
          position: absolute;
          left: -20px;
          top: 4px;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: var(--color-bg-white);
          border: 2px solid var(--color-border);
        }
        .workorder-timeline-item.active::before {
          background: var(--color-primary);
          border-color: var(--color-primary);
        }
        .workorder-timeline-item.completed::before {
          background: var(--color-success);
          border-color: var(--color-success);
        }
      `}</style>
      
      <PCLayout>
        {/* 页面头部 */}
        <div className="pc-page-header">
          <div>
            <h1 className="pc-page-title">工单管理</h1>
            <p className="pc-page-description">管理售后工单，跟踪处理进度，提升客户服务质量</p>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="workorder-stat-grid">
          <div className="workorder-stat-card">
            <div className="workorder-stat-icon" style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
              📋
            </div>
            <div className="workorder-stat-value">{stats.total}</div>
            <div className="workorder-stat-label">工单总数</div>
          </div>
          <div className="workorder-stat-card">
            <div className="workorder-stat-icon" style={{ background: '#FFFBE6', color: '#FAAD14' }}>
              ⏳
            </div>
            <div className="workorder-stat-value">{stats.pending}</div>
            <div className="workorder-stat-label">待处理</div>
          </div>
          <div className="workorder-stat-card">
            <div className="workorder-stat-icon" style={{ background: '#E8F0FE', color: '#4F8EF7' }}>
              🔄
            </div>
            <div className="workorder-stat-value">{stats.processing}</div>
            <div className="workorder-stat-label">处理中</div>
          </div>
          <div className="workorder-stat-card">
            <div className="workorder-stat-icon" style={{ background: '#F6FFED', color: '#52C41A' }}>
              ✅
            </div>
            <div className="workorder-stat-value">{stats.completed}</div>
            <div className="workorder-stat-label">已完成</div>
          </div>
          <div className="workorder-stat-card urgent">
            <div className="workorder-stat-icon" style={{ background: '#FF4D4F', color: 'white' }}>
              🔥
            </div>
            <div className="workorder-stat-value" style={{ color: '#FF4D4F' }}>{stats.urgent}</div>
            <div className="workorder-stat-label">紧急待处理</div>
          </div>
        </div>

        {/* 主内容卡片 */}
        <PCCard>
          {/* 工具栏 */}
          <PCToolbar
            left={
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <PCSearchBar 
                  placeholder="搜索工单编号、标题或客户..." 
                  value={searchText} 
                  onChange={setSearchText} 
                  onSearch={() => {}} 
                />
                <div className="workorder-filter-tabs">
                  <button 
                    className={`workorder-filter-tab ${!statusFilter ? 'active' : ''}`}
                    onClick={() => setStatusFilter('')}
                  >
                    全部
                  </button>
                  {Object.entries(statusMap).map(([key, { label, icon }]) => (
                    <button 
                      key={key}
                      className={`workorder-filter-tab ${statusFilter === key ? 'active' : ''}`}
                      onClick={() => setStatusFilter(statusFilter === key ? '' : key)}
                    >
                      {icon} {label}
                    </button>
                  ))}
                </div>
              </div>
            }
            right={
              <button 
                className="pc-btn pc-btn-primary" 
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
                + 新建工单
              </button>
            }
          />
          
          {/* 数据表格 */}
          <PCTable 
            columns={columns} 
            data={filteredOrders} 
            rowKey="id" 
            loading={loading} 
            selectedRowKeys={selectedRowKeys} 
            onSelectChange={setSelectedRowKeys}
            rowClassName="workorder-table-row"
          />
          
          {/* 分页 */}
          <PCPagination 
            current={pagination.current} 
            pageSize={pagination.pageSize} 
            total={pagination.total} 
            onChange={(page) => setPagination(prev => ({ ...prev, current: page }))} 
          />
        </PCCard>

        {/* 新建/编辑工单弹窗 */}
        <PCModal 
          visible={modalVisible} 
          title={editingOrder ? '处理工单' : '新建工单'} 
          onClose={() => setModalVisible(false)} 
          width={600}
          footer={
            <>
              <button className="pc-btn pc-btn-default" onClick={() => setModalVisible(false)}>取消</button>
              <button 
                className="pc-btn pc-btn-primary" 
                onClick={() => {
                  if (!formData.title) {
                    PCMessage({ content: '请输入工单标题', type: 'error' });
                    return;
                  }
                  if (!formData.customer_name) {
                    PCMessage({ content: '请输入客户名称', type: 'error' });
                    return;
                  }
                  if (editingOrder) {
                    setOrders(prev => prev.map(o => o.id === editingOrder.id ? { ...o, ...formData } : o));
                    PCMessage({ content: '工单已更新', type: 'success' });
                  } else {
                    setOrders(prev => [...prev, { id: Date.now(), ...formData, created_at: new Date().toISOString().split('T')[0] }]);
                    PCMessage({ content: '工单创建成功', type: 'success' });
                  }
                  setModalVisible(false);
                }}
              >
                保存
              </button>
            </>
          }
        >
          <div className="pc-form">
            <div className="pc-form-item">
              <label className="pc-form-label">工单编号</label>
              <input type="text" className="pc-form-control" value={formData.order_no} onChange={e => setFormData(prev => ({ ...prev, order_no: e.target.value }))} placeholder="自动生成" />
            </div>
            <div className="pc-form-item">
              <label className="pc-form-label">工单标题 <span style={{ color: '#FF4D4F' }}>*</span></label>
              <input type="text" className="pc-form-control" value={formData.title} onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))} placeholder="请输入工单标题" />
            </div>
            <div className="pc-form-item">
              <label className="pc-form-label">客户名称 <span style={{ color: '#FF4D4F' }}>*</span></label>
              <input type="text" className="pc-form-control" value={formData.customer_name} onChange={e => setFormData(prev => ({ ...prev, customer_name: e.target.value }))} placeholder="请输入客户名称" />
            </div>
            <div className="pc-form-item">
              <label className="pc-form-label">设备名称</label>
              <input type="text" className="pc-form-control" value={formData.device_name} onChange={e => setFormData(prev => ({ ...prev, device_name: e.target.value }))} placeholder="请输入设备名称" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="pc-form-item">
                <label className="pc-form-label">工单类型</label>
                <select className="pc-form-control pc-form-select" value={formData.type} onChange={e => setFormData(prev => ({ ...prev, type: e.target.value as any }))}>
                  <option value="repair">🔧 维修</option>
                  <option value="maintenance">⚙️ 保养</option>
                  <option value="installation">📦 安装</option>
                </select>
              </div>
              <div className="pc-form-item">
                <label className="pc-form-label">优先级</label>
                <select className="pc-form-control pc-form-select" value={formData.priority} onChange={e => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}>
                  <option value="urgent">🔥 紧急</option>
                  <option value="normal">一般</option>
                  <option value="low">○ 低</option>
                </select>
              </div>
            </div>
            <div className="pc-form-item">
              <label className="pc-form-label">负责人</label>
              <input type="text" className="pc-form-control" value={formData.handler} onChange={e => setFormData(prev => ({ ...prev, handler: e.target.value }))} placeholder="请输入负责人姓名" />
            </div>
            {editingOrder && (
              <div className="pc-form-item">
                <label className="pc-form-label">工单状态</label>
                <select className="pc-form-control pc-form-select" value={formData.status} onChange={e => setFormData(prev => ({ ...prev, status: e.target.value as any }))}>
                  <option value="pending">⏳ 待处理</option>
                  <option value="processing">🔄 处理中</option>
                  <option value="completed">✅ 已完成</option>
                </select>
              </div>
            )}
            <div className="pc-form-item">
              <label className="pc-form-label">工单描述</label>
              <textarea 
                className="pc-form-control" 
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
          width={640}
          footer={
            <>
              <button className="pc-btn pc-btn-default" onClick={() => setDetailVisible(false)}>关闭</button>
              <button 
                className="pc-btn pc-btn-primary" 
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
            </>
          }
        >
          {viewingOrder && (
            <div>
              {/* 头部信息 */}
              <div className="workorder-detail-header">
                <div className="workorder-detail-icon" style={{ background: 'var(--color-primary-light)' }}>
                  {typeIconMap[viewingOrder.type]}
                </div>
                <div className="workorder-detail-info">
                  <div className="workorder-detail-title">{viewingOrder.title}</div>
                  <div className="workorder-detail-meta">
                    <span className="workorder-detail-meta-item">📝 {viewingOrder.order_no}</span>
                    <span className="workorder-detail-meta-item">🏢 {viewingOrder.customer_name}</span>
                    <span className="workorder-detail-meta-item">📅 {viewingOrder.created_at}</span>
                  </div>
                </div>
                <div>
                  <span style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: 6,
                    padding: '6px 16px', 
                    borderRadius: 8, 
                    fontSize: 14, 
                    fontWeight: 500,
                    background: statusMap[viewingOrder.status].bg,
                    color: statusMap[viewingOrder.status].color
                  }}>
                    {statusMap[viewingOrder.status].icon} {statusMap[viewingOrder.status].label}
                  </span>
                </div>
              </div>

              {/* 基本信息 */}
              <div style={{ marginBottom: 24 }}>
                <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 16 }}>基本信息</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                  <div style={{ padding: 16, background: 'var(--color-bg-base)', borderRadius: 8 }}>
                    <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginBottom: 4 }}>设备名称</div>
                    <div style={{ fontSize: 14, color: 'var(--color-text-primary)', fontWeight: 500 }}>{viewingOrder.device_name || '-'}</div>
                  </div>
                  <div style={{ padding: 16, background: 'var(--color-bg-base)', borderRadius: 8 }}>
                    <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginBottom: 4 }}>工单类型</div>
                    <div style={{ fontSize: 14, color: 'var(--color-text-primary)', fontWeight: 500 }}>{typeIconMap[viewingOrder.type]} {typeMap[viewingOrder.type]}</div>
                  </div>
                  <div style={{ padding: 16, background: 'var(--color-bg-base)', borderRadius: 8 }}>
                    <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginBottom: 4 }}>优先级</div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: priorityMap[viewingOrder.priority].color }}>
                      {priorityMap[viewingOrder.priority].label === '紧急' ? '🔥 ' : ''}{priorityMap[viewingOrder.priority].label}
                    </div>
                  </div>
                  <div style={{ padding: 16, background: 'var(--color-bg-base)', borderRadius: 8 }}>
                    <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginBottom: 4 }}>负责人</div>
                    <div style={{ fontSize: 14, color: 'var(--color-text-primary)', fontWeight: 500 }}>{viewingOrder.handler || '待指派'}</div>
                  </div>
                </div>
              </div>

              {/* 工单描述 */}
              {viewingOrder.description && (
                <div style={{ marginBottom: 24 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 12 }}>工单描述</h4>
                  <div style={{ padding: 16, background: 'var(--color-bg-base)', borderRadius: 8, fontSize: 14, color: 'var(--color-text-secondary)', lineHeight: 1.8 }}>
                    {viewingOrder.description}
                  </div>
                </div>
              )}

              {/* 处理进度时间线 */}
              <div>
                <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 16 }}>处理进度</h4>
                <div className="workorder-timeline">
                  <div className="workorder-timeline-item completed">
                    <div style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>工单创建</div>
                    <div style={{ fontSize: 13, color: 'var(--color-text-tertiary)', marginTop: 4 }}>{viewingOrder.created_at}</div>
                  </div>
                  {viewingOrder.status !== 'pending' && (
                    <div className={`workorder-timeline-item ${viewingOrder.status === 'processing' ? 'active' : 'completed'}`}>
                      <div style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>开始处理</div>
                      <div style={{ fontSize: 13, color: 'var(--color-text-tertiary)', marginTop: 4 }}>
                        {viewingOrder.handler ? `由 ${viewingOrder.handler} 处理中` : '处理中'}
                      </div>
                    </div>
                  )}
                  {viewingOrder.status === 'completed' && (
                    <div className="workorder-timeline-item completed">
                      <div style={{ fontWeight: 500, color: 'var(--color-success)' }}>工单完成</div>
                      <div style={{ fontSize: 13, color: 'var(--color-text-tertiary)', marginTop: 4 }}>
                        {viewingOrder.completion_time || '已完成'}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </PCModal>
      </PCLayout>
    </>
  );
}
