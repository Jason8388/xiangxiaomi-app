import React, { useState, useEffect, useCallback } from 'react';
import '@/assets/styles/pc-global.css';
import { PCLayout } from '@/components/pc/PCLayout';
import { PCCard, PCImportModal } from '@/components/pc/PCComponents';
import { FontAwesome6 } from '@expo/vector-icons';

import { getApiBaseUrl } from '@/utils/api';
const API_BASE = getApiBaseUrl();

interface Material {
  id: number;
  name: string;
  code?: string;
  category?: string;
  unit?: string;
  specification?: string;
  supplier?: string;
  price?: number;
  stock?: number;
  min_stock?: number;
  location?: string;
  description?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export default function PCMaterials() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category: '',
    unit: '',
    specification: '',
    supplier: '',
    price: '',
    stock: '',
    min_stock: '',
    location: '',
    description: '',
    status: '正常',
  });
  const [importModalVisible, setImportModalVisible] = useState(false);

  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    try {
      const sessionId = localStorage.getItem('session_id');
      const response = await fetch(`${API_BASE}/api/v1/materials`, {
        headers: {
          'Authorization': `Bearer ${sessionId}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setMaterials(Array.isArray(data) ? data : (data.materials || []));
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

  const handleAdd = () => {
    setEditingMaterial(null);
    setFormData({
      name: '',
      code: '',
      category: '',
      unit: '',
      specification: '',
      supplier: '',
      price: '',
      stock: '',
      min_stock: '',
      location: '',
      description: '',
      status: '正常',
    });
    setModalVisible(true);
  };

  const handleEdit = (material: Material) => {
    setEditingMaterial(material);
    setFormData({
      name: material.name || '',
      code: material.code || '',
      category: material.category || '',
      unit: material.unit || '',
      specification: material.specification || '',
      supplier: material.supplier || '',
      price: material.price?.toString() || '',
      stock: material.stock?.toString() || '',
      min_stock: material.min_stock?.toString() || '',
      location: material.location || '',
      description: material.description || '',
      status: material.status || '正常',
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('请输入物料名称');
      return;
    }

    try {
      const sessionId = localStorage.getItem('session_id');
      const url = editingMaterial
        ? `${API_BASE}/api/v1/materials/${editingMaterial.id}`
        : `${API_BASE}/api/v1/materials`;
      
      const response = await fetch(url, {
        method: editingMaterial ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionId}`,
        },
        body: JSON.stringify({
          ...formData,
          price: formData.price ? parseFloat(formData.price) : undefined,
          stock: formData.stock ? parseInt(formData.stock) : undefined,
          min_stock: formData.min_stock ? parseInt(formData.min_stock) : undefined,
        }),
      });

      if (response.ok) {
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
      const sessionId = localStorage.getItem('session_id');
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
          <button className="pc-btn pc-btn-default" style={{ marginRight: 8, background: '#E8F5E9', color: '#1E88E5', border: '1px solid #1E88E5' }} onClick={() => window.open(`${API_BASE}/api/v1/materials/batch-export`, '_blank')}>
            <FontAwesome6 name="download" size={14} style={{ marginRight: 6 }} />
            批量导出
          </button>
          <button className="pc-btn pc-btn-primary" onClick={handleAdd}>
          <FontAwesome6 name="plus" size={14} style={{ marginRight: 6 }} />
          新增物料
        </button>
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
                <th>物料名称</th>
                <th>物料编码</th>
                <th>规格型号</th>
                <th>单位</th>
                <th>分类</th>
                <th>库存</th>
                <th>单价(元)</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {materials.map((material) => (
                <tr key={material.id}>
                  <td>{material.name}</td>
                  <td>{material.code || '-'}</td>
                  <td>{material.specification || '-'}</td>
                  <td>{material.unit || '-'}</td>
                  <td>{material.category || '-'}</td>
                  <td>{material.stock ?? '-'}</td>
                  <td>{material.price ? `¥${material.price.toFixed(2)}` : '-'}</td>
                  <td>
                    <span className={`pc-tag pc-tag-${material.status === '正常' ? 'success' : 'warning'}`}>
                      {material.status || '正常'}
                    </span>
                  </td>
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

      {/* 新增/编辑弹窗 */}
      {modalVisible && (
        <div className="pc-modal-overlay" onClick={() => setModalVisible(false)}>
          <div className="pc-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pc-modal-header">
              <h3>{editingMaterial ? '编辑物料' : '新增物料'}</h3>
              <button className="pc-modal-close" onClick={() => setModalVisible(false)}>×</button>
            </div>
            <div className="pc-modal-body">
              <div className="pc-form">
                <div className="pc-form-item">
                  <label className="pc-form-label">物料名称 <span className="required">*</span></label>
                  <input
                    type="text"
                    className="pc-form-control"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="请输入物料名称"
                  />
                </div>
                <div className="pc-form-row">
                  <div className="pc-form-item">
                    <label className="pc-form-label">物料编码</label>
                    <input
                      type="text"
                      className="pc-form-control"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      placeholder="物料编码"
                    />
                  </div>
                  <div className="pc-form-item">
                    <label className="pc-form-label">分类</label>
                    <input
                      type="text"
                      className="pc-form-control"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="物料分类"
                    />
                  </div>
                </div>
                <div className="pc-form-row">
                  <div className="pc-form-item">
                    <label className="pc-form-label">规格型号</label>
                    <input
                      type="text"
                      className="pc-form-control"
                      value={formData.specification}
                      onChange={(e) => setFormData({ ...formData, specification: e.target.value })}
                      placeholder="规格型号"
                    />
                  </div>
                  <div className="pc-form-item">
                    <label className="pc-form-label">单位</label>
                    <input
                      type="text"
                      className="pc-form-control"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      placeholder="单位"
                    />
                  </div>
                </div>
                <div className="pc-form-row">
                  <div className="pc-form-item">
                    <label className="pc-form-label">库存数量</label>
                    <input
                      type="number"
                      className="pc-form-control"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                      placeholder="库存数量"
                    />
                  </div>
                  <div className="pc-form-item">
                    <label className="pc-form-label">最低库存</label>
                    <input
                      type="number"
                      className="pc-form-control"
                      value={formData.min_stock}
                      onChange={(e) => setFormData({ ...formData, min_stock: e.target.value })}
                      placeholder="最低库存"
                    />
                  </div>
                </div>
                <div className="pc-form-row">
                  <div className="pc-form-item">
                    <label className="pc-form-label">单价(元)</label>
                    <input
                      type="number"
                      className="pc-form-control"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
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
                      placeholder="供应商"
                    />
                  </div>
                </div>
                <div className="pc-form-item">
                  <label className="pc-form-label">存放位置</label>
                  <input
                    type="text"
                    className="pc-form-control"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="存放位置"
                  />
                </div>
                <div className="pc-form-item">
                  <label className="pc-form-label">备注</label>
                  <textarea
                    className="pc-form-control"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="备注信息"
                  />
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
          { key: 'material_code', label: '物料编码' },
          { key: 'specification', label: '规格型号' },
          { key: 'unit', label: '单位' },
          { key: 'category', label: '分类' },
          { key: 'stock_quantity', label: '库存数量' },
          { key: 'min_stock', label: '最低库存' },
          { key: 'unit_price', label: '单价' },
          { key: 'supplier', label: '供应商' },
          { key: 'location', label: '存放位置' },
          { key: 'remark', label: '备注' }
        ]}
      />
    </PCLayout>
  );
}
