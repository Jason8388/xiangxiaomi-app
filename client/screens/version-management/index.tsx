import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet, TextInput, Modal } from 'react-native';
import { Screen } from '@/components/Screen';
import { PageHeader } from '@/components/PageHeader';
import { FontAwesome6 } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';

interface Backup {
  id: number;
  backup_id: string;
  backup_type: string;
  backup_status: string;
  backup_size?: number;
  started_at: string;
  completed_at?: string;
}

interface Release {
  id: number;
  release_id: string;
  version_code: number;
  version_name: string;
  version_title: string;
  release_status: string;
  functionality_test_result: string;
  performance_test_result: string;
  compatibility_test_result: string;
  approval_status: string;
}

export default function VersionManagement() {
  const [activeTab, setActiveTab] = useState<'backups' | 'releases' | 'rollbacks'>('backups');
  const [user, setUser] = useState<any>(null);
  const [backups, setBackups] = useState<Backup[]>([]);
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUserData();
    fetchData();
  }, [activeTab]);

  const loadUserData = async () => {
    try {
      const userStr = await SecureStore.getItemAsync('user');
      if (userStr) {
        setUser(JSON.parse(userStr));
      }
    } catch (error) {
      console.error('Load user error:', error);
    }
  };

  const fetchData = async () => {
    if (activeTab === 'backups') {
      fetchBackups();
    } else if (activeTab === 'releases') {
      fetchReleases();
    }
  };

  const fetchBackups = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/db-backup`);
      const data = await response.json();
      if (response.ok) {
        setBackups(data);
      }
    } catch (error) {
      console.error('Fetch backups error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReleases = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/version-release`);
      const data = await response.json();
      if (response.ok) {
        setReleases(data);
      }
    } catch (error) {
      console.error('Fetch releases error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManualBackup = async () => {
    try {
      Alert.alert('提示', '确定要创建手动备份吗？', [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          onPress: async () => {
            const response = await fetch(
              `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/db-backup/manual`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ created_by: user?.id }),
              }
            );
            const data = await response.json();
            if (response.ok) {
              Alert.alert('成功', data.message);
              fetchBackups();
            } else {
              throw new Error(data.error || '备份失败');
            }
          },
        },
      ]);
    } catch (error: any) {
      Alert.alert('错误', error.message);
    }
  };

  const handleCleanupBackups = async () => {
    try {
      Alert.alert('提示', '确定要清理超过3个月的备份文件吗？', [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          onPress: async () => {
            const response = await fetch(
              `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/db-backup/cleanup`,
              {
                method: 'POST',
              }
            );
            const data = await response.json();
            if (response.ok) {
              Alert.alert('成功', data.message);
              fetchBackups();
            } else {
              throw new Error(data.error || '清理失败');
            }
          },
        },
      ]);
    } catch (error: any) {
      Alert.alert('错误', error.message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
      case 'approved':
      case 'published':
      case 'pass':
        return '#2ECC71';
      case 'running':
      case 'pending':
      case 'reviewing':
        return '#F39C12';
      case 'failed':
      case 'rejected':
      case 'fail':
        return '#E74C3C';
      default:
        return '#95A5A6';
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      success: '成功',
      running: '进行中',
      failed: '失败',
      pending: '待处理',
      testing: '测试中',
      reviewing: '审核中',
      approved: '已批准',
      rejected: '已拒绝',
      published: '已发布',
      pass: '通过',
      fail: '未通过',
    };
    return statusMap[status] || status;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <Screen>
      <PageHeader title="版本管理" />

      {/* Tab切换 */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'backups' && styles.tabActive]}
          onPress={() => setActiveTab('backups')}
        >
          <Text style={[styles.tabText, activeTab === 'backups' && styles.tabTextActive]}>
            备份管理
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'releases' && styles.tabActive]}
          onPress={() => setActiveTab('releases')}
        >
          <Text style={[styles.tabText, activeTab === 'releases' && styles.tabTextActive]}>
            版本发布
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'rollbacks' && styles.tabActive]}
          onPress={() => setActiveTab('rollbacks')}
        >
          <Text style={[styles.tabText, activeTab === 'rollbacks' && styles.tabTextActive]}>
            版本回退
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'backups' && (
        <>
          {/* 操作按钮 */}
          <View style={styles.actionContainer}>
            <TouchableOpacity style={styles.actionButton} onPress={handleManualBackup}>
              <FontAwesome6 name="database" size={16} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>手动备份</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonSecondary]}
              onPress={handleCleanupBackups}
            >
              <FontAwesome6 name="trash" size={16} color="#E74C3C" />
              <Text style={[styles.actionButtonText, styles.actionButtonTextSecondary]}>
                清理备份
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.listContainer}>
            {loading ? (
              <View style={styles.centerContainer}>
                <Text>加载中...</Text>
              </View>
            ) : backups.length === 0 ? (
              <View style={styles.centerContainer}>
                <Text style={styles.emptyText}>暂无备份记录</Text>
              </View>
            ) : (
              backups.map((backup) => (
                <View key={backup.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>备份 #{backup.id}</Text>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(backup.backup_status) },
                      ]}
                    >
                      <Text style={styles.statusText}>{getStatusText(backup.backup_status)}</Text>
                    </View>
                  </View>
                  <View style={styles.cardDetails}>
                    <Text style={styles.detailText}>类型: {backup.backup_type}</Text>
                    <Text style={styles.detailText}>
                      大小: {formatFileSize(backup.backup_size)}
                    </Text>
                    <Text style={styles.detailText}>
                      时间: {new Date(backup.started_at).toLocaleString('zh-CN')}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </>
      )}

      {activeTab === 'releases' && (
        <ScrollView style={styles.listContainer}>
          {loading ? (
            <View style={styles.centerContainer}>
              <Text>加载中...</Text>
            </View>
          ) : releases.length === 0 ? (
            <View style={styles.centerContainer}>
              <Text style={styles.emptyText}>暂无发布记录</Text>
            </View>
          ) : (
            releases.map((release) => (
              <View key={release.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{release.version_title}</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(release.release_status) },
                    ]}
                  >
                    <Text style={styles.statusText}>{getStatusText(release.release_status)}</Text>
                  </View>
                </View>
                <View style={styles.versionBadge}>
                  <Text style={styles.versionText}>v{release.version_name}</Text>
                </View>
                <View style={styles.testResults}>
                  <View style={styles.testItem}>
                    <Text style={styles.testLabel}>功能测试</Text>
                    <Text
                      style={[
                        styles.testResult,
                        { color: getStatusColor(release.functionality_test_result) },
                      ]}
                    >
                      {getStatusText(release.functionality_test_result)}
                    </Text>
                  </View>
                  <View style={styles.testItem}>
                    <Text style={styles.testLabel}>性能测试</Text>
                    <Text
                      style={[
                        styles.testResult,
                        { color: getStatusColor(release.performance_test_result) },
                      ]}
                    >
                      {getStatusText(release.performance_test_result)}
                    </Text>
                  </View>
                  <View style={styles.testItem}>
                    <Text style={styles.testLabel}>兼容性测试</Text>
                    <Text
                      style={[
                        styles.testResult,
                        { color: getStatusColor(release.compatibility_test_result) },
                      ]}
                    >
                      {getStatusText(release.compatibility_test_result)}
                    </Text>
                  </View>
                </View>
                <View style={styles.approvalInfo}>
                  <Text style={styles.approvalLabel}>审批状态</Text>
                  <Text
                    style={[styles.approvalText, { color: getStatusColor(release.approval_status) }]}
                  >
                    {getStatusText(release.approval_status)}
                  </Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {activeTab === 'rollbacks' && (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>版本回退功能开发中</Text>
          <Text style={styles.hintText}>请通过后端API进行版本回退操作</Text>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F5F7FA',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#1E88E5',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#636E72',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  actionContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#1E88E5',
  },
  actionButtonSecondary: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E74C3C',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  actionButtonTextSecondary: {
    color: '#E74C3C',
  },
  listContainer: {
    flex: 1,
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 14,
    color: '#636E72',
  },
  hintText: {
    fontSize: 12,
    color: '#95A5A6',
    marginTop: 8,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3436',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  cardDetails: {
    gap: 4,
  },
  detailText: {
    fontSize: 13,
    color: '#636E72',
  },
  versionBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(30, 136, 229, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 12,
  },
  versionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E88E5',
  },
  testResults: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F5F7FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  testItem: {
    alignItems: 'center',
  },
  testLabel: {
    fontSize: 11,
    color: '#636E72',
    marginBottom: 4,
  },
  testResult: {
    fontSize: 13,
    fontWeight: '600',
  },
  approvalInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 12,
  },
  approvalLabel: {
    fontSize: 13,
    color: '#636E72',
  },
  approvalText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
