'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, ActivityIndicator, Platform, Alert, FlatList, Modal as RNModal, ScrollView } from 'react-native';
import { PCLayout } from '@/components/pc/PCLayout';
import { FontAwesome6 } from '@expo/vector-icons';
import { storage } from '@/utils/storage';
import { getApiBaseUrl } from '@/utils/api';
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
  const [searchText, setSearchText] = useState('');

  const loadMediaList = useCallback(async () => {
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
  }, [selectedTag, mediaType]);

  const loadTags = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    loadMediaList();
    loadTags();
  }, [loadMediaList, loadTags]);

  const handleTagSelect = (tagId: number | null) => {
    setSelectedTag(tagId);
  };

  const handleTypeSelect = (type: string) => {
    setMediaType(type);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const renderMediaItem = ({ item }: { item: MediaItem }) => (
    <TouchableOpacity 
      style={styles.mediaItem} 
      onPress={() => setPreviewItem(item)}
    >
      {item.media_type === 'image' ? (
        <Image source={{ uri: item.file_url }} style={styles.mediaThumb} />
      ) : (
        <View style={styles.mediaPlaceholder}>
          <FontAwesome6 
            name={item.media_type === 'video' ? 'video' : 'file'} 
            size={32} 
            color="#999" 
          />
        </View>
      )}
      <View style={styles.mediaInfo}>
        <Text style={styles.mediaName} numberOfLines={1}>{item.original_name}</Text>
        <Text style={styles.mediaSize}>{formatFileSize(item.file_size)}</Text>
      </View>
    </TouchableOpacity>
  );

  const filteredMediaList = mediaList.filter(item => 
    item.original_name.toLowerCase().includes(searchText.toLowerCase())
  );

  const content = (
    <View style={styles.container}>
      {/* 左侧标签栏 */}
      <View style={styles.sidebar}>
        <View style={styles.sidebarHeader}>
          <Text style={styles.sidebarTitle}>标签筛选</Text>
        </View>
        <ScrollView style={styles.tagList}>
          <TouchableOpacity 
            style={[styles.tagItem, !selectedTag && styles.tagItemActive]}
            onPress={() => handleTagSelect(null)}
          >
            <FontAwesome6 name="border-all" size={14} color={!selectedTag ? '#1677ff' : '#666'} />
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
        </ScrollView>
      </View>

      {/* 右侧内容区 */}
      <View style={styles.content}>
        {/* 筛选工具栏 */}
        <View style={styles.toolbar}>
          <View style={styles.typeFilter}>
            {['all', 'image', 'video', 'file'].map(type => (
              <TouchableOpacity
                key={type}
                style={[styles.typeBtn, mediaType === type && styles.typeBtnActive]}
                onPress={() => handleTypeSelect(type)}
              >
                <FontAwesome6 
                  name={type === 'all' ? 'border-all' : type === 'image' ? 'image' : type === 'video' ? 'video' : 'file'} 
                  size={14} 
                  color={mediaType === type ? '#fff' : '#666'} 
                />
                <Text style={[styles.typeBtnText, mediaType === type && styles.typeBtnTextActive]}>
                  {type === 'all' ? '全部' : type === 'image' ? '图片' : type === 'video' ? '视频' : '文件'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.searchBox}>
            <FontAwesome6 name="search" size={14} color="#999" />
            <TextInput
              style={styles.searchInput}
              placeholder="搜索文件名..."
              placeholderTextColor="#999"
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>
        </View>

        {/* 媒体网格 */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1677ff" />
            <Text style={styles.loadingText}>加载中...</Text>
          </View>
        ) : filteredMediaList.length === 0 ? (
          <View style={styles.emptyContainer}>
            <FontAwesome6 name="images" size={64} color="#ddd" />
            <Text style={styles.emptyText}>暂无媒体文件</Text>
            <Text style={styles.emptySubText}>上传图片、视频或文件到相册</Text>
          </View>
        ) : (
          <ScrollView style={styles.mediaScrollView}>
            <View style={styles.mediaGrid}>
              {filteredMediaList.map(item => (
                <View key={item.id} style={styles.mediaItemWrapper}>
                  {renderMediaItem({ item })}
                </View>
              ))}
            </View>
          </ScrollView>
        )}
      </View>

      {/* 预览弹窗 */}
      <RNModal visible={!!previewItem} transparent onRequestClose={() => setPreviewItem(null)}>
        <View style={styles.previewOverlay}>
          <TouchableOpacity style={styles.previewClose} onPress={() => setPreviewItem(null)}>
            <FontAwesome6 name="times" size={24} color="#fff" />
          </TouchableOpacity>
          {previewItem && (
            <View style={styles.previewContent}>
              {previewItem.media_type === 'image' && (
                <Image 
                  source={{ uri: previewItem.file_url }} 
                  style={styles.previewImage} 
                  resizeMode="contain" 
                />
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
    </View>
  );

  return <PCLayout>{content}</PCLayout>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
  },
  sidebar: {
    width: 200,
    backgroundColor: '#fff',
    borderRightWidth: 1,
    borderRightColor: '#e8e8e8',
  },
  sidebarHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8',
  },
  sidebarTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  tagList: {
    flex: 1,
    padding: 8,
  },
  tagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
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
    marginLeft: 8,
  },
  tagTextActive: {
    color: '#1677ff',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  typeFilter: {
    flexDirection: 'row',
  },
  typeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
    marginRight: 8,
  },
  typeBtnActive: {
    backgroundColor: '#1677ff',
  },
  typeBtnText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  typeBtnTextActive: {
    color: '#fff',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    width: 200,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    marginLeft: 8,
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 8,
  },
  mediaScrollView: {
    flex: 1,
  },
  mediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  mediaItemWrapper: {
    marginRight: 16,
    marginBottom: 16,
  },
  mediaItem: {
    width: 180,
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
  },
  mediaThumb: {
    width: 180,
    height: 140,
  },
  mediaPlaceholder: {
    width: 180,
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
    color: '#333',
    marginBottom: 4,
  },
  mediaSize: {
    fontSize: 12,
    color: '#999',
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
