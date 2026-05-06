import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { PCLayout } from '@/components/pc/PCLayout';
import { FontAwesome6 } from '@expo/vector-icons';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { apiUrl } from '@/utils/api';
import * as FileSystem from 'expo-file-system/legacy';

interface Attachment {
  id: string;
  name: string;
  uri: string;
  type: string;
  size: number;
}

interface DeviceHistoryData {
  // 基本信息
  device_name: string;
  product_spec: string;
  device_code: string;

  // 销售订单信息
  contract_name: string;
  contract_number: string;
  contract_date: string;
  customer_name: string;
  sales_manager: string;
  warranty_period: string;

  // 制造信息
  production_unit: string;
  production_order: string;
  batch_number: string;
  production_manager: string;
  production_complete_date: string;
  tester: string;
  debug_complete_date: string;
  quality_inspector: string;
  factory_inspector: string;
  factory_date: string;
  manufacturing_sop_file: string;
  factory_test_files: string;
  warranty_scope_price: string;

  // 交付验收信息
  delivery_pm: string;
  customer_contact: string;
  delivery_location: string;
  delivery_person: string;
  planned_arrival_date: string;
  actual_arrival_date: string;
  acceptance_manager: string;
  customer_acceptance_stakeholders: string;
  planned_acceptance_date: string;
  actual_acceptance_date: string;
  warranty_expiry_date: string;
  delivery_team: string;
  customer_training_personnel: string;
  device_warranty_period: string;
  operation_sop: string;
  training_confirmation_file: string;
  maintenance_sop: string;

  // 研发信息
  solution_files: string;
  software_version: string;

  // 附件
  attachments: string;
}

const initialHistoryData: DeviceHistoryData = {
  // 基本信息
  device_name: '',
  product_spec: '',
  device_code: '',

  // 销售订单信息
  contract_name: '',
  contract_number: '',
  contract_date: '',
  customer_name: '',
  sales_manager: '',
  warranty_period: '',

  // 制造信息
  production_unit: '',
  production_order: '',
  batch_number: '',
  production_manager: '',
  production_complete_date: '',
  tester: '',
  debug_complete_date: '',
  quality_inspector: '',
  factory_inspector: '',
  factory_date: '',
  manufacturing_sop_file: '',
  factory_test_files: '',
  warranty_scope_price: '',

  // 交付验收信息
  delivery_pm: '',
  customer_contact: '',
  delivery_location: '',
  delivery_person: '',
  planned_arrival_date: '',
  actual_arrival_date: '',
  acceptance_manager: '',
  customer_acceptance_stakeholders: '',
  planned_acceptance_date: '',
  actual_acceptance_date: '',
  warranty_expiry_date: '',
  delivery_team: '',
  customer_training_personnel: '',
  device_warranty_period: '',
  operation_sop: '',
  training_confirmation_file: '',
  maintenance_sop: '',

  // 研发信息
  solution_files: '',
  software_version: '',

  // 附件
  attachments: '',
};

