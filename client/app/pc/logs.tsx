'use client';

import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Platform, Alert, ScrollView } from 'react-native';
import { getApiBaseUrl } from '@/utils/api';
import { storage } from '@/utils/storage';
import '@/assets/styles/pc-global.css';

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
        // 加载登录日志
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
        
        // 加载统计数据
        const statsResponse = await fetch(
          `${getApiBaseUrl()}/api/v1/logs/login/stats`,
          { headers: { Authorization: `Bearer ${sessionId}` } }
        );
        
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData);
        }
      } else {
        // 加载操作日志
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

  return (
    <div className="pc-page-container">
      <div className="pc-page-header">
        <h1 className="pc-page-title">日志查询</h1>
      </div>
      
      {/* 统计卡片 */}
      {activeTab === 'login' && stats && (
        <div className="pc-stats-grid">
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
        </div>
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
          placeholder={activeTab === 'login' ? '搜索用户名' : '搜索用户名'}
          value={keyword}
          onChangeText={setKeyword}
          onSubmitEditing={handleSearch}
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
            // 登录日志表格
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.th, styles.thId]}>序号</Text>
                <Text style={[styles.th, styles.thUser]}>用户名</Text>
                <Text style={[styles.th, styles.thTime]}>登录时间</Text>
                <Text style={[styles.th, styles.thTime]}>登出时间</Text>
                <Text style={[styles.th, styles.thDuration]}>在线时长</Text>
                <Text style={[styles.th, styles.thIp]}>IP地址</Text>
                <Text style={[styles.th, styles.thDevice]}>设备信息</Text>
              </View>
              {loginLogs.length === 0 ? (
                <View style={styles.emptyRow}>
                  <Text style={styles.emptyText}>暂无数据</Text>
                </View>
              ) : (
                loginLogs.map((log, index) => (
                  <View key={log.id} style={styles.tableRow}>
                    <Text style={[styles.td, styles.thId]}>{index + 1}</Text>
                    <Text style={[styles.td, styles.thUser]}>{log.username}</Text>
                    <Text style={[styles.td, styles.thTime]}>{formatTime(log.login_time)}</Text>
                    <Text style={[styles.td, styles.thTime]}>{log.logout_time ? formatTime(log.logout_time) : '-'}</Text>
                    <Text style={[styles.td, styles.thDuration]}>{formatDuration(log.duration)}</Text>
                    <Text style={[styles.td, styles.thIp]}>{log.ip_address || '-'}</Text>
                    <Text style={[styles.td, styles.thDevice]}>{log.device_info || '-'}</Text>
                  </View>
                ))
              )}
            </View>
          ) : (
            // 操作日志表格
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.th, styles.thId]}>序号</Text>
                <Text style={[styles.th, styles.thUser]}>用户名</Text>
                <Text style={[styles.th, styles.thAction]}>操作动作</Text>
                <Text style={[styles.th, styles.thModule]}>模块</Text>
                <Text style={[styles.th, styles.thDesc]}>描述</Text>
                <Text style={[styles.th, styles.thIp]}>IP地址</Text>
              </View>
              {operationLogs.length === 0 ? (
                <View style={styles.emptyRow}>
                  <Text style={styles.emptyText}>暂无数据</Text>
                </View>
              ) : (
                operationLogs.map((log, index) => (
                  <View key={log.id} style={styles.tableRow}>
                    <Text style={[styles.td, styles.thId]}>{index + 1}</Text>
                    <Text style={[styles.td, styles.thUser]}>{log.username}</Text>
                    <Text style={[styles.td, styles.thAction]}>{log.action}</Text>
                    <Text style={[styles.td, styles.thModule]}>{log.module || '-'}</Text>
                    <Text style={[styles.td, styles.thDesc]}>{log.description || '-'}</Text>
                    <Text style={[styles.td, styles.thIp]}>{log.ip_address || '-'}</Text>
                  </View>
                ))
              )}
            </View>
          )}
        </View>
      )}
    </div>
  );
}

const styles = StyleSheet.create({
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 8,
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1677ff',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8',
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#1677ff',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  tabTextActive: {
    color: '#1677ff',
    fontWeight: 'bold',
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
    borderRadius: 4,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  searchBtn: {
    height: 36,
    paddingHorizontal: 20,
    backgroundColor: '#1677ff',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBtnText: {
    color: '#fff',
    fontSize: 14,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  tableContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
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
    fontSize: 13,
    fontWeight: 'bold',
    color: '#333',
  },
  thId: { width: 50, textAlign: 'center' },
  thUser: { flex: 1 },
  thTime: { width: 150 },
  thDuration: { width: 100, textAlign: 'center' },
  thIp: { width: 120 },
  thDevice: { width: 150 },
  thAction: { width: 100 },
  thModule: { width: 100 },
  thDesc: { flex: 1 },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  td: {
    fontSize: 13,
    color: '#666',
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
