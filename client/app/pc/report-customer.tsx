import React, { useState, useEffect } from 'react';
import '@/assets/styles/pc-global.css';
import { PCLayout } from '@/components/pc/PCLayout';
import { PCCard } from '@/components/pc/PCComponents';
import { PCTable } from '@/components/pc/PCComponents';
import { PCStatCard } from '@/components/pc/PCComponents';
import { PCModal } from '@/components/pc/PCComponents';
import { getApiBaseUrl } from '@/utils/api';

interface SummaryData {
  total_customers: number;
  total_contracts: number;
  total_devices: number;
  total_after_sales: number;
  updated_at: string;
}

interface CustomerReportItem {
  customer_id: number;
  customer_name: string;
  contract_count: number;
  device_count: number;
  work_order_count: number;
}

const FILTER_OPTIONS = [
  { label: '全部', value: 'all' },
  { label: '本月', value: 'month' },
  { label: '本季度', value: 'quarter' },
  { label: '本年度', value: 'year' },
];

const customerColumns = [
  { key: 'customer_name', title: '客户名称', width: 200 },
  { key: 'contract_count', title: '合同数', width: 100, render: (val: number) => <span style={{ fontWeight: 600 }}>{val}</span> },
  { key: 'device_count', title: '设备数', width: 100, render: (val: number) => <span style={{ fontWeight: 600 }}>{val}</span> },
  { key: 'work_order_count', title: '售后工单数', width: 120, render: (val: number) => <span style={{ fontWeight: 600, color: '#E67E22' }}>{val}</span> },
];

export default function PCReportCustomer() {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [details, setDetails] = useState<CustomerReportItem[]>([]);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

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
        `${getApiBaseUrl()}/api/v1/reports/customers?${params.toString()}`
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

  const handleSearch = async () => {
    if (searchQuery.trim()) {
      try {
        setLoading(true);
        const response = await fetch(
          `${getApiBaseUrl()}/api/v1/reports/customers?search=${encodeURIComponent(searchQuery)}`
        );
        const data = await response.json();
        if (response.ok) {
          setDetails(data.details || []);
          if ((data.details || []).length === 0) {
            alert(`未找到包含"${searchQuery}"的客户`);
          }
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    } else {
      loadReportData();
    }
    setShowSearchModal(false);
  };

  const handleExport = async (format: string) => {
    setShowExportModal(false);
    try {
      window.open(`${getApiBaseUrl()}/api/v1/reports/customers/export?format=${format}`, '_blank');
      alert('导出成功');
    } catch (error) {
      alert('导出失败');
    }
  };

  const handleViewDetail = (customerId: number, customerName: string) => {
    window.location.href = `/pc/report-customer-detail?customerId=${customerId}&customerName=${encodeURIComponent(customerName)}`;
  };

  return (
    <PCLayout>
      <div className="pc-page-header">
        <div>
          <h1 className="pc-page-title">客户统计表</h1>
          <p className="pc-page-description">统计各客户数、合同数、设备数、售后工单数</p>
        </div>
        <a href="/pc/reports" style={{ color: '#4F8EF7', fontSize: 14, textDecoration: 'none' }}>← 返回报表中心</a>
      </div>

      {/* 统计概览 */}
      <div className="pc-card" style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#2D3436', marginBottom: 20 }}>统计概览</h3>
        <div className="pc-stat-grid" style={{ marginBottom: 16 }}>
          <PCStatCard title="客户总数" value={summary?.total_customers || 0} icon="👥" iconColor="#1E88E5" />
          <PCStatCard title="合同总数" value={summary?.total_contracts || 0} icon="📋" iconColor="#3498DB" />
          <PCStatCard title="设备总数" value={summary?.total_devices || 0} icon="📱" iconColor="#2ECC71" />
          <PCStatCard title="售后工单总数" value={summary?.total_after_sales || 0} icon="🔧" iconColor="#E67E22" />
        </div>
        {summary?.updated_at && (
          <p style={{ fontSize: 12, color: '#95A5A6', textAlign: 'center' }}>
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
          onClick={() => setShowSearchModal(true)}
          style={{
            padding: '10px 20px',
            borderRadius: 8,
            border: 'none',
            backgroundColor: '#3498DB',
            color: '#fff',
            fontSize: 14,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          🔍 查询
        </button>

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

      {/* 客户明细 */}
      <PCCard title={`客户明细（${details.length}）`}>
        <PCTable
          columns={customerColumns}
          data={details.map(item => ({
            ...item,
            onClick: () => handleViewDetail(item.customer_id, item.customer_name)
          }))}
          rowKey="customer_id"
          loading={loading}
          onRowClick={(item) => handleViewDetail(item.customer_id, item.customer_name)}
        />
      </PCCard>

      {/* 搜索弹窗 */}
      <PCModal
        visible={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        title="查询客户"
      >
        <div style={{ marginBottom: 16 }}>
          <input
            type="text"
            placeholder="输入客户名称"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: 8,
              border: '1px solid #E0E0E0',
              fontSize: 14,
              outline: 'none',
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => { setSearchQuery(''); setShowSearchModal(false); loadReportData(); }}
            style={{
              flex: 1,
              padding: '12px 20px',
              borderRadius: 8,
              border: '1px solid #E0E0E0',
              backgroundColor: '#F5F7FA',
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            清除
          </button>
          <button
            onClick={handleSearch}
            style={{
              flex: 1,
              padding: '12px 20px',
              borderRadius: 8,
              border: 'none',
              backgroundColor: '#1E88E5',
              color: '#fff',
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            查询
          </button>
        </div>
      </PCModal>

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
