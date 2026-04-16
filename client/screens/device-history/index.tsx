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
import { Screen } from '@/components/Screen';
import { PageHeader } from '@/components/PageHeader';
import { FontAwesome6 } from '@expo/vector-icons';
import { SmartDateInput } from '@/components/SmartDateInput';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { getApiBaseUrl } from '@/utils/api';
import { createFormDataFile } from '@/utils';
import * as DocumentPicker from 'expo-document-picker';
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

export default function DeviceHistory() {
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
        `${getApiBaseUrl()}/api/v1/devices/${deviceId}/history-detail`
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
        `${getApiBaseUrl()}/api/v1/devices/${deviceId}/history-detail`,
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
              `${getApiBaseUrl()}/api/v1/devices/${deviceId}/history-detail`,
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

  const handleDownload = () => {
    Alert.alert('提示', '下载功能开发中...');
  };

  // 上传附件
  const handleUploadAttachment = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.pdf'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      // 获取文件大小（Web 平台使用 file.size，移动端使用 getInfoAsync）
      const fileSize = Platform.OS === 'web' ? file.size : ((await (FileSystem as any).getInfoAsync(file.uri)) as any).size;

      setUploading(true);

      // 上传到服务器
      const formData = new FormData();
      const formDataFile = await createFormDataFile(file.uri, file.name, file.mimeType || 'application/octet-stream');
      formData.append('file', formDataFile);

      const response = await fetch(
        `${getApiBaseUrl()}/api/v1/files/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (response.ok) {
        const data = await response.json();
        const newAttachment: Attachment = {
          id: Date.now().toString(),
          name: file.name,
          uri: data.url || file.uri,
          type: file.mimeType || 'application/octet-stream',
          size: fileSize || 0,
        };
        setAttachments([...attachments, newAttachment]);
        Alert.alert('成功', '文件上传成功');
      } else {
        // 即使上传失败，也添加到本地列表
        const newAttachment: Attachment = {
          id: Date.now().toString(),
          name: file.name,
          uri: file.uri,
          type: file.mimeType || 'application/octet-stream',
          size: fileInfo.size || 0,
        };
        setAttachments([...attachments, newAttachment]);
        Alert.alert('提示', '文件已添加（本地模式）');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      Alert.alert('错误', '上传失败');
    } finally {
      setUploading(false);
    }
  };

  // 删除附件
  const handleRemoveAttachment = (id: string) => {
    Alert.alert('确认删除', '确定要删除此附件吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: () => {
          setAttachments(attachments.filter(a => a.id !== id));
        },
      },
    ]);
  };

  // 获取文件图标
  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return 'file-pdf';
    if (type.includes('word') || type.includes('doc')) return 'file-word';
    if (type.includes('excel') || type.includes('sheet') || type.includes('xls')) return 'file-excel';
    if (type.includes('powerpoint') || type.includes('ppt')) return 'file-powerpoint';
    return 'file';
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const renderInfoField = (label: string, value: string) => (
    <View style={styles.infoField}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || '-'}</Text>
    </View>
  );

  const renderInfoSection = (title: string, icon: string, children: React.ReactNode) => (
    <View style={styles.infoSection}>
      <View style={styles.sectionHeader}>
        <FontAwesome6 name={icon as any} size={18} color="#1E88E5" />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );

  const renderFormInput = (label: string, field: keyof DeviceHistoryData, multiline = false) => (
    <View style={styles.formGroup}>
      <Text style={styles.formLabel}>{label}</Text>
      <TextInput
        style={[styles.formInput, multiline && styles.formInputMultiline]}
        value={historyData[field] as string}
        onChangeText={(text) => setHistoryData({ ...historyData, [field]: text })}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
      />
    </View>
  );

  return (
    <Screen>
      <PageHeader title="设备履历表" />

      {/* 设备名称 */}
      {deviceName && (
        <View style={styles.deviceHeader}>
          <FontAwesome6 name="microchip" size={20} color="#2ECC71" />
          <Text style={styles.deviceHeaderText}>{deviceName}</Text>
        </View>
      )}

      {/* 顶部操作按钮 */}
      <View style={styles.topActions}>
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
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <Text>加载中...</Text>
        </View>
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
                  <View key={attachment.id} style={styles.attachmentItem}>
                    <FontAwesome6
                      name={getFileIcon(attachment.type) as any}
                      size={24}
                      color="#1E88E5"
                    />
                    <View style={styles.attachmentInfo}>
                      <Text style={styles.attachmentName}>{attachment.name}</Text>
                      <Text style={styles.attachmentSize}>
                        {formatFileSize(attachment.size)}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.noAttachments}>暂无附件</Text>
              )}
            </>
          )}
        </ScrollView>
      )}

      {/* 编辑Modal */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>编辑履历表</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <FontAwesome6 name="xmark" size={20} color="#636E72" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* 基本信息 */}
              <Text style={styles.modalSectionTitle}>基本信息</Text>
              {renderFormInput('设备名称', 'device_name')}
              {renderFormInput('产品规格', 'product_spec')}
              {renderFormInput('设备编码', 'device_code')}

              {/* 销售订单信息 */}
              <Text style={styles.modalSectionTitle}>销售订单信息</Text>
              {renderFormInput('合同名称', 'contract_name')}
              {renderFormInput('合同编号', 'contract_number')}
              <View style={styles.formGroup}>
                <SmartDateInput
                  label="合同签订日期"
                  value={historyData.contract_date}
                  onChange={(date) => setHistoryData({ ...historyData, contract_date: date })}
                  placeholder="请选择合同签订日期"
                />
              </View>
              {renderFormInput('客户名称', 'customer_name')}
              {renderFormInput('业务经理', 'sales_manager')}
              {renderFormInput('设备质保期', 'warranty_period')}

              {/* 制造信息 */}
              <Text style={styles.modalSectionTitle}>制造信息</Text>
              {renderFormInput('生产单位', 'production_unit')}
              {renderFormInput('生产订单号', 'production_order')}
              {renderFormInput('批次号', 'batch_number')}
              {renderFormInput('生产负责人', 'production_manager')}
              <View style={styles.formGroup}>
                <SmartDateInput
                  label="生产完工日期"
                  value={historyData.production_complete_date}
                  onChange={(date) => setHistoryData({ ...historyData, production_complete_date: date })}
                  placeholder="请选择生产完工日期"
                />
              </View>
              {renderFormInput('测试人', 'tester')}
              <View style={styles.formGroup}>
                <SmartDateInput
                  label="调试完工日期"
                  value={historyData.debug_complete_date}
                  onChange={(date) => setHistoryData({ ...historyData, debug_complete_date: date })}
                  placeholder="请选择调试完工日期"
                />
              </View>
              {renderFormInput('质检员', 'quality_inspector')}
              {renderFormInput('出厂检验人', 'factory_inspector')}
              <View style={styles.formGroup}>
                <SmartDateInput
                  label="出厂日期"
                  value={historyData.factory_date}
                  onChange={(date) => setHistoryData({ ...historyData, factory_date: date })}
                  placeholder="请选择出厂日期"
                />
              </View>
              {renderFormInput('设备制造SOP文件', 'manufacturing_sop_file')}
              {renderFormInput('出厂检验文件包', 'factory_test_files')}
              {renderFormInput('设备质保范围与价格标准', 'warranty_scope_price', true)}

              {/* 交付验收信息 */}
              <Text style={styles.modalSectionTitle}>交付验收信息</Text>
              {renderFormInput('项目交付PM', 'delivery_pm')}
              {renderFormInput('客户现场对接人', 'customer_contact')}
              {renderFormInput('交付厂区/车间区域', 'delivery_location')}
              {renderFormInput('交付人', 'delivery_person')}
              <View style={styles.formGroup}>
                <SmartDateInput
                  label="计划进场时间"
                  value={historyData.planned_arrival_date}
                  onChange={(date) => setHistoryData({ ...historyData, planned_arrival_date: date })}
                  placeholder="请选择计划进场时间"
                />
              </View>
              <View style={styles.formGroup}>
                <SmartDateInput
                  label="实际进场时间"
                  value={historyData.actual_arrival_date}
                  onChange={(date) => setHistoryData({ ...historyData, actual_arrival_date: date })}
                  placeholder="请选择实际进场时间"
                />
              </View>
              {renderFormInput('验收负责人', 'acceptance_manager')}
              {renderFormInput('客户验收干系人', 'customer_acceptance_stakeholders')}
              <View style={styles.formGroup}>
                <SmartDateInput
                  label="计划验收时间"
                  value={historyData.planned_acceptance_date}
                  onChange={(date) => setHistoryData({ ...historyData, planned_acceptance_date: date })}
                  placeholder="请选择计划验收时间"
                />
              </View>
              <View style={styles.formGroup}>
                <SmartDateInput
                  label="实际验收时间"
                  value={historyData.actual_acceptance_date}
                  onChange={(date) => setHistoryData({ ...historyData, actual_acceptance_date: date })}
                  placeholder="请选择实际验收时间"
                />
              </View>
              <View style={styles.formGroup}>
                <SmartDateInput
                  label="设备质保到期时间"
                  value={historyData.warranty_expiry_date}
                  onChange={(date) => setHistoryData({ ...historyData, warranty_expiry_date: date })}
                  placeholder="请选择质保到期时间"
                />
              </View>
              {renderFormInput('交付协同人员', 'delivery_team')}
              {renderFormInput('客户培训人员', 'customer_training_personnel')}
              {renderFormInput('设备质保期', 'device_warranty_period')}
              {renderFormInput('设备操作SOP', 'operation_sop')}
              {renderFormInput('设备培训确认单文件', 'training_confirmation_file')}
              {renderFormInput('设备维保SOP', 'maintenance_sop')}

              {/* 研发信息 */}
              <Text style={styles.modalSectionTitle}>研发信息</Text>
              {renderFormInput('方案文件', 'solution_files')}
              {renderFormInput('出厂软件算法版本说明', 'software_version', true)}

              {/* 附件 */}
              <Text style={styles.modalSectionTitle}>附件</Text>
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={handleUploadAttachment}
                disabled={uploading}
              >
                <FontAwesome6 name="cloud-upload-alt" size={20} color="#1E88E5" />
                <Text style={styles.uploadButtonText}>
                  {uploading ? '上传中...' : '上传附件 (Word/PPT/Excel/PDF)'}
                </Text>
              </TouchableOpacity>

              {attachments.length > 0 && (
                <View style={styles.attachmentList}>
                  {attachments.map((attachment) => (
                    <View key={attachment.id} style={styles.attachmentRow}>
                      <View style={styles.attachmentRowLeft}>
                        <FontAwesome6
                          name={getFileIcon(attachment.type) as any}
                          size={20}
                          color="#1E88E5"
                        />
                        <Text style={styles.attachmentRowName} numberOfLines={1}>
                          {attachment.name}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleRemoveAttachment(attachment.id)}
                        style={styles.removeButton}
                      >
                        <FontAwesome6 name="times" size={16} color="#E74C3C" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
              <Text style={styles.uploadHint}>
                支持格式：.doc, .docx, .ppt, .pptx, .xls, .xlsx, .pdf
              </Text>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleSave}
              >
                <Text style={styles.submitButtonText}>保存</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  deviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  deviceHeaderText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
  },
  topActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#636E72',
    fontWeight: '500',
  },
  contentContainer: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoSection: {
    backgroundColor: '#FFFFFF',
    marginTop: 12,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#1E88E5',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },
  sectionContent: {
    gap: 12,
  },
  infoField: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  infoLabel: {
    width: 180,
    fontSize: 14,
    color: '#7F8C8D',
    fontWeight: '500',
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    color: '#2C3E50',
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  attachmentInfo: {
    flex: 1,
  },
  attachmentName: {
    fontSize: 14,
    color: '#2C3E50',
  },
  attachmentSize: {
    fontSize: 12,
    color: '#95A5A6',
    marginTop: 2,
  },
  noAttachments: {
    fontSize: 14,
    color: '#95A5A6',
    textAlign: 'center',
    paddingVertical: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '95%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
  },
  modalBody: {
    padding: 20,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E88E5',
    marginTop: 16,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#34495E',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#2C3E50',
    backgroundColor: '#FFFFFF',
  },
  formInputMultiline: {
    height: 80,
    textAlignVertical: 'top',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: '#1E88E5',
    borderRadius: 12,
    borderStyle: 'dashed',
    backgroundColor: '#F5F9FF',
  },
  uploadButtonText: {
    fontSize: 14,
    color: '#1E88E5',
    fontWeight: '600',
  },
  attachmentList: {
    marginTop: 12,
    gap: 8,
  },
  attachmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  attachmentRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  attachmentRowName: {
    fontSize: 14,
    color: '#2C3E50',
    flex: 1,
  },
  removeButton: {
    padding: 4,
  },
  uploadHint: {
    fontSize: 12,
    color: '#95A5A6',
    textAlign: 'center',
    marginTop: 8,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#636E72',
  },
  submitButton: {
    backgroundColor: '#1E88E5',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
