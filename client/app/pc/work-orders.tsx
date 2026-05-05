import React, { useState, useEffect, useCallback } from 'react';
import '@/assets/styles/pc-global.css';
import { PCLayout } from '@/components/pc/PCLayout';
import { PCTable } from '@/components/pc/PCComponents';
import { PCTag } from '@/components/pc/PCComponents';
import { PCCard } from '@/components/pc/PCComponents';
import { PCToolbar } from '@/components/pc/PCComponents';
import { PCSearchBar } from '@/components/pc/PCComponents';
import { PCModal } from '@/components/pc/PCComponents';
import { PCPagination } from '@/components/pc/PCComponents';
import { PCImportModal } from '@/components/pc/PCComponents';

import { getApiBaseUrl } from '@/utils/api';
const API_BASE = getApiBaseUrl();

interface WorkOrder {
  id: number;
  work_order_number: string;
  title?: string;
  description?: string;
  customer_name: string;
  device_name?: string;
  type: string;
  priority: string;
  status: string;
  stage?: string;
  plan_hours?: number;
  is_charge?: boolean;
  quote?: number;
  handler?: string;
  creator?: string;
  created_at?: string;
}

const WORK_ORDER_TYPES = ['日常巡检', '设备维修', '设备保养', '设备安装', '设备调试', '技术支持', '培训', '咨询', '其它'];
const PRIORITIES = { urgent: { label: '紧急', type: 'danger' as const }, high: { label: '高', type: 'warning' as const }, medium: { label: '中', type: 'default' as const }, low: { label: '低', type: 'default' as const } };
const STATUS_MAP = { pending: { label: '待处理', type: 'warning' as const }, processing: { label: '处理中', type: 'primary' as const }, completed: { label: '已完成', type: 'success' as const }, closed: { label: '已关闭', type: 'default' as const } };
const STAGE_MAP = { queued: '排队中', assigned: '已派单', arrived: '已到达', diagnosing: '诊断中', repairing: '维修中', testing: '测试中', completed: '已完成', closed: '已关闭' };

