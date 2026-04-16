import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { FontAwesome6 } from '@expo/vector-icons';
import { getApiBaseUrl } from '@/utils/api';
import { createFormDataFile } from '@/utils';

interface OSSUploaderProps {
  onUploadSuccess?: (fileInfo: FileInfo) => void;
  onUploadError?: (error: string) => void;
  accept?: string;
  maxSize?: number; // MB
  buttonText?: string;
  buttonStyle?: any;
  disabled?: boolean;
}

interface FileInfo {
  url: string;
  filename: string;
  contentType: string;
  size: number;
}

export const OSSUploader: React.FC<OSSUploaderProps> = ({
  onUploadSuccess,
  onUploadError,
  accept = '*/*',
  maxSize = 10,
  buttonText = '选择文件',
  buttonStyle,
  disabled = false,
}) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handlePickFile = async () => {
    if (disabled || uploading) {
      return;
    }

    try {
      // 选择文件
      const result = await DocumentPicker.getDocumentAsync({
        type: accept,
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const file = result.assets[0];

      // 检查文件大小
      const fileSizeInMB = file.size / (1024 * 1024);
      if (fileSizeInMB > maxSize) {
        Alert.alert(
          '文件过大',
          `文件大小不能超过 ${maxSize}MB，当前文件大小为 ${fileSizeInMB.toFixed(2)}MB`
        );
        return;
      }

      // 开始上传
      await uploadFileToOSS(file);
    } catch (error: any) {
      console.error('选择文件失败:', error);
      Alert.alert('错误', `选择文件失败: ${error.message}`);
      onUploadError?.(error.message);
    }
  };

  const uploadFileToOSS = async (file: any) => {
    try {
      setUploading(true);
      setProgress(0);

      // 构建上传接口
      const uploadUrl = `${getApiBaseUrl()}/api/v1/upload/oss`;

      // 创建 FormData（使用 createFormDataFile）
      const formData = new FormData();
      const formDataFile = await createFormDataFile(file.uri, file.name, file.mimeType);
      formData.append('file', formDataFile);

      // 上传文件
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });

      setProgress(100);

      if (!response.ok) {
        throw new Error('上传失败');
      }

      const result = await response.json();

      if (result.success && result.data) {
        const fileInfo: FileInfo = result.data;
        Alert.alert('成功', '文件上传成功！');
        onUploadSuccess?.(fileInfo);
      } else {
        throw new Error(result.message || '上传失败');
      }
    } catch (error: any) {
      console.error('上传失败:', error);
      Alert.alert('上传失败', error.message);
      onUploadError?.(error.message);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, buttonStyle, disabled && styles.buttonDisabled]}
      onPress={handlePickFile}
      disabled={disabled || uploading}
      activeOpacity={0.7}
    >
      {uploading ? (
        <View style={styles.uploadingContainer}>
          <ActivityIndicator size="small" color="#fff" />
          <Text style={styles.buttonText}>上传中... {progress}%</Text>
        </View>
      ) : (
        <View style={styles.buttonContent}>
          <FontAwesome6 name="cloud-arrow-up" size={20} color="#fff" />
          <Text style={styles.buttonText}>{buttonText}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  buttonDisabled: {
    backgroundColor: '#A5B4FC',
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  uploadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
});
