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

interface Contract {
  id: number;
  contract_number: string;
  contract_name: string;
  customer_name: string;
  business_manager?: string;
  sign_date: string;
  acceptance_date?: string;
  warranty_end_date?: string;
  contract_amount?: number;
  remarks?: string;
  tags?: string[];
  device_count: number;
  work_order_count: number;
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
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [formData, setFormData] = useState({
    contract_number: '',
    contract_name: '',
    customer_name: '',
    business_manager: '',
    sign_date: '',
    acceptance_date: '',
    warranty_end_date: '',
    contract_amount: '',
    remarks: '',
  });
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  const fetchContracts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/v1/contracts`);
      const data = await response.json();
      const list = Array.isArray(data) ? data : (data.contracts || []);
      // 按签订日期倒序
      const sorted = list.sort((a: Contract, b: Contract) => 
        new Date(b.sign_date || 0).getTime() - new Date(a.sign_date || 0).getTime()
      );
      setContracts(sorted);
      setPagination(prev => ({ ...prev, total: sorted.length }));
    } catch (error) {
      console.error('获取合同列表失败:', error);
      setContracts([
        { id: 1, contract_number: 'HT-2024-001', contract_name: '设备采购合同', customer_name: '北京科技有限公司', business_manager: '李经理', sign_date: '2024-01-15', acceptance_date: '2024-02-01', warranty_end_date: '2025-02-01', contract_amount: 500000, remarks: '优先供货', tags: ['采购', '设备'], device_count: 5, work_order_count: 3 },
        { id: 2, contract_number: 'HT-2024-002', contract_name: '维保服务合同', customer_name: '上海网络科技', business_manager: '王经理', sign_date: '2024-02-20', acceptance_date: '2024-03-01', warranty_end_date: '2025-02-20', contract_amount: 120000, remarks: '', tags: ['服务'], device_count: 3, work_order_count: 8 },
        { id: 3, contract_number: 'HT-2024-003', contract_name: '系统集成合同', customer_name: '广州智能制造', business_manager: '赵经理', sign_date: '2023-06-01', acceptance_date: '2023-07-01', warranty_end_date: '2024-06-01', contract_amount: 800000, remarks: '长期合作', tags: ['集成'], device_count: 10, work_order_count: 15 },
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
    if (!amount) return '-';
    return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(amount);
  };

  const columns = [
    { key: 'contract_number', title: '合同编号', width: 120 },
    { key: 'contract_name', title: '合同名称', width: 180 },
    { key: 'customer_name', title: '客户名称', width: 150 },
    { key: 'business_manager', title: '业务经理', width: 100 },
    { key: 'sign_date', title: '签订日期', width: 100 },
    { key: 'acceptance_date', title: '验收日期', width: 100 },
    { key: 'warranty_end_date', title: '质保到期', width: 100 },
    {
      key: 'contract_amount',
      title: '合同金额',
      width: 120,
      render: (val: number) => <span style={{ color: '#FF6B6B', fontWeight: 600 }}>{formatAmount(val)}</span>,
    },
    { 
      key: 'stats', 
      title: '关联数据', 
      width: 120,
      render: (_: any, record: Contract) => (
        <div style={{ display: 'flex', gap: 8, fontSize: 12, color: '#666' }}>
          <span title="设备数">{record.device_count || 0}设备</span>
          <span title="工单数">{record.work_order_count || 0}工单</span>
        </div>
      ),
    },
    { key: 'remarks', title: '备注', width: 100 },
    {
      key: 'actions',
      title: '操作',
      width: 180,
      render: (_: any, record: Contract) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="pc-btn pc-btn-text pc-btn-sm" onClick={() => window.location.href = `/pc/contract-detail?id=${record.id}`}>详情</button>
          <button className="pc-btn pc-btn-text pc-btn-sm" onClick={() => { setEditingContract(record); setFormData({ contract_number: record.contract_number, contract_name: record.contract_name, customer_name: record.customer_name, business_manager: record.business_manager || '', sign_date: record.sign_date || '', acceptance_date: record.acceptance_date || '', warranty_end_date: record.warranty_end_date || '', contract_amount: String(record.contract_amount || ''), remarks: record.remarks || '' }); setModalVisible(true); }}>编辑</button>
          <button className="pc-btn pc-btn-text pc-btn-sm" style={{ color: '#FF4D4F' }} onClick={async () => { if (!confirm('确定删除吗？')) return; try { await fetch(`${API_BASE}/api/v1/contracts/${record.id}`, { method: 'DELETE' }); } catch (e) {} setContracts(prev => prev.filter(c => c.id !== record.id)); }}>删除</button>
        </div>
      ),
    },
  ];

  const filteredContracts = contracts.filter(c => {
    const matchSearch = !searchText || c.contract_name.includes(searchText) || c.contract_number.includes(searchText) || c.customer_name.includes(searchText) || (c.business_manager && c.business_manager.includes(searchText));
    return matchSearch;
  });

  return (
    <>
      
      <PCLayout>
        <div className="pc-page-header">
          <h1 className="pc-page-title">合同管理</h1>
          <p className="pc-page-description">管理所有合同信息，包括采购合同、服务合同等，含业务经理、验收日期、质保到期等完整信息</p>
        </div>

        <PCCard>
          <PCToolbar
            left={
              <>
                <PCSearchBar placeholder="搜索合同名称、编号、客户或业务经理..." value={searchText} onChange={setSearchText} onSearch={() => {}} />
              </>
            }
            right={<><button className="pc-btn pc-btn-default" style={{ marginRight: 8 }} onClick={() => setImportModalVisible(true)}>批量导入</button><button className="pc-btn pc-btn-primary" onClick={() => { setEditingContract(null); setFormData({ contract_number: '', contract_name: '', customer_name: '', business_manager: '', sign_date: '', acceptance_date: '', warranty_end_date: '', contract_amount: '', remarks: '' }); setModalVisible(true); }}>+ 新增合同</button></>}
          />

          <PCTable columns={columns} data={filteredContracts} rowKey="id" loading={loading} selectedRowKeys={selectedRowKeys} onSelectChange={setSelectedRowKeys} />

          <PCPagination current={pagination.current} pageSize={pagination.pageSize} total={pagination.total} onChange={(page) => setPagination(prev => ({ ...prev, current: page }))} />
        </PCCard>

        <PCModal visible={modalVisible} title={editingContract ? '编辑合同' : '新增合同'} onClose={() => setModalVisible(false)} width={640}
          footer={<><button className="pc-btn pc-btn-default" onClick={() => setModalVisible(false)}>取消</button><button className="pc-btn pc-btn-primary" onClick={async () => { try { if (editingContract) { const response = await fetch(`${API_BASE}/api/v1/contracts/${editingContract.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...formData, contract_amount: Number(formData.contract_amount) }) }); if (response.ok) setContracts(prev => prev.map(c => c.id === editingContract.id ? { ...c, ...formData, contract_amount: Number(formData.contract_amount) } : c)); } else { const response = await fetch(`${API_BASE}/api/v1/contracts`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...formData, contract_amount: Number(formData.contract_amount) }) }); if (response.ok) setContracts(prev => [...prev, { id: Date.now(), ...formData, contract_amount: Number(formData.contract_amount), device_count: 0, work_order_count: 0 }]); setPagination(prev => ({ ...prev, total: prev.total + 1 })); } } catch (e) { console.error(e); } setModalVisible(false); }}>保存</button></>}
        >
          <div className="pc-form">
            <div className="pc-form-item"><label className="pc-form-label required">合同编号</label><input type="text" className="pc-form-control" placeholder="请输入合同编号" value={formData.contract_number} onChange={e => setFormData(prev => ({ ...prev, contract_number: e.target.value }))} /></div>
            <div className="pc-form-item"><label className="pc-form-label required">合同名称</label><input type="text" className="pc-form-control" placeholder="请输入合同名称" value={formData.contract_name} onChange={e => setFormData(prev => ({ ...prev, contract_name: e.target.value }))} /></div>
            <div className="pc-form-item"><label className="pc-form-label">客户名称</label><input type="text" className="pc-form-control" placeholder="请输入客户名称" value={formData.customer_name} onChange={e => setFormData(prev => ({ ...prev, customer_name: e.target.value }))} /></div>
            <div className="pc-form-item"><label className="pc-form-label">业务经理</label><input type="text" className="pc-form-control" placeholder="请输入业务经理" value={formData.business_manager} onChange={e => setFormData(prev => ({ ...prev, business_manager: e.target.value }))} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="pc-form-item"><label className="pc-form-label">签订日期</label><input type="date" className="pc-form-control" value={formData.sign_date} onChange={e => setFormData(prev => ({ ...prev, sign_date: e.target.value }))} /></div>
              <div className="pc-form-item"><label className="pc-form-label">验收日期</label><input type="date" className="pc-form-control" value={formData.acceptance_date} onChange={e => setFormData(prev => ({ ...prev, acceptance_date: e.target.value }))} /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="pc-form-item"><label className="pc-form-label">质保到期日期</label><input type="date" className="pc-form-control" value={formData.warranty_end_date} onChange={e => setFormData(prev => ({ ...prev, warranty_end_date: e.target.value }))} /></div>
              <div className="pc-form-item"><label className="pc-form-label">合同金额</label><input type="number" className="pc-form-control" placeholder="请输入合同金额" value={formData.contract_amount} onChange={e => setFormData(prev => ({ ...prev, contract_amount: e.target.value }))} /></div>
            </div>
            <div className="pc-form-item"><label className="pc-form-label">备注</label><textarea className="pc-form-control pc-form-textarea" rows={3} placeholder="请输入备注信息" value={formData.remarks} onChange={e => setFormData(prev => ({ ...prev, remarks: e.target.value }))} /></div>
          </div>
        </PCModal>

        <PCImportModal
          visible={importModalVisible}
          onClose={() => setImportModalVisible(false)}
          title="批量导入合同"
          apiUrl={`${API_BASE}/api/v1/contracts/batch`}
          templateFields={['合同编号*', '合同名称*', '客户名称', '业务经理', '签订日期', '验收日期', '质保到期日期', '合同金额', '备注']}
          onSuccess={() => { setImportModalVisible(false); fetchContracts(); }}
        />
      </PCLayout>
    </>
  );
}