export default function PCWorkOrders() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingOrder, setEditingOrder] = useState<WorkOrder | null>(null);
  const [formData, setFormData] = useState({ work_order_number: '', title: '', description: '', customer_name: '', device_name: '', type: '', priority: '', status: '', stage: '', plan_hours: '', is_charge: false, quote: '', handler: '', creator: '' });
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [importModalVisible, setImportModalVisible] = useState(false);

  const fetchWorkOrders = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/v1/work-orders`);
      const data = await response.json();
      const list = Array.isArray(data) ? data : (data.work_orders || []);
      const sorted = list.sort((a: WorkOrder, b: WorkOrder) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
      setWorkOrders(sorted);
      setPagination(prev => ({ ...prev, total: sorted.length }));
    } catch (error) {
      console.error('获取工单列表失败:', error);
      setWorkOrders([
        { id: 1, work_order_number: 'WO-2024-001', title: '设备日常巡检', description: '对1号车间设备进行例行巡检', customer_name: '北京科技有限公司', device_name: '变频器控制器', type: '日常巡检', priority: 'medium', status: 'processing', stage: 'diagnosing', plan_hours: 2, is_charge: false, quote: 0, handler: '张师傅', creator: 'admin', created_at: '2024-01-15 09:30:00' },
        { id: 2, work_order_number: 'WO-2024-002', title: '设备故障维修', description: 'PLC控制柜出现报警，需要现场维修', customer_name: '上海网络科技', device_name: 'PLC控制柜', type: '设备维修', priority: 'high', status: 'pending', stage: 'queued', plan_hours: 4, is_charge: true, quote: 800, handler: '', creator: 'admin', created_at: '2024-01-16 14:20:00' },
        { id: 3, work_order_number: 'WO-2024-003', title: '设备定期保养', description: '对伺服驱动器进行常规保养', customer_name: '广州智能制造', device_name: '伺服驱动器', type: '设备保养', priority: 'low', status: 'completed', stage: 'completed', plan_hours: 3, is_charge: false, quote: 0, handler: '李师傅', creator: 'admin', created_at: '2024-01-10 10:00:00' },
      ]);
      setPagination(prev => ({ ...prev, total: 3 }));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchWorkOrders(); }, [fetchWorkOrders]);

  const filteredOrders = workOrders.filter(o => {
    const matchSearch = !searchText || o.work_order_number.includes(searchText) || (o.title && o.title.includes(searchText)) || o.customer_name.includes(searchText) || (o.handler && o.handler.includes(searchText));
    const matchType = !typeFilter || o.type === typeFilter;
    const matchPriority = !priorityFilter || o.priority === priorityFilter;
    const matchStatus = !statusFilter || o.status === statusFilter;
    return matchSearch && matchType && matchPriority && matchStatus;
  });

  const columns = [
    { key: 'work_order_number', title: '工单编号', width: 120 },
    { key: 'title', title: '工单名称', width: 150 },
    { key: 'customer_name', title: '客户名称', width: 150 },
    { key: 'device_name', title: '设备名称', width: 120 },
    { key: 'type', title: '工单类型', width: 100 },
    { key: 'priority', title: '优先级', width: 70, render: (val: string) => { const p = PRIORITIES[val as keyof typeof PRIORITIES] || { label: val, type: 'default' as const }; return <PCTag type={p.type}>{p.label}</PCTag>; } },
    { key: 'status', title: '状态', width: 80, render: (val: string) => { const s = STATUS_MAP[val as keyof typeof STATUS_MAP] || { label: val, type: 'default' as const }; return <PCTag type={s.type}>{s.label}</PCTag>; } },
    { key: 'stage', title: '阶段', width: 80, render: (val: string) => STAGE_MAP[val as keyof typeof STAGE_MAP] || val },
    { key: 'handler', title: '处理人', width: 80 },
    { key: 'plan_hours', title: '计划工时', width: 80, render: (val: number) => val ? `${val}h` : '-' },
    { key: 'is_charge', title: '是否收费', width: 80, render: (val: boolean) => val ? <PCTag type="warning">是</PCTag> : <PCTag type="default">否</PCTag> },
    { key: 'quote', title: '报价', width: 80, render: (val: number) => val ? `¥${val}` : '-' },
    { key: 'created_at', title: '创建时间', width: 150 },
    { key: 'actions', title: '操作', width: 140, render: (_: any, record: WorkOrder) => (
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="pc-btn pc-btn-text pc-btn-sm" onClick={() => window.location.href = `/pc/work-order-detail?id=${record.id}`}>详情</button>
        <button className="pc-btn pc-btn-text pc-btn-sm" onClick={() => { setEditingOrder(record); setFormData({ work_order_number: record.work_order_number, title: record.title || '', description: record.description || '', customer_name: record.customer_name, device_name: record.device_name || '', type: record.type, priority: record.priority, status: record.status, stage: record.stage || '', plan_hours: String(record.plan_hours || ''), is_charge: record.is_charge || false, quote: String(record.quote || ''), handler: record.handler || '', creator: record.creator || '' }); setModalVisible(true); }}>编辑</button>
        <button className="pc-btn pc-btn-text pc-btn-sm" style={{ color: '#FF4D4F' }} onClick={async () => { if (!confirm('确定删除吗？')) return; try { await fetch(`${API_BASE}/api/v1/work-orders/${record.id}`, { method: 'DELETE' }); } catch (e) {} setWorkOrders(prev => prev.filter(o => o.id !== record.id)); }}>删除</button>
      </div>
    )},
  ];

  return (
    <PCLayout>
      <div className="pc-page-header">
        <h1 className="pc-page-title">工单管理</h1>
        <p className="pc-page-description">管理所有工单信息，包括客户、设备、类型、优先级、阶段、计划工时、是否收费、报价等完整信息</p>
      </div>
      <PCCard>
        <PCToolbar left={<><PCSearchBar placeholder="搜索工单编号、名称、客户或处理人..." value={searchText} onChange={setSearchText} onSearch={() => {}} /><div style={{ display: 'flex', gap: 8, marginLeft: 16 }}><select className="pc-form-control" style={{ width: 120 }} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}><option value="">全部类型</option>{WORK_ORDER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select><select className="pc-form-control" style={{ width: 100 }} value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}><option value="">全部优先级</option>{Object.entries(PRIORITIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select><select className="pc-form-control" style={{ width: 100 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><option value="">全部状态</option>{Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></div></>} right={<><button className="pc-btn pc-btn-default" onClick={() => setImportModalVisible(true)} style={{ marginRight: 8 }}>批量导入</button><button className="pc-btn pc-btn-primary" onClick={() => { setEditingOrder(null); setFormData({ work_order_number: `WO-${Date.now()}`, title: '', description: '', customer_name: '', device_name: '', type: '', priority: 'medium', status: 'pending', stage: 'queued', plan_hours: '', is_charge: false, quote: '', handler: '', creator: 'admin' }); setModalVisible(true); }}>+ 新增工单</button></>} />
        <PCTable columns={columns} data={filteredOrders} rowKey="id" loading={loading} />
        <PCPagination current={pagination.current} pageSize={pagination.pageSize} total={pagination.total} onChange={page => setPagination(prev => ({ ...prev, current: page }))} />
      </PCCard>
      <PCModal visible={modalVisible} title={editingOrder ? '编辑工单' : '新增工单'} onClose={() => setModalVisible(false)} width={700}
        footer={<><button className="pc-btn pc-btn-default" onClick={() => setModalVisible(false)}>取消</button><button className="pc-btn pc-btn-primary" onClick={async () => { try { if (editingOrder) { await fetch(`${API_BASE}/api/v1/work-orders/${editingOrder.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...formData, plan_hours: Number(formData.plan_hours), quote: Number(formData.quote) }) }); setWorkOrders(prev => prev.map(o => o.id === editingOrder.id ? { ...o, ...formData, plan_hours: Number(formData.plan_hours), quote: Number(formData.quote) } : o)); } else { await fetch(`${API_BASE}/api/v1/work-orders`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...formData, plan_hours: Number(formData.plan_hours), quote: Number(formData.quote) }) }); setWorkOrders(prev => [...prev, { id: Date.now(), ...formData, plan_hours: Number(formData.plan_hours), quote: Number(formData.quote), created_at: new Date().toLocaleString() }]); setPagination(prev => ({ ...prev, total: prev.total + 1 })); } } catch (e) { console.error(e); } setModalVisible(false); }}>保存</button></>}
      >
        <div className="pc-form">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}><div className="pc-form-item"><label className="pc-form-label required">工单编号</label><input type="text" className="pc-form-control" placeholder="请输入工单编号" value={formData.work_order_number} onChange={e => setFormData(prev => ({ ...prev, work_order_number: e.target.value }))} /></div><div className="pc-form-item"><label className="pc-form-label">工单名称</label><input type="text" className="pc-form-control" placeholder="请输入工单名称" value={formData.title} onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))} /></div></div>
          <div className="pc-form-item"><label className="pc-form-label required">客户名称</label><input type="text" className="pc-form-control" placeholder="请输入客户名称" value={formData.customer_name} onChange={e => setFormData(prev => ({ ...prev, customer_name: e.target.value }))} /></div>
          <div className="pc-form-item"><label className="pc-form-label">设备名称</label><input type="text" className="pc-form-control" placeholder="请输入设备名称" value={formData.device_name} onChange={e => setFormData(prev => ({ ...prev, device_name: e.target.value }))} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}><div className="pc-form-item"><label className="pc-form-label required">工单类型</label><select className="pc-form-control" value={formData.type} onChange={e => setFormData(prev => ({ ...prev, type: e.target.value }))}><option value="">请选择类型</option>{WORK_ORDER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div><div className="pc-form-item"><label className="pc-form-label required">优先级</label><select className="pc-form-control" value={formData.priority} onChange={e => setFormData(prev => ({ ...prev, priority: e.target.value }))}><option value="">请选择优先级</option>{Object.entries(PRIORITIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></div><div className="pc-form-item"><label className="pc-form-label required">状态</label><select className="pc-form-control" value={formData.status} onChange={e => setFormData(prev => ({ ...prev, status: e.target.value }))}><option value="">请选择状态</option>{Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></div></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}><div className="pc-form-item"><label className="pc-form-label">阶段</label><select className="pc-form-control" value={formData.stage} onChange={e => setFormData(prev => ({ ...prev, stage: e.target.value }))}><option value="">请选择阶段</option>{Object.entries(STAGE_MAP).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div><div className="pc-form-item"><label className="pc-form-label">计划工时</label><input type="number" className="pc-form-control" placeholder="小时" value={formData.plan_hours} onChange={e => setFormData(prev => ({ ...prev, plan_hours: e.target.value }))} /></div><div className="pc-form-item"><label className="pc-form-label">报价</label><input type="number" className="pc-form-control" placeholder="元" value={formData.quote} onChange={e => setFormData(prev => ({ ...prev, quote: e.target.value }))} /></div></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}><div className="pc-form-item"><label className="pc-form-label">处理人</label><input type="text" className="pc-form-control" placeholder="请输入处理人" value={formData.handler} onChange={e => setFormData(prev => ({ ...prev, handler: e.target.value }))} /></div><div className="pc-form-item"><label className="pc-form-label">是否收费</label><label style={{ display: 'flex', alignItems: 'center', gap: 8 }}><input type="checkbox" checked={formData.is_charge} onChange={e => setFormData(prev => ({ ...prev, is_charge: e.target.checked }))} />收费</label></div></div>
          <div className="pc-form-item"><label className="pc-form-label">描述</label><textarea className="pc-form-control pc-form-textarea" rows={3} placeholder="请输入工单描述" value={formData.description} onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))} /></div>
        </div>
      </PCModal>
      <PCImportModal
        visible={importModalVisible}
        onClose={() => setImportModalVisible(false)}
        onSuccess={() => { setImportModalVisible(false); fetchOrders(); }}
        apiPath="/api/v1/work-orders/batch"
        title="工单"
        templateFields={['工单编号*', '工单名称*', '客户名称', '设备名称', '工单类型', '优先级', '状态', '处理人', '描述']}
      />
    </PCLayout>
  );
}
