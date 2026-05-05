'use client';

import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from '@/hooks/useSafeRouter';
import PCLayout from '@/components/pc/PCLayout';
import { getApiBaseUrl } from '@/utils/api';
import { storage } from '@/utils/storage';

interface LoginLog {
  id: number;
  user_id: number;
  username: string;
  login_time: string;
  logout_time: string | null;
  duration: number | null;
  device_info: string | null;
  ip_address: string | null;
  platform: string | null;
}

interface OperationLog {
  id: number;
  user_id: number;
  username: string;
  action: string;
  module: string | null;
  description: string | null;
  ip_address: string | null;
}

interface LoginStats {
  total_logins: number;
  active_users: number;
  avg_duration: number;
  operation_count: number;
}

export default function PCLogs() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'login' | 'operation'>('login');
  const [loginLogs, setLoginLogs] = useState<LoginLog[]>([]);
  const [operationLogs, setOperationLogs] = useState<OperationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<LoginStats | null>(null);
  const [keyword, setKeyword] = useState('');
  const [module, setModule] = useState('');

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      const sessionId = await storage.getItem('session_id');
      
      if (activeTab === 'login') {
        const params = new URLSearchParams();
        params.append('page', '1');
        params.append('page_size', '50');
        if (keyword) params.append('username', keyword);
        
        const response = await fetch(
          `${getApiBaseUrl()}/api/v1/logs/login?${params.toString()}`,
          { headers: { Authorization: `Bearer ${sessionId}` } }
        );
        
        if (response.ok) {
          const data = await response.json();
          setLoginLogs(data.logs || data.items || []);
        }
        
        const statsResponse = await fetch(
          `${getApiBaseUrl()}/api/v1/logs/login/stats`,
          { headers: { Authorization: `Bearer ${sessionId}` } }
        );
        
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData);
        }
      } else {
        const params = new URLSearchParams();
        params.append('page', '1');
        params.append('page_size', '50');
        if (keyword) params.append('username', keyword);
        if (module) params.append('module', module);
        
        const response = await fetch(
          `${getApiBaseUrl()}/api/v1/logs/operation?${params.toString()}`,
          { headers: { Authorization: `Bearer ${sessionId}` } }
        );
        
        if (response.ok) {
          const data = await response.json();
          setOperationLogs(data.logs || data.items || []);
        }
      }
    } catch (error) {
      console.error('加载日志失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadData();
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return '-';
    if (minutes < 60) return `${minutes}分钟`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}小时${mins > 0 ? mins + '分钟' : ''}`;
  };

  const formatTime = (time: string) => {
    return new Date(time).toLocaleString('zh-CN');
  };

  const renderContent = () => (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 统计卡片 */}
      {activeTab === 'login' && stats && (
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.total_logins}</Text>
            <Text style={styles.statLabel}>登录总次数</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.active_users}</Text>
            <Text style={styles.statLabel}>活跃用户</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{formatDuration(stats.avg_duration)}</Text>
            <Text style={styles.statLabel}>平均在线时长</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.operation_count}</Text>
            <Text style={styles.statLabel}>操作总次数</Text>
          </View>
        </View>
      )}
      
      {/* 标签切换 */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'login' && styles.tabActive]}
          onPress={() => setActiveTab('login')}
        >
          <Text style={[styles.tabText, activeTab === 'login' && styles.tabTextActive]}>登录日志</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'operation' && styles.tabActive]}
          onPress={() => setActiveTab('operation')}
        >
          <Text style={[styles.tabText, activeTab === 'operation' && styles.tabTextActive]}>操作日志</Text>
        </TouchableOpacity>
      </View>
      
      {/* 筛选工具栏 */}
      <View style={styles.toolbar}>
        <TextInput
          style={styles.searchInput}
          placeholder="搜索用户名"
          value={keyword}
          onChangeText={setKeyword}
        />
        {activeTab === 'operation' && (
          <TextInput
            style={styles.searchInput}
            placeholder="搜索模块"
            value={module}
            onChangeText={setModule}
          />
        )}
        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
          <Text style={styles.searchBtnText}>搜索</Text>
        </TouchableOpacity>
      </View>
      
      {/* 日志列表 */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1677ff" />
        </View>
      ) : (
        <View style={styles.tableContainer}>
          {activeTab === 'login' ? (
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.thSmall}>序号</Text>
                <Text style={styles.th}>用户名</Text>
                <Text style={styles.th}>登录时间</Text>
                <Text style={styles.th}>登出时间</Text>
                <Text style={styles.thSmall}>在线时长</Text>
                <Text style={styles.thSmall}>IP地址</Text>
                <Text style={styles.th}>设备信息</Text>
              </View>
              {loginLogs.length === 0 ? (
                <View style={styles.emptyRow}>
                  <Text style={styles.emptyText}>暂无数据</Text>
                </View>
              ) : (
                loginLogs.map((log, index) => (
                  <View key={log.id} style={styles.tableRow}>
                    <Text style={styles.tdSmall}>{index + 1}</Text>
                    <Text style={styles.td}>{log.username}</Text>
                    <Text style={styles.td}>{formatTime(log.login_time)}</Text>
                    <Text style={styles.td}>{log.logout_time ? formatTime(log.logout_time) : '-'}</Text>
                    <Text style={styles.tdSmall}>{formatDuration(log.duration)}</Text>
                    <Text style={styles.tdSmall}>{log.ip_address || '-'}</Text>
                    <Text style={styles.td}>{log.device_info || '-'}</Text>
                  </View>
                ))
              )}
            </View>
          ) : (
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.thSmall}>序号</Text>
                <Text style={styles.th}>用户名</Text>
                <Text style={styles.thSmall}>操作动作</Text>
                <Text style={styles.thSmall}>模块</Text>
                <Text style={styles.th}>描述</Text>
                <Text style={styles.thSmall}>IP地址</Text>
              </View>
              {operationLogs.length === 0 ? (
                <View style={styles.emptyRow}>
                  <Text style={styles.emptyText}>暂无数据</Text>
                </View>
              ) : (
                operationLogs.map((log, index) => (
                  <View key={log.id} style={styles.tableRow}>
                    <Text style={styles.tdSmall}>{index + 1}</Text>
                    <Text style={styles.td}>{log.username}</Text>
                    <Text style={styles.tdSmall}>{log.action}</Text>
                    <Text style={styles.tdSmall}>{log.module || '-'}</Text>
                    <Text style={styles.td}>{log.description || '-'}</Text>
                    <Text style={styles.tdSmall}>{log.ip_address || '-'}</Text>
                  </View>
                ))
              )}
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );

  return (
    <PCLayout title="日志查询" activePath="/logs">
      {renderContent()}
    </PCLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  statsGrid: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1677ff',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 13,
    color: '#666',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  tabActive: {
    backgroundColor: '#1677ff',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#fff',
  },
  toolbar: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    height: 36,
    borderWidth: 1,
    borderColor: '#d9d9d9',
    borderRadius: 6,
    paddingHorizontal: 12,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  searchBtn: {
    height: 36,
    paddingHorizontal: 20,
    backgroundColor: '#1677ff',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    padding: 60,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  tableContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  table: {
    width: '100%',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#fafafa',
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  th: {
    flex: 1,
    fontSize: 13,
    fontWeight: 'bold',
    color: '#333',
  },
  thSmall: {
    width: 80,
    fontSize: 13,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  td: {
    flex: 1,
    fontSize: 13,
    color: '#666',
  },
  tdSmall: {
    width: 80,
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
  },
  emptyRow: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
});
