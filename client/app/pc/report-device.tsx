import React, { useState, useEffect } from 'react';
import '@/assets/styles/pc-global.css';
import { PCLayout } from '@/components/pc/PCLayout';
import { PCCard } from '@/components/pc/PCComponents';
import { PCTable } from '@/components/pc/PCComponents';
import { PCModal } from '@/components/pc/PCComponents';
import { getApiBaseUrl } from '@/utils/api';

interface SummaryData {
  total_devices: number;
  by_status: {
    normal: number;
    warning: number;
    error: number;
    maintenance: number;
  };
  by_type: Record<string, number>;
  updated_at: string;
}

interface DeviceItem {
  device_id: number;
  device_name: string;
  device_number: string;
  device_model: string;
  device_type: string;
  customer_name: string;
  status: string;
  installation_date: string;
  warranty_date: string;
}

const FILTER_OPTIONS = [
  { label: '全部', value: 'all' },
  { label: '本月', value: 'month' },
  { label: '本季度', value: 'quarter' },
  { label: '本年度', value: 'year' },
];

const deviceColumns = [
  { key: 'device_name', title: '设备名称', width: 180 },
  { key: 'device_number', title: '设备编号', width: 140 },
  { key: 'device_model', title: '设备型号', width: 120 },
  { key: 'device_type', title: '设备类型', width: 100 },
  { key: 'customer_name', title: '所属客户', width: 150 },
  { key: 'status', title: '状态', width: 100, render: (val: string) => {
    const colorMap: Record<string, string> = {
      '正常': '#2ECC71',
      '警告': '#F39C12',
      '故障': '#E74C3C',
      '维护中': '#3498DB',
    };
    return <span style={{ color: colorMap[val] || '#636E72', fontWeight: 500 }}>{val}</span>;
  }},
];

