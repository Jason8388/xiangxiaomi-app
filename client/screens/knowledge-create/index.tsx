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
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';
import { Screen } from '@/components/Screen';
import { PageHeader } from '@/components/PageHeader';
import { FontAwesome6 } from '@expo/vector-icons';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';

interface Attachment {
  uri: string;
  name: string;
  type: string;
  size?: number;
}

interface FormData {
  title: string;
  content: string;
  tags: string[];
  attachments: string[];
}

const DEFAULT_TAGS = [
  '技术文档',
  '操作指南',
  '故障处理',
  '最佳实践',
  '经验总结',
  '项目经验',
  '常见问题',
  '培训材料',
  '流程规范',
  '工具使用',
  '行业标准',
  '系统配置',
  '安全规范',
  '案例分析',
  '制度文件',
];

export default function KnowledgeCreate() {
  const router = useSafeRouter();
  const { id } = useSafeSearchParams<{ id?: string }>();
  const [isEdit, setIsEdit] = useState(!!id);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    content: '',
    tags: [],
    attachments: [],
  });
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    loadCurrentUser();
    if (id) {
      loadKnowledgeCard();
    }
  }, [id]);

  const loadCurrentUser = async () => {
    try {
      const userStr = await SecureStore.getItemAsync('user');
      if (userStr) {
        setCurrentUser(JSON.parse(userStr));
      }
    } catch (error) {
      console.error('Load user error:', error);
    }
  };

  const loadKnowledgeCard = async () => {
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/knowledge/cards/${id}`
      );
      const data = await response.json();
      if (response.ok) {
        setFormData({
          title: data.title,
          content: data.content,
          tags: data.tags || [],
          attachments: data.attachments || [],
        });
        // 加载附件信息
        if (data.attachments && Array.isArray(data.attachments)) {
          const attachmentList: Attachment[] = data.attachments.map((url: string, index: number) => ({
            uri: url,
            name: `附件${index + 1}`,
            type: 'file',
          }));
          setAttachments(attachmentList);
        }
      }
    } catch (error) {
      console.error('Load knowledge card error:', error);
      Alert.alert('错误', '加载知识卡失败');
    }
  };

  const handleToggleTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  const handleAddCustomTag = () => {
    if (!newTag.trim()) {
      Alert.alert('提示', '请输入标签内容');
      return;
    }
    if (formData.tags.includes(newTag.trim())) {
      Alert.alert('提示', '该标签已存在');
      return;
    }
    if (formData.tags.length >= 10) {
      Alert.alert('提示', '最多只能选择10个标签');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      tags: [...prev.tags, newTag.trim()],
    }));
    setNewTag('');
  };

  const handleRemoveTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  };

  const handlePickAttachment = async () => {
    if (attachments.length >= 10) {
      Alert.alert('提示', '最多只能上传10个附件');
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('提示', '需要相册权限才能上传附件');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const newAttachment: Attachment = {
        uri: result.assets[0].uri,
        name: result.assets[0].fileName || `附件${attachments.length + 1}`,
        type: result.assets[0].type || 'image/jpeg',
        size: result.assets[0].fileSize,
      };
      setAttachments([...attachments, newAttachment]);
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      Alert.alert('提示', '请输入知识标题');
      return;
    }
    if (!formData.content.trim()) {
      Alert.alert('提示', '请输入知识内容');
      return;
    }

    try {
      setLoading(true);
      const url = isEdit
        ? `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/knowledge/cards/${id}`
        : `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/knowledge/cards`;

      // 使用FormData上传附件
      const formDataObj = new FormData();
      formDataObj.append('title', formData.title);
      formDataObj.append('content', formData.content);
      formDataObj.append('tags', JSON.stringify(formData.tags));
      formDataObj.append('creator_name', currentUser?.name || '未知用户');
      formDataObj.append('creator_id', currentUser?.id?.toString() || '0');

      // 添加附件
      attachments.forEach((attachment, index) => {
        formDataObj.append(`attachment_${index}`, {
          uri: attachment.uri,
          type: attachment.type || 'image/jpeg',
          name: attachment.name,
        } as any);
      });

      const response = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        body: formDataObj,
      });

      if (response.ok) {
        Alert.alert(
          '成功',
          isEdit ? '知识卡修改成功，已重新提交审核' : '知识卡创建成功，已提交审核',
          [
            {
              text: '确定',
              onPress: () => {
                if (isEdit && id) {
                  router.push('/knowledge-detail', { id: parseInt(id) });
                } else {
                  router.back();
                }
              },
            },
          ]
        );
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

  return (
    <Screen>
      <PageHeader title={isEdit ? '编辑知识卡' : '新建知识卡'} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={100}
      >
        <ScrollView style={styles.container}>
          {/* 标题 */}
          <View style={styles.formSection}>
            <View style={styles.labelContainer}>
              <FontAwesome6 name="heading" size={16} color="#1E88E5" />
              <Text style={styles.label}>
                知识标题 <Text style={styles.required}>*</Text>
              </Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="请输入知识标题"
              value={formData.title}
              onChangeText={(text) => setFormData((prev) => ({ ...prev, title: text }))}
            />
          </View>

          {/* 内容 */}
          <View style={styles.formSection}>
            <View style={styles.labelContainer}>
              <FontAwesome6 name="file-lines" size={16} color="#1E88E5" />
              <Text style={styles.label}>
                知识内容 <Text style={styles.required}>*</Text>
              </Text>
            </View>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="请输入知识内容"
              value={formData.content}
              onChangeText={(text) => setFormData((prev) => ({ ...prev, content: text }))}
              multiline
              numberOfLines={10}
              textAlignVertical="top"
            />
          </View>

          {/* 创建人信息 */}
          <View style={styles.formSection}>
            <View style={styles.labelContainer}>
              <FontAwesome6 name="user" size={16} color="#1E88E5" />
              <Text style={styles.label}>
                创建人
              </Text>
            </View>
            <View style={styles.creatorInfo}>
              <FontAwesome6 name="circle-user" size={20} color="#3498DB" />
              <Text style={styles.creatorName}>
                {currentUser?.name || '未知用户'}
              </Text>
              {currentUser?.position && (
                <Text style={styles.creatorPosition}> - {currentUser.position}</Text>
              )}
            </View>
          </View>

          {/* 附件信息 */}
          <View style={styles.formSection}>
            <View style={styles.labelContainer}>
              <FontAwesome6 name="paperclip" size={16} color="#1E88E5" />
              <Text style={styles.label}>
                附件信息 <Text style={styles.hint}>(最多10个)</Text>
              </Text>
            </View>

            {/* 已上传附件 */}
            {attachments.length > 0 && (
              <View style={styles.attachmentsContainer}>
                {attachments.map((attachment, index) => (
                  <View key={index} style={styles.attachmentItem}>
                    {attachment.type?.startsWith('image') ? (
                      <Image source={{ uri: attachment.uri }} style={styles.attachmentImage} />
                    ) : (
                      <FontAwesome6 name="file" size={40} color="#95A5A6" style={styles.attachmentIcon} />
                    )}
                    <View style={styles.attachmentInfo}>
                      <Text style={styles.attachmentName} numberOfLines={1}>
                        {attachment.name}
                      </Text>
                      <Text style={styles.attachmentSize}>
                        {attachment.size ? `${(attachment.size / 1024).toFixed(1)} KB` : '未知大小'}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.removeAttachmentButton}
                      onPress={() => handleRemoveAttachment(index)}
                    >
                      <FontAwesome6 name="trash" size={14} color="#E74C3C" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* 添加附件按钮 */}
            {attachments.length < 10 && (
              <TouchableOpacity style={styles.addAttachmentButton} onPress={handlePickAttachment}>
                <FontAwesome6 name="plus" size={16} color="#1E88E5" />
                <Text style={styles.addAttachmentText}>添加附件</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* 知识标签 */}
          <View style={styles.formSection}>
            <View style={styles.labelContainer}>
              <FontAwesome6 name="tags" size={16} color="#1E88E5" />
              <Text style={styles.label}>
                知识标签 <Text style={styles.hint}>(最多选择10个)</Text>
              </Text>
            </View>

            {/* 已选标签 */}
            {formData.tags.length > 0 && (
              <View style={styles.selectedTagsContainer}>
                <Text style={styles.selectedTagsTitle}>已选标签：</Text>
                <View style={styles.selectedTags}>
                  {formData.tags.map((tag, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.selectedTagBadge}
                      onPress={() => handleRemoveTag(tag)}
                    >
                      <Text style={styles.selectedTagText}>{tag}</Text>
                      <FontAwesome6 name="xmark" size={10} color="#1E88E5" />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* 系统标签 */}
            <Text style={styles.defaultTagsTitle}>系统标签：</Text>
            <View style={styles.tagsGrid}>
              {DEFAULT_TAGS.map((tag) => (
                <TouchableOpacity
                  key={tag}
                  style={[
                    styles.tagBadge,
                    formData.tags.includes(tag) && styles.tagBadgeActive,
                  ]}
                  onPress={() => handleToggleTag(tag)}
                  disabled={
                    !formData.tags.includes(tag) && formData.tags.length >= 10
                  }
                >
                  <FontAwesome6
                    name="tag"
                    size={12}
                    color={formData.tags.includes(tag) ? '#FFFFFF' : '#1E88E5'}
                  />
                  <Text
                    style={[
                      styles.tagText,
                      formData.tags.includes(tag) && styles.tagTextActive,
                    ]}
                  >
                    {tag}
                  </Text>
                  {formData.tags.includes(tag) && (
                    <FontAwesome6 name="check" size={10} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* 自定义标签 */}
            <View style={styles.customTagContainer}>
              <TextInput
                style={styles.customTagInput}
                placeholder="输入自定义标签"
                value={newTag}
                onChangeText={setNewTag}
                onSubmitEditing={handleAddCustomTag}
              />
              <TouchableOpacity
                style={styles.addTagButton}
                onPress={handleAddCustomTag}
                disabled={formData.tags.length >= 10}
              >
                <FontAwesome6 name="plus" size={14} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
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
              <FontAwesome6 name="paper-plane" size={16} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>
                {loading ? '提交中...' : '提交审核'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* 提示信息 */}
          <View style={styles.tipContainer}>
            <FontAwesome6 name="circle-info" size={14} color="#F39C12" />
            <Text style={styles.tipText}>
              知识卡提交后将由项目总监审核，审核通过后方可发布
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    marginBottom: 24,
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
  hint: {
    fontSize: 12,
    color: '#95A5A6',
    fontWeight: '400',
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
    minHeight: 150,
    paddingTop: 12,
  },
  selectedTagsContainer: {
    backgroundColor: '#F5F7FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  selectedTagsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 8,
  },
  selectedTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  selectedTagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(30, 136, 229, 0.1)',
  },
  selectedTagText: {
    fontSize: 12,
    color: '#1E88E5',
    fontWeight: '500',
  },
  defaultTagsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 8,
  },
  tagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F5F7FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  tagBadgeActive: {
    backgroundColor: '#1E88E5',
    borderColor: '#1E88E5',
  },
  tagText: {
    fontSize: 12,
    color: '#636E72',
    fontWeight: '500',
  },
  tagTextActive: {
    color: '#FFFFFF',
  },
  customTagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  customTagInput: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  addTagButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#1E88E5',
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
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(243, 156, 18, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  tipText: {
    fontSize: 12,
    color: '#F39C12',
    flex: 1,
  },
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F5F7FA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  creatorName: {
    fontSize: 14,
    color: '#2D3436',
    fontWeight: '500',
  },
  creatorPosition: {
    fontSize: 13,
    color: '#7F8C8D',
  },
  attachmentsContainer: {
    gap: 8,
    marginBottom: 12,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F5F7FA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  attachmentImage: {
    width: 40,
    height: 40,
    borderRadius: 4,
  },
  attachmentIcon: {
    width: 40,
    height: 40,
  },
  attachmentInfo: {
    flex: 1,
  },
  attachmentName: {
    fontSize: 14,
    color: '#2D3436',
    marginBottom: 2,
  },
  attachmentSize: {
    fontSize: 12,
    color: '#95A5A6',
  },
  removeAttachmentButton: {
    padding: 6,
  },
  addAttachmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EBF5FF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#1E88E5',
  },
  addAttachmentText: {
    fontSize: 14,
    color: '#1E88E5',
    fontWeight: '500',
  },
});
