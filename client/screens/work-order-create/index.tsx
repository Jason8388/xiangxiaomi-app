import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { Screen } from '@/components/Screen';
import { useSafeRouter } from '@/hooks/useSafeRouter';

interface Customer {
  id: number;
  name: string;
  contact_person?: string;
  contact_phone?: string;
}

export default function WorkOrderCreate() {
  const router = useSafeRouter();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerSearchVisible, setCustomerSearchVisible] = useState(false);
  const [customerSearchKeyword, setCustomerSearchKeyword] = useState('');

  const [formData, setFormData] = useState({
    order_name: '',        // 工单名称
    order_no: '',          // 工单编号
    task_no: '',           // 任务号
    customer_name: '',     // 客户名称
    customer_id: '',       // 客户ID
    task_leader: '',       // 任务负责人
    implementation_entity: '', // 实施主体
  });

  // 加载客户列表
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/customers`);
        const data = await response.json();
        if (Array.isArray(data)) {
          setCustomers(data);
        } else if (data.data) {
          setCustomers(data.data);
        }
      } catch (error) {
        console.error('Load customers error:', error);
      }
    };
    loadCustomers();
  }, []);

  // 过滤客户
  const filteredCustomers = customerSearchKeyword.trim()
    ? customers.filter((c) =>
        c.name.toLowerCase().includes(customerSearchKeyword.toLowerCase()) ||
        (c.contact_person && c.contact_person.toLowerCase().includes(customerSearchKeyword.toLowerCase())) ||
        (c.contact_phone && c.contact_phone.includes(customerSearchKeyword))
      )
    : customers;

  // 选择客户
  const handleSelectCustomer = (customer: Customer) => {
    setFormData({
      ...formData,
      customer_name: customer.name,
      customer_id: customer.id.toString(),
    });
    setCustomerSearchVisible(false);
    setCustomerSearchKeyword('');
  };

  // 提交表单
  const handleSubmit = async () => {
    if (!formData.order_name.trim()) {
      Alert.alert('提示', '工单名称不能为空');
      return;
    }
    if (!formData.order_no.trim()) {
      Alert.alert('提示', '工单编号不能为空');
      return;
    }
    if (!formData.task_no.trim()) {
      Alert.alert('提示', '任务号不能为空');
      return;
    }
    if (!formData.customer_name.trim()) {
      Alert.alert('提示', '客户名称不能为空');
      return;
    }
    if (!formData.task_leader.trim()) {
      Alert.alert('提示', '任务负责人不能为空');
      return;
    }
    if (!formData.implementation_entity.trim()) {
      Alert.alert('提示', '实施主体不能为空');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/work-orders`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: formData.order_name,
            order_no: formData.order_no,
            task_no: formData.task_no,
            customer_id: formData.customer_id || null,
            customer_name: formData.customer_name,
            task_leader: formData.task_leader,
            implementation_entity: formData.implementation_entity,
            type: '维修',
            priority: 'normal',
            stage: 'pending',
          }),
        }
      );

      if (response.ok) {
        Alert.alert('成功', '工单创建成功', [
          { text: '确定', onPress: () => router.back() },
        ]);
      } else {
        throw new Error('创建失败');
      }
    } catch (error) {
      console.error('Submit error:', error);
      Alert.alert('提示', '工单创建失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* 信息栏1：工单基本情况 */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <FontAwesome6 name="clipboard-list" size={16} color="#6C63FF" />
              <Text style={styles.sectionTitle}>工单基本情况</Text>
            </View>

            <View style={styles.formCard}>
              {/* 工单名称 */}
              <View style={styles.formItem}>
                <View style={styles.labelRow}>
                  <Text style={styles.required}>*</Text>
                  <Text style={styles.label}>工单名称</Text>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="请输入工单名称"
                  value={formData.order_name}
                  onChangeText={(text) => setFormData({ ...formData, order_name: text })}
                  placeholderTextColor="#999"
                />
              </View>

              {/* 工单编号 */}
              <View style={styles.formItem}>
                <View style={styles.labelRow}>
                  <Text style={styles.required}>*</Text>
                  <Text style={styles.label}>工单编号</Text>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="请输入工单编号"
                  value={formData.order_no}
                  onChangeText={(text) => setFormData({ ...formData, order_no: text })}
                  placeholderTextColor="#999"
                />
              </View>

              {/* 任务号 */}
              <View style={styles.formItem}>
                <View style={styles.labelRow}>
                  <Text style={styles.required}>*</Text>
                  <Text style={styles.label}>任务号</Text>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="请输入任务号"
                  value={formData.task_no}
                  onChangeText={(text) => setFormData({ ...formData, task_no: text })}
                  placeholderTextColor="#999"
                />
              </View>

              {/* 客户名称（带模糊搜索） */}
              <View style={styles.formItem}>
                <View style={styles.labelRow}>
                  <Text style={styles.required}>*</Text>
                  <Text style={styles.label}>客户名称</Text>
                </View>
                <TouchableOpacity
                  style={styles.customerInput}
                  onPress={() => setCustomerSearchVisible(!customerSearchVisible)}
                >
                  <Text
                    style={[
                      styles.customerText,
                      !formData.customer_name && styles.customerPlaceholder,
                    ]}
                  >
                    {formData.customer_name || '点击选择客户（支持搜索）'}
                  </Text>
                  <FontAwesome6
                    name={customerSearchVisible ? 'chevron-up' : 'chevron-down'}
                    size={14}
                    color="#95A5A6"
                  />
                </TouchableOpacity>

                {customerSearchVisible && (
                  <View style={styles.customerSearchContainer}>
                    <View style={styles.searchInputContainer}>
                      <FontAwesome6 name="magnifying-glass" size={14} color="#95A5A6" />
                      <TextInput
                        style={styles.searchInput}
                        placeholder="搜索客户名称"
                        value={customerSearchKeyword}
                        onChangeText={setCustomerSearchKeyword}
                        placeholderTextColor="#95A5A6"
                      />
                    </View>
                    <ScrollView style={styles.customerList} nestedScrollEnabled>
                      {filteredCustomers.length === 0 ? (
                        <View style={styles.noDataContainer}>
                          <Text style={styles.noDataText}>未找到匹配的客户</Text>
                        </View>
                      ) : (
                        filteredCustomers.slice(0, 10).map((customer) => (
                          <TouchableOpacity
                            key={customer.id}
                            style={styles.customerItem}
                            onPress={() => handleSelectCustomer(customer)}
                          >
                            <View style={styles.customerItemContent}>
                              <Text style={styles.customerName}>{customer.name}</Text>
                              {customer.contact_person && (
                                <Text style={styles.customerContact}>
                                  联系人: {customer.contact_person}
                                  {customer.contact_phone && ` ${customer.contact_phone}`}
                                </Text>
                              )}
                            </View>
                            {formData.customer_id === customer.id.toString() && (
                              <FontAwesome6 name="check" size={16} color="#6C63FF" />
                            )}
                          </TouchableOpacity>
                        ))
                      )}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* 任务负责人 */}
              <View style={styles.formItem}>
                <View style={styles.labelRow}>
                  <Text style={styles.required}>*</Text>
                  <Text style={styles.label}>任务负责人</Text>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="请输入任务负责人"
                  value={formData.task_leader}
                  onChangeText={(text) => setFormData({ ...formData, task_leader: text })}
                  placeholderTextColor="#999"
                />
              </View>

              {/* 实施主体 */}
              <View style={styles.formItem}>
                <View style={styles.labelRow}>
                  <Text style={styles.required}>*</Text>
                  <Text style={styles.label}>实施主体</Text>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="请输入实施主体"
                  value={formData.implementation_entity}
                  onChangeText={(text) => setFormData({ ...formData, implementation_entity: text })}
                  placeholderTextColor="#999"
                />
              </View>
            </View>
          </View>
        </ScrollView>

        {/* 底部提交按钮 */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
          >
            <Text style={styles.cancelButtonText}>取消</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>创建工单</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3436',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
  },
  formItem: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  required: {
    color: '#E74C3C',
    fontSize: 14,
    marginRight: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2D3436',
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#2D3436',
  },
  customerInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  customerText: {
    fontSize: 15,
    color: '#2D3436',
    flex: 1,
  },
  customerPlaceholder: {
    color: '#999',
  },
  customerSearchContainer: {
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    maxHeight: 200,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#2C3E50',
    padding: 0,
  },
  customerList: {
    maxHeight: 150,
  },
  customerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  customerItemContent: {
    flex: 1,
  },
  customerName: {
    fontSize: 14,
    color: '#2D3436',
    fontWeight: '500',
  },
  customerContact: {
    fontSize: 12,
    color: '#95A5A6',
    marginTop: 2,
  },
  noDataContainer: {
    padding: 16,
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 14,
    color: '#95A5A6',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#636E72',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#6C63FF',
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
