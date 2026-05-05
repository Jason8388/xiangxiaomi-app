'use client';

import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, Avatar, Modal, message } from 'antd';
import { UploadOutlined, LockOutlined, UserOutlined, CameraOutlined } from '@ant-design/icons';
import { storage } from '@/utils/storage';
import { getApiBaseUrl } from '@/utils/api';

interface User {
  id: number;
  username: string;
  name: string;
  role: string;
  position: string;
  phone: string;
  department_name: string;
  avatar: string | null;
  signature: string | null;
}

export default function PCAccountSettings() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // 修改密码
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  
  // 修改签名
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signature, setSignature] = useState('');
  const [savingSignature, setSavingSignature] = useState(false);
  
  // 上传头像
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    try {
      setLoading(true);
      const sessionId = await storage.getItem('session_id');
      
      if (sessionId) {
        const response = await fetch(
          `${getApiBaseUrl()}/api/v1/users/me`,
          {
            headers: {
              'Authorization': `Bearer ${sessionId}`,
            },
          }
        );
        
        if (response.ok) {
          const userInfo = await response.json();
          setUser(userInfo);
          setSignature(userInfo.signature || '');
        }
      }
    } catch (error) {
      console.error('Load user error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePickImage = async (e: any) => {
    const file = e.target.files[0];
    if (file) {
      await uploadAvatar(file);
    }
  };

  const uploadAvatar = async (file: File) => {
    try {
      setUploadingAvatar(true);
      const sessionId = await storage.getItem('session_id');
      if (!sessionId) {
        message.error('未登录');
        return;
      }

      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch(
        `${getApiBaseUrl()}/api/v1/users/me/avatar`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sessionId}`,
          },
          body: formData,
        }
      );

      const data = await response.json();
      if (response.ok) {
        setUser(prev => prev ? { ...prev, avatar: data.avatar } : null);
        message.success('头像上传成功');
        loadUserInfo();
      } else {
        message.error(data.error || '上传失败');
      }
    } catch (error) {
      console.error('Upload avatar error:', error);
      message.error('上传头像失败');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleChangePassword = async () => {
    if (!oldPassword) {
      message.error('请输入原密码');
      return;
    }
    if (!newPassword) {
      message.error('请输入新密码');
      return;
    }
    if (newPassword.length < 6) {
      message.error('新密码长度不能少于6位');
      return;
    }
    if (newPassword !== confirmPassword) {
      message.error('两次输入的新密码不一致');
      return;
    }

    try {
      setSavingPassword(true);
      const sessionId = await storage.getItem('session_id');
      if (!sessionId) {
        message.error('未登录');
        return;
      }

      const response = await fetch(
        `${getApiBaseUrl()}/api/v1/users/me`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionId}`,
          },
          body: JSON.stringify({
            old_password: oldPassword,
            new_password: newPassword,
          }),
        }
      );

      const data = await response.json();
      if (response.ok) {
        message.success('密码修改成功');
        setShowPasswordModal(false);
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        message.error(data.error || '修改失败');
      }
    } catch (error) {
      console.error('Change password error:', error);
      message.error('修改密码失败');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleSaveSignature = async () => {
    if (signature.length > 100) {
      message.error('签名长度不能超过100个字符');
      return;
    }

    try {
      setSavingSignature(true);
      const sessionId = await storage.getItem('session_id');
      if (!sessionId) {
        message.error('未登录');
        return;
      }

      const response = await fetch(
        `${getApiBaseUrl()}/api/v1/users/me`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionId}`,
          },
          body: JSON.stringify({ signature }),
        }
      );

      const data = await response.json();
      if (response.ok) {
        setUser(prev => prev ? { ...prev, signature } : null);
        setShowSignatureModal(false);
        message.success('签名保存成功');
        loadUserInfo();
      } else {
        message.error(data.error || '保存失败');
      }
    } catch (error) {
      console.error('Save signature error:', error);
      message.error('保存签名失败');
    } finally {
      setSavingSignature(false);
    }
  };

  if (loading) {
    return (
      <div className="pc-container">
        <div className="pc-loading">加载中...</div>
      </div>
    );
  }

  return (
    <div className="pc-container">
      <div className="pc-header">
        <h1 className="pc-title">账号设置</h1>
      </div>

      <div className="pc-content">
        {/* 头像区域 */}
        <div className="pc-card" style={{ marginBottom: 24 }}>
          <div className="pc-avatar-section">
            <div className="pc-avatar-wrapper">
              {user?.avatar ? (
                <img src={user.avatar} alt="头像" className="pc-avatar-img" />
              ) : (
                <div className="pc-avatar-placeholder">
                  <UserOutlined style={{ fontSize: 48, color: '#B2BEC3' }} />
                </div>
              )}
              <label className="pc-avatar-overlay">
                <CameraOutlined style={{ fontSize: 20, color: '#FFF' }} />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePickImage}
                  style={{ display: 'none' }}
                  disabled={uploadingAvatar}
                />
              </label>
            </div>
            <Text className="pc-avatar-hint">点击更换头像</Text>
          </div>
        </div>

        {/* 用户信息 */}
        <div className="pc-card" style={{ marginBottom: 24 }}>
          <h3 className="pc-card-title">基本信息</h3>
          <div className="pc-info-grid">
            <div className="pc-info-item">
              <span className="pc-info-label">用户名</span>
              <span className="pc-info-value">{user?.username}</span>
            </div>
            <div className="pc-info-item">
              <span className="pc-info-label">姓名</span>
              <span className="pc-info-value">{user?.name}</span>
            </div>
            <div className="pc-info-item">
              <span className="pc-info-label">岗位</span>
              <span className="pc-info-value">{user?.position || '-'}</span>
            </div>
            <div className="pc-info-item">
              <span className="pc-info-label">部门</span>
              <span className="pc-info-value">{user?.department_name || '-'}</span>
            </div>
            <div className="pc-info-item">
              <span className="pc-info-label">手机号</span>
              <span className="pc-info-value">{user?.phone || '-'}</span>
            </div>
          </div>
        </div>

        {/* 个人签名 */}
        <div className="pc-card" style={{ marginBottom: 24 }}>
          <h3 className="pc-card-title">个人签名</h3>
          <div className="pc-signature-row">
            <span className="pc-signature-value">{user?.signature || '未设置'}</span>
            <Button
              type="primary"
              onClick={() => {
                setSignature(user?.signature || '');
                setShowSignatureModal(true);
              }}
            >
              编辑签名
            </Button>
          </div>
        </div>

        {/* 安全设置 */}
        <div className="pc-card">
          <h3 className="pc-card-title">安全设置</h3>
          <Button
            type="primary"
            icon={<LockOutlined />}
            onClick={() => setShowPasswordModal(true)}
          >
            修改密码
          </Button>
        </div>
      </div>

      {/* 修改密码弹窗 */}
      <Modal
        title="修改密码"
        open={showPasswordModal}
        onCancel={() => setShowPasswordModal(false)}
        onOk={handleChangePassword}
        confirmLoading={savingPassword}
        okText="确认"
        cancelText="取消"
      >
        <div style={{ marginBottom: 16 }}>
          <Text style={{ display: 'block', marginBottom: 8 }}>原密码</Text>
          <Input.Password
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            placeholder="请输入原密码"
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <Text style={{ display: 'block', marginBottom: 8 }}>新密码</Text>
          <Input.Password
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="请输入新密码（至少6位）"
          />
        </div>
        <div>
          <Text style={{ display: 'block', marginBottom: 8 }}>确认新密码</Text>
          <Input.Password
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="请再次输入新密码"
          />
        </div>
      </Modal>

      {/* 修改签名弹窗 */}
      <Modal
        title="编辑签名"
        open={showSignatureModal}
        onCancel={() => setShowSignatureModal(false)}
        onOk={handleSaveSignature}
        confirmLoading={savingSignature}
        okText="保存"
        cancelText="取消"
      >
        <div>
          <Text style={{ display: 'block', marginBottom: 8 }}>个人签名</Text>
          <TextInput
            value={signature}
            onChange={(e) => setSignature(e.target.value)}
            placeholder="请输入个人签名（不超过100字符）"
            maxLength={100}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d9d9d9',
              borderRadius: 4,
            }}
          />
          <Text style={{ color: '#999', fontSize: 12, marginTop: 4 }}>
            {signature.length}/100
          </Text>
        </div>
      </Modal>

      <style>{`
        .pc-container {
          padding: 24px;
          max-width: 800px;
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
          padding: 24px;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
        .pc-card-title {
          font-size: 16px;
          font-weight: 500;
          color: #333;
          margin: 0 0 20px 0;
          padding-bottom: 12px;
          border-bottom: 1px solid #f0f0f0;
        }
        .pc-avatar-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 20px;
        }
        .pc-avatar-wrapper {
          position: relative;
          width: 120px;
          height: 120px;
          margin-bottom: 16px;
        }
        .pc-avatar-img {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          object-fit: cover;
        }
        .pc-avatar-placeholder {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          background: #f5f5f5;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .pc-avatar-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          opacity: 0;
          transition: opacity 0.3s;
        }
        .pc-avatar-wrapper:hover .pc-avatar-overlay {
          opacity: 1;
        }
        .pc-avatar-hint {
          color: #666;
          font-size: 14px;
        }
        .pc-info-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }
        .pc-info-item {
          display: flex;
          padding: 12px;
          background: #fafafa;
          border-radius: 4px;
        }
        .pc-info-label {
          width: 80px;
          color: #666;
          font-size: 14px;
        }
        .pc-info-value {
          flex: 1;
          color: #333;
          font-size: 14px;
        }
        .pc-signature-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .pc-signature-value {
          flex: 1;
          color: #333;
          font-size: 14px;
          margin-right: 16px;
        }
        .pc-loading {
          text-align: center;
          padding: 40px;
          color: #666;
        }
      `}</style>
    </div>
  );
}
