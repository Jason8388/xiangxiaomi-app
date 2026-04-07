import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
  Linking,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { PageHeader } from '@/components/PageHeader';
import { FontAwesome6 } from '@expo/vector-icons';
import { useSafeRouter } from '@/hooks/useSafeRouter';

interface MenuItem {
  icon: string;
  title: string;
  description: string;
  color: string;
  onPress: () => void;
}

export default function HelpFeedbackScreen() {
  const router = useSafeRouter();
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'suggestion' | 'problem' | 'other'>('suggestion');
  const [feedbackContent, setFeedbackContent] = useState('');
  const [feedbackContact, setFeedbackContact] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const menuItems: MenuItem[] = [
    {
      icon: 'book-open',
      title: '产品操作手册',
      description: '查看完整功能使用指南',
      color: '#6C63FF',
      onPress: () => router.push('/help-manual'),
    },
    {
      icon: 'question-circle',
      title: '常见问题',
      description: '快速解答常见疑问',
      color: '#00B894',
      onPress: () => router.push('/help-faq'),
    },
    {
      icon: 'lightbulb',
      title: '意见建议',
      description: '提交产品改进建议',
      color: '#FDCB6E',
      onPress: () => {
        setFeedbackType('suggestion');
        setShowFeedbackModal(true);
      },
    },
    {
      icon: 'bug',
      title: '问题反馈',
      description: '报告使用中遇到的问题',
      color: '#E17055',
      onPress: () => {
        setFeedbackType('problem');
        setShowFeedbackModal(true);
      },
    },
    {
      icon: 'headset',
      title: '联系客服',
      description: '获取人工帮助服务',
      color: '#3498DB',
      onPress: () => {
        Alert.alert(
          '联系客服',
          '客服热线：400-888-6668\n工作时间：周一至周五 9:00-18:00',
          [
            { text: '取消', style: 'cancel' },
            { text: '拨打', onPress: () => Linking.openURL('tel:4008886668') },
          ]
        );
      },
    },
    {
      icon: 'star',
      title: '给我们评分',
      description: '在应用商店评价支持我们',
      color: '#9B59B6',
      onPress: () => {
        Alert.alert('感谢您的支持', '请在应用商店给我们5星好评！');
      },
    },
  ];

  const handleSubmitFeedback = async () => {
    if (!feedbackContent.trim()) {
      Alert.alert('错误', '请输入反馈内容');
      return;
    }

    try {
      setSubmitting(true);
      
      // 模拟提交反馈
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      Alert.alert(
        '提交成功',
        '感谢您的反馈，我们会尽快处理！',
        [{ text: '确定', onPress: () => {
          setShowFeedbackModal(false);
          setFeedbackContent('');
          setFeedbackContact('');
        }}]
      );
    } catch (error) {
      Alert.alert('错误', '提交失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  const getFeedbackTitle = () => {
    switch (feedbackType) {
      case 'suggestion':
        return '意见建议';
      case 'problem':
        return '问题反馈';
      default:
        return '反馈';
    }
  };

  const getFeedbackPlaceholder = () => {
    switch (feedbackType) {
      case 'suggestion':
        return '请详细描述您的建议...';
      case 'problem':
        return '请描述您遇到的问题，包括操作步骤...';
      default:
        return '请输入反馈内容...';
    }
  };

  return (
    <Screen>
      <PageHeader title="帮助与反馈" />
      
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* 操作手册入口 */}
        <View style={styles.manualCard}>
          <TouchableOpacity 
            style={styles.manualContent}
            onPress={() => router.push('/help-manual')}
            activeOpacity={0.8}
          >
            <View style={styles.manualIcon}>
              <FontAwesome6 name="book-open" size={28} color="#FFF" />
            </View>
            <View style={styles.manualText}>
              <Text style={styles.manualTitle}>产品操作手册</Text>
              <Text style={styles.manualSubtitle}>点击查看完整功能指南</Text>
            </View>
            <FontAwesome6 name="chevron-right" size={18} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* 功能菜单 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>帮助与支持</Text>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIcon, { backgroundColor: item.color }]}>
                <FontAwesome6 name={item.icon as any} size={18} color="#FFF" />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuDescription}>{item.description}</Text>
              </View>
              <FontAwesome6 name="chevron-right" size={14} color="#B2BEC3" />
            </TouchableOpacity>
          ))}
        </View>

        {/* 版本信息 */}
        <View style={styles.versionSection}>
          <Text style={styles.versionText}>项小秘 v1.0.0</Text>
          <Text style={styles.copyrightText}>© 2024 项小秘 版权所有</Text>
        </View>
      </ScrollView>

      {/* 反馈弹窗 */}
      <Modal
        visible={showFeedbackModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFeedbackModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowFeedbackModal(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>{getFeedbackTitle()}</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>反馈内容 *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={feedbackContent}
                onChangeText={setFeedbackContent}
                placeholder={getFeedbackPlaceholder()}
                placeholderTextColor="#B2BEC3"
                multiline
                numberOfLines={5}
                maxLength={500}
              />
              <Text style={styles.charCount}>{feedbackContent.length}/500</Text>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>联系方式（选填）</Text>
              <TextInput
                style={styles.input}
                value={feedbackContact}
                onChangeText={setFeedbackContact}
                placeholder="手机号或邮箱"
                placeholderTextColor="#B2BEC3"
                keyboardType="default"
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowFeedbackModal(false)}
              >
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleSubmitFeedback}
                disabled={submitting}
              >
                <Text style={styles.submitButtonText}>
                  {submitting ? '提交中...' : '提交反馈'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },
  manualCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    backgroundColor: '#6C63FF',
    overflow: 'hidden',
  },
  manualContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  manualIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  manualText: {
    flex: 1,
  },
  manualTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  manualSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
  },
  section: {
    marginTop: 24,
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#636E72',
    marginBottom: 12,
    marginLeft: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#2D3436',
    marginBottom: 2,
  },
  menuDescription: {
    fontSize: 12,
    color: '#636E72',
  },
  versionSection: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  versionText: {
    fontSize: 14,
    color: '#636E72',
    marginBottom: 4,
  },
  copyrightText: {
    fontSize: 12,
    color: '#B2BEC3',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 24,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#636E72',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F5F6FA',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#2D3436',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  charCount: {
    fontSize: 12,
    color: '#B2BEC3',
    textAlign: 'right',
    marginTop: 4,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5F6FA',
  },
  cancelButtonText: {
    fontSize: 15,
    color: '#636E72',
  },
  submitButton: {
    backgroundColor: '#6C63FF',
  },
  submitButtonText: {
    fontSize: 15,
    color: '#FFF',
    fontWeight: '500',
  },
});
