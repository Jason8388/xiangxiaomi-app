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

interface Device {
  id: number;
  device_id: string;
  device_name: string;
  model: string;
  customer_name: string;
  location: string;
  status: 'online' | 'offline' | 'warning';
  last_maintenance: string;
}

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
  const [modalVisible, setModalVisible] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [formData, setFormData] = useState({
    device_id: '',
    device_name: '',
    model: '',
    customer_name: '',
    location: '',
    status: 'online' as const,
  });
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  const fetchDevices = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/v1/devices`);
      const data = await response.json();
      const list = Array.isArray(data) ? data : (data.devices || []);
      setDevices(list);
      setPagination(prev => ({ ...prev, total: list.length }));
    } catch (error) {
      setDevices([
        { id: 1, device_id: 'A-001', device_name: '变频器控制器', model: 'VFD-5000', customer_name: '北京科技', location: '1号车间', status: 'online', last_maintenance: '2024-03-15' },
        { id: 2, device_id: 'A-002', device_name: 'PLC控制柜', model: 'S7-1200', customer_name: '上海网络', location: '2号车间', status: 'warning', last_maintenance: '2024-02-28' },
        { id: 3, device_id: 'B-001', device_name: '伺服驱动器', model: 'MR-J4', customer_name: '广州智能', location: '3号车间', status: 'offline', last_maintenance: '2024-01-20' },
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
    const filtered = devices.filter(d =>
      d.device_name.includes(searchText) || d.device_id.includes(searchText)
    );
    setPagination(prev => ({ ...prev, total: filtered.length }));
  };

  const handleAdd = () => {
    setEditingDevice(null);
    setFormData({ device_id: '', device_name: '', model: '', customer_name: '', location: '', status: 'online' });
    setModalVisible(true);
  };

  const handleEdit = (device: Device) => {
    setEditingDevice(device);
    setFormData({ ...device });
    setModalVisible(true);
  };

  const handleDelete = async (device: Device) => {
    if (!confirm(`确定删除设备"${device.device_name}"吗？`)) return;
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

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status === statusFilter ? '' : status);
  };

  const filteredDevices = devices.filter(d => {
    const matchSearch = !searchText || d.device_name.includes(searchText) || d.device_id.includes(searchText);
    const matchStatus = !statusFilter || d.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const columns = [
    { key: 'device_id', title: '设备编号', width: 100 },
    { key: 'device_name', title: '设备名称', width: 150 },
    { key: 'model', title: '型号', width: 120 },
    { key: 'customer_name', title: '所属客户', width: 120 },
    { key: 'location', title: '安装位置', width: 100 },
    {
      key: 'status',
      title: '状态',
      width: 80,
      render: (val: keyof typeof statusMap) => {
        const { label, type } = statusMap[val];
        return <PCTag type={type}>{label}</PCTag>;
      },
    },
    { key: 'last_maintenance', title: '最近维护', width: 100 },
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
          <p className="pc-page-description">管理所有设备信息，监控设备状态</p>
        </div>

        <PCCard>
          <PCToolbar
            left={
              <>
                <PCSearchBar
                  placeholder="搜索设备名称或编号..."
                  value={searchText}
                  onChange={setSearchText}
                  onSearch={handleSearch}
                />
                <div style={{ display: 'flex', gap: 8 }}>
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
          footer={
            <>
              <button className="pc-btn pc-btn-default" onClick={() => setModalVisible(false)}>取消</button>
              <button className="pc-btn pc-btn-primary" onClick={() => {
                if (editingDevice) {
                  setDevices(prev => prev.map(d => d.id === editingDevice.id ? { ...d, ...formData } : d));
                } else {
                  setDevices(prev => [...prev, { id: Date.now(), ...formData, last_maintenance: new Date().toISOString().split('T')[0] }]);
                  setPagination(prev => ({ ...prev, total: prev.total + 1 }));
                }
                setModalVisible(false);
              }}>保存</button>
            </>
          }
        >
          <div className="pc-form">
            <div className="pc-form-item">
              <label className="pc-form-label required">设备编号</label>
              <input type="text" className="pc-form-control" value={formData.device_id}
                onChange={e => setFormData(prev => ({ ...prev, device_id: e.target.value }))} />
            </div>
            <div className="pc-form-item">
              <label className="pc-form-label required">设备名称</label>
              <input type="text" className="pc-form-control" value={formData.device_name}
                onChange={e => setFormData(prev => ({ ...prev, device_name: e.target.value }))} />
            </div>
            <div className="pc-form-item">
              <label className="pc-form-label">型号</label>
              <input type="text" className="pc-form-control" value={formData.model}
                onChange={e => setFormData(prev => ({ ...prev, model: e.target.value }))} />
            </div>
            <div className="pc-form-item">
              <label className="pc-form-label">所属客户</label>
              <input type="text" className="pc-form-control" value={formData.customer_name}
                onChange={e => setFormData(prev => ({ ...prev, customer_name: e.target.value }))} />
            </div>
            <div className="pc-form-item">
              <label className="pc-form-label">安装位置</label>
              <input type="text" className="pc-form-control" value={formData.location}
                onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))} />
            </div>
          </div>
        </PCModal>
      </PCLayout>
    </>
  );
}
