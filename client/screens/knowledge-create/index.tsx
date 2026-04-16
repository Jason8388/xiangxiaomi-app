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
import * as DocumentPicker from 'expo-document-picker';
import { getSecureItem } from '@/utils/storage';
import { getApiBaseUrl } from '@/utils/api';
import { Screen } from '@/components/Screen';
import { PageHeader } from '@/components/PageHeader';
import { FontAwesome6 } from '@expo/vector-icons';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';

// 支持的文档类型
const SUPPORTED_DOCUMENT_TYPES = [
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.ms-excel', // .xls
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-powerpoint', // .ppt
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
  'application/pdf', // .pdf
];

const DOCUMENT_EXTENSIONS = ['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.pdf'];

interface Attachment {
  uri: string;
  name: string;
  type: string;
  size?: number;
  key?: string;
}

interface FormData {
  title: string;
  content: string;
  tags: string[];
  attachments: string[];
  creator: string;
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
    creator: '',
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
      const userStr = await getSecureItem('user');
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
        `${getApiBaseUrl()}/api/v1/knowledge/${id}`
      );
      const data = await response.json();
      console.log('[知识库编辑] 加载数据:', data);
      if (response.ok) {
        setFormData({
          title: data.title || '',
          content: data.content || '',
          tags: data.tags || [],
          attachments: data.attachments || [],
          creator: data.creator || data.author || data.author_name || '',
        });
        // 加载附件信息
        if (data.attachments && Array.isArray(data.attachments)) {
          const attachmentList: Attachment[] = data.attachments.map((item: any, index: number) => ({
            uri: item.url || item,
            name: item.name || `附件${index + 1}`,
            type: item.type || 'file',
            key: item.key,
          }));
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

    // 显示选择菜单
    Alert.alert(
      '选择附件类型',
      '请选择要上传的附件类型',
      [
        {
          text: '图片',
          onPress: () => handlePickImage(),
        },
        {
          text: '文档',
          onPress: () => handlePickDocument(),
        },
        {
          text: '取消',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  // 选择图片
  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('提示', '需要相册权限才能上传图片');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newAttachment: Attachment = {
          uri: result.assets[0].uri,
          name: result.assets[0].fileName || `图片${attachments.length + 1}`,
          type: result.assets[0].type || 'image/jpeg',
          size: result.assets[0].fileSize,
        };
        setAttachments([...attachments, newAttachment]);
      }
    } catch (error) {
      console.error('Pick image error:', error);
      Alert.alert('错误', '选择图片失败');
    }
  };

  // 选择文档（Word、Excel、PPT、PDF）
  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: DOCUMENT_EXTENSIONS.map(ext => `*${ext}`), // 支持所有指定扩展名
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const doc = result.assets[0];
        
        // 验证文件类型
        const fileName = doc.name || '';
        const extension = '.' + fileName.split('.').pop()?.toLowerCase();
        
        if (!DOCUMENT_EXTENSIONS.includes(extension)) {
          Alert.alert('提示', `不支持的文件格式，仅支持：${DOCUMENT_EXTENSIONS.join('、')}`);
          return;
        }

        // 获取MIME类型
        let mimeType = doc.mimeType || 'application/octet-stream';
        if (extension === '.docx') mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        else if (extension === '.xlsx') mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        else if (extension === '.pptx') mimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';

        const newAttachment: Attachment = {
          uri: doc.uri,
          name: doc.name || `文档${attachments.length + 1}`,
          type: mimeType,
          size: doc.size,
        };
        setAttachments([...attachments, newAttachment]);
      }
    } catch (error) {
      console.error('Pick document error:', error);
      Alert.alert('错误', '选择文档失败');
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

      // 先上传所有附件到对象存储
      const uploadPromises = attachments.map(async (attachment) => {
        try {
          const formDataObj = new FormData();
          formDataObj.append('file', {
            uri: attachment.uri,
            type: attachment.type,
            name: attachment.name,
          } as any);
          formDataObj.append('folder', 'knowledge');

          const response = await fetch(
            `${getApiBaseUrl()}/api/v1/upload`,
            {
              method: 'POST',
              body: formDataObj,
            }
          );

          const result = await response.json();
          if (!response.ok) {
            throw new Error(result.error || '上传失败');
          }

          console.log('[知识卡创建] 文件上传成功:', result);
          return result.key; // 返回文件访问 URL
        } catch (error) {
          console.error('[知识卡创建] 文件上传失败:', attachment.name, error);
          throw error;
        }
      });

      // 等待所有文件上传完成
      const uploadedKeys = await Promise.all(uploadPromises);
      console.log('[知识卡创建] 所有文件上传完成:', uploadedKeys);

      const url = isEdit
        ? `${getApiBaseUrl()}/api/v1/knowledge/${id}`
        : `${getApiBaseUrl()}/api/v1/knowledge`;

      // 创建知识卡，使用上传后的 URL
      const formDataObj = new FormData();
      formDataObj.append('title', formData.title);
      formDataObj.append('content', formData.content);
      formDataObj.append('tags', JSON.stringify(formData.tags));
      formDataObj.append('creator', formData.creator);
      formDataObj.append('author_id', currentUser?.id?.toString() || '0');
      formDataObj.append('attachmentKeys', JSON.stringify(uploadedKeys));

      const response = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        body: formDataObj,
      });

      if (response.ok) {
        Alert.alert(
          '成功',
          isEdit ? '知识卡修改成功' : '知识卡创建成功'
        );
        setTimeout(() => {
          router.back();
        }, 500);
      } else {
        const errorData = await response.json();
        Alert.alert('错误', errorData.error || '保存失败');
      }
    } catch (error) {
      console.error('Submit knowledge card error:', error);
      Alert.alert('错误', '保存失败，请重试');
    } finally {
      setLoading(false);
    }
  };
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
          isEdit ? '知识卡修改成功' : '知识卡创建成功'
        );
        setTimeout(() => {
          router.back();
        }, 500);
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
                知识标题<Text style={styles.required}>*</Text>
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
                知识内容<Text style={styles.required}>*</Text>
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
            <TextInput
              style={styles.input}
              placeholder="请输入创建人姓名"
              value={formData.creator}
              onChangeText={(text) => setFormData((prev) => ({ ...prev, creator: text }))}
            />
          </View>

          {/* 创建日期 */}
          <View style={styles.formSection}>
            <View style={styles.labelContainer}>
              <FontAwesome6 name="calendar" size={16} color="#1E88E5" />
              <Text style={styles.label}>
                创建日期
              </Text>
            </View>
            <View style={styles.dateInfo}>
              <Text style={styles.dateText}>
                {new Date().toLocaleDateString('zh-CN', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                })}
              </Text>
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
                {attachments.map((attachment, index) => {
                    // 根据文件类型显示不同图标
                    const isImage = attachment.type?.startsWith('image');
                    const isWord = attachment.name?.match(/\.(doc|docx)$/i);
                    const isExcel = attachment.name?.match(/\.(xls|xlsx)$/i);
                    const isPPT = attachment.name?.match(/\.(ppt|pptx)$/i);
                    const isPDF = attachment.name?.match(/\.pdf$/i);

                    let iconColor = '#95A5A6';
                    let iconName = 'file';
                    if (isWord) { iconColor = '#2B579A'; iconName = 'file-word'; }
                    else if (isExcel) { iconColor = '#217346'; iconName = 'file-excel'; }
                    else if (isPPT) { iconColor = '#D24726'; iconName = 'file-powerpoint'; }
                    else if (isPDF) { iconColor = '#E74C3C'; iconName = 'file-pdf'; }

                    return (
                      <View key={index} style={styles.attachmentItem}>
                        {isImage ? (
                          <Image source={{ uri: attachment.uri }} style={styles.attachmentImage} />
                        ) : (
                          <FontAwesome6 name={iconName as any} size={40} color={iconColor} style={styles.attachmentIcon} />
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
                    );
                  })}
              </View>
            )}

            {/* 添加附件按钮 */}
            {attachments.length < 10 && (
              <TouchableOpacity style={styles.addAttachmentButton} onPress={handlePickAttachment}>
                <FontAwesome6 name="plus" size={16} color="#1E88E5" />
                <Text style={styles.addAttachmentText}>添加附件（图片/文档）</Text>
              </TouchableOpacity>
            )}
            <Text style={styles.attachmentHint}>
              支持格式：JPG、PNG、GIF、Word(.doc/.docx)、Excel(.xls/.xlsx)、PPT(.ppt/.pptx)、PDF
            </Text>
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
                {loading ? '提交中...' : (isEdit ? '保存修改' : '创建知识卡')}
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
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  dateText: {
    fontSize: 14,
    color: '#2D3436',
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
  attachmentHint: {
    fontSize: 11,
    color: '#95A5A6',
    marginTop: 4,
  },
});
