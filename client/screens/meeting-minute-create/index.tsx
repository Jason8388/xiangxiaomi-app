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
import { Screen } from '@/components/Screen';
import { PageHeader } from '@/components/PageHeader';
import { FontAwesome6 } from '@expo/vector-icons';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { storage } from '@/utils/storage';

interface FormData {
  meeting_name: string;
  meeting_date: string;
  meeting_location: string;
  attendees: string;
  recorder: string;
  key_points: string;
  summary: string;
  tags: string[];
}

interface Tag {
  id: number;
  name: string;
  color: string;
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
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    meeting_name: '',
    meeting_date: new Date().toISOString(),
    meeting_location: '',
    attendees: '',
    recorder: '',
    key_points: '',
    summary: '',
    tags: [],
  });
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tagModalVisible, setTagModalVisible] = useState(false);
  const [existingTags, setExistingTags] = useState<Tag[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [selectedColor, setSelectedColor] = useState(TAG_COLORS[0]);

  useEffect(() => {
    loadUserInfo();
    fetchTags();
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
        // 自动填充记录人
        if (!id) {
          setFormData(prev => ({ ...prev, recorder: userData.name || '' }));
        }
      }
    } catch (error) {
      console.error('Load user error:', error);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/minutes/tags`
      );
      const data = await response.json();
      if (Array.isArray(data)) {
        setExistingTags(data);
      }
    } catch (error) {
      console.error('Fetch tags error:', error);
    }
  };

  const loadMeetingMinute = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/minutes/${id}`
      );
      const data = await response.json();
      if (response.ok) {
        setFormData({
          meeting_name: data.meeting_name || '',
          meeting_date: data.meeting_date || new Date().toISOString(),
          meeting_location: data.meeting_location || '',
          attendees: data.attendees || '',
          recorder: data.recorder || '',
          key_points: data.key_points || '',
          summary: data.summary || '',
          tags: data.tags?.map((t: any) => t.name || t) || [],
        });
        if (data.meeting_date) {
          setSelectedDate(new Date(data.meeting_date));
        }
      }
    } catch (error) {
      console.error('Load meeting minute error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    // 表单验证
    if (!formData.meeting_name.trim()) {
      Alert.alert('提示', '请输入会议名称');
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
        ? `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/minutes/${id}`
        : `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/minutes`;

      const response = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          meeting_date: new Date(formData.meeting_date).toISOString(),
          user_id: user?.id,
        }),
      });

      if (response.ok) {
        Alert.alert('成功', isEdit ? '修改成功' : '创建成功', [
          { text: '确定', onPress: () => router.back() },
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

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
      setFormData(prev => ({
        ...prev,
        meeting_date: date.toISOString(),
      }));
    }
  };

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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
  };

  const removeTag = (tagName: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tagName),
    }));
  };

  return (
    <Screen>
      <PageHeader
        title={isEdit ? '修改会议纪要' : '新增会议纪要'}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={styles.container} contentContainerStyle={styles.containerContent}>
          {/* 会议名称 */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              会议名称 <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={formData.meeting_name}
              onChangeText={(text) =>
                setFormData(prev => ({ ...prev, meeting_name: text }))
              }
              placeholder="请输入会议名称"
              placeholderTextColor="#B2BEC3"
            />
          </View>

          {/* 会议日期 */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              会议日期 <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => setShowDatePicker(true)}
            >
              <FontAwesome6 name="calendar" size={16} color="#636E72" />
              <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="default"
                onChange={handleDateChange}
              />
            )}
          </View>

          {/* 会议地点 */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              会议地点 <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={formData.meeting_location}
              onChangeText={(text) =>
                setFormData(prev => ({ ...prev, meeting_location: text }))
              }
              placeholder="请输入会议地点"
              placeholderTextColor="#B2BEC3"
            />
          </View>

          {/* 参会人 */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              参会人 <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.attendees}
              onChangeText={(text) =>
                setFormData(prev => ({ ...prev, attendees: text }))
              }
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
              会议记录人 <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={formData.recorder}
              onChangeText={(text) =>
                setFormData(prev => ({ ...prev, recorder: text }))
              }
              placeholder="请输入会议记录人姓名"
              placeholderTextColor="#B2BEC3"
            />
          </View>

          {/* 会议要点 */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              会议要点 <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, styles.textAreaLarge]}
              value={formData.key_points}
              onChangeText={(text) =>
                setFormData(prev => ({ ...prev, key_points: text }))
              }
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
              onChangeText={(text) =>
                setFormData(prev => ({ ...prev, summary: text }))
              }
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

            {/* 已选标签 */}
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

            {/* 添加标签按钮 */}
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

            <ScrollView style={styles.modalBody}>
              {/* 新建标签 */}
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

              {/* 已有标签 */}
              {existingTags.length > 0 && (
                <View style={styles.existingTagSection}>
                  <Text style={styles.sectionLabel}>选择已有标签</Text>
                  <View style={styles.tagGrid}>
                    {existingTags.map((tag) => (
                      <TouchableOpacity
                        key={tag.id}
                        style={[
                          styles.tagOption,
                          formData.tags.includes(tag.name) && styles.tagOptionSelected,
                          { borderColor: tag.color },
                        ]}
                        onPress={() => toggleTag(tag.name)}
                      >
                        <Text
                          style={[
                            styles.tagOptionText,
                            formData.tags.includes(tag.name) && styles.tagOptionTextSelected,
                          ]}
                        >
                          {tag.name}
                        </Text>
                        {formData.tags.includes(tag.name) && (
                          <FontAwesome6 name="check" size={10} color="#FFFFFF" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.doneButton}
              onPress={() => setTagModalVisible(false)}
            >
              <Text style={styles.doneButtonText}>完成</Text>
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
    backgroundColor: '#F5F7FA',
  },
  containerContent: {
    padding: 16,
    paddingBottom: 40,
  },
  formGroup: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 8,
  },
  required: {
    color: '#E74C3C',
  },
  tagCount: {
    fontSize: 12,
    color: '#636E72',
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
    height: 60,
    paddingTop: 12,
  },
  textAreaLarge: {
    height: 120,
    paddingTop: 12,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  dateText: {
    fontSize: 15,
    color: '#2D3436',
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
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#6C63FF',
  },
  selectedTagText: {
    fontSize: 13,
    color: '#FFFFFF',
  },
  addTagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#6C63FF',
    borderStyle: 'dashed',
  },
  addTagText: {
    fontSize: 14,
    color: '#6C63FF',
  },
  submitButton: {
    backgroundColor: '#6C63FF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
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
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3436',
  },
  modalBody: {
    marginBottom: 20,
  },
  newTagSection: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 12,
  },
  newTagInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tagInput: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#2D3436',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  colorPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: '#F5F7FA',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  colorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  createTagButton: {
    backgroundColor: '#6C63FF',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  createTagButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  existingTagSection: {
    marginBottom: 20,
  },
  tagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tagOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#F5F7FA',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  tagOptionSelected: {
    backgroundColor: '#6C63FF',
    borderColor: '#6C63FF',
  },
  tagOptionText: {
    fontSize: 13,
    color: '#636E72',
  },
  tagOptionTextSelected: {
    color: '#FFFFFF',
  },
  doneButton: {
    backgroundColor: '#6C63FF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
