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
import { Screen } from '@/components/Screen';
import { PageHeader } from '@/components/PageHeader';
import { FontAwesome6 } from '@expo/vector-icons';
import { SmartDateInput } from '@/components/SmartDateInput';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { storage } from '@/utils/storage';
import { getApiBaseUrl } from '@/utils/api';

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
  tags: string[];
}

const TAG_COLORS = [
  '#6C63FF', '#FF6B6B', '#00B894', '#F39C12', '#3498DB',
  '#9B59B6', '#1ABC9C', '#E74C3C', '#2ECC71', '#E91E63',
];

export default function MeetingMinuteCreate() {
  const router = useSafeRouter();
  const { id } = useSafeSearchParams<{ id?: string }>();
  const [isEdit, setIsEdit] = useState(!!id);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState<FormData>({
    meeting_name: '',
    meeting_type: 'other',
    meeting_date: '',
    meeting_location: '',
    attendees: '',
    host: '',
    recorder: '',
    topics: '',
    key_points: '',
    summary: '',
    tags: [],
  });
  const [tagModalVisible, setTagModalVisible] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [selectedColor, setSelectedColor] = useState(TAG_COLORS[0]);

  useEffect(() => {
    loadUserInfo();
    if (id) {
      loadMeetingMinute();
    }
  }, [id]);

  const loadUserInfo = async () => {
    try {
      const userStr = await storage.getItem('user');
      if (userStr) {
        const userData = JSON.parse(userStr);
        setUser(userData);
        if (!id) {
          setFormData(prev => ({ ...prev, recorder: userData.name || '' }));
        }
      }
    } catch (error) {
      console.error('Load user error:', error);
    }
  };

  const loadMeetingMinute = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${getApiBaseUrl()}/api/v1/meeting-minutes/${id}`
      );
      const data = await response.json();
      if (response.ok) {
        setFormData({
          meeting_name: data.meeting_name || '',
          meeting_type: data.meeting_type || 'other',
          meeting_date: data.meeting_date ? data.meeting_date.split('T')[0] : '',
          meeting_location: data.meeting_location || '',
          attendees: data.attendees || '',
          host: data.host || '',
          recorder: data.recorder || '',
          topics: data.topics || '',
          key_points: data.key_points || '',
          summary: data.summary || '',
          tags: Array.isArray(data.tags) ? data.tags.map((t: any) => t.tag || t) : [],
        });
      }
    } catch (error) {
      console.error('Load meeting minute error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    console.log('handleSubmit 被调用');
    console.log('formData:', formData);

    if (!formData.meeting_name.trim()) {
      Alert.alert('提示', '请输入会议名称');
      return;
    }
    if (!formData.meeting_date.trim()) {
      Alert.alert('提示', '请选择会议日期');
      return;
    }
    if (!formData.meeting_location.trim()) {
      Alert.alert('提示', '请输入会议地点');
      return;
    }
    if (!formData.attendees.trim()) {
      Alert.alert('提示', '请输入参会人');
      return;
    }
    if (!formData.recorder.trim()) {
      Alert.alert('提示', '请输入会议记录人');
      return;
    }
    if (!formData.key_points.trim()) {
      Alert.alert('提示', '请输入会议要点');
      return;
    }

    try {
      setLoading(true);
      const url = isEdit
        ? `${getApiBaseUrl()}/api/v1/meeting-minutes/${id}`
        : `${getApiBaseUrl()}/api/v1/meeting-minutes`;

      console.log('[提交] URL:', url);
      console.log('[提交] Method:', isEdit ? 'PUT' : 'POST');
      console.log('[提交] 提交数据:', JSON.stringify(formData, null, 2));

      const response = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      console.log('[提交] 响应状态:', response.status);
      console.log('[提交] 响应OK:', response.ok);

      if (response.ok) {
        const result = await response.json();
        console.log('[提交] 响应数据:', result);
        Alert.alert('成功', isEdit ? '修改成功' : '创建成功', [
          { text: '确定', onPress: () => router.back() },
        ]);
      } else {
        const error = await response.json();
        console.error('[提交] 错误响应:', error);
        Alert.alert('错误', error.message || '操作失败');
      }
    } catch (error) {
      console.error('[提交] 网络错误:', error);
      Alert.alert('错误', '操作失败');
    } finally {
      setLoading(false);
    }
  };

  const toggleTag = (tagName: string) => {
    if (formData.tags.includes(tagName)) {
      setFormData(prev => ({
        ...prev,
        tags: prev.tags.filter(t => t !== tagName),
      }));
    } else {
      if (formData.tags.length >= 10) {
        Alert.alert('提示', '最多只能添加10个标签');
        return;
      }
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagName],
      }));
    }
  };

  const handleCreateTag = () => {
    if (!newTagName.trim()) {
      Alert.alert('提示', '请输入标签名称');
      return;
    }

    const tagName = newTagName.trim();
    if (formData.tags.includes(tagName)) {
      Alert.alert('提示', '该标签已存在');
      return;
    }

    if (formData.tags.length >= 10) {
      Alert.alert('提示', '最多只能添加10个标签');
      return;
    }

    setFormData(prev => ({
      ...prev,
      tags: [...prev.tags, tagName],
    }));
    setNewTagName('');
    setTagModalVisible(false);
  };

  const removeTag = (tagName: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tagName),
    }));
  };

  return (
    <Screen>
      <PageHeader title={isEdit ? '修改会议纪要' : '新增会议纪要'} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
        <ScrollView style={styles.container} contentContainerStyle={styles.containerContent} keyboardShouldPersistTaps="handled">
          {/* 会议名称 */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              会议名称<Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={formData.meeting_name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, meeting_name: text }))}
              placeholder="请输入会议名称"
              placeholderTextColor="#B2BEC3"
            />
          </View>

          {/* 会议日期 */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              会议日期<Text style={styles.required}>*</Text>
            </Text>
            <SmartDateInput
              value={formData.meeting_date}
              onChange={(date) => setFormData(prev => ({ ...prev, meeting_date: date }))}
              placeholder="请选择会议日期"
            />
          </View>

          {/* 会议地点 */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              会议地点<Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={formData.meeting_location}
              onChangeText={(text) => setFormData(prev => ({ ...prev, meeting_location: text }))}
              placeholder="请输入会议地点"
              placeholderTextColor="#B2BEC3"
            />
          </View>

          {/* 参会人 */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              参会人<Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.attendees}
              onChangeText={(text) => setFormData(prev => ({ ...prev, attendees: text }))}
              placeholder="请输入参会人，多人以逗号分隔"
              placeholderTextColor="#B2BEC3"
              multiline
              numberOfLines={2}
              textAlignVertical="top"
            />
          </View>

          {/* 会议记录人 */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              会议记录人<Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={formData.recorder}
              onChangeText={(text) => setFormData(prev => ({ ...prev, recorder: text }))}
              placeholder="请输入会议记录人姓名"
              placeholderTextColor="#B2BEC3"
            />
          </View>

          {/* 会议要点 */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              会议要点<Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, styles.textAreaLarge]}
              value={formData.key_points}
              onChangeText={(text) => setFormData(prev => ({ ...prev, key_points: text }))}
              placeholder="请输入会议要点"
              placeholderTextColor="#B2BEC3"
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
          </View>

          {/* 会议结论 */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>会议结论</Text>
            <TextInput
              style={[styles.input, styles.textAreaLarge]}
              value={formData.summary}
              onChangeText={(text) => setFormData(prev => ({ ...prev, summary: text }))}
              placeholder="请输入会议结论"
              placeholderTextColor="#B2BEC3"
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
          </View>

          {/* 会议纪要标签 */}
          <View style={styles.formGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>会议纪要标签</Text>
              <Text style={styles.tagCount}>{formData.tags.length}/10</Text>
            </View>

            {formData.tags.length > 0 && (
              <View style={styles.selectedTags}>
                {formData.tags.map((tag, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.selectedTag}
                    onPress={() => removeTag(tag)}
                  >
                    <Text style={styles.selectedTagText}>{tag}</Text>
                    <FontAwesome6 name="xmark" size={10} color="#FFFFFF" />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <TouchableOpacity
              style={styles.addTagButton}
              onPress={() => setTagModalVisible(true)}
            >
              <FontAwesome6 name="plus" size={14} color="#6C63FF" />
              <Text style={styles.addTagText}>添加标签</Text>
            </TouchableOpacity>
          </View>

          {/* 提交按钮 */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? '提交中...' : isEdit ? '保存修改' : '创建会议纪要'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* 标签选择弹窗 */}
      <Modal
        visible={tagModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setTagModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>添加标签</Text>
              <TouchableOpacity onPress={() => setTagModalVisible(false)}>
                <FontAwesome6 name="xmark" size={20} color="#636E72" />
              </TouchableOpacity>
            </View>

            <View style={styles.newTagSection}>
              <Text style={styles.sectionLabel}>新建标签</Text>
              <View style={styles.newTagInput}>
                <TextInput
                  style={styles.tagInput}
                  value={newTagName}
                  onChangeText={setNewTagName}
                  placeholder="输入标签名称"
                  placeholderTextColor="#B2BEC3"
                  maxLength={10}
                />
                <TouchableOpacity
                  style={styles.colorPicker}
                  onPress={() => {
                    const currentIndex = TAG_COLORS.indexOf(selectedColor);
                    const nextIndex = (currentIndex + 1) % TAG_COLORS.length;
                    setSelectedColor(TAG_COLORS[nextIndex]);
                  }}
                >
                  <View style={[styles.colorDot, { backgroundColor: selectedColor }]} />
                  <FontAwesome6 name="chevron-down" size={12} color="#636E72" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.createTagButton}
                  onPress={handleCreateTag}
                >
                  <Text style={styles.createTagButtonText}>创建</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={() => setTagModalVisible(false)}
            >
              <Text style={styles.closeModalButtonText}>关闭</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  containerContent: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2D3436',
    marginBottom: 8,
  },
  required: {
    color: '#FF6B6B',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#2D3436',
    borderWidth: 1,
    borderColor: '#DFE6E9',
  },
  textArea: {
    height: 60,
    paddingTop: 12,
  },
  textAreaLarge: {
    height: 120,
    paddingTop: 12,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tagCount: {
    fontSize: 12,
    color: '#636E72',
  },
  selectedTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  selectedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6C63FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  selectedTagText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  addTagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F0FF',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#6C63FF',
    borderStyle: 'dashed',
    gap: 6,
  },
  addTagText: {
    color: '#6C63FF',
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: '#6C63FF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#B2BEC3',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3436',
  },
  modalBody: {
    flex: 1,
  },
  newTagSection: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 14,
    color: '#636E72',
    marginBottom: 12,
  },
  newTagInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tagInput: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#2D3436',
  },
  colorPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  colorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  createTagButton: {
    backgroundColor: '#6C63FF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  createTagButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  existingTagSection: {
    marginTop: 16,
  },
  tagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DFE6E9',
  },
  tagOptionSelected: {
    backgroundColor: '#F0F0FF',
  },
  closeModalButton: {
    backgroundColor: '#F8F9FA',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  closeModalButtonText: {
    color: '#636E72',
    fontSize: 16,
  },
});
