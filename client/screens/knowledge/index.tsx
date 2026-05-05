import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Modal, ActivityIndicator } from 'react-native';
import { Screen } from '@/components/Screen';
import { FontAwesome6 } from '@expo/vector-icons';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { getApiBaseUrl } from '@/utils/api';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';

export default function KnowledgeScreen() {
  const [knowledgeList, setKnowledgeList] = useState<any[]>([]);
  const [searchText, setSearchText] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingKnowledge, setEditingKnowledge] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    content: '',
    tags: '',
  });
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importFile, setImportFile] = useState<any>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null);
  const router = useSafeRouter();

  useEffect(() => {
    fetchKnowledge();
  }, []);

  const fetchKnowledge = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/v1/knowledge`);
      const data = await response.json();
      // 支持两种格式：直接数组 或 { code, data, message }
      if (Array.isArray(data)) {
        setKnowledgeList(data);
      } else if (data.data && Array.isArray(data.data)) {
        setKnowledgeList(data.data);
      }
    } catch (error) {
      console.error('Fetch knowledge error:', error);
    }
  };

  const handleAdd = () => {
    setEditingKnowledge(null);
    setFormData({ title: '', category: '', content: '', tags: '' });
    setModalVisible(true);
  };

  const handleEdit = (knowledge: any) => {
    setEditingKnowledge(knowledge);
    setFormData({
      title: knowledge.title,
      category: knowledge.category || '',
      content: knowledge.content,
      tags: Array.isArray(knowledge.tags) ? knowledge.tags.join(', ') : '',
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.content) {
      Alert.alert('提示', '标题和内容不能为空');
      return;
    }

    try {
      const url = editingKnowledge
        ? `${getApiBaseUrl()}/api/v1/knowledge/${editingKnowledge.id}`
        : `${getApiBaseUrl()}/api/v1/knowledge`;

      const method = editingKnowledge ? 'PUT' : 'POST';

      const author_id = 1;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          tags: formData.tags ? formData.tags.split(',').map((t) => t.trim()) : [],
          author_id: editingKnowledge ? undefined : author_id,
        }),
      });

      if (!response.ok) {
        throw new Error('保存失败');
      }

      setModalVisible(false);
      fetchKnowledge();
      Alert.alert('成功', editingKnowledge ? '知识更新成功' : '知识创建成功');
    } catch (error: any) {
      Alert.alert('错误', error.message);
    }
  };

  const handleImport = async () => {
    try {
      const file = await DocumentPicker.getDocumentAsync({
        type: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'],
      });

      if (file.canceled || !file.assets?.[0]) {
        return;
      }

      const selectedFile = file.assets[0];
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

          if (jsonData.length === 0) {
            Alert.alert('提示', '导入文件中没有数据');
            return;
          }

          const knowledgeList = jsonData.map((row) => ({
            title: row['标题'] || row['title'] || '',
            category: row['分类'] || row['category'] || '',
            tags: row['标签'] || row['tags'] || '',
            content: row['内容'] || row['content'] || '',
            author_id: 1,
          })).filter((item) => item.title && item.content);

          if (knowledgeList.length === 0) {
            Alert.alert('提示', '没有有效的知识数据（标题和内容不能为空）');
            return;
          }

          const sessionId = await AsyncStorage.getItem('session_id');
          const response = await fetch(`${getApiBaseUrl()}/api/v1/knowledge/batch`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${sessionId}`,
            },
            body: JSON.stringify({ knowledge: knowledgeList }),
          });

          const result = await response.json();
          if (result.success) {
            Alert.alert('成功', `成功导入 ${result.count || knowledgeList.length} 条知识`);
            setImportModalVisible(false);
            fetchKnowledge();
          } else {
            Alert.alert('错误', result.message || '导入失败');
          }
        } catch (error: any) {
          Alert.alert('错误', '解析Excel文件失败: ' + error.message);
        }
      };

      reader.readAsArrayBuffer(selectedFile);
    } catch (error: any) {
      Alert.alert('错误', '选择文件失败: ' + error.message);
    }
  };

  const handleFilePick = async () => {
    handleImport();
  };

  const handleDelete = (id: number) => {
    Alert.alert('确认', '确定要删除此知识吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            const response = await fetch(
              `${getApiBaseUrl()}/api/v1/knowledge/${id}`,
              { method: 'DELETE' }
            );

            if (!response.ok) {
              throw new Error('删除失败');
            }

            fetchKnowledge();
            Alert.alert('成功', '知识删除成功');
          } catch (error: any) {
            Alert.alert('错误', error.message);
          }
        },
      },
    ]);
  };

  const handleSearch = async () => {
    if (!searchText) {
      fetchKnowledge();
      return;
    }

    try {
      const response = await fetch(
        `${getApiBaseUrl()}/api/v1/knowledge/search/${searchText}`
      );
      const data = await response.json();
      // 支持两种格式：直接数组 或 { code, data, message }
      if (Array.isArray(data)) {
        setKnowledgeList(data);
      } else if (data.data && Array.isArray(data.data)) {
        setKnowledgeList(data.data);
      }
    } catch (error) {
      console.error('Search knowledge error:', error);
    }
  };

  const filteredKnowledge = knowledgeList.filter((k) =>
    k.title.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <Screen>
      <View style={{ flex: 1 }}>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          {/* Header */}
          <View className="px-6 pt-8 pb-4">
            <Text className="text-3xl font-bold text-[#2D3436] mb-2">
              知识库
            </Text>
            <Text className="text-sm text-[#636E72]">
              共 {knowledgeList.length} 条知识
            </Text>
          </View>

          {/* 搜索框 */}
          <View className="px-6 mb-4">
            <View
              className="bg-[#E8E8EB] rounded-2xl px-4 py-3 flex-row items-center"
              style={{ borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)' }}
            >
              <FontAwesome6 name="magnifying-glass" size={18} color="#B2BEC3" />
              <TextInput
                className="flex-1 ml-3 text-[#2D3436] text-base"
                placeholder="搜索知识..."
                placeholderTextColor="#B2BEC3"
                value={searchText}
                onChangeText={setSearchText}
                onSubmitEditing={handleSearch}
              />
              <TouchableOpacity onPress={handleSearch} className="p-2">
                <FontAwesome6 name="magnifying-glass" size={18} color="#6C63FF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* 知识列表 */}
          <View className="px-6">
            {filteredKnowledge.map((knowledge) => (
              <View key={knowledge.id} className="mb-4">
                <View
                  className="rounded-3xl p-5 shadow-lg"
                  style={{
                    backgroundColor: '#F0F0F3',
                    shadowColor: '#D1D9E6',
                    shadowOffset: { width: 6, height: 6 },
                    shadowOpacity: 0.7,
                    shadowRadius: 8,
                    elevation: 6,
                  }}
                >
                  <View className="flex-row items-start mb-3">
                    <View
                      className="w-12 h-12 rounded-full items-center justify-center mr-3"
                      style={{ backgroundColor: 'rgba(108, 99, 255, 0.12)' }}
                    >
                      <FontAwesome6 name="book" size={20} color="#6C63FF" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-bold text-[#2D3436] mb-1">
                        {knowledge.title}
                      </Text>
                      {knowledge.category && (
                        <View
                          className="px-2 py-1 rounded-full self-start"
                          style={{ backgroundColor: 'rgba(108, 99, 255, 0.1)' }}
                        >
                          <Text className="text-xs font-semibold text-[#6C63FF]">
                            {knowledge.category}
                          </Text>
                        </View>
                      )}
                    </View>
                    <TouchableOpacity
                      onPress={() => handleEdit(knowledge)}
                      className="p-2"
                    >
                      <FontAwesome6 name="pen" size={18} color="#6C63FF" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDelete(knowledge.id)}
                      className="p-2"
                    >
                      <FontAwesome6 name="trash" size={18} color="#FF6B6B" />
                    </TouchableOpacity>
                  </View>
                  <Text className="text-sm text-[#636E72] mb-3" numberOfLines={2}>
                    {knowledge.content}
                  </Text>
                  <View className="flex-row justify-between items-center">
                    <Text className="text-xs text-[#B2BEC3]">
                      {knowledge.author_name}
                    </Text>
                    <View className="flex-row items-center">
                      <FontAwesome6 name="eye" size={14} color="#B2BEC3" />
                      <Text className="text-xs text-[#B2BEC3] ml-1">
                        {knowledge.views}
                      </Text>
                    </View>
                  </View>
                  {Array.isArray(knowledge.tags) && knowledge.tags.length > 0 && (
                    <View className="flex-row flex-wrap mt-3 gap-2">
                      {knowledge.tags.map((tag: string, index: number) => (
                        <View
                          key={index}
                          className="px-2 py-1 rounded"
                          style={{ backgroundColor: 'rgba(178, 190, 195, 0.2)' }}
                        >
                          <Text className="text-xs text-[#636E72]">{tag}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* 新增按钮 */}
        <TouchableOpacity
          onPress={handleAdd}
          className="absolute bottom-6 right-6"
          style={{
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: '#6C63FF',
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: '#6C63FF',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.35,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <FontAwesome6 name="plus" size={26} color="#FFFFFF" />
        </TouchableOpacity>

        {/* 导入按钮 */}
        <TouchableOpacity
          onPress={() => setImportModalVisible(true)}
          className="absolute bottom-6 left-6"
          style={{
            width: 50,
            height: 50,
            borderRadius: 25,
            backgroundColor: '#00B894',
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: '#00B894',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.35,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <FontAwesome6 name="file-import" size={20} color="#FFFFFF" />
        </TouchableOpacity>

        {/* 导入 Modal */}
        {importModalVisible && (
          <Modal visible={importModalVisible} transparent animationType="slide">
            <View className="flex-1 bg-black/50 justify-center items-center px-6">
              <View className="w-full rounded-3xl p-6 bg-[#F0F0F3]">
                <View className="flex-row justify-between items-center mb-6">
                  <Text className="text-xl font-bold text-[#2D3436]">批量导入知识</Text>
                  <TouchableOpacity onPress={() => setImportModalVisible(false)}>
                    <FontAwesome6 name="times" size={22} color="#636E72" />
                  </TouchableOpacity>
                </View>

                <View className="mb-4 p-4 bg-[#E8E8EB] rounded-2xl">
                  <Text className="text-sm text-[#636E72] mb-2">导入说明：</Text>
                  <Text className="text-xs text-[#636E72] mb-1">• 支持 .xlsx, .xls 格式</Text>
                  <Text className="text-xs text-[#636E72] mb-1">• 必填字段：标题(title)、内容(content)</Text>
                  <Text className="text-xs text-[#636E72]">• 选填字段：分类(category)、标签(tags)、作者(author_name)</Text>
                </View>

                <TouchableOpacity
                  onPress={handleDownloadTemplate}
                  className="mb-4 p-4 border-2 border-dashed border-[#6C63FF] rounded-2xl items-center"
                >
                  <FontAwesome6 name="file-download" size={28} color="#6C63FF" />
                  <Text className="text-sm text-[#6C63FF] mt-2">下载导入模板</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleImport}
                  className="mb-4 p-4 border-2 border-dashed border-[#00B894] rounded-2xl items-center"
                >
                  <FontAwesome6 name="upload" size={28} color="#00B894" />
                  <Text className="text-sm text-[#00B894] mt-2">选择Excel文件导入</Text>
                </TouchableOpacity>

                {importLoading && (
                  <View className="items-center py-4">
                    <ActivityIndicator size="large" color="#6C63FF" />
                    <Text className="text-sm text-[#636E72] mt-2">正在导入...</Text>
                  </View>
                )}

                {importResult && (
                  <View className={`p-4 rounded-2xl ${importResult.success ? 'bg-green-100' : 'bg-red-100'}`}>
                    <Text className={`text-sm font-medium ${importResult.success ? 'text-green-700' : 'text-red-700'}`}>
                      {importResult.success ? `导入成功！共 ${importResult.success} 条` : `导入失败：${importResult.error}`}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </Modal>
        )}

        {/* 编辑/新增 Modal */}
        {modalVisible && (
          <Modal visible={modalVisible} transparent animationType="slide">
            <View className="flex-1 bg-black/50 justify-center items-center px-6">
              <ScrollView
                className="w-full"
                contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
              >
                <View
                  className="w-full rounded-3xl p-6"
                  style={{ backgroundColor: '#F0F0F3' }}
                >
                  <Text className="text-xl font-bold text-[#2D3436] mb-6">
                    {editingKnowledge ? '编辑知识' : '新增知识'}
                  </Text>

                  <View className="mb-4">
                    <Text className="text-sm font-medium text-[#636E72] mb-2 ml-1">
                      标题 *
                    </Text>
                    <TextInput
                      className="w-full bg-[#E8E8EB] rounded-2xl px-4 py-3 text-[#2D3436] text-base"
                      placeholder="请输入标题"
                      placeholderTextColor="#B2BEC3"
                      value={formData.title}
                      onChangeText={(text) => setFormData({ ...formData, title: text })}
                    />
                  </View>

                  <View className="mb-4">
                    <Text className="text-sm font-medium text-[#636E72] mb-2 ml-1">
                      分类
                    </Text>
                    <TextInput
                      className="w-full bg-[#E8E8EB] rounded-2xl px-4 py-3 text-[#2D3436] text-base"
                      placeholder="请输入分类"
                      placeholderTextColor="#B2BEC3"
                      value={formData.category}
                      onChangeText={(text) => setFormData({ ...formData, category: text })}
                    />
                  </View>

                  <View className="mb-4">
                    <Text className="text-sm font-medium text-[#636E72] mb-2 ml-1">
                      内容 *
                    </Text>
                    <TextInput
                      className="w-full bg-[#E8E8EB] rounded-2xl px-4 py-3 text-[#2D3436] text-base"
                      placeholder="请输入内容"
                      placeholderTextColor="#B2BEC3"
                      value={formData.content}
                      onChangeText={(text) => setFormData({ ...formData, content: text })}
                      multiline
                      numberOfLines={6}
                      textAlignVertical="top"
                    />
                  </View>

                  <View className="mb-6">
                    <Text className="text-sm font-medium text-[#636E72] mb-2 ml-1">
                      标签（用逗号分隔）
                    </Text>
                    <TextInput
                      className="w-full bg-[#E8E8EB] rounded-2xl px-4 py-3 text-[#2D3436] text-base"
                      placeholder="请输入标签，如：维修,保养"
                      placeholderTextColor="#B2BEC3"
                      value={formData.tags}
                      onChangeText={(text) => setFormData({ ...formData, tags: text })}
                    />
                  </View>

                  <View className="flex-row gap-3">
                    <TouchableOpacity
                      onPress={() => setModalVisible(false)}
                      className="flex-1 py-4 rounded-full items-center"
                      style={{ backgroundColor: '#E8E8EB' }}
                    >
                      <Text className="text-[#636E72] font-semibold text-base">取消</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleSave}
                      className="flex-1 py-4 rounded-full items-center"
                      style={{ backgroundColor: '#6C63FF' }}
                    >
                      <Text className="text-white font-semibold text-base">保存</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            </View>
          </Modal>
        )}
      </View>
    </Screen>
  );
}
