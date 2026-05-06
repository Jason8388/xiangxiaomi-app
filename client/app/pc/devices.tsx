import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Alert } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { PCLayout } from '@/components/pc/PCLayout';
import { apiUrl } from '@/utils/api';
import { useSafeRouter } from '@/hooks/useSafeRouter';

interface Device {
  id: number;
  device_name: string;
  device_type: string;
  device_model: string;
  factory_serial_number: string;
  device_number: string;
  customer_id?: number;
  customer_name?: string;
  contract_id?: number;
  contract_name?: string;
  factory_date?: string;
  acceptance_date?: string;
  warranty_end_date?: string;
  location?: string;
  remarks?: string;
  status?: string;
  installation_date?: string;
  photos?: any[];
  site_photos?: any[];
}

interface Customer {
  id: number;
  name: string;
}

interface Contract {
  id: number;
  contract_name: string;
}

const deviceTypes = ['工业设备', '医疗设备', '办公设备', '安防设备', '网络设备', '其他'];
const statusOptions = ['在用', '闲置', '维修中', '已报废'];

export default function PCDevices() {
  const router = useSafeRouter();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filteredDevices, setFilteredDevices] = useState<Device[]>([]);
  
  // 新增/编辑设备
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [deviceForm, setDeviceForm] = useState({
    device_name: '',
    device_type: '',
    device_model: '',
    factory_serial_number: '',
    device_number: '',
    customer_id: '',
    customer_name: '',
    contract_id: '',
    contract_name: '',
    factory_date: '',
    acceptance_date: '',
    warranty_end_date: '',
    location: '',
    remarks: '',
    status: '在用',
  });

  // 客户和合同选择器
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [showContractPicker, setShowContractPicker] = useState(false);

  // 设备详情
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailDevice, setDetailDevice] = useState<Device | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // 删除确认
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // 获取设备列表
  const fetchDevices = useCallback(async () => {
    try {
      const response = await fetch(apiUrl('/api/v1/devices'));
      if (response.ok) {
        const data = await response.json();
        setDevices(data.data || []);
      }
    } catch (error) {
      console.error('获取设备列表失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 获取客户列表
  const fetchCustomers = async () => {
    try {
      const response = await fetch(apiUrl('/api/v1/customers'));
      if (response.ok) {
        const data = await response.json();
        setCustomers(data.data || []);
      }
    } catch (error) {
      console.error('获取客户列表失败:', error);
    }
  };

  // 获取合同列表
  const fetchContracts = async () => {
    try {
      const response = await fetch(apiUrl('/api/v1/contracts'));
      if (response.ok) {
        const data = await response.json();
        setContracts(data.data || []);
      }
    } catch (error) {
      console.error('获取合同列表失败:', error);
    }
  };

  // 获取设备详情
  const fetchDeviceDetail = async (id: number) => {
    setDetailLoading(true);
    try {
      const response = await fetch(apiUrl(`/api/v1/devices/${id}`));
      if (response.ok) {
        const data = await response.json();
        setDetailDevice(data);
      }
    } catch (error) {
      console.error('获取设备详情失败:', error);
      Alert.alert('错误', '获取设备详情失败');
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
    fetchCustomers();
    fetchContracts();
  }, [fetchDevices]);

  useEffect(() => {
    let filtered = [...devices];
    
    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase();
      filtered = filtered.filter(d =>
        (d.device_name?.toLowerCase().includes(keyword)) ||
        (d.device_model?.toLowerCase().includes(keyword)) ||
        (d.device_number?.toLowerCase().includes(keyword)) ||
        (d.factory_serial_number?.toLowerCase().includes(keyword)) ||
        (d.customer_name?.toLowerCase().includes(keyword))
      );
    }
    
    if (filterType) {
      filtered = filtered.filter(d => d.device_type === filterType);
    }
    
    setFilteredDevices(filtered);
  }, [searchKeyword, filterType, devices]);

  // 打开新增设备
  const handleAdd = () => {
    setEditingDevice(null);
    setSitePhotos([]);
    setEditingPhotos([]);
    setDeviceForm({
      device_name: '',
      device_type: '',
      device_model: '',
      factory_serial_number: '',
      device_number: '',
      customer_id: '',
      customer_name: '',
      contract_id: '',
      contract_name: '',
      factory_date: '',
      acceptance_date: '',
      warranty_end_date: '',
      location: '',
      remarks: '',
      status: '在用',
    });
    setShowDeviceModal(true);
  };

  // 打开编辑设备
  const handleEdit = (device: Device) => {
    setEditingDevice(device);
    setSitePhotos([]);
    // 加载已有照片
    if (device.site_photos && Array.isArray(device.site_photos)) {
      setEditingPhotos(device.site_photos);
    } else {
      setEditingPhotos([]);
    }
    setDeviceForm({
      device_name: device.device_name || '',
      device_type: device.device_type || '',
      device_model: device.device_model || '',
      factory_serial_number: device.factory_serial_number || '',
      device_number: device.device_number || '',
      customer_id: device.customer_id?.toString() || '',
      customer_name: device.customer_name || '',
      contract_id: device.contract_id?.toString() || '',
      contract_name: device.contract_name || '',
      factory_date: device.factory_date || '',
      acceptance_date: device.acceptance_date || '',
      warranty_end_date: device.warranty_end_date || '',
      location: device.location || '',
      remarks: device.remarks || '',
      status: device.status || '在用',
    });
    setShowDeviceModal(true);
  };

  // 打开设备详情
  const handleViewDetail = async (device: Device) => {
    await fetchDeviceDetail(device.id);
    setShowDetailModal(true);
  };

  // 打开履历表 - 跳转到详情页
  const handleViewHistory = (deviceId: number, deviceName: string) => {
    // 跳转到设备履历表详情页面
    router.push(`/pc/device-history?deviceId=${deviceId}&deviceName=${encodeURIComponent(deviceName)}`);
  };

  // 保存设备
  const handleSave = async () => {
    if (!deviceForm.device_name) {
      Alert.alert('提示', '请输入设备名称');
      return;
    }

    try {
      const url = editingDevice
        ? apiUrl(`/api/v1/devices/${editingDevice.id}`)
        : apiUrl('/api/v1/devices');
      
      const method = editingDevice ? 'PUT' : 'POST';
      
      // 使用 FormData 支持文件上传
      const formData = new FormData();
      
      // 添加文本字段
      Object.keys(deviceForm).forEach((key) => {
        const value = deviceForm[key as keyof typeof deviceForm];
        if (value) {
          formData.append(key, value);
        }
      });
      
      // 添加新上传的照片（Base64格式）
      sitePhotos.forEach((photo, index) => {
        formData.append(`site_photo_${index}`, photo);
      });
      
      // 添加已有照片的标识
      if (editingPhotos.length > 0) {
        formData.append('existing_photos', JSON.stringify(editingPhotos));
      }
      
      const response = await fetch(url, {
        method,
        body: formData,
      });

      if (response.ok) {
        setShowDeviceModal(false);
        fetchDevices();
        Alert.alert('成功', editingDevice ? '设备已更新' : '设备已添加');
      } else {
        const data = await response.json();
        Alert.alert('错误', data.error || '保存失败');
      }
    } catch (error) {
      console.error('保存失败:', error);
      Alert.alert('错误', '保存失败');
    }
  };

  // 删除设备
  const handleDelete = async (id: number) => {
    setDeletingId(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;

    try {
      const response = await fetch(apiUrl(`/api/v1/devices/${deletingId}`), {
        method: 'DELETE',
      });

      if (response.ok) {
        setShowDeleteConfirm(false);
        setDeletingId(null);
        fetchDevices();
        if (showDetailModal) {
          setShowDetailModal(false);
        }
        Alert.alert('成功', '设备已删除');
      } else {
        const data = await response.json();
        Alert.alert('错误', data.error || '删除失败');
      }
    } catch (error) {
      console.error('删除失败:', error);
      Alert.alert('错误', '删除失败');
    }
  };

  // 选择客户
  const selectCustomer = (customer: Customer) => {
    setDeviceForm(prev => ({
      ...prev,
      customer_id: customer.id.toString(),
      customer_name: customer.name,
    }));
    setShowCustomerPicker(false);
  };

  // 选择合同
  const selectContract = (contract: Contract) => {
    setDeviceForm(prev => ({
      ...prev,
      contract_id: contract.id.toString(),
      contract_name: contract.contract_name,
    }));
    setShowContractPicker(false);
  };

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case '在用': return '#52c41a';
      case '闲置': return '#faad14';
      case '维修中': return '#1890ff';
      case '已报废': return '#ff4d4f';
      default: return '#999';
    }
  };

  // 获取设备类型图标
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

  // 格式化日期
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  // 设备现场照片
  const [sitePhotos, setSitePhotos] = useState<string[]>([]);
  // 保持对编辑设备的引用以加载已有照片
  const [editingPhotos, setEditingPhotos] = useState<string[]>([]);

  // 处理照片选择
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newPhotos: string[] = [];
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setSitePhotos((prev) => [...prev, event.target!.result as string]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
    // 清空input值，允许重复选择同一文件
    e.target.value = '';
  };

  // 删除照片
  const handleRemovePhoto = (index: number, isExisting: boolean) => {
    if (isExisting) {
      setEditingPhotos((prev) => prev.filter((_, i) => i !== index));
    } else {
      setSitePhotos((prev) => prev.filter((_, i) => i !== index));
    }
  };

  return (
    <PCLayout activePath="/pc/devices">
      <div style={styles.container}>
        {/* 头部 */}
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

        {/* 工具栏 */}
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

        {/* 设备列表 */}
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
                  {device.device_model && (
                    <div style={styles.infoRow}>
                      <FontAwesome6 name="tag" size={14} color="#999" />
                      <span>{device.device_model}</span>
                    </div>
                  )}
                  {device.device_number && (
                    <div style={styles.infoRow}>
                      <FontAwesome6 name="hashtag" size={14} color="#999" />
                      <span>{device.device_number}</span>
                    </div>
                  )}
                  {device.factory_serial_number && (
                    <div style={styles.infoRow}>
                      <FontAwesome6 name="barcode" size={14} color="#999" />
                      <span>{device.factory_serial_number}</span>
                    </div>
                  )}
                  {device.customer_name && (
                    <div style={styles.infoRow}>
                      <FontAwesome6 name="building" size={14} color="#999" />
                      <span>{device.customer_name}</span>
                    </div>
                  )}
                  {device.factory_date && (
                    <div style={styles.infoRow}>
                      <FontAwesome6 name="calendar" size={14} color="#999" />
                      <span>{formatDate(device.factory_date)}</span>
                    </div>
                  )}
                </div>
                <div style={styles.cardFooter}>
                  <button style={styles.editBtn} onClick={() => handleEdit(device)}>
                    <FontAwesome6 name="edit" size={14} color="#4F8EF7" />
                    <span>编辑</span>
                  </button>
                  <button style={styles.historyBtn} onClick={() => handleViewHistory(device.id, device.device_name)}>
                    <FontAwesome6 name="clipboard-list" size={14} color="#F39C12" />
                    <span>履历表</span>
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

        {/* 新增/编辑设备模态框 */}
        <Modal visible={showDeviceModal} animationType="slide" transparent>
          <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
              <div style={styles.modalHeader}>
                <h2>{editingDevice ? '编辑设备' : '新增设备'}</h2>
                <button style={styles.closeBtn} onClick={() => setShowDeviceModal(false)}>×</button>
              </div>
              <div style={styles.modalBody}>
                <ScrollView style={{ maxHeight: '60vh' }}>
                  <div style={styles.formRow}>
                    <label style={styles.label}>设备名称 *</label>
                    <input
                      type="text"
                      value={deviceForm.device_name}
                      onChange={(e) => setDeviceForm(prev => ({ ...prev, device_name: e.target.value }))}
                      style={styles.input}
                      placeholder="请输入设备名称"
                    />
                  </div>
                  <div style={styles.formRow}>
                    <label style={styles.label}>设备类型</label>
                    <select
                      value={deviceForm.device_type}
                      onChange={(e) => setDeviceForm(prev => ({ ...prev, device_type: e.target.value }))}
                      style={styles.select}
                    >
                      <option value="">请选择类型</option>
                      {deviceTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div style={styles.formRow}>
                    <label style={styles.label}>设备型号</label>
                    <input
                      type="text"
                      value={deviceForm.device_model}
                      onChange={(e) => setDeviceForm(prev => ({ ...prev, device_model: e.target.value }))}
                      style={styles.input}
                      placeholder="请输入设备型号"
                    />
                  </div>
                  <div style={styles.formRow}>
                    <label style={styles.label}>出厂编号</label>
                    <input
                      type="text"
                      value={deviceForm.factory_serial_number}
                      onChange={(e) => setDeviceForm(prev => ({ ...prev, factory_serial_number: e.target.value }))}
                      style={styles.input}
                      placeholder="请输入出厂编号"
                    />
                  </div>
                  <div style={styles.formRow}>
                    <label style={styles.label}>设备编号</label>
                    <input
                      type="text"
                      value={deviceForm.device_number}
                      onChange={(e) => setDeviceForm(prev => ({ ...prev, device_number: e.target.value }))}
                      style={styles.input}
                      placeholder="请输入设备编号"
                    />
                  </div>
                  <div style={styles.formRow}>
                    <label style={styles.label}>归属客户</label>
                    <div style={styles.pickerWrapper}>
                      <input
                        type="text"
                        value={deviceForm.customer_name}
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
                        value={deviceForm.contract_name}
                        readOnly
                        style={styles.input}
                        placeholder="选择合同"
                      />
                      <button style={styles.pickerBtn} onClick={() => setShowContractPicker(true)}>选择</button>
                    </div>
                  </div>
                  <div style={styles.formRow}>
                    <label style={styles.label}>进厂日期</label>
                    <input
                      type="date"
                      value={deviceForm.factory_date}
                      onChange={(e) => setDeviceForm(prev => ({ ...prev, factory_date: e.target.value }))}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.formRow}>
                    <label style={styles.label}>验收日期</label>
                    <input
                      type="date"
                      value={deviceForm.acceptance_date}
                      onChange={(e) => setDeviceForm(prev => ({ ...prev, acceptance_date: e.target.value }))}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.formRow}>
                    <label style={styles.label}>质保到期日期</label>
                    <input
                      type="date"
                      value={deviceForm.warranty_end_date}
                      onChange={(e) => setDeviceForm(prev => ({ ...prev, warranty_end_date: e.target.value }))}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.formRow}>
                    <label style={styles.label}>设备位置</label>
                    <input
                      type="text"
                      value={deviceForm.location}
                      onChange={(e) => setDeviceForm(prev => ({ ...prev, location: e.target.value }))}
                      style={styles.input}
                      placeholder="请输入设备位置"
                    />
                  </div>
                  {/* 设备现场照片上传 */}
                  <div style={styles.formRow}>
                    <label style={styles.label}>设备现场照片</label>
                    <div style={{ width: '100%' }}>
                      <div style={{ fontSize: '12px', color: '#999', marginBottom: '12px' }}>支持 JPG、PNG 格式，最多上传9张</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                        {/* 已存在的照片 */}
                        {editingPhotos.map((photo, index) => (
                          <div key={`existing-${index}`} style={{ position: 'relative', width: '100px', height: '100px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e8e8e8' }}>
                            <img 
                              src={photo} 
                              alt={`现场照片${index + 1}`}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={(e: any) => { e.target.style.display = 'none'; }}
                            />
                            <button 
                              style={{ position: 'absolute', top: '4px', right: '4px', width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', lineHeight: '1' }}
                              onClick={() => handleRemovePhoto(index, true)}
                              type="button"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        {/* 新上传的照片 */}
                        {sitePhotos.map((photo, index) => (
                          <div key={`new-${index}`} style={{ position: 'relative', width: '100px', height: '100px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e8e8e8' }}>
                            <img 
                              src={photo} 
                              alt={`新照片${index + 1}`}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                            <button 
                              style={{ position: 'absolute', top: '4px', right: '4px', width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', lineHeight: '1' }}
                              onClick={() => handleRemovePhoto(index, false)}
                              type="button"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        {/* 添加照片按钮 */}
                        {(editingPhotos.length + sitePhotos.length) < 9 && (
                          <div style={{ width: '100px', height: '100px', borderRadius: '8px', border: '1px dashed #d9d9d9', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                            <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', cursor: 'pointer', padding: '8px' }}>
                              <FontAwesome6 name="camera" size={24} color="#999" />
                              <span style={{ fontSize: '12px', color: '#999' }}>添加照片</span>
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handlePhotoSelect}
                                style={{ display: 'none' }}
                              />
                            </label>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div style={styles.formRow}>
                    <label style={styles.label}>备注</label>
                    <textarea
                      value={deviceForm.remarks}
                      onChange={(e) => setDeviceForm(prev => ({ ...prev, remarks: e.target.value }))}
                      style={styles.textarea}
                      placeholder="请输入备注信息"
                      rows={3}
                    />
                  </div>
                  <div style={styles.formRow}>
                    <label style={styles.label}>状态</label>
                    <select
                      value={deviceForm.status}
                      onChange={(e) => setDeviceForm(prev => ({ ...prev, status: e.target.value }))}
                      style={styles.select}
                    >
                      {statusOptions.map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                </ScrollView>
              </div>
              <div style={styles.modalFooter}>
                <button style={styles.cancelBtn} onClick={() => setShowDeviceModal(false)}>取消</button>
                <button style={styles.saveBtn} onClick={handleSave}>保存</button>
              </div>
            </div>
          </div>
        </Modal>

        {/* 设备详情模态框 */}
        <Modal visible={showDetailModal} animationType="slide" transparent>
          <div style={styles.modalOverlay}>
            <div style={styles.detailModal}>
              <div style={styles.modalHeader}>
                <h2>设备详情</h2>
                <button style={styles.closeBtn} onClick={() => setShowDetailModal(false)}>×</button>
              </div>
              <div style={styles.modalBody}>
                {detailLoading ? (
                  <div style={styles.loading}>
                    <div style={styles.spinner}></div>
                    <span>加载中...</span>
                  </div>
                ) : detailDevice ? (
                  <ScrollView style={{ maxHeight: '70vh' }}>
                    <div style={styles.detailSection}>
                      <h3 style={styles.detailSectionTitle}>
                        <FontAwesome6 name="microchip" size={16} color="#2ECC71" />
                        设备信息
                      </h3>
                      <div style={styles.detailGrid}>
                        <div style={styles.detailItem}>
                          <span style={styles.detailLabel}>设备名称</span>
                          <span style={styles.detailValue}>{detailDevice.device_name}</span>
                        </div>
                        <div style={styles.detailItem}>
                          <span style={styles.detailLabel}>设备型号</span>
                          <span style={styles.detailValue}>{detailDevice.device_model || '-'}</span>
                        </div>
                        <div style={styles.detailItem}>
                          <span style={styles.detailLabel}>出厂编号</span>
                          <span style={styles.detailValue}>{detailDevice.factory_serial_number || '-'}</span>
                        </div>
                        <div style={styles.detailItem}>
                          <span style={styles.detailLabel}>设备编号</span>
                          <span style={styles.detailValue}>{detailDevice.device_number || '-'}</span>
                        </div>
                        <div style={styles.detailItem}>
                          <span style={styles.detailLabel}>设备类型</span>
                          <span style={styles.detailValue}>{detailDevice.device_type || '-'}</span>
                        </div>
                        <div style={styles.detailItem}>
                          <span style={styles.detailLabel}>归属客户</span>
                          <span style={styles.detailValue}>{detailDevice.customer_name || '-'}</span>
                        </div>
                        <div style={styles.detailItem}>
                          <span style={styles.detailLabel}>进厂日期</span>
                          <span style={styles.detailValue}>{formatDate(detailDevice.factory_date)}</span>
                        </div>
                        <div style={styles.detailItem}>
                          <span style={styles.detailLabel}>验收日期</span>
                          <span style={styles.detailValue}>{formatDate(detailDevice.acceptance_date)}</span>
                        </div>
                        <div style={styles.detailItem}>
                          <span style={styles.detailLabel}>质保到期日期</span>
                          <span style={styles.detailValue}>{formatDate(detailDevice.warranty_end_date)}</span>
                        </div>
                        <div style={styles.detailItem}>
                          <span style={styles.detailLabel}>设备位置</span>
                          <span style={styles.detailValue}>{detailDevice.location || '-'}</span>
                        </div>
                        <div style={styles.detailItem}>
                          <span style={styles.detailLabel}>备注</span>
                          <span style={styles.detailValue}>{detailDevice.remarks || '-'}</span>
                        </div>
                        <div style={styles.detailItem}>
                          <span style={styles.detailLabel}>状态</span>
                          <span style={{...styles.detailValue, color: getStatusColor(detailDevice.status || '在用')}}>
                            {detailDevice.status || '在用'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </ScrollView>
                ) : (
                  <div style={styles.empty}>
                    <span>暂无数据</span>
                  </div>
                )}
              </div>
              <div style={styles.modalFooter}>
                <button style={styles.editBtn} onClick={() => { setShowDetailModal(false); handleEdit(detailDevice!); }}>
                  <FontAwesome6 name="edit" size={14} color="#4F8EF7" />
                  <span>编辑</span>
                </button>
                <button style={styles.historyBtn} onClick={() => handleViewHistory(detailDevice!.id, detailDevice!.device_name)}>
                  <FontAwesome6 name="clipboard-list" size={14} color="#F39C12" />
                  <span>履历表</span>
                </button>
                <button style={styles.deleteBtn} onClick={() => { setShowDetailModal(false); handleDelete(detailDevice!.id); }}>
                  <FontAwesome6 name="trash" size={14} color="#ff4d4f" />
                  <span>删除</span>
                </button>
              </div>
            </div>
          </div>
        </Modal>

        {/* 客户选择器 */}
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

        {/* 合同选择器 */}
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

        {/* 删除确认 */}
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
    color: '#333',
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
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flex: 1,
    padding: '10px 16px',
    backgroundColor: '#f5f7fa',
    borderRadius: '8px',
    border: '1px solid #e8e8e8',
  },
  searchInput: {
    flex: 1,
    border: 'none',
    backgroundColor: 'transparent',
    fontSize: '14px',
    outline: 'none',
    color: '#333',
  },
  filterGroup: {
    display: 'flex',
    gap: '12px',
  },
  filterSelect: {
    padding: '10px 16px',
    border: '1px solid #e8e8e8',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#333',
    backgroundColor: '#fff',
    cursor: 'pointer',
    outline: 'none',
  },
  stats: {
    fontSize: '14px',
    color: '#666',
    padding: '0 12px',
  },
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px',
    color: '#999',
    gap: '12px',
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid #f3f3f3',
    borderTop: '3px solid #4F8EF7',
    borderRadius: '50%',
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px',
    color: '#999',
    gap: '16px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '20px',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
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
  cardTitleText: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#333',
    margin: 0,
  },
  deviceType: {
    fontSize: '12px',
    color: '#666',
    marginTop: '4px',
  },
  statusBadge: {
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '500',
  },
  cardBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    paddingBottom: '16px',
    borderBottom: '1px solid #f0f0f0',
    marginBottom: '16px',
  },
  infoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: '#666',
  },
  cardFooter: {
    display: 'flex',
    gap: '12px',
  },
  editBtn: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '10px',
    backgroundColor: '#EEF4FF',
    color: '#4F8EF7',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  historyBtn: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '10px',
    backgroundColor: '#FEF9E7',
    color: '#F39C12',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  deleteBtn: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '10px',
    backgroundColor: '#FFEEF0',
    color: '#ff4d4f',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer',
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
    width: '600px',
    maxWidth: '90%',
    maxHeight: '90vh',
    backgroundColor: '#fff',
    borderRadius: '12px',
    display: 'flex',
    flexDirection: 'column',
  },
  detailModal: {
    width: '800px',
    maxWidth: '90%',
    maxHeight: '90vh',
    backgroundColor: '#fff',
    borderRadius: '12px',
    display: 'flex',
    flexDirection: 'column',
  },
  pickerModal: {
    width: '400px',
    maxWidth: '90%',
    maxHeight: '60vh',
    backgroundColor: '#fff',
    borderRadius: '12px',
    display: 'flex',
    flexDirection: 'column',
  },
  confirmModal: {
    width: '400px',
    maxWidth: '90%',
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '32px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '1px solid #f0f0f0',
  },
  modalHeaderText: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#333',
    margin: 0,
  },
  closeBtn: {
    width: '32px',
    height: '32px',
    border: 'none',
    backgroundColor: 'transparent',
    fontSize: '24px',
    color: '#999',
    cursor: 'pointer',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    flex: 1,
    padding: '24px',
    overflow: 'hidden',
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    padding: '16px 24px',
    borderTop: '1px solid #f0f0f0',
  },
  formRow: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontSize: '14px',
    color: '#666',
    fontWeight: '500',
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    border: '1px solid #e8e8e8',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#333',
    outline: 'none',
    boxSizing: 'border-box',
  },
  select: {
    width: '100%',
    padding: '12px 16px',
    border: '1px solid #e8e8e8',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#333',
    backgroundColor: '#fff',
    outline: 'none',
    cursor: 'pointer',
  },
  textarea: {
    width: '100%',
    padding: '12px 16px',
    border: '1px solid #e8e8e8',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#333',
    outline: 'none',
    resize: 'vertical',
    fontFamily: 'inherit',
  },
  pickerWrapper: {
    display: 'flex',
    gap: '8px',
  },
  pickerBtn: {
    padding: '12px 20px',
    backgroundColor: '#4F8EF7',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  cancelBtn: {
    padding: '12px 24px',
    backgroundColor: '#f5f5f5',
    color: '#666',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  saveBtn: {
    padding: '12px 24px',
    backgroundColor: '#4F8EF7',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  pickerList: {
    maxHeight: '400px',
    overflow: 'auto',
    padding: '8px',
  },
  pickerItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'backgroundColor 0.2s',
  },
  confirmIcon: {
    marginBottom: '16px',
  },
  confirmText: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#333',
    margin: 0,
  },
  confirmDesc: {
    fontSize: '14px',
    color: '#666',
    margin: '8px 0 24px',
  },
  confirmActions: {
    display: 'flex',
    gap: '12px',
    width: '100%',
  },
  confirmDeleteBtn: {
    flex: 1,
    padding: '12px 24px',
    backgroundColor: '#ff4d4f',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  detailSection: {
    marginBottom: '24px',
  },
  detailSectionTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '16px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '16px',
    paddingBottom: '12px',
    borderBottom: '1px solid #f0f0f0',
  },
  detailGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',
  },
  detailItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  detailLabel: {
    fontSize: '12px',
    color: '#999',
  },
  detailValue: {
    fontSize: '14px',
    color: '#333',
    fontWeight: '500',
  },
});
