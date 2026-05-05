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

interface Device {
  id: number;
  device_number: string;
  device_name: string;
  device_model?: string;
  device_type?: string;
  customer_name: string;
  factory_date?: string;
  acceptance_date?: string;
  warranty_end_date?: string;
  status: string;
  contract_name?: string;
  qr_code_id?: string;
  location?: string;
  remarks?: string;
  service_number?: string;
}

const DEVICE_TYPES = ['智能测温', '智能焊接', '智能测量', '外观品检', '尺寸测量', '角度定位', '数字化产品', '第三方设备', '其它'];

const statusMap = {
  online: { label: '在线', type: 'success' as const },
  offline: { label: '离线', type: 'default' as const },
  warning: { label: '告警', type: 'danger' as const },
};

export default function PCDevices() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [formData, setFormData] = useState({
    device_number: '',
    device_name: '',
    device_model: '',
    device_type: '',
    customer_name: '',
    factory_date: '',
    acceptance_date: '',
    warranty_end_date: '',
    status: 'online' as string,
    contract_name: '',
    qr_code_id: '',
    location: '',
    remarks: '',
    service_number: '',
  });
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);

  const fetchDevices = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/v1/devices`);
      const data = await response.json();
      const list = Array.isArray(data) ? data : (data.devices || []);
      // 按出厂日期排序
      const sorted = list.sort((a: Device, b: Device) => 
        new Date(a.factory_date || 0).getTime() - new Date(b.factory_date || 0).getTime()
      );
      setDevices(sorted);
      setPagination(prev => ({ ...prev, total: sorted.length }));
    } catch (error) {
      console.error('获取设备列表失败:', error);
      setDevices([
        { id: 1, device_number: 'A-001', device_name: '变频器控制器', device_model: 'VFD-5000', device_type: '智能测温', customer_name: '北京科技有限公司', factory_date: '2023-06-15', acceptance_date: '2023-07-01', warranty_end_date: '2024-07-01', status: 'online', contract_name: 'HT-2024-001', qr_code_id: 'QR-A001', location: '1号车间', remarks: '运行正常', service_number: 'FW-2024-001' },
        { id: 2, device_number: 'A-002', device_name: 'PLC控制柜', device_model: 'S7-1200', device_type: '数字化产品', customer_name: '上海网络科技', factory_date: '2023-08-20', acceptance_date: '2023-09-01', warranty_end_date: '2024-09-01', status: 'warning', contract_name: 'HT-2024-002', qr_code_id: 'QR-A002', location: '2号车间', remarks: '需要维护', service_number: 'FW-2024-002' },
        { id: 3, device_number: 'B-001', device_name: '伺服驱动器', device_model: 'MR-J4', device_type: '智能焊接', customer_name: '广州智能制造', factory_date: '2023-10-10', acceptance_date: '2023-11-01', warranty_end_date: '2024-11-01', status: 'offline', contract_name: 'HT-2024-003', qr_code_id: 'QR-B001', location: '3号车间', remarks: '', service_number: 'FW-2024-003' },
      ]);
      setPagination(prev => ({ ...prev, total: 3 }));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  const handleSearch = () => {
    if (!searchText.trim()) {
      fetchDevices();
      return;
    }
    const keyword = searchText.toLowerCase();
    const filtered = devices.filter(d =>
      d.device_name.toLowerCase().includes(keyword) ||
      d.device_number.toLowerCase().includes(keyword) ||
      d.customer_name.toLowerCase().includes(keyword)
    );
    setPagination(prev => ({ ...prev, total: filtered.length }));
  };

  const handleAdd = () => {
    setEditingDevice(null);
    setFormData({
      device_number: '',
      device_name: '',
      device_model: '',
      device_type: '',
      customer_name: '',
      factory_date: '',
      acceptance_date: '',
      warranty_end_date: '',
      status: 'online',
      contract_name: '',
      qr_code_id: '',
      location: '',
      remarks: '',
      service_number: '',
    });
    setModalVisible(true);
  };

  const handleEdit = (device: Device) => {
    setEditingDevice(device);
    setFormData({
      device_number: device.device_number,
      device_name: device.device_name,
      device_model: device.device_model || '',
      device_type: device.device_type || '',
      customer_name: device.customer_name,
      factory_date: device.factory_date || '',
      acceptance_date: device.acceptance_date || '',
      warranty_end_date: device.warranty_end_date || '',
      status: device.status || 'online',
      contract_name: device.contract_name || '',
      qr_code_id: device.qr_code_id || '',
      location: device.location || '',
      remarks: device.remarks || '',
      service_number: device.service_number || '',
    });
    setModalVisible(true);
  };

  const handleDelete = async (device: Device) => {
    if (!confirm(`确定删除设备"${device.device_name}"吗？`)) return;
    try {
      await fetch(`${API_BASE}/api/v1/devices/${device.id}`, { method: 'DELETE' });
    } catch (error) {
      console.error('删除失败:', error);
    }
    setDevices(prev => prev.filter(d => d.id !== device.id));
    setPagination(prev => ({ ...prev, total: prev.total - 1 }));
  };

  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) return;
    if (!confirm(`确定删除选中的 ${selectedRowKeys.length} 个设备吗？`)) return;
    setDevices(prev => prev.filter(d => !selectedRowKeys.includes(String(d.id))));
    setPagination(prev => ({ ...prev, total: prev.total - selectedRowKeys.length }));
    setSelectedRowKeys([]);
  };

  const handleImport = async () => {
    if (!importFile) return;
    setImporting(true);
    
    const formData = new FormData();
    formData.append('file', importFile);

    try {
      const sessionId = typeof window !== 'undefined' ? localStorage.getItem('session_id') : null;
      const response = await fetch(`${API_BASE}/api/v1/devices/batch`, {
        method: 'POST',
        headers: {
          'Authorization': sessionId ? `Bearer ${sessionId}` : '',
        },
        body: formData,
      });

      const result = await response.json();
      
      if (response.ok) {
        alert(`导入完成：成功 ${result.successCount} 条，失败 ${result.failCount} 条`);
        if (result.failedRows && result.failedRows.length > 0) {
          console.error('导入失败行:', result.failedRows);
        }
        setImportModalVisible(false);
        setImportFile(null);
        fetchDevices();
      } else {
        alert('导入失败: ' + (result.error || '未知错误'));
      }
    } catch (error) {
      console.error('导入失败:', error);
      alert('导入失败，请重试');
    } finally {
      setImporting(false);
    }
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status === statusFilter ? '' : status);
  };

  const handleTypeFilter = (type: string) => {
    setTypeFilter(type === typeFilter ? '' : type);
  };

  const filteredDevices = devices.filter(d => {
    const matchSearch = !searchText || d.device_name.includes(searchText) || d.device_number.includes(searchText) || d.customer_name.includes(searchText);
    const matchStatus = !statusFilter || d.status === statusFilter;
    const matchType = !typeFilter || d.device_type === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  const columns = [
    { key: 'device_number', title: '设备编号', width: 100 },
    { key: 'device_name', title: '设备名称', width: 150 },
    { key: 'device_model', title: '型号', width: 100 },
    { key: 'device_type', title: '设备类型', width: 100 },
    { key: 'customer_name', title: '所属客户', width: 150 },
    { key: 'factory_date', title: '出厂日期', width: 100 },
    { key: 'acceptance_date', title: '验收日期', width: 100 },
    { key: 'warranty_end_date', title: '质保到期', width: 100 },
    {
      key: 'status',
      title: '状态',
      width: 80,
      render: (val: string) => {
        const map = statusMap[val as keyof typeof statusMap] || { label: val, type: 'default' as const };
        return <PCTag type={map.type}>{map.label}</PCTag>;
      },
    },
    { key: 'contract_name', title: '关联合同', width: 120 },
    { key: 'qr_code_id', title: '二维码ID', width: 100 },
    { key: 'location', title: '安装位置', width: 100 },
    { key: 'service_number', title: '服务编号', width: 120 },
    { key: 'remarks', title: '备注', width: 80 },
    {
      key: 'actions',
      title: '操作',
      width: 140,
      render: (_: any, record: Device) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="pc-btn pc-btn-text pc-btn-sm" onClick={() => window.location.href = `/pc/device-detail?id=${record.id}`}>详情</button>
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
          <h1 className="pc-page-title">设备管理</h1>
          <p className="pc-page-description">管理所有设备信息，包括设备类型、出厂日期、验收日期、质保到期、二维码ID等完整信息</p>
        </div>

        <PCCard>
          <PCToolbar
            left={
              <>
                <PCSearchBar
                  placeholder="搜索设备名称、编号或客户..."
                  value={searchText}
                  onChange={setSearchText}
                  onSearch={handleSearch}
                />
                <div style={{ display: 'flex', gap: 8, marginLeft: 16 }}>
                  {Object.entries(statusMap).map(([key, { label }]) => (
                    <button
                      key={key}
                      className={`pc-btn pc-btn-sm ${statusFilter === key ? 'pc-btn-primary' : 'pc-btn-default'}`}
                      onClick={() => handleStatusFilter(key)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </>
            }
            right={
              <div style={{ display: 'flex', gap: 8 }}>
                {selectedRowKeys.length > 0 && (
                  <button className="pc-btn pc-btn-danger" onClick={handleBatchDelete}>
                    批量删除 ({selectedRowKeys.length})
                  </button>
                )}
                <button className="pc-btn pc-btn-primary" onClick={handleAdd}>
                  + 新增设备
                </button>
                <button className="pc-btn" style={{ background: '#E8F5E9', color: '#1E88E5', border: '1px solid #1E88E5' }} onClick={() => setImportModalVisible(true)}>
                  📥 批量导入
                </button>
                <button className="pc-btn pc-btn-default" style={{ background: '#E8F5E9', color: '#1E88E5', border: '1px solid #1E88E5' }} onClick={() => window.open(`${API_BASE}/api/v1/devices/export`, '_blank')}>
                  📤 批量导出
                </button>
              </div>
            }
          />

          <PCTable
            columns={columns}
            data={filteredDevices}
            rowKey="id"
            loading={loading}
            selectedRowKeys={selectedRowKeys}
            onSelectChange={setSelectedRowKeys}
            onRowClick={(record) => window.location.href = `/pc/device-detail?id=${record.id}`}
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
          title={editingDevice ? '编辑设备' : '新增设备'}
          onClose={() => setModalVisible(false)}
          width={700}
          footer={
            <>
              <button className="pc-btn pc-btn-default" onClick={() => setModalVisible(false)}>取消</button>
              <button className="pc-btn pc-btn-primary" onClick={async () => { try { if (editingDevice) { const response = await fetch(`${API_BASE}/api/v1/devices/${editingDevice.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) }); if (response.ok) setDevices(prev => prev.map(d => d.id === editingDevice.id ? { ...d, ...formData } : d)); } else { const response = await fetch(`${API_BASE}/api/v1/devices`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) }); if (response.ok) setDevices(prev => [...prev, { id: Date.now(), ...formData }]); setPagination(prev => ({ ...prev, total: prev.total + 1 })); } } catch (e) { console.error(e); } setModalVisible(false); }}>保存</button>
            </>
          }
        >
          <div className="pc-form">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="pc-form-item">
                <label className="pc-form-label required">设备编号</label>
                <input type="text" className="pc-form-control" placeholder="请输入设备编号" value={formData.device_number}
                  onChange={e => setFormData(prev => ({ ...prev, device_number: e.target.value }))} />
              </div>
              <div className="pc-form-item">
                <label className="pc-form-label required">设备名称</label>
                <input type="text" className="pc-form-control" placeholder="请输入设备名称" value={formData.device_name}
                  onChange={e => setFormData(prev => ({ ...prev, device_name: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="pc-form-item">
                <label className="pc-form-label">设备型号</label>
                <input type="text" className="pc-form-control" placeholder="请输入设备型号" value={formData.device_model}
                  onChange={e => setFormData(prev => ({ ...prev, device_model: e.target.value }))} />
              </div>
              <div className="pc-form-item">
                <label className="pc-form-label">设备类型</label>
                <select className="pc-form-control" value={formData.device_type}
                  onChange={e => setFormData(prev => ({ ...prev, device_type: e.target.value }))}>
                  <option value="">请选择设备类型</option>
                  {DEVICE_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="pc-form-item">
              <label className="pc-form-label">所属客户</label>
              <input type="text" className="pc-form-control" placeholder="请输入所属客户" value={formData.customer_name}
                onChange={e => setFormData(prev => ({ ...prev, customer_name: e.target.value }))} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div className="pc-form-item">
                <label className="pc-form-label">出厂日期</label>
                <input type="date" className="pc-form-control" value={formData.factory_date}
                  onChange={e => setFormData(prev => ({ ...prev, factory_date: e.target.value }))} />
              </div>
              <div className="pc-form-item">
                <label className="pc-form-label">验收日期</label>
                <input type="date" className="pc-form-control" value={formData.acceptance_date}
                  onChange={e => setFormData(prev => ({ ...prev, acceptance_date: e.target.value }))} />
              </div>
              <div className="pc-form-item">
                <label className="pc-form-label">质保到期</label>
                <input type="date" className="pc-form-control" value={formData.warranty_end_date}
                  onChange={e => setFormData(prev => ({ ...prev, warranty_end_date: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="pc-form-item">
                <label className="pc-form-label">关联合同</label>
                <input type="text" className="pc-form-control" placeholder="请输入关联合同" value={formData.contract_name}
                  onChange={e => setFormData(prev => ({ ...prev, contract_name: e.target.value }))} />
              </div>
              <div className="pc-form-item">
                <label className="pc-form-label">二维码ID</label>
                <input type="text" className="pc-form-control" placeholder="请输入二维码ID" value={formData.qr_code_id}
                  onChange={e => setFormData(prev => ({ ...prev, qr_code_id: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="pc-form-item">
                <label className="pc-form-label">安装位置</label>
                <input type="text" className="pc-form-control" placeholder="请输入安装位置" value={formData.location}
                  onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))} />
              </div>
              <div className="pc-form-item">
                <label className="pc-form-label">服务编号</label>
                <input type="text" className="pc-form-control" placeholder="请输入服务编号" value={formData.service_number}
                  onChange={e => setFormData(prev => ({ ...prev, service_number: e.target.value }))} />
              </div>
            </div>
            <div className="pc-form-item">
              <label className="pc-form-label">备注</label>
              <textarea className="pc-form-control pc-form-textarea" rows={2} placeholder="请输入备注信息" value={formData.remarks}
                onChange={e => setFormData(prev => ({ ...prev, remarks: e.target.value }))} />
            </div>
          </div>
        </PCModal>

        {/* 批量导入弹窗 */}
        <PCModal
          visible={importModalVisible}
          title="批量导入设备"
          onClose={() => { setImportModalVisible(false); setImportFile(null); }}
          width={500}
          footer={
            <>
              <button className="pc-btn pc-btn-default" onClick={() => { setImportModalVisible(false); setImportFile(null); }}>取消</button>
              <button className="pc-btn pc-btn-primary" onClick={handleImport} disabled={!importFile || importing}>
                {importing ? '导入中...' : '开始导入'}
              </button>
            </>
          }
        >
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <input
              type="file"
              id="device-import-file"
              accept=".xlsx,.xls"
              style={{ display: 'none' }}
              onChange={(e) => setImportFile(e.target.files?.[0] || null)}
            />
            <label htmlFor="device-import-file" style={{
              display: 'inline-flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
              padding: '40px 60px',
              border: '2px dashed #DDD',
              borderRadius: 12,
              cursor: 'pointer',
              background: '#FAFAFA',
            }}>
              <span style={{ fontSize: 48 }}>📤</span>
              <span style={{ color: '#666' }}>
                {importFile ? importFile.name : '点击选择Excel文件'}
              </span>
              <span style={{ fontSize: 12, color: '#999' }}>
                支持 .xlsx, .xls 格式
              </span>
            </label>
            <div style={{ marginTop: 16, padding: '12px 16px', background: '#FFF7E6', borderRadius: 8, textAlign: 'left' }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#F57C00', marginBottom: 8 }}>Excel格式要求：</div>
              <div style={{ fontSize: 12, color: '#666', lineHeight: 1.8 }}>
                第1列：设备编号<br/>
                第2列：设备名称<br/>
                第3列：设备类型<br/>
                第4列：设备型号<br/>
                第5列：制造商<br/>
                第6列：序列号<br/>
                第7列：安装位置<br/>
                第8列：客户名称<br/>
                第9列：状态<br/>
                第10列：购买日期<br/>
                第11列：质保到期<br/>
                第12列：二维码ID<br/>
                第13列：服务编号<br/>
                第14列：备注
              </div>
            </div>
          </div>
        </PCModal>
      </PCLayout>
    </>
  );
}