export default function PCDeviceHistory() {
  const router = useSafeRouter();
  const params = useSafeSearchParams<{ deviceId: string; deviceName: string }>();

  const deviceId = params.deviceId ? parseInt(params.deviceId) : 0;
  const deviceName = params.deviceName || '';

  const [loading, setLoading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [historyData, setHistoryData] = useState<DeviceHistoryData>(initialHistoryData);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadHistoryData();
  }, []);

  const loadHistoryData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        apiUrl(`/api/v1/devices/${deviceId}/history-detail`)
      );
      const data = await response.json();
      if (response.ok) {
        const fullData = { ...initialHistoryData, ...data };
        setHistoryData(fullData);
        // 解析附件
        if (fullData.attachments) {
          try {
            const attachmentList = JSON.parse(fullData.attachments);
            setAttachments(attachmentList);
          } catch {
            setAttachments([]);
          }
        }
      } else {
        Alert.alert('错误', data.error || '加载履历表失败');
      }
    } catch (error) {
      console.error('Load history data error:', error);
      Alert.alert('错误', '网络请求失败');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditModalVisible(true);
  };

  const handleSave = async () => {
    try {
      const saveData = {
        ...historyData,
        attachments: JSON.stringify(attachments),
      };
      const response = await fetch(
        apiUrl(`/api/v1/devices/${deviceId}/history-detail`),
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(saveData),
        }
      );

      if (response.ok) {
        Alert.alert('成功', '保存成功');
        setEditModalVisible(false);
        loadHistoryData();
      } else {
        const data = await response.json();
        throw new Error(data.error || '保存失败');
      }
    } catch (error: any) {
      Alert.alert('错误', error.message);
    }
  };

  const handleDelete = () => {
    Alert.alert('确认删除', '确定要删除这份履历表吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            const response = await fetch(
              apiUrl(`/api/v1/devices/${deviceId}/history-detail`),
              { method: 'DELETE' }
            );
            if (response.ok) {
              Alert.alert('成功', '删除成功');
              router.back();
            } else {
              const data = await response.json();
              throw new Error(data.error || '删除失败');
            }
          } catch (error: any) {
            Alert.alert('错误', error.message);
          }
        },
      },
    ]);
  };

  const handleImport = () => {
    Alert.alert('提示', '导入功能开发中...');
  };

  // 下载功能
  const handleDownload = async () => {
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/devices/${deviceId}/history-detail/export`
      );

      if (!response.ok) {
        throw new Error('导出失败');
      }

      // Web端下载
      if (Platform.OS === 'web') {
        const blob = await response.blob();
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = `设备履历表_${deviceId}.xlsx`;

        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
          if (filenameMatch && filenameMatch[1]) {
            filename = decodeURIComponent(filenameMatch[1]);
          }
        }

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        Alert.alert('成功', '下载成功！');
      } else {
        const fileUri = FileSystem.documentDirectory + `设备履历表_${deviceId}.xlsx`;
        const base64 = await response.text();
        await (FileSystem as any).writeAsStringAsync(fileUri, base64, {
          encoding: FileSystem.EncodingType.Base64,
        });
        Alert.alert('成功', '文件已保存到文档目录');
      }
    } catch (error) {
      console.error('下载失败:', error);
      Alert.alert('错误', '下载失败，请重试');
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const renderInfoField = (label: string, value: string) => (
    <div style={styles.infoField}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || '-'}</Text>
    </div>
  );

  const renderInfoSection = (title: string, icon: string, children: React.ReactNode) => (
    <div style={styles.infoSection}>
      <div style={styles.sectionHeader}>
        <FontAwesome6 name={icon as any} size={18} color="#1E88E5" />
        <Text style={styles.sectionTitle}>{title}</Text>
      </div>
      <div style={styles.sectionContent}>{children}</div>
    </div>
  );

  const renderFormInput = (label: string, field: keyof DeviceHistoryData, multiline = false) => (
    <div style={styles.formGroup}>
      <Text style={styles.formLabel}>{label}</Text>
      <input
        style={styles.formInput}
        type="text"
        value={historyData[field] as string}
        onChange={(e) => setHistoryData({ ...historyData, [field]: e.target.value })}
      />
    </div>
  );

  return (
    <PCLayout title="设备履历表">
      <div style={styles.pageContainer}>
        {/* 设备名称 */}
        {deviceName && (
          <div style={styles.deviceHeader}>
            <FontAwesome6 name="microchip" size={24} color="#2ECC71" />
            <Text style={styles.deviceHeaderText}>{deviceName}</Text>
          </div>
        )}

        {/* 顶部操作按钮 */}
        <div style={styles.topActions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleEdit}>
            <FontAwesome6 name="pen" size={16} color="#F39C12" />
            <Text style={styles.actionButtonText}>修改</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
            <FontAwesome6 name="trash" size={16} color="#E74C3C" />
            <Text style={styles.actionButtonText}>删除</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleImport}>
            <FontAwesome6 name="file-import" size={16} color="#3498DB" />
            <Text style={styles.actionButtonText}>导入</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleDownload}>
            <FontAwesome6 name="download" size={16} color="#2ECC71" />
            <Text style={styles.actionButtonText}>下载</Text>
          </TouchableOpacity>
        </div>

        {loading ? (
          <div style={styles.centerContainer}>
            <Text>加载中...</Text>
          </div>
        ) : (
          <ScrollView style={styles.contentContainer}>
            {/* 基本信息 */}
            {renderInfoSection(
              '基本信息',
              'info-circle',
              <>
                {renderInfoField('设备名称', historyData.device_name)}
                {renderInfoField('产品规格', historyData.product_spec)}
                {renderInfoField('设备编码', historyData.device_code)}
              </>
            )}

            {/* 销售订单信息 */}
            {renderInfoSection(
              '销售订单信息',
              'file-contract',
              <>
                {renderInfoField('合同名称', historyData.contract_name)}
                {renderInfoField('合同编号', historyData.contract_number)}
                {renderInfoField('合同签订日期', formatDate(historyData.contract_date))}
                {renderInfoField('客户名称', historyData.customer_name)}
                {renderInfoField('业务经理', historyData.sales_manager)}
                {renderInfoField('设备质保期', historyData.warranty_period)}
              </>
            )}

            {/* 制造信息 */}
            {renderInfoSection(
              '制造信息',
              'industry',
              <>
                {renderInfoField('生产单位', historyData.production_unit)}
                {renderInfoField('生产订单号', historyData.production_order)}
                {renderInfoField('批次号', historyData.batch_number)}
                {renderInfoField('生产负责人', historyData.production_manager)}
                {renderInfoField('生产完工日期', formatDate(historyData.production_complete_date))}
                {renderInfoField('测试人', historyData.tester)}
                {renderInfoField('调试完工日期', formatDate(historyData.debug_complete_date))}
                {renderInfoField('质检员', historyData.quality_inspector)}
                {renderInfoField('出厂检验人', historyData.factory_inspector)}
                {renderInfoField('出厂日期', formatDate(historyData.factory_date))}
                {renderInfoField('设备制造SOP文件', historyData.manufacturing_sop_file)}
                {renderInfoField('出厂检验文件包', historyData.factory_test_files)}
                {renderInfoField('设备质保范围与价格标准', historyData.warranty_scope_price)}
              </>
            )}

            {/* 交付验收信息 */}
            {renderInfoSection(
              '交付验收信息',
              'truck-ramp-box',
              <>
                {renderInfoField('项目交付PM', historyData.delivery_pm)}
                {renderInfoField('客户现场对接人', historyData.customer_contact)}
                {renderInfoField('交付厂区/车间区域', historyData.delivery_location)}
                {renderInfoField('交付人', historyData.delivery_person)}
                {renderInfoField('计划进场时间', formatDate(historyData.planned_arrival_date))}
                {renderInfoField('实际进场时间', formatDate(historyData.actual_arrival_date))}
                {renderInfoField('验收负责人', historyData.acceptance_manager)}
                {renderInfoField('客户验收干系人', historyData.customer_acceptance_stakeholders)}
                {renderInfoField('计划验收时间', formatDate(historyData.planned_acceptance_date))}
                {renderInfoField('实际验收时间', formatDate(historyData.actual_acceptance_date))}
                {renderInfoField('设备质保到期时间', formatDate(historyData.warranty_expiry_date))}
                {renderInfoField('交付协同人员', historyData.delivery_team)}
                {renderInfoField('客户培训人员', historyData.customer_training_personnel)}
                {renderInfoField('设备质保期', historyData.device_warranty_period)}
                {renderInfoField('设备操作SOP', historyData.operation_sop)}
                {renderInfoField('设备培训确认单文件', historyData.training_confirmation_file)}
                {renderInfoField('设备维保SOP', historyData.maintenance_sop)}
              </>
            )}

            {/* 研发信息 */}
            {renderInfoSection(
              '研发信息',
              'flask',
              <>
                {renderInfoField('方案文件', historyData.solution_files)}
                {renderInfoField('出厂软件算法版本说明', historyData.software_version)}
              </>
            )}

            {/* 附件信息 */}
            {renderInfoSection(
              '附件',
              'paperclip',
              <>
                {attachments.length > 0 ? (
                  attachments.map((attachment) => (
                    <div key={attachment.id} style={styles.attachmentItem}>
                      <FontAwesome6
                        name="file"
                        size={24}
                        color="#1E88E5"
                      />
                      <div style={styles.attachmentInfo}>
                        <Text style={styles.attachmentName}>{attachment.name}</Text>
                        <Text style={styles.attachmentSize}>
                          {formatFileSize(attachment.size)}
                        </Text>
                      </div>
                    </div>
                  ))
                ) : (
                  <Text style={styles.noAttachments}>暂无附件</Text>
                )}
              </>
            )}
          </ScrollView>
        )}
      </div>

      {/* 编辑Modal */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={modalStyles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <div style={modalStyles.modalContent}>
            <div style={modalStyles.modalHeader}>
              <Text style={modalStyles.modalTitle}>编辑履历表</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <FontAwesome6 name="xmark" size={20} color="#636E72" />
              </TouchableOpacity>
            </div>

            <ScrollView style={modalStyles.modalBody}>
              {/* 基本信息 */}
              <Text style={modalStyles.modalSectionTitle}>基本信息</Text>
              {renderFormInput('设备名称', 'device_name')}
              {renderFormInput('产品规格', 'product_spec')}
              {renderFormInput('设备编码', 'device_code')}

              {/* 销售订单信息 */}
              <Text style={modalStyles.modalSectionTitle}>销售订单信息</Text>
              {renderFormInput('合同名称', 'contract_name')}
              {renderFormInput('合同编号', 'contract_number')}
              {renderFormInput('合同签订日期', 'contract_date')}
              {renderFormInput('客户名称', 'customer_name')}
              {renderFormInput('业务经理', 'sales_manager')}
              {renderFormInput('设备质保期', 'warranty_period')}

              {/* 制造信息 */}
              <Text style={modalStyles.modalSectionTitle}>制造信息</Text>
              {renderFormInput('生产单位', 'production_unit')}
              {renderFormInput('生产订单号', 'production_order')}
              {renderFormInput('批次号', 'batch_number')}
              {renderFormInput('生产负责人', 'production_manager')}
              {renderFormInput('生产完工日期', 'production_complete_date')}
              {renderFormInput('测试人', 'tester')}
              {renderFormInput('调试完工日期', 'debug_complete_date')}
              {renderFormInput('质检员', 'quality_inspector')}
              {renderFormInput('出厂检验人', 'factory_inspector')}
              {renderFormInput('出厂日期', 'factory_date')}
              {renderFormInput('设备制造SOP文件', 'manufacturing_sop_file')}
              {renderFormInput('出厂检验文件包', 'factory_test_files')}
              {renderFormInput('设备质保范围与价格标准', 'warranty_scope_price')}

              {/* 交付验收信息 */}
              <Text style={modalStyles.modalSectionTitle}>交付验收信息</Text>
              {renderFormInput('项目交付PM', 'delivery_pm')}
              {renderFormInput('客户现场对接人', 'customer_contact')}
              {renderFormInput('交付厂区/车间区域', 'delivery_location')}
              {renderFormInput('交付人', 'delivery_person')}
              {renderFormInput('计划进场时间', 'planned_arrival_date')}
              {renderFormInput('实际进场时间', 'actual_arrival_date')}
              {renderFormInput('验收负责人', 'acceptance_manager')}
              {renderFormInput('客户验收干系人', 'customer_acceptance_stakeholders')}
              {renderFormInput('计划验收时间', 'planned_acceptance_date')}
              {renderFormInput('实际验收时间', 'actual_acceptance_date')}
              {renderFormInput('设备质保到期时间', 'warranty_expiry_date')}
              {renderFormInput('交付协同人员', 'delivery_team')}
              {renderFormInput('客户培训人员', 'customer_training_personnel')}
              {renderFormInput('设备质保期', 'device_warranty_period')}
              {renderFormInput('设备操作SOP', 'operation_sop')}
              {renderFormInput('设备培训确认单文件', 'training_confirmation_file')}
              {renderFormInput('设备维保SOP', 'maintenance_sop')}

              {/* 研发信息 */}
              <Text style={modalStyles.modalSectionTitle}>研发信息</Text>
              {renderFormInput('方案文件', 'solution_files')}
              {renderFormInput('出厂软件算法版本说明', 'software_version')}
            </ScrollView>

            <div style={modalStyles.modalFooter}>
              <button style={modalStyles.cancelBtn} onClick={() => setEditModalVisible(false)}>取消</button>
              <button style={modalStyles.submitBtn} onPress={handleSave}>保存</button>
            </div>
          </div>
        </KeyboardAvoidingView>
      </Modal>
    </PCLayout>
  );
}

// 格式化文件大小
const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const modalStyles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    width: '90%',
    maxWidth: '600px',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8',
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#333',
    margin: 0,
  },
  modalBody: {
    flex: 1,
    padding: '20px',
    overflowY: 'auto',
  },
  modalSectionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1E88E5',
    marginBottom: '12px',
    marginTop: '16px',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: '12px',
    padding: '16px 20px',
    borderTopWidth: 1,
    borderTopColor: '#e8e8e8',
  },
  cancelBtn: {
    padding: '10px 20px',
    borderRadius: '6px',
    border: '1px solid #d9d9d9',
    backgroundColor: '#fff',
    color: '#666',
    fontSize: '14px',
    cursor: 'pointer',
  },
  submitBtn: {
    padding: '10px 20px',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: '#1E88E5',
    color: '#fff',
    fontSize: '14px',
    cursor: 'pointer',
  },
});

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: '20px',
  },
  deviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '12px',
    backgroundColor: '#fff',
    padding: '16px 20px',
    borderRadius: '8px',
    marginBottom: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  deviceHeaderText: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#333',
    margin: 0,
  },
  topActions: {
    flexDirection: 'row',
    gap: '12px',
    marginBottom: '16px',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    backgroundColor: '#fff',
    borderRadius: '6px',
    border: '1px solid #e8e8e8',
    cursor: 'pointer',
  },
  actionButtonText: {
    fontSize: '14px',
    color: '#333',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: '40px',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  infoSection: {
    marginBottom: '24px',
    backgroundColor: '#fafafa',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 16px',
    backgroundColor: '#e3f2fd',
    borderBottomWidth: 1,
    borderBottomColor: '#bbdefb',
  },
  sectionTitle: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#1E88E5',
    margin: 0,
  },
  sectionContent: {
    padding: '16px',
  },
  infoField: {
    flexDirection: 'row',
    marginBottom: '12px',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: '8px',
  },
  infoLabel: {
    width: '150px',
    fontSize: '14px',
    color: '#666',
    flexShrink: 0,
  },
  infoValue: {
    flex: 1,
    fontSize: '14px',
    color: '#333',
  },
  formGroup: {
    marginBottom: '16px',
  },
  formLabel: {
    display: 'block',
    fontSize: '14px',
    color: '#666',
    marginBottom: '6px',
  },
  formInput: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    borderWidth: 1,
    borderColor: '#d9d9d9',
    borderRadius: '6px',
    outline: 'none',
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    backgroundColor: '#fff',
    borderRadius: '6px',
    borderWidth: 1,
    borderColor: '#e8e8e8',
    marginBottom: '8px',
  },
  attachmentInfo: {
    flex: 1,
  },
  attachmentName: {
    fontSize: '14px',
    color: '#333',
    margin: 0,
  },
  attachmentSize: {
    fontSize: '12px',
    color: '#999',
    margin: 0,
    marginTop: '4px',
  },
  noAttachments: {
    fontSize: '14px',
    color: '#999',
    textAlign: 'center',
    padding: '20px',
  },
});
