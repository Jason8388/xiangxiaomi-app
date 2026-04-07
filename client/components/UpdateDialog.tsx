import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
  Platform,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';

interface VersionInfo {
  version_code: string;
  version_name: string;
  version_title: string;
  description: string;
  download_url: string;
  force_update: boolean;
  published_at: string;
  published_by: string;
}

interface UpdateDialogProps {
  visible: boolean;
  versionInfo: VersionInfo | null;
  onClose: () => void;
  onUpdate: () => void;
  onLater: () => void;
}

export function UpdateDialog({
  visible,
  versionInfo,
  onClose,
  onUpdate,
  onLater,
}: UpdateDialogProps) {
  if (!versionInfo) return null;

  const handleUpdate = async () => {
    if (!versionInfo.download_url || versionInfo.download_url === 'https://example.com/download') {
      Alert.alert(
        '下载提示',
        '当前版本为演示数据，下载链接尚未配置。\n\n请在「版本管理」页面设置真实的下载链接后，再进行发布。',
        [{ text: '知道了' }]
      );
      return;
    }

    try {
      const canOpen = await Linking.canOpenURL(versionInfo.download_url);
      if (canOpen) {
        await Linking.openURL(versionInfo.download_url);
      } else {
        Alert.alert('提示', '无法打开下载链接，请联系管理员');
      }
    } catch (error) {
      Alert.alert('提示', '无法打开下载链接，请联系管理员');
    }
    onUpdate();
  };

  const handleLater = () => {
    onLater();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={versionInfo.force_update ? () => {} : onLater}
    >
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          {/* 顶部图标 */}
          <View style={styles.iconContainer}>
            <FontAwesome6 name="cloud-download-alt" size={48} color="#1E88E5" />
          </View>

          {/* 标题 */}
          <Text style={styles.title}>
            发现新版本 v{versionInfo.version_name}
          </Text>
          <Text style={styles.versionText}>{versionInfo.version_title}</Text>

          {/* 更新内容 */}
          <View style={styles.content}>
            <Text style={styles.contentTitle}>更新内容</Text>
            <Text style={styles.contentText}>
              {versionInfo.description || '优化系统性能，修复已知问题'}
            </Text>
          </View>

          {/* 发布信息 */}
          <Text style={styles.publishInfo}>
            发布时间: {new Date(versionInfo.published_at).toLocaleDateString('zh-CN')}
          </Text>

          {/* 按钮 */}
          <View style={styles.buttons}>
            {!versionInfo.force_update && (
              <TouchableOpacity style={styles.laterButton} onPress={handleLater}>
                <Text style={styles.laterButtonText}>稍后再说</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.updateButton,
                versionInfo.force_update && styles.updateButtonFull,
              ]}
              onPress={handleUpdate}
            >
              <FontAwesome6 name="download" size={16} color="#FFFFFF" />
              <Text style={styles.updateButtonText}>
                {versionInfo.force_update ? '立即更新' : '立即更新'}
              </Text>
            </TouchableOpacity>
          </View>

          {versionInfo.force_update && (
            <Text style={styles.forceUpdateHint}>
              此版本为强制更新，请更新后继续使用
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );
}

// 版本更新检查Hook
export function useVersionCheck(currentVersion: string) {
  const [updateInfo, setUpdateInfo] = useState<{
    hasUpdate: boolean;
    updateType: string;
    versionInfo: VersionInfo | null;
  } | null>(null);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ignoredVersion, setIgnoredVersion] = useState<string | null>(null);

  const checkForUpdate = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/version-release/latest/check?current_version=${currentVersion}`
      );

      if (!response.ok) {
        throw new Error('检查更新失败');
      }

      const data = await response.json();

      // 如果有更新且不是已忽略的版本，则显示更新提示
      if (data.hasUpdate && data.latestVersion) {
        // 如果用户之前点击了"稍后再说"，不再提示
        if (ignoredVersion === data.latestVersion.version_code) {
          return;
        }

        setUpdateInfo({
          hasUpdate: data.hasUpdate,
          updateType: data.updateType,
          versionInfo: data.latestVersion,
        });
        setShowUpdateDialog(true);
      }
    } catch (error) {
      console.error('Version check error:', error);
    } finally {
      setLoading(false);
    }
  }, [currentVersion, ignoredVersion]);

  const handleUpdate = () => {
    setShowUpdateDialog(false);
  };

  const handleLater = () => {
    if (updateInfo?.versionInfo) {
      setIgnoredVersion(updateInfo.versionInfo.version_code);
    }
    setShowUpdateDialog(false);
  };

  const handleClose = () => {
    setShowUpdateDialog(false);
  };

  return {
    checkForUpdate,
    updateInfo,
    showUpdateDialog,
    loading,
    UpdateDialogComponent: (
      <UpdateDialog
        visible={showUpdateDialog}
        versionInfo={updateInfo?.versionInfo || null}
        onClose={handleClose}
        onUpdate={handleUpdate}
        onLater={handleLater}
      />
    ),
  };
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialog: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 4,
  },
  versionText: {
    fontSize: 14,
    color: '#1E88E5',
    fontWeight: '500',
    marginBottom: 16,
  },
  content: {
    width: '100%',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  contentTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34495E',
    marginBottom: 8,
  },
  contentText: {
    fontSize: 13,
    color: '#636E72',
    lineHeight: 20,
  },
  publishInfo: {
    fontSize: 12,
    color: '#95A5A6',
    marginBottom: 20,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  laterButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  laterButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#636E72',
  },
  updateButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#1E88E5',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  updateButtonFull: {
    flex: 1,
  },
  updateButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  forceUpdateHint: {
    fontSize: 12,
    color: '#E74C3C',
    marginTop: 12,
    textAlign: 'center',
  },
});
