import React, { useState, useEffect, useCallback } from 'react';
import '@/assets/styles/pc-global.css';
import { PCLayout } from '@/components/pc/PCLayout';
import { PCCard } from '@/components/pc/PCComponents';
import { FontAwesome6 } from '@expo/vector-icons';

import { getApiBaseUrl } from '@/utils/api';
const API_BASE = getApiBaseUrl();

interface Warehouse {
  id: number;
  name: string;
  location?: string;
  area?: string;
  capacity?: string;
  manager?: string;
  phone?: string;
  description?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export default function PCWarehouses() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    area: '',
    capacity: '',
    manager: '',
    phone: '',
    description: '',
    status: '正常',
  });

  const fetchWarehouses = useCallback(async () => {
    setLoading(true);
    try {
      const sessionId = localStorage.getItem('session_id');
      const response = await fetch(`${API_BASE}/api/v1/warehouses`, {
        headers: {
          'Authorization': `Bearer ${sessionId}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setWarehouses(Array.isArray(data) ? data : (data.warehouses || []));
      }
    } catch (error) {
      console.error('Failed to fetch warehouses:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWarehouses();
  }, [fetchWarehouses]);

  const handleAdd = () => {
    setEditingWarehouse(null);
    setFormData({
      name: '',
      location: '',
      area: '',
      capacity: '',
      manager: '',
      phone: '',
      description: '',
      status: '正常',
    });
    setModalVisible(true);
  };

  const handleEdit = (warehouse: Warehouse) => {
    setEditingWarehouse(warehouse);
    setFormData({
      name: warehouse.name || '',
      location: warehouse.location || '',
      area: warehouse.area || '',
      capacity: warehouse.capacity || '',
      manager: warehouse.manager || '',
      phone: warehouse.phone || '',
      description: warehouse.description || '',
      status: warehouse.status || '正常',
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('请输入仓库名称');
      return;
    }

    try {
      const sessionId = localStorage.getItem('session_id');
      const url = editingWarehouse
        ? `${API_BASE}/api/v1/warehouses/${editingWarehouse.id}`
        : `${API_BASE}/api/v1/warehouses`;
      
      const response = await fetch(url, {
        method: editingWarehouse ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionId}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setModalVisible(false);
        fetchWarehouses();
      } else {
        alert('保存失败');
      }
    } catch (error) {
      console.error('Failed to save warehouse:', error);
      alert('保存失败');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个仓库吗？')) return;

    try {
      const sessionId = localStorage.getItem('session_id');
      const response = await fetch(`${API_BASE}/api/v1/warehouses/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${sessionId}`,
        },
      });

      if (response.ok) {
        fetchWarehouses();
      } else {
        alert('删除失败');
      }
    } catch (error) {
      console.error('Failed to delete warehouse:', error);
      alert('删除失败');
    }
  };

  return (
    <PCLayout>
      <div className="pc-page-header">
        <div>
          <h1 className="pc-page-title">仓库管理</h1>
          <p className="pc-page-description">管理仓库库位信息</p>
        </div>
        <button className="pc-btn pc-btn-primary" onClick={handleAdd}>
          <FontAwesome6 name="plus" size={14} style={{ marginRight: 6 }} />
          新增仓库
        </button>
      </div>

      <PCCard>
        {loading ? (
          <div className="pc-loading">加载中...</div>
        ) : warehouses.length === 0 ? (
          <div className="pc-empty">
            <FontAwesome6 name="warehouse" size={48} color="#ccc" />
            <p>暂无仓库数据</p>
            <button className="pc-btn pc-btn-primary" onClick={handleAdd}>新增仓库</button>
          </div>
        ) : (
          <table className="pc-table">
            <thead>
              <tr>
                <th>仓库名称</th>
                <th>位置</th>
                <th>面积(㎡)</th>
                <th>库位容量</th>
                <th>管理员</th>
                <th>联系电话</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {warehouses.map((warehouse) => (
                <tr key={warehouse.id}>
                  <td>{warehouse.name}</td>
                  <td>{warehouse.location || '-'}</td>
                  <td>{warehouse.area || '-'}</td>
                  <td>{warehouse.capacity || '-'}</td>
                  <td>{warehouse.manager || '-'}</td>
                  <td>{warehouse.phone || '-'}</td>
                  <td>
                    <span className={`pc-tag pc-tag-${warehouse.status === '正常' ? 'success' : 'warning'}`}>
                      {warehouse.status || '正常'}
                    </span>
                  </td>
                  <td>
                    <button className="pc-btn pc-btn-text pc-btn-sm" onClick={() => handleEdit(warehouse)}>
                      编辑
                    </button>
                    <button className="pc-btn pc-btn-text pc-btn-sm pc-btn-danger" onClick={() => handleDelete(warehouse.id)}>
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
              <h3>{editingWarehouse ? '编辑仓库' : '新增仓库'}</h3>
              <button className="pc-modal-close" onClick={() => setModalVisible(false)}>×</button>
            </div>
            <div className="pc-modal-body">
              <div className="pc-form">
                <div className="pc-form-item">
                  <label className="pc-form-label">仓库名称 <span className="required">*</span></label>
                  <input
                    type="text"
                    className="pc-form-control"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="请输入仓库名称"
                  />
                </div>
                <div className="pc-form-row">
                  <div className="pc-form-item">
                    <label className="pc-form-label">位置</label>
                    <input
                      type="text"
                      className="pc-form-control"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="仓库位置"
                    />
                  </div>
                  <div className="pc-form-item">
                    <label className="pc-form-label">面积(㎡)</label>
                    <input
                      type="text"
                      className="pc-form-control"
                      value={formData.area}
                      onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                      placeholder="仓库面积"
                    />
                  </div>
                </div>
                <div className="pc-form-row">
                  <div className="pc-form-item">
                    <label className="pc-form-label">库位容量</label>
                    <input
                      type="text"
                      className="pc-form-control"
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                      placeholder="最大库位数"
                    />
                  </div>
                  <div className="pc-form-item">
                    <label className="pc-form-label">管理员</label>
                    <input
                      type="text"
                      className="pc-form-control"
                      value={formData.manager}
                      onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                      placeholder="管理员姓名"
                    />
                  </div>
                </div>
                <div className="pc-form-row">
                  <div className="pc-form-item">
                    <label className="pc-form-label">联系电话</label>
                    <input
                      type="text"
                      className="pc-form-control"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="联系电话"
                    />
                  </div>
                  <div className="pc-form-item">
                    <label className="pc-form-label">状态</label>
                    <select
                      className="pc-form-control"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="正常">正常</option>
                      <option value="停用">停用</option>
                      <option value="装修中">装修中</option>
                    </select>
                  </div>
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
    </PCLayout>
  );
}
