import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Image } from 'react-native';
import { PCLayout } from '@/components/pc/PCLayout';
import { PCTable } from '@/components/pc/PCComponents';
import { PCTag } from '@/components/pc/PCComponents';
import { PCCard } from '@/components/pc/PCComponents';
import { PCToolbar } from '@/components/pc/PCComponents';
import { PCSearchBar } from '@/components/pc/PCComponents';
import { PCModal } from '@/components/pc/PCComponents';
import { PCPagination } from '@/components/pc/PCComponents';
import { PCImportModal } from '@/components/pc/PCComponents';
import { FontAwesome6 } from '@expo/vector-icons';

import { storage } from '@/utils/storage';
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
  contract_number?: string;
  qr_code_id?: string;
  location?: string;
  remarks?: string;
  service_number?: string;
  site_photos?: string[];
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
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [customerList, setCustomerList] = useState<any[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<any[]>([]);
  const [contractList, setContractList] = useState<any[]>([]);
  const [filteredContracts, setFilteredContracts] = useState<any[]>([]);
  const [customerSearchKeyword, setCustomerSearchKeyword] = useState('');
  const [contractSearchKeyword, setContractSearchKeyword] = useState('');
  const [showDeviceTypeSelector, setShowDeviceTypeSelector] = useState(false);
  const [showCustomerSelector, setShowCustomerSelector] = useState(false);
  const [showContractSelector, setShowContractSelector] = useState(false);
  const [sitePhotos, setSitePhotos] = useState<string[]>([]);
  const [qrCode, setQrCode] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
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
    contract_number: '',
    qr_code_id: '',
    location: '',
    remarks: '',
    service_number: '',
  });
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  const fetchDevices = useCallback(async () => {
    setLoading(true);
    try {
      const sessionId = await storage.getItem('session_id');
      const response = await fetch(`${API_BASE}/api/v1/devices`, {
        headers: sessionId ? { Authorization: `Bearer ${sessionId}` } : {},
      });
      const data = await response.json();
      const list: Device[] = Array.isArray(data) ? data : (data.data || []);
      setDevices(list);
      setPagination(prev => ({ ...prev, total: list.length }));
    } catch (error) {
      console.error('获取设备列表失败:', error);
      Alert.alert('错误', '获取设备列表失败');
    } finally {
      setLoading(false);
    }
  }, []);

  // 批量导出设备
  const handleExportDevices = async () => {
    try {
      const sessionId = await storage.getItem('session_id');
      const ids = selectedRowKeys.length > 0 ? selectedRowKeys.join(',') : '';
      const url = ids 
        ? `${API_BASE}/api/v1/devices/export?ids=${ids}`
        : `${API_BASE}/api/v1/devices/export`;
      
      const response = await fetch(url, {
        headers: sessionId ? { Authorization: `Bearer ${sessionId}` } : {},
      });

      if (response.ok) {
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `设备信息导出_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
        Alert.alert('成功', '导出成功');
      } else {
        const data = await response.json();
        Alert.alert('错误', data.error || '导出失败');
      }
    } catch (error) {
      console.error('导出设备失败:', error);
      Alert.alert('错误', '导出失败');
    }
  };

  // 加载客户列表
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/v1/customers`);
        const data = await response.json();
        if (response.ok) {
          const list = Array.isArray(data) ? data : (data.data || []);
          setCustomerList(list);
          setFilteredCustomers(list);
        }
      } catch (error) {
        console.error('Load customers error:', error);
      }
    };
    loadCustomers();
  }, []);

  // 加载合同列表
  useEffect(() => {
    const loadContracts = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/v1/contracts`);
        const data = await response.json();
        if (response.ok) {
          const list = Array.isArray(data) ? data : (data.data || []);
          setContractList(list);
          setFilteredContracts(list);
        }
      } catch (error) {
        console.error('Load contracts error:', error);
      }
    };
    loadContracts();
  }, []);

  // 客户名称搜索过滤
  useEffect(() => {
    if (customerSearchKeyword.trim()) {
      const keyword = customerSearchKeyword.toLowerCase();
      const filtered = customerList.filter((c) => {
        const name = (c.name || '').toLowerCase();
        return name.includes(keyword);
      });
      setFilteredCustomers(filtered);
    } else {
      setFilteredCustomers(customerList);
    }
  }, [customerSearchKeyword, customerList]);

  // 合同名称/编号搜索过滤
  useEffect(() => {
    if (contractSearchKeyword.trim()) {
      const keyword = contractSearchKeyword.toLowerCase();
      const filtered = contractList.filter((c) => {
        const contractNo = (c.contract_no || '').toLowerCase();
        const title = (c.title || c.contract_name || '').toLowerCase();
        return contractNo.includes(keyword) || title.includes(keyword);
      });
      setFilteredContracts(filtered);
    } else {
      setFilteredContracts(contractList);
    }
  }, [contractSearchKeyword, contractList]);

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
      (d.device_name?.toLowerCase() || '').includes(keyword) ||
      (d.device_number?.toLowerCase() || '').includes(keyword) ||
      (d.customer_name?.toLowerCase() || '').includes(keyword)
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
      contract_number: '',
      qr_code_id: '',
      location: '',
      remarks: '',
      service_number: '',
    });
    setSitePhotos([]);
    setQrCode('');
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
      contract_number: device.contract_number || '',
      qr_code_id: device.qr_code_id || '',
      location: device.location || '',
      remarks: device.remarks || '',
      service_number: device.service_number || '',
    });
    // 加载现场照片
    if (device.site_photos && Array.isArray(device.site_photos)) {
      setSitePhotos(device.site_photos);
    } else {
      setSitePhotos([]);
    }
    // 生成二维码
    setQrCode(`S${device.id}`);
    setModalVisible(true);
  };

  const handleDelete = async (device: Device) => {
    Alert.alert('确认', `确定删除设备"${device.device_name}"吗？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '确定',
        style: 'destructive',
        onPress: async () => {
          try {
            await fetch(`${API_BASE}/api/v1/devices/${device.id}`, { method: 'DELETE' });
            setDevices(prev => prev.filter(d => d.id !== device.id));
            setPagination(prev => ({ ...prev, total: prev.total - 1 }));
            Alert.alert('成功', '删除成功');
          } catch (error) {
            console.error('删除失败:', error);
            Alert.alert('错误', '删除失败');
          }
        },
      },
    ]);
  };

  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) return;
    Alert.alert('确认', `确定删除选中的 ${selectedRowKeys.length} 个设备吗？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '确定',
        style: 'destructive',
        onPress: () => {
          setDevices(prev => prev.filter(d => !selectedRowKeys.includes(String(d.id))));
          setPagination(prev => ({ ...prev, total: prev.total - selectedRowKeys.length }));
          setSelectedRowKeys([]);
          Alert.alert('成功', '批量删除成功');
        },
      },
    ]);
  };

  const handleSave = async () => {
    if (!formData.device_number || !formData.device_name || !formData.device_type) {
      Alert.alert('错误', '设备出厂编号、设备名称和设备类型不能为空');
      return;
    }

    try {
      const sessionId = await storage.getItem('session_id');
      const url = editingDevice
        ? `${API_BASE}/api/v1/devices/${editingDevice.id}`
        : `${API_BASE}/api/v1/devices`;
      const method = editingDevice ? 'PUT' : 'POST';

      // 构建FormData以支持文件上传
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key as keyof typeof formData]) {
          data.append(key, formData[key as keyof typeof formData]);
        }
      });

      // 上传照片
      if (sitePhotos.length > 0) {
        for (let i = 0; i < sitePhotos.length; i++) {
          data.append(`site_photo_${i}`, {
        uri: sitePhotos[i],
        name: `site_photo_${i}.jpg`,
        type: 'image/jpeg',
      } as any);
        }
      }

      // 生成设备二维码
      const deviceId = editingDevice ? editingDevice.id : `temp_${Date.now()}`;
      const qrCodeValue = qrCode || `S${deviceId}`;
      data.append('qr_code', qrCodeValue);

      const response = await fetch(url, {
        method,
        headers: {
          ...(sessionId ? { Authorization: `Bearer ${sessionId}` } : {}),
        },
        body: data,
      });

      if (response.ok) {
        setModalVisible(false);
        fetchDevices();
        Alert.alert('成功', editingDevice ? '修改成功' : '创建成功');
      } else {
        throw new Error('保存失败');
      }
    } catch (error) {
      console.error('保存失败:', error);
      Alert.alert('错误', '保存失败');
    }
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status === statusFilter ? '' : status);
  };

  const handleTypeFilter = (type: string) => {
    setTypeFilter(type === typeFilter ? '' : type);
  };

  // 处理页面中所有图片加载错误（包括Coze平台代理图片）
  useEffect(() => {
    if (typeof document === 'undefined') return;

    // 为现有图片添加错误处理
    const setupImageErrorHandlers = () => {
      const imgElements = document.querySelectorAll('img');
      imgElements.forEach((img) => {
        if (!img.onerror) {
          img.onerror = () => {
            console.log('[设备管理] 图片加载失败，隐藏错误图片:', img.src);
            img.style.display = 'none';
          };
        }
      });
    };

    // 初始设置
    setupImageErrorHandlers();

    // 监听新添加的图片元素
    const observer = new MutationObserver(() => {
      setupImageErrorHandlers();
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
    };
  }, []);

  const handlePickImage = () => {
    photoInputRef.current?.click();
  };

  const handlePhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newPhotos: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const data = new FormData();
        data.append('file', file);

        const res = await fetch(`${API_BASE}/api/v1/upload/image`, {
          method: 'POST',
          body: data,
        });

        if (res.ok) {
          const result = await res.json();
          if (result.url) {
            newPhotos.push(result.url);
          }
        }
      }

      setSitePhotos(prev => [...prev, ...newPhotos]);
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
      if (photoInputRef.current) {
        photoInputRef.current.value = '';
      }
    }
  };

  const handleRemovePhoto = (index: number) => {
    const newPhotos = sitePhotos.filter((_, i) => i !== index);
    setSitePhotos(newPhotos);
  };

  const generateQRCode = () => {
    if (editingDevice) {
      setQrCode(`S${editingDevice.id}`);
    } else if (formData.device_number) {
      setQrCode(`S${formData.device_number}`);
    } else {
      Alert.alert('提示', '请先输入设备出厂编号');
    }
  };

  const filteredDevices = devices.filter(d => {
    const matchSearch = !searchText ||
      (d.device_name?.includes(searchText) || false) ||
      (d.device_number?.includes(searchText) || false) ||
      (d.customer_name?.includes(searchText) || false);
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
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity onPress={() => handleEdit(record)}>
            <Text style={styles.btnText}>编辑</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(record)}>
            <Text style={[styles.btnText, { color: '#FF4D4F' }]}>删除</Text>
          </TouchableOpacity>
        </View>
      ),
    },
  ];

  return (
    <PCLayout>
      <View className="pc-page-header">
        <Text className="pc-page-title">设备管理</Text>
        <Text className="pc-page-description">管理所有设备信息，包括设备类型、出厂日期、验收日期、质保到期、二维码ID等完整信息</Text>
      </View>

      <PCCard>
        <PCToolbar
          left={
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <PCSearchBar
                placeholder="搜索设备名称、编号或客户..."
                value={searchText}
                onChange={setSearchText}
                onSearch={handleSearch}
              />
              <View style={{ flexDirection: 'row', gap: 8, marginLeft: 16 }}>
                {Object.entries(statusMap).map(([key, { label }]) => (
                  <TouchableOpacity
                    key={key}
                    className={`pc-btn pc-btn-sm ${statusFilter === key ? 'pc-btn-primary' : 'pc-btn-default'}`}
                    onPress={() => handleStatusFilter(key)}
                  >
                    <Text style={[statusFilter === key && styles.btnPrimaryText, statusFilter !== key && styles.btnDefaultText]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          }
          right={
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {selectedRowKeys.length > 0 && (
                <TouchableOpacity className="pc-btn pc-btn-danger" onPress={handleBatchDelete}>
                  <Text style={styles.btnDangerText}>批量删除 ({selectedRowKeys.length})</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity className="pc-btn pc-btn-primary" onPress={handleAdd}>
                <Text style={styles.btnPrimaryText}>+ 新增设备</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ backgroundColor: '#E8F5E9', borderWidth: 1, borderColor: '#1E88E5' }}
                onPress={() => setImportModalVisible(true)}
              >
                <FontAwesome6 name="upload" size={14} style={{ marginRight: 6 }} />
                <Text style={{ color: '#1E88E5' }}>批量导入</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ backgroundColor: '#E8F5E9', borderWidth: 1, borderColor: '#1E88E5' }}
                onPress={handleExportDevices}
              >
                <FontAwesome6 name="download" size={14} style={{ marginRight: 6 }} />
                <Text style={{ color: '#1E88E5' }}>批量导出</Text>
              </TouchableOpacity>
            </View>
          }
        />

        <PCTable
          columns={columns}
          data={filteredDevices}
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

      {/* 编辑/新增弹窗 */}
      <PCModal
        visible={modalVisible}
        title={editingDevice ? '编辑设备' : '新增设备'}
        onClose={() => setModalVisible(false)}
        width={800}
        footer={
          <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'flex-end' }}>
            <TouchableOpacity className="pc-btn pc-btn-default" onPress={() => setModalVisible(false)}>
              <Text style={styles.btnDefaultText}>取消</Text>
            </TouchableOpacity>
            <TouchableOpacity className="pc-btn pc-btn-primary" onPress={handleSave}>
              <Text style={styles.btnPrimaryText}>保存</Text>
            </TouchableOpacity>
          </View>
        }
      >
        {/* 隐藏的文件输入框，用于选择图片 */}
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleImageChange}
        />

        <ScrollView style={{ maxHeight: 600 }}>
          {/* 基本信息 */}
          <View style={styles.formSection}>
            <Text style={styles.formSectionTitle}>基本信息</Text>
            <View style={styles.formRow}>
              <View style={styles.formCol}>
                <Text style={styles.formLabel}>
                  设备出厂编号 <Text style={{ color: '#ff4d4f' }}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="请输入设备出厂编号"
                  value={formData.device_number}
                  onChangeText={text => setFormData(prev => ({ ...prev, device_number: text }))}
                />
              </View>
              <View style={styles.formCol}>
                <Text style={styles.formLabel}>设备服务编号</Text>
                <TextInput
                  style={styles.input}
                  placeholder="请输入设备服务编号"
                  value={formData.service_number}
                  onChangeText={text => setFormData(prev => ({ ...prev, service_number: text }))}
                />
              </View>
            </View>
            <View style={styles.formRow}>
              <View style={styles.formCol}>
                <Text style={styles.formLabel}>
                  设备名称 <Text style={{ color: '#ff4d4f' }}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="请输入设备名称"
                  value={formData.device_name}
                  onChangeText={text => setFormData(prev => ({ ...prev, device_name: text }))}
                />
              </View>
              <View style={styles.formCol}>
                <Text style={styles.formLabel}>
                  设备型号 <Text style={{ color: '#ff4d4f' }}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="请输入设备型号"
                  value={formData.device_model}
                  onChangeText={text => setFormData(prev => ({ ...prev, device_model: text }))}
                />
              </View>
            </View>
            <View style={styles.formRow}>
              <View style={styles.formCol}>
                <Text style={styles.formLabel}>
                  设备类型 <Text style={{ color: '#ff4d4f' }}>*</Text>
                </Text>
                <TouchableOpacity
                  style={styles.input}
                  onPress={() => setShowDeviceTypeSelector(!showDeviceTypeSelector)}
                >
                  <View style={styles.selectTrigger}>
                    <Text style={formData.device_type ? styles.selectText : styles.selectPlaceholder}>
                      {formData.device_type || '请选择设备类型'}
                    </Text>
                    <FontAwesome6
                      name={showDeviceTypeSelector ? 'chevron-up' : 'chevron-down'}
                      size={14}
                      color="#95A5A6"
                    />
                  </View>
                </TouchableOpacity>
                {showDeviceTypeSelector && (
                  <View style={styles.dropdownMenu}>
                    {DEVICE_TYPES.map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={[styles.dropdownItem, formData.device_type === type && styles.dropdownItemSelected]}
                        onPress={() => {
                          setFormData(prev => ({ ...prev, device_type: type }));
                          setShowDeviceTypeSelector(false);
                        }}
                      >
                        <Text style={[styles.dropdownItemText, formData.device_type === type && styles.dropdownItemTextSelected]}>
                          {type}
                        </Text>
                        {formData.device_type === type && (
                          <FontAwesome6 name="check" size={14} color="#2ECC71" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
              <View style={styles.formCol}>
                <Text style={styles.formLabel}>
                  归属客户 <Text style={{ color: '#ff4d4f' }}>*</Text>
                </Text>
                <TouchableOpacity
                  style={styles.input}
                  onPress={() => setShowCustomerSelector(!showCustomerSelector)}
                >
                  <View style={styles.selectTrigger}>
                    <Text style={formData.customer_name ? styles.selectText : styles.selectPlaceholder}>
                      {formData.customer_name || '请选择或搜索客户名称'}
                    </Text>
                    <FontAwesome6
                      name={showCustomerSelector ? 'chevron-up' : 'chevron-down'}
                      size={14}
                      color="#95A5A6"
                    />
                  </View>
                </TouchableOpacity>
                {showCustomerSelector && (
                  <View style={styles.dropdownMenu}>
                    <View style={styles.searchContainer}>
                      <FontAwesome6 name="magnifying-glass" size={14} color="#95A5A6" />
                      <TextInput
                        style={styles.searchInput}
                        placeholder="搜索客户名称"
                        value={customerSearchKeyword}
                        onChangeText={setCustomerSearchKeyword}
                        placeholderTextColor="#95A5A6"
                      />
                    </View>
                    <ScrollView style={styles.dropdownList} nestedScrollEnabled>
                      {filteredCustomers.length === 0 ? (
                        <Text style={styles.noDataText}>未找到匹配的客户</Text>
                      ) : (
                        filteredCustomers.slice(0, 10).map((customer) => (
                          <TouchableOpacity
                            key={customer.id}
                            style={[styles.dropdownItem, formData.customer_name === customer.name && styles.dropdownItemSelected]}
                            onPress={() => {
                              setFormData(prev => ({ ...prev, customer_name: customer.name || '' }));
                              setShowCustomerSelector(false);
                              setCustomerSearchKeyword('');
                            }}
                          >
                            <View>
                              <Text style={[styles.dropdownItemText, formData.customer_name === customer.name && styles.dropdownItemTextSelected]}>
                                {customer.name || '未命名客户'}
                              </Text>
                              <Text style={styles.dropdownItemSub}>
                                联系人: {customer.contact_person || customer.contact || '无'}
                              </Text>
                            </View>
                            {formData.customer_name === customer.name && (
                              <FontAwesome6 name="check" size={14} color="#2ECC71" />
                            )}
                          </TouchableOpacity>
                        ))
                      )}
                    </ScrollView>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* 日期信息 */}
          <View style={styles.formSection}>
            <Text style={styles.formSectionTitle}>日期信息</Text>
            <View style={styles.formRow}>
              <View style={styles.formCol}>
                <Text style={styles.formLabel}>进厂日期</Text>
                <TextInput
                  style={styles.input}
                  placeholder="2024-01-01"
                  value={formData.factory_date}
                  onChangeText={text => setFormData(prev => ({ ...prev, factory_date: text }))}
                />
              </View>
              <View style={styles.formCol}>
                <Text style={styles.formLabel}>验收日期</Text>
                <TextInput
                  style={styles.input}
                  placeholder="2024-01-01"
                  value={formData.acceptance_date}
                  onChangeText={text => setFormData(prev => ({ ...prev, acceptance_date: text }))}
                />
              </View>
              <View style={styles.formCol}>
                <Text style={styles.formLabel}>质保到期日期</Text>
                <TextInput
                  style={styles.input}
                  placeholder="2025-01-01"
                  value={formData.warranty_end_date}
                  onChangeText={text => setFormData(prev => ({ ...prev, warranty_end_date: text }))}
                />
              </View>
            </View>
          </View>

          {/* 合同信息 */}
          <View style={styles.formSection}>
            <Text style={styles.formSectionTitle}>合同信息</Text>
            <View style={styles.formRow}>
              <View style={styles.formCol}>
                <Text style={styles.formLabel}>合同名称</Text>
                <TouchableOpacity
                  style={styles.input}
                  onPress={() => setShowContractSelector(!showContractSelector)}
                >
                  <View style={styles.selectTrigger}>
                    <Text style={formData.contract_name ? styles.selectText : styles.selectPlaceholder}>
                      {formData.contract_name || '请选择或搜索合同名称'}
                    </Text>
                    <FontAwesome6
                      name={showContractSelector ? 'chevron-up' : 'chevron-down'}
                      size={14}
                      color="#95A5A6"
                    />
                  </View>
                </TouchableOpacity>
                {showContractSelector && (
                  <View style={styles.dropdownMenu}>
                    <View style={styles.searchContainer}>
                      <FontAwesome6 name="magnifying-glass" size={14} color="#95A5A6" />
                      <TextInput
                        style={styles.searchInput}
                        placeholder="搜索合同名称或编号"
                        value={contractSearchKeyword}
                        onChangeText={setContractSearchKeyword}
                        placeholderTextColor="#95A5A6"
                      />
                    </View>
                    <ScrollView style={styles.dropdownList} nestedScrollEnabled>
                      {filteredContracts.length === 0 ? (
                        <Text style={styles.noDataText}>未找到匹配的合同</Text>
                      ) : (
                        filteredContracts.slice(0, 10).map((contract) => (
                          <TouchableOpacity
                            key={contract.id}
                            style={[styles.dropdownItem, formData.contract_name === (contract.title || contract.contract_name) && styles.dropdownItemSelected]}
                            onPress={() => {
                              setFormData(prev => ({
                                ...prev,
                                contract_name: contract.title || contract.contract_name || '',
                                contract_number: contract.contract_no || '',
                              }));
                              setShowContractSelector(false);
                              setContractSearchKeyword('');
                            }}
                          >
                            <View>
                              <Text style={[styles.dropdownItemText, formData.contract_name === (contract.title || contract.contract_name) && styles.dropdownItemTextSelected]}>
                                {contract.title || contract.contract_name || '未命名合同'}
                              </Text>
                              <Text style={styles.dropdownItemSub}>
                                编号: {contract.contract_no || '无'} | 客户: {contract.customer_name || '无'}
                              </Text>
                            </View>
                            {formData.contract_name === (contract.title || contract.contract_name) && (
                              <FontAwesome6 name="check" size={14} color="#2ECC71" />
                            )}
                          </TouchableOpacity>
                        ))
                      )}
                    </ScrollView>
                  </View>
                )}
              </View>
              <View style={styles.formCol}>
                <Text style={styles.formLabel}>合同编号</Text>
                <TextInput
                  style={styles.input}
                  placeholder="请输入或选择合同编号"
                  value={formData.contract_number}
                  onChangeText={text => setFormData(prev => ({ ...prev, contract_number: text }))}
                />
              </View>
            </View>
          </View>

          {/* 位置与备注 */}
          <View style={styles.formSection}>
            <Text style={styles.formSectionTitle}>位置与备注</Text>
            <View style={styles.formRow}>
              <View style={styles.formCol}>
                <Text style={styles.formLabel}>设备所在位置</Text>
                <TextInput
                  style={[styles.input, styles.textarea]}
                  placeholder="请输入设备位置说明"
                  value={formData.location}
                  onChangeText={text => setFormData(prev => ({ ...prev, location: text }))}
                  multiline
                  numberOfLines={2}
                  textAlignVertical="top"
                />
              </View>
            </View>
            <View style={styles.formRow}>
              <View style={styles.formColFull}>
                <Text style={styles.formLabel}>备注</Text>
                <TextInput
                  style={[styles.input, styles.textarea]}
                  placeholder="请输入备注信息"
                  value={formData.remarks}
                  onChangeText={text => setFormData(prev => ({ ...prev, remarks: text }))}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
            </View>
          </View>

          {/* 设备现场照片 */}
          <View style={styles.formSection}>
            <Text style={styles.formSectionTitle}>设备现场照片</Text>
            <View style={styles.photoContainer}>
              {sitePhotos.map((photoUri, index) => (
                <View key={index} style={styles.photoItem}>
                  <Image 
                    source={{ uri: photoUri }} 
                    style={styles.photoPreview}
                    onError={(e) => console.log('[设备照片] 加载失败:', photoUri, e.nativeEvent.error)}
                  />
                  <TouchableOpacity
                    style={styles.photoRemoveButton}
                    onPress={() => handleRemovePhoto(index)}
                  >
                    <FontAwesome6 name="xmark" size={12} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ))}
              {sitePhotos.length < 5 && (
                <TouchableOpacity
                  style={styles.photoAddButton}
                  onPress={handlePickImage}
                >
                  <FontAwesome6 name="image" size={24} color="#1E88E5" />
                  <Text style={styles.photoAddButtonText}>选择照片</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* 设备二维码 */}
          <View style={styles.formSection}>
            <Text style={styles.formSectionTitle}>设备二维码</Text>
            <View style={styles.qrCodeContainer}>
              {qrCode ? (
                <View style={styles.qrCodeDisplay}>
                  <FontAwesome6 name="qrcode" size={80} color="#2D3436" />
                  <Text style={styles.qrCodeValue}>{qrCode}</Text>
                  <Text style={styles.qrCodeHint}>扫码可查看设备详情</Text>
                </View>
              ) : (
                <View style={styles.qrCodePlaceholder}>
                  <FontAwesome6 name="qrcode" size={60} color="#B2BEC3" />
                  <Text style={styles.qrCodePlaceholderText}>点击生成二维码</Text>
                </View>
              )}
            </View>
            {!qrCode && (
              <TouchableOpacity
                style={styles.generateQrButton}
                onPress={generateQRCode}
              >
                <FontAwesome6 name="rotate" size={16} color="#FFFFFF" />
                <Text style={styles.generateQrButtonText}>生成二维码</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </PCModal>

      {/* 批量导入弹窗 */}
      <PCImportModal
        visible={importModalVisible}
        title="批量导入设备"
        onClose={() => setImportModalVisible(false)}
        templateUrl={`${API_BASE}/api/v1/devices/template`}
        importApiUrl={`${API_BASE}/api/v1/devices/import`}
        onSuccess={() => {
          setImportModalVisible(false);
          fetchDevices();
        }}
      />
    </PCLayout>
  );
}

const styles = StyleSheet.create({
  btnText: {
    fontSize: 13,
    color: '#1E88E5',
  },
  btnPrimaryText: {
    color: '#fff',
    fontSize: 13,
  },
  btnDefaultText: {
    color: '#333',
    fontSize: 13,
  },
  btnDangerText: {
    color: '#fff',
    fontSize: 13,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d9d9d9',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  textarea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  formRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  formCol: {
    flex: 1,
  },
  formColFull: {
    flex: 1,
  },
  formLabel: {
    fontSize: 13,
    color: '#333',
    marginBottom: 6,
    fontWeight: 500,
  },
  formSection: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  formSectionTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: '#1E88E5',
    marginBottom: 12,
  },
  selectTrigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectText: {
    fontSize: 14,
    color: '#333',
  },
  selectPlaceholder: {
    fontSize: 14,
    color: '#B2BEC3',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 44,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d9d9d9',
    borderRadius: 6,
    zIndex: 1000,
    maxHeight: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    padding: 0,
  },
  dropdownList: {
    maxHeight: 250,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  dropdownItemSelected: {
    backgroundColor: '#E6F7FF',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#333',
  },
  dropdownItemTextSelected: {
    color: '#1E88E5',
    fontWeight: 500,
  },
  dropdownItemSub: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  noDataText: {
    padding: 12,
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
  },
  photoContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  photoItem: {
    position: 'relative',
    width: 100,
    height: 100,
  },
  photoPreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  photoRemoveButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FF4D4F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoAddButton: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1E88E5',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F9FF',
  },
  photoAddButtonText: {
    fontSize: 12,
    color: '#1E88E5',
    marginTop: 4,
  },
  qrCodeContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  qrCodeDisplay: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
  },
  qrCodeValue: {
    fontSize: 14,
    fontWeight: 600,
    color: '#333',
    marginTop: 8,
  },
  qrCodeHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  qrCodePlaceholder: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    width: '100%',
  },
  qrCodePlaceholderText: {
    fontSize: 13,
    color: '#B2BEC3',
    marginTop: 8,
  },
  generateQrButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#1E88E5',
    borderRadius: 6,
    marginTop: 12,
  },
  generateQrButtonText: {
    fontSize: 14,
    color: '#fff',
    marginLeft: 6,
  },
});
