import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Image, TouchableOpacity } from 'react-native';
import { Screen } from '@/components/Screen';
import { OSSUploader } from '@/components/OSSUploader';
import { FontAwesome6 } from '@expo/vector-icons';

export default function OSSUploadTest() {
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);

  const handleUploadSuccess = (fileInfo: any) => {
    setUploadedFiles([fileInfo, ...uploadedFiles]);
    Alert.alert('上传成功', `文件 URL: ${fileInfo.url}`);
  };

  const handleUploadError = (error: string) => {
    console.error('上传失败:', error);
  };

  const handleCopyUrl = (url: string) => {
    // 复制 URL 到剪贴板
    Alert.alert('复制成功', `URL 已复制: ${url}`);
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <FontAwesome6 name="cloud-arrow-up" size={48} color="#4F46E5" />
          <Text style={styles.title}>阿里云 OSS 文件上传</Text>
          <Text style={styles.subtitle}>安全、快速、稳定的文件存储服务</Text>
        </View>

        <View style={styles.uploadSection}>
          <Text style={styles.sectionTitle}>上传文件</Text>
          <Text style={styles.sectionDescription}>
            支持 PDF、图片、文档等多种格式，最大 10MB
          </Text>

          <OSSUploader
            onUploadSuccess={handleUploadSuccess}
            onUploadError={handleUploadError}
            buttonText="选择文件上传"
          />
        </View>

        {uploadedFiles.length > 0 && (
          <View style={styles.historySection}>
            <Text style={styles.sectionTitle}>上传历史</Text>
            {uploadedFiles.map((file, index) => (
              <View key={index} style={styles.fileItem}>
                <View style={styles.fileInfo}>
                  <FontAwesome6 name="file" size={24} color="#6B7280" />
                  <View style={styles.fileDetails}>
                    <Text style={styles.fileName}>{file.filename}</Text>
                    <Text style={styles.fileMeta}>
                      {(file.size / 1024).toFixed(2)} KB · {file.contentType}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.copyButton}
                  onPress={() => handleCopyUrl(file.url)}
                >
                  <FontAwesome6 name="copy" size={18} color="#4F46E5" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>使用说明</Text>
          <Text style={styles.infoText}>
            1. 点击"选择文件上传"按钮选择本地文件{'\n'}
            2. 文件将自动上传到阿里云 OSS{'\n'}
            3. 上传成功后会返回永久可访问的 URL{'\n'}
            4. 您可以复制 URL 用于分享或嵌入到其他页面
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 24,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  uploadSection: {
    backgroundColor: '#F9FAFB',
    padding: 20,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  historySection: {
    backgroundColor: '#F9FAFB',
    padding: 20,
    borderRadius: 12,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  fileMeta: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  copyButton: {
    padding: 8,
    backgroundColor: '#EEF2FF',
    borderRadius: 6,
  },
  infoSection: {
    backgroundColor: '#EFF6FF',
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4F46E5',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 24,
  },
});
