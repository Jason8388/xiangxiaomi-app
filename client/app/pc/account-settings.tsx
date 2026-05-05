'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView, Modal, Platform, Image } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { PCLayout } from '@/components/pc/PCLayout';
import { storage } from '@/utils/storage';

export default function PCAccountSettings() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [signature, setSignature] = useState('');
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [newSignature, setNewSignature] = useState('');
  const [savingSignature, setSavingSignature] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const loadUserInfo = useCallback(async () => {
    try {
      setLoading(true);
      const sessionId = await storage.getItem('session_id');
      if (!sessionId) {
        Alert.alert('提示', '请先登录', [
          { text: '确定', onPress: () => router.push('/pc/login') }
        ]);
        return;
      }

      const res = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/users/me`, {
        headers: { Authorization: `Bearer ${sessionId}` },
      });
      const data = await res.json();
      if (data.code === 200 || data.code === 0) {
        setUser(data.data);
        setAvatar(data.data.avatar || null);
        setSignature(data.data.signature || '');
      }
    } catch (err) {
      console.error('Failed to load user info:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUserInfo();
  }, [loadUserInfo]);

  const handleAvatarPick = () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async (e: any) => {
        const file = e.target.files?.[0];
        if (file) {
          const formData = new FormData();
          formData.append('file', file);
          try {
            const sessionId = await storage.getItem('session_id');
            const res = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/users/avatar`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${sessionId}` },
              body: formData,
            });
            const data = await res.json();
            if (data.code === 200 || data.code === 0) {
              setAvatar(data.url || data.data?.url);
              Alert.alert('成功', '头像已更新');
            } else {
              Alert.alert('错误', data.message || '上传失败');
            }
          } catch (err) {
            Alert.alert('错误', '上传失败');
          }
        }
      };
      input.click();
    } else {
      Alert.alert('提示', '请在APP端更换头像');
    }
  };

  const handleSaveSignature = async () => {
    if (!newSignature.trim()) {
      Alert.alert('提示', '请输入个人签名');
      return;
    }
    setSavingSignature(true);
    try {
      const sessionId = await storage.getItem('session_id');
      const res = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/users/signature`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sessionId}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ signature: newSignature }),
      });
      const data = await res.json();
      if (data.code === 200 || data.code === 0) {
        setSignature(newSignature);
        setShowSignatureModal(false);
        Alert.alert('成功', '个人签名已更新');
      } else {
        Alert.alert('错误', data.message || '保存失败');
      }
    } catch (err) {
      Alert.alert('错误', '保存失败');
    } finally {
      setSavingSignature(false);
    }
  };

  const handleChangePassword = async () => {
    if (!oldPassword) {
      Alert.alert('提示', '请输入原密码');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      Alert.alert('提示', '新密码至少6位');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('提示', '两次密码不一致');
      return;
    }
    setSavingPassword(true);
    try {
      const sessionId = await storage.getItem('session_id');
      const res = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/users/password`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sessionId}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      const data = await res.json();
      if (data.code === 200 || data.code === 0) {
        setShowPasswordModal(false);
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        Alert.alert('成功', '密码已修改');
      } else {
        Alert.alert('错误', data.message || '修改失败');
      }
    } catch (err) {
      Alert.alert('错误', '修改失败');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('确认', '确定要退出登录吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '确定',
        style: 'destructive',
        onPress: async () => {
          await storage.removeItem('session_id');
          await storage.removeItem('user');
          router.push('/pc/login');
        },
      },
    ]);
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
        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>头像</Text>
            <TouchableOpacity style={styles.avatarSection} onPress={handleAvatarPick}>
              {avatar ? (
                <Image source={{ uri: avatar }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <FontAwesome6 name="user" size={40} color="#CCC" />
                </View>
              )}
              <Text style={styles.avatarHint}>点击更换头像</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>基本信息</Text>
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
                <Text style={styles.infoValue}>{user?.department || '-'}</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>个人签名</Text>
            <TouchableOpacity style={styles.signatureCard} onPress={() => {
              setNewSignature(signature);
              setShowSignatureModal(true);
            }}>
              <Text style={styles.signatureText}>{signature || '点击添加个人签名'}</Text>
              <FontAwesome6 name="chevron-right" size={16} color="#999" />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <TouchableOpacity style={styles.actionCard} onPress={() => setShowPasswordModal(true)}>
              <View style={styles.actionLeft}>
                <FontAwesome6 name="lock" size={20} color="#1E88E5" />
                <Text style={styles.actionText}>修改密码</Text>
              </View>
              <FontAwesome6 name="chevron-right" size={16} color="#999" />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <TouchableOpacity style={[styles.actionCard, styles.logoutCard]} onPress={handleLogout}>
              <View style={styles.actionLeft}>
                <FontAwesome6 name="sign-out-alt" size={20} color="#E74C3C" />
                <Text style={[styles.actionText, styles.logoutText]}>退出登录</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <Modal visible={showSignatureModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>编辑个人签名</Text>
              <TouchableOpacity onPress={() => setShowSignatureModal(false)}>
                <FontAwesome6 name="times" size={20} color="#666" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <TextInput
                style={styles.signatureInput}
                value={newSignature}
                onChangeText={setNewSignature}
                placeholder="请输入个人签名"
                maxLength={100}
                multiline
                numberOfLines={4}
              />
              <Text style={styles.charCount}>{newSignature.length}/100</Text>
            </View>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowSignatureModal(false)}>
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmButton} onPress={handleSaveSignature} disabled={savingSignature}>
                <Text style={styles.confirmButtonText}>{savingSignature ? '保存中...' : '保存'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showPasswordModal} transparent animationType="fade">
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
                value={oldPassword}
                onChangeText={setOldPassword}
                placeholder="请输入原密码"
                secureTextEntry
              />
              <Text style={styles.inputLabel}>新密码</Text>
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="请输入新密码（至少6位）"
                secureTextEntry
              />
              <Text style={styles.inputLabel}>确认新密码</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="请再次输入新密码"
                secureTextEntry
              />
            </View>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowPasswordModal(false)}>
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmButton} onPress={handleChangePassword} disabled={savingPassword}>
                <Text style={styles.confirmButtonText}>{savingPassword ? '保存中...' : '保存'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </PCLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F7FA' },
  loadingText: { fontSize: 16, color: '#666' },
  content: { padding: 16 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 14, color: '#666', marginBottom: 8, fontWeight: '500' },
  avatarSection: { backgroundColor: '#FFF', borderRadius: 12, padding: 20, alignItems: 'center' },
  avatar: { width: 80, height: 80, borderRadius: 40 },
  avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center' },
  avatarHint: { marginTop: 8, fontSize: 12, color: '#999' },
  infoCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 16 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12 },
  infoLabel: { fontSize: 15, color: '#666' },
  infoValue: { fontSize: 15, color: '#333', fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#F0F0F0' },
  signatureCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  signatureText: { fontSize: 15, color: '#333', flex: 1 },
  actionCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  actionLeft: { flexDirection: 'row', alignItems: 'center' },
  actionText: { fontSize: 15, color: '#333', marginLeft: 12 },
  logoutCard: { marginTop: 0 },
  logoutText: { color: '#E74C3C' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modal: { backgroundColor: '#FFF', borderRadius: 16, width: '100%', maxWidth: 400 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  modalTitle: { fontSize: 17, fontWeight: '600', color: '#333' },
  modalBody: { padding: 16 },
  inputLabel: { fontSize: 14, color: '#666', marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, padding: 12, fontSize: 15 },
  signatureInput: { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, padding: 12, fontSize: 15, minHeight: 100, textAlignVertical: 'top' },
  charCount: { textAlign: 'right', fontSize: 12, color: '#999', marginTop: 4 },
  modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', padding: 16, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  cancelButton: { paddingHorizontal: 20, paddingVertical: 10, marginRight: 12 },
  cancelButtonText: { fontSize: 15, color: '#666' },
  confirmButton: { backgroundColor: '#1E88E5', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  confirmButtonText: { fontSize: 15, color: '#FFF', fontWeight: '500' },
});
