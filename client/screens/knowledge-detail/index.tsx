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

interface Comment {
  id: number;
  user: string;
  content: string;
  created_at: string;
}

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
  audit_remark?: string;
  comments: Comment[];
  user_rating?: number;
}

export default function KnowledgeDetail() {
  const router = useSafeRouter();
  const { id } = useSafeSearchParams<{ id: string }>();
  const [card, setCard] = useState<KnowledgeCard | null>(null);
  const [loading, setLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [rating, setRating] = useState(0);
  const [showRatingModal, setShowRatingModal] = useState(false);

  useEffect(() => {
    if (id) {
      loadKnowledgeCard();
    }
  }, [id]);

  const loadKnowledgeCard = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/knowledge/cards/${id}`
      );
      const data = await response.json();
      if (response.ok) {
        setCard(data);
        setRating(data.user_rating || 0);
      }
    } catch (error) {
      console.error('Fetch knowledge card error:', error);
      Alert.alert('错误', '加载知识卡失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim()) {
      Alert.alert('提示', '请输入评论内容');
      return;
    }

    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/knowledge/cards/${id}/comments`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: commentText }),
        }
      );

      if (response.ok) {
        Alert.alert('成功', '评论已提交');
        setCommentText('');
        loadKnowledgeCard();
      }
    } catch (error) {
      Alert.alert('错误', '提交评论失败');
    }
  };

  const handleSubmitRating = async () => {
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/knowledge/cards/${id}/rating`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ score: rating }),
        }
      );

      if (response.ok) {
        Alert.alert('成功', '评分已提交');
        setShowRatingModal(false);
        loadKnowledgeCard();
      }
    } catch (error) {
      Alert.alert('错误', '提交评分失败');
    }
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

  if (loading) {
    return (
      <Screen>
        <PageHeader title="知识卡详情" />
        <View style={styles.centerContainer}>
          <Text>加载中...</Text>
        </View>
      </Screen>
    );
  }

  if (!card) {
    return (
      <Screen>
        <PageHeader title="知识卡详情" />
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>知识卡不存在</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <PageHeader title="知识卡详情" />

      <ScrollView style={styles.container}>
        {/* 审核状态 */}
        <View style={styles.section}>
          <View style={[styles.statusBadge, { backgroundColor: `${getAuditStatusColor(card.audit_status)}20` }]}>
            <FontAwesome6 name="circle-dot" size={12} color={getAuditStatusColor(card.audit_status)} />
            <Text style={[styles.statusText, { color: getAuditStatusColor(card.audit_status) }]}>
              {getAuditStatusText(card.audit_status)}
            </Text>
          </View>
          {card.audit_remark && (
            <View style={styles.auditRemark}>
              <FontAwesome6 name="circle-info" size={14} color="#636E72" />
              <Text style={styles.auditRemarkText}>审核意见：{card.audit_remark}</Text>
            </View>
          )}
        </View>

        {/* 基本信息 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FontAwesome6 name="circle-info" size={16} color="#1E88E5" />
            <Text style={styles.sectionTitle}>基本信息</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>知识名称</Text>
            <Text style={styles.infoValue}>{card.title}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>知识ID</Text>
            <Text style={styles.infoValue}>{card.knowledge_id}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>创建人</Text>
            <Text style={styles.infoValue}>{card.creator}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>创建日期</Text>
            <Text style={styles.infoValue}>
              {new Date(card.created_at).toLocaleString()}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>更新日期</Text>
            <Text style={styles.infoValue}>
              {new Date(card.updated_at).toLocaleString()}
            </Text>
          </View>
        </View>

        {/* 知识内容 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FontAwesome6 name="file-lines" size={16} color="#1E88E5" />
            <Text style={styles.sectionTitle}>知识内容</Text>
          </View>
          <View style={styles.contentContainer}>
            <Text style={styles.contentText}>{card.content}</Text>
          </View>
        </View>

        {/* 知识标签 */}
        {card.tags.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <FontAwesome6 name="tags" size={16} color="#1E88E5" />
              <Text style={styles.sectionTitle}>知识标签</Text>
            </View>
            <View style={styles.tagsContainer}>
              {card.tags.map((tag, index) => (
                <View key={index} style={styles.tagBadge}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 质量评分 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FontAwesome6 name="star" size={16} color="#1E88E5" />
            <Text style={styles.sectionTitle}>质量评分</Text>
          </View>
          <View style={styles.scoreCard}>
            <View style={styles.scoreMain}>
              <FontAwesome6 name="star" size={32} color={getScoreColor(card.quality_score)} />
              <Text style={[styles.scoreValue, { color: getScoreColor(card.quality_score) }]}>
                {card.quality_score.toFixed(1)}
              </Text>
              <Text style={styles.scoreLabel}>分</Text>
            </View>
            <View style={styles.scoreInfo}>
              <Text style={styles.scoreHintText}>
                基于用户评分（1-10分）的平均值计算，每周更新
              </Text>
            </View>
          </View>

          {/* 用户评分 */}
          {card.audit_status === 'approved' && (
            <View style={styles.ratingContainer}>
              <TouchableOpacity
                style={styles.ratingButton}
                onPress={() => setShowRatingModal(true)}
              >
                <FontAwesome6 name="star" size={16} color="#F39C12" />
                <Text style={styles.ratingButtonText}>
                  {card.user_rating ? `已评分: ${card.user_rating}分` : '点击评分'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* 用户评论 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FontAwesome6 name="comments" size={16} color="#1E88E5" />
            <Text style={styles.sectionTitle}>用户评论 ({card.comments.length})</Text>
          </View>

          {/* 评论输入 */}
          {card.audit_status === 'approved' && (
            <View style={styles.commentInputContainer}>
              <TextInput
                style={styles.commentInput}
                placeholder="发表评论..."
                value={commentText}
                onChangeText={setCommentText}
                multiline
                numberOfLines={3}
              />
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmitComment}
              >
                <Text style={styles.submitButtonText}>发表</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* 评论列表 */}
          {card.comments.length === 0 ? (
            <View style={styles.centerContainer}>
              <Text style={styles.emptyText}>暂无评论</Text>
            </View>
          ) : (
            card.comments.map((comment) => (
              <View key={comment.id} style={styles.commentCard}>
                <View style={styles.commentHeader}>
                  <View style={styles.commentUser}>
                    <FontAwesome6 name="circle-user" size={20} color="#636E72" />
                    <Text style={styles.commentUserName}>{comment.user}</Text>
                  </View>
                  <Text style={styles.commentDate}>
                    {new Date(comment.created_at).toLocaleString()}
                  </Text>
                </View>
                <Text style={styles.commentContent}>{comment.content}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* 评分弹窗 */}
      {showRatingModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>为知识卡评分</Text>
              <TouchableOpacity onPress={() => setShowRatingModal(false)}>
                <FontAwesome6 name="xmark" size={20} color="#636E72" />
              </TouchableOpacity>
            </View>

            <View style={styles.ratingStars}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                <TouchableOpacity
                  key={score}
                  style={[styles.starButton, rating >= score && styles.starButtonActive]}
                  onPress={() => setRating(score)}
                >
                  <FontAwesome6
                    name="star"
                    size={24}
                    color={rating >= score ? '#F39C12' : '#BDC3C7'}
                  />
                  <Text style={[styles.starButtonText, rating >= score && styles.starButtonTextActive]}>
                    {score}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.modalButton, !rating && styles.modalButtonDisabled]}
              onPress={handleSubmitRating}
              disabled={!rating}
            >
              <Text style={styles.modalButtonText}>提交评分</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  centerContainer: {
    padding: 24,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#636E72',
  },
  emptyText: {
    fontSize: 14,
    color: '#636E72',
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3436',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'center',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  auditRemark: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF3CD',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'center',
  },
  auditRemarkText: {
    fontSize: 13,
    color: '#636E72',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#636E72',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#2D3436',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  contentContainer: {
    backgroundColor: '#F5F7FA',
    borderRadius: 8,
    padding: 16,
  },
  contentText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#2D3436',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(30, 136, 229, 0.1)',
  },
  tagText: {
    fontSize: 12,
    color: '#1E88E5',
    fontWeight: '500',
  },
  scoreCard: {
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  scoreMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: '700',
  },
  scoreLabel: {
    fontSize: 14,
    color: '#636E72',
  },
  scoreInfo: {
    alignItems: 'center',
  },
  scoreHintText: {
    fontSize: 12,
    color: '#95A5A6',
    textAlign: 'center',
  },
  ratingContainer: {
    marginTop: 12,
  },
  ratingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: '#F39C12',
    borderRadius: 8,
  },
  ratingButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  commentInputContainer: {
    marginBottom: 16,
  },
  commentInput: {
    backgroundColor: '#F5F7FA',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 8,
  },
  submitButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#1E88E5',
    borderRadius: 6,
  },
  submitButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  commentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  commentUserName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2D3436',
  },
  commentDate: {
    fontSize: 12,
    color: '#95A5A6',
  },
  commentContent: {
    fontSize: 14,
    color: '#2D3436',
    lineHeight: 20,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3436',
  },
  ratingStars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  starButton: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F5F7FA',
  },
  starButtonActive: {
    backgroundColor: 'rgba(243, 156, 18, 0.1)',
  },
  starButtonText: {
    fontSize: 12,
    color: '#636E72',
    marginTop: 4,
  },
  starButtonTextActive: {
    color: '#F39C12',
    fontWeight: '600',
  },
  modalButton: {
    paddingVertical: 12,
    backgroundColor: '#1E88E5',
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonDisabled: {
    backgroundColor: '#BDC3C7',
  },
  modalButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
