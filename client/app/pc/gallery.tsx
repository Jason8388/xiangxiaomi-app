'use client';

import React, { useState, useEffect } from 'react';
import { View, Text, Input, Button, Image, Select, Tag, Modal, Upload, message, Spin } from 'antd';
import { SearchOutlined, UploadOutlined, DeleteOutlined, FilterOutlined, PictureOutlined, VideoCameraOutlined, CloudOutlined } from '@ant-design/icons';
import { getApiBaseUrl } from '@/utils/api';

const { Option } = Select;

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
  const [uploaders, setUploaders] = useState<any[]>([]);
  const [searchText, setSearchText] = useState('');
  const [selectedTag, setSelectedTag] = useState<number | null>(null);
  const [selectedUploader, setSelectedUploader] = useState<string | null>(null);
  const [selectedMediaType, setSelectedMediaType] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchMedia();
    fetchTags();
    fetchUploaders();
  }, []);

  const getApiBaseUrlFunc = () => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:9091';
      }
    }
    return process.env.EXPO_PUBLIC_BACKEND_BASE_URL || '';
  };

  const fetchMedia = async (tagId?: number, uploaderId?: string, mediaType?: string) => {
    setLoading(true);
    try {
      const baseUrl = getApiBaseUrlFunc();
      let url = `${baseUrl}/api/v1/media`;
      const params = new URLSearchParams();
      if (searchText) params.append('search', searchText);
      if (tagId) params.append('tag_id', tagId.toString());
      if (uploaderId) params.append('uploader_id', uploaderId);
      if (mediaType) params.append('media_type', mediaType);
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      if (params.toString()) url += `?${params.toString()}`;

      const response = await fetch(url);
      const data = await response.json();

      if (Array.isArray(data.media)) {
        setMediaList(data.media);
      }
    } catch (error) {
      console.error('Fetch media error:', error);
      message.error('获取媒体列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      const baseUrl = getApiBaseUrlFunc();
      const response = await fetch(`${baseUrl}/api/v1/media/tags/list`);
      const data = await response.json();
      if (Array.isArray(data)) {
        setTags(data);
      }
    } catch (error) {
      console.error('Fetch tags error:', error);
    }
  };

  const fetchUploaders = async () => {
    try {
      const baseUrl = getApiBaseUrlFunc();
      const response = await fetch(`${baseUrl}/api/v1/media/uploaders/list`);
      const data = await response.json();
      if (Array.isArray(data)) {
        setUploaders(data);
      }
    } catch (error) {
      console.error('Fetch uploaders error:', error);
    }
  };

  const handleSearch = () => {
    fetchMedia(selectedTag || undefined, selectedUploader || undefined, selectedMediaType || undefined);
  };

  const handleFilterApply = () => {
    fetchMedia(selectedTag || undefined, selectedUploader || undefined, selectedMediaType || undefined);
    setFilterModalVisible(false);
  };

  const handleResetFilter = () => {
    setSearchText('');
    setSelectedTag(null);
    setSelectedUploader(null);
    setSelectedMediaType(null);
    setStartDate('');
    setEndDate('');
    fetchMedia();
    setFilterModalVisible(false);
  };

  const handlePreview = (item: MediaItem) => {
    setPreviewItem(item);
    setPreviewVisible(true);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  };

  const getMediaTypeIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <PictureOutlined />;
      case 'video':
        return <VideoCameraOutlined />;
      default:
        return <CloudOutlined />;
    }
  };

  return (
    <div className="pc-container">
      <div className="pc-header">
        <h1 className="pc-title">相册管理</h1>
      </div>

      <div className="pc-content">
        {/* 搜索和筛选区域 */}
        <div className="pc-card" style={{ marginBottom: 16 }}>
          <div className="pc-toolbar">
            <div className="pc-toolbar-left">
              <Input
                placeholder="搜索文件名..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onPressEnter={handleSearch}
                style={{ width: 200, marginRight: 8 }}
                prefix={<SearchOutlined />}
              />
              <Button onClick={handleSearch}>搜索</Button>
            </div>
            <div className="pc-toolbar-right">
              <Button icon={<FilterOutlined />} onClick={() => setFilterModalVisible(true)}>
                筛选
              </Button>
            </div>
          </div>

          {/* 标签筛选 */}
          {tags.length > 0 && (
            <div className="pc-tags-filter">
              <Text style={{ marginRight: 8 }}>标签：</Text>
              {tags.map((tag) => (
                <Tag
                  key={tag.id}
                  color={selectedTag === tag.id ? tag.color : 'default'}
                  onClick={() => {
                    setSelectedTag(selectedTag === tag.id ? null : tag.id);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  {tag.name}
                </Tag>
              ))}
            </div>
          )}
        </div>

        {/* 媒体列表 */}
        <div className="pc-card">
          <Spin spinning={loading}>
            {mediaList.length === 0 ? (
              <div className="pc-empty">
                <PictureOutlined style={{ fontSize: 48, color: '#ccc' }} />
                <Text style={{ marginTop: 16, color: '#999' }}>暂无媒体文件</Text>
              </div>
            ) : (
              <div className="pc-media-grid">
                {mediaList.map((item) => (
                  <div key={item.id} className="pc-media-item" onClick={() => handlePreview(item)}>
                    <div className="pc-media-thumb">
                      {item.media_type === 'image' ? (
                        <img src={item.thumbnail_url || item.file_url} alt={item.original_name} />
                      ) : item.media_type === 'video' ? (
                        <div className="pc-media-video-placeholder">
                          <VideoCameraOutlined style={{ fontSize: 32, color: '#999' }} />
                        </div>
                      ) : (
                        <div className="pc-media-file-placeholder">
                          <CloudOutlined style={{ fontSize: 32, color: '#999' }} />
                        </div>
                      )}
                      <div className="pc-media-type-icon">
                        {getMediaTypeIcon(item.media_type)}
                      </div>
                    </div>
                    <div className="pc-media-info">
                      <Text className="pc-media-name" ellipsis={{ tooltip: item.original_name }}>
                        {item.original_name}
                      </Text>
                      <Text className="pc-media-size">{formatFileSize(item.file_size)}</Text>
                    </div>
                    {item.tags && item.tags.length > 0 && (
                      <div className="pc-media-tags">
                        {item.tags.slice(0, 2).map((tag) => (
                          <Tag key={tag.id} color={tag.color} style={{ fontSize: 10 }}>
                            {tag.name}
                          </Tag>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Spin>
        </div>
      </div>

      {/* 筛选弹窗 */}
      <Modal
        title="筛选条件"
        open={filterModalVisible}
        onCancel={() => setFilterModalVisible(false)}
        onOk={handleFilterApply}
        okText="应用"
        cancelText="重置"
        footer={[
          <Button key="reset" onClick={handleResetFilter}>
            重置
          </Button>,
          <Button key="cancel" onClick={() => setFilterModalVisible(false)}>
            取消
          </Button>,
          <Button key="apply" type="primary" onClick={handleFilterApply}>
            应用
          </Button>,
        ]}
      >
        <div style={{ marginBottom: 16 }}>
          <Text style={{ display: 'block', marginBottom: 8 }}>媒体类型</Text>
          <Select
            placeholder="选择类型"
            value={selectedMediaType}
            onChange={setSelectedMediaType}
            style={{ width: '100%' }}
            allowClear
          >
            <Option value="image">图片</Option>
            <Option value="video">视频</Option>
            <Option value="file">文件</Option>
          </Select>
        </div>
        <div style={{ marginBottom: 16 }}>
          <Text style={{ display: 'block', marginBottom: 8 }}>上传者</Text>
          <Select
            placeholder="选择上传者"
            value={selectedUploader}
            onChange={setSelectedUploader}
            style={{ width: '100%' }}
            allowClear
          >
            {uploaders.map((uploader) => (
              <Option key={uploader.id} value={uploader.id.toString()}>
                {uploader.name || uploader.username}
              </Option>
            ))}
          </Select>
        </div>
        <div style={{ marginBottom: 16 }}>
          <Text style={{ display: 'block', marginBottom: 8 }}>标签</Text>
          <Select
            placeholder="选择标签"
            value={selectedTag}
            onChange={setSelectedTag}
            style={{ width: '100%' }}
            allowClear
          >
            {tags.map((tag) => (
              <Option key={tag.id} value={tag.id}>
                {tag.name}
              </Option>
            ))}
          </Select>
        </div>
        <div style={{ marginBottom: 16 }}>
          <Text style={{ display: 'block', marginBottom: 8 }}>上传日期</Text>
          <div style={{ display: 'flex', gap: 8 }}>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="开始日期"
            />
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder="结束日期"
            />
          </div>
        </div>
      </Modal>

      {/* 预览弹窗 */}
      <Modal
        title={previewItem?.original_name}
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={null}
        width={800}
      >
        {previewItem && (
          <div className="pc-preview-content">
            {previewItem.media_type === 'image' ? (
              <img
                src={previewItem.file_url}
                alt={previewItem.original_name}
                style={{ maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain' }}
              />
            ) : previewItem.media_type === 'video' ? (
              <video
                src={previewItem.file_url}
                controls
                style={{ maxWidth: '100%', maxHeight: '60vh' }}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <CloudOutlined style={{ fontSize: 64, color: '#999' }} />
                <Text style={{ display: 'block', marginTop: 16 }}>该文件类型不支持预览</Text>
              </div>
            )}
            <div className="pc-preview-info">
              <div className="pc-preview-info-item">
                <Text strong>文件名：</Text>
                <Text>{previewItem.original_name}</Text>
              </div>
              <div className="pc-preview-info-item">
                <Text strong>文件大小：</Text>
                <Text>{formatFileSize(previewItem.file_size)}</Text>
              </div>
              <div className="pc-preview-info-item">
                <Text strong>上传时间：</Text>
                <Text>{previewItem.upload_time}</Text>
              </div>
              <div className="pc-preview-info-item">
                <Text strong>上传者：</Text>
                <Text>{previewItem.uploader_name || '-'}</Text>
              </div>
              <div className="pc-preview-info-item">
                <Text strong>下载次数：</Text>
                <Text>{previewItem.download_count}</Text>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <style>{`
        .pc-container {
          padding: 24px;
          max-width: 1400px;
          margin: 0 auto;
        }
        .pc-header {
          margin-bottom: 24px;
        }
        .pc-title {
          font-size: 24px;
          font-weight: 600;
          color: #1a1a1a;
          margin: 0;
        }
        .pc-card {
          background: #fff;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
        .pc-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        .pc-toolbar-left {
          display: flex;
          align-items: center;
        }
        .pc-toolbar-right {
          display: flex;
          gap: 8px;
        }
        .pc-tags-filter {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
          padding-top: 12px;
          border-top: 1px solid #f0f0f0;
        }
        .pc-empty {
          text-align: center;
          padding: 60px 0;
        }
        .pc-media-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 16px;
        }
        .pc-media-item {
          border: 1px solid #f0f0f0;
          border-radius: 8px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.3s;
        }
        .pc-media-item:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          transform: translateY(-2px);
        }
        .pc-media-thumb {
          position: relative;
          height: 140px;
          background: #f5f5f5;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .pc-media-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .pc-media-video-placeholder,
        .pc-media-file-placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          background: #f0f0f0;
        }
        .pc-media-type-icon {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 28px;
          height: 28px;
          background: rgba(0,0,0,0.5);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
        }
        .pc-media-info {
          padding: 12px;
        }
        .pc-media-name {
          display: block;
          font-size: 13px;
          color: #333;
          margin-bottom: 4px;
        }
        .pc-media-size {
          font-size: 12px;
          color: #999;
        }
        .pc-media-tags {
          padding: 0 12px 12px;
          display: flex;
          gap: 4px;
          flex-wrap: wrap;
        }
        .pc-preview-content {
          text-align: center;
        }
        .pc-preview-info {
          margin-top: 20px;
          text-align: left;
          padding: 16px;
          background: #fafafa;
          border-radius: 8px;
        }
        .pc-preview-info-item {
          display: flex;
          margin-bottom: 8px;
        }
        .pc-preview-info-item strong {
          width: 80px;
        }
      `}</style>
    </div>
  );
}
