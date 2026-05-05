import React, { useState, useEffect } from 'react';
import '@/assets/styles/pc-global.css';
import { PCLayout } from '@/components/pc/PCLayout';
import { PCCard } from '@/components/pc/PCComponents';
import { PCTable } from '@/components/pc/PCComponents';
import { PCModal } from '@/components/pc/PCComponents';
import { getApiBaseUrl } from '@/utils/api';

interface WorkOrderStats {
  totalWorkOrders: number;
  chargedWorkOrders: number;
  performanceAmount: number;
  pendingPaymentAmount: number;
  paidAmount: number;
}

interface SummaryData {
  total_work_orders: number;
  by_status: {
    pending: number;
    processing: number;
    completed: number;
  };
  by_type: Record<string, number>;
  updated_at: string;
}

interface WorkOrderItem {
  id: number;
  order_no: string;
  title: string;
  type: string;
  status: string;
  customer_name: string;
  device_name: string;
  priority: string;
  created_at: string;
}

const FILTER_OPTIONS = [
  { label: '全部', value: 'all' },
  { label: '本月', value: 'month' },
  { label: '本季度', value: 'quarter' },
  { label: '本年度', value: 'year' },
];

const workOrderColumns = [
  { key: 'order_no', title: '工单编号', width: 140 },
  { key: 'title', title: '工单标题', width: 200 },
  { key: 'type', title: '工单类型', width: 100 },
  { key: 'customer_name', title: '客户名称', width: 150 },
  { key: 'status', title: '状态', width: 100, render: (val: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      pending: { label: '待处理', color: '#F39C12' },
      processing: { label: '进行中', color: '#3498DB' },
      completed: { label: '已完成', color: '#2ECC71' },
    };
    const status = statusMap[val] || { label: val, color: '#636E72' };
    return <span style={{ color: status.color, fontWeight: 500 }}>{status.label}</span>;
  }},
  { key: 'priority', title: '优先级', width: 80, render: (val: string) => {
    const colorMap: Record<string, string> = {
      '高': '#E74C3C',
      '中': '#F39C12',
      '低': '#2ECC71',
    };
    return <span style={{ color: colorMap[val] || '#636E72' }}>{val}</span>;
  }},
  { key: 'created_at', title: '创建时间', width: 160, render: (val: string) => val ? new Date(val).toLocaleString('zh-CN') : '-' },
];

