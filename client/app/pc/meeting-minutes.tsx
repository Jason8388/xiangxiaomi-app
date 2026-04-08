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

const API_BASE = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || 'http://localhost:9091';

interface Meeting {
  id: number;
  title: string;
  meeting_date: string;
  attendees: string[];
  location: string;
  summary: string;
  tasks: string[];
  creator: string;
  created_at: string;
}

export default function PCMeetingMinutes() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [searchText, setSearchText] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [viewMeeting, setViewMeeting] = useState<Meeting | null>(null);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [formData, setFormData] = useState({ title: '', meeting_date: '', attendees: '', location: '', summary: '', tasks: '' });
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  const fetchMeetings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/v1/meeting-minutes`);
      const data = await response.json();
      const list = Array.isArray(data) ? data : (data.meetings || []);
      setMeetings(list);
      setPagination(prev => ({ ...prev, total: list.length }));
    } catch (error) {
      setMeetings([
        { id: 1, title: '项目进度周例会', meeting_date: '2024-03-20', attendees: ['张三', '李四', '王五'], location: '会议室A', summary: '讨论了项目当前进度及存在的问题...', tasks: ['完成模块A开发', '修复测试发现的问题'], creator: '张三', created_at: '2024-03-20' },
        { id: 2, title: '客户需求评审会', meeting_date: '2024-03-18', attendees: ['张三', '李四'], location: '会议室B', summary: '评审了客户新提出的功能需求...', tasks: ['编写需求文档', '安排技术评估'], creator: '李四', created_at: '2024-03-18' },
        { id: 3, title: '技术方案评审会', meeting_date: '2024-03-15', attendees: ['王五', '赵六'], location: '会议室A', summary: '对技术方案进行了详细评审...', tasks: ['优化数据库设计', '完善接口文档'], creator: '王五', created_at: '2024-03-15' },
      ]);
      setPagination(prev => ({ ...prev, total: 3 }));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMeetings(); }, [fetchMeetings]);

  const columns = [
    { key: 'title', title: '会议主题', width: 200 },
    { key: 'meeting_date', title: '会议日期', width: 100 },
    { key: 'location', title: '地点', width: 80 },
    { key: 'attendees', title: '参会人', width: 150, render: (val: string[]) => val?.join(', ') },
    { key: 'creator', title: '记录人', width: 80 },
    { key: 'created_at', title: '创建时间', width: 100 },
    { key: 'actions', title: '操作', width: 180, render: (_: any, record: Meeting) => (
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="pc-btn pc-btn-text pc-btn-sm" onClick={() => setViewMeeting(record)}>查看</button>
        <button className="pc-btn pc-btn-text pc-btn-sm" onClick={() => { setEditingMeeting(record); setFormData({ title: record.title, meeting_date: record.meeting_date, attendees: record.attendees.join(','), location: record.location, summary: record.summary, tasks: record.tasks.join('\n') }); setModalVisible(true); }}>编辑</button>
        <button className="pc-btn pc-btn-text pc-btn-sm" style={{ color: '#FF4D4F' }} onClick={() => { if (confirm('确定删除吗？')) setMeetings(prev => prev.filter(m => m.id !== record.id)); }}>删除</button>
      </div>
    ) },
  ];

  const filteredMeetings = meetings.filter(m => !searchText || m.title.includes(searchText) || m.summary.includes(searchText));

  return (
    <>
      
      <PCLayout>
        <div className="pc-page-header"><h1 className="pc-page-title">会议纪要</h1><p className="pc-page-description">记录和管理各类会议纪要，包括参会人员、会议内容和待办事项</p></div>
        <PCCard>
          <PCToolbar left={<PCSearchBar placeholder="搜索会议纪要..." value={searchText} onChange={setSearchText} onSearch={() => {}} />} right={<button className="pc-btn pc-btn-primary" onClick={() => { setEditingMeeting(null); setFormData({ title: '', meeting_date: '', attendees: '', location: '', summary: '', tasks: '' }); setModalVisible(true); }}>+ 新建会议纪要</button>} />
          <PCTable columns={columns} data={filteredMeetings} rowKey="id" loading={loading} selectedRowKeys={selectedRowKeys} onSelectChange={setSelectedRowKeys} />
          <PCPagination current={pagination.current} pageSize={pagination.pageSize} total={pagination.total} onChange={(page) => setPagination(prev => ({ ...prev, current: page }))} />
        </PCCard>

        {/* 查看详情 */}
        <PCModal visible={!!viewMeeting} title={viewMeeting?.title || ''} onClose={() => setViewMeeting(null)} width={700}
          footer={<button className="pc-btn pc-btn-default" onClick={() => setViewMeeting(null)}>关闭</button>}
        >
          {viewMeeting && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                <div><span style={{ color: '#999' }}>会议日期：</span>{viewMeeting.meeting_date}</div>
                <div><span style={{ color: '#999' }}>会议地点：</span>{viewMeeting.location}</div>
                <div><span style={{ color: '#999' }}>参会人员：</span>{viewMeeting.attendees.join(', ')}</div>
                <div><span style={{ color: '#999' }}>记录人：</span>{viewMeeting.creator}</div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>会议内容</div>
                <div style={{ color: '#333', lineHeight: 1.8 }}>{viewMeeting.summary}</div>
              </div>
              {viewMeeting.tasks?.length > 0 && (
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>待办事项</div>
                  <ul style={{ paddingLeft: 20, color: '#333' }}>
                    {viewMeeting.tasks.map((task, i) => <li key={i}>{task}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </PCModal>

        {/* 编辑弹窗 */}
        <PCModal visible={modalVisible} title={editingMeeting ? '编辑会议纪要' : '新建会议纪要'} onClose={() => setModalVisible(false)} width={600}
          footer={<><button className="pc-btn pc-btn-default" onClick={() => setModalVisible(false)}>取消</button><button className="pc-btn pc-btn-primary" onClick={() => { const newMeeting = { ...formData, attendees: formData.attendees.split(',').map(s => s.trim()).filter(s => s), tasks: formData.tasks.split('\n').filter(s => s.trim()) }; if (editingMeeting) { setMeetings(prev => prev.map(m => m.id === editingMeeting.id ? { ...m, ...newMeeting } : m)); } else { setMeetings(prev => [...prev, { id: Date.now(), ...newMeeting, creator: '管理员', created_at: new Date().toISOString().split('T')[0] }]); setPagination(prev => ({ ...prev, total: prev.total + 1 })); } setModalVisible(false); }}>保存</button></>}
        >
          <div className="pc-form">
            <div className="pc-form-item"><label className="pc-form-label required">会议主题</label><input type="text" className="pc-form-control" value={formData.title} onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="pc-form-item"><label className="pc-form-label">会议日期</label><input type="date" className="pc-form-control" value={formData.meeting_date} onChange={e => setFormData(prev => ({ ...prev, meeting_date: e.target.value }))} /></div>
              <div className="pc-form-item"><label className="pc-form-label">会议地点</label><input type="text" className="pc-form-control" value={formData.location} onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))} /></div>
            </div>
            <div className="pc-form-item"><label className="pc-form-label">参会人员</label><input type="text" className="pc-form-control" placeholder="多个用逗号分隔" value={formData.attendees} onChange={e => setFormData(prev => ({ ...prev, attendees: e.target.value }))} /></div>
            <div className="pc-form-item"><label className="pc-form-label">会议内容</label><textarea className="pc-form-control pc-form-textarea" rows={4} value={formData.summary} onChange={e => setFormData(prev => ({ ...prev, summary: e.target.value }))} /></div>
            <div className="pc-form-item"><label className="pc-form-label">待办事项</label><textarea className="pc-form-control pc-form-textarea" rows={3} placeholder="每行一个待办" value={formData.tasks} onChange={e => setFormData(prev => ({ ...prev, tasks: e.target.value }))} /></div>
          </div>
        </PCModal>
      </PCLayout>
    </>
  );
}
