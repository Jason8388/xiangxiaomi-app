import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
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
  const [importModalVisible, setImportModalVisible] = useState(false);
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

  const fetchDevices = useCallback(async () => {
    setLoading(true);
    try {
      const sessionId = await storage.getItem('session_id');
      const response = await fetch(`${API_BASE}/api/v1/devices`, {
        headers: sessionId ? { Authorization: `Bearer ${sessionId}` } : {},
      });
      const data = await response.json();
      // 与APP端保持一致的数据解析逻辑
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
    if (!formData.device_number || !formData.device_name) {
      Alert.alert('错误', '设备编号和设备名称不能为空');
      return;
    }

    try {
      const sessionId = await storage.getItem('session_id');
      const url = editingDevice
        ? `${API_BASE}/api/v1/devices/${editingDevice.id}`
        : `${API_BASE}/api/v1/devices`;
      const method = editingDevice ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(sessionId ? { Authorization: `Bearer ${sessionId}` } : {}),
        },
        body: JSON.stringify(formData),
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
                onPress={() => {
                  Alert.alert('提示', '导入功能正在开发中');
                }}
              >
                <FontAwesome6 name="upload" size={14} style={{ marginRight: 6 }} />
                <Text style={{ color: '#1E88E5' }}>批量导入</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ backgroundColor: '#E8F5E9', borderWidth: 1, borderColor: '#1E88E5' }}
                onPress={() => {
                  Alert.alert('提示', '导出功能正在开发中');
                }}
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
        width={700}
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
        <ScrollView style={{ maxHeight: 500 }}>
          <View style={styles.formRow}>
            <View style={styles.formCol}>
              <Text style={styles.formLabel}>
                设备编号 <Text style={{ color: '#ff4d4f' }}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="请输入设备编号"
                value={formData.device_number}
                onChangeText={text => setFormData(prev => ({ ...prev, device_number: text }))}
              />
            </View>
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
          </View>
          <View style={styles.formRow}>
            <View style={styles.formCol}>
              <Text style={styles.formLabel}>设备型号</Text>
              <TextInput
                style={styles.input}
                placeholder="请输入设备型号"
                value={formData.device_model}
                onChangeText={text => setFormData(prev => ({ ...prev, device_model: text }))}
              />
            </View>
            <View style={styles.formCol}>
              <Text style={styles.formLabel}>设备类型</Text>
              <TextInput
                style={styles.input}
                placeholder="请输入设备类型"
                value={formData.device_type}
                onChangeText={text => setFormData(prev => ({ ...prev, device_type: text }))}
              />
            </View>
          </View>
          <View style={styles.formRow}>
            <View style={styles.formCol}>
              <Text style={styles.formLabel}>所属客户</Text>
              <TextInput
                style={styles.input}
                placeholder="请输入所属客户"
                value={formData.customer_name}
                onChangeText={text => setFormData(prev => ({ ...prev, customer_name: text }))}
              />
            </View>
          </View>
          <View style={styles.formRow}>
            <View style={styles.formCol}>
              <Text style={styles.formLabel}>出厂日期</Text>
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
              <Text style={styles.formLabel}>质保到期</Text>
              <TextInput
                style={styles.input}
                placeholder="2025-01-01"
                value={formData.warranty_end_date}
                onChangeText={text => setFormData(prev => ({ ...prev, warranty_end_date: text }))}
              />
            </View>
          </View>
          <View style={styles.formRow}>
            <View style={styles.formCol}>
              <Text style={styles.formLabel}>关联合同</Text>
              <TextInput
                style={styles.input}
                placeholder="请输入关联合同"
                value={formData.contract_name}
                onChangeText={text => setFormData(prev => ({ ...prev, contract_name: text }))}
              />
            </View>
            <View style={styles.formCol}>
              <Text style={styles.formLabel}>二维码ID</Text>
              <TextInput
                style={styles.input}
                placeholder="请输入二维码ID"
                value={formData.qr_code_id}
                onChangeText={text => setFormData(prev => ({ ...prev, qr_code_id: text }))}
              />
            </View>
          </View>
          <View style={styles.formRow}>
            <View style={styles.formCol}>
              <Text style={styles.formLabel}>安装位置</Text>
              <TextInput
                style={styles.input}
                placeholder="请输入安装位置"
                value={formData.location}
                onChangeText={text => setFormData(prev => ({ ...prev, location: text }))}
              />
            </View>
            <View style={styles.formCol}>
              <Text style={styles.formLabel}>服务编号</Text>
              <TextInput
                style={styles.input}
                placeholder="请输入服务编号"
                value={formData.service_number}
                onChangeText={text => setFormData(prev => ({ ...prev, service_number: text }))}
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
});
