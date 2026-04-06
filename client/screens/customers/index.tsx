import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Screen } from '@/components/Screen';
import { FontAwesome6 } from '@expo/vector-icons';
import { useSafeRouter } from '@/hooks/useSafeRouter';

export default function CustomersScreen() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [searchText, setSearchText] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    phone: '',
    email: '',
    address: '',
  });
  const router = useSafeRouter();

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/customers`);
      const data = await response.json();
      if (Array.isArray(data)) {
        setCustomers(data);
      }
    } catch (error) {
      console.error('Fetch customers error:', error);
    }
  };

  const handleAdd = () => {
    setEditingCustomer(null);
    setFormData({ name: '', contact: '', phone: '', email: '', address: '' });
    setModalVisible(true);
  };

  const handleEdit = (customer: any) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      contact: customer.contact,
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.name) {
      Alert.alert('提示', '客户名称不能为空');
      return;
    }

    try {
      const url = editingCustomer
        ? `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/customers/${editingCustomer.id}`
        : `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/customers`;

      const method = editingCustomer ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('保存失败');
      }

      setModalVisible(false);
      fetchCustomers();
      Alert.alert('成功', editingCustomer ? '客户更新成功' : '客户创建成功');
    } catch (error: any) {
      Alert.alert('错误', error.message);
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert('确认', '确定要删除此客户吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            const response = await fetch(
              `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/customers/${id}`,
              { method: 'DELETE' }
            );

            if (!response.ok) {
              throw new Error('删除失败');
            }

            fetchCustomers();
            Alert.alert('成功', '客户删除成功');
          } catch (error: any) {
            Alert.alert('错误', error.message);
          }
        },
      },
    ]);
  };

  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <Screen>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Header */}
        <View className="px-6 pt-8 pb-4">
          <Text className="text-3xl font-bold text-[#2D3436] mb-2">
            客户管理
          </Text>
          <Text className="text-sm text-[#636E72]">
            共 {customers.length} 位客户
          </Text>
        </View>

        {/* 搜索框 */}
        <View className="px-6 mb-4">
          <View
            className="bg-[#E8E8EB] rounded-2xl px-4 py-3 flex-row items-center"
            style={{ borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)' }}
          >
            <FontAwesome6 name="search" size={18} color="#B2BEC3" />
            <TextInput
              className="flex-1 ml-3 text-[#2D3436] text-base"
              placeholder="搜索客户名称..."
              placeholderTextColor="#B2BEC3"
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>
        </View>

        {/* 客户列表 */}
        <View className="px-6">
          {filteredCustomers.map((customer) => (
            <TouchableOpacity
              key={customer.id}
              onPress={() => router.push(`/customers/${customer.id}`)}
              className="mb-4"
            >
              <View
                className="rounded-3xl p-5 shadow-lg"
                style={{
                  backgroundColor: '#F0F0F3',
                  shadowColor: '#D1D9E6',
                  shadowOffset: { width: 6, height: 6 },
                  shadowOpacity: 0.7,
                  shadowRadius: 8,
                  elevation: 6,
                }}
              >
                <View className="flex-row items-center mb-3">
                  <View
                    className="w-12 h-12 rounded-full items-center justify-center mr-3"
                    style={{ backgroundColor: 'rgba(108, 99, 255, 0.12)' }}
                  >
                    <FontAwesome6 name="building" size={20} color="#6C63FF" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-bold text-[#2D3436] mb-1">
                      {customer.name}
                    </Text>
                    {customer.contact && (
                      <Text className="text-sm text-[#636E72]">
                        联系人：{customer.contact}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      handleEdit(customer);
                    }}
                    className="p-2"
                  >
                    <FontAwesome6 name="pen" size={18} color="#6C63FF" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDelete(customer.id);
                    }}
                    className="p-2"
                  >
                    <FontAwesome6 name="trash" size={18} color="#FF6B6B" />
                  </TouchableOpacity>
                </View>
                {customer.phone && (
                  <View className="flex-row items-center">
                    <FontAwesome6 name="phone" size={14} color="#B2BEC3" />
                    <Text className="text-sm text-[#636E72] ml-2">
                      {customer.phone}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* 新增按钮 */}
      <TouchableOpacity
        onPress={handleAdd}
        className="absolute bottom-6 right-6"
        style={{
          width: 60,
          height: 60,
          borderRadius: 30,
          backgroundColor: '#6C63FF',
          justifyContent: 'center',
          alignItems: 'center',
          shadowColor: '#6C63FF',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.35,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <FontAwesome6 name="plus" size={26} color="#FFFFFF" />
      </TouchableOpacity>

      {/* 编辑/新增 Modal */}
      {modalVisible && (
        <View className="absolute inset-0 bg-black/50 justify-center items-center px-6">
          <View
            className="w-full rounded-3xl p-6"
            style={{ backgroundColor: '#F0F0F3' }}
          >
            <Text className="text-xl font-bold text-[#2D3436] mb-6">
              {editingCustomer ? '编辑客户' : '新增客户'}
            </Text>

            <View className="mb-4">
              <Text className="text-sm font-medium text-[#636E72] mb-2 ml-1">
                客户名称 *
              </Text>
              <TextInput
                className="w-full bg-[#E8E8EB] rounded-2xl px-4 py-3 text-[#2D3436] text-base"
                placeholder="请输入客户名称"
                placeholderTextColor="#B2BEC3"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
              />
            </View>

            <View className="mb-4">
              <Text className="text-sm font-medium text-[#636E72] mb-2 ml-1">
                联系人
              </Text>
              <TextInput
                className="w-full bg-[#E8E8EB] rounded-2xl px-4 py-3 text-[#2D3436] text-base"
                placeholder="请输入联系人"
                placeholderTextColor="#B2BEC3"
                value={formData.contact}
                onChangeText={(text) => setFormData({ ...formData, contact: text })}
              />
            </View>

            <View className="mb-4">
              <Text className="text-sm font-medium text-[#636E72] mb-2 ml-1">
                电话
              </Text>
              <TextInput
                className="w-full bg-[#E8E8EB] rounded-2xl px-4 py-3 text-[#2D3436] text-base"
                placeholder="请输入电话"
                placeholderTextColor="#B2BEC3"
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                keyboardType="phone-pad"
              />
            </View>

            <View className="mb-6">
              <Text className="text-sm font-medium text-[#636E72] mb-2 ml-1">
                邮箱
              </Text>
              <TextInput
                className="w-full bg-[#E8E8EB] rounded-2xl px-4 py-3 text-[#2D3436] text-base"
                placeholder="请输入邮箱"
                placeholderTextColor="#B2BEC3"
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                keyboardType="email-address"
              />
            </View>

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                className="flex-1 py-4 rounded-full items-center"
                style={{ backgroundColor: '#E8E8EB' }}
              >
                <Text className="text-[#636E72] font-semibold text-base">取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSave}
                className="flex-1 py-4 rounded-full items-center"
                style={{ backgroundColor: '#6C63FF' }}
              >
                <Text className="text-white font-semibold text-base">保存</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </Screen>
  );
}
