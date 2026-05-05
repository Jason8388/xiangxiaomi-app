import React from 'react';
import '@/assets/styles/pc-global.css';
import { PCLayout } from '@/components/pc/PCLayout';
import { PCCard } from '@/components/pc/PCComponents';

const faqs = [
  { q: '如何添加新客户？', a: '在客户管理页面，点击"新增客户"按钮，填写客户基本信息后保存即可。' },
  { q: '如何绑定设备？', a: '在设备管理页面，点击"新增设备"，填写设备信息并选择对应的客户进行绑定。' },
  { q: '如何创建合同？', a: '在合同管理页面，点击"新增合同"，填写合同信息并关联对应的客户。' },
  { q: '如何处理工单？', a: '在工单管理页面，选择待处理的工单，点击"处理"按钮更新工单状态。' },
  { q: '如何上传文件？', a: '在文件管理页面，点击"上传文件"按钮，选择要上传的文件即可。' },
];

const guides = [
  { title: '快速入门', desc: '了解系统基本功能和操作流程', icon: '🚀' },
  { title: '客户管理', desc: '学习如何高效管理客户信息', icon: '👥' },
  { title: '设备管理', desc: '掌握设备绑定和维护技巧', icon: '📱' },
  { title: '合同管理', desc: '了解合同签署和管理流程', icon: '📋' },
  { title: '工单管理', desc: '处理工单任务和进度跟踪', icon: '🔧' },
  { title: '数据分析', desc: '查看业务数据和统计报表', icon: '📊' },
];

export default function PCHelp() {
  return (
    <>
      
      <PCLayout>
        <div className="pc-page-header"><h1 className="pc-page-title">帮助中心</h1><p className="pc-page-description">获取系统使用帮助和操作指南</p></div>

        {/* 操作指南 */}
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>操作指南</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 16 }}>
            {guides.map((guide, index) => (
              <div key={index} className="pc-card" style={{ cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-md)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-sm)'; }}>
                <div className="pc-card-body" style={{ textAlign: 'center', padding: 24 }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>{guide.icon}</div>
                  <div style={{ fontWeight: 500, marginBottom: 4 }}>{guide.title}</div>
                  <div style={{ fontSize: 13, color: '#999' }}>{guide.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 常见问题 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <PCCard title="常见问题">
            <div>
              {faqs.map((faq, index) => (
                <div key={index} style={{ padding: '16px 0', borderBottom: index < faqs.length - 1 ? '1px solid var(--color-border-light)' : 'none' }}>
                  <div style={{ fontWeight: 500, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: '#4F8EF7' }}>Q</span>
                    {faq.q}
                  </div>
                  <div style={{ fontSize: 13, color: '#666', paddingLeft: 20 }}>{faq.a}</div>
                </div>
              ))}
            </div>
          </PCCard>

          <div>
            <PCCard title="联系支持" style={{ marginBottom: 24 }}>
              <div className="pc-card-body">
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                  <div style={{ width: 48, height: 48, background: 'var(--color-primary-light)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>📞</div>
                  <div>
                    <div style={{ fontWeight: 500 }}>客服热线</div>
                    <div style={{ color: '#4F8EF7', fontSize: 18, fontWeight: 600 }}>400-888-8888</div>
                  </div>
                </div>
                <div style={{ fontSize: 13, color: '#999' }}>工作时间：周一至周五 9:00-18:00</div>
              </div>
            </PCCard>

            <PCCard title="意见反馈">
              <div className="pc-card-body">
                <div className="pc-form">
                  <div className="pc-form-item">
                    <label className="pc-form-label">反馈类型</label>
                    <select className="pc-form-control pc-form-select">
                      <option>功能建议</option>
                      <option>问题反馈</option>
                      <option>其他</option>
                    </select>
                  </div>
                  <div className="pc-form-item">
                    <label className="pc-form-label">反馈内容</label>
                    <textarea className="pc-form-control pc-form-textarea" rows={4} placeholder="请详细描述您的问题或建议..." />
                  </div>
                  <button className="pc-btn pc-btn-primary" style={{ marginTop: 8 }}>提交反馈</button>
                </div>
              </div>
            </PCCard>
          </div>
        </div>
      </PCLayout>
    </>
  );
}
