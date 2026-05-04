import React, { useState, useEffect, useCallback } from 'react';
import '@/assets/styles/pc-global.css';
import { PCLayout } from '@/components/pc/PCLayout';
import { PCTable } from '@/components/pc/PCComponents';
import { PCTag } from '@/components/pc/PCComponents';
import { PCCard } from '@/components/pc/PCComponents';
import { PCToolbar } from '@/components/pc/PCComponents';
import { PCSearchBar } from '@/components/pc/PCComponents';
import { PCModal } from '@/components/pc/PCComponents';
import { PCPagination } from '@/components/pc/PCComponents';

import { getApiBaseUrl } from '@/utils/api';
const API_BASE = getApiBaseUrl();

interface MeetingMinute {
  id: number;
  meeting_name: string;
  meeting_date: string;
  meeting_location?: string;
  attendees?: string;
  recorder?: string;
  topics?: string;
  summary?: string;
  tags?: string[];
  created_at?: string;
  updated_at?: string;
}

export default function PCMeetingMinutes() {
  const [meetings, setMeetings] = useState<MeetingMinute[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<MeetingMinute | null>(null);
  const [formData, setFormData] = useState({
    meeting_name: '',
    meeting_date: '',
    meeting_location: '',
    attendees: '',
    recorder: '',
    topics: '',
    summary: '',
    tags: '',
  });
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  const fetchMeetings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/v1/meeting-minutes`);
      const data = await response.json();
      const list = Array.isArray(data) ? data : (data.meeting_minutes || []);
      const sorted = list.sort((a: MeetingMinute, b: MeetingMinute) => 
        new Date(b.meeting_date || 0).getTime() - new Date(a.meeting_date || 0).getTime()
      );
      setMeetings(sorted);
      setPagination(prev => ({ ...prev, total: sorted.length }));
    } catch (error) {
      console.error('获取会议纪要列表失败:', error);
      setMeetings([
        { id: 1, meeting_name: '项目进度汇报会议', meeting_date: '2024-01-20', meeting_location: '3号会议室', attendees: '张三、李四、王五', recorder: '赵六', topics: '1. 项目进度汇报\n2. 问题讨论\n3. 下阶段计划', summary: '本次会议主要讨论了项目当前进度，各模块负责人分别汇报了工作情况，并就遇到的问题进行了讨论。', tags: ['项目会议', '进度'], created_at: '2024-01-20 18:00:00', updated_at: '2024-01-20 18:30:00' },
        { id: 2, meeting_name: '技术方案评审', meeting_date: '2024-01-18', meeting_location: '2号会议室', attendees: '李工、王工、张工', recorder: '刘工', topics: '1. 新技术方案介绍\n2. 技术可行性讨论', summary: '对新技术方案进行了评审，与会人员一致认为该方案可行，建议尽快推进实施。', tags: ['技术评审'], created_at: '2024-01-18 14:00:00', updated_at: '2024-01-18 16:00:00' },
        { id: 3, meeting_name: '客户需求讨论', meeting_date: '2024-01-15', meeting_location: '视频会议', attendees: '销售部、技术部', recorder: '周经理', topics: '1. 客户新需求分析\n2. 开发周期评估', summary: '针对客户提出的新需求进行了讨论，初步评估了开发周期和资源需求。', tags: ['需求讨论', '客户'], created_at: '2024-01-15 10:00:00', updated_at: '2024-01-15 12:00:00' },
      ]);
      setPagination(prev => ({ ...prev, total: 3 }));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  const handleSearch = () => {
    if (!searchText.trim()) {
      fetchMeetings();
      return;
    }
    const keyword = searchText.toLowerCase();
    const filtered = meetings.filter(m =>
      m.meeting_name.toLowerCase().includes(keyword) ||
      (m.summary && m.summary.toLowerCase().includes(keyword)) ||
      (m.topics && m.topics.toLowerCase().includes(keyword))
    );
    setPagination(prev => ({ ...prev, total: filtered.length }));
  };

  const handleAdd = () => {
    setEditingMeeting(null);
    setFormData({
      meeting_name: '',
      meeting_date: '',
      meeting_location: '',
      attendees: '',
      recorder: '',
      topics: '',
      summary: '',
      tags: '',
    });
    setModalVisible(true);
  };

  const handleEdit = (meeting: MeetingMinute) => {
    setEditingMeeting(meeting);
    setFormData({
      meeting_name: meeting.meeting_name,
      meeting_date: meeting.meeting_date || '',
      meeting_location: meeting.meeting_location || '',
      attendees: meeting.attendees || '',
      recorder: meeting.recorder || '',
      topics: meeting.topics || '',
      summary: meeting.summary || '',
      tags: Array.isArray(meeting.tags) ? meeting.tags.join(', ') : '',
    });
    setModalVisible(true);
  };

  const handleDelete = async (meeting: MeetingMinute) => {
    if (!confirm(`确定删除会议"${meeting.meeting_name}"吗？`)) return;
    try {
      await fetch(`${API_BASE}/api/v1/meeting-minutes/${meeting.id}`, { method: 'DELETE' });
    } catch (error) {
      console.error('删除失败:', error);
    }
    setMeetings(prev => prev.filter(m => m.id !== meeting.id));
    setPagination(prev => ({ ...prev, total: prev.total - 1 }));
  };

  const handleSave = async () => {
    if (!formData.meeting_name.trim()) {
      alert('请输入会议名称');
      return;
    }

    const submitData = {
      ...formData,
      tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    };

    try {
      if (editingMeeting) {
        const response = await fetch(`${API_BASE}/api/v1/meeting-minutes/${editingMeeting.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submitData),
        });
        if (response.ok) {
          setMeetings(prev =>
            prev.map(m => m.id === editingMeeting.id ? { ...m, ...submitData } : m)
          );
        }
      } else {
        const response = await fetch(`${API_BASE}/api/v1/meeting-minutes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submitData),
        });
        if (response.ok) {
          const newMeeting: MeetingMinute = {
            id: Date.now(),
            ...submitData,
            created_at: new Date().toLocaleString(),
            updated_at: new Date().toLocaleString(),
          };
          setMeetings(prev => [...prev, newMeeting]);
          setPagination(prev => ({ ...prev, total: prev.total + 1 }));
        }
      }
    } catch (error) {
      console.error('保存失败:', error);
    }
    setModalVisible(false);
  };

  const columns = [
    { key: 'meeting_name', title: '会议名称', width: 180 },
    { key: 'meeting_date', title: '会议日期', width: 100 },
    { key: 'meeting_location', title: '会议地点', width: 100 },
    { key: 'attendees', title: '参会人员', width: 150 },
    { key: 'recorder', title: '记录人', width: 80 },
    { 
      key: 'topics', 
      title: '议题', 
      width: 200,
      render: (val: string) => val ? <div style={{ maxHeight: 60, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{val.replace(/\n/g, ' | ')}</div> : '-'
    },
    { 
      key: 'summary', 
      title: '会议总结', 
      width: 250,
      render: (val: string) => val ? <div style={{ maxHeight: 60, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{val}</div> : '-'
    },
    {
      key: 'tags',
      title: '标签',
      width: 120,
      render: (val: string[]) => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {Array.isArray(val) && val.map((tag, i) => (
            <span key={i} style={{ background: '#E6F7FF', color: '#1890FF', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>{tag}</span>
          ))}
        </div>
      ),
    },
    { key: 'created_at', title: '创建时间', width: 150 },
    {
      key: 'actions',
      title: '操作',
      width: 140,
      render: (_: any, record: MeetingMinute) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="pc-btn pc-btn-text pc-btn-sm" onClick={() => handleEdit(record)}>编辑</button>
          <button className="pc-btn pc-btn-text pc-btn-sm" style={{ color: '#FF4D4F' }} onClick={() => handleDelete(record)}>删除</button>
        </div>
      ),
    },
  ];

  return (
    <>
      
      <PCLayout>
        <div className="pc-page-header">
          <h1 className="pc-page-title">会议纪要</h1>
          <p className="pc-page-description">管理所有会议纪要，包括会议名称、议题、参会人员、会议总结、标签等完整信息</p>
        </div>

        <PCCard>
          <PCToolbar
            left={
              <PCSearchBar
                placeholder="搜索会议名称、会议总结或议题..."
                value={searchText}
                onChange={setSearchText}
                onSearch={handleSearch}
              />
            }
            right={
              <button className="pc-btn pc-btn-primary" onClick={handleAdd}>
                + 新增会议纪要
              </button>
            }
          />

          <PCTable
            columns={columns}
            data={meetings}
            rowKey="id"
            loading={loading}
          />

          <PCPagination
            current={pagination.current}
            pageSize={pagination.pageSize}
            total={pagination.total}
            onChange={(page) => setPagination(prev => ({ ...prev, current: page }))}
          />
        </PCCard>

        <PCModal
          visible={modalVisible}
          title={editingMeeting ? '编辑会议纪要' : '新增会议纪要'}
          onClose={() => setModalVisible(false)}
          width={700}
          footer={
            <>
              <button className="pc-btn pc-btn-default" onClick={() => setModalVisible(false)}>取消</button>
              <button className="pc-btn pc-btn-primary" onClick={handleSave}>保存</button>
            </>
          }
        >
          <div className="pc-form">
            <div className="pc-form-item">
              <label className="pc-form-label required">会议名称</label>
              <input
                type="text"
                className="pc-form-control"
                placeholder="请输入会议名称"
                value={formData.meeting_name}
                onChange={e => setFormData(prev => ({ ...prev, meeting_name: e.target.value }))}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="pc-form-item">
                <label className="pc-form-label">会议日期</label>
                <input
                  type="date"
                  className="pc-form-control"
                  value={formData.meeting_date}
                  onChange={e => setFormData(prev => ({ ...prev, meeting_date: e.target.value }))}
                />
              </div>
              <div className="pc-form-item">
                <label className="pc-form-label">会议地点</label>
                <input
                  type="text"
                  className="pc-form-control"
                  placeholder="请输入会议地点"
                  value={formData.meeting_location}
                  onChange={e => setFormData(prev => ({ ...prev, meeting_location: e.target.value }))}
                />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="pc-form-item">
                <label className="pc-form-label">参会人员</label>
                <input
                  type="text"
                  className="pc-form-control"
                  placeholder="请输入参会人员，多人以逗号分隔"
                  value={formData.attendees}
                  onChange={e => setFormData(prev => ({ ...prev, attendees: e.target.value }))}
                />
              </div>
              <div className="pc-form-item">
                <label className="pc-form-label">记录人</label>
                <input
                  type="text"
                  className="pc-form-control"
                  placeholder="请输入记录人"
                  value={formData.recorder}
                  onChange={e => setFormData(prev => ({ ...prev, recorder: e.target.value }))}
                />
              </div>
            </div>
            <div className="pc-form-item">
              <label className="pc-form-label">议题</label>
              <textarea
                className="pc-form-control pc-form-textarea"
                rows={4}
                placeholder="请输入会议议题，每行一个议题"
                value={formData.topics}
                onChange={e => setFormData(prev => ({ ...prev, topics: e.target.value }))}
              />
            </div>
            <div className="pc-form-item">
              <label className="pc-form-label">会议总结</label>
              <textarea
                className="pc-form-control pc-form-textarea"
                rows={4}
                placeholder="请输入会议总结"
                value={formData.summary}
                onChange={e => setFormData(prev => ({ ...prev, summary: e.target.value }))}
              />
            </div>
            <div className="pc-form-item">
              <label className="pc-form-label">标签</label>
              <input
                type="text"
                className="pc-form-control"
                placeholder="请输入标签，多个标签以逗号分隔"
                value={formData.tags}
                onChange={e => setFormData(prev => ({ ...prev, tags: e.target.value }))}
              />
            </div>
          </div>
        </PCModal>
      </PCLayout>
    </>
  );
}
