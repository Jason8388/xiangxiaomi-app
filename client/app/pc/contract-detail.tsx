import React, { useEffect, useState } from 'react';
import { PCLayout } from '@/components/pc/PCLayout';
import { storage } from '@/utils/storage';
import { getApiBaseUrl } from '@/utils/api';

interface Contact {
  id?: number;
  name: string;
  phone?: string;
  position?: string;
}

interface ContractDetail {
  id: number;
  contract_number: string;
  contract_name: string;
  customer_name: string;
  business_manager: string;
  sign_date: string;
  acceptance_date?: string;
  warranty_end_date?: string;
  contract_amount?: number;
  remarks?: string;
  tags?: string[];
  addresses?: string[];
  contacts?: Contact[];
  device_count: number;
  work_order_count: number;
}

export default function PCContractDetail() {
  const [contract, setContract] = useState<ContractDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(null);

  useEffect(() => {
    // 获取URL参数
    if (typeof window !== 'undefined') {
      setSearchParams(new URLSearchParams(window.location.search));
    }
  }, []);

  useEffect(() => {
    const loadContractDetail = async () => {
      if (!searchParams) return;
      const id = searchParams.get('id');
      if (!id) {
        setError('缺少合同ID参数');
        return;
      }

      try {
        setLoading(true);
        const sessionId = await storage.getItem('session_id');
        const response = await fetch(
          `${getApiBaseUrl()}/api/v1/contracts/${id}`,
          sessionId ? { headers: { 'x-session-id': sessionId } } : {}
        );
        const data = await response.json();
        if (response.ok) {
          setContract(data);
        } else {
          setError(data.message || '获取合同详情失败');
        }
      } catch (error) {
        console.error('Fetch contract detail error:', error);
        setError('网络错误，请稍后重试');
      } finally {
        setLoading(false);
      }
    };

    loadContractDetail();
  }, [searchParams]);

  const formatDate = (dateStr: string | undefined): string => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '-';
      return date.toLocaleDateString('zh-CN');
    } catch {
      return '-';
    }
  };

  const getStatusBadge = (status: string | undefined) => {
    const colors: Record<string, string> = {
      '执行中': 'bg-blue-100 text-blue-800',
      '已完成': 'bg-green-100 text-green-800',
      '已终止': 'bg-red-100 text-red-800',
      '待启动': 'bg-yellow-100 text-yellow-800',
    };
    const bgColor = colors[status || ''] || 'bg-gray-100 text-gray-800';
    return bgColor;
  };

  return (
    <PCLayout title="合同详情">
      <div className="p-6">
        {/* 返回按钮 */}
        <button
          onClick={() => window.history.back()}
          className="mb-4 px-4 py-2 text-gray-600 hover:text-gray-800 flex items-center gap-2"
        >
          <span>←</span> 返回列表
        </button>

        {loading && (
          <div className="text-center py-12 text-gray-500">加载中...</div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {contract && (
          <div className="space-y-6">
            {/* 基本信息卡片 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">基本信息</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">合同编号</label>
                  <p className="text-gray-900">{contract.contract_number}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">合同名称</label>
                  <p className="text-gray-900">{contract.contract_name}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">客户名称</label>
                  <p className="text-gray-900">{contract.customer_name}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">商务经理</label>
                  <p className="text-gray-900">{contract.business_manager}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">合同金额</label>
                  <p className="text-gray-900">
                    {contract.contract_amount ? `¥${contract.contract_amount.toLocaleString()}` : '-'}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">签订日期</label>
                  <p className="text-gray-900">{formatDate(contract.sign_date)}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">验收日期</label>
                  <p className="text-gray-900">{formatDate(contract.acceptance_date)}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">质保到期</label>
                  <p className="text-gray-900">{formatDate(contract.warranty_end_date)}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm text-gray-500">备注</label>
                  <p className="text-gray-900">{contract.remarks || '-'}</p>
                </div>
                {contract.tags && contract.tags.length > 0 && (
                  <div className="col-span-2">
                    <label className="text-sm text-gray-500">标签</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {contract.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 统计卡片 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-sm text-gray-500 mb-1">关联设备</h3>
                <p className="text-2xl font-bold text-gray-900">{contract.device_count}</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-sm text-gray-500 mb-1">关联工单</h3>
                <p className="text-2xl font-bold text-gray-900">{contract.work_order_count}</p>
              </div>
            </div>

            {/* 地址信息 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">地址信息</h2>
              {contract.addresses && contract.addresses.length > 0 ? (
                <div className="space-y-2">
                  {contract.addresses.map((addr, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded text-gray-700">
                      {addr}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">暂无地址信息</p>
              )}
            </div>

            {/* 联系人信息 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">联系人信息</h2>
              {contract.contacts && contract.contacts.length > 0 ? (
                <div className="space-y-3">
                  {contract.contacts.map((contact, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-gray-900">{contact.name}</span>
                        {contact.position && (
                          <span className="text-sm text-gray-500">{contact.position}</span>
                        )}
                        {contact.phone && (
                          <span className="text-sm text-gray-600">{contact.phone}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">暂无联系人信息</p>
              )}
            </div>
          </div>
        )}
      </div>
    </PCLayout>
  );
}