export default function PCReportAfterSales() {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [workOrderStats, setWorkOrderStats] = useState<WorkOrderStats | null>(null);
  const [details, setDetails] = useState<WorkOrderItem[]>([]);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showExportModal, setShowExportModal] = useState(false);

  useEffect(() => {
    loadReportData();
    loadWorkOrderStats();
  }, [selectedFilter]);

  const loadReportData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedFilter !== 'all') {
        params.append('period', selectedFilter);
      }

      const response = await fetch(
        `${getApiBaseUrl()}/api/v1/reports/work-orders?${params.toString()}`
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

  const loadWorkOrderStats = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/v1/work-orders/stats`);
      const data = await response.json();
      if (response.ok) {
        setWorkOrderStats(data);
      }
    } catch (error) {
      console.error('Load work order stats error:', error);
    }
  };

  const handleExport = async (format: string) => {
    setShowExportModal(false);
    try {
      window.open(`${getApiBaseUrl()}/api/v1/reports/work-orders/export?format=${format}`, '_blank');
      alert('导出成功');
    } catch (error) {
      alert('导出失败');
    }
  };

  const totalOrders = workOrderStats?.totalWorkOrders || summary?.total_work_orders || 0;
  const chargedOrders = workOrderStats?.chargedWorkOrders || 0;
  const freeOrders = totalOrders - chargedOrders;
  const completedOrders = summary?.by_status?.completed || 0;
  const totalAmount = workOrderStats?.performanceAmount || 0;
  const paidAmount = workOrderStats?.paidAmount || 0;
  const pendingAmount = workOrderStats?.pendingPaymentAmount || 0;
  const paymentRate = totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0;

  return (
    <PCLayout>
      <div className="pc-page-header">
        <div>
          <h1 className="pc-page-title">工单统计表</h1>
          <p className="pc-page-description">统计售后工单数、收费工单数、免费工单数、工单明细</p>
        </div>
        <a href="/pc/reports" style={{ color: '#4F8EF7', fontSize: 14, textDecoration: 'none' }}>← 返回报表中心</a>
      </div>

      {/* 主要统计卡片 */}
      <div className="pc-card" style={{ marginBottom: 24 }}>
        <div style={{
          backgroundColor: '#1E88E5',
          borderRadius: 16,
          padding: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 24,
          marginBottom: 24,
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
            📋
          </div>
          <div>
            <div style={{ fontSize: 48, fontWeight: 700, color: '#fff' }}>{totalOrders}</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)' }}>工单总数</div>
          </div>
        </div>

        {/* 工单数量统计 */}
        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#2D3436', marginBottom: 16 }}>工单数量统计</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          <div className="pc-card" style={{ padding: 20, textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: 'rgba(30, 136, 229, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: 22 }}>📋</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#2D3436', marginBottom: 4 }}>{totalOrders}</div>
            <div style={{ fontSize: 13, color: '#95A5A6' }}>总工单数</div>
          </div>
          <div className="pc-card" style={{ padding: 20, textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: 'rgba(46, 204, 113, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: 22 }}>💰</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#2D3436', marginBottom: 4 }}>{chargedOrders}</div>
            <div style={{ fontSize: 13, color: '#95A5A6' }}>收费工单数</div>
          </div>
          <div className="pc-card" style={{ padding: 20, textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: 'rgba(155, 89, 182, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: 22 }}>🎁</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#2D3436', marginBottom: 4 }}>{freeOrders}</div>
            <div style={{ fontSize: 13, color: '#95A5A6' }}>免费工单数</div>
          </div>
          <div className="pc-card" style={{ padding: 20, textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: 'rgba(39, 174, 96, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: 22 }}>✅</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#2D3436', marginBottom: 4 }}>{completedOrders}</div>
            <div style={{ fontSize: 13, color: '#95A5A6' }}>已完成工单数</div>
          </div>
        </div>

        {/* 金额统计 */}
        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#2D3436', marginBottom: 16 }}>金额统计</h3>
        
        <div className="pc-card" style={{ padding: 20, marginBottom: 16, backgroundColor: '#FAFAFA' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, backgroundColor: 'rgba(243, 156, 18, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 24 }}>🪙</span>
            </div>
            <div>
              <div style={{ fontSize: 14, color: '#636E72', marginBottom: 4 }}>总收费金额</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#F39C12' }}>¥{totalAmount.toLocaleString('zh-CN')}</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="pc-card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: 'rgba(46, 204, 113, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 20 }}>✅</span>
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#95A5A6', marginBottom: 2 }}>已回款金额</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#2ECC71' }}>¥{paidAmount.toLocaleString('zh-CN')}</div>
              </div>
            </div>
          </div>
          <div className="pc-card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: 'rgba(231, 76, 60, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 20 }}>⏰</span>
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#95A5A6', marginBottom: 2 }}>待回款金额</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#E74C3C' }}>¥{pendingAmount.toLocaleString('zh-CN')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 回款进度 */}
      <div className="pc-card" style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#2D3436', marginBottom: 16 }}>回款进度</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 14, color: '#636E72' }}>回款完成率</span>
          <span style={{ fontSize: 20, fontWeight: 700, color: '#2D3436' }}>{paymentRate}%</span>
        </div>
        <div style={{ height: 10, backgroundColor: '#F0F0F0', borderRadius: 5, overflow: 'hidden', marginBottom: 16 }}>
          <div style={{ width: `${paymentRate}%`, height: '100%', backgroundColor: '#2ECC71', borderRadius: 5 }} />
        </div>
        <div style={{ display: 'flex', gap: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#2ECC71' }} />
            <span style={{ fontSize: 12, color: '#95A5A6' }}>已回款</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#2ECC71' }}>¥{paidAmount.toLocaleString('zh-CN')}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#E74C3C' }} />
            <span style={{ fontSize: 12, color: '#95A5A6' }}>待回款</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#E74C3C' }}>¥{pendingAmount.toLocaleString('zh-CN')}</span>
          </div>
        </div>
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
          📤 导出报表
        </button>
      </div>

      {/* 工单明细 */}
      <PCCard title={`工单明细（${details.length}）`}>
        <PCTable
          columns={workOrderColumns}
          data={details}
          rowKey="id"
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
