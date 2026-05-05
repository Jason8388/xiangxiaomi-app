import React, { useState, useEffect, useCallback } from 'react';
import '@/assets/styles/pc-global.css';
import { PCLayout } from '@/components/pc/PCLayout';
import { PCCard, PCImportModal } from '@/components/pc/PCComponents';
import { FontAwesome6 } from '@expo/vector-icons';

import { storage } from '@/utils/storage';
import { getApiBaseUrl } from '@/utils/api';

const API_BASE = getApiBaseUrl();

interface Material {
  id: number;
  material_number: string;
  material_name: string;
  material_spec: string;
  material_unit: string;
  category?: string;
  stock_quantity: number;
  warning_stock?: number;
  supplier?: string;
  unit_price?: number;
  material_photo?: string;
  qr_code?: string;
  qr_code_id?: string;
  remarks?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export default function PCMaterials() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [formData, setFormData] = useState({
    material_number: '',
    material_name: '',
    material_spec: '',
    material_unit: '',
    category: '',
    stock_quantity: '',
    warning_stock: '',
    supplier: '',
    unit_price: '',
    qr_code_id: '',
    remarks: '',
    tags: [] as string[],
  });
  const [tempTags, setTempTags] = useState('');
  const [importModalVisible, setImportModalVisible] = useState(false);

