import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Modal, StyleSheet, Image } from 'react-native';
import { Screen } from '@/components/Screen';
import { FontAwesome6 } from '@expo/vector-icons';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { storage } from '@/utils/storage';

export default function ProfileScreen() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [versionModalVisible, setVersionModalVisible] = useState(false);
  const router = useSafeRouter();

  useEffect(() => {
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    try {
      const userStr = await storage.getItem('user');
      if (userStr) {
        setUser(JSON.parse(userStr));
      }
    } catch (error) {
      console.error('Load user error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('确认', '确定要退出登录吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '退出',
        style: 'destructive',
        onPress: async () => {
          try {
            await storage.deleteItem('user');
            await storage.deleteItem('token');
            await storage.deleteItem('session_id');
            router.replace('/login');
          } catch (error) {
            console.error('Logout error:', error);
          }
        },
      },
    ]);
  };

  const handleCheckUpdate = () => {
    Alert.alert('检查更新', '当前已是最新版本', [{ text: '确定' }]);
  };

  // 菜单项
  const menuItems = [
    {
      icon: 'user',
      title: '账号设置',
      subtitle: '修改密码、个人信息',
      color: '#6C63FF',
      onPress: () => router.push('/account-settings'),
    },
    {
      icon: 'circle-question',
      title: '帮助与反馈',
      subtitle: '产品操作指导手册',
      color: '#00B894',
      onPress: () => router.push('/help-feedback'),
    },
    {
      icon: 'mobile-screen',
      title: '系统版本与更新',
      subtitle: '检查更新、版本信息',
      color: '#3498DB',
      onPress: () => setVersionModalVisible(true),
    },
  ];

  if (loading) {
    return (
      <Screen>
        <View style={styles.loadingContainer}>
          <Text>加载中...</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>我的</Text>
        </View>

        {/* 账号信息卡 */}
        <View style={styles.section}>
          <View style={styles.accountCard}>
            <View style={styles.accountHeader}>
              <View style={styles.avatarContainer}>
                {user?.avatar ? (
                  <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
                ) : (
                  <FontAwesome6 name="user" size={32} color="#6C63FF" />
                )}
              </View>
              <View style={styles.accountInfo}>
                <Text style={styles.accountName}>{user?.name || '未登录'}</Text>
                <Text style={styles.accountRole}>
                  {user?.role === 'admin' ? '管理员' : '售后工程师'}
                </Text>
              </View>
            </View>
            <View style={styles.accountDetails}>
              {user?.signature ? (
                <View style={styles.signatureContainer}>
                  <Text style={styles.signatureText}>"{user.signature}"</Text>
                </View>
              ) : null}
              <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                  <FontAwesome6 name="phone" size={14} color="#636E72" />
                  <Text style={styles.detailText}>{user?.phone || '-'}</Text>
                </View>
                <View style={styles.detailItem}>
                  <FontAwesome6 name="briefcase" size={14} color="#636E72" />
                  <Text style={styles.detailText}>{user?.position || '-'}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* 功能菜单 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>功能</Text>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              onPress={item.onPress}
              activeOpacity={0.7}
              style={styles.menuItem}
            >
              <View style={styles.menuItemContent}>
                <View style={[styles.menuIcon, { backgroundColor: `${item.color}15` }]}>
                  <FontAwesome6 name={item.icon as any} size={20} color={item.color} />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                </View>
                <FontAwesome6 name="chevron-right" size={16} color="#B2BEC3" />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* 退出登录 */}
        <View style={styles.logoutSection}>
          <TouchableOpacity
            onPress={handleLogout}
            style={styles.logoutButton}
            activeOpacity={0.7}
          >
            <FontAwesome6 name="right-from-bracket" size={18} color="#FF6B6B" />
            <Text style={styles.logoutText}>退出登录</Text>
          </TouchableOpacity>
        </View>

        {/* 版本信息 */}
        <View style={styles.versionSection}>
          <Text style={styles.versionText}>项小秘 v1.0.0</Text>
        </View>

        {/* 系统版本与更新弹窗 */}
        <Modal
          visible={versionModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setVersionModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>系统版本与更新</Text>
                <TouchableOpacity onPress={() => setVersionModalVisible(false)}>
                  <FontAwesome6 name="xmark" size={20} color="#636E72" />
                </TouchableOpacity>
              </View>

              <View style={styles.versionInfo}>
                <View style={styles.versionRow}>
                  <Text style={styles.versionLabel}>应用名称</Text>
                  <Text style={styles.versionValue}>项小秘</Text>
                </View>
                <View style={styles.versionRow}>
                  <Text style={styles.versionLabel}>应用版本</Text>
                  <Text style={styles.versionValue}>v1.0.0</Text>
                </View>
                <View style={styles.versionRow}>
                  <Text style={styles.versionLabel}>运行平台</Text>
                  <Text style={styles.versionValue}>iOS / Android / Web</Text>
                </View>
                <View style={styles.versionRow}>
                  <Text style={styles.versionLabel}>软件版本号</Text>
                  <Text style={styles.versionValue}>1.0.0.20240101</Text>
                </View>
                <View style={styles.versionRow}>
                  <Text style={styles.versionLabel}>更新说明</Text>
                  <Text style={styles.versionValue}>首次发布版本</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.checkUpdateButton}
                onPress={handleCheckUpdate}
                activeOpacity={0.7}
              >
                <Text style={styles.checkUpdateText}>检查更新</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2D3436',
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#636E72',
    marginBottom: 12,
  },
  accountCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  accountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(108, 99, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2D3436',
    marginBottom: 4,
  },
  accountRole: {
    fontSize: 14,
    color: '#636E72',
  },
  accountDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F3',
  },
  signatureContainer: {
    marginBottom: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#6C63FF',
  },
  signatureText: {
    fontSize: 13,
    color: '#636E72',
    fontStyle: 'italic',
  },
  detailRow: {
    flexDirection: 'row',
    gap: 24,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    color: '#636E72',
  },
  menuItem: {
    marginBottom: 12,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 12,
    color: '#636E72',
  },
  logoutSection: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    gap: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B6B',
  },
  versionSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  versionText: {
    fontSize: 12,
    color: '#B2BEC3',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D3436',
  },
  versionInfo: {
    marginBottom: 24,
  },
  versionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F3',
  },
  versionLabel: {
    fontSize: 15,
    color: '#636E72',
  },
  versionValue: {
    fontSize: 15,
    color: '#2D3436',
    fontWeight: '500',
  },
  checkUpdateButton: {
    backgroundColor: '#6C63FF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  checkUpdateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
