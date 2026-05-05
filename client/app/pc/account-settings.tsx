import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Image,
  Platform,
  Alert,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { router } from 'expo-router';
import { storage } from '@/utils/storage';
import { PCLayout } from '@/components/pc/PCLayout';

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

const API_BASE = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || 'http://localhost:9091';

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

  useEffect(() => {
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    try {
      setLoading(true);
      const sessionId = await storage.getItem('session_id');
      
      if (!sessionId) {
        router.replace('/pc/login');
        return;
      }
      
      const response = await fetch(`${API_BASE}/api/v1/users/me`, {
        headers: {
          'Authorization': `Bearer ${sessionId}`,
        },
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setSignature(userData.signature || '');
      } else if (response.status === 401) {
        Alert.alert('提示', '登录已过期，请重新登录');
        router.replace('/pc/login');
      } else {
        // 使用本地缓存
        const userStr = await storage.getItem('user');
        if (userStr) {
          const userData = JSON.parse(userStr);
          setUser(userData);
          setSignature(userData.signature || '');
        }
      }
    } catch (error) {
      console.error('Load user error:', error);
      Alert.alert('错误', '加载用户信息失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async (e: any) => {
        const file = e.target.files[0];
        if (file) {
          await uploadAvatar(file);
        }
      };
      input.click();
    } else {
      Alert.alert('提示', '请使用APP端更换头像');
    }
  };

  const uploadAvatar = async (file: File) => {
    try {
      const sessionId = await storage.getItem('session_id');
      if (!sessionId) {
        Alert.alert('错误', '未登录');
        return;
      }
      
      const formData = new FormData();
      formData.append('avatar', file);
      
      const response = await fetch(`${API_BASE}/api/v1/users/me/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionId}`,
        },
        body: formData,
      });
      
      const data = await response.json();
      if (response.ok) {
        setUser(prev => prev ? { ...prev, avatar: data.avatar } : null);
        await storage.setItem('user', JSON.stringify({ ...user, avatar: data.avatar }));
        Alert.alert('成功', '头像上传成功');
      } else {
        Alert.alert('错误', data.error || '上传失败');
      }
    } catch (error) {
      console.error('Upload avatar error:', error);
      Alert.alert('错误', '上传头像失败');
    }
  };

  const handleChangePassword = async () => {
    if (!oldPassword) {
      Alert.alert('错误', '请输入原密码');
      return;
    }
    if (!newPassword) {
      Alert.alert('错误', '请输入新密码');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('错误', '新密码长度不能少于6位');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('错误', '两次输入的新密码不一致');
      return;
    }

    try {
      setSavingPassword(true);
      const sessionId = await storage.getItem('session_id');
      if (!sessionId) {
        Alert.alert('错误', '未登录');
        return;
      }

      const response = await fetch(`${API_BASE}/api/v1/users/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionId}`,
        },
        body: JSON.stringify({
          old_password: oldPassword,
          new_password: newPassword,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        Alert.alert('成功', '密码修改成功');
        setShowPasswordModal(false);
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        Alert.alert('错误', data.error || '修改失败');
      }
    } catch (error) {
      console.error('Change password error:', error);
      Alert.alert('错误', '修改密码失败');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleSaveSignature = async () => {
    if (signature.length > 100) {
      Alert.alert('错误', '签名长度不能超过100个字符');
      return;
    }

    try {
      setSavingSignature(true);
      const sessionId = await storage.getItem('session_id');
      if (!sessionId) {
        Alert.alert('错误', '未登录');
        return;
      }

      const response = await fetch(`${API_BASE}/api/v1/users/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionId}`,
        },
        body: JSON.stringify({ signature }),
      });

      const data = await response.json();
      if (response.ok) {
        setUser(prev => prev ? { ...prev, signature } : null);
        await storage.setItem('user', JSON.stringify({ ...user, signature }));
        setShowSignatureModal(false);
        Alert.alert('成功', '签名保存成功');
      } else {
        Alert.alert('错误', data.error || '保存失败');
      }
    } catch (error) {
      console.error('Save signature error:', error);
      Alert.alert('错误', '保存签名失败');
    } finally {
      setSavingSignature(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      '确认退出',
      '确定要退出登录吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          style: 'destructive',
          onPress: async () => {
            await storage.setItem('user', '');
            await storage.setItem('session_id', '');
            router.replace('/pc/login');
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    );
  }

  return (
    <PCLayout title="账号管理" activePath="/account-settings">
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* 头像区域 */}
        <View style={styles.avatarSection}>
          <TouchableOpacity 
            style={styles.avatarContainer}
            onPress={handleAvatarChange}
          >
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <FontAwesome6 name="user" size={50} color="#B2BEC3" />
              </View>
            )}
            <View style={styles.avatarOverlay}>
              <FontAwesome6 name="camera" size={20} color="#FFF" />
            </View>
          </TouchableOpacity>
          <Text style={styles.avatarHint}>点击更换头像</Text>
        </View>

        {/* 用户信息 */}
        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>用户名</Text>
              <Text style={styles.infoValue}>{user?.username || '-'}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>姓名</Text>
              <Text style={styles.infoValue}>{user?.name || '-'}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>角色</Text>
              <Text style={styles.infoValue}>{user?.role || '-'}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>岗位</Text>
              <Text style={styles.infoValue}>{user?.position || '-'}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>手机号</Text>
              <Text style={styles.infoValue}>{user?.phone || '-'}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>部门</Text>
              <Text style={styles.infoValue}>{user?.department_name || '-'}</Text>
            </View>
          </View>
        </View>

        {/* 个人签名 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>个人签名</Text>
          <TouchableOpacity 
            style={styles.signatureCard}
            onPress={() => setShowSignatureModal(true)}
          >
            <Text style={styles.signatureText}>
              {signature || '点击添加个人签名'}
            </Text>
            <FontAwesome6 name="edit" size={16} color="#1890FF" />
          </TouchableOpacity>
        </View>

        {/* 操作按钮 */}
        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setShowPasswordModal(true)}
          >
            <FontAwesome6 name="lock" size={18} color="#1890FF" />
            <Text style={styles.actionButtonText}>修改密码</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.logoutButton]}
            onPress={handleLogout}
          >
            <FontAwesome6 name="sign-out-alt" size={18} color="#E74C3C" />
            <Text style={[styles.actionButtonText, styles.logoutText]}>退出登录</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* 修改密码弹窗 */}
      {showPasswordModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>修改密码</Text>
              <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
                <FontAwesome6 name="times" size={20} color="#666" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>原密码</Text>
              <TextInput
                style={styles.input}
                placeholder="请输入原密码"
                secureTextEntry
                value={oldPassword}
                onChangeText={setOldPassword}
              />
              <Text style={styles.inputLabel}>新密码</Text>
              <TextInput
                style={styles.input}
                placeholder="请输入新密码"
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
              />
              <Text style={styles.inputLabel}>确认新密码</Text>
              <TextInput
                style={styles.input}
                placeholder="请再次输入新密码"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </View>
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowPasswordModal(false)}
              >
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.confirmButton}
                onPress={handleChangePassword}
                disabled={savingPassword}
              >
                <Text style={styles.confirmButtonText}>
                  {savingPassword ? '保存中...' : '保存'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* 修改签名弹窗 */}
      {showSignatureModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>个人签名</Text>
              <TouchableOpacity onPress={() => setShowSignatureModal(false)}>
                <FontAwesome6 name="times" size={20} color="#666" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <TextInput
                style={[styles.input, styles.signatureInput]}
                placeholder="请输入个人签名（最多100字）"
                value={signature}
                onChangeText={setSignature}
                maxLength={100}
                multiline
                numberOfLines={4}
              />
              <Text style={styles.charCount}>{signature.length}/100</Text>
            </View>
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowSignatureModal(false)}
              >
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.confirmButton}
                onPress={handleSaveSignature}
                disabled={savingSignature}
              >
                <Text style={styles.confirmButtonText}>
                  {savingSignature ? '保存中...' : '保存'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
      </ScrollView>
    </PCLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  headerRight: {
    width: 34,
  },
  content: {
    flex: 1,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: '#FFF',
    marginBottom: 12,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 50,
  },
  avatarOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 30,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarHint: {
    marginTop: 12,
    fontSize: 14,
    color: '#1890FF',
  },
  infoSection: {
    padding: 12,
  },
  infoCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
  },
  infoLabel: {
    fontSize: 15,
    color: '#666',
  },
  infoValue: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  section: {
    padding: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  signatureCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
  },
  signatureText: {
    flex: 1,
    fontSize: 15,
    color: '#333',
  },
  actions: {
    padding: 12,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 16,
    color: '#1890FF',
  },
  logoutButton: {
    marginTop: 0,
  },
  logoutText: {
    color: '#E74C3C',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalBody: {
    padding: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 16,
  },
  signatureInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: -10,
    marginBottom: 8,
  },
  modalFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#E8E8E8',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    color: '#1890FF',
    fontWeight: '600',
  },
});
