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

import { getApiBaseUrl } from '@/utils/api';
const API_BASE = getApiBaseUrl();

interface Customer {
  id: number;
  name: string;
  industry?: string;
  contact_person?: string;
  contact_phone?: string;
  business_manager?: string;
  sub_group?: string;
  address?: string;
  remarks?: string;
  device_count: number;
  contract_count: number;
  work_order_count: number;
  created_at?: string;
}

export default function PCCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [searchText, setSearchText] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    contact_person: '',
    contact_phone: '',
    business_manager: '',
    sub_group: '',
    address: '',
    remarks: '',
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // 服务看管部门选项
  const serviceDepartmentOptions = ['技术服务一组', '技术服务二组', '技术服务三组'];

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/v1/customers`);
      const data = await response.json();
      const list = Array.isArray(data) ? data : (data.customers || []);
      // 按名称排序
      const sorted = list.sort((a: Customer, b: Customer) => 
        a.name.toUpperCase().localeCompare(b.name.toUpperCase())
      );
      setCustomers(sorted);
      setPagination(prev => ({ ...prev, total: sorted.length }));
    } catch (error) {
      console.error('获取客户列表失败:', error);
      setCustomers([
        { id: 1, name: '北京科技有限公司', industry: '互联网', contact_person: '张三', contact_phone: '13800138001', business_manager: '李经理', sub_group: '技术服务一组', address: '北京市朝阳区', remarks: '重要客户', device_count: 3, contract_count: 2, work_order_count: 5, created_at: '2024-01-15' },
        { id: 2, name: '上海网络科技', industry: '软件开发', contact_person: '李四', contact_phone: '13800138002', business_manager: '王经理', sub_group: '技术服务二组', address: '上海市浦东新区', remarks: '', device_count: 5, contract_count: 1, work_order_count: 3, created_at: '2024-02-20' },
        { id: 3, name: '广州智能制造', industry: '制造业', contact_person: '王五', contact_phone: '13800138003', business_manager: '赵经理', sub_group: '技术服务三组', address: '广州市天河区', remarks: '优先服务', device_count: 8, contract_count: 3, work_order_count: 10, created_at: '2024-03-10' },
      ]);
      setPagination(prev => ({ ...prev, total: 3 }));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleSearch = () => {
    if (!searchText.trim()) {
      fetchCustomers();
      return;
    }
    const keyword = searchText.toLowerCase();
    const filtered = customers.filter(c =>
      c.name.toLowerCase().includes(keyword) ||
      (c.business_manager && c.business_manager.toLowerCase().includes(keyword)) ||
      (c.contact_person && c.contact_person.toLowerCase().includes(keyword))
    );
    setPagination(prev => ({ ...prev, total: filtered.length }));
  };

  const handleAdd = () => {
    setEditingCustomer(null);
    setFormData({ name: '', industry: '', contact_person: '', contact_phone: '', business_manager: '', sub_group: '', address: '', remarks: '' });
    setModalVisible(true);
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      industry: customer.industry || '',
      contact_person: customer.contact_person || '',
      contact_phone: customer.contact_phone || '',
      business_manager: customer.business_manager || '',
      sub_group: customer.sub_group || '',
      address: customer.address || '',
      remarks: customer.remarks || '',
    });
    setModalVisible(true);
  };

  const handleDelete = async (customer: Customer) => {
    if (!confirm(`确定删除客户"${customer.name}"吗？`)) return;
    try {
      await fetch(`${API_BASE}/api/v1/customers/${customer.id}`, { method: 'DELETE' });
    } catch (error) {
      console.error('删除失败:', error);
    }
    setCustomers(prev => prev.filter(c => c.id !== customer.id));
    setPagination(prev => ({ ...prev, total: prev.total - 1 }));
  };

  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) return;
    if (!confirm(`确定删除选中的 ${selectedRowKeys.length} 个客户吗？`)) return;
    setCustomers(prev => prev.filter(c => !selectedRowKeys.includes(String(c.id))));
    setPagination(prev => ({ ...prev, total: prev.total - selectedRowKeys.length }));
    setSelectedRowKeys([]);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('请输入客户名称');
      return;
    }

    try {
      if (editingCustomer) {
        // 更新
        const response = await fetch(`${API_BASE}/api/v1/customers/${editingCustomer.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (response.ok) {
          setCustomers(prev =>
            prev.map(c => c.id === editingCustomer.id ? { ...c, ...formData } : c)
          );
        }
      } else {
        // 新增
        const response = await fetch(`${API_BASE}/api/v1/customers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (response.ok) {
          const newCustomer: Customer = {
            id: Date.now(),
            ...formData,
            device_count: 0,
            contract_count: 0,
            work_order_count: 0,
            created_at: new Date().toISOString().split('T')[0],
          };
          setCustomers(prev => [...prev, newCustomer]);
          setPagination(prev => ({ ...prev, total: prev.total + 1 }));
        }
      }
    } catch (error) {
      console.error('保存失败:', error);
    }
    setModalVisible(false);
  };

  const columns = [
    { key: 'name', title: '客户名称', width: 180 },
    { key: 'business_manager', title: '业务经理', width: 100 },
    { key: 'sub_group', title: '服务看管部门', width: 120 },
    { key: 'industry', title: '所属行业', width: 100 },
    { key: 'contact_person', title: '联系人', width: 80 },
    { key: 'contact_phone', title: '联系电话', width: 120 },
    { key: 'address', title: '地址', width: 150 },
    { 
      key: 'stats', 
      title: '关联数据', 
      width: 180,
      render: (_: any, record: Customer) => (
        <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#666' }}>
          <span title="设备数">{record.device_count || 0}设备</span>
          <span title="合同数">{record.contract_count || 0}合同</span>
          <span title="工单数">{record.work_order_count || 0}工单</span>
        </div>
      ),
    },
    { key: 'remarks', title: '备注', width: 100 },
    {
      key: 'actions',
      title: '操作',
      width: 140,
      render: (_: any, record: Customer) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="pc-btn pc-btn-text pc-btn-sm" onClick={() => handleEdit(record)}>编辑</button>
          <button className="pc-btn pc-btn-text pc-btn-sm" style={{ color: '#FF4D4F' }} onClick={() => handleDelete(record)}>删除</button>
        </div>
      ),
    },
  ];

  return (
    <>
      
      <PCLayout>
        <div className="pc-page-header">
          <h1 className="pc-page-title">客户管理</h1>
          <p className="pc-page-description">管理所有客户信息，包括业务经理、服务部门、联系人、地址等</p>
        </div>

        <PCCard>
          <PCToolbar
            left={
              <PCSearchBar
                placeholder="搜索客户名称、业务经理或联系人..."
                value={searchText}
                onChange={setSearchText}
                onSearch={handleSearch}
              />
            }
            right={
              <div style={{ display: 'flex', gap: 8 }}>
                {selectedRowKeys.length > 0 && (
                  <button className="pc-btn pc-btn-danger" onClick={handleBatchDelete}>
                    批量删除 ({selectedRowKeys.length})
                  </button>
                )}
                <button className="pc-btn pc-btn-primary" onClick={handleAdd}>
                  + 新增客户
                </button>
              </div>
            }
          />

          <PCTable
            columns={columns}
            data={customers}
            rowKey="id"
            loading={loading}
            selectedRowKeys={selectedRowKeys}
            onSelectChange={setSelectedRowKeys}
            onRowClick={(record) => window.location.href = `/pc/customer-detail?id=${record.id}`}
          />

          <PCPagination
            current={pagination.current}
            pageSize={pagination.pageSize}
            total={pagination.total}
            onChange={(page) => setPagination(prev => ({ ...prev, current: page }))}
          />
        </PCCard>

        <PCModal
          visible={modalVisible}
          title={editingCustomer ? '编辑客户' : '新增客户'}
          onClose={() => setModalVisible(false)}
          width={600}
          footer={
            <>
              <button className="pc-btn pc-btn-default" onClick={() => setModalVisible(false)}>取消</button>
              <button className="pc-btn pc-btn-primary" onClick={handleSave}>保存</button>
            </>
          }
        >
          <div className="pc-form">
            <div className="pc-form-item">
              <label className="pc-form-label required">客户名称</label>
              <input
                type="text"
                className="pc-form-control"
                placeholder="请输入客户名称"
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="pc-form-item">
              <label className="pc-form-label">业务经理</label>
              <input
                type="text"
                className="pc-form-control"
                placeholder="请输入业务经理"
                value={formData.business_manager}
                onChange={e => setFormData(prev => ({ ...prev, business_manager: e.target.value }))}
              />
            </div>
            <div className="pc-form-item">
              <label className="pc-form-label">服务看管部门</label>
              <select
                className="pc-form-control"
                value={formData.sub_group}
                onChange={e => setFormData(prev => ({ ...prev, sub_group: e.target.value }))}
              >
                <option value="">请选择服务看管部门</option>
                {serviceDepartmentOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div className="pc-form-item">
              <label className="pc-form-label">所属行业</label>
              <input
                type="text"
                className="pc-form-control"
                placeholder="请输入所属行业"
                value={formData.industry}
                onChange={e => setFormData(prev => ({ ...prev, industry: e.target.value }))}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="pc-form-item">
                <label className="pc-form-label">联系人</label>
                <input
                  type="text"
                  className="pc-form-control"
                  placeholder="请输入联系人姓名"
                  value={formData.contact_person}
                  onChange={e => setFormData(prev => ({ ...prev, contact_person: e.target.value }))}
                />
              </div>
              <div className="pc-form-item">
                <label className="pc-form-label">联系电话</label>
                <input
                  type="text"
                  className="pc-form-control"
                  placeholder="请输入联系电话"
                  value={formData.contact_phone}
                  onChange={e => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
                />
              </div>
            </div>
            <div className="pc-form-item">
              <label className="pc-form-label">地址</label>
              <input
                type="text"
                className="pc-form-control"
                placeholder="请输入客户地址"
                value={formData.address}
                onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
              />
            </div>
            <div className="pc-form-item">
              <label className="pc-form-label">备注</label>
              <textarea
                className="pc-form-control pc-form-textarea"
                rows={3}
                placeholder="请输入备注信息"
                value={formData.remarks}
                onChange={e => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
              />
            </div>
          </div>
        </PCModal>
      </PCLayout>
    </>
  );
}
