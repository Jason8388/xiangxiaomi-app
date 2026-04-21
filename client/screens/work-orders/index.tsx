import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Modal, Platform, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard, StyleSheet } from 'react-native';
import { Screen } from '@/components/Screen';
import { FontAwesome6 } from '@expo/vector-icons';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { getApiBaseUrl } from '@/utils/api';

interface WorkOrder {
  id: number;
  order_no: string;
  name?: string;
  description: string;
  customer_id: number;
  device_id?: number;
  type: string;
  priority: string;
  status: string;
  stage: string;
  plan_hours: number;
  is_charged: boolean;
  quoted_price: number;
  assignee_id?: number;
  created_by: number;
  customer_name?: string;
  device_name?: string;
  assignee_name?: string;
  created_at: string;
}

interface FormDataType {
  customer_id: string;
  device_id: string;
  type: string;
  priority: string;
  description: string;
  stage: string;
  status: string;
  plan_hours: string;
  is_charged: boolean;
  quoted_price: string;
  assignee_id: string;
}

export default function WorkOrdersScreen() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<WorkOrder[]>([]);
  const [stats, setStats] = useState({
    totalWorkOrders: 0,
    chargedWorkOrders: 0,
    performanceAmount: 0,
    pendingPaymentAmount: 0,
    paidAmount: 0,
  });
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingOrder, setEditingOrder] = useState<WorkOrder | null>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [formData, setFormData] = useState<FormDataType>({
    customer_id: '',
    device_id: '',
    type: '维修',
    priority: 'normal',
    description: '',
    stage: 'pending',
    status: 'pending',
    plan_hours: '',
    is_charged: false,
    quoted_price: '',
    assignee_id: '',
  });
  const router = useSafeRouter();

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchWorkOrders(),
        fetchStats(),
        fetchCustomers(),
        fetchDevices(),
        fetchUsers(),
      ]);
    };
    loadData();
  }, []);

  useEffect(() => {
    let filtered = workOrders;

    // 状态筛选
    if (filterStatus !== 'all') {
      filtered = filtered.filter(order => order.stage === filterStatus);
    }

    // 关键词搜索
    if (searchKeyword.trim()) {
      const keyword = searchKeyword.toLowerCase();
      filtered = filtered.filter(
        (order) =>
          (order.order_no && order.order_no.toLowerCase().includes(keyword)) ||
          (order.description && order.description.toLowerCase().includes(keyword)) ||
          (order.customer_name && order.customer_name.toLowerCase().includes(keyword)) ||
          (order.device_name && order.device_name.toLowerCase().includes(keyword)) ||
          (order.assignee_name && order.assignee_name.toLowerCase().includes(keyword))
      );
    }

    setFilteredOrders(filtered);
  }, [searchKeyword, filterStatus, workOrders]);

  const fetchWorkOrders = async (): Promise<WorkOrder[]> => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/v1/work-orders`);
      const data = await response.json();
      if (Array.isArray(data)) {
        setWorkOrders(data);
        return data;
      }
      return [];
    } catch (error) {
      console.error('Fetch work orders error:', error);
      return [];
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/v1/work-orders/stats`);
      const data = await response.json();
      if (data) {
        setStats(data);
      }
    } catch (error) {
      console.error('Fetch stats error:', error);
    }
  };

  const fetchCustomers = async (): Promise<any[]> => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/v1/customers`);
      const data = await response.json();
      if (Array.isArray(data)) {
        setCustomers(data);
        return data;
      }
      return [];
    } catch (error) {
      console.error('Fetch customers error:', error);
      return [];
    }
  };

  const fetchDevices = async (): Promise<any[]> => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/v1/devices`);
      const data = await response.json();
      if (Array.isArray(data)) {
        setDevices(data);
        return data;
      }
      return [];
    } catch (error) {
      console.error('Fetch devices error:', error);
      return [];
    }
  };

  const fetchUsers = async (): Promise<any[]> => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/v1/users`);
      const data = await response.json();
      if (Array.isArray(data)) {
        setUsers(data);
        return data;
      }
      return [];
    } catch (error) {
      console.error('Fetch users error:', error);
      return [];
    }
  };

  const handleAdd = () => {
    router.push('/work-order-detail', { id: 'new' });
  };

  const handleExport = (format: 'excel' | 'csv') => {
    const url = format === 'excel'
      ? `${getApiBaseUrl()}/api/v1/export/export/excel`
      : `${getApiBaseUrl()}/api/v1/export/export/csv`;

    if (Platform.OS === 'web') {
      const link = document.createElement('a');
      link.href = url;
      link.download = format === 'excel' ? '工单列表.xlsx' : '工单列表.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      Alert.alert('提示', '移动端暂不支持导出功能，请在PC端操作');
    }
  };

  const handleEdit = (order: WorkOrder) => {
    setEditingOrder(order);
    setFormData({
      customer_id: order.customer_id?.toString() || '',
      device_id: order.device_id?.toString() || '',
      type: order.type || '维修',
      priority: order.priority || 'normal',
      description: order.description || '',
      stage: order.stage || 'pending',
      status: order.status || 'pending',
      plan_hours: order.plan_hours?.toString() || '',
      is_charged: order.is_charged || false,
      quoted_price: order.quoted_price?.toString() || '',
      assignee_id: order.assignee_id?.toString() || '',
    });
    setModalVisible(true);
  };

  const handleDelete = (order: WorkOrder) => {
    Alert.alert('确认删除', `确定要删除工单"${order.order_no}"吗？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            const response = await fetch(
              `${getApiBaseUrl()}/api/v1/work-orders/${order.id}`,
              {
                method: 'DELETE',
              }
            );
            if (response.ok) {
              Alert.alert('成功', '删除成功');
              fetchWorkOrders();
              fetchStats();
            } else {
              throw new Error('删除失败');
            }
          } catch (error: any) {
            Alert.alert('错误', error.message);
          }
        },
      },
    ]);
  };

  const handleSave = async () => {
    if (!formData.customer_id || !formData.description) {
      Alert.alert('提示', '请填写客户和工单描述');
      return;
    }

    try {
      const response = editingOrder
        ? await fetch(
            `${getApiBaseUrl()}/api/v1/work-orders/${editingOrder.id}`,
            {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                description: formData.description,
                priority: formData.priority,
                status: formData.status,
                stage: formData.stage,
                plan_hours: formData.plan_hours ? parseFloat(formData.plan_hours) : 0,
                is_charged: formData.is_charged,
                quoted_price: formData.quoted_price ? parseFloat(formData.quoted_price) : 0,
                assignee_id: formData.assignee_id ? parseInt(formData.assignee_id) : null,
              }),
            }
          )
        : await fetch(`${getApiBaseUrl()}/api/v1/work-orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              customer_id: parseInt(formData.customer_id),
              device_id: formData.device_id ? parseInt(formData.device_id) : null,
              order_no: `WO${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
              type: formData.type,
              priority: formData.priority,
              status: 'pending',
              description: formData.description,
              stage: formData.stage,
              plan_hours: formData.plan_hours ? parseFloat(formData.plan_hours) : 0,
              is_charged: formData.is_charged,
              quoted_price: formData.quoted_price ? parseFloat(formData.quoted_price) : 0,
              assignee_id: formData.assignee_id ? parseInt(formData.assignee_id) : 2,
              created_by: 2,
            }),
          });

      if (!response.ok) {
        throw new Error(editingOrder ? '更新失败' : '创建失败');
      }

      setModalVisible(false);
      fetchWorkOrders();
      fetchStats();
      Alert.alert('成功', editingOrder ? '修改成功' : '创建成功');
    } catch (error: any) {
      Alert.alert('错误', error.message);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return { text: '待派工', color: '#F59E0B', bgColor: '#FEF3C7' };
      case 'assigned':
        return { text: '已派工', color: '#F59E0B', bgColor: '#FEF3C7' };
      case 'processing':
        return { text: '处理中', color: '#8B5CF6', bgColor: '#EDE9FE' };
      case 'completed':
        return { text: '已完成', color: '#10B981', bgColor: '#D1FAE5' };
      default:
        return { text: status, color: '#9CA3AF', bgColor: '#F3F4F6' };
    }
  };

  const priorityConfig = (priority: string) => {
    switch (priority) {
      case 'high':
        return { text: '高', color: '#EF4444' };
      case 'normal':
        return { text: '中', color: '#F59E0B' };
      case 'low':
        return { text: '低', color: '#10B981' };
      default:
        return { text: '中', color: '#F59E0B' };
    }
  };

  const StatCard = ({ icon, title, value, color, iconBg }: any) => (
    <View style={[styles.statCard, { borderColor: color }]}>
      <View style={[styles.statIcon, { backgroundColor: iconBg }]}>
        <FontAwesome6 name={icon} size={20} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );

  const FilterTab = ({ label, value, active }: any) => (
    <TouchableOpacity
      onPress={() => setFilterStatus(value)}
      style={[styles.filterTab, active && { backgroundColor: '#8B5CF6' }]}
    >
      <Text style={[styles.filterTabText, active && { color: '#FFFFFF' }]}>{label}</Text>
    </TouchableOpacity>
  );

  const WorkOrderCard = ({ order }: any) => {
    const statusConfig = getStatusConfig(order.stage);
    const priorityConfigData = priorityConfig(order.priority);

    // 根据任务阶段计算进度
    const getProgress = (stage: string) => {
      switch (stage) {
        case 'pending':
          return 0;
        case 'assigned':
          return 25;
        case 'processing':
          return 60;
        case 'completed':
          return 100;
        default:
          return 0;
      }
    };

    const progress = getProgress(order.stage);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push('/work-order-detail', { id: order.id.toString() })}
        activeOpacity={0.7}
      >
        {/* 头部 */}
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {order.description || '无描述'}
            </Text>
            <Text style={styles.cardSubtitle}>{order.order_no}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {statusConfig.text}
            </Text>
          </View>
        </View>

        {/* 内容 */}
        <View style={styles.cardContent}>
          <View style={styles.infoRow}>
            <FontAwesome6 name="building" size={14} color="#9CA3AF" />
            <Text style={styles.infoText}>{order.customer_name || '未指定'}</Text>
          </View>
          <View style={styles.infoRow}>
            <FontAwesome6 name="user" size={14} color="#9CA3AF" />
            <Text style={styles.infoText}>{order.assignee_name || '未分配'}</Text>
          </View>
          <View style={styles.infoRow}>
            <FontAwesome6 name="chart-line" size={14} color="#9CA3AF" />
            <Text style={styles.infoText}>{progress}%</Text>
            <View style={styles.progressContainer}>
              <View style={[styles.progressBar, { width: `${progress}%` }]} />
            </View>
          </View>
          <View style={styles.infoRow}>
            <FontAwesome6 name="list-check" size={14} color="#9CA3AF" />
            <Text style={styles.infoText}>{statusConfig.text}</Text>
          </View>
        </View>

        {/* 底部 */}
        <View style={styles.cardFooter}>
          <View style={styles.priorityBadge}>
            <View style={[styles.priorityDot, { backgroundColor: priorityConfigData.color }]} />
            <Text style={[styles.priorityText, { color: priorityConfigData.color }]}>
              {priorityConfigData.text}优先级
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Screen>
      {/* 顶部标题区 */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>工单管理</Text>
          <Text style={styles.headerSubtitle}>共 {stats.totalWorkOrders} 条工单</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton} onPress={() => handleExport('excel')}>
            <FontAwesome6 name="file-export" size={20} color="#6B7280" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={handleAdd}>
            <FontAwesome6 name="plus" size={20} color="#8B5CF6" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
      >
        {/* 统计卡片 */}
        <View style={styles.statsContainer}>
          <StatCard
            icon="clipboard-list"
            title="总工单"
            value={stats.totalWorkOrders}
            color="#8B5CF6"
            iconBg="#EDE9FE"
          />
          <StatCard
            icon="clock"
            title="处理中"
            value={stats.totalWorkOrders - stats.chargedWorkOrders}
            color="#F59E0B"
            iconBg="#FEF3C7"
          />
          <StatCard
            icon="check-circle"
            title="已完成"
            value={stats.chargedWorkOrders}
            color="#10B981"
            iconBg="#D1FAE5"
          />
        </View>

        {/* 搜索框 */}
        <View style={styles.searchContainer}>
          <FontAwesome6 name="search" size={18} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="搜索工单..."
            placeholderTextColor="#9CA3AF"
            value={searchKeyword}
            onChangeText={setSearchKeyword}
          />
          {searchKeyword.length > 0 && (
            <TouchableOpacity onPress={() => setSearchKeyword('')}>
              <FontAwesome6 name="xmark" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        {/* 筛选标签 */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
          <FilterTab label="全部" value="all" active={filterStatus === 'all'} />
          <FilterTab label="待派工" value="pending" active={filterStatus === 'pending'} />
          <FilterTab label="处理中" value="processing" active={filterStatus === 'processing'} />
          <FilterTab label="已完成" value="completed" active={filterStatus === 'completed'} />
        </ScrollView>

        {/* 工单列表 */}
        <View style={styles.listContainer}>
          {filteredOrders.length === 0 ? (
            <View style={styles.emptyContainer}>
              <FontAwesome6 name="clipboard-list" size={64} color="#E5E7EB" />
              <Text style={styles.emptyText}>暂无工单</Text>
              <Text style={styles.emptySubtext}>点击右上角 + 创建新工单</Text>
            </View>
          ) : (
            <>
              {filteredOrders.map((order) => (
                <WorkOrderCard key={order.id} order={order} />
              ))}
            </>
          )}
        </View>
      </ScrollView>

      {/* 编辑弹窗 */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{editingOrder ? '编辑工单' : '新建工单'}</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <FontAwesome6 name="xmark" size={24} color="#6B7280" />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} style={styles.modalBody}>
                  <View style={styles.formSection}>
                    <Text style={styles.formLabel}>工单名称 *</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="请输入工单名称"
                      value={formData.description}
                      onChangeText={(text) => setFormData({ ...formData, description: text })}
                    />
                  </View>

                  <View style={styles.formSection}>
                    <Text style={styles.formLabel}>客户 *</Text>
                    <View style={styles.formSelect}>
                      <Text style={styles.formSelectText}>
                        {customers.find((c) => c.id.toString() === formData.customer_id)?.name || '请选择客户'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.formSection}>
                    <Text style={styles.formLabel}>任务负责人</Text>
                    <View style={styles.formSelect}>
                      <Text style={styles.formSelectText}>
                        {users.find((u) => u.id.toString() === formData.assignee_id)?.username || '请选择负责人'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.formSection}>
                    <Text style={styles.formLabel}>工单类型</Text>
                    <View style={styles.formTags}>
                      {['维修', '保养', '安装', '其他'].map((type) => (
                        <TouchableOpacity
                          key={type}
                          onPress={() => setFormData({ ...formData, type })}
                          style={[styles.formTag, formData.type === type && styles.formTagActive]}
                        >
                          <Text style={[styles.formTagText, formData.type === type && styles.formTagTextActive]}>
                            {type}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={styles.formSection}>
                    <Text style={styles.formLabel}>工单阶段</Text>
                    <View style={styles.formTags}>
                      {[
                        { label: '待派工', value: 'pending' },
                        { label: '已派工', value: 'assigned' },
                        { label: '处理中', value: 'processing' },
                        { label: '已完成', value: 'completed' },
                      ].map((stage) => (
                        <TouchableOpacity
                          key={stage.value}
                          onPress={() => setFormData({ ...formData, stage: stage.value })}
                          style={[styles.formTag, formData.stage === stage.value && styles.formTagActive]}
                        >
                          <Text style={[styles.formTagText, formData.stage === stage.value && styles.formTagTextActive]}>
                            {stage.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={styles.formSection}>
                    <Text style={styles.formLabel}>优先级</Text>
                    <View style={styles.formTags}>
                      {[
                        { label: '低', value: 'low' },
                        { label: '中', value: 'normal' },
                        { label: '高', value: 'high' },
                      ].map((priority) => (
                        <TouchableOpacity
                          key={priority.value}
                          onPress={() => setFormData({ ...formData, priority: priority.value })}
                          style={[styles.formTag, formData.priority === priority.value && styles.formTagActive]}
                        >
                          <Text style={[styles.formTagText, formData.priority === priority.value && styles.formTagTextActive]}>
                            {priority.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={styles.formSection}>
                    <Text style={styles.formLabel}>计划工时（小时）</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="请输入计划工时"
                      keyboardType="decimal-pad"
                      value={formData.plan_hours}
                      onChangeText={(text) => setFormData({ ...formData, plan_hours: text })}
                    />
                  </View>

                  <View style={styles.formSection}>
                    <Text style={styles.formLabel}>有偿服务</Text>
                    <TouchableOpacity
                      onPress={() => setFormData({ ...formData, is_charged: !formData.is_charged })}
                      style={[styles.toggle, formData.is_charged && styles.toggleActive]}
                    >
                      <View style={[styles.toggleKnob, formData.is_charged && styles.toggleKnobActive]} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.formSection}>
                    <Text style={styles.formLabel}>报价金额（元）</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="请输入报价金额"
                      keyboardType="decimal-pad"
                      value={formData.quoted_price}
                      onChangeText={(text) => setFormData({ ...formData, quoted_price: text })}
                    />
                  </View>

                  {editingOrder && (
                    <View style={styles.formSection}>
                      <Text style={styles.formLabel}>工单状态</Text>
                      <View style={styles.formTags}>
                        {[
                          { label: '待处理', value: 'pending' },
                          { label: '处理中', value: 'processing' },
                          { label: '已完成', value: 'completed' },
                        ].map((status) => (
                          <TouchableOpacity
                            key={status.value}
                            onPress={() => setFormData({ ...formData, status: status.value })}
                            style={[styles.formTag, formData.status === status.value && styles.formTagActive]}
                          >
                            <Text style={[styles.formTagText, formData.status === status.value && styles.formTagTextActive]}>
                              {status.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}
                </ScrollView>

                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    style={styles.modalButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.modalButtonText}>取消</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonPrimary]}
                    onPress={handleSave}
                  >
                    <Text style={styles.modalButtonTextPrimary}>保存</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 100,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 2,
    borderStyle: 'solid',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  filterContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  filterTabText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  listContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  cardHeaderLeft: {
    flex: 1,
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardContent: {
    gap: 10,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
  },
  progressContainer: {
    flex: 1,
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#8B5CF6',
    borderRadius: 3,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '500',
  },
  assigneeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  assigneeText: {
    fontSize: 12,
    color: '#6B7280',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  modalBody: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  formSection: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111827',
  },
  formSelect: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  formSelectText: {
    fontSize: 16,
    color: '#111827',
  },
  formTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  formTag: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  formTagActive: {
    backgroundColor: '#8B5CF6',
  },
  formTagText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  formTagTextActive: {
    color: '#FFFFFF',
  },
  toggle: {
    width: 52,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#D1D5DB',
    padding: 2,
  },
  toggleActive: {
    backgroundColor: '#8B5CF6',
  },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleKnobActive: {
    transform: [{ translateX: 24 }],
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  modalButtonPrimary: {
    backgroundColor: '#8B5CF6',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  modalButtonTextPrimary: {
    color: '#FFFFFF',
  },
});
