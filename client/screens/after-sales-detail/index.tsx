import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { PageHeader } from '@/components/PageHeader';
import { FontAwesome6 } from '@expo/vector-icons';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { getApiBaseUrl } from '@/utils/api';

interface Contact {
  id: number;
  name: string;
  role: string;
  phone: string;
}

interface Material {
  material_id: number;
  material_name: string;
  quantity: number;
}

interface CollectionRecord {
  id: number;
  content: string;
  update_date: string;
  updater: string;
}

interface WorkOrder {
  id: number;
  // 栏1：基本情况
  order_name: string;
  order_number: string;
  task_number: string;
  customer_name: string;
  task_owner: string;
  implementation_entity: string;

  // 栏2：工单状态
  order_type: 'charged' | 'free' | 'pending';
  task_stage: string;
  task_progress: string;
  task_status: string;
  demand_assessment_cycle: number;
  service_implementation_cycle: number;
  collection_cycle: number;

  // 栏3：客户联系人
  contacts: Contact[];

  // 栏4：需求情况
  demand_received_date: string;
  demand_description: string;
  problem_description?: string;
  device_photos: string[];
  device_number?: string;
  contract_name?: string;
  contract_number?: string;
  service_plan?: string;
  planned_hours: number;
  materials: Material[];
  warranty_status: 'in_warranty' | 'out_of_warranty';
  is_charged: boolean;
  quote_amount: number;
  service_quote?: string;
  is_quote_submitted: boolean;
  quote_audit_result?: string;
  customer_consensus_voucher?: string;
  customer_consensus_date?: string;

  // 栏5：服务实施
  implementer?: string;
  implementation_complete_date?: string;
  actual_hours: number;
  dispatch_order_photos: string[];
  site_completion_photos: string[];
  dispatch_order_signer?: string;

  // 栏6：服务回款
  invoice_application: boolean;
  invoice_completion: boolean;
  invoice_delivered: boolean;
  planned_collection_date?: string;
  collection_records: CollectionRecord[];
  actual_collection_date?: string;
}

