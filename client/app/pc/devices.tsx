import React, { useState, useEffect, useCallback } from 'react';
import { PCLayout } from '@/components/pc/PCLayout';
import { PCCard } from '@/components/pc/PCComponents';
import { FontAwesome6 } from '@expo/vector-icons';
import { getApiBaseUrl } from '@/utils/api';
import { SafeAreaView, Platform, TouchableOpacity, ScrollView, Modal, Text, TextInput, View, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';

const API_BASE = getApiBaseUrl();

interface Device {
  id: number;
  device_name: string;
  device_type: string;
  model?: string;
  serial_number?: string;
  customer_id?: number;
  customer_name?: string;
  contract_id?: number;
  contract_name?: string;
  installation_date?: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}

interface Customer {
  id: number;
  name: string;
}

interface Contract {
  id: number;
  contract_name: string;
}

export default function PCDevices() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [filteredDevices, setFilteredDevices] = useState<Device[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [showContractPicker, setShowContractPicker] = useState(false);

  const [formData, setFormData] = useState({
    device_name: '',
    device_type: '',
    model: '',
    serial_number: '',
    customer_id: '',
    customer_name: '',
    contract_id: '',
    contract_name: '',
    installation_date: '',
    status: '在用',
  });

  const deviceTypes = ['工业设备', '医疗设备', '办公设备', '安防设备', '网络设备', '其他'];
  const statusOptions = ['在用', '闲置', '维修中', '已报废'];

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [devicesRes, customersRes, contractsRes] = await Promise.all([
        fetch(`${API_BASE}/api/v1/devices`),
        fetch(`${API_BASE}/api/v1/customers`),
        fetch(`${API_BASE}/api/v1/contracts`),
      ]);

      const [devicesData, customersData, contractsData] = await Promise.all([
        devicesRes.json().catch(() => ({ data: [] })),
        customersRes.json().catch(() => ({ data: [] })),
        contractsRes.json().catch(() => ({ data: [] })),
      ]);

      const deviceList = devicesData.data || [];
      setDevices(deviceList);
      setFilteredDevices(deviceList);
      setCustomers(customersData.data || []);
      setContracts(contractsData.data || []);
    } catch (error) {
      console.error('获取数据失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  useEffect(() => {
    let filtered = [...devices];
    
    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase();
      filtered = filtered.filter(d =>
        (d.device_name?.toLowerCase().includes(keyword)) ||
        (d.model?.toLowerCase().includes(keyword)) ||
        (d.serial_number?.toLowerCase().includes(keyword)) ||
        (d.customer_name?.toLowerCase().includes(keyword))
      );
    }
    
    if (filterType) {
      filtered = filtered.filter(d => d.device_type === filterType);
    }
    
    setFilteredDevices(filtered);
  }, [searchKeyword, filterType, devices]);

  const handleAdd = () => {
    setEditingDevice(null);
    setFormData({
      device_name: '',
      device_type: '',
      model: '',
      serial_number: '',
      customer_id: '',
      customer_name: '',
      contract_id: '',
      contract_name: '',
      installation_date: '',
      status: '在用',
    });
    setShowModal(true);
  };

  const handleEdit = (device: Device) => {
    setEditingDevice(device);
    setFormData({
      device_name: device.device_name || '',
      device_type: device.device_type || '',
      model: device.model || '',
      serial_number: device.serial_number || '',
      customer_id: device.customer_id?.toString() || '',
      customer_name: device.customer_name || '',
      contract_id: device.contract_id?.toString() || '',
      contract_name: device.contract_name || '',
      installation_date: device.installation_date || '',
      status: device.status || '在用',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.device_name) {
      alert('请输入设备名称');
      return;
    }

    try {
      const url = editingDevice
        ? `${API_BASE}/api/v1/devices/${editingDevice.id}`
        : `${API_BASE}/api/v1/devices`;
      
      const method = editingDevice ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowModal(false);
        fetchData();
      } else {
        const data = await response.json();
        alert(data.error || '保存失败');
      }
    } catch (error) {
      console.error('保存失败:', error);
      alert('保存失败');
    }
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;

    try {
      const response = await fetch(`${API_BASE}/api/v1/devices/${deletingId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setShowDeleteConfirm(false);
        setDeletingId(null);
        fetchData();
      } else {
        const data = await response.json();
        alert(data.error || '删除失败');
      }
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败');
    }
  };

  const selectCustomer = (customer: Customer) => {
    setFormData(prev => ({
      ...prev,
      customer_id: customer.id.toString(),
      customer_name: customer.name,
    }));
    setShowCustomerPicker(false);
  };

  const selectContract = (contract: Contract) => {
    setFormData(prev => ({
      ...prev,
      contract_id: contract.id.toString(),
      contract_name: contract.contract_name,
    }));
    setShowContractPicker(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case '在用': return '#52c41a';
      case '闲置': return '#faad14';
      case '维修中': return '#1890ff';
      case '已报废': return '#ff4d4f';
      default: return '#999';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case '工业设备': return 'industry';
      case '医疗设备': return 'heart-pulse';
      case '办公设备': return 'desktop';
      case '安防设备': return 'shield';
      case '网络设备': return 'wifi';
      default: return 'microchip';
    }
  };

  return (
    <PCLayout activePath="/pc/devices">
      <div style={styles.container}>
        <div style={styles.header}>
          <div style={styles.titleSection}>
            <FontAwesome6 name="microchip" size={24} color="#4F8EF7" />
            <h1 style={styles.title}>设备管理</h1>
          </div>
          <div style={styles.headerActions}>
            <button style={styles.addButton} onClick={handleAdd}>
              <FontAwesome6 name="plus" size={16} color="#fff" />
              <span>新增设备</span>
            </button>
          </div>
        </div>

        <div style={styles.toolbar}>
          <div style={styles.searchBox}>
            <FontAwesome6 name="search" size={16} color="#999" />
            <input
              type="text"
              placeholder="搜索设备名称、型号、编号..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              style={styles.searchInput}
            />
          </div>
          <div style={styles.filterGroup}>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={styles.filterSelect}
            >
              <option value="">全部类型</option>
              {deviceTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div style={styles.stats}>
            <span>共 {filteredDevices.length} 台设备</span>
          </div>
        </div>

        {loading ? (
          <div style={styles.loading}>
            <div style={styles.spinner}></div>
            <span>加载中...</span>
          </div>
        ) : filteredDevices.length === 0 ? (
          <div style={styles.empty}>
            <FontAwesome6 name="microchip" size={48} color="#ccc" />
            <p>暂无设备数据</p>
            <button style={styles.addButton} onClick={handleAdd}>新增第一台设备</button>
          </div>
        ) : (
          <div style={styles.grid}>
            {filteredDevices.map(device => (
              <div key={device.id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <div style={styles.cardIcon}>
                    <FontAwesome6 name={getTypeIcon(device.device_type) as any} size={20} color="#4F8EF7" />
                  </div>
                  <div style={styles.cardTitle}>
                    <h3>{device.device_name}</h3>
                    <span style={styles.deviceType}>{device.device_type || '未分类'}</span>
                  </div>
                  <span 
                    style={{...styles.statusBadge, backgroundColor: getStatusColor(device.status) + '20', color: getStatusColor(device.status)}}
                  >
                    {device.status || '在用'}
                  </span>
                </div>
                <div style={styles.cardBody}>
                  {device.model && (
                    <div style={styles.infoRow}>
                      <FontAwesome6 name="tag" size={14} color="#999" />
                      <span>{device.model}</span>
                    </div>
                  )}
                  {device.serial_number && (
                    <div style={styles.infoRow}>
                      <FontAwesome6 name="barcode" size={14} color="#999" />
                      <span>{device.serial_number}</span>
                    </div>
                  )}
                  {device.customer_name && (
                    <div style={styles.infoRow}>
                      <FontAwesome6 name="building" size={14} color="#999" />
                      <span>{device.customer_name}</span>
                    </div>
                  )}
                  {device.installation_date && (
                    <div style={styles.infoRow}>
                      <FontAwesome6 name="calendar" size={14} color="#999" />
                      <span>{device.installation_date}</span>
                    </div>
                  )}
                </div>
                <div style={styles.cardFooter}>
                  <button style={styles.editBtn} onClick={() => handleEdit(device)}>
                    <FontAwesome6 name="edit" size={14} color="#4F8EF7" />
                    <span>编辑</span>
                  </button>
                  <button style={styles.deleteBtn} onClick={() => handleDelete(device.id)}>
                    <FontAwesome6 name="trash" size={14} color="#ff4d4f" />
                    <span>删除</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Modal visible={showModal} animationType="slide" transparent>
          <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
              <div style={styles.modalHeader}>
                <h2>{editingDevice ? '编辑设备' : '新增设备'}</h2>
                <button style={styles.closeBtn} onClick={() => setShowModal(false)}>×</button>
              </div>
              <div style={styles.modalBody}>
                <div style={styles.formRow}>
                  <label style={styles.label}>设备名称 *</label>
                  <input
                    type="text"
                    value={formData.device_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, device_name: e.target.value }))}
                    style={styles.input}
                    placeholder="请输入设备名称"
                  />
                </div>
                <div style={styles.formRow}>
                  <label style={styles.label}>设备类型</label>
                  <select
                    value={formData.device_type}
                    onChange={(e) => setFormData(prev => ({ ...prev, device_type: e.target.value }))}
                    style={styles.select}
                  >
                    <option value="">请选择类型</option>
                    {deviceTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div style={styles.formRow}>
                  <label style={styles.label}>型号</label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                    style={styles.input}
                    placeholder="请输入型号"
                  />
                </div>
                <div style={styles.formRow}>
                  <label style={styles.label}>序列号</label>
                  <input
                    type="text"
                    value={formData.serial_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, serial_number: e.target.value }))}
                    style={styles.input}
                    placeholder="请输入序列号"
                  />
                </div>
                <div style={styles.formRow}>
                  <label style={styles.label}>客户</label>
                  <div style={styles.pickerWrapper}>
                    <input
                      type="text"
                      value={formData.customer_name}
                      readOnly
                      style={styles.input}
                      placeholder="选择客户"
                    />
                    <button style={styles.pickerBtn} onClick={() => setShowCustomerPicker(true)}>选择</button>
                  </div>
                </div>
                <div style={styles.formRow}>
                  <label style={styles.label}>关联合同</label>
                  <div style={styles.pickerWrapper}>
                    <input
                      type="text"
                      value={formData.contract_name}
                      readOnly
                      style={styles.input}
                      placeholder="选择合同"
                    />
                    <button style={styles.pickerBtn} onClick={() => setShowContractPicker(true)}>选择</button>
                  </div>
                </div>
                <div style={styles.formRow}>
                  <label style={styles.label}>安装日期</label>
                  <input
                    type="date"
                    value={formData.installation_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, installation_date: e.target.value }))}
                    style={styles.input}
                  />
                </div>
                <div style={styles.formRow}>
                  <label style={styles.label}>状态</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                    style={styles.select}
                  >
                    {statusOptions.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={styles.modalFooter}>
                <button style={styles.cancelBtn} onClick={() => setShowModal(false)}>取消</button>
                <button style={styles.saveBtn} onClick={handleSave}>保存</button>
              </div>
            </div>
          </div>
        </Modal>

        <Modal visible={showCustomerPicker} animationType="slide" transparent>
          <div style={styles.modalOverlay}>
            <div style={styles.pickerModal}>
              <div style={styles.modalHeader}>
                <h2>选择客户</h2>
                <button style={styles.closeBtn} onClick={() => setShowCustomerPicker(false)}>×</button>
              </div>
              <div style={styles.pickerList}>
                {customers.map(customer => (
                  <div
                    key={customer.id}
                    style={styles.pickerItem}
                    onClick={() => selectCustomer(customer)}
                  >
                    <FontAwesome6 name="user" size={16} color="#4F8EF7" />
                    <span>{customer.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>

        <Modal visible={showContractPicker} animationType="slide" transparent>
          <div style={styles.modalOverlay}>
            <div style={styles.pickerModal}>
              <div style={styles.modalHeader}>
                <h2>选择合同</h2>
                <button style={styles.closeBtn} onClick={() => setShowContractPicker(false)}>×</button>
              </div>
              <div style={styles.pickerList}>
                {contracts.map(contract => (
                  <div
                    key={contract.id}
                    style={styles.pickerItem}
                    onClick={() => selectContract(contract)}
                  >
                    <FontAwesome6 name="file-signature" size={16} color="#F39C12" />
                    <span>{contract.contract_name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>

        <Modal visible={showDeleteConfirm} animationType="fade" transparent>
          <div style={styles.modalOverlay}>
            <div style={styles.confirmModal}>
              <div style={styles.confirmIcon}>
                <FontAwesome6 name="exclamation-triangle" size={48} color="#ff4d4f" />
              </div>
              <h3>确认删除</h3>
              <p>确定要删除这台设备吗？此操作不可撤销。</p>
              <div style={styles.confirmActions}>
                <button style={styles.cancelBtn} onClick={() => setShowDeleteConfirm(false)}>取消</button>
                <button style={styles.confirmDeleteBtn} onClick={confirmDelete}>确认删除</button>
              </div>
            </div>
          </div>
        </Modal>
      </div>

      <style>{`
        .pc-layout .pc-content {
          background: #f5f7fa;
          min-height: calc(100vh - 64px);
        }
      `}</style>
    </PCLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: '24px',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  titleSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  title: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#1f2937',
    margin: 0,
  },
  headerActions: {
    display: 'flex',
    gap: '12px',
  },
  addButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    backgroundColor: '#4F8EF7',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '24px',
    padding: '16px',
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  searchBox: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    backgroundColor: '#f5f7fa',
    borderRadius: '8px',
  },
  searchInput: {
    flex: 1,
    border: 'none',
    background: 'transparent',
    fontSize: '14px',
    outline: 'none',
  },
  filterGroup: {
    display: 'flex',
    gap: '12px',
  },
  filterSelect: {
    padding: '8px 16px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    backgroundColor: '#fff',
    cursor: 'pointer',
    minWidth: '120px',
  },
  stats: {
    fontSize: '14px',
    color: '#6b7280',
    marginLeft: 'auto',
  },
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 0',
    color: '#999',
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid #e5e7eb',
    borderTopColor: '#4F8EF7',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '16px',
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 0',
    backgroundColor: '#fff',
    borderRadius: '12px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
    gap: '20px',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    transition: 'box-shadow 0.2s, transform 0.2s',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    marginBottom: '16px',
  },
  cardIcon: {
    width: '44px',
    height: '44px',
    borderRadius: '10px',
    backgroundColor: '#EEF4FF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    flex: 1,
  },
  deviceType: {
    fontSize: '12px',
    color: '#999',
    marginTop: '2px',
  },
  statusBadge: {
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '500',
  },
  cardBody: {
    padding: '12px 0',
    borderTop: '1px solid #f0f0f0',
    borderBottom: '1px solid #f0f0f0',
  },
  infoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
    fontSize: '13px',
    color: '#666',
  },
  cardFooter: {
    display: 'flex',
    gap: '12px',
    marginTop: '16px',
    paddingTop: '12px',
    borderTop: '1px solid #f0f0f0',
  },
  editBtn: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '8px',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    backgroundColor: '#fff',
    cursor: 'pointer',
    fontSize: '13px',
    color: '#4F8EF7',
    transition: 'background-color 0.2s',
  },
  deleteBtn: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '8px',
    border: '1px solid #ffebee',
    borderRadius: '6px',
    backgroundColor: '#fff',
    cursor: 'pointer',
    fontSize: '13px',
    color: '#ff4d4f',
    transition: 'background-color 0.2s',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalContent: {
    width: '520px',
    maxHeight: '80vh',
    backgroundColor: '#fff',
    borderRadius: '12px',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid #e5e7eb',
  },
  closeBtn: {
    width: '32px',
    height: '32px',
    border: 'none',
    background: 'transparent',
    fontSize: '24px',
    color: '#999',
    cursor: 'pointer',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    padding: '20px',
    overflowY: 'auto',
    flex: 1,
  },
  formRow: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    marginBottom: '6px',
    fontSize: '14px',
    color: '#374151',
    fontWeight: '500',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    backgroundColor: '#fff',
    cursor: 'pointer',
    outline: 'none',
  },
  pickerWrapper: {
    display: 'flex',
    gap: '8px',
  },
  pickerBtn: {
    padding: '10px 16px',
    backgroundColor: '#4F8EF7',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    padding: '16px 20px',
    borderTop: '1px solid #e5e7eb',
  },
  cancelBtn: {
    padding: '10px 20px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    backgroundColor: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
  },
  saveBtn: {
    padding: '10px 20px',
    backgroundColor: '#4F8EF7',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  pickerModal: {
    width: '400px',
    maxHeight: '60vh',
    backgroundColor: '#fff',
    borderRadius: '12px',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  pickerList: {
    padding: '12px',
    overflowY: 'auto',
    maxHeight: '400px',
  },
  pickerItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  confirmModal: {
    width: '360px',
    padding: '24px',
    backgroundColor: '#fff',
    borderRadius: '12px',
    textAlign: 'center',
  },
  confirmIcon: {
    marginBottom: '16px',
  },
  confirmActions: {
    display: 'flex',
    gap: '12px',
    marginTop: '20px',
  },
  confirmDeleteBtn: {
    flex: 1,
    padding: '10px 20px',
    backgroundColor: '#ff4d4f',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
  },
});
