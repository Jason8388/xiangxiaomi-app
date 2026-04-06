import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { PageHeader } from '@/components/PageHeader';
import { FontAwesome6 } from '@expo/vector-icons';
import { useSafeRouter } from '@/hooks/useSafeRouter';

const TASK_STAGES = ['需求评估', '报价中', '实施中', '已完成', '已取消'];
const TASK_STATUSES = ['待开始', '进行中', '已延期', '已暂停'];

export default function AfterSalesCreate() {
  const router = useSafeRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    order_name: '',
    customer_name: '',
    task_owner: '',
    task_stage: '需求评估',
    task_status: '待开始',
    demand_description: '',
    planned_hours: '',
    is_charged: false,
    quote_amount: '',
  });

  const handleSubmit = async () => {
    if (!formData.order_name.trim()) {
      Alert.alert('提示', '请输入工单名称');
      return;
    }
    if (!formData.customer_name.trim()) {
      Alert.alert('提示', '请输入客户名称');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/after-sales/orders`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        }
      );

      if (response.ok) {
        Alert.alert('成功', '工单创建成功', [
          { text: '确定', onPress: () => router.back() },
        ]);
      } else {
        const error = await response.json();
        Alert.alert('错误', error.message || '创建失败');
      }
    } catch (error) {
      Alert.alert('错误', '创建失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <PageHeader title="创建工单" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={styles.container}>
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>工单名称 *</Text>
              <TextInput
                style={styles.input}
                value={formData.order_name}
                onChangeText={(text) => setFormData({ ...formData, order_name: text })}
                placeholder="请输入工单名称"
                placeholderTextColor="#B2BEC3"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>客户名称 *</Text>
              <TextInput
                style={styles.input}
                value={formData.customer_name}
                onChangeText={(text) => setFormData({ ...formData, customer_name: text })}
                placeholder="请输入客户名称"
                placeholderTextColor="#B2BEC3"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>任务负责人</Text>
              <TextInput
                style={styles.input}
                value={formData.task_owner}
                onChangeText={(text) => setFormData({ ...formData, task_owner: text })}
                placeholder="请输入负责人姓名"
                placeholderTextColor="#B2BEC3"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>工单阶段</Text>
              <View style={styles.tagContainer}>
                {TASK_STAGES.map((stage) => (
                  <TouchableOpacity
                    key={stage}
                    style={[
                      styles.tag,
                      formData.task_stage === stage && styles.tagActive,
                    ]}
                    onPress={() => setFormData({ ...formData, task_stage: stage })}
                  >
                    <Text
                      style={[
                        styles.tagText,
                        formData.task_stage === stage && styles.tagTextActive,
                      ]}
                    >
                      {stage}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>工单状态</Text>
              <View style={styles.tagContainer}>
                {TASK_STATUSES.map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.tag,
                      formData.task_status === status && styles.tagActive,
                    ]}
                    onPress={() => setFormData({ ...formData, task_status: status })}
                  >
                    <Text
                      style={[
                        styles.tagText,
                        formData.task_status === status && styles.tagTextActive,
                      ]}
                    >
                      {status}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>需求描述</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.demand_description}
                onChangeText={(text) => setFormData({ ...formData, demand_description: text })}
                placeholder="请输入需求描述"
                placeholderTextColor="#B2BEC3"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>计划工时（小时）</Text>
              <TextInput
                style={styles.input}
                value={formData.planned_hours}
                onChangeText={(text) => setFormData({ ...formData, planned_hours: text })}
                placeholder="请输入计划工时"
                placeholderTextColor="#B2BEC3"
                keyboardType="numeric"
              />
            </View>

            <TouchableOpacity
              style={[
                styles.tag,
                formData.is_charged && styles.tagActive,
                { marginBottom: 16 },
              ]}
              onPress={() => setFormData({ ...formData, is_charged: !formData.is_charged })}
            >
              <FontAwesome6
                name={formData.is_charged ? 'check-square' : 'square'}
                size={18}
                color={formData.is_charged ? '#6C63FF' : '#636E72'}
              />
              <Text style={[styles.tagText, { marginLeft: 8 }]}>有偿服务</Text>
            </TouchableOpacity>

            {formData.is_charged && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>报价金额</Text>
                <TextInput
                  style={styles.input}
                  value={formData.quote_amount}
                  onChangeText={(text) => setFormData({ ...formData, quote_amount: text })}
                  placeholder="请输入报价金额"
                  placeholderTextColor="#B2BEC3"
                  keyboardType="numeric"
                />
              </View>
            )}

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={styles.submitButtonText}>
                {loading ? '提交中...' : '创建工单'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  form: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#2D3436',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  tagActive: {
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
    borderColor: '#6C63FF',
  },
  tagText: {
    fontSize: 13,
    color: '#636E72',
  },
  tagTextActive: {
    color: '#6C63FF',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#6C63FF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
