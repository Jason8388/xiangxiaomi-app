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

interface ListPageProps {
  title: string;
  description: string;
  apiEndpoint: string;
  columns: any[];
  mockData?: any[];
  defaultFormData?: Record<string, any>;
}

export function createPCListPage({ title, description, apiEndpoint, columns, mockData = [], defaultFormData = {} }: ListPageProps) {
  return function PCListPage() {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
    const [searchText, setSearchText] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [formData, setFormData] = useState<Record<string, any>>(defaultFormData);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

    const fetchData = useCallback(async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE}/api/v1/${apiEndpoint}`);
        const result = await response.json();
        const list = Array.isArray(result) ? result : (result[apiEndpoint] || []);
        setData(list);
        setPagination(prev => ({ ...prev, total: list.length }));
      } catch (error) {
        setData(mockData);
        setPagination(prev => ({ ...prev, total: mockData.length }));
      } finally {
        setLoading(false);
      }
    }, [apiEndpoint, mockData]);

    useEffect(() => {
      fetchData();
    }, [fetchData]);

    const handleSearch = () => {
      const filtered = data.filter(item =>
        JSON.stringify(item).includes(searchText)
      );
      setPagination(prev => ({ ...prev, total: filtered.length }));
    };

    const handleAdd = () => {
      setEditingItem(null);
      setFormData(defaultFormData);
      setModalVisible(true);
    };

    const handleEdit = (item: any) => {
      setEditingItem(item);
      setFormData({ ...item });
      setModalVisible(true);
    };

    const handleDelete = async (item: any) => {
      if (!confirm(`确定删除吗？`)) return;
      setData(prev => prev.filter(d => d.id !== item.id));
      setPagination(prev => ({ ...prev, total: prev.total - 1 }));
    };

    const handleSave = () => {
      if (editingItem) {
        setData(prev => prev.map(d => d.id === editingItem.id ? { ...d, ...formData } : d));
      } else {
        const newItem = { id: Date.now(), ...formData };
        setData(prev => [...prev, newItem]);
        setPagination(prev => ({ ...prev, total: prev.total + 1 }));
      }
      setModalVisible(false);
    };

    return (
      <>
        <style>{`<style>@import url('/assets/styles/pc-global.css');</style>`}</style>
        <PCLayout>
          <div className="pc-page-header">
            <h1 className="pc-page-title">{title}</h1>
            <p className="pc-page-description">{description}</p>
          </div>

          <PCCard>
            <PCToolbar
              left={
                <PCSearchBar
                  placeholder={`搜索${title}...`}
                  value={searchText}
                  onChange={setSearchText}
                  onSearch={handleSearch}
                />
              }
              right={
                <div style={{ display: 'flex', gap: 8 }}>
                  {selectedRowKeys.length > 0 && (
                    <button className="pc-btn pc-btn-danger" onClick={() => {
                      setData(prev => prev.filter(d => !selectedRowKeys.includes(String(d.id))));
                      setSelectedRowKeys([]);
                    }}>
                      批量删除 ({selectedRowKeys.length})
                    </button>
                  )}
                  <button className="pc-btn pc-btn-primary" onClick={handleAdd}>
                    + 新增
                  </button>
                </div>
              }
            />

            <PCTable
              columns={columns}
              data={data}
              rowKey="id"
              loading={loading}
              selectedRowKeys={selectedRowKeys}
              onSelectChange={setSelectedRowKeys}
            />

            <PCPagination
              current={pagination.current}
              pageSize={pagination.pageSize}
              total={pagination.total}
              onChange={(page) => setPagination(prev => ({ ...prev, current: page }))}
            />
          </PCCard>
        </PCLayout>
      </>
    );
  };
}
