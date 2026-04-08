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

interface Contract {
  id: number;
  contract_no: string;
  contract_name: string;
  customer_name: string;
  amount: number;
  sign_date: string;
  expire_date: string;
  status: 'active' | 'expired' | 'pending';
}

const statusMap = {
  active: { label: '生效中', type: 'success' as const },
  expired: { label: '已过期', type: 'danger' as const },
  pending: { label: '待生效', type: 'warning' as const },
};

export default function PCContracts() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [formData, setFormData] = useState({
    contract_no: '',
    contract_name: '',
    customer_name: '',
    amount: '',
    sign_date: '',
    expire_date: '',
    status: 'pending' as const,
  });
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  const fetchContracts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/v1/contracts`);
      const data = await response.json();
      const list = Array.isArray(data) ? data : (data.contracts || []);
      setContracts(list);
      setPagination(prev => ({ ...prev, total: list.length }));
    } catch (error) {
      setContracts([
        { id: 1, contract_no: 'HT-2024-001', contract_name: '设备采购合同', customer_name: '北京科技', amount: 500000, sign_date: '2024-01-15', expire_date: '2025-01-14', status: 'active' },
        { id: 2, contract_no: 'HT-2024-002', contract_name: '维保服务合同', customer_name: '上海网络', amount: 120000, sign_date: '2024-02-20', expire_date: '2025-02-19', status: 'active' },
        { id: 3, contract_no: 'HT-2024-003', contract_name: '系统集成合同', customer_name: '广州智能', amount: 800000, sign_date: '2023-06-01', expire_date: '2024-05-31', status: 'expired' },
      ]);
      setPagination(prev => ({ ...prev, total: 3 }));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(amount);
  };

  const columns = [
    { key: 'contract_no', title: '合同编号', width: 120 },
    { key: 'contract_name', title: '合同名称', width: 180 },
    { key: 'customer_name', title: '客户名称', width: 120 },
    {
      key: 'amount',
      title: '合同金额',
      width: 120,
      render: (val: number) => <span style={{ color: '#FF6B6B', fontWeight: 600 }}>{formatAmount(val)}</span>,
    },
    { key: 'sign_date', title: '签订日期', width: 100 },
    { key: 'expire_date', title: '到期日期', width: 100 },
    {
      key: 'status',
      title: '状态',
      width: 80,
      render: (val: keyof typeof statusMap) => {
        const { label, type } = statusMap[val];
        return <PCTag type={type}>{label}</PCTag>;
      },
    },
    {
      key: 'actions',
      title: '操作',
      width: 180,
      render: (_: any, record: Contract) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="pc-btn pc-btn-text pc-btn-sm" onClick={() => window.location.href = `/pc/contract-detail?id=${record.id}`}>详情</button>
          <button className="pc-btn pc-btn-text pc-btn-sm" onClick={() => { setEditingContract(record); setFormData({ ...record, amount: String(record.amount) }); setModalVisible(true); }}>编辑</button>
          <button className="pc-btn pc-btn-text pc-btn-sm" style={{ color: '#FF4D4F' }} onClick={() => { setContracts(prev => prev.filter(c => c.id !== record.id)); }}>删除</button>
        </div>
      ),
    },
  ];

  const filteredContracts = contracts.filter(c => {
    const matchSearch = !searchText || c.contract_name.includes(searchText) || c.contract_no.includes(searchText);
    const matchStatus = !statusFilter || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <>
      <style>{`<style>@import url('/assets/styles/pc-global.css');</style>`}</style>
      <PCLayout>
        <div className="pc-page-header">
          <h1 className="pc-page-title">合同管理</h1>
          <p className="pc-page-description">管理所有合同信息，包括采购合同、服务合同等</p>
        </div>

        <PCCard>
          <PCToolbar
            left={
              <>
                <PCSearchBar placeholder="搜索合同名称或编号..." value={searchText} onChange={setSearchText} onSearch={() => {}} />
                <div style={{ display: 'flex', gap: 8 }}>
                  {Object.entries(statusMap).map(([key, { label }]) => (
                    <button key={key} className={`pc-btn pc-btn-sm ${statusFilter === key ? 'pc-btn-primary' : 'pc-btn-default'}`} onClick={() => setStatusFilter(statusFilter === key ? '' : key)}>{label}</button>
                  ))}
                </div>
              </>
            }
            right={<button className="pc-btn pc-btn-primary" onClick={() => { setEditingContract(null); setFormData({ contract_no: '', contract_name: '', customer_name: '', amount: '', sign_date: '', expire_date: '', status: 'pending' }); setModalVisible(true); }}>+ 新增合同</button>}
          />

          <PCTable columns={columns} data={filteredContracts} rowKey="id" loading={loading} selectedRowKeys={selectedRowKeys} onSelectChange={setSelectedRowKeys} />

          <PCPagination current={pagination.current} pageSize={pagination.pageSize} total={pagination.total} onChange={(page) => setPagination(prev => ({ ...prev, current: page }))} />
        </PCCard>

        <PCModal visible={modalVisible} title={editingContract ? '编辑合同' : '新增合同'} onClose={() => setModalVisible(false)} width={560}
          footer={<><button className="pc-btn pc-btn-default" onClick={() => setModalVisible(false)}>取消</button><button className="pc-btn pc-btn-primary" onClick={() => { if (editingContract) { setContracts(prev => prev.map(c => c.id === editingContract.id ? { ...c, ...formData, amount: Number(formData.amount) } : c)); } else { setContracts(prev => [...prev, { id: Date.now(), ...formData, amount: Number(formData.amount) }]); setPagination(prev => ({ ...prev, total: prev.total + 1 })); } setModalVisible(false); }}>保存</button></>}
        >
          <div className="pc-form">
            <div className="pc-form-item"><label className="pc-form-label required">合同编号</label><input type="text" className="pc-form-control" value={formData.contract_no} onChange={e => setFormData(prev => ({ ...prev, contract_no: e.target.value }))} /></div>
            <div className="pc-form-item"><label className="pc-form-label required">合同名称</label><input type="text" className="pc-form-control" value={formData.contract_name} onChange={e => setFormData(prev => ({ ...prev, contract_name: e.target.value }))} /></div>
            <div className="pc-form-item"><label className="pc-form-label">客户名称</label><input type="text" className="pc-form-control" value={formData.customer_name} onChange={e => setFormData(prev => ({ ...prev, customer_name: e.target.value }))} /></div>
            <div className="pc-form-item"><label className="pc-form-label">合同金额</label><input type="number" className="pc-form-control" value={formData.amount} onChange={e => setFormData(prev => ({ ...prev, amount: e.target.value }))} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="pc-form-item"><label className="pc-form-label">签订日期</label><input type="date" className="pc-form-control" value={formData.sign_date} onChange={e => setFormData(prev => ({ ...prev, sign_date: e.target.value }))} /></div>
              <div className="pc-form-item"><label className="pc-form-label">到期日期</label><input type="date" className="pc-form-control" value={formData.expire_date} onChange={e => setFormData(prev => ({ ...prev, expire_date: e.target.value }))} /></div>
            </div>
          </div>
        </PCModal>
      </PCLayout>
    </>
  );
}
