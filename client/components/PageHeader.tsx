import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface PageHeaderProps {
  /** 页面标题 */
  title?: string;
  /** 是否显示返回工作台按钮，默认true */
  showHome?: boolean;
  /** 自定义背景色，默认白色 */
  backgroundColor?: string;
  /** 自定义标题颜色，默认#2D3436 */
  titleColor?: string;
  /** 自定义操作按钮 */
  rightAction?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  showHome = true,
  backgroundColor = '#FFFFFF',
  titleColor = '#2D3436',
  rightAction,
}) => {
  const router = useSafeRouter();
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    router.back();
  };

  const handleHome = () => {
    router.navigate('/');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor }]}>
      <View style={styles.content}>
        {/* 返回按钮 */}
        <TouchableOpacity
          onPress={handleBack}
          style={styles.iconButton}
          activeOpacity={0.7}
        >
          <FontAwesome6 name="arrow-left" size={20} color="#2D3436" />
        </TouchableOpacity>

        {/* 标题 */}
        {title && (
          <Text style={[styles.title, { color: titleColor }]} numberOfLines={1}>
            {title}
          </Text>
        )}

        {/* 右侧区域 */}
        <View style={styles.rightArea}>
          {showHome && (
            <TouchableOpacity
              onPress={handleHome}
              style={styles.iconButton}
              activeOpacity={0.7}
            >
              <FontAwesome6 name="desktop" size={20} color="#1E88E5" />
            </TouchableOpacity>
          )}
          {rightAction}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    borderBottomColor: '#DFE6E9',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F7FA',
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
    marginRight: 12,
  },
  rightArea: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
