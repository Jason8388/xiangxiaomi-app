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
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { cachedFetch } from '@/utils/storage';

interface KnowledgeCard {
  id: number;
  title: string;
  content: string;
  tags: string[];
  creator: string;
  created_at: string;
  updated_at: string;
  views: number;
}

export default function KnowledgeBase() {
  const router = useSafeRouter();
  const [cards, setCards] = useState<KnowledgeCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const result = await cachedFetch<KnowledgeCard[]>('knowledge-list', async () => {
          const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/knowledge`);
          const data = await response.json();
          if (response.ok) {
            return Array.isArray(data) ? data : (data.data || []);
          }
          return [];
        }, 'medium');
        setCards(result);
      } catch (error) {
        console.error('Fetch knowledge cards error:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleSearch = () => {
    // 搜索时清除缓存
    loadKnowledgeCards(searchKeyword);
  };

  const loadKnowledgeCards = async (keyword?: string) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (keyword) {
        params.append('keyword', keyword);
      }

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/knowledge?${params.toString()}`
      );
      const data = await response.json();
      if (response.ok) {
        const list = Array.isArray(data) ? data : (data.data || []);
        setCards(list);
        return list;
      }
    } catch (error) {
      console.error('Fetch knowledge cards error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    router.push('/knowledge-create');
  };

  const handleViewDetail = (cardId: number) => {
    router.push('/knowledge-detail', { id: cardId });
  };

  const handleEdit = (cardId: number) => {
    router.push('/knowledge-create', { id: cardId });
  };

  const handleDelete = (card: KnowledgeCard) => {
    Alert.alert('确认删除', `确定要删除知识卡"${card.title}"吗？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            const response = await fetch(
              `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/knowledge/${card.id}`,
              {
                method: 'DELETE',
              }
            );
            if (response.ok) {
              Alert.alert('成功', '删除成功');
              loadKnowledgeCards();
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
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  return (
    <Screen>
      <PageHeader title="知识库" />

      <ScrollView style={styles.container}>
        {/* 操作栏 */}
        <View style={styles.actionBar}>
          <TouchableOpacity style={styles.createButton} onPress={handleCreate}>
            <FontAwesome6 name="plus" size={16} color="#FFFFFF" />
            <Text style={styles.createButtonText}>新建知识卡</Text>
          </TouchableOpacity>
        </View>

        {/* 搜索框 */}
        <View style={styles.searchBar}>
          <FontAwesome6 name="magnifying-glass" size={16} color="#636E72" />
          <TextInput
            style={styles.searchInput}
            placeholder="搜索标题、内容、标签"
            value={searchKeyword}
            onChangeText={setSearchKeyword}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <Text style={styles.searchButtonText}>搜索</Text>
          </TouchableOpacity>
        </View>

        {/* 知识卡列表 */}
        {loading ? (
          <View style={styles.centerContainer}>
            <Text>加载中...</Text>
          </View>
        ) : cards.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>暂无知识卡</Text>
          </View>
        ) : (
          cards.map((card) => (
            <View key={card.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleContainer}>
                  <FontAwesome6 name="lightbulb" size={18} color="#6C63FF" />
                  <Text style={styles.cardTitle} numberOfLines={1}>{card.title}</Text>
                </View>
              </View>

              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => handleViewDetail(card.id)}
                >
                  <FontAwesome6 name="eye" size={16} color="#1E88E5" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => handleEdit(card.id)}
                >
                  <FontAwesome6 name="pen" size={16} color="#6C63FF" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => handleDelete(card)}
                >
                  <FontAwesome6 name="trash" size={16} color="#FF6B6B" />
                </TouchableOpacity>
              </View>

              <Text style={styles.cardContent} numberOfLines={3}>
                {card.content}
              </Text>

              {card.tags && card.tags.length > 0 && (
                <View style={styles.tagContainer}>
                  {card.tags.slice(0, 5).map((tag, index) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.cardFooter}>
                <Text style={styles.footerText}>
                  {card.creator || '未知'} · {formatDate(card.created_at)}
                </Text>
                <View style={styles.footerRight}>
                  <FontAwesome6 name="eye" size={12} color="#B2BEC3" />
                  <Text style={styles.footerText}> {card.views || 0}</Text>
                </View>
              </View>
            </View>
          ))
        )}

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
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6C63FF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#2D3436',
  },
  searchButton: {
    backgroundColor: '#6C63FF',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#B2BEC3',
  },
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3436',
    flex: 1,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 6,
  },
  cardContent: {
    fontSize: 14,
    color: '#636E72',
    lineHeight: 20,
    marginBottom: 10,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  tag: {
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    color: '#6C63FF',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 10,
  },
  footerText: {
    fontSize: 12,
    color: '#B2BEC3',
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bottomPadding: {
    height: 30,
  },
});
