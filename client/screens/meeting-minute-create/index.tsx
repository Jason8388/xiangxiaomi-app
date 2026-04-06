import React, { useEffect, useState } from 'react';
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
  Modal,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as DocumentPicker from 'expo-document-picker';
import { Screen } from '@/components/Screen';
import { PageHeader } from '@/components/PageHeader';
import { FontAwesome6 } from '@expo/vector-icons';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';

interface FormData {
  meeting_name: string;
  meeting_type: string;
  meeting_date: string;
  meeting_location: string;
  attendees: string;
  host: string;
  recorder: string;
  topics: string;
  key_points: string;
  summary: string;
  customer_id?: number;
  project_id?: number;
  viewable_users?: string;
  tags: string[];
}

const MEETING_TYPES = [
  { value: 'department-morning', label: '部门晨会' },
  { value: 'department-weekly', label: '部门周例会' },
  { value: 'project-start', label: '项目启动会' },
  { value: 'project-push', label: '项目推进会' },
  { value: 'pm-meeting', label: 'PM会议' },
  { value: 'customer-meeting', label: '客户会议' },
  { value: 'other', label: '其它会议' },
];

interface Customer {
  id: number;
  name: string;
}

interface Project {
  id: number;
  name: string;
}

export default function MeetingMinuteCreate() {
  const router = useSafeRouter();
  const { id } = useSafeSearchParams<{ id?: string }>();
  const [isEdit, setIsEdit] = useState(!!id);
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    meeting_name: '',
    meeting_type: 'other',
    meeting_date: new Date().toISOString(),
    meeting_location: '',
    attendees: '',
    host: '',
    recorder: '',
    topics: '',
    key_points: '',
    summary: '',
    tags: [],
  });
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (id) {
      loadMeetingMinute();
    }
    loadCustomers();
    loadProjects();
  }, [id]);

  const loadMeetingMinute = async () => {
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/minutes/${id}`
      );
      const data = await response.json();
      if (response.ok) {
        setFormData({
          meeting_name: data.meeting_name,
          meeting_type: data.meeting_type,
          meeting_date: data.meeting_date,
          meeting_location: data.meeting_location,
          attendees: data.attendees,
          host: data.host,
          recorder: data.recorder,
          topics: data.topics,
          key_points: data.key_points,
          summary: data.summary,
          customer_id: data.customer_id,
          project_id: data.project_id,
          tags: data.tags ? data.tags.map((t: any) => t.tag) : [],
        });
        setSelectedDate(new Date(data.meeting_date));
        setUploadedFile(data.file_url || null);
        if (data.customer_id) {
          setSelectedCustomer({ id: data.customer_id, name: data.customer_name });
        }
        if (data.project_id) {
          setSelectedProject({ id: data.project_id, name: data.project_name });
        }
      }
    } catch (error) {
      console.error('Load meeting minute error:', error);
      Alert.alert('错误', '加载会议纪要失败');
    }
  };

  const loadCustomers = async () => {
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/customers`
      );
      const data = await response.json();
      if (response.ok) {
        setCustomers(data);
      }
    } catch (error) {
      console.error('Load customers error:', error);
    }
  };

  const loadProjects = async () => {
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/projects`
      );
      const data = await response.json();
      if (response.ok) {
        setProjects(data);
      }
    } catch (error) {
      console.error('Load projects error:', error);
    }
  };

  const handleDateChange = (event: any, date?: Date) => {
    if (date) {
      setSelectedDate(date);
      setFormData({ ...formData, meeting_date: date.toISOString() });
    }
    setShowDatePicker(false);
  };

  const handleUploadFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf'],
      });

      if (result.canceled) return;

      Alert.alert('提示', '文件上传功能待实现');
      // setUploadedFile(result.uri);
    } catch (error) {
      Alert.alert('错误', '文件选择失败');
    }
  };

  const handleSubmit = async () => {
    if (!formData.meeting_name.trim()) {
      Alert.alert('提示', '请输入会议名称');
      return;
    }
    if (!formData.meeting_location.trim()) {
      Alert.alert('提示', '请输入会议地点');
      return;
    }
    if (!formData.host.trim()) {
      Alert.alert('提示', '请输入会议主持人');
      return;
    }
    if (!formData.recorder.trim()) {
      Alert.alert('提示', '请输入会议记录人');
      return;
    }

    try {
      setLoading(true);
      const submitData = {
        ...formData,
        tags: formData.tags,
        customer_id: formData.meeting_type === 'customer-meeting' ? selectedCustomer?.id : null,
        project_id: formData.meeting_type === 'customer-meeting' ? selectedProject?.id : null,
      };

      const url = isEdit
        ? `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/minutes/${id}`
        : `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/minutes`;

      const response = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        Alert.alert('成功', isEdit ? '会议纪要修改成功' : '会议纪要创建成功', [
          {
            text: '确定',
            onPress: () => {
              if (isEdit && id) {
                router.push('/meeting-minute-detail', { id: parseInt(id) });
              } else {
                router.back();
              }
            },
          },
        ]);
      } else {
        const error = await response.json();
        Alert.alert('错误', error.message || '操作失败');
      }
    } catch (error) {
      Alert.alert('错误', '操作失败');
    } finally {
      setLoading(false);
    }
  };

  const getSelectedMeetingType = () => {
    return MEETING_TYPES.find((t) => t.value === formData.meeting_type)?.label || '请选择';
  };

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();
    if (!trimmedTag) return;
    if (formData.tags.length >= 10) {
      Alert.alert('提示', '最多只能添加10个标签');
      return;
    }
    if (formData.tags.includes(trimmedTag)) {
      Alert.alert('提示', '该标签已存在');
      return;
    }
    setFormData({ ...formData, tags: [...formData.tags, trimmedTag] });
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((tag) => tag !== tagToRemove),
    });
  };

  return (
    <Screen>
      <PageHeader title={isEdit ? '编辑会议纪要' : '新建会议纪要'} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={100}
      >
        <ScrollView style={styles.container}>
          {/* 会议名称 */}
          <View style={styles.formSection}>
            <View style={styles.labelContainer}>
              <FontAwesome6 name="heading" size={16} color="#1E88E5" />
              <Text style={styles.label}>
                会议名称 <Text style={styles.required}>*</Text>
              </Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="请输入会议名称"
              value={formData.meeting_name}
              onChangeText={(text) => setFormData({ ...formData, meeting_name: text })}
            />
          </View>

          {/* 会议类型 */}
          <View style={styles.formSection}>
            <View style={styles.labelContainer}>
              <FontAwesome6 name="list" size={16} color="#1E88E5" />
              <Text style={styles.label}>
                会议类型 <Text style={styles.required}>*</Text>
              </Text>
            </View>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowTypePicker(true)}
            >
              <Text
                style={[
                  styles.pickerText,
                  formData.meeting_type === 'other' && styles.placeholder,
                ]}
              >
                {getSelectedMeetingType()}
              </Text>
              <FontAwesome6 name="chevron-down" size={16} color="#636E72" />
            </TouchableOpacity>
          </View>

          {/* 会议时间 */}
          <View style={styles.formSection}>
            <View style={styles.labelContainer}>
              <FontAwesome6 name="calendar" size={16} color="#1E88E5" />
              <Text style={styles.label}>
                会议时间 <Text style={styles.required}>*</Text>
              </Text>
            </View>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.pickerText}>
                {selectedDate.toLocaleString('zh-CN')}
              </Text>
              <FontAwesome6 name="calendar-days" size={16} color="#636E72" />
            </TouchableOpacity>
          </View>

          {/* 会议地点 */}
          <View style={styles.formSection}>
            <View style={styles.labelContainer}>
              <FontAwesome6 name="location-dot" size={16} color="#1E88E5" />
              <Text style={styles.label}>
                会议地点 <Text style={styles.required}>*</Text>
              </Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="请输入会议地点"
              value={formData.meeting_location}
              onChangeText={(text) => setFormData({ ...formData, meeting_location: text })}
            />
          </View>

          {/* 参会人员 */}
          <View style={styles.formSection}>
            <View style={styles.labelContainer}>
              <FontAwesome6 name="users" size={16} color="#1E88E5" />
              <Text style={styles.label}>
                参会人员 <Text style={styles.required}>*</Text>
              </Text>
            </View>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="请输入参会人员（姓名之间用逗号分隔）"
              value={formData.attendees}
              onChangeText={(text) => setFormData({ ...formData, attendees: text })}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* 会议主持人 */}
          <View style={styles.formSection}>
            <View style={styles.labelContainer}>
              <FontAwesome6 name="user" size={16} color="#1E88E5" />
              <Text style={styles.label}>
                主持人 <Text style={styles.required}>*</Text>
              </Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="请输入会议主持人"
              value={formData.host}
              onChangeText={(text) => setFormData({ ...formData, host: text })}
            />
          </View>

          {/* 会议记录人 */}
          <View style={styles.formSection}>
            <View style={styles.labelContainer}>
              <FontAwesome6 name="pen-to-square" size={16} color="#1E88E5" />
              <Text style={styles.label}>
                记录人 <Text style={styles.required}>*</Text>
              </Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="请输入会议记录人"
              value={formData.recorder}
              onChangeText={(text) => setFormData({ ...formData, recorder: text })}
            />
          </View>

          {/* 关联客户（仅客户会议） */}
          {formData.meeting_type === 'customer-meeting' && (
            <>
              <View style={styles.formSection}>
                <View style={styles.labelContainer}>
                  <FontAwesome6 name="building" size={16} color="#1E88E5" />
                  <Text style={styles.label}>关联客户</Text>
                </View>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => setShowCustomerPicker(true)}
                >
                  <Text
                    style={[styles.pickerText, !selectedCustomer && styles.placeholder]}
                  >
                    {selectedCustomer?.name || '请选择关联客户'}
                  </Text>
                  <FontAwesome6 name="chevron-down" size={16} color="#636E72" />
                </TouchableOpacity>
              </View>

              <View style={styles.formSection}>
                <View style={styles.labelContainer}>
                  <FontAwesome6 name="folder-open" size={16} color="#1E88E5" />
                  <Text style={styles.label}>关联项目</Text>
                </View>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => setShowProjectPicker(true)}
                >
                  <Text
                    style={[styles.pickerText, !selectedProject && styles.placeholder]}
                  >
                    {selectedProject?.name || '请选择关联项目'}
                  </Text>
                  <FontAwesome6 name="chevron-down" size={16} color="#636E72" />
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* 会议议题 */}
          <View style={styles.formSection}>
            <View style={styles.labelContainer}>
              <FontAwesome6 name="list" size={16} color="#1E88E5" />
              <Text style={styles.label}>
                会议议题 <Text style={styles.required}>*</Text>
              </Text>
            </View>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="请输入会议议题"
              value={formData.topics}
              onChangeText={(text) => setFormData({ ...formData, topics: text })}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* 内容要点 */}
          <View style={styles.formSection}>
            <View style={styles.labelContainer}>
              <FontAwesome6 name="lightbulb" size={16} color="#1E88E5" />
              <Text style={styles.label}>
                内容要点 <Text style={styles.required}>*</Text>
              </Text>
            </View>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="请输入内容要点"
              value={formData.key_points}
              onChangeText={(text) => setFormData({ ...formData, key_points: text })}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
          </View>

          {/* 会议总结 */}
          <View style={styles.formSection}>
            <View style={styles.labelContainer}>
              <FontAwesome6 name="clipboard-check" size={16} color="#1E88E5" />
              <Text style={styles.label}>
                会议总结 <Text style={styles.required}>*</Text>
              </Text>
            </View>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="请输入会议总结"
              value={formData.summary}
              onChangeText={(text) => setFormData({ ...formData, summary: text })}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
          </View>

          {/* 上传附件 */}
          <View style={styles.formSection}>
            <View style={styles.labelContainer}>
              <FontAwesome6 name="paperclip" size={16} color="#1E88E5" />
              <Text style={styles.label}>上传附件</Text>
            </View>
            {uploadedFile ? (
              <View style={styles.fileContainer}>
                <FontAwesome6 name="file-pdf" size={24} color="#E74C3C" />
                <Text style={styles.fileName}>已上传文件</Text>
                <TouchableOpacity
                  style={styles.removeFileButton}
                  onPress={() => setUploadedFile(null)}
                >
                  <FontAwesome6 name="xmark" size={14} color="#E74C3C" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.uploadButton} onPress={handleUploadFile}>
                <FontAwesome6 name="cloud-arrow-up" size={20} color="#1E88E5" />
                <Text style={styles.uploadButtonText}>点击上传文件（PDF）</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* 标签 */}
          <View style={styles.formSection}>
            <View style={styles.labelContainer}>
              <FontAwesome6 name="tags" size={16} color="#1E88E5" />
              <Text style={styles.label}>标签 <Text style={styles.tagCountText}>({formData.tags.length}/10)</Text></Text>
            </View>
            <View style={styles.tagInputContainer}>
              <TextInput
                style={[styles.input, styles.tagInput]}
                placeholder="输入标签后点击添加"
                value={tagInput}
                onChangeText={setTagInput}
                onSubmitEditing={handleAddTag}
                returnKeyType="done"
              />
              <TouchableOpacity
                style={[styles.addTagButton, formData.tags.length >= 10 && styles.addTagButtonDisabled]}
                onPress={handleAddTag}
                disabled={formData.tags.length >= 10}
              >
                <FontAwesome6 name="plus" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            {formData.tags.length > 0 && (
              <View style={styles.tagList}>
                {formData.tags.map((tag, index) => (
                  <View key={index} style={styles.tagItem}>
                    <Text style={styles.tagText}>{tag}</Text>
                    <TouchableOpacity onPress={() => handleRemoveTag(tag)}>
                      <FontAwesome6 name="xmark" size={12} color="#E74C3C" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* 可查看人员范围 */}
          <View style={styles.formSection}>
            <View style={styles.labelContainer}>
              <FontAwesome6 name="lock" size={16} color="#1E88E5" />
              <Text style={styles.label}>可查看人员范围</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="留空表示所有人可见，或输入指定人员姓名（逗号分隔）"
              value={formData.viewable_users}
              onChangeText={(text) => setFormData({ ...formData, viewable_users: text })}
            />
          </View>

          {/* 提交按钮 */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => router.back()}
            >
              <Text style={styles.cancelButtonText}>取消</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <FontAwesome6 name="check" size={16} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>
                {loading ? '保存中...' : '保存'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* 日期选择器 */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="datetime"
          onChange={handleDateChange}
        />
      )}

      {/* 会议类型选择器 */}
      <Modal visible={showTypePicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>选择会议类型</Text>
              <TouchableOpacity onPress={() => setShowTypePicker(false)}>
                <FontAwesome6 name="xmark" size={20} color="#636E72" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              {MEETING_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={styles.optionItem}
                  onPress={() => {
                    setFormData({ ...formData, meeting_type: type.value });
                    setShowTypePicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.optionText,
                      formData.meeting_type === type.value && styles.optionTextActive,
                    ]}
                  >
                    {type.label}
                  </Text>
                  {formData.meeting_type === type.value && (
                    <FontAwesome6 name="check" size={16} color="#1E88E5" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 客户选择器 */}
      <Modal visible={showCustomerPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>选择关联客户</Text>
              <TouchableOpacity onPress={() => setShowCustomerPicker(false)}>
                <FontAwesome6 name="xmark" size={20} color="#636E72" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              {customers.map((customer) => (
                <TouchableOpacity
                  key={customer.id}
                  style={styles.optionItem}
                  onPress={() => {
                    setSelectedCustomer(customer);
                    setShowCustomerPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.optionText,
                      selectedCustomer?.id === customer.id && styles.optionTextActive,
                    ]}
                  >
                    {customer.name}
                  </Text>
                  {selectedCustomer?.id === customer.id && (
                    <FontAwesome6 name="check" size={16} color="#1E88E5" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 项目选择器 */}
      <Modal visible={showProjectPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>选择关联项目</Text>
              <TouchableOpacity onPress={() => setShowProjectPicker(false)}>
                <FontAwesome6 name="xmark" size={20} color="#636E72" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              {projects.map((project) => (
                <TouchableOpacity
                  key={project.id}
                  style={styles.optionItem}
                  onPress={() => {
                    setSelectedProject(project);
                    setShowProjectPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.optionText,
                      selectedProject?.id === project.id && styles.optionTextActive,
                    ]}
                  >
                    {project.name}
                  </Text>
                  {selectedProject?.id === project.id && (
                    <FontAwesome6 name="check" size={16} color="#1E88E5" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingBottom: 40,
  },
  formSection: {
    marginBottom: 20,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2D3436',
  },
  required: {
    color: '#E74C3C',
  },
  input: {
    backgroundColor: '#F5F7FA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  textArea: {
    minHeight: 80,
    paddingTop: 12,
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  pickerText: {
    fontSize: 14,
    color: '#2D3436',
  },
  placeholder: {
    color: '#95A5A6',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F5F7FA',
    borderRadius: 8,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  uploadButtonText: {
    fontSize: 14,
    color: '#1E88E5',
  },
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F5F7FA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  fileName: {
    flex: 1,
    fontSize: 14,
    color: '#2D3436',
  },
  removeFileButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 16,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F5F7FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    color: '#636E72',
    fontWeight: '500',
  },
  submitButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#1E88E5',
  },
  buttonDisabled: {
    backgroundColor: '#BDC3C7',
  },
  submitButtonText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3436',
  },
  modalList: {
    paddingHorizontal: 20,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F7FA',
  },
  optionText: {
    fontSize: 15,
    color: '#2D3436',
  },
  optionTextActive: {
    color: '#1E88E5',
    fontWeight: '600',
  },
  tagCountText: {
    fontSize: 12,
    color: '#95A5A6',
    fontWeight: '400',
  },
  tagInputContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  tagInput: {
    flex: 1,
  },
  addTagButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#1E88E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTagButtonDisabled: {
    backgroundColor: '#BDC3C7',
  },
  tagList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  tagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E3F2FD',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagText: {
    fontSize: 13,
    color: '#1E88E5',
  },
});
