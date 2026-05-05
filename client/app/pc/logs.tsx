'use client';

import React, { useState, useEffect } from 'react';
import { View, Text, Input, Button, Select, Table, Tag, Card, message, Spin, Tabs, DatePicker, Modal } from 'antd';
import { SearchOutlined, UserOutlined, CalendarOutlined, DesktopOutlined, GlobalOutlined } from '@ant-design/icons';
import { getApiBaseUrl } from '@/utils/api';

const { Option } = Select;
const { RangePicker } = DatePicker;

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
  platform: string | null;
  created_at: string;
}

interface LogStats {
  total_logins: number;
  total_operations: number;
  active_users: number;
  avg_login_duration: number;
}

export default function PCLogs() {
  const [activeTab, setActiveTab] = useState<'login' | 'operation'>('login');
  const [loading, setLoading] = useState(false);
  
  // 登录日志
  const [loginLogs, setLoginLogs] = useState<LoginLog[]>([]);
  const [loginPage, setLoginPage] = useState(1);
  const [loginTotal, setLoginTotal] = useState(0);
  const [loginFilter, setLoginFilter] = useState({
    username: '',
    startDate: '',
    endDate: '',
  });
  
  // 操作日志
  const [operationLogs, setOperationLogs] = useState<OperationLog[]>([]);
  const [operationPage, setOperationPage] = useState(1);
  const [operationTotal, setOperationTotal] = useState(0);
  const [operationFilter, setOperationFilter] = useState({
    username: '',
    module: '',
    action: '',
    startDate: '',
    endDate: '',
  });
  
  // 统计数据
  const [stats, setStats] = useState<LogStats>({
    total_logins: 0,
    total_operations: 0,
    active_users: 0,
    avg_login_duration: 0,
  });

  // 用户列表
  const [userList, setUserList] = useState<{id: number; username: string; name: string; phone: string}[]>([]);
  const [userModalVisible, setUserModalVisible] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');

  // 模块列表
  const moduleList = [
    {id: 'user', name: '用户管理'},
    {id: 'device', name: '设备管理'},
    {id: 'contract', name: '合同管理'},
    {id: 'workorder', name: '工单管理'},
    {id: 'after_sales', name: '售后服务'},
    {id: 'inventory', name: '库存管理'},
    {id: 'report', name: '报表分析'},
    {id: 'file', name: '文件管理'},
    {id: 'log', name: '日志管理'},
  ];

  useEffect(() => {
    fetchUserList();
    fetchLoginLogs();
    fetchStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'login') {
      fetchLoginLogs();
      fetchStats();
    } else {
      fetchOperationLogs();
    }
  }, [activeTab]);

  const getApiBaseUrlFunc = () => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:9091';
      }
    }
    return process.env.EXPO_PUBLIC_BACKEND_BASE_URL || '';
  };

  const fetchUserList = async () => {
    try {
      const baseUrl = getApiBaseUrlFunc();
      const response = await fetch(`${baseUrl}/api/v1/users`);
      const data = await response.json();

      if (Array.isArray(data)) {
        setUserList(data.map((u: any) => ({
          id: u.id,
          username: u.username || '',
          name: u.name || '',
          phone: u.phone || '',
        })));
      }
    } catch (error) {
      console.error('获取用户列表错误:', error);
    }
  };

  const fetchLoginLogs = async (page = 1) => {
    try {
      setLoading(true);
      const baseUrl = getApiBaseUrlFunc();
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });
      
      if (loginFilter.username) params.append('username', loginFilter.username);
      if (loginFilter.startDate) params.append('start_date', loginFilter.startDate);
      if (loginFilter.endDate) params.append('end_date', loginFilter.endDate);
      
      const response = await fetch(
        `${baseUrl}/api/v1/logs/login?${params.toString()}`
      );
      const data = await response.json();
      
      if (data.code === 200) {
        setLoginLogs(data.data.list || []);
        setLoginTotal(data.data.total || 0);
        setLoginPage(page);
      } else {
        message.error(data.message || '获取登录日志失败');
      }
    } catch (error) {
      console.error('获取登录日志错误:', error);
      message.error('网络请求失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchOperationLogs = async (page = 1) => {
    try {
      setLoading(true);
      const baseUrl = getApiBaseUrlFunc();
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });
      
      if (operationFilter.username) params.append('username', operationFilter.username);
      if (operationFilter.module) params.append('module', operationFilter.module);
      if (operationFilter.action) params.append('action', operationFilter.action);
      if (operationFilter.startDate) params.append('start_date', operationFilter.startDate);
      if (operationFilter.endDate) params.append('end_date', operationFilter.endDate);
      
      const response = await fetch(
        `${baseUrl}/api/v1/logs/operation?${params.toString()}`
      );
      const data = await response.json();
      
      if (data.code === 200) {
        setOperationLogs(data.data.list || []);
        setOperationTotal(data.data.total || 0);
        setOperationPage(page);
      } else {
        message.error(data.message || '获取操作日志失败');
      }
    } catch (error) {
      console.error('获取操作日志错误:', error);
      message.error('网络请求失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const baseUrl = getApiBaseUrlFunc();
      const response = await fetch(`${baseUrl}/api/v1/logs/login/stats`);
      const data = await response.json();

      if (data.code === 200 && data.data) {
        setStats({
          total_logins: data.data.total_logins || 0,
          total_operations: 0,
          active_users: data.data.unique_users || 0,
          avg_login_duration: data.data.avg_duration || 0,
        });
      }
    } catch (error) {
      console.error('获取统计数据错误:', error);
    }
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return '-';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}小时${mins}分钟`;
    }
    return `${mins}分钟`;
  };

  const getModuleColor = (module: string | null) => {
    const colors: Record<string, string> = {
      user: 'blue',
      device: 'green',
      contract: 'orange',
      workorder: 'purple',
      after_sales: 'cyan',
      inventory: 'magenta',
      report: 'gold',
      file: 'volcano',
      log: 'lime',
    };
    return colors[module || ''] || 'default';
  };

  const getModuleName = (module: string | null) => {
    const item = moduleList.find(m => m.id === module);
    return item ? item.name : module || '-';
  };

  const loginColumns = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      width: 120,
    },
    {
      title: '登录时间',
      dataIndex: 'login_time',
      key: 'login_time',
      width: 180,
    },
    {
      title: '退出时间',
      dataIndex: 'logout_time',
      key: 'logout_time',
      width: 180,
    },
    {
      title: '在线时长',
      dataIndex: 'duration',
      key: 'duration',
      width: 120,
      render: (val: number | null) => formatDuration(val),
    },
    {
      title: 'IP地址',
      dataIndex: 'ip_address',
      key: 'ip_address',
      width: 140,
    },
    {
      title: '设备信息',
      dataIndex: 'device_info',
      key: 'device_info',
      width: 150,
      ellipsis: true,
    },
    {
      title: '平台',
      dataIndex: 'platform',
      key: 'platform',
      width: 100,
      render: (val: string | null) => val || '-',
    },
  ];

  const operationColumns = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      width: 120,
    },
    {
      title: '操作类型',
      dataIndex: 'action',
      key: 'action',
      width: 100,
    },
    {
      title: '模块',
      dataIndex: 'module',
      key: 'module',
      width: 120,
      render: (val: string | null) => (
        <Tag color={getModuleColor(val)}>{getModuleName(val)}</Tag>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'IP地址',
      dataIndex: 'ip_address',
      key: 'ip_address',
      width: 140,
    },
    {
      title: '时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
    },
  ];

  const filteredUsers = userList.filter(u => 
    u.username.toLowerCase().includes(searchKeyword.toLowerCase()) ||
    u.name.toLowerCase().includes(searchKeyword.toLowerCase())
  );

  return (
    <div className="pc-container">
      <div className="pc-header">
        <h1 className="pc-title">日志查询</h1>
      </div>

      <div className="pc-content">
        {/* 统计卡片 */}
        <div className="pc-stats-grid">
          <Card size="small">
            <div className="pc-stat-item">
              <UserOutlined className="pc-stat-icon" style={{ color: '#1890ff' }} />
              <div>
                <Text className="pc-stat-value">{stats.total_logins}</Text>
                <Text className="pc-stat-label">登录总次数</Text>
              </div>
            </div>
          </Card>
          <Card size="small">
            <div className="pc-stat-item">
              <DesktopOutlined className="pc-stat-icon" style={{ color: '#52c41a' }} />
              <div>
                <Text className="pc-stat-value">{stats.active_users}</Text>
                <Text className="pc-stat-label">活跃用户</Text>
              </div>
            </div>
          </Card>
          <Card size="small">
            <div className="pc-stat-item">
              <CalendarOutlined className="pc-stat-icon" style={{ color: '#faad14' }} />
              <div>
                <Text className="pc-stat-value">{formatDuration(stats.avg_login_duration)}</Text>
                <Text className="pc-stat-label">平均在线时长</Text>
              </div>
            </div>
          </Card>
          <Card size="small">
            <div className="pc-stat-item">
              <GlobalOutlined className="pc-stat-icon" style={{ color: '#722ed1' }} />
              <div>
                <Text className="pc-stat-value">{stats.total_operations}</Text>
                <Text className="pc-stat-label">操作总次数</Text>
              </div>
            </div>
          </Card>
        </div>

        {/* 标签页 */}
        <div className="pc-card" style={{ marginTop: 16 }}>
          <Tabs
            activeKey={activeTab}
            onChange={(key) => setActiveTab(key as 'login' | 'operation')}
            items={[
              {
                key: 'login',
                label: '登录日志',
                children: (
                  <div>
                    {/* 筛选区域 */}
                    <div className="pc-filter-bar">
                      <div className="pc-filter-item">
                        <Text>用户名：</Text>
                        <Select
                          placeholder="选择用户"
                          style={{ width: 150 }}
                          value={loginFilter.username || undefined}
                          onChange={(val) => setLoginFilter({...loginFilter, username: val || ''})}
                          allowClear
                          showSearch
                          filterOption={(input, option) =>
                            (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                          }
                        >
                          {userList.map((u) => (
                            <Option key={u.id} value={u.username}>{u.name || u.username}</Option>
                          ))}
                        </Select>
                      </div>
                      <div className="pc-filter-item">
                        <Text>日期范围：</Text>
                        <RangePicker
                          onChange={(dates, dateStrings) => {
                            setLoginFilter({
                              ...loginFilter,
                              startDate: dateStrings[0] || '',
                              endDate: dateStrings[1] || '',
                            });
                          }}
                        />
                      </div>
                      <Button type="primary" icon={<SearchOutlined />} onClick={() => fetchLoginLogs(1)}>
                        查询
                      </Button>
                      <Button onClick={() => {
                        setLoginFilter({ username: '', startDate: '', endDate: '' });
                        fetchLoginLogs(1);
                      }}>
                        重置
                      </Button>
                    </div>

                    {/* 登录日志表格 */}
                    <Table
                      columns={loginColumns}
                      dataSource={loginLogs}
                      rowKey="id"
                      loading={loading}
                      pagination={{
                        current: loginPage,
                        total: loginTotal,
                        pageSize: 20,
                        showTotal: (total) => `共 ${total} 条`,
                        onChange: (page) => fetchLoginLogs(page),
                      }}
                      scroll={{ x: 900 }}
                    />
                  </div>
                ),
              },
              {
                key: 'operation',
                label: '操作日志',
                children: (
                  <div>
                    {/* 筛选区域 */}
                    <div className="pc-filter-bar">
                      <div className="pc-filter-item">
                        <Text>用户名：</Text>
                        <Select
                          placeholder="选择用户"
                          style={{ width: 150 }}
                          value={operationFilter.username || undefined}
                          onChange={(val) => setOperationFilter({...operationFilter, username: val || ''})}
                          allowClear
                          showSearch
                          filterOption={(input, option) =>
                            (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                          }
                        >
                          {userList.map((u) => (
                            <Option key={u.id} value={u.username}>{u.name || u.username}</Option>
                          ))}
                        </Select>
                      </div>
                      <div className="pc-filter-item">
                        <Text>模块：</Text>
                        <Select
                          placeholder="选择模块"
                          style={{ width: 150 }}
                          value={operationFilter.module || undefined}
                          onChange={(val) => setOperationFilter({...operationFilter, module: val || ''})}
                          allowClear
                        >
                          {moduleList.map((m) => (
                            <Option key={m.id} value={m.id}>{m.name}</Option>
                          ))}
                        </Select>
                      </div>
                      <div className="pc-filter-item">
                        <Text>日期范围：</Text>
                        <RangePicker
                          onChange={(dates, dateStrings) => {
                            setOperationFilter({
                              ...operationFilter,
                              startDate: dateStrings[0] || '',
                              endDate: dateStrings[1] || '',
                            });
                          }}
                        />
                      </div>
                      <Button type="primary" icon={<SearchOutlined />} onClick={() => fetchOperationLogs(1)}>
                        查询
                      </Button>
                      <Button onClick={() => {
                        setOperationFilter({ username: '', module: '', action: '', startDate: '', endDate: '' });
                        fetchOperationLogs(1);
                      }}>
                        重置
                      </Button>
                    </div>

                    {/* 操作日志表格 */}
                    <Table
                      columns={operationColumns}
                      dataSource={operationLogs}
                      rowKey="id"
                      loading={loading}
                      pagination={{
                        current: operationPage,
                        total: operationTotal,
                        pageSize: 20,
                        showTotal: (total) => `共 ${total} 条`,
                        onChange: (page) => fetchOperationLogs(page),
                      }}
                      scroll={{ x: 900 }}
                    />
                  </div>
                ),
              },
            ]}
          />
        </div>
      </div>

      <style>{`
        .pc-container {
          padding: 24px;
          max-width: 1400px;
          margin: 0 auto;
        }
        .pc-header {
          margin-bottom: 24px;
        }
        .pc-title {
          font-size: 24px;
          font-weight: 600;
          color: #1a1a1a;
          margin: 0;
        }
        .pc-card {
          background: #fff;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
        .pc-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }
        .pc-stat-item {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .pc-stat-icon {
          font-size: 32px;
        }
        .pc-stat-value {
          display: block;
          font-size: 24px;
          font-weight: 600;
          color: #333;
        }
        .pc-stat-label {
          display: block;
          font-size: 14px;
          color: #999;
        }
        .pc-filter-bar {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 16px;
          padding-bottom: 16px;
          border-bottom: 1px solid #f0f0f0;
        }
        .pc-filter-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }
      `}</style>
    </div>
  );
}