export default function PCReportDevice() {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [details, setDetails] = useState<DeviceItem[]>([]);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showExportModal, setShowExportModal] = useState(false);
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadReportData();
  }, [selectedFilter]);

  const loadReportData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedFilter !== 'all') {
        params.append('period', selectedFilter);
      }

      const response = await fetch(
        `${getApiBaseUrl()}/api/v1/reports/devices?${params.toString()}`
      );
      const data = await response.json();
      if (response.ok) {
        setSummary(data.summary);
        setDetails(data.details || []);
      }
    } catch (error) {
      console.error('Load report data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: string) => {
    setShowExportModal(false);
    try {
      window.open(`${getApiBaseUrl()}/api/v1/reports/devices/export?format=${format}`, '_blank');
      alert('导出成功');
    } catch (error) {
      alert('导出失败');
    }
  };

  const toggleTypeExpand = (deviceType: string) => {
    const newExpanded = new Set(expandedTypes);
    if (newExpanded.has(deviceType)) {
      newExpanded.delete(deviceType);
    } else {
      newExpanded.add(deviceType);
    }
    setExpandedTypes(newExpanded);
  };

  const typeStats = summary?.by_type
    ? Object.entries(summary.by_type).map(([type, count]) => ({ type, count }))
    : [];

  const totalDevices = summary?.total_devices || 0;
  const normalDevices = summary?.by_status?.normal || 0;
  const warningDevices = summary?.by_status?.warning || 0;
  const errorDevices = summary?.by_status?.error || 0;
  const maintenanceDevices = summary?.by_status?.maintenance || 0;

  return (
    <PCLayout>
      <div className="pc-page-header">
        <div>
          <h1 className="pc-page-title">设备统计表</h1>
          <p className="pc-page-description">统计设备数量、设备明细、对应客户、合同信息</p>
        </div>
        <a href="/pc/reports" style={{ color: '#4F8EF7', fontSize: 14, textDecoration: 'none' }}>← 返回报表中心</a>
      </div>

      {/* 总体概览 */}
      <div className="pc-card" style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#2D3436', marginBottom: 20 }}>总体概览</h3>
        
        <div style={{
          backgroundColor: '#1E88E5',
          borderRadius: 16,
          padding: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 24,
          marginBottom: 20,
        }}>
          <div style={{
            width: 72,
            height: 72,
            borderRadius: 18,
            backgroundColor: 'rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 32,
          }}>
            📱
          </div>
          <div>
            <div style={{ fontSize: 48, fontWeight: 700, color: '#fff' }}>{totalDevices}</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)' }}>设备总数</div>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 16,
          backgroundColor: '#F8F9FA',
          borderRadius: 12,
          padding: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
            <div style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#2ECC71' }} />
            <span style={{ fontSize: 13, color: '#636E72' }}>正常</span>
            <span style={{ fontSize: 18, fontWeight: 700, color: '#2ECC71' }}>{normalDevices}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
            <div style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#F39C12' }} />
            <span style={{ fontSize: 13, color: '#636E72' }}>警告</span>
            <span style={{ fontSize: 18, fontWeight: 700, color: '#F39C12' }}>{warningDevices}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
            <div style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#E74C3C' }} />
            <span style={{ fontSize: 13, color: '#636E72' }}>故障</span>
            <span style={{ fontSize: 18, fontWeight: 700, color: '#E74C3C' }}>{errorDevices}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
            <div style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#3498DB' }} />
            <span style={{ fontSize: 13, color: '#636E72' }}>维护中</span>
            <span style={{ fontSize: 18, fontWeight: 700, color: '#3498DB' }}>{maintenanceDevices}</span>
          </div>
        </div>

        {summary?.updated_at && (
          <p style={{ fontSize: 12, color: '#95A5A6', textAlign: 'center', marginTop: 16 }}>
            更新时间：{new Date(summary.updated_at).toLocaleString()}
          </p>
        )}
      </div>

      {/* 操作栏 */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <select
          value={selectedFilter}
          onChange={(e) => setSelectedFilter(e.target.value)}
          style={{
            padding: '10px 16px',
            borderRadius: 8,
            border: '1px solid #E0E0E0',
            fontSize: 14,
            backgroundColor: '#fff',
            cursor: 'pointer',
            minWidth: 120,
          }}
        >
          {FILTER_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>

        <button
          onClick={() => setShowExportModal(true)}
          style={{
            padding: '10px 20px',
            borderRadius: 8,
            border: 'none',
            backgroundColor: '#1E88E5',
            color: '#fff',
            fontSize: 14,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          📤 导出
        </button>
      </div>

      {/* 按设备类型统计 */}
      <PCCard title="按设备类型统计" style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 13, color: '#95A5A6', marginBottom: 16 }}>
          共 {typeStats.length} 种设备类型，{totalDevices} 台设备
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {typeStats.map(({ type, count }) => {
            const isExpanded = expandedTypes.has(type);
            return (
              <div
                key={type}
                className="pc-card"
                style={{ padding: 16, cursor: 'pointer' }}
                onClick={() => toggleTypeExpand(type)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    backgroundColor: 'rgba(30, 136, 229, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 20,
                  }}>
                    📱
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#2D3436', marginBottom: 4 }}>{type}</div>
                    <div style={{
                      display: 'inline-block',
                      padding: '2px 10px',
                      borderRadius: 10,
                      backgroundColor: 'rgba(30, 136, 229, 0.1)',
                      fontSize: 12,
                      color: '#1E88E5',
                      fontWeight: 600,
                    }}>
                      总计 {count} 台
                    </div>
                  </div>
                  <span style={{ color: '#95A5A6', fontSize: 18 }}>{isExpanded ? '▲' : '▼'}</span>
                </div>

                {isExpanded && (
                  <div style={{ borderTop: '1px solid #F0F0F0', paddingTop: 12, marginTop: 12 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                      <div style={{ textAlign: 'center', padding: 12, backgroundColor: '#F8F9FA', borderRadius: 8 }}>
                        <div style={{ fontSize: 20, fontWeight: 700, color: '#2D3436' }}>{count}</div>
                        <div style={{ fontSize: 11, color: '#95A5A6' }}>设备总数</div>
                      </div>
                      <div style={{ textAlign: 'center', padding: 12, backgroundColor: '#F8F9FA', borderRadius: 8 }}>
                        <div style={{ fontSize: 20, fontWeight: 700, color: '#2ECC71' }}>{count}</div>
                        <div style={{ fontSize: 11, color: '#95A5A6' }}>质保期内</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </PCCard>

      {/* 设备明细 */}
      <PCCard title={`设备明细（${details.length}）`}>
        <PCTable
          columns={deviceColumns}
          data={details}
          rowKey="device_id"
          loading={loading}
        />
      </PCCard>

      {/* 导出弹窗 */}
      <PCModal
        visible={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="选择导出格式"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button
            onClick={() => handleExport('excel')}
            style={{
              padding: '16px 20px',
              borderRadius: 8,
              border: '1px solid #E0E0E0',
              backgroundColor: '#fff',
              fontSize: 14,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              textAlign: 'left',
            }}
          >
            <span style={{ fontSize: 24 }}>📊</span>
            <div>
              <div style={{ fontWeight: 500 }}>Excel 导出</div>
              <div style={{ fontSize: 12, color: '#636E72' }}>导出为 .xlsx 格式</div>
            </div>
          </button>
          <button
            onClick={() => handleExport('pdf')}
            style={{
              padding: '16px 20px',
              borderRadius: 8,
              border: '1px solid #E0E0E0',
              backgroundColor: '#fff',
              fontSize: 14,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              textAlign: 'left',
            }}
          >
            <span style={{ fontSize: 24 }}>📄</span>
            <div>
              <div style={{ fontWeight: 500 }}>PDF 导出</div>
              <div style={{ fontSize: 12, color: '#636E72' }}>导出为 .pdf 格式</div>
            </div>
          </button>
        </div>
      </PCModal>
    </PCLayout>
  );
}
