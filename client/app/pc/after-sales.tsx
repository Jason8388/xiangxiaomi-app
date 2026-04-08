import React, { useState, useEffect, useCallback } from 'react';
import { PCLayout } from '@/components/pc/PCLayout';
import { PCTable } from '@/components/pc/PCComponents';
import { PCTag } from '@/components/pc/PCComponents';
import { PCCard } from '@/components/pc/PCComponents';
import { PCToolbar } from '@/components/pc/PCComponents';
import { PCSearchBar } from '@/components/pc/PCComponents';
import { PCModal } from '@/components/pc/PCComponents';
import { PCPagination } from '@/components/pc/PCComponents';

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
}

const typeMap = { repair: '维修', maintenance: '保养', installation: '安装' };
const priorityMap = { urgent: { label: '紧急', type: 'danger' as const }, normal: { label: '普通', type: 'warning' as const }, low: { label: '低', type: 'default' as const } };
const statusMap = { pending: { label: '待处理', type: 'warning' as const }, processing: { label: '处理中', type: 'primary' as const }, completed: { label: '已完成', type: 'success' as const } };

export default function PCAfterSales() {
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingOrder, setEditingOrder] = useState<WorkOrder | null>(null);
  const [formData, setFormData] = useState({ order_no: '', title: '', customer_name: '', device_name: '', type: 'repair' as const, priority: 'normal' as const, status: 'pending' as const });
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
        { id: 1, order_no: 'WO-2024-001', title: '设备故障维修', customer_name: '北京科技', device_name: '变频器A-001', type: 'repair', priority: 'urgent', status: 'pending', created_at: '2024-03-20' },
        { id: 2, order_no: 'WO-2024-002', title: '定期保养服务', customer_name: '上海网络', device_name: 'PLC控制柜', type: 'maintenance', priority: 'normal', status: 'processing', created_at: '2024-03-18' },
        { id: 3, order_no: 'WO-2024-003', title: '新设备安装调试', customer_name: '广州智能', device_name: '伺服驱动器', type: 'installation', priority: 'low', status: 'completed', created_at: '2024-03-15' },
      ]);
      setPagination(prev => ({ ...prev, total: 3 }));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const columns = [
    { key: 'order_no', title: '工单编号', width: 120 },
    { key: 'title', title: '工单标题', width: 180 },
    { key: 'customer_name', title: '客户名称', width: 120 },
    { key: 'device_name', title: '设备名称', width: 120 },
    { key: 'type', title: '类型', width: 80, render: (val: keyof typeof typeMap) => typeMap[val] },
    { key: 'priority', title: '优先级', width: 80, render: (val: keyof typeof priorityMap) => { const { label, type } = priorityMap[val]; return <PCTag type={type}>{label}</PCTag>; } },
    { key: 'status', title: '状态', width: 80, render: (val: keyof typeof statusMap) => { const { label, type } = statusMap[val]; return <PCTag type={type}>{label}</PCTag>; } },
    { key: 'created_at', title: '创建时间', width: 100 },
    { key: 'actions', title: '操作', width: 140, render: (_: any, record: WorkOrder) => (
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="pc-btn pc-btn-text pc-btn-sm" onClick={() => { setEditingOrder(record); setFormData({ ...record }); setModalVisible(true); }}>处理</button>
        <button className="pc-btn pc-btn-text pc-btn-sm" style={{ color: '#FF4D4F' }} onClick={() => { if (confirm('确定删除吗？')) setOrders(prev => prev.filter(o => o.id !== record.id)); }}>删除</button>
      </div>
    ) },
  ];

  const filteredOrders = orders.filter(o => {
    const matchSearch = !searchText || o.title.includes(searchText) || o.order_no.includes(searchText);
    const matchStatus = !statusFilter || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <>
      <style>{`<style>@import url('/assets/styles/pc-global.css');</style>`}</style>
      <PCLayout>
        <div className="pc-page-header"><h1 className="pc-page-title">售后服务</h1><p className="pc-page-description">管理售后工单，包括维修、保养、安装等服务</p></div>
        <PCCard>
          <PCToolbar left={<><PCSearchBar placeholder="搜索工单..." value={searchText} onChange={setSearchText} onSearch={() => {}} /><div style={{ display: 'flex', gap: 8 }}>{Object.entries(statusMap).map(([key, { label }]) => (<button key={key} className={`pc-btn pc-btn-sm ${statusFilter === key ? 'pc-btn-primary' : 'pc-btn-default'}`} onClick={() => setStatusFilter(statusFilter === key ? '' : key)}>{label}</button>))}</div></>} right={<button className="pc-btn pc-btn-primary" onClick={() => { setEditingOrder(null); setFormData({ order_no: `WO-${Date.now()}`, title: '', customer_name: '', device_name: '', type: 'repair', priority: 'normal', status: 'pending' }); setModalVisible(true); }}>+ 新建工单</button>} />
          <PCTable columns={columns} data={filteredOrders} rowKey="id" loading={loading} selectedRowKeys={selectedRowKeys} onSelectChange={setSelectedRowKeys} />
          <PCPagination current={pagination.current} pageSize={pagination.pageSize} total={pagination.total} onChange={(page) => setPagination(prev => ({ ...prev, current: page }))} />
        </PCCard>
        <PCModal visible={modalVisible} title={editingOrder ? '处理工单' : '新建工单'} onClose={() => setModalVisible(false)} width={560} footer={<><button className="pc-btn pc-btn-default" onClick={() => setModalVisible(false)}>取消</button><button className="pc-btn pc-btn-primary" onClick={() => { if (editingOrder) { setOrders(prev => prev.map(o => o.id === editingOrder.id ? { ...o, ...formData } : o)); } else { setOrders(prev => [...prev, { id: Date.now(), ...formData, created_at: new Date().toISOString().split('T')[0] }]); setPagination(prev => ({ ...prev, total: prev.total + 1 })); } setModalVisible(false); }}>保存</button></>}>
          <div className="pc-form">
            <div className="pc-form-item"><label className="pc-form-label">工单标题</label><input type="text" className="pc-form-control" value={formData.title} onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))} /></div>
            <div className="pc-form-item"><label className="pc-form-label">客户名称</label><input type="text" className="pc-form-control" value={formData.customer_name} onChange={e => setFormData(prev => ({ ...prev, customer_name: e.target.value }))} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="pc-form-item"><label className="pc-form-label">类型</label><select className="pc-form-control pc-form-select" value={formData.type} onChange={e => setFormData(prev => ({ ...prev, type: e.target.value as any }))}><option value="repair">维修</option><option value="maintenance">保养</option><option value="installation">安装</option></select></div>
              <div className="pc-form-item"><label className="pc-form-label">优先级</label><select className="pc-form-control pc-form-select" value={formData.priority} onChange={e => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}><option value="urgent">紧急</option><option value="normal">普通</option><option value="low">低</option></select></div>
            </div>
            {editingOrder && <div className="pc-form-item"><label className="pc-form-label">状态</label><select className="pc-form-control pc-form-select" value={formData.status} onChange={e => setFormData(prev => ({ ...prev, status: e.target.value as any }))}><option value="pending">待处理</option><option value="processing">处理中</option><option value="completed">已完成</option></select></div>}
          </div>
        </PCModal>
      </PCLayout>
    </>
  );
}