  // 统计信息
  const totalMaterials = materials.length;
  const totalStock = materials.reduce((sum, m) => sum + (m.stock_quantity || 0), 0);
  const warningMaterials = materials.filter(m => m.warning_stock && m.stock_quantity < m.warning_stock).length;

  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    try {
      const sessionId = await storage.getItem('session_id');
      const response = await fetch(`${API_BASE}/api/v1/materials`, {
        headers: {
          'Authorization': `Bearer ${sessionId}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        // 字段兼容处理：后端返回的字段名可能与前端不一致
        const materials = Array.isArray(data) ? data : (data.data || []);
        setMaterials(materials.map((m: any) => ({
          id: m.id,
          material_number: m.code || m.material_number || '',
          material_name: m.name || m.material_name || '',
          material_spec: m.spec || m.material_spec || '',
          material_unit: m.unit || m.material_unit || '',
          category: m.category || '',
          stock_quantity: m.current_stock ?? m.stock_quantity ?? 0,
          warning_stock: m.min_stock ?? m.warning_stock ?? 0,
          supplier: m.supplier || '',
          unit_price: m.price ?? m.unit_price ?? 0,
          material_photo: m.photo || m.material_photo || '',
          qr_code: m.qr_code || '',
          qr_code_id: m.qr_code_id || m.qrcode_id || '',
          remarks: m.remarks || m.note || '',
          tags: m.tags || [],
        })));
      }
    } catch (error) {
      console.error('Failed to fetch materials:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  // 生成二维码ID
  const generateQRCodeId = () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const qrId = `M${timestamp}${random}`;
    setFormData({ ...formData, qr_code_id: qrId });
    alert(`二维码ID生成成功: ${qrId}`);
  };

  const handleAdd = () => {
    setEditingMaterial(null);
    // 自动生成二维码ID
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const qrId = `M${timestamp}${random}`;
    setFormData({
      material_number: '',
      material_name: '',
      material_spec: '',
      material_unit: '',
      category: '',
      stock_quantity: '',
      warning_stock: '',
      supplier: '',
      unit_price: '',
      qr_code_id: qrId,
      remarks: '',
      tags: [],
    });
    setTempTags('');
    setModalVisible(true);
  };

  const handleEdit = (material: Material) => {
    setEditingMaterial(material);
    setFormData({
      material_number: material.material_number || '',
      material_name: material.material_name || '',
      material_spec: material.material_spec || '',
      material_unit: material.material_unit || '',
      category: material.category || '',
      stock_quantity: material.stock_quantity?.toString() || '',
      warning_stock: material.warning_stock?.toString() || '',
      supplier: material.supplier || '',
      unit_price: material.unit_price?.toString() || '',
      qr_code_id: material.qr_code_id || '',
      remarks: material.remarks || '',
      tags: material.tags || [],
    });
    setTempTags(material.tags?.join(', ') || '');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.material_number || !formData.material_name || !formData.material_unit) {
      alert('物料编号、物料名称和计量单位不能为空');
      return;
    }

    try {
      const sessionId = await storage.getItem('session_id');
      const url = editingMaterial
        ? `${API_BASE}/api/v1/materials/${editingMaterial.id}`
        : `${API_BASE}/api/v1/materials`;

      // 处理标签
      const tagsArray = tempTags.split(',').map(t => t.trim()).filter(t => t);

      const payload = {
        code: formData.material_number,
        name: formData.material_name,
        spec: formData.material_spec,
        unit: formData.material_unit,
        category: formData.category,
        current_stock: formData.stock_quantity ? parseInt(formData.stock_quantity) : 0,
        min_stock: formData.warning_stock ? parseInt(formData.warning_stock) : 0,
        supplier: formData.supplier,
        price: formData.unit_price ? parseFloat(formData.unit_price) : null,
        qr_code_id: formData.qr_code_id,
        remarks: formData.remarks,
        tags: tagsArray,
      };

      const response = await fetch(url, {
        method: editingMaterial ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionId}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        alert(editingMaterial ? '修改成功' : '创建成功');
        setModalVisible(false);
        fetchMaterials();
      } else {
        alert('保存失败');
      }
    } catch (error) {
      console.error('Failed to save material:', error);
      alert('保存失败');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个物料吗？')) return;

    try {
      const sessionId = await storage.getItem('session_id');
      const response = await fetch(`${API_BASE}/api/v1/materials/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${sessionId}`,
        },
      });

      if (response.ok) {
        fetchMaterials();
      } else {
        alert('删除失败');
      }
    } catch (error) {
      console.error('Failed to delete material:', error);
      alert('删除失败');
    }
  };

  return (
    <PCLayout>
      <div className="pc-page-header">
        <div>
          <h1 className="pc-page-title">物料管理</h1>
          <p className="pc-page-description">管理物料信息</p>
        </div>
        <div>
          <button className="pc-btn pc-btn-default" onClick={() => setImportModalVisible(true)} style={{ marginRight: 8 }}>
            <FontAwesome6 name="upload" size={14} style={{ marginRight: 6 }} />
            批量导入
          </button>
          <button 
            className="pc-btn pc-btn-default" 
            style={{ marginRight: 8, background: '#E8F5E9', color: '#1E88E5', border: '1px solid #1E88E5' }} 
            onClick={() => window.open(`${API_BASE}/api/v1/materials/batch-export`, '_blank')}
          >
            <FontAwesome6 name="download" size={14} style={{ marginRight: 6 }} />
            批量导出
          </button>
          <button className="pc-btn pc-btn-primary" onClick={handleAdd}>
            <FontAwesome6 name="plus" size={14} style={{ marginRight: 6 }} />
            新增物料
          </button>
        </div>
      </div>

      {/* 统计信息 */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
        <div style={{ 
          flex: 1, 
          background: '#fff', 
          borderRadius: 12, 
          padding: 20,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          display: 'flex',
          alignItems: 'center',
          gap: 16
        }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: '#E3F2FD', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FontAwesome6 name="box" size={24} color="#1E88E5" />
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#212121' }}>{totalMaterials}</div>
            <div style={{ fontSize: 14, color: '#757575' }}>物料总数</div>
          </div>
        </div>
        <div style={{ 
          flex: 1, 
          background: '#fff', 
          borderRadius: 12, 
          padding: 20,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          display: 'flex',
          alignItems: 'center',
          gap: 16
        }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FontAwesome6 name="database" size={24} color="#2ECC71" />
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#212121' }}>{totalStock}</div>
            <div style={{ fontSize: 14, color: '#757575' }}>库存总量</div>
          </div>
        </div>
        <div style={{ 
          flex: 1, 
          background: '#fff', 
          borderRadius: 12, 
          padding: 20,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          cursor: 'pointer'
        }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: '#FFEBEE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FontAwesome6 name="triangle-exclamation" size={24} color="#E74C3C" />
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 700, color: warningMaterials > 0 ? '#E74C3C' : '#212121' }}>{warningMaterials}</div>
            <div style={{ fontSize: 14, color: '#757575' }}>预警物料</div>
          </div>
          <FontAwesome6 name="chevron-right" size={16} color="#95A5A6" style={{ marginLeft: 'auto' }} />
        </div>
      </div>

      <PCCard>
        {loading ? (
          <div className="pc-loading">加载中...</div>
        ) : materials.length === 0 ? (
          <div className="pc-empty">
            <FontAwesome6 name="boxes-stacked" size={48} color="#ccc" />
            <p>暂无物料数据</p>
            <button className="pc-btn pc-btn-primary" onClick={handleAdd}>新增物料</button>
          </div>
        ) : (
          <table className="pc-table">
            <thead>
              <tr>
                <th>物料编号</th>
                <th>物料名称</th>
                <th>规格型号</th>
                <th>计量单位</th>
                <th>分类</th>
                <th>库存</th>
                <th>预警库存</th>
                <th>单价(元)</th>
                <th>供应商</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {materials.map((material) => (
                <tr key={material.id}>
                  <td>{material.material_number || '-'}</td>
                  <td style={{ fontWeight: 500 }}>{material.material_name || '-'}</td>
                  <td>{material.material_spec || '-'}</td>
                  <td>{material.material_unit || '-'}</td>
                  <td>
                    {material.category ? (
                      <span style={{ 
                        display: 'inline-block',
                        padding: '2px 8px',
                        background: '#F5F5F5',
                        borderRadius: 4,
                        fontSize: 12,
                        color: '#666'
                      }}>
                        {material.category}
                      </span>
                    ) : '-'}
                  </td>
                  <td style={{ 
                    color: material.warning_stock && material.stock_quantity < material.warning_stock ? '#E74C3C' : '#212121',
                    fontWeight: material.warning_stock && material.stock_quantity < material.warning_stock ? 600 : 400
                  }}>
                    {material.stock_quantity ?? '-'}
                  </td>
                  <td>{material.warning_stock ?? '-'}</td>
                  <td>{material.unit_price ? `¥${material.unit_price.toFixed(2)}` : '-'}</td>
                  <td>{material.supplier || '-'}</td>
                  <td>
                    <button className="pc-btn pc-btn-text pc-btn-sm" onClick={() => handleEdit(material)}>
                      编辑
                    </button>
                    <button className="pc-btn pc-btn-text pc-btn-sm pc-btn-danger" onClick={() => handleDelete(material.id)}>
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </PCCard>

      {/* 新增/编辑弹窗 - 与APP端物料表单保持一致 */}
      {modalVisible && (
        <div className="pc-modal-overlay" onClick={() => setModalVisible(false)}>
          <div className="pc-modal" style={{ width: 700 }} onClick={(e) => e.stopPropagation()}>
            <div className="pc-modal-header">
              <h3>{editingMaterial ? '编辑物料' : '新增物料'}</h3>
              <button className="pc-modal-close" onClick={() => setModalVisible(false)}>×</button>
            </div>
            <div className="pc-modal-body" style={{ maxHeight: 500, overflowY: 'auto' }}>
              <div className="pc-form">
                {/* 基本信息区域 */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1E88E5', marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #E0E0E0' }}>
                    基本信息
                  </div>
                  
                  <div className="pc-form-item">
                    <label className="pc-form-label">物料编号 <span className="required">*</span></label>
                    <input
                      type="text"
                      className="pc-form-control"
                      value={formData.material_number}
                      onChange={(e) => setFormData({ ...formData, material_number: e.target.value })}
                      placeholder="请输入物料编号"
                    />
                  </div>

                  <div className="pc-form-row">
                    <div className="pc-form-item">
                      <label className="pc-form-label">物料名称 <span className="required">*</span></label>
                      <input
                        type="text"
                        className="pc-form-control"
                        value={formData.material_name}
                        onChange={(e) => setFormData({ ...formData, material_name: e.target.value })}
                        placeholder="请输入物料名称"
                      />
                    </div>
                    <div className="pc-form-item">
                      <label className="pc-form-label">规格型号</label>
                      <input
                        type="text"
                        className="pc-form-control"
                        value={formData.material_spec}
                        onChange={(e) => setFormData({ ...formData, material_spec: e.target.value })}
                        placeholder="请输入规格型号"
                      />
                    </div>
                  </div>

                  <div className="pc-form-row">
                    <div className="pc-form-item">
                      <label className="pc-form-label">计量单位 <span className="required">*</span></label>
                      <input
                        type="text"
                        className="pc-form-control"
                        value={formData.material_unit}
                        onChange={(e) => setFormData({ ...formData, material_unit: e.target.value })}
                        placeholder="如：个、台、套、米"
                      />
                    </div>
                    <div className="pc-form-item">
                      <label className="pc-form-label">分类</label>
                      <input
                        type="text"
                        className="pc-form-control"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        placeholder="请输入物料分类"
                      />
                    </div>
                  </div>
                </div>

                {/* 库存信息区域 */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#2ECC71', marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #E0E0E0' }}>
                    库存信息
                  </div>
                  
                  <div className="pc-form-row">
                    <div className="pc-form-item">
                      <label className="pc-form-label">库存数量</label>
                      <input
                        type="number"
                        className="pc-form-control"
                        value={formData.stock_quantity}
                        onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                        placeholder="当前库存数量"
                      />
                    </div>
                    <div className="pc-form-item">
                      <label className="pc-form-label">预警库存</label>
                      <input
                        type="number"
                        className="pc-form-control"
                        value={formData.warning_stock}
                        onChange={(e) => setFormData({ ...formData, warning_stock: e.target.value })}
                        placeholder="库存预警值"
                      />
                    </div>
                  </div>
                </div>

                {/* 采购信息区域 */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#FF9800', marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #E0E0E0' }}>
                    采购信息
                  </div>
                  
                  <div className="pc-form-row">
                    <div className="pc-form-item">
                      <label className="pc-form-label">单价(元)</label>
                      <input
                        type="number"
                        className="pc-form-control"
                        value={formData.unit_price}
                        onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                        placeholder="单价"
                      />
                    </div>
                    <div className="pc-form-item">
                      <label className="pc-form-label">供应商</label>
                      <input
                        type="text"
                        className="pc-form-control"
                        value={formData.supplier}
                        onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                        placeholder="供应商名称"
                      />
                    </div>
                  </div>
                </div>

                {/* 其他信息区域 */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#9C27B0', marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #E0E0E0' }}>
                    其他信息
                  </div>
                  
                  <div className="pc-form-item">
                    <label className="pc-form-label">二维码ID</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        type="text"
                        className="pc-form-control"
                        value={formData.qr_code_id}
                        onChange={(e) => setFormData({ ...formData, qr_code_id: e.target.value })}
                        placeholder="系统自动生成，也可手动输入"
                        style={{ flex: 1 }}
                      />
                      <button 
                        className="pc-btn pc-btn-default" 
                        onClick={generateQRCodeId}
                        style={{ whiteSpace: 'nowrap' }}
                      >
                        <FontAwesome6 name="qrcode" size={14} style={{ marginRight: 6 }} />
                        自动生成
                      </button>
                    </div>
                  </div>

                  <div className="pc-form-item">
                    <label className="pc-form-label">标签</label>
                    <input
                      type="text"
                      className="pc-form-control"
                      value={tempTags}
                      onChange={(e) => setTempTags(e.target.value)}
                      placeholder="多个标签用逗号分隔，如：备件,高价值,常用"
                    />
                    <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                      多个标签请用逗号分隔
                    </div>
                  </div>

                  <div className="pc-form-item">
                    <label className="pc-form-label">备注</label>
                    <textarea
                      className="pc-form-control"
                      rows={3}
                      value={formData.remarks}
                      onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                      placeholder="备注信息"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="pc-modal-footer">
              <button className="pc-btn pc-btn-default" onClick={() => setModalVisible(false)}>取消</button>
              <button className="pc-btn pc-btn-primary" onClick={handleSave}>保存</button>
            </div>
          </div>
        </div>
      )}
      
      <PCImportModal
        visible={importModalVisible}
        onClose={() => setImportModalVisible(false)}
        onSuccess={() => {
          setImportModalVisible(false);
          fetchMaterials();
        }}
        title="批量导入物料"
        apiPath="/api/v1/materials/batch"
        fields={[
          { key: 'material_name', label: '物料名称', required: true },
          { key: 'material_number', label: '物料编码' },
          { key: 'material_spec', label: '规格型号' },
          { key: 'material_unit', label: '计量单位' },
          { key: 'category', label: '分类' },
          { key: 'stock_quantity', label: '库存数量' },
          { key: 'warning_stock', label: '预警库存' },
          { key: 'unit_price', label: '单价' },
          { key: 'supplier', label: '供应商' },
          { key: 'remark', label: '备注' }
        ]}
      />
    </PCLayout>
  );
}
