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

interface KnowledgeCard {
  id: number;
  title: string;
  knowledge_id: string;
  content: string;
  tags: string[];
  creator: string;
  created_at: string;
  updated_at: string;
  quality_score: number;
  audit_status: 'pending' | 'approved' | 'rejected';
  comment_count: number;
}

export default function KnowledgeBase() {
  const router = useSafeRouter();
  const [cards, setCards] = useState<KnowledgeCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');

  useEffect(() => {
    loadKnowledgeCards();
  }, []);

  const loadKnowledgeCards = async (keyword?: string) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (keyword) {
        params.append('keyword', keyword);
      }

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/knowledge/cards?${params.toString()}`
      );
      const data = await response.json();
      if (response.ok) {
        setCards(data);
      }
    } catch (error) {
      console.error('Fetch knowledge cards error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadKnowledgeCards(searchKeyword);
  };

  const handleCreate = () => {
    router.push('/knowledge-create');
  };

  const handleViewDetail = (cardId: number) => {
    router.push('/knowledge-detail', { id: cardId });
  };

  const handleEdit = (cardId: number) => {
    router.push('/knowledge-edit', { id: cardId });
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
              `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/knowledge/cards/${card.id}`,
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

  const getAuditStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return '待审核';
      case 'approved':
        return '已发布';
      case 'rejected':
        return '已驳回';
      default:
        return status;
    }
  };

  const getAuditStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#F39C12';
      case 'approved':
        return '#2ECC71';
      case 'rejected':
        return '#E74C3C';
      default:
        return '#636E72';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return '#2ECC71';
    if (score >= 6) return '#F39C12';
    if (score >= 4) return '#E67E22';
    return '#E74C3C';
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
            placeholder="搜索标题、内容、标签、创建人"
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
                  <View style={styles.titleLeft}>
                    <FontAwesome6 name="lightbulb" size={18} color="#F39C12" />
                    <Text style={styles.cardTitle}>{card.title}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: `${getAuditStatusColor(card.audit_status)}20` }]}>
                    <FontAwesome6 name="circle-dot" size={10} color={getAuditStatusColor(card.audit_status)} />
                    <Text style={[styles.statusText, { color: getAuditStatusColor(card.audit_status) }]}>
                      {getAuditStatusText(card.audit_status)}
                    </Text>
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
                    <FontAwesome6 name="pen" size={16} color="#F39C12" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => handleDelete(card)}
                  >
                    <FontAwesome6 name="trash" size={16} color="#E74C3C" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.cardBody}>
                <Text style={styles.cardContent} numberOfLines={3}>
                  {card.content}
                </Text>
              </View>

              <View style={styles.cardMeta}>
                <View style={styles.metaItem}>
                  <FontAwesome6 name="hashtag" size={12} color="#636E72" />
                  <Text style={styles.metaText}>ID: {card.knowledge_id}</Text>
                </View>
                <View style={styles.metaItem}>
                  <FontAwesome6 name="user" size={12} color="#636E72" />
                  <Text style={styles.metaText}>{card.creator}</Text>
                </View>
                <View style={styles.metaItem}>
                  <FontAwesome6 name="calendar" size={12} color="#636E72" />
                  <Text style={styles.metaText}>
                    {new Date(card.created_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>

              {/* 标签 */}
              {card.tags.length > 0 && (
                <View style={styles.tagsContainer}>
                  {card.tags.slice(0, 3).map((tag, index) => (
                    <View key={index} style={styles.tagBadge}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                  {card.tags.length > 3 && (
                    <Text style={styles.moreTagsText}>+{card.tags.length - 3}</Text>
                  )}
                </View>
              )}

              {/* 评分和评论 */}
              <View style={styles.cardFooter}>
                <View style={styles.scoreContainer}>
                  <FontAwesome6 name="star" size={14} color={getScoreColor(card.quality_score)} />
                  <Text style={[styles.scoreText, { color: getScoreColor(card.quality_score) }]}>
                    {card.quality_score.toFixed(1)}
                  </Text>
                </View>
                <View style={styles.commentContainer}>
                  <FontAwesome6 name="comment" size={14} color="#636E72" />
                  <Text style={styles.commentText}>{card.comment_count} 条评论</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  actionBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#1E88E5',
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  searchButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#1E88E5',
  },
  searchButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 14,
    color: '#636E72',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardTitleContainer: {
    flex: 1,
    marginRight: 8,
  },
  titleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3436',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 4,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#F5F7FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    marginBottom: 12,
  },
  cardContent: {
    fontSize: 14,
    color: '#636E72',
    lineHeight: 20,
  },
  cardMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#636E72',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  tagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(30, 136, 229, 0.1)',
  },
  tagText: {
    fontSize: 11,
    color: '#1E88E5',
  },
  moreTagsText: {
    fontSize: 11,
    color: '#95A5A6',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  scoreText: {
    fontSize: 14,
    fontWeight: '600',
  },
  commentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  commentText: {
    fontSize: 12,
    color: '#636E72',
  },
});
