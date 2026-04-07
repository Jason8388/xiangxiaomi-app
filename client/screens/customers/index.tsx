import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  StyleSheet,
  FlatList,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { PageHeader } from '@/components/PageHeader';
import { FontAwesome6 } from '@expo/vector-icons';
import { getApiBaseUrl } from '@/utils/api';
import { useSafeRouter } from '@/hooks/useSafeRouter';

interface Customer {
  id: number;
  name: string;
  address?: string;
  industry?: string;
  contact_person?: string;
  contact_phone?: string;
  business_manager?: string;
  service_department?: string;
  sub_group?: string;
  device_count: number;
  contract_count: number;
  work_order_count: number;
  remarks?: string;
}

interface AddressItem {
  id: string;
  value: string;
}

interface ContactPerson {
  id: string;
  name: string;
  phone: string;
  position: string;
}

export default function CustomerManagement() {
  const router = useSafeRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [addresses, setAddresses] = useState<AddressItem[]>([]);
  const [contacts, setContacts] = useState<ContactPerson[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    contact_person: '',
    contact_phone: '',
    business_manager: '',
    sub_group: '',
    remarks: '',
  });

  // 服务看管部门选项
  const serviceDepartmentOptions = ['技术服务一组', '技术服务二组', '技术服务三组'];
  const [serviceDeptModalVisible, setServiceDeptModalVisible] = useState(false);
  const [subGroupModalVisible, setSubGroupModalVisible] = useState(false);

  // 获取客户列表
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${getApiBaseUrl()}/api/v1/customers`);
      const data = await response.json();
      if (response.ok) {
        const list = Array.isArray(data) ? data : (data.data || []);
        const sorted = list.sort((a: Customer, b: Customer) => {
          const nameA = a.name.toUpperCase();
          const nameB = b.name.toUpperCase();
          return nameA.localeCompare(nameB);
        });
        setCustomers(sorted);
        setFilteredCustomers(sorted);
      }
    } catch (error) {
      console.error('Fetch customers error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // 搜索过滤
  useEffect(() => {
    if (searchKeyword.trim()) {
      const filtered = customers.filter(
        (c) =>
          c.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
          (c.business_manager &&
            c.business_manager.toLowerCase().includes(searchKeyword.toLowerCase()))
      );
      setFilteredCustomers(filtered);
    } else {
      setFilteredCustomers(customers);
    }
  }, [searchKeyword, customers]);

  const handleAdd = () => {
    setEditingCustomer(null);
    setFormData({
      name: '',
      industry: '',
      contact_person: '',
      contact_phone: '',
      business_manager: '',
      sub_group: '',
      remarks: '',
    });
    setAddresses([{ id: Date.now().toString(), value: '' }]);
    setContacts([{ id: Date.now().toString(), name: '', phone: '', position: '' }]);
    setModalVisible(true);
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      industry: customer.industry || '',
      contact_person: customer.contact_person || '',
      contact_phone: customer.contact_phone || '',
      business_manager: customer.business_manager || '',
      sub_group: customer.sub_group || '',
      remarks: customer.remarks || '',
    });

    // 解析地址数组
    let addressItems: AddressItem[] = [];
    if (customer.address) {
      try {
        const parsed = JSON.parse(customer.address);
        if (Array.isArray(parsed)) {
          addressItems = parsed.map((addr, index) => ({
            id: Date.now().toString() + index,
            value: addr,
          }));
        } else {
          // 兼容旧的单地址格式
          addressItems = [{ id: Date.now().toString(), value: customer.address || '' }];
        }
      } catch (e) {
        // 解析失败，当作单地址处理
        addressItems = [{ id: Date.now().toString(), value: customer.address || '' }];
      }
    } else {
      // 没有地址时，创建一个空地址
      addressItems = [{ id: Date.now().toString(), value: '' }];
    }
    setAddresses(addressItems);

    // 解析联系人数组
    let contactItems: ContactPerson[] = [];
    if ((customer as any).contacts) {
      try {
        const parsed = typeof (customer as any).contacts === 'string' 
          ? JSON.parse((customer as any).contacts) 
          : (customer as any).contacts;
        if (Array.isArray(parsed) && parsed.length > 0) {
          contactItems = parsed.map((c: any, index: number) => ({
            id: Date.now().toString() + index,
            name: c.name || '',
            phone: c.phone || '',
            position: c.position || '',
          }));
        }
      } catch (e) {
        console.log('Parse contacts error:', e);
      }
    }
    if (contactItems.length === 0) {
      contactItems = [{ id: Date.now().toString(), name: '', phone: '', position: '' }];
    }
    setContacts(contactItems);

    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.name) {
      Alert.alert('提示', '客户名称不能为空');
      return;
    }

    // 过滤空地址
    const validAddresses = addresses.filter((addr) => addr.value.trim());
    
    // 过滤有效联系人（至少要填写姓名的才保存）
    const validContacts = contacts.filter((c) => c.name.trim());

    try {
      const response = editingCustomer
        ? await fetch(
            `${getApiBaseUrl()}/api/v1/customers/${editingCustomer.id}`,
            {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...formData,
                address: JSON.stringify(validAddresses.map((a) => a.value)),
                contacts: JSON.stringify(validContacts.map((c) => ({
                  name: c.name,
                  phone: c.phone,
                  position: c.position,
                }))),
              }),
            }
          )
        : await fetch(`${getApiBaseUrl()}/api/v1/customers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...formData,
              address: JSON.stringify(validAddresses.map((a) => a.value)),
              contacts: JSON.stringify(validContacts.map((c) => ({
                name: c.name,
                phone: c.phone,
                position: c.position,
              }))),
            }),
          });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('成功', editingCustomer ? '修改成功' : '创建成功');
        setModalVisible(false);
        fetchCustomers();
      } else {
        throw new Error(data.error || '操作失败');
      }
    } catch (error: any) {
      Alert.alert('错误', error.message);
    }
  };

  const handleDelete = (customer: Customer) => {
    Alert.alert('确认删除', `确定要删除客户"${customer.name}"吗？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            const response = await fetch(
              `${getApiBaseUrl()}/api/v1/customers/${customer.id}`,
              {
                method: 'DELETE',
              }
            );
            const data = await response.json();
            if (response.ok) {
              Alert.alert('成功', '删除成功');
              fetchCustomers();
            } else {
              throw new Error(data.error || '删除失败');
            }
          } catch (error: any) {
            Alert.alert('错误', error.message);
          }
        },
      },
    ]);
  };

  return (
    <Screen>
      <PageHeader title="客户管理" />

      {/* 搜索栏 */}
      <View style={styles.searchBar}>
        <FontAwesome6 name="magnifying-glass" size={16} color="#636E72" />
        <TextInput
          style={styles.searchInput}
          placeholder="搜索客户名称、业务经理"
          value={searchKeyword}
          onChangeText={setSearchKeyword}
          placeholderTextColor="#95A5A6"
        />
      </View>

      {/* 操作按钮 */}
      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
          <FontAwesome6 name="plus" size={16} color="#FFFFFF" />
          <Text style={styles.addButtonText}>新建客户</Text>
        </TouchableOpacity>
      </View>

      {/* 客户数量统计 */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{customers.length}</Text>
          <Text style={styles.statLabel}>客户总数</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {customers.reduce((sum, c) => sum + (c.device_count || 0), 0)}
          </Text>
          <Text style={styles.statLabel}>关联设备</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {customers.reduce((sum, c) => sum + (c.contract_count || 0), 0)}
          </Text>
          <Text style={styles.statLabel}>关联合同</Text>
        </View>
      </View>

      {/* 客户列表 */}
      <ScrollView style={styles.listContainer}>
        {loading ? (
          <View style={styles.centerContainer}>
            <Text>加载中...</Text>
          </View>
        ) : filteredCustomers.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>
              {searchKeyword ? '未找到匹配的客户' : '暂无客户信息'}
            </Text>
          </View>
        ) : (
          filteredCustomers.map((customer) => (
            <TouchableOpacity
              key={customer.id}
              style={styles.card}
              onPress={() => router.push('/customer-detail', { id: customer.id })}
              activeOpacity={0.7}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleContainer}>
                  <Text style={styles.cardTitle}>{customer.name}</Text>
                  {customer.device_count > 0 && (
                    <View style={styles.deviceBadge}>
                      <FontAwesome6 name="microchip" size={12} color="#1E88E5" />
                      <Text style={styles.deviceBadgeText}>
                        {customer.device_count}台设备
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleEdit(customer);
                    }}
                  >
                    <FontAwesome6 name="pen" size={16} color="#F39C12" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDelete(customer);
                    }}
                  >
                    <FontAwesome6 name="trash" size={16} color="#E74C3C" />
                  </TouchableOpacity>
                </View>
              </View>

              {customer.business_manager && (
                <View style={styles.cardInfo}>
                  <FontAwesome6 name="user-tie" size={14} color="#636E72" />
                  <Text style={styles.cardInfoText}>{customer.business_manager}</Text>
                </View>
              )}

              {customer.contact_person && (
                <View style={styles.cardInfo}>
                  <FontAwesome6 name="user" size={14} color="#636E72" />
                  <Text style={styles.cardInfoText}>{customer.contact_person}</Text>
                </View>
              )}

              {customer.address && (
                <View style={styles.cardInfo}>
                  <FontAwesome6 name="location-dot" size={14} color="#636E72" />
                  <Text style={styles.cardInfoText} numberOfLines={1}>
                    {(() => {
                      try {
                        const parsed = JSON.parse(customer.address);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                          return parsed[0];
                        }
                        return customer.address;
                      } catch (e) {
                        return customer.address;
                      }
                    })()}
                  </Text>
                </View>
              )}

              {customer.industry && (
                <View style={styles.cardInfo}>
                  <FontAwesome6 name="building" size={14} color="#636E72" />
                  <Text style={styles.cardInfoText}>{customer.industry}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* 新增/编辑客户 Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingCustomer ? '编辑客户' : '新建客户'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <FontAwesome6 name="xmark" size={20} color="#636E72" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>客户名称 *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="请输入客户名称"
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>业务经理</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="请输入业务经理"
                  value={formData.business_manager}
                  onChangeText={(text) =>
                    setFormData({ ...formData, business_manager: text })
                  }
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>服务看管部门</Text>
                <TouchableOpacity
                  style={styles.selectInput}
                  onPress={() => setSubGroupModalVisible(true)}
                >
                  <Text style={[
                    styles.selectInputText,
                    !formData.sub_group && styles.selectInputPlaceholder
                  ]}>
                    {formData.sub_group || '请选择服务看管部门'}
                  </Text>
                  <FontAwesome6 name="chevron-down" size={14} color="#95A5A6" />
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>所属行业</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="请输入所属行业"
                  value={formData.industry}
                  onChangeText={(text) =>
                    setFormData({ ...formData, industry: text })
                  }
                />
              </View>

              {/* 多个联系人 */}
              <View style={styles.formGroup}>
                <View style={styles.formLabelRow}>
                  <Text style={styles.formLabel}>联系人</Text>
                  <TouchableOpacity
                    style={styles.addAddressButton}
                    onPress={() =>
                      setContacts([...contacts, { id: Date.now().toString(), name: '', phone: '', position: '' }])
                    }
                  >
                    <FontAwesome6 name="plus" size={12} color="#1E88E5" />
                    <Text style={styles.addAddressButtonText}>添加联系人</Text>
                  </TouchableOpacity>
                </View>

                {contacts.map((contact, index) => (
                  <View key={contact.id} style={styles.contactItemContainer}>
                    <View style={styles.contactHeader}>
                      <Text style={styles.contactIndex}>联系人 {index + 1}</Text>
                      {contacts.length > 1 && (
                        <TouchableOpacity
                          onPress={() => {
                            const newContacts = contacts.filter((_, i) => i !== index);
                            setContacts(newContacts);
                          }}
                        >
                          <FontAwesome6 name="trash" size={14} color="#E74C3C" />
                        </TouchableOpacity>
                      )}
                    </View>
                    <View style={styles.contactRow}>
                      <TextInput
                        style={[styles.formInput, styles.contactInput]}
                        placeholder="姓名"
                        value={contact.name}
                        onChangeText={(text) => {
                          const newContacts = [...contacts];
                          newContacts[index].name = text;
                          setContacts(newContacts);
                        }}
                      />
                      <TextInput
                        style={[styles.formInput, styles.contactInput]}
                        placeholder="电话"
                        value={contact.phone}
                        keyboardType="phone-pad"
                        onChangeText={(text) => {
                          const newContacts = [...contacts];
                          newContacts[index].phone = text;
                          setContacts(newContacts);
                        }}
                      />
                    </View>
                    <TextInput
                      style={[styles.formInput, styles.contactPositionInput]}
                      placeholder="职位（如：经理、总监等）"
                      value={contact.position}
                      onChangeText={(text) => {
                        const newContacts = [...contacts];
                        newContacts[index].position = text;
                        setContacts(newContacts);
                      }}
                    />
                  </View>
                ))}
              </View>

              <View style={styles.formGroup}>
                <View style={styles.formLabelRow}>
                  <Text style={styles.formLabel}>客户地址</Text>
                  <TouchableOpacity
                    style={styles.addAddressButton}
                    onPress={() =>
                      setAddresses([...addresses, { id: Date.now().toString(), value: '' }])
                    }
                  >
                    <FontAwesome6 name="plus" size={12} color="#1E88E5" />
                    <Text style={styles.addAddressButtonText}>添加地址</Text>
                  </TouchableOpacity>
                </View>

                {addresses.map((addr, index) => (
                  <View key={addr.id} style={styles.addressInputContainer}>
                    <TextInput
                      style={[styles.formInput, styles.addressInput]}
                      placeholder={`请输入地址 ${index + 1}`}
                      value={addr.value}
                      onChangeText={(text) => {
                        const newAddresses = [...addresses];
                        newAddresses[index].value = text;
                        setAddresses(newAddresses);
                      }}
                      multiline
                      numberOfLines={2}
                    />
                    {addresses.length > 1 && (
                      <TouchableOpacity
                        style={styles.removeAddressButton}
                        onPress={() => {
                          const newAddresses = addresses.filter((_, i) => i !== index);
                          setAddresses(newAddresses);
                        }}
                      >
                        <FontAwesome6 name="trash" size={14} color="#E74C3C" />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>备注</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea]}
                  placeholder="请输入备注信息"
                  value={formData.remarks}
                  onChangeText={(text) =>
                    setFormData({ ...formData, remarks: text })
                  }
                  multiline
                  numberOfLines={3}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSave}
              >
                <Text style={styles.saveButtonText}>保存</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 服务看管部门选择弹窗 */}
      <Modal
        visible={subGroupModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSubGroupModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSubGroupModalVisible(false)}
        >
          <View style={styles.selectModalContent}>
            <View style={styles.selectModalHeader}>
              <Text style={styles.selectModalTitle}>选择服务看管部门</Text>
              <TouchableOpacity onPress={() => setSubGroupModalVisible(false)}>
                <FontAwesome6 name="xmark" size={20} color="#636E72" />
              </TouchableOpacity>
            </View>
            {serviceDepartmentOptions.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.selectOptionItem,
                  formData.sub_group === option && styles.selectOptionItemActive
                ]}
                onPress={() => {
                  setFormData({ ...formData, sub_group: option });
                  setSubGroupModalVisible(false);
                }}
              >
                <Text
                  style={[
                    styles.selectOptionText,
                    formData.sub_group === option && styles.selectOptionTextActive
                  ]}
                >
                  {option}
                </Text>
                {formData.sub_group === option && (
                  <FontAwesome6 name="check" size={16} color="#1E88E5" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F5F7FA',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#2D3436',
  },
  actionBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#1E88E5',
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 12,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E88E5',
  },
  statLabel: {
    fontSize: 12,
    color: '#636E72',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E0E0E0',
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 14,
    color: '#636E72',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D3436',
  },
  deviceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(30, 136, 229, 0.1)',
  },
  deviceBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1E88E5',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#F5F7FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  cardInfoText: {
    fontSize: 13,
    color: '#636E72',
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3436',
  },
  modalBody: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2D3436',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#2D3436',
  },
  formTextArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  formLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(30, 136, 229, 0.1)',
  },
  addAddressButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1E88E5',
  },
  contactItemContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  contactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  contactIndex: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2D3436',
  },
  contactRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  contactInput: {
    flex: 1,
    marginBottom: 0,
  },
  contactPositionInput: {
    marginBottom: 0,
  },
  addressInputContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  addressInput: {
    paddingRight: 40,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  removeAddressButton: {
    position: 'absolute',
    right: 8,
    top: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFF5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5F7FA',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#636E72',
  },
  saveButton: {
    backgroundColor: '#1E88E5',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  // 服务看管部门选择样式
  selectInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#FFFFFF',
  },
  selectInputText: {
    fontSize: 14,
    color: '#2D3436',
    flex: 1,
  },
  selectInputPlaceholder: {
    color: '#95A5A6',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '85%',
    maxWidth: 320,
    padding: 20,
  },
  selectModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  selectModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3436',
  },
  selectOptionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F7FA',
  },
  selectOptionItemActive: {
    backgroundColor: 'rgba(30, 136, 229, 0.05)',
  },
  selectOptionText: {
    fontSize: 15,
    color: '#2D3436',
  },
  selectOptionTextActive: {
    color: '#1E88E5',
    fontWeight: '600',
  },
});
