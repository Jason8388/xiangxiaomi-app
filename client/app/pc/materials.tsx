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

interface Material {
  id: number;
  material_code: string;
  material_name: string;
  category: string;
  unit: string;
  stock: number;
  min_stock: number;
  price: number;
  supplier: string;
  status: 'normal' | 'low' | 'out';
}

const statusMap = {
  normal: { label: '正常', type: 'success' as const },
  low: { label: '库存不足', type: 'warning' as const },
  out: { label: '缺货', type: 'danger' as const },
};

export default function PCMaterials() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [formData, setFormData] = useState({ material_code: '', material_name: '', category: '', unit: '', stock: '', min_stock: '', price: '', supplier: '' });
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/v1/materials`);
      const data = await response.json();
      const list = Array.isArray(data) ? data : (data.materials || []);
      setMaterials(list);
      setPagination(prev => ({ ...prev, total: list.length }));
    } catch (error) {
      setMaterials([
        { id: 1, material_code: 'M-001', material_name: '变频器模块', category: '电子元器件', unit: '个', stock: 50, min_stock: 20, price: 1200, supplier: '深圳电子' },
        { id: 2, material_code: 'M-002', material_name: 'PLC控制器', category: '控制元件', unit: '台', stock: 8, min_stock: 10, price: 3500, supplier: '上海自动化' },
        { id: 3, material_code: 'M-003', material_name: '伺服电机', category: '电机类', unit: '台', stock: 0, min_stock: 5, price: 5800, supplier: '广州电机' },
      ]);
      setPagination(prev => ({ ...prev, total: 3 }));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMaterials(); }, [fetchMaterials]);

  const getStatus = (material: Material): 'normal' | 'low' | 'out' => {
    if (material.stock === 0) return 'out';
    if (material.stock < material.min_stock) return 'low';
    return 'normal';
  };

  const columns = [
    { key: 'material_code', title: '物料编码', width: 100 },
    { key: 'material_name', title: '物料名称', width: 150 },
    { key: 'category', title: '分类', width: 100 },
    { key: 'unit', title: '单位', width: 60 },
    { key: 'stock', title: '库存', width: 80, render: (val: number, record: Material) => (
      <span style={{ color: getStatus(record) === 'out' ? '#FF4D4F' : getStatus(record) === 'low' ? '#FAAD14' : '#52C41A', fontWeight: 600 }}>{val}</span>
    )},
    { key: 'min_stock', title: '最低库存', width: 80 },
    { key: 'price', title: '单价', width: 80, render: (val: number) => `¥${val.toFixed(2)}` },
    { key: 'supplier', title: '供应商', width: 120 },
    { key: 'status', title: '状态', width: 80, render: (_: any, record: Material) => { const { label, type } = statusMap[getStatus(record)]; return <PCTag type={type}>{label}</PCTag>; } },
    { key: 'actions', title: '操作', width: 140, render: (_: any, record: Material) => (
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="pc-btn pc-btn-text pc-btn-sm" onClick={() => { setEditingMaterial(record); setFormData({ ...record, stock: String(record.stock), min_stock: String(record.min_stock), price: String(record.price) }); setModalVisible(true); }}>编辑</button>
        <button className="pc-btn pc-btn-text pc-btn-sm" style={{ color: '#FF4D4F' }} onClick={() => { if (confirm('确定删除吗？')) setMaterials(prev => prev.filter(m => m.id !== record.id)); }}>删除</button>
      </div>
    ) },
  ];

  const filteredMaterials = materials.filter(m => {
    const matchSearch = !searchText || m.material_name.includes(searchText) || m.material_code.includes(searchText);
    const matchStatus = !statusFilter || getStatus(m) === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <>
      
      <PCLayout>
        <div className="pc-page-header"><h1 className="pc-page-title">物料管理</h1><p className="pc-page-description">管理物料库存，包括采购、入库、出库等</p></div>
        <PCCard>
          <PCToolbar left={<><PCSearchBar placeholder="搜索物料..." value={searchText} onChange={setSearchText} onSearch={() => {}} /><div style={{ display: 'flex', gap: 8 }}>{Object.entries(statusMap).map(([key, { label }]) => (<button key={key} className={`pc-btn pc-btn-sm ${statusFilter === key ? 'pc-btn-primary' : 'pc-btn-default'}`} onClick={() => setStatusFilter(statusFilter === key ? '' : key)}>{label}</button>))}</div></>} right={<button className="pc-btn pc-btn-primary" onClick={() => { setEditingMaterial(null); setFormData({ material_code: '', material_name: '', category: '', unit: '', stock: '', min_stock: '', price: '', supplier: '' }); setModalVisible(true); }}>+ 新增物料</button>} />
          <PCTable columns={columns} data={filteredMaterials} rowKey="id" loading={loading} selectedRowKeys={selectedRowKeys} onSelectChange={setSelectedRowKeys} />
          <PCPagination current={pagination.current} pageSize={pagination.pageSize} total={pagination.total} onChange={(page) => setPagination(prev => ({ ...prev, current: page }))} />
        </PCCard>
        <PCModal visible={modalVisible} title={editingMaterial ? '编辑物料' : '新增物料'} onClose={() => setModalVisible(false)} width={560} footer={<><button className="pc-btn pc-btn-default" onClick={() => setModalVisible(false)}>取消</button><button className="pc-btn pc-btn-primary" onClick={() => { const newMaterial = { ...formData, stock: Number(formData.stock), min_stock: Number(formData.min_stock), price: Number(formData.price) }; if (editingMaterial) { setMaterials(prev => prev.map(m => m.id === editingMaterial.id ? { ...m, ...newMaterial } : m)); } else { setMaterials(prev => [...prev, { id: Date.now(), ...newMaterial }]); setPagination(prev => ({ ...prev, total: prev.total + 1 })); } setModalVisible(false); }}>保存</button></>}>
          <div className="pc-form">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="pc-form-item"><label className="pc-form-label">物料编码</label><input type="text" className="pc-form-control" value={formData.material_code} onChange={e => setFormData(prev => ({ ...prev, material_code: e.target.value }))} /></div>
              <div className="pc-form-item"><label className="pc-form-label">物料名称</label><input type="text" className="pc-form-control" value={formData.material_name} onChange={e => setFormData(prev => ({ ...prev, material_name: e.target.value }))} /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="pc-form-item"><label className="pc-form-label">分类</label><input type="text" className="pc-form-control" value={formData.category} onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))} /></div>
              <div className="pc-form-item"><label className="pc-form-label">单位</label><input type="text" className="pc-form-control" value={formData.unit} onChange={e => setFormData(prev => ({ ...prev, unit: e.target.value }))} /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="pc-form-item"><label className="pc-form-label">库存</label><input type="number" className="pc-form-control" value={formData.stock} onChange={e => setFormData(prev => ({ ...prev, stock: e.target.value }))} /></div>
              <div className="pc-form-item"><label className="pc-form-label">最低库存</label><input type="number" className="pc-form-control" value={formData.min_stock} onChange={e => setFormData(prev => ({ ...prev, min_stock: e.target.value }))} /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="pc-form-item"><label className="pc-form-label">单价</label><input type="number" className="pc-form-control" value={formData.price} onChange={e => setFormData(prev => ({ ...prev, price: e.target.value }))} /></div>
              <div className="pc-form-item"><label className="pc-form-label">供应商</label><input type="text" className="pc-form-control" value={formData.supplier} onChange={e => setFormData(prev => ({ ...prev, supplier: e.target.value }))} /></div>
            </div>
          </div>
        </PCModal>
      </PCLayout>
    </>
  );
}
