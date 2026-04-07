import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  Modal,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';
import { Screen } from '@/components/Screen';
import { PageHeader } from '@/components/PageHeader';
import { FontAwesome6 } from '@expo/vector-icons';

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

export default function AccountSettingsScreen() {
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
      const userStr = await SecureStore.getItemAsync('user');
      const sessionStr = await SecureStore.getItemAsync('session');
      
      if (userStr && sessionStr) {
        const userData = JSON.parse(userStr);
        const sessionData = JSON.parse(sessionStr);
        
        // 获取最新用户信息
        const response = await fetch(
          `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/users/me`,
          {
            headers: {
              'Authorization': `Bearer ${sessionData.session_id}`,
            },
          }
        );
        
        if (response.ok) {
          const userInfo = await response.json();
          setUser(userInfo);
          setSignature(userInfo.signature || '');
          // 同步更新本地存储
          await SecureStore.setItemAsync('user', JSON.stringify(userInfo));
        } else {
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

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('权限不足', '需要相册权限才能选择头像');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadAvatar(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Pick image error:', error);
      Alert.alert('错误', '选择图片失败');
    }
  };

  const uploadAvatar = async (uri: string) => {
    try {
      setUploadingAvatar(true);
      const sessionStr = await SecureStore.getItemAsync('session');
      if (!sessionStr) {
        Alert.alert('错误', '未登录');
        return;
      }
      const sessionData = JSON.parse(sessionStr);

      // 创建 FormData
      const formData = new FormData();
      const filename = uri.split('/').pop() || 'avatar.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
      
      formData.append('avatar', {
        uri,
        name: filename,
        type,
      } as any);

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/users/me/avatar`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sessionData.session_id}`,
            'Content-Type': 'multipart/form-data',
          },
          body: formData,
        }
      );

      const data = await response.json();
      if (response.ok) {
        // 更新本地用户信息
        setUser(prev => prev ? { ...prev, avatar: data.avatar } : null);
        await SecureStore.setItemAsync('user', JSON.stringify({ ...user, avatar: data.avatar }));
        Alert.alert('成功', '头像上传成功');
      } else {
        Alert.alert('错误', data.error || '上传失败');
      }
    } catch (error) {
      console.error('Upload avatar error:', error);
      Alert.alert('错误', '上传头像失败');
    } finally {
      setUploadingAvatar(false);
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
      const sessionStr = await SecureStore.getItemAsync('session');
      if (!sessionStr) {
        Alert.alert('错误', '未登录');
        return;
      }
      const sessionData = JSON.parse(sessionStr);

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/users/me`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionData.session_id}`,
          },
          body: JSON.stringify({
            old_password: oldPassword,
            new_password: newPassword,
          }),
        }
      );

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
      const sessionStr = await SecureStore.getItemAsync('session');
      if (!sessionStr) {
        Alert.alert('错误', '未登录');
        return;
      }
      const sessionData = JSON.parse(sessionStr);

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/users/me`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionData.session_id}`,
          },
          body: JSON.stringify({ signature }),
        }
      );

      const data = await response.json();
      if (response.ok) {
        setUser(prev => prev ? { ...prev, signature } : null);
        await SecureStore.setItemAsync('user', JSON.stringify({ ...user, signature }));
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

  if (loading) {
    return (
      <Screen>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <PageHeader title="账户设置" showHome />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* 头像区域 */}
        <View style={styles.avatarSection}>
          <TouchableOpacity 
            style={styles.avatarContainer}
            onPress={handlePickImage}
            disabled={uploadingAvatar}
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
              <Text style={styles.infoValue}>{user?.username}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>姓名</Text>
              <Text style={styles.infoValue}>{user?.name}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>岗位</Text>
              <Text style={styles.infoValue}>{user?.position || '-'}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>部门</Text>
              <Text style={styles.infoValue}>{user?.department_name || '-'}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>手机号</Text>
              <Text style={styles.infoValue}>{user?.phone || '-'}</Text>
            </View>
          </View>
        </View>

        {/* 个人签名 */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => {
              setSignature(user?.signature || '');
              setShowSignatureModal(true);
            }}
          >
            <View style={styles.menuItemLeft}>
              <FontAwesome6 name="signature" size={20} color="#1E88E5" />
              <Text style={styles.menuItemText}>个人签名</Text>
            </View>
            <View style={styles.menuItemRight}>
              <Text style={styles.menuItemValue} numberOfLines={1}>
                {user?.signature || '未设置'}
              </Text>
              <FontAwesome6 name="chevron-right" size={14} color="#B2BEC3" />
            </View>
          </TouchableOpacity>
        </View>

        {/* 安全设置 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>安全设置</Text>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => setShowPasswordModal(true)}
          >
            <View style={styles.menuItemLeft}>
              <FontAwesome6 name="lock" size={20} color="#1E88E5" />
              <Text style={styles.menuItemText}>修改密码</Text>
            </View>
            <FontAwesome6 name="chevron-right" size={14} color="#B2BEC3" />
          </TouchableOpacity>
        </View>

        {/* 底部留白 */}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* 修改密码弹窗 */}
      <Modal
        visible={showPasswordModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPasswordModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>修改密码</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>原密码</Text>
              <TextInput
                style={styles.input}
                value={oldPassword}
                onChangeText={setOldPassword}
                placeholder="请输入原密码"
                secureTextEntry
                placeholderTextColor="#B2BEC3"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>新密码</Text>
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="请输入新密码（至少6位）"
                secureTextEntry
                placeholderTextColor="#B2BEC3"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>确认新密码</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="请再次输入新密码"
                secureTextEntry
                placeholderTextColor="#B2BEC3"
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowPasswordModal(false)}
              >
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleChangePassword}
                disabled={savingPassword}
              >
                <Text style={styles.submitButtonText}>
                  {savingPassword ? '保存中...' : '确认修改'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 修改签名弹窗 */}
      <Modal
        visible={showSignatureModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSignatureModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSignatureModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>个人签名</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>签名内容</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={signature}
                onChangeText={setSignature}
                placeholder="请输入个人签名（最多100字）"
                placeholderTextColor="#B2BEC3"
                multiline
                numberOfLines={3}
                maxLength={100}
              />
              <Text style={styles.charCount}>{signature.length}/100</Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowSignatureModal(false)}
              >
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleSaveSignature}
                disabled={savingSignature}
              >
                <Text style={styles.submitButtonText}>
                  {savingSignature ? '保存中...' : '保存'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#636E72',
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
    position: 'relative',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F5F6FA',
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
    marginTop: 10,
    fontSize: 12,
    color: '#636E72',
  },
  infoSection: {
    paddingHorizontal: 16,
    marginBottom: 12,
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
  infoLabel: {
    fontSize: 15,
    color: '#2D3436',
  },
  infoValue: {
    fontSize: 15,
    color: '#636E72',
  },
  divider: {
    height: 1,
    backgroundColor: '#F5F6FA',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    color: '#636E72',
    marginBottom: 10,
    marginLeft: 4,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuItemText: {
    fontSize: 15,
    color: '#2D3436',
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  menuItemValue: {
    fontSize: 14,
    color: '#636E72',
    maxWidth: 150,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 24,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#636E72',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F5F6FA',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#2D3436',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  charCount: {
    fontSize: 12,
    color: '#B2BEC3',
    textAlign: 'right',
    marginTop: 4,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5F6FA',
  },
  cancelButtonText: {
    fontSize: 15,
    color: '#636E72',
  },
  submitButton: {
    backgroundColor: '#1E88E5',
  },
  submitButtonText: {
    fontSize: 15,
    color: '#FFF',
    fontWeight: '500',
  },
});