export default function AfterSalesDetail() {
  const router = useSafeRouter();
  const { id } = useSafeSearchParams<{ id: number }>();
  const [orderData, setOrderData] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      loadOrderDetail();
    }
  }, [id]);

  const loadOrderDetail = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${getApiBaseUrl()}/api/v1/after-sales/orders/${id}`
      );
      const data = await response.json();
      if (response.ok) {
        setOrderData(data);
      }
    } catch (error) {
      console.error('Fetch order detail error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case '已完成':
        return '#2ECC71';
      case '进行中':
        return '#F39C12';
      case '已延期':
        return '#E74C3C';
      default:
        return '#636E72';
    }
  };

  if (loading) {
    return (
      <Screen>
        <PageHeader title="工单详情" />
        <View style={styles.centerContainer}>
          <Text>加载中...</Text>
        </View>
      </Screen>
    );
  }

  if (!orderData) {
    return (
      <Screen>
        <PageHeader title="工单详情" />
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>未找到工单</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <PageHeader title="工单详情" />

      <ScrollView style={styles.container}>
        {/* 栏1：基本情况 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FontAwesome6 name="circle-info" size={18} color="#1E88E5" />
            <Text style={styles.sectionTitle}>基本情况</Text>
          </View>

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>工单名称</Text>
              <Text style={styles.value}>{orderData.order_name}</Text>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>工单编号</Text>
              <View style={styles.numberBadge}>
                <Text style={styles.numberText}>{orderData.order_number}</Text>
              </View>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>任务号</Text>
              <Text style={styles.value}>{orderData.task_number}</Text>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>客户名称</Text>
              <Text style={styles.value}>{orderData.customer_name}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>任务负责人</Text>
              <Text style={styles.value}>{orderData.task_owner}</Text>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>实施主体</Text>
              <Text style={styles.value}>{orderData.implementation_entity}</Text>
            </View>
          </View>
        </View>

        {/* 栏2：工单状态 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FontAwesome6 name="list-check" size={18} color="#1E88E5" />
            <Text style={styles.sectionTitle}>工单状态</Text>
          </View>

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>工单类型</Text>
              <View style={[styles.badge, { backgroundColor: orderData.is_charged ? '#F39C12' : '#95A5A6' }]}>
                <Text style={styles.badgeText}>
                  {orderData.order_type === 'charged' ? '收费工单' : orderData.order_type === 'free' ? '免费工单' : '待定工单'}
                </Text>
              </View>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>任务阶段</Text>
              <Text style={styles.value}>{orderData.task_stage}</Text>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>任务进度</Text>
              <Text style={[styles.value, styles.highlight]}>{orderData.task_progress}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>任务状态</Text>
              <Text style={[styles.value, { color: getStatusColor(orderData.task_status) }]}>
                {orderData.task_status}
              </Text>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>需求评估周期</Text>
              <Text style={styles.value}>{orderData.demand_assessment_cycle} 天</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>服务实施周期</Text>
              <Text style={styles.value}>{orderData.service_implementation_cycle} 天</Text>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>回款周期</Text>
              <Text style={styles.value}>{orderData.collection_cycle} 天</Text>
            </View>
          </View>
        </View>

        {/* 栏3：客户联系人 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FontAwesome6 name="address-book" size={18} color="#1E88E5" />
            <Text style={styles.sectionTitle}>客户联系人</Text>
          </View>

          {orderData.contacts.map((contact) => (
            <View key={contact.id} style={styles.contactCard}>
              <View style={styles.contactHeader}>
                <Text style={styles.contactName}>{contact.name}</Text>
                <Text style={styles.contactRole}>{contact.role}</Text>
              </View>
              <View style={styles.contactPhone}>
                <FontAwesome6 name="phone" size={14} color="#636E72" />
                <Text style={styles.contactPhoneText}>{contact.phone}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* 栏4：需求情况 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FontAwesome6 name="clipboard-list" size={18} color="#1E88E5" />
            <Text style={styles.sectionTitle}>需求情况</Text>
          </View>

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>需求收到日期</Text>
              <Text style={styles.value}>
                {new Date(orderData.demand_received_date).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>计划工时</Text>
              <Text style={styles.value}>{orderData.planned_hours} 小时</Text>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>质保期状态</Text>
              <View style={[styles.badge, {
                backgroundColor: orderData.warranty_status === 'in_warranty' ? 'rgba(46, 204, 113, 0.1)' : 'rgba(231, 76, 60, 0.1)'
              }]}>
                <Text style={[styles.badgeText, {
                  color: orderData.warranty_status === 'in_warranty' ? '#2ECC71' : '#E74C3C'
                }]}>
                  {orderData.warranty_status === 'in_warranty' ? '质保期内' : '质保期外'}
                </Text>
              </View>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>是否收费</Text>
              <View style={[styles.badge, { backgroundColor: orderData.is_charged ? '#F39C12' : '#95A5A6' }]}>
                <Text style={styles.badgeText}>
                  {orderData.is_charged ? '收费' : '免费'}
                </Text>
              </View>
            </View>
          </View>

          {orderData.quote_amount > 0 && (
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>报价金额</Text>
                <Text style={[styles.value, styles.money]}>{formatMoney(orderData.quote_amount)}</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>报价审核</Text>
                <Text style={styles.value}>
                  {orderData.is_quote_submitted ? '已提交' : '未提交'}
                  {orderData.quote_audit_result && ` · ${orderData.quote_audit_result}`}
                </Text>
              </View>
            </View>
          )}

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>需求描述</Text>
              <Text style={styles.textBlock}>{orderData.demand_description}</Text>
            </View>
          </View>

          {orderData.problem_description && (
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>问题说明</Text>
                <Text style={styles.textBlock}>{orderData.problem_description}</Text>
              </View>
            </View>
          )}

          {orderData.materials.length > 0 && (
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>物料需求</Text>
                {orderData.materials.map((material) => (
                  <View key={material.material_id} style={styles.materialItem}>
                    <FontAwesome6 name="cube" size={12} color="#636E72" />
                    <Text style={styles.materialText}>
                      {material.material_name} × {material.quantity}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* 栏5：服务实施 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FontAwesome6 name="screwdriver-wrench" size={18} color="#1E88E5" />
            <Text style={styles.sectionTitle}>服务实施</Text>
          </View>

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>实施人</Text>
              <Text style={styles.value}>{orderData.implementer || '未指定'}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>实际工时</Text>
              <Text style={styles.value}>{orderData.actual_hours} 小时</Text>
            </View>
          </View>

          {orderData.implementation_complete_date && (
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>实施完成日期</Text>
                <Text style={styles.value}>
                  {new Date(orderData.implementation_complete_date).toLocaleDateString()}
                </Text>
              </View>
            </View>
          )}

          {orderData.dispatch_order_signer && (
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>派工单签字人</Text>
                <Text style={styles.value}>{orderData.dispatch_order_signer}</Text>
              </View>
            </View>
          )}
        </View>

        {/* 栏6：服务回款 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FontAwesome6 name="money-bill-transfer" size={18} color="#1E88E5" />
            <Text style={styles.sectionTitle}>服务回款</Text>
          </View>

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>是否申请开票</Text>
              <Text style={styles.value}>{orderData.invoice_application ? '是' : '否'}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>开票是否完成</Text>
              <Text style={styles.value}>{orderData.invoice_completion ? '已开票' : '待开票'}</Text>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>发票是否送达</Text>
              <Text style={styles.value}>{orderData.invoice_delivered ? '是' : '否'}</Text>
            </View>
          </View>

          {orderData.planned_collection_date && (
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>计划回款日期</Text>
                <Text style={styles.value}>
                  {new Date(orderData.planned_collection_date).toLocaleDateString()}
                </Text>
              </View>
            </View>
          )}

          {orderData.actual_collection_date && (
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>实际回款日期</Text>
                <Text style={styles.value}>
                  {new Date(orderData.actual_collection_date).toLocaleDateString()}
                </Text>
              </View>
            </View>
          )}

          {orderData.collection_records.length > 0 && (
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>回款进展记录</Text>
                {orderData.collection_records.map((record) => (
                  <View key={record.id} style={styles.recordCard}>
                    <Text style={styles.recordContent}>{record.content}</Text>
                    <View style={styles.recordMeta}>
                      <Text style={styles.recordMetaText}>
                        {record.updater} · {new Date(record.update_date).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* 操作按钮 */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => router.push('/after-sales-edit', { id: orderData.id })}
          >
            <FontAwesome6 name="pen" size={18} color="#FFFFFF" />
            <Text style={styles.editButtonText}>编辑工单</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Screen>
  );
}

function formatMoney(amount: number): string {
  return `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const styles = StyleSheet.create({
  container: {
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
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3436',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 12,
  },
  col: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    color: '#636E72',
    marginBottom: 4,
  },
  value: {
    fontSize: 14,
    color: '#2D3436',
    fontWeight: '500',
  },
  highlight: {
    color: '#1E88E5',
    fontWeight: '600',
  },
  money: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E74C3C',
  },
  textBlock: {
    fontSize: 14,
    color: '#2D3436',
    lineHeight: 20,
    backgroundColor: '#F5F7FA',
    padding: 12,
    borderRadius: 8,
  },
  numberBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(30, 136, 229, 0.1)',
    alignSelf: 'flex-start',
  },
  numberText: {
    fontSize: 13,
    color: '#1E88E5',
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  contactCard: {
    backgroundColor: '#F5F7FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  contactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  contactName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2D3436',
  },
  contactRole: {
    fontSize: 12,
    color: '#95A5A6',
  },
  contactPhone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  contactPhoneText: {
    fontSize: 13,
    color: '#636E72',
  },
  materialItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  materialText: {
    fontSize: 13,
    color: '#2D3436',
  },
  recordCard: {
    backgroundColor: '#F5F7FA',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  recordContent: {
    fontSize: 13,
    color: '#2D3436',
    marginBottom: 4,
  },
  recordMeta: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  recordMetaText: {
    fontSize: 11,
    color: '#95A5A6',
  },
  actions: {
    padding: 16,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#1E88E5',
  },
  editButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
