import React, { useState } from 'react';
import { PCLayout } from '@/components/pc/PCLayout';
import { PCCard } from '@/components/pc/PCComponents';

export default function PCSettings() {
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({
    name: '管理员',
    email: 'admin@example.com',
    phone: '13800138000',
    department: '技术部',
    role: '管理员',
  });

  const tabs = [
    { key: 'profile', label: '个人信息' },
    { key: 'account', label: '账号设置' },
    { key: 'notification', label: '通知设置' },
    { key: 'security', label: '安全设置' },
  ];

  return (
    <>
      <style>{`<style>@import url('/assets/styles/pc-global.css');</style>`}</style>
      <PCLayout>
        <div className="pc-page-header"><h1 className="pc-page-title">系统设置</h1><p className="pc-page-description">管理个人信息和系统配置</p></div>

        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 24 }}>
          {/* 侧边导航 */}
          <div className="pc-card" style={{ height: 'fit-content' }}>
            <div className="pc-card-body" style={{ padding: 8 }}>
              {tabs.map(tab => (
                <div
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    padding: '12px 16px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    background: activeTab === tab.key ? 'var(--color-primary-light)' : 'transparent',
                    color: activeTab === tab.key ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                    fontWeight: activeTab === tab.key ? 500 : 400,
                    transition: 'all 0.2s',
                  }}
                >
                  {tab.label}
                </div>
              ))}
            </div>
          </div>

          {/* 内容区 */}
          <div>
            {activeTab === 'profile' && (
              <PCCard title="个人信息">
                <div className="pc-form" style={{ maxWidth: 500 }}>
                  <div className="pc-form-item">
                    <label className="pc-form-label">姓名</label>
                    <input type="text" className="pc-form-control" value={formData.name} onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} />
                  </div>
                  <div className="pc-form-item">
                    <label className="pc-form-label">邮箱</label>
                    <input type="email" className="pc-form-control" value={formData.email} onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))} />
                  </div>
                  <div className="pc-form-item">
                    <label className="pc-form-label">手机号</label>
                    <input type="tel" className="pc-form-control" value={formData.phone} onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))} />
                  </div>
                  <div className="pc-form-item">
                    <label className="pc-form-label">部门</label>
                    <input type="text" className="pc-form-control" value={formData.department} onChange={e => setFormData(prev => ({ ...prev, department: e.target.value }))} />
                  </div>
                  <div className="pc-form-item">
                    <label className="pc-form-label">角色</label>
                    <input type="text" className="pc-form-control" value={formData.role} disabled />
                  </div>
                  <div style={{ marginTop: 16 }}>
                    <button className="pc-btn pc-btn-primary">保存修改</button>
                  </div>
                </div>
              </PCCard>
            )}

            {activeTab === 'account' && (
              <PCCard title="修改密码">
                <div className="pc-form" style={{ maxWidth: 500 }}>
                  <div className="pc-form-item">
                    <label className="pc-form-label">当前密码</label>
                    <input type="password" className="pc-form-control" placeholder="请输入当前密码" />
                  </div>
                  <div className="pc-form-item">
                    <label className="pc-form-label">新密码</label>
                    <input type="password" className="pc-form-control" placeholder="请输入新密码" />
                  </div>
                  <div className="pc-form-item">
                    <label className="pc-form-label">确认密码</label>
                    <input type="password" className="pc-form-control" placeholder="请再次输入新密码" />
                  </div>
                  <div style={{ marginTop: 16 }}>
                    <button className="pc-btn pc-btn-primary">修改密码</button>
                  </div>
                </div>
              </PCCard>
            )}

            {activeTab === 'notification' && (
              <PCCard title="通知设置">
                <div style={{ maxWidth: 500 }}>
                  {[
                    { label: '工单提醒', desc: '新的售后工单时发送通知' },
                    { label: '合同到期提醒', desc: '合同到期前7天发送提醒' },
                    { label: '设备告警提醒', desc: '设备发生告警时发送通知' },
                    { label: '系统公告', desc: '接收系统公告和更新通知' },
                  ].map((item, index) => (
                    <div key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid var(--color-border-light)' }}>
                      <div>
                        <div style={{ fontWeight: 500 }}>{item.label}</div>
                        <div style={{ fontSize: 13, color: '#999' }}>{item.desc}</div>
                      </div>
                      <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24 }}>
                        <input type="checkbox" defaultChecked style={{ 'opacity': 0, width: 0, height: 0 }} />
                        <span style={{ position: 'absolute', cursor: 'pointer', inset: 0, background: '#4F8EF7', borderRadius: 12, transition: '0.3s' }} />
                        <span style={{ position: 'absolute', left: 2, top: 2, width: 20, height: 20, background: '#fff', borderRadius: '50%', transition: '0.3s' }} />
                      </label>
                    </div>
                  ))}
                </div>
              </PCCard>
            )}

            {activeTab === 'security' && (
              <PCCard title="安全设置">
                <div style={{ maxWidth: 500 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid var(--color-border-light)' }}>
                    <div>
                      <div style={{ fontWeight: 500 }}>双因素认证</div>
                      <div style={{ fontSize: 13, color: '#999' }}>启用后登录需要输入手机验证码</div>
                    </div>
                    <button className="pc-btn pc-btn-default pc-btn-sm">未启用</button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid var(--color-border-light)' }}>
                    <div>
                      <div style={{ fontWeight: 500 }}>登录日志</div>
                      <div style={{ fontSize: 13, color: '#999' }}>查看账号的登录记录</div>
                    </div>
                    <button className="pc-btn pc-btn-default pc-btn-sm">查看</button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0' }}>
                    <div>
                      <div style={{ fontWeight: 500 }}>会话管理</div>
                      <div style={{ fontSize: 13, color: '#999' }}>管理当前登录的设备</div>
                    </div>
                    <button className="pc-btn pc-btn-default pc-btn-sm">查看</button>
                  </div>
                </div>
              </PCCard>
            )}
          </div>
        </div>
      </PCLayout>
    </>
  );
}
