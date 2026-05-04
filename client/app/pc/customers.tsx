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

const API_BASE = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || 'http://localhost:9091';

interface Customer {
  id: number;
  name: string;
  contact_person: string;
  contact_phone: string;
  address: string;
  status: 'active' | 'inactive';
  created_at: string;
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
    contact_person: '',
    contact_phone: '',
    address: '',
    status: '' as 'active' | 'inactive' | '',
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/v1/customers`);
      const data = await response.json();
      const list = Array.isArray(data) ? data : (data.customers || []);
      setCustomers(list);
      setPagination(prev => ({ ...prev, total: list.length }));
    } catch (error) {
      // 使用模拟数据
      setCustomers([
        { id: 1, name: '北京科技有限公司', contact_person: '张三', contact_phone: '13800138001', address: '北京市朝阳区', status: 'active', created_at: '2024-01-15' },
        { id: 2, name: '上海网络科技', contact_person: '李四', contact_phone: '13800138002', address: '上海市浦东新区', status: 'active', created_at: '2024-02-20' },
        { id: 3, name: '广州智能制造', contact_person: '王五', contact_phone: '13800138003', address: '广州市天河区', status: 'inactive', created_at: '2024-03-10' },
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
    // 实际应用中这里会调用带搜索条件的API
    const filtered = customers.filter(c =>
      c.name.includes(searchText) || c.contact_person.includes(searchText)
    );
    setPagination(prev => ({ ...prev, total: filtered.length }));
  };

  const handleAdd = () => {
    setEditingCustomer(null);
    setFormData({ name: '', contact_person: '', contact_phone: '', address: '', status: 'active' });
    setModalVisible(true);
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      contact_person: customer.contact_person,
      contact_phone: customer.contact_phone,
      address: customer.address,
      status: customer.status,
    });
    setModalVisible(true);
  };

  const handleDelete = async (customer: Customer) => {
    if (!confirm(`确定删除客户"${customer.name}"吗？`)) return;
    // 实际应用中这里会调用删除API
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

    if (editingCustomer) {
      // 更新
      setCustomers(prev =>
        prev.map(c => c.id === editingCustomer.id ? { ...c, ...formData } : c)
      );
    } else {
      // 新增
      const newCustomer: Customer = {
        id: Date.now(),
        ...formData,
        created_at: new Date().toISOString().split('T')[0],
      };
      setCustomers(prev => [...prev, newCustomer]);
      setPagination(prev => ({ ...prev, total: prev.total + 1 }));
    }
    setModalVisible(false);
  };

  const columns = [
    { key: 'name', title: '客户名称', width: 200 },
    { key: 'contact_person', title: '联系人', width: 100 },
    { key: 'contact_phone', title: '联系电话', width: 130 },
    { key: 'address', title: '地址' },
    {
      key: 'status',
      title: '状态',
      width: 100,
      render: (val: string) => <PCTag type={val === 'active' ? 'success' : 'default'}>{val === 'active' ? '正常' : '停用'}</PCTag>,
    },
    {
      key: 'actions',
      title: '操作',
      width: 160,
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
          <p className="pc-page-description">管理所有客户信息，包括联系人、地址等</p>
        </div>

        <PCCard>
          <PCToolbar
            left={
              <PCSearchBar
                placeholder="搜索客户名称或联系人..."
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
            <div className="pc-form-item">
              <label className="pc-form-label">地址</label>
              <input
                type="text"
                className="pc-form-control"
                placeholder="请输入地址"
                value={formData.address}
                onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
              />
            </div>
          </div>
        </PCModal>
      </PCLayout>
    </>
  );
}
