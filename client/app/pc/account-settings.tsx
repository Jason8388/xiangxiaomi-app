'use client';

import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert, ActivityIndicator, Platform, Modal as RNModal, ScrollView } from 'react-native';
import { storage } from '@/utils/storage';
import { getApiBaseUrl } from '@/utils/api';
import '@/assets/styles/pc-global.css';

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
            headers: { Authorization: `Bearer ${sessionId}` }
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          setUser(data.user || data);
          setSignature(data.user?.signature || data.signature || '');
        }
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      showAlert('请填写所有密码字段');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      showAlert('两次输入的密码不一致');
      return;
    }
    
    if (newPassword.length < 6) {
      showAlert('新密码长度不能少于6位');
      return;
    }

    setSavingPassword(true);
    
    try {
      const sessionId = await storage.getItem('session_id');
      const response = await fetch(
        `${getApiBaseUrl()}/api/v1/users/password`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${sessionId}`
          },
          body: JSON.stringify({
            old_password: oldPassword,
            new_password: newPassword
          })
        }
      );
      
      const data = await response.json();
      
      if (response.ok) {
        showAlert('密码修改成功');
        setShowPasswordModal(false);
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        showAlert(data.error || '密码修改失败');
      }
    } catch (error) {
      showAlert('密码修改失败，请稍后重试');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleUpdateSignature = async () => {
    setSavingSignature(true);
    
    try {
      const sessionId = await storage.getItem('session_id');
      const response = await fetch(
        `${getApiBaseUrl()}/api/v1/users/signature`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${sessionId}`
          },
          body: JSON.stringify({ signature })
        }
      );
      
      const data = await response.json();
      
      if (response.ok) {
        showAlert('签名修改成功');
        setShowSignatureModal(false);
        loadUserInfo();
      } else {
        showAlert(data.error || '签名修改失败');
      }
    } catch (error) {
      showAlert('签名修改失败，请稍后重试');
    } finally {
      setSavingSignature(false);
    }
  };

  const handleAvatarUpload = () => {
    showAlert('头像上传功能需要选择图片文件');
  };

  const showAlert = (msg: string) => {
    if (Platform.OS === 'web') {
      alert(msg);
    } else {
      Alert.alert('提示', msg);
    }
  };

  if (loading) {
    return (
      <div className="pc-page-container">
        <div className="pc-page-loading">
          <ActivityIndicator size="large" color="#1677ff" />
          <Text style={{ marginTop: 16 }}>加载中...</Text>
        </div>
      </div>
    );
  }

  return (
    <div className="pc-page-container">
      <div className="pc-page-header">
        <h1 className="pc-page-title">账号设置</h1>
      </div>
      
      <div className="pc-settings-content">
        {/* 头像区域 */}
        <div className="pc-settings-section">
          <h3 className="pc-settings-section-title">头像设置</h3>
          <div className="pc-avatar-section">
            <div className="pc-avatar-large">
              {user?.avatar ? (
                <Image source={{ uri: user.avatar }} style={{ width: 100, height: 100, borderRadius: 50 }} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>{user?.name?.charAt(0) || '用户'}</Text>
                </View>
              )}
            </div>
            <div className="pc-avatar-info">
              <TouchableOpacity className="pc-btn pc-btn-default" onPress={handleAvatarUpload}>
                <Text>更换头像</Text>
              </TouchableOpacity>
              <Text className="pc-text-muted">支持 JPG、PNG 格式，文件小于 5MB</Text>
            </div>
          </div>
        </div>

        {/* 基本信息 */}
        <div className="pc-settings-section">
          <h3 className="pc-settings-section-title">基本信息</h3>
          <div className="pc-info-grid">
            <div className="pc-info-item">
              <Text className="pc-info-label">用户名</Text>
              <Text className="pc-info-value">{user?.username || '-'}</Text>
            </div>
            <div className="pc-info-item">
              <Text className="pc-info-label">姓名</Text>
              <Text className="pc-info-value">{user?.name || '-'}</Text>
            </div>
            <div className="pc-info-item">
              <Text className="pc-info-label">岗位</Text>
              <Text className="pc-info-value">{user?.position || '-'}</Text>
            </div>
            <div className="pc-info-item">
              <Text className="pc-info-label">部门</Text>
              <Text className="pc-info-value">{user?.department_name || '-'}</Text>
            </div>
            <div className="pc-info-item">
              <Text className="pc-info-label">手机号</Text>
              <Text className="pc-info-value">{user?.phone || '-'}</Text>
            </div>
          </div>
        </div>

        {/* 个人签名 */}
        <div className="pc-settings-section">
          <h3 className="pc-settings-section-title">个人签名</h3>
          <div className="pc-signature-display">
            <Text className="pc-signature-text">{user?.signature || '暂无签名'}</Text>
            <TouchableOpacity className="pc-btn pc-btn-text" onPress={() => setShowSignatureModal(true)}>
              <Text>编辑</Text>
            </TouchableOpacity>
          </div>
        </div>

        {/* 账号安全 */}
        <div className="pc-settings-section">
          <h3 className="pc-settings-section-title">账号安全</h3>
          <TouchableOpacity className="pc-security-item" onPress={() => setShowPasswordModal(true)}>
            <View>
              <Text className="pc-security-title">登录密码</Text>
              <Text className="pc-security-desc">定期修改密码可以提高账号安全性</Text>
            </View>
            <Text className="pc-security-arrow">&gt;</Text>
          </TouchableOpacity>
        </div>
      </div>

      {/* 修改密码弹窗 */}
      <RNModal visible={showPasswordModal} transparent animationType="fade" onRequestClose={() => setShowPasswordModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>修改密码</Text>
            
            <View style={styles.formItem}>
              <Text style={styles.formLabel}>原密码</Text>
              <TextInput
                style={styles.formInput}
                placeholder="请输入原密码"
                secureTextEntry
                value={oldPassword}
                onChangeText={setOldPassword}
              />
            </View>
            
            <View style={styles.formItem}>
              <Text style={styles.formLabel}>新密码</Text>
              <TextInput
                style={styles.formInput}
                placeholder="请输入新密码"
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
              />
            </View>
            
            <View style={styles.formItem}>
              <Text style={styles.formLabel}>确认密码</Text>
              <TextInput
                style={styles.formInput}
                placeholder="请再次输入新密码"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setShowPasswordModal(false)}>
                <Text>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.confirmBtn]} onPress={handleUpdatePassword} disabled={savingPassword}>
                <Text style={styles.confirmBtnText}>{savingPassword ? '保存中...' : '保存'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </RNModal>

      {/* 修改签名弹窗 */}
      <RNModal visible={showSignatureModal} transparent animationType="fade" onRequestClose={() => setShowSignatureModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>编辑签名</Text>
            
            <View style={styles.formItem}>
              <TextInput
                style={[styles.formInput, styles.textArea]}
                placeholder="请输入个人签名"
                multiline
                numberOfLines={4}
                value={signature}
                onChangeText={setSignature}
              />
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setShowSignatureModal(false)}>
                <Text>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.confirmBtn]} onPress={handleUpdateSignature} disabled={savingSignature}>
                <Text style={styles.confirmBtnText}>{savingSignature ? '保存中...' : '保存'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </RNModal>
    </div>
  );
}

const styles = StyleSheet.create({
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1677ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 40,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 24,
    width: 400,
    maxWidth: '90%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  formItem: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#d9d9d9',
    borderRadius: 4,
    padding: 10,
    fontSize: 14,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 24,
  },
  modalBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 4,
    marginLeft: 12,
  },
  cancelBtn: {
    backgroundColor: '#f5f5f5',
  },
  confirmBtn: {
    backgroundColor: '#1677ff',
  },
  confirmBtnText: {
    color: '#fff',
  },
});
