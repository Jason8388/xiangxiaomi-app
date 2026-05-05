'use client';

import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, ActivityIndicator, Platform, Alert, FlatList, Modal as RNModal, ScrollView } from 'react-native';
import { getApiBaseUrl } from '@/utils/api';
import { storage } from '@/utils/storage';
import '@/assets/styles/pc-global.css';

interface MediaItem {
  id: number;
  original_name: string;
  file_name: string;
  media_type: string;
  file_size: number;
  file_url: string;
  thumbnail_url?: string;
  upload_time: string;
  download_count: number;
  uploader_name?: string;
  tags: Array<{ id: number; name: string; color: string }>;
}

interface TagItem {
  id: number;
  name: string;
  color: string;
  count?: number;
}

export default function PCGallery() {
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [tags, setTags] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState<number | null>(null);
  const [mediaType, setMediaType] = useState<string>('all');
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);

  useEffect(() => {
    loadMediaList();
    loadTags();
  }, []);

  const loadMediaList = async () => {
    try {
      setLoading(true);
      const sessionId = await storage.getItem('session_id');
      
      const params = new URLSearchParams();
      params.append('page', '1');
      params.append('page_size', '50');
      if (selectedTag) params.append('tag_id', selectedTag.toString());
      if (mediaType !== 'all') params.append('media_type', mediaType);
      
      const response = await fetch(
        `${getApiBaseUrl()}/api/v1/media?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${sessionId}` }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setMediaList(data.media || data.items || []);
      }
    } catch (error) {
      console.error('获取媒体列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTags = async () => {
    try {
      const sessionId = await storage.getItem('session_id');
      const response = await fetch(
        `${getApiBaseUrl()}/api/v1/media/tags/list`,
        {
          headers: { Authorization: `Bearer ${sessionId}` }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setTags(data.tags || []);
      }
    } catch (error) {
      console.error('获取标签列表失败:', error);
    }
  };

  const handleTagSelect = (tagId: number | null) => {
    setSelectedTag(tagId);
    setTimeout(loadMediaList, 0);
  };

  const handleTypeSelect = (type: string) => {
    setMediaType(type);
    setTimeout(loadMediaList, 0);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const showAlert = (msg: string) => {
    if (Platform.OS === 'web') {
      alert(msg);
    } else {
      Alert.alert('提示', msg);
    }
  };

  const renderMediaItem = ({ item }: { item: MediaItem }) => (
    <TouchableOpacity style={styles.mediaItem} onPress={() => setPreviewItem(item)}>
      {item.media_type === 'image' ? (
        <Image source={{ uri: item.file_url }} style={styles.mediaThumb} />
      ) : (
        <View style={styles.mediaPlaceholder}>
          <Text>{item.media_type === 'video' ? '视频' : '文件'}</Text>
        </View>
      )}
      <View style={styles.mediaInfo}>
        <Text style={styles.mediaName} numberOfLines={1}>{item.original_name}</Text>
        <Text style={styles.mediaSize}>{formatFileSize(item.file_size)}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <div className="pc-page-container">
      <div className="pc-page-header">
        <h1 className="pc-page-title">相册管理</h1>
      </div>
      
      <div className="pc-gallery-layout">
        {/* 左侧标签栏 */}
        <div className="pc-gallery-sidebar">
          <h3 className="pc-sidebar-title">标签筛选</h3>
          <TouchableOpacity 
            style={[styles.tagItem, !selectedTag && styles.tagItemActive]}
            onPress={() => handleTagSelect(null)}
          >
            <Text style={[styles.tagText, !selectedTag && styles.tagTextActive]}>全部</Text>
          </TouchableOpacity>
          {tags.map(tag => (
            <TouchableOpacity 
              key={tag.id}
              style={[styles.tagItem, selectedTag === tag.id && styles.tagItemActive]}
              onPress={() => handleTagSelect(tag.id)}
            >
              <View style={[styles.tagDot, { backgroundColor: tag.color }]} />
              <Text style={[styles.tagText, selectedTag === tag.id && styles.tagTextActive]}>{tag.name}</Text>
            </TouchableOpacity>
          ))}
        </div>
        
        {/* 右侧内容区 */}
        <div className="pc-gallery-content">
          {/* 筛选工具栏 */}
          <div className="pc-gallery-toolbar">
            <View style={styles.typeFilter}>
              {['all', 'image', 'video', 'file'].map(type => (
                <TouchableOpacity
                  key={type}
                  style={[styles.typeBtn, mediaType === type && styles.typeBtnActive]}
                  onPress={() => handleTypeSelect(type)}
                >
                  <Text style={[styles.typeBtnText, mediaType === type && styles.typeBtnTextActive]}>
                    {type === 'all' ? '全部' : type === 'image' ? '图片' : type === 'video' ? '视频' : '文件'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </div>
          
          {/* 媒体网格 */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#1677ff" />
            </View>
          ) : mediaList.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>暂无媒体文件</Text>
            </View>
          ) : (
            <View style={styles.mediaGrid}>
              {mediaList.map(item => (
                <View key={item.id}>
                  {renderMediaItem({ item })}
                </View>
              ))}
            </View>
          )}
        </div>
      </div>

      {/* 预览弹窗 */}
      <RNModal visible={!!previewItem} transparent onRequestClose={() => setPreviewItem(null)}>
        <View style={styles.previewOverlay}>
          <TouchableOpacity style={styles.previewClose} onPress={() => setPreviewItem(null)}>
            <Text style={styles.previewCloseText}>关闭</Text>
          </TouchableOpacity>
          {previewItem && (
            <View style={styles.previewContent}>
              {previewItem.media_type === 'image' && (
                <Image source={{ uri: previewItem.file_url }} style={styles.previewImage} resizeMode="contain" />
              )}
              <View style={styles.previewInfo}>
                <Text style={styles.previewName}>{previewItem.original_name}</Text>
                <Text style={styles.previewMeta}>
                  大小: {formatFileSize(previewItem.file_size)} | 上传时间: {previewItem.upload_time}
                </Text>
              </View>
            </View>
          )}
        </View>
      </RNModal>
    </div>
  );
}

const styles = StyleSheet.create({
  tagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 4,
    marginBottom: 4,
  },
  tagItemActive: {
    backgroundColor: '#e6f4ff',
  },
  tagDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  tagText: {
    fontSize: 14,
    color: '#666',
  },
  tagTextActive: {
    color: '#1677ff',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  mediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  mediaItem: {
    width: 180,
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  mediaThumb: {
    width: '100%',
    height: 140,
  },
  mediaPlaceholder: {
    width: '100%',
    height: 140,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaInfo: {
    padding: 12,
  },
  mediaName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  mediaSize: {
    fontSize: 12,
    color: '#999',
  },
  typeFilter: {
    flexDirection: 'row',
    gap: 8,
  },
  typeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    backgroundColor: '#f5f5f5',
  },
  typeBtnActive: {
    backgroundColor: '#1677ff',
  },
  typeBtnText: {
    fontSize: 14,
    color: '#666',
  },
  typeBtnTextActive: {
    color: '#fff',
  },
  previewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewClose: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
  previewCloseText: {
    color: '#fff',
    fontSize: 16,
  },
  previewContent: {
    width: '80%',
    maxHeight: '80%',
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: 400,
  },
  previewInfo: {
    marginTop: 16,
    alignItems: 'center',
  },
  previewName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  previewMeta: {
    color: '#ccc',
    fontSize: 14,
    marginTop: 8,
  },
});
