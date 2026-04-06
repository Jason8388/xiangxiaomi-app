import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Alert, Linking, Platform } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

// 当前应用版本号
const CURRENT_VERSION_CODE = 1;
const CURRENT_VERSION_NAME = '1.0.0';

interface VersionUpdateProps {
  visible: boolean;
  versionInfo: {
    has_update: boolean;
    is_mandatory: boolean;
    compatibility_end_date: string;
    latest_version: {
      version_code: number;
      version_name: string;
      version_title: string;
      description: string;
      release_date: string;
      download_url: string;
    };
  };
  onUpgrade: () => void;
  onLater: () => void;
  onDismiss: () => void;
}

export default function VersionUpdateDialog({
  visible,
  versionInfo,
  onUpgrade,
  onLater,
  onDismiss,
}: VersionUpdateProps) {
  if (!versionInfo.has_update) {
    return null;
  }

  const isMandatory = versionInfo.is_mandatory;
  const version = versionInfo.latest_version;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={isMandatory ? undefined : onDismiss}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          {/* 图标 */}
          <View style={styles.iconContainer}>
            <FontAwesome6 name="circle-arrow-up" size={64} color="#1E88E5" />
          </View>

          {/* 标题 */}
          <Text style={styles.title}>
            {isMandatory ? '需要更新' : '发现新版本'}
          </Text>

          {/* 版本号 */}
          <View style={styles.versionBadge}>
            <Text style={styles.versionText}>v{version.version_name}</Text>
          </View>

          {/* 版本标题 */}
          <Text style={styles.versionTitle}>{version.version_title}</Text>

          {/* 更新描述 */}
          {version.description && (
            <View style={styles.descriptionContainer}>
              <Text style={styles.descriptionTitle}>更新内容：</Text>
              <Text style={styles.descriptionText}>{version.description}</Text>
            </View>
          )}

          {/* 强制更新提示 */}
          {isMandatory && (
            <View style={styles.warningContainer}>
              <FontAwesome6 name="triangle-exclamation" size={16} color="#F5A623" />
              <Text style={styles.warningText}>
                此版本兼容期已结束，不更新无法继续使用
              </Text>
            </View>
          )}

          {/* 按钮组 */}
          <View style={styles.buttonContainer}>
            {!isMandatory && (
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={onLater}
              >
                <Text style={styles.buttonTextSecondary}>稍后升级</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.button, isMandatory ? styles.buttonFullWidth : styles.buttonPrimary]}
              onPress={onUpgrade}
            >
              <Text style={styles.buttonTextPrimary}>
                {isMandatory ? '立即更新' : '立即升级'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

interface UseVersionUpdateOptions {
  enabled?: boolean;
  onUpgradeStart?: () => void;
  onUpgradeSuccess?: () => void;
  onUpgradeError?: (error: Error) => void;
}

export function useVersionUpdate(options: UseVersionUpdateOptions = {}) {
  const {
    enabled = true,
    onUpgradeStart,
    onUpgradeSuccess,
    onUpgradeError,
  } = options;

  const [visible, setVisible] = useState(false);
  const [versionInfo, setVersionInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 检查是否可以显示更新提示（每日最多一次）
  const canShowUpdateReminder = async (): Promise<boolean> => {
    try {
      const today = new Date().toDateString();
      const lastReminderDate = await SecureStore.getItemAsync('lastUpdateReminderDate');

      if (lastReminderDate === today) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Check update reminder error:', error);
      return true;
    }
  };

  // 记录更新提醒日期
  const recordUpdateReminder = async () => {
    try {
      const today = new Date().toDateString();
      await SecureStore.setItemAsync('lastUpdateReminderDate', today);
    } catch (error) {
      console.error('Record update reminder error:', error);
    }
  };

  // 上报升级失败
  const reportUpgradeFailure = async (error: Error) => {
    try {
      const userStr = await SecureStore.getItemAsync('user');
      const user = userStr ? JSON.parse(userStr) : null;

      const deviceId = Constants.deviceId || Constants.expoConfig?.extra?.deviceId || 'unknown';

      await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/app-version/upgrade-failure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user?.id,
          device_id: deviceId,
          old_version_code: CURRENT_VERSION_CODE,
          new_version_code: versionInfo?.latest_version?.version_code,
          error_message: error.message,
          device_info: JSON.stringify({
            platform: Platform.OS,
            version: Platform.Version,
            model: Constants.deviceName,
          }),
        }),
      });
    } catch (reportError) {
      console.error('Report upgrade failure error:', reportError);
    }
  };

  // 检查版本更新
  const checkVersionUpdate = async () => {
    if (!enabled) {
      return;
    }

    setIsLoading(true);
    try {
      const deviceId = Constants.deviceId || Constants.expoConfig?.extra?.deviceId || 'unknown';

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/app-version/check?version_code=${CURRENT_VERSION_CODE}&device_id=${deviceId}`
      );

      const data = await response.json();

      if (data.has_update) {
        setVersionInfo(data);

        // 如果是强制更新，直接显示；否则检查是否可以显示提醒
        if (data.is_mandatory) {
          setVisible(true);
        } else {
          const canShow = await canShowUpdateReminder();
          if (canShow) {
            setVisible(true);
            await recordUpdateReminder();
          }
        }
      }
    } catch (error) {
      console.error('Check version update error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 立即升级
  const handleUpgrade = async () => {
    if (!versionInfo?.latest_version?.download_url) {
      Alert.alert('错误', '下载链接不存在');
      return;
    }

    try {
      onUpgradeStart?.();

      if (Platform.OS === 'web') {
        // Web环境直接打开下载链接
        window.open(versionInfo.latest_version.download_url, '_blank');
        onUpgradeSuccess?.();
      } else {
        // 移动端提示用户下载
        Alert.alert(
          '升级提示',
          '将跳转到下载页面，请下载新版本后安装',
          [
            { text: '取消', style: 'cancel' },
            {
              text: '确定',
              onPress: async () => {
                try {
                  const supported = await Linking.canOpenURL(versionInfo.latest_version.download_url);
                  if (supported) {
                    await Linking.openURL(versionInfo.latest_version.download_url);
                    onUpgradeSuccess?.();
                  } else {
                    throw new Error('无法打开下载链接');
                  }
                } catch (error: any) {
                  await reportUpgradeFailure(error);
                  onUpgradeError?.(error);
                  Alert.alert(
                    '升级失败',
                    '升级失败，请联系管理员',
                    [{ text: '确定' }]
                  );
                }
              },
            },
          ]
        );
      }
    } catch (error: any) {
      await reportUpgradeFailure(error);
      onUpgradeError?.(error);
      Alert.alert(
        '升级失败',
        '升级失败，请联系管理员',
        [{ text: '确定' }]
      );
    }
  };

  // 稍后升级
  const handleLater = () => {
    setVisible(false);
  };

  // 关闭弹窗
  const handleDismiss = () => {
    setVisible(false);
  };

  return {
    visible,
    versionInfo,
    isLoading,
    checkVersionUpdate,
    handleUpgrade,
    handleLater,
    handleDismiss,
    renderDialog: () => (
      <VersionUpdateDialog
        visible={visible}
        versionInfo={versionInfo}
        onUpgrade={handleUpgrade}
        onLater={handleLater}
        onDismiss={handleDismiss}
      />
    ),
  };
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    width: '100%',
    maxWidth: 400,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D3436',
    textAlign: 'center',
    marginBottom: 12,
  },
  versionBadge: {
    alignSelf: 'center',
    backgroundColor: 'rgba(30, 136, 229, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 12,
  },
  versionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E88E5',
  },
  versionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3436',
    textAlign: 'center',
    marginBottom: 16,
  },
  descriptionContainer: {
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  descriptionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#636E72',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#2D3436',
    lineHeight: 20,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 166, 35, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 24,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#F5A623',
    marginLeft: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonFullWidth: {
    flex: 1,
  },
  buttonPrimary: {
    backgroundColor: '#1E88E5',
  },
  buttonSecondary: {
    backgroundColor: '#F5F7FA',
  },
  buttonTextPrimary: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  buttonTextSecondary: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2D3436',
  },
});
