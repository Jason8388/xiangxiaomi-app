import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { FontAwesome6 } from '@expo/vector-icons';
import { useSafeRouter } from '@/hooks/useSafeRouter';

const API_BASE = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || 'http://localhost:9091';

const DEVICE_TYPES = [
  '智能测温',
  '智能焊接',
  '智能测量',
  '外观品检',
  '尺寸测量',
  '角度定位',
  '数字化产品',
  '第三方设备',
  '其它',
];

interface Device {
  id: number;
  device_number: string;
  device_name: string;
  device_model: string;
  device_type: string;
  customer_name: string;
  factory_date: string;
  acceptance_date?: string;
  warranty_end_date?: string;
  status: string;
  contract_name?: string;
  qr_code_id?: string;
  location?: string;
  remarks?: string;
  service_number?: string;
  site_photos?: string[];
}

export default function PCDevices() {
  const router = useSafeRouter();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [deletingDevice, setDeletingDevice] = useState<Device | null>(null);
  const imageInputRef = useRef<any>(null);

  // 表单数据
  const [formData, setFormData] = useState({
    device_number: '',
    device_name: '',
    device_model: '',
    device_type: '',
    customer_name: '',
    factory_date: '',
    acceptance_date: '',
    warranty_end_date: '',
    contract_name: '',
    location: '',
    remarks: '',
    service_number: '',
  });

  // 客户列表
  const [customerList, setCustomerList] = useState<any[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerSelectorVisible, setCustomerSelectorVisible] = useState(false);
  const [filteredCustomers, setFilteredCustomers] = useState<any[]>([]);

  // 合同列表
  const [contractList, setContractList] = useState<any[]>([]);
  const [contractSearch, setContractSearch] = useState('');
  const [contractSelectorVisible, setContractSelectorVisible] = useState(false);
  const [filteredContracts, setFilteredContracts] = useState<any[]>([]);

  // 设备类型选择器
  const [deviceTypeSelectorVisible, setDeviceTypeSelectorVisible] = useState(false);

  // 搜索
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filteredDevices, setFilteredDevices] = useState<Device[]>([]);
  const [deviceTypeFilter, setDeviceTypeFilter] = useState('');
  const [deviceTypeFilterVisible, setDeviceTypeFilterVisible] = useState(false);

  const fetchDevices = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/v1/devices`);
      const data = await response.json();
      if (response.ok) {
        const list = Array.isArray(data) ? data : (data.data || []);
        setDevices(list);
        setFilteredDevices(list);
      }
    } catch (error) {
      console.error('Fetch devices error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCustomers = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/v1/customers`);
      const data = await response.json();
      if (response.ok) {
        const list = Array.isArray(data) ? data : (data.data || []);
        setCustomerList(list);
        setFilteredCustomers(list);
      }
    } catch (error) {
      console.error('Fetch customers error:', error);
    }
  }, []);

  const fetchContracts = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/v1/contracts`);
      const data = await response.json();
      if (response.ok) {
        const list = Array.isArray(data) ? data : (data.data || []);
        setContractList(list);
        setFilteredContracts(list);
      }
    } catch (error) {
      console.error('Fetch contracts error:', error);
    }
  }, []);

  useEffect(() => {
    fetchDevices();
    fetchCustomers();
    fetchContracts();
  }, [fetchDevices, fetchCustomers, fetchContracts]);

  // 搜索过滤
  useEffect(() => {
    let filtered = devices;
    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase();
      filtered = filtered.filter(d =>
        d.device_name.toLowerCase().includes(keyword) ||
        d.device_model.toLowerCase().includes(keyword) ||
        d.device_number.toLowerCase().includes(keyword) ||
        d.customer_name.toLowerCase().includes(keyword)
      );
    }
    if (deviceTypeFilter) {
      filtered = filtered.filter(d => d.device_type === deviceTypeFilter);
    }
    setFilteredDevices(filtered);
  }, [searchKeyword, deviceTypeFilter, devices]);

  // 客户搜索
  useEffect(() => {
    if (customerSearch) {
      const keyword = customerSearch.toLowerCase();
      setFilteredCustomers(customerList.filter(c => 
        (c.name || '').toLowerCase().includes(keyword)
      ));
    } else {
      setFilteredCustomers(customerList);
    }
  }, [customerSearch, customerList]);

  // 合同搜索
  useEffect(() => {
    if (contractSearch) {
      const keyword = contractSearch.toLowerCase();
      setFilteredContracts(contractList.filter(c => 
        (c.title || c.contract_name || '').toLowerCase().includes(keyword) ||
        (c.contract_no || '').toLowerCase().includes(keyword)
      ));
    } else {
      setFilteredContracts(contractList);
    }
  }, [contractSearch, contractList]);

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
      contract_name: '',
      location: '',
      remarks: '',
      service_number: '',
    });
    setModalVisible(true);
  };

  const handleEdit = (device: Device) => {
    setEditingDevice(device);
    setFormData({
      device_number: device.device_number || '',
      device_name: device.device_name || '',
      device_model: device.device_model || '',
      device_type: device.device_type || '',
      customer_name: device.customer_name || '',
      factory_date: device.factory_date || '',
      acceptance_date: device.acceptance_date || '',
      warranty_end_date: device.warranty_end_date || '',
      contract_name: device.contract_name || '',
      location: device.location || '',
      remarks: device.remarks || '',
      service_number: device.service_number || '',
    });
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setEditingDevice(null);
    setDeviceTypeSelectorVisible(false);
    setCustomerSelectorVisible(false);
    setContractSelectorVisible(false);
  };

  const handleSave = async () => {
    if (!formData.device_number || !formData.device_name || !formData.device_type) {
      Alert.alert('提示', '设备出厂编号、设备名称和设备类型不能为空');
      return;
    }

    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key as keyof typeof formData]) {
          data.append(key, formData[key as keyof typeof formData]);
        }
      });

      const deviceId = editingDevice ? editingDevice.id : `temp_${Date.now()}`;
      data.append('qr_code', `S${deviceId}`);

      const url = editingDevice
        ? `${API_BASE}/api/v1/devices/${editingDevice.id}`
        : `${API_BASE}/api/v1/devices`;

      const response = await fetch(url, {
        method: editingDevice ? 'PUT' : 'POST',
        body: data,
      });

      const result = await response.json();

      if (response.ok) {
        Alert.alert('成功', editingDevice ? '修改成功' : '创建成功');
        handleCloseModal();
        fetchDevices();
      } else {
        throw new Error(result.error || '操作失败');
      }
    } catch (error: any) {
      Alert.alert('错误', error.message);
    }
  };

  const handleDelete = (device: Device) => {
    setDeletingDevice(device);
    setDeleteConfirmVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingDevice) return;

    try {
      const response = await fetch(`${API_BASE}/api/v1/devices/${deletingDevice.id}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (response.ok) {
        setDeleteConfirmVisible(false);
        setDeletingDevice(null);
        fetchDevices();
      } else {
        throw new Error(result.error || '删除失败');
      }
    } catch (error: any) {
      Alert.alert('错误', error.message);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return '#27AE60';
      case 'idle': return '#F39C12';
      case 'maintenance': return '#3498DB';
      default: return '#95A5A6';
    }
  };

  return (
    <Screen>
      <View style={styles.container}>
        {/* 标题栏 */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <FontAwesome6 name="microchip" size={24} color="#1E88E5" />
            <Text style={styles.headerTitle}>设备管理</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.deviceCount}>设备总数: {devices.length}</Text>
          </View>
        </View>

        {/* 搜索和筛选 */}
        <View style={styles.toolbar}>
          <View style={styles.searchBox}>
            <FontAwesome6 name="magnifying-glass" size={16} color="#95A5A6" />
            <TextInput
              style={styles.searchInput}
              placeholder="搜索设备名称、型号、编号、客户"
              value={searchKeyword}
              onChangeText={setSearchKeyword}
              placeholderTextColor="#95A5A6"
            />
          </View>
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => setDeviceTypeFilterVisible(!deviceTypeFilterVisible)}
          >
            <FontAwesome6 name="filter" size={16} color="#636E72" />
            <Text style={styles.filterButtonText}>
              {deviceTypeFilter || '全部设备类型'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
            <FontAwesome6 name="plus" size={16} color="#FFFFFF" />
            <Text style={styles.addButtonText}>新增设备</Text>
          </TouchableOpacity>
        </View>

        {/* 设备类型筛选下拉 */}
        {deviceTypeFilterVisible && (
          <View style={styles.filterDropdown}>
            <TouchableOpacity
              style={[styles.filterItem, !deviceTypeFilter && styles.filterItemActive]}
              onPress={() => {
                setDeviceTypeFilter('');
                setDeviceTypeFilterVisible(false);
              }}
            >
              <Text style={[styles.filterItemText, !deviceTypeFilter && styles.filterItemTextActive]}>
                全部
              </Text>
            </TouchableOpacity>
            {DEVICE_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.filterItem, deviceTypeFilter === type && styles.filterItemActive]}
                onPress={() => {
                  setDeviceTypeFilter(deviceTypeFilter === type ? '' : type);
                  setDeviceTypeFilterVisible(false);
                }}
              >
                <Text style={[styles.filterItemText, deviceTypeFilter === type && styles.filterItemTextActive]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* 设备列表 */}
        <ScrollView style={styles.listContainer}>
          {loading ? (
            <View style={styles.centerContainer}>
              <Text style={styles.loadingText}>加载中...</Text>
            </View>
          ) : filteredDevices.length === 0 ? (
            <View style={styles.centerContainer}>
              <FontAwesome6 name="box-open" size={48} color="#BDC3C7" />
              <Text style={styles.emptyText}>
                {searchKeyword || deviceTypeFilter ? '未找到匹配的设备' : '暂无设备信息'}
              </Text>
            </View>
          ) : (
            filteredDevices.map((device) => (
              <View key={device.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardTitleRow}>
                    <FontAwesome6 name="microchip" size={20} color="#2ECC71" />
                    <Text style={styles.cardTitle}>{device.device_name}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(device.status) }]}>
                      <Text style={styles.statusText}>{device.status || '未知'}</Text>
                    </View>
                  </View>
                  <View style={styles.cardTypeTag}>
                    <Text style={styles.cardTypeText}>{device.device_type}</Text>
                  </View>
                </View>

                <View style={styles.cardBody}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>设备编号:</Text>
                    <Text style={styles.infoValue}>{device.device_number || '-'}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>设备型号:</Text>
                    <Text style={styles.infoValue}>{device.device_model || '-'}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>归属客户:</Text>
                    <Text style={styles.infoValue}>{device.customer_name || '-'}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>服务编号:</Text>
                    <Text style={styles.infoValue}>{device.service_number || '-'}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>进厂日期:</Text>
                    <Text style={styles.infoValue}>{formatDate(device.factory_date)}</Text>
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => handleEdit(device)}
                  >
                    <FontAwesome6 name="pen" size={14} color="#F39C12" />
                    <Text style={styles.editButtonText}>修改</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDelete(device)}
                  >
                    <FontAwesome6 name="trash" size={14} color="#E74C3C" />
                    <Text style={styles.deleteButtonText}>删除</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>

        {/* 新增/编辑 Modal */}
        <Modal
          visible={modalVisible}
          transparent
          animationType="slide"
          onRequestClose={handleCloseModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editingDevice ? '编辑设备' : '新增设备'}
                </Text>
                <TouchableOpacity onPress={handleCloseModal}>
                  <FontAwesome6 name="xmark" size={20} color="#636E72" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>设备出厂编号 *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="请输入设备出厂编号"
                    value={formData.device_number}
                    onChangeText={(text) => setFormData({ ...formData, device_number: text })}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>服务编号</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="请输入服务编号"
                    value={formData.service_number}
                    onChangeText={(text) => setFormData({ ...formData, service_number: text })}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>设备名称 *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="请输入设备名称"
                    value={formData.device_name}
                    onChangeText={(text) => setFormData({ ...formData, device_name: text })}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>设备型号 *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="请输入设备型号"
                    value={formData.device_model}
                    onChangeText={(text) => setFormData({ ...formData, device_model: text })}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>设备类型 *</Text>
                  <TouchableOpacity
                    style={styles.dropdown}
                    onPress={() => setDeviceTypeSelectorVisible(!deviceTypeSelectorVisible)}
                  >
                    <Text style={formData.device_type ? styles.dropdownText : styles.dropdownPlaceholder}>
                      {formData.device_type || '请选择设备类型'}
                    </Text>
                    <FontAwesome6
                      name={deviceTypeSelectorVisible ? 'chevron-up' : 'chevron-down'}
                      size={14}
                      color="#95A5A6"
                    />
                  </TouchableOpacity>
                  {deviceTypeSelectorVisible && (
                    <View style={styles.dropdownMenu}>
                      {DEVICE_TYPES.map((type) => (
                        <TouchableOpacity
                          key={type}
                          style={[styles.dropdownItem, formData.device_type === type && styles.dropdownItemSelected]}
                          onPress={() => {
                            setFormData({ ...formData, device_type: type });
                            setDeviceTypeSelectorVisible(false);
                          }}
                        >
                          <Text style={[styles.dropdownItemText, formData.device_type === type && styles.dropdownItemTextSelected]}>
                            {type}
                          </Text>
                          {formData.device_type === type && (
                            <FontAwesome6 name="check" size={16} color="#2ECC71" />
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>归属客户 *</Text>
                  <TouchableOpacity
                    style={styles.dropdown}
                    onPress={() => setCustomerSelectorVisible(!customerSelectorVisible)}
                  >
                    <Text style={formData.customer_name ? styles.dropdownText : styles.dropdownPlaceholder}>
                      {formData.customer_name || '请选择客户'}
                    </Text>
                    <FontAwesome6
                      name={customerSelectorVisible ? 'chevron-up' : 'chevron-down'}
                      size={14}
                      color="#95A5A6"
                    />
                  </TouchableOpacity>
                  {customerSelectorVisible && (
                    <View style={styles.dropdownMenu}>
                      <View style={styles.dropdownSearch}>
                        <FontAwesome6 name="magnifying-glass" size={14} color="#95A5A6" />
                        <TextInput
                          style={styles.dropdownSearchInput}
                          placeholder="搜索客户名称"
                          value={customerSearch}
                          onChangeText={setCustomerSearch}
                        />
                      </View>
                      <ScrollView style={styles.dropdownList}>
                        {filteredCustomers.slice(0, 10).map((customer) => (
                          <TouchableOpacity
                            key={customer.id}
                            style={[styles.dropdownItem, formData.customer_name === customer.name && styles.dropdownItemSelected]}
                            onPress={() => {
                              setFormData({ ...formData, customer_name: customer.name || '' });
                              setCustomerSelectorVisible(false);
                            }}
                          >
                            <Text style={formData.customer_name === customer.name ? styles.dropdownItemTextSelected : styles.dropdownItemText}>
                              {customer.name || '未命名客户'}
                            </Text>
                            {formData.customer_name === customer.name && (
                              <FontAwesome6 name="check" size={16} color="#2ECC71" />
                            )}
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>

                <View style={styles.formRow}>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.formLabel}>进厂日期</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="格式: 2024-01-01"
                      value={formData.factory_date}
                      onChangeText={(text) => setFormData({ ...formData, factory_date: text })}
                    />
                  </View>
                  <View style={{ width: 16 }} />
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.formLabel}>验收日期</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="格式: 2024-01-01"
                      value={formData.acceptance_date}
                      onChangeText={(text) => setFormData({ ...formData, acceptance_date: text })}
                    />
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>质保到期日期</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="格式: 2024-01-01"
                    value={formData.warranty_end_date}
                    onChangeText={(text) => setFormData({ ...formData, warranty_end_date: text })}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>合同名称</Text>
                  <TouchableOpacity
                    style={styles.dropdown}
                    onPress={() => setContractSelectorVisible(!contractSelectorVisible)}
                  >
                    <Text style={formData.contract_name ? styles.dropdownText : styles.dropdownPlaceholder}>
                      {formData.contract_name || '请选择合同'}
                    </Text>
                    <FontAwesome6
                      name={contractSelectorVisible ? 'chevron-up' : 'chevron-down'}
                      size={14}
                      color="#95A5A6"
                    />
                  </TouchableOpacity>
                  {contractSelectorVisible && (
                    <View style={styles.dropdownMenu}>
                      <View style={styles.dropdownSearch}>
                        <FontAwesome6 name="magnifying-glass" size={14} color="#95A5A6" />
                        <TextInput
                          style={styles.dropdownSearchInput}
                          placeholder="搜索合同名称"
                          value={contractSearch}
                          onChangeText={setContractSearch}
                        />
                      </View>
                      <ScrollView style={styles.dropdownList}>
                        {filteredContracts.slice(0, 10).map((contract) => (
                          <TouchableOpacity
                            key={contract.id}
                            style={[styles.dropdownItem, formData.contract_name === (contract.title || contract.contract_name) && styles.dropdownItemSelected]}
                            onPress={() => {
                              setFormData({ ...formData, contract_name: contract.title || contract.contract_name || '' });
                              setContractSelectorVisible(false);
                            }}
                          >
                            <Text style={formData.contract_name === (contract.title || contract.contract_name) ? styles.dropdownItemTextSelected : styles.dropdownItemText}>
                              {contract.title || contract.contract_name || '未命名合同'}
                            </Text>
                            {formData.contract_name === (contract.title || contract.contract_name) && (
                              <FontAwesome6 name="check" size={16} color="#2ECC71" />
                            )}
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>设备位置</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="请输入设备位置"
                    value={formData.location}
                    onChangeText={(text) => setFormData({ ...formData, location: text })}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>备注</Text>
                  <TextInput
                    style={[styles.formInput, styles.formTextArea]}
                    placeholder="请输入备注信息"
                    value={formData.remarks}
                    onChangeText={(text) => setFormData({ ...formData, remarks: text })}
                    multiline
                    numberOfLines={3}
                  />
                </View>
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity style={styles.cancelButton} onPress={handleCloseModal}>
                  <Text style={styles.cancelButtonText}>取消</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                  <Text style={styles.saveButtonText}>保存</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* 删除确认 Modal */}
        <Modal
          visible={deleteConfirmVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setDeleteConfirmVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.confirmModal}>
              <FontAwesome6 name="exclamation-triangle" size={48} color="#E74C3C" />
              <Text style={styles.confirmTitle}>确认删除</Text>
              <Text style={styles.confirmText}>
                确定要删除设备 "{deletingDevice?.device_name}" 吗？此操作不可撤销。
              </Text>
              <View style={styles.confirmButtons}>
                <TouchableOpacity
                  style={styles.confirmCancelButton}
                  onPress={() => setDeleteConfirmVisible(false)}
                >
                  <Text style={styles.confirmCancelText}>取消</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.confirmDeleteButton}
                  onPress={handleConfirmDelete}
                >
                  <Text style={styles.confirmDeleteText}>删除</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deviceCount: {
    fontSize: 14,
    color: '#636E72',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    gap: 12,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F6FA',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#2C3E50',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F6FA',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    gap: 6,
  },
  filterButtonText: {
    fontSize: 14,
    color: '#636E72',
  },
  filterDropdown: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  filterItem: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F5F6FA',
  },
  filterItemActive: {
    backgroundColor: '#1E88E5',
  },
  filterItemText: {
    fontSize: 13,
    color: '#636E72',
  },
  filterItemTextActive: {
    color: '#FFFFFF',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#27AE60',
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 40,
    gap: 6,
  },
  addButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#636E72',
  },
  emptyText: {
    fontSize: 16,
    color: '#BDC3C7',
    marginTop: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  cardTypeTag: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#E8F4FD',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  cardTypeText: {
    fontSize: 12,
    color: '#1E88E5',
  },
  cardBody: {
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#95A5A6',
    width: 90,
  },
  infoValue: {
    fontSize: 14,
    color: '#2C3E50',
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 12,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#FEF9E7',
    gap: 6,
  },
  editButtonText: {
    fontSize: 14,
    color: '#F39C12',
    fontWeight: '500',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#FDEDEC',
    gap: 6,
  },
  deleteButtonText: {
    fontSize: 14,
    color: '#E74C3C',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 600,
    maxHeight: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  modalBody: {
    padding: 20,
    maxHeight: 400,
  },
  formGroup: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
    gap: 16,
  },
  formLabel: {
    fontSize: 14,
    color: '#2C3E50',
    marginBottom: 8,
    fontWeight: '500',
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#2C3E50',
    backgroundColor: '#FAFAFA',
  },
  formTextArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FAFAFA',
  },
  dropdownText: {
    fontSize: 14,
    color: '#2C3E50',
  },
  dropdownPlaceholder: {
    fontSize: 14,
    color: '#BDC3C7',
  },
  dropdownMenu: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    maxHeight: 200,
  },
  dropdownSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    gap: 8,
  },
  dropdownSearchInput: {
    flex: 1,
    fontSize: 14,
    color: '#2C3E50',
  },
  dropdownList: {
    maxHeight: 160,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F6FA',
  },
  dropdownItemSelected: {
    backgroundColor: '#E8F4FD',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#2C3E50',
  },
  dropdownItemTextSelected: {
    fontSize: 14,
    color: '#1E88E5',
    fontWeight: '500',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
    gap: 12,
  },
  cancelButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F5F6FA',
  },
  cancelButtonText: {
    fontSize: 14,
    color: '#636E72',
    fontWeight: '500',
  },
  saveButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#27AE60',
  },
  saveButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  confirmModal: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginTop: 16,
    marginBottom: 8,
  },
  confirmText: {
    fontSize: 14,
    color: '#636E72',
    textAlign: 'center',
    marginBottom: 24,
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  confirmCancelButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F5F6FA',
  },
  confirmCancelText: {
    fontSize: 14,
    color: '#636E72',
    fontWeight: '500',
  },
  confirmDeleteButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#E74C3C',
  },
  confirmDeleteText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
});
