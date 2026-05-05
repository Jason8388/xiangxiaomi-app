import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Switch,
  StyleSheet,
} from 'react-native';
import { PCLayout } from '@/components/pc/PCLayout';
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

export default function PCVersionManagement() {
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
      alert('请填写版本号、版本名称和版本标题');
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
        alert('版本创建成功，请审批后发布');
        setModalVisible(false);
        loadVersions();
      } else {
        const data = await response.json();
        throw new Error(data.error || '创建失败');
      }
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handlePublish = async (releaseId: number) => {
    if (!confirm('确定要发布这个版本吗？')) return;

    try {
      const response = await fetch(
        `${getApiBaseUrl()}/api/v1/version-release/${releaseId}/publish`,
        { method: 'POST' }
      );

      if (response.ok) {
        alert('版本发布成功');
        loadVersions();
      } else {
        const data = await response.json();
        throw new Error(data.error || '发布失败');
      }
    } catch (error: any) {
      alert(error.message);
    }
  };

  const getStatusBadge = (release: VersionRelease) => {
    if (release.release_status === 'published') {
      return <span className="pc-badge pc-badge-success">已发布</span>;
    }
    if (release.approval_status === 'pending') {
      return <span className="pc-badge pc-badge-warning">待发布</span>;
    }
    return <span className="pc-badge pc-badge-default">草稿</span>;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('zh-CN');
  };

  return (
    <PCLayout title="版本管理">
      <div className="pc-page">
        {/* 顶部操作 */}
        <div className="pc-card" style={{ marginBottom: 16 }}>
          <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
            <FontAwesome6 name="plus" size={16} color="#FFFFFF" />
            <Text style={styles.addButtonText}>发布新版本</Text>
          </TouchableOpacity>
        </div>

        {/* 版本列表 */}
        <div className="pc-card">
          <div className="pc-table-container">
            <table className="pc-table">
              <thead>
                <tr>
                  <th>版本信息</th>
                  <th>版本号</th>
                  <th>更新说明</th>
                  <th>强制更新</th>
                  <th>状态</th>
                  <th>更新时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: 40 }}>
                      加载中...
                    </td>
                  </tr>
                ) : versions.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: 40 }}>
                      暂无版本记录
                    </td>
                  </tr>
                ) : (
                  versions.map((version) => (
                    <tr key={version.release_id}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{version.version_title}</div>
                      </td>
                      <td>
                        <div>v{version.version_name}</div>
                        <div style={{ color: '#666', fontSize: 12 }}>({version.version_code})</div>
                      </td>
                      <td>
                        <div style={{ 
                          maxWidth: 200, 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap' 
                        }}>
                          {version.description || '-'}
                        </div>
                      </td>
                      <td>
                        {version.force_update ? (
                          <span className="pc-badge pc-badge-danger">是</span>
                        ) : (
                          <span style={{ color: '#999' }}>否</span>
                        )}
                      </td>
                      <td>{getStatusBadge(version)}</td>
                      <td>{formatDate(version.updated_at)}</td>
                      <td>
                        {version.release_status !== 'published' && (
                          <button
                            className="pc-btn pc-btn-primary pc-btn-sm"
                            onClick={() => handlePublish(version.release_id)}
                          >
                            发布
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

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
      </div>
    </PCLayout>
  );
}

const styles = StyleSheet.create({
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1E88E5',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalBody: {
    padding: 16,
    maxHeight: 400,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
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
    color: '#333',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#F8F9FA',
  },
  formInputMultiline: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: '#1E88E5',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
});
