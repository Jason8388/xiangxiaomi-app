import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { PageHeader } from '@/components/PageHeader';
import { FontAwesome6 } from '@expo/vector-icons';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';

interface KnowledgeCard {
  id: number;
  title: string;
  content: string;
  tags: string[];
  creator?: string;
  author_name?: string;
  created_at: string;
  updated_at: string;
  views: number;
  likes: number;
}

export default function KnowledgeDetail() {
  const router = useSafeRouter();
  const { id } = useSafeSearchParams<{ id: string }>();
  const [card, setCard] = useState<KnowledgeCard | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      loadKnowledgeCard();
    }
  }, [id]);

  const loadKnowledgeCard = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/knowledge/${id}`
      );
      const data = await response.json();
      if (response.ok) {
        setCard(data);
      }
    } catch (error) {
      console.error('Fetch knowledge card error:', error);
      Alert.alert('错误', '加载知识卡失败');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    router.push('/knowledge-create', { id });
  };

  const handleDelete = () => {
    Alert.alert('确认删除', '确定要删除这条知识吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            const response = await fetch(
              `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/knowledge/${id}`,
              { method: 'DELETE' }
            );
            if (response.ok) {
              Alert.alert('成功', '删除成功');
              router.back();
            }
          } catch (error) {
            Alert.alert('错误', '删除失败');
          }
        },
      },
    ]);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <Screen>
        <PageHeader title="知识详情" />
        <View style={styles.loadingContainer}>
          <Text>加载中...</Text>
        </View>
      </Screen>
    );
  }

  if (!card) {
    return (
      <Screen>
        <PageHeader title="知识详情" />
        <View style={styles.loadingContainer}>
          <Text>知识不存在</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <PageHeader title="知识详情" />

      <ScrollView style={styles.container}>
        {/* 标题 */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>{card.title}</Text>
        </View>

        {/* 操作按钮 */}
        <View style={styles.actionBar}>
          <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
            <FontAwesome6 name="pen" size={14} color="#FFFFFF" />
            <Text style={styles.editButtonText}>修改</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <FontAwesome6 name="trash" size={14} color="#FFFFFF" />
            <Text style={styles.deleteButtonText}>删除</Text>
          </TouchableOpacity>
        </View>

        {/* 元信息 */}
        <View style={styles.metaSection}>
          <View style={styles.metaItem}>
            <FontAwesome6 name="user" size={14} color="#636E72" />
            <Text style={styles.metaText}>{card.author_name || card.creator || '未知'}</Text>
          </View>
          <View style={styles.metaItem}>
            <FontAwesome6 name="clock" size={14} color="#636E72" />
            <Text style={styles.metaText}>{formatDate(card.created_at)}</Text>
          </View>
          <View style={styles.metaItem}>
            <FontAwesome6 name="eye" size={14} color="#636E72" />
            <Text style={styles.metaText}>{card.views || 0} 次浏览</Text>
          </View>
        </View>

        {/* 标签 */}
        {card.tags && card.tags.length > 0 && (
          <View style={styles.tagsSection}>
            {card.tags.map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {/* 内容 */}
        <View style={styles.contentSection}>
          <Text style={styles.content}>{card.content}</Text>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleSection: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2D3436',
    lineHeight: 30,
  },
  actionBar: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6C63FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  metaSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: '#636E72',
  },
  tagsSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  tag: {
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  tagText: {
    fontSize: 13,
    color: '#6C63FF',
  },
  contentSection: {
    backgroundColor: '#FFFFFF',
    marginTop: 8,
    padding: 20,
  },
  content: {
    fontSize: 15,
    color: '#2D3436',
    lineHeight: 26,
  },
  bottomPadding: {
    height: 30,
  },
});
