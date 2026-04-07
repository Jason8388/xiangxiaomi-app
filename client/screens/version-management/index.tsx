import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
  Switch,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { PageHeader } from '@/components/PageHeader';
import { SmartDateInput } from '@/components/SmartDateInput';
import { FontAwesome6 } from '@expo/vector-icons';
import { getApiBaseUrl } from '@/utils/api';

interface VersionRelease {
  release_id: number;
  version_code: string;
  version_name: string;
  version_title: string;
  description: string;
  download_url: string;
  force_update: boolean;
  release_status: string;
  approval_status: string;
  created_at: string;
  updated_at: string;
}

export default function VersionManagement() {
  const [versions, setVersions] = useState<VersionRelease[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [formData, setFormData] = useState({
    version_code: '',
    version_name: '',
    version_title: '',
    description: '',
    download_url: '',
    force_update: false,
  });

  const loadVersions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${getApiBaseUrl()}/api/v1/version-release/list?limit=50`
      );
      const data = await response.json();
      if (Array.isArray(data)) {
        setVersions(data);
      }
    } catch (error) {
      console.error('Load versions error:', error);
      Alert.alert('错误', '加载版本列表失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVersions();
  }, [loadVersions]);

  const handleAdd = () => {
    setFormData({
      version_code: '',
      version_name: '',
      version_title: '',
      description: '',
      download_url: '',
      force_update: false,
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.version_code || !formData.version_name || !formData.version_title) {
      Alert.alert('提示', '请填写版本号、版本名称和版本标题');
      return;
    }

    try {
      const response = await fetch(
        `${getApiBaseUrl()}/api/v1/version-release`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        }
      );

      if (response.ok) {
        Alert.alert('成功', '版本创建成功，请审批后发布');
        setModalVisible(false);
        loadVersions();
      } else {
        const data = await response.json();
        throw new Error(data.error || '创建失败');
      }
    } catch (error: any) {
      Alert.alert('错误', error.message);
    }
  };

  const handlePublish = async (releaseId: number) => {
    Alert.alert('确认发布', '确定要发布这个版本吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '发布',
        onPress: async () => {
          try {
            const response = await fetch(
              `${getApiBaseUrl()}/api/v1/version-release/${releaseId}/publish`,
              { method: 'POST' }
            );

            if (response.ok) {
              Alert.alert('成功', '版本发布成功');
              loadVersions();
            } else {
              const data = await response.json();
              throw new Error(data.error || '发布失败');
            }
          } catch (error: any) {
            Alert.alert('错误', error.message);
          }
        },
      },
    ]);
  };

  const getStatusBadge = (release: VersionRelease) => {
    if (release.release_status === 'published') {
      return (
        <View style={[styles.badge, styles.badgeSuccess]}>
          <Text style={styles.badgeSuccessText}>已发布</Text>
        </View>
      );
    }
    if (release.approval_status === 'pending') {
      return (
        <View style={[styles.badge, styles.badgeWarning]}>
          <Text style={styles.badgeWarningText}>待发布</Text>
        </View>
      );
    }
    return (
      <View style={[styles.badge, styles.badgeDefault]}>
        <Text style={styles.badgeDefaultText}>草稿</Text>
      </View>
    );
  };

  return (
    <Screen>
      <PageHeader title="版本管理" />

      {/* 顶部操作 */}
      <View style={styles.topActions}>
        <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
          <FontAwesome6 name="plus" size={16} color="#FFFFFF" />
          <Text style={styles.addButtonText}>发布新版本</Text>
        </TouchableOpacity>
      </View>

      {/* 版本列表 */}
      <ScrollView style={styles.content}>
        {versions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <FontAwesome6 name="box-open" size={48} color="#BDC3C7" />
            <Text style={styles.emptyText}>暂无版本记录</Text>
          </View>
        ) : (
          versions.map((version) => (
            <View key={version.release_id} style={styles.versionCard}>
              <View style={styles.versionHeader}>
                <View style={styles.versionInfo}>
                  <Text style={styles.versionTitle}>{version.version_title}</Text>
                  <Text style={styles.versionCode}>
                    v{version.version_name} ({version.version_code})
                  </Text>
                </View>
                {getStatusBadge(version)}
              </View>

              {version.description && (
                <Text style={styles.versionDesc} numberOfLines={3}>
                  {version.description}
                </Text>
              )}

              <View style={styles.versionMeta}>
                <Text style={styles.versionDate}>
                  更新时间: {new Date(version.updated_at).toLocaleDateString('zh-CN')}
                </Text>
                {version.force_update && (
                  <View style={styles.forceUpdateBadge}>
                    <Text style={styles.forceUpdateText}>强制更新</Text>
                  </View>
                )}
              </View>

              {version.release_status !== 'published' && (
                <TouchableOpacity
                  style={styles.publishButton}
                  onPress={() => handlePublish(version.release_id)}
                >
                  <FontAwesome6 name="paper-plane" size={14} color="#FFFFFF" />
                  <Text style={styles.publishButtonText}>发布</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* 新增版本Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>发布新版本</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <FontAwesome6 name="times" size={20} color="#636E72" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>版本号 *</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.version_code}
                  onChangeText={(text) => setFormData({ ...formData, version_code: text })}
                  placeholder="如: 1.0.0"
                  placeholderTextColor="#B2BEC3"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>版本名称 *</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.version_name}
                  onChangeText={(text) => setFormData({ ...formData, version_name: text })}
                  placeholder="如: v1.0.0 正式版"
                  placeholderTextColor="#B2BEC3"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>版本标题 *</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.version_title}
                  onChangeText={(text) => setFormData({ ...formData, version_title: text })}
                  placeholder="如: 项小秘 v1.0.0 正式版"
                  placeholderTextColor="#B2BEC3"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>更新说明</Text>
                <TextInput
                  style={[styles.formInput, styles.formInputMultiline]}
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                  placeholder="请输入版本更新内容..."
                  placeholderTextColor="#B2BEC3"
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>下载链接</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.download_url}
                  onChangeText={(text) => setFormData({ ...formData, download_url: text })}
                  placeholder="请输入APK下载链接"
                  placeholderTextColor="#B2BEC3"
                  keyboardType="url"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.formGroupRow}>
                <Text style={styles.formLabel}>强制更新</Text>
                <Switch
                  value={formData.force_update}
                  onValueChange={(value) => setFormData({ ...formData, force_update: value })}
                  trackColor={{ false: '#E0E0E0', true: '#81C784' }}
                  thumbColor={formData.force_update ? '#4CAF50' : '#F5F5F5'}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleSave}
              >
                <Text style={styles.submitButtonText}>创建版本</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topActions: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1E88E5',
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    color: '#95A5A6',
    marginTop: 12,
  },
  versionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  versionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  versionInfo: {
    flex: 1,
  },
  versionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 4,
  },
  versionCode: {
    fontSize: 13,
    color: '#1E88E5',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeSuccess: {
    backgroundColor: '#E8F5E9',
  },
  badgeSuccessText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  badgeWarning: {
    backgroundColor: '#FFF3E0',
  },
  badgeWarningText: {
    fontSize: 12,
    color: '#FF9800',
    fontWeight: '500',
  },
  badgeDefault: {
    backgroundColor: '#F5F5F5',
  },
  badgeDefaultText: {
    fontSize: 12,
    color: '#9E9E9E',
    fontWeight: '500',
  },
  versionDesc: {
    fontSize: 13,
    color: '#636E72',
    lineHeight: 20,
    marginBottom: 12,
  },
  versionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  versionDate: {
    fontSize: 12,
    color: '#95A5A6',
  },
  forceUpdateBadge: {
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  forceUpdateText: {
    fontSize: 11,
    color: '#E53935',
  },
  publishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#1E88E5',
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 12,
  },
  publishButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
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
    maxHeight: '90%',
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
  formGroup: {
    marginBottom: 16,
  },
  formGroupRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    height: 100,
    textAlignVertical: 'top',
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
