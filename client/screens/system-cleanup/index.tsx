import { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import * as FileSystem from 'expo-file-system/legacy';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';

type StorageInfo = {
  totalSpace: number;
  usedSpace: number;
  freeSpace: number;
};

type FileTypeStat = {
  type: string;
  count: number;
  totalSize: number;
};

type CleanupFile = {
  name: string;
  path: string;
  size: number;
  type: string;
  canDelete: boolean;
};

export default function SystemCleanupScreen() {
  const router = useSafeRouter();

  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [fileTypeStats, setFileTypeStats] = useState<FileTypeStat[]>([]);
  const [cleanupFiles, setCleanupFiles] = useState<CleanupFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [isScanning, setIsScanning] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);

  // 格式化文件大小
  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  // 获取存储空间信息
  const getStorageInfo = async () => {
    try {
      const diskInfo = await FileSystem.getFreeDiskStorageAsync();
      const totalDiskInfo = await FileSystem.getTotalDiskCapacityAsync();

      // 估算已使用空间（这里使用计算方式）
      const usedSpace = Math.max(0, totalDiskInfo - diskInfo);

      setStorageInfo({
        totalSpace: totalDiskInfo,
        usedSpace: usedSpace,
        freeSpace: diskInfo,
      });
    } catch (error) {
      console.error('Failed to get storage info:', error);
      Alert.alert('错误', '获取存储空间信息失败');
    }
  };

  // 扫描系统文件
  const scanSystem = useCallback(async () => {
    setIsScanning(true);
    setCleanupFiles([]);
    setFileTypeStats([]);
    setSelectedFiles(new Set());

    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/system-cleanup/scan`, {
        method: 'POST',
      });
      const result = await response.json();

      if (result.code === 200) {
        setStorageInfo(result.data.storageInfo);
        setFileTypeStats(result.data.fileTypeStats);
        setCleanupFiles(result.data.cleanupFiles);
      } else {
        Alert.alert('扫描失败', result.message || '系统扫描失败');
      }
    } catch (error) {
      console.error('Scan error:', error);
      Alert.alert('错误', '系统扫描失败');
    } finally {
      setIsScanning(false);
    }
  }, []);

  // 选择/取消选择文件
  const toggleFileSelection = (filePath: string) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(filePath)) {
      newSelected.delete(filePath);
    } else {
      newSelected.add(filePath);
    }
    setSelectedFiles(newSelected);
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    const deletableFiles = cleanupFiles.filter((f) => f.canDelete);
    if (selectedFiles.size === deletableFiles.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(deletableFiles.map((f) => f.path)));
    }
  };

  // 清理选中的文件
  const cleanupSelected = async () => {
    if (selectedFiles.size === 0) {
      Alert.alert('提示', '请先选择要清理的文件');
      return;
    }

    Alert.alert(
      '确认清理',
      `确定要清理选中的 ${selectedFiles.size} 个文件吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          style: 'destructive',
          onPress: async () => {
            setIsCleaning(true);
            try {
              const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/system-cleanup/clean`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ files: Array.from(selectedFiles) }),
              });
              const result = await response.json();

              if (result.code === 200) {
                Alert.alert(
                  '清理完成',
                  `已清理 ${result.data.cleanedCount} 个文件，释放 ${formatSize(result.data.freedSpace)} 空间`,
                );
                // 重新扫描
                await scanSystem();
              } else {
                Alert.alert('清理失败', result.message || '清理失败');
              }
            } catch (error) {
              console.error('Cleanup error:', error);
              Alert.alert('错误', '清理失败');
            } finally {
              setIsCleaning(false);
            }
          },
        },
      ],
    );
  };

  // 清理所有可清理文件
  const cleanupAll = async () => {
    const deletableFiles = cleanupFiles.filter((f) => f.canDelete);
    if (deletableFiles.length === 0) {
      Alert.alert('提示', '没有可清理的文件');
      return;
    }

    Alert.alert(
      '确认清理',
      `确定要清理所有 ${deletableFiles.length} 个可清理文件吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          style: 'destructive',
          onPress: async () => {
            setIsCleaning(true);
            try {
              const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/system-cleanup/clean-all`, {
                method: 'POST',
              });
              const result = await response.json();

              if (result.code === 200) {
                Alert.alert(
                  '清理完成',
                  `已清理 ${result.data.cleanedCount} 个文件，释放 ${formatSize(result.data.freedSpace)} 空间`,
                );
                // 重新扫描
                await scanSystem();
              } else {
                Alert.alert('清理失败', result.message || '清理失败');
              }
            } catch (error) {
              console.error('Cleanup error:', error);
              Alert.alert('错误', '清理失败');
            } finally {
              setIsCleaning(false);
            }
          },
        },
      ],
    );
  };

  // 获取文件类型图标
  const getFileTypeIcon = (type: string): string => {
    const icons: { [key: string]: string } = {
      'image': 'image',
      'video': 'video',
      'audio': 'music',
      'document': 'file-alt',
      'archive': 'archive',
      'cache': 'broom',
      'temp': 'clock',
      'other': 'file',
    };
    return icons[type] || 'file';
  };

  // 获取文件类型颜色
  const getFileTypeColor = (type: string): string => {
    const colors: { [key: string]: string } = {
      'image': '#FF9500',
      'video': '#FF3B30',
      'audio': '#AF52DE',
      'document': '#007AFF',
      'archive': '#FF9500',
      'cache': '#8E8E93',
      'temp': '#8E8E93',
      'other': '#8E8E93',
    };
    return colors[type] || '#8E8E93';
  };

  const deletableFiles = cleanupFiles.filter((f) => f.canDelete);
  const selectedSize = cleanupFiles.filter((f) => selectedFiles.has(f.path)).reduce((sum, f) => sum + f.size, 0);
  const deletableSize = deletableFiles.reduce((sum, f) => sum + f.size, 0);

  return (
    <Screen>
      <SafeAreaView className="flex-1 bg-gray-50">
        {/* 标题栏 */}
        <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
          <TouchableOpacity onPress={() => router.back()} className="p-2">
            <FontAwesome5 name="arrow-left" size={20} color="#1f2937" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-gray-900">系统清理</Text>
          <View className="w-10" />
        </View>

        <ScrollView className="flex-1 p-4">
          {/* 存储空间信息卡片 */}
          <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
            <Text className="text-base font-bold text-gray-900 mb-3">存储空间</Text>

            {storageInfo ? (
              <View>
                {/* 总空间 */}
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-sm text-gray-600">总空间</Text>
                  <Text className="text-sm font-bold text-gray-900">{formatSize(storageInfo.totalSpace)}</Text>
                </View>

                {/* 已用空间 */}
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-sm text-gray-600">已用空间</Text>
                  <Text className="text-sm font-bold text-blue-600">{formatSize(storageInfo.usedSpace)}</Text>
                </View>

                {/* 可用空间 */}
                <View className="flex-row justify-between items-center mb-3">
                  <Text className="text-sm text-gray-600">可用空间</Text>
                  <Text className="text-sm font-bold text-green-600">{formatSize(storageInfo.freeSpace)}</Text>
                </View>

                {/* 进度条 */}
                <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <View
                    className="h-full bg-blue-600 rounded-full"
                    style={{
                      width: `${((storageInfo.usedSpace / storageInfo.totalSpace) * 100).toFixed(1)}%`,
                    }}
                  />
                </View>
                <Text className="text-xs text-gray-500 mt-1 text-right">
                  {((storageInfo.usedSpace / storageInfo.totalSpace) * 100).toFixed(1)}%
                </Text>
              </View>
            ) : (
              <View className="py-4">
                <Text className="text-center text-gray-500 text-sm">点击"开始扫描"查看存储空间信息</Text>
              </View>
            )}
          </View>

          {/* 文件类型统计 */}
          {fileTypeStats.length > 0 && (
            <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
              <Text className="text-base font-bold text-gray-900 mb-3">文件类型统计</Text>
              {fileTypeStats.map((stat, index) => (
                <View key={index} className="flex-row items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <View className="flex-row items-center flex-1">
                    <FontAwesome5
                      name={getFileTypeIcon(stat.type) as any}
                      size={18}
                      color={getFileTypeColor(stat.type)}
                      className="mr-2"
                    />
                    <Text className="text-sm text-gray-700 capitalize">{stat.type}</Text>
                  </View>
                  <View className="flex-row items-center">
                    <Text className="text-sm text-gray-600 mr-4">{stat.count} 个文件</Text>
                    <Text className="text-sm font-bold text-gray-900">{formatSize(stat.totalSize)}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* 可清理文件 */}
          {cleanupFiles.length > 0 && (
            <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-base font-bold text-gray-900">可清理文件</Text>
                <TouchableOpacity onPress={toggleSelectAll} className="px-3 py-1 bg-blue-100 rounded-full">
                  <Text className="text-xs text-blue-600">
                    {selectedFiles.size === deletableFiles.length ? '取消全选' : '全选'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View className="mb-3 p-3 bg-orange-50 rounded-lg">
                <Text className="text-sm text-orange-700">
                  可清理 {deletableFiles.length} 个文件，释放 {formatSize(deletableSize)}
                </Text>
              </View>

              {cleanupFiles.map((file, index) => (
                <View
                  key={index}
                  className={`flex-row items-center justify-between py-3 border-b border-gray-100 last:border-0 ${
                    !file.canDelete ? 'opacity-50' : ''
                  }`}
                >
                  <TouchableOpacity
                    onPress={() => file.canDelete && toggleFileSelection(file.path)}
                    className="flex-row items-center flex-1"
                    disabled={!file.canDelete}
                  >
                    {file.canDelete && (
                      <FontAwesome5
                        name={selectedFiles.has(file.path) ? 'check-circle' : 'circle'}
                        size={20}
                        color={selectedFiles.has(file.path) ? '#007AFF' : '#D1D5DB'}
                        className="mr-3"
                      />
                    )}
                    <View className="flex-1">
                      <Text className="text-sm text-gray-900 mb-1">{file.name}</Text>
                      <View className="flex-row items-center">
                        <FontAwesome5
                          name={getFileTypeIcon(file.type) as any}
                          size={12}
                          color={getFileTypeColor(file.type)}
                          className="mr-1"
                        />
                        <Text className="text-xs text-gray-500">{file.type}</Text>
                        {!file.canDelete && (
                          <Text className="text-xs text-red-500 ml-2">（系统文件，不可删除）</Text>
                        )}
                      </View>
                    </View>
                    <Text className="text-sm font-bold text-gray-900 ml-3">{formatSize(file.size)}</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* 操作按钮 */}
          <View className="space-y-3">
            <TouchableOpacity
              onPress={scanSystem}
              disabled={isScanning}
              className={`py-3 px-4 rounded-xl ${isScanning ? 'bg-gray-300' : 'bg-blue-600'}`}
            >
              <Text className="text-white text-center font-bold">
                {isScanning ? '扫描中...' : '开始扫描'}
              </Text>
            </TouchableOpacity>

            {cleanupFiles.length > 0 && (
              <>
                <TouchableOpacity
                  onPress={cleanupSelected}
                  disabled={selectedFiles.size === 0 || isCleaning}
                  className={`py-3 px-4 rounded-xl ${
                    selectedFiles.size === 0 || isCleaning ? 'bg-gray-300' : 'bg-orange-600'
                  }`}
                >
                  <Text className="text-white text-center font-bold">
                    {isCleaning ? '清理中...' : `清理选中 (${selectedFiles.size}个 - ${formatSize(selectedSize)})`}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={cleanupAll}
                  disabled={isCleaning}
                  className={`py-3 px-4 rounded-xl ${isCleaning ? 'bg-gray-300' : 'bg-red-600'}`}
                >
                  <Text className="text-white text-center font-bold">
                    {isCleaning ? '清理中...' : `一键清理 (${deletableFiles.length}个 - ${formatSize(deletableSize)})`}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* 提示信息 */}
          <View className="mt-6 p-4 bg-yellow-50 rounded-xl">
            <View className="flex-row items-start">
              <MaterialIcons name="info" size={20} color="#F59E0B" className="mr-2 mt-0.5" />
              <View className="flex-1">
                <Text className="text-sm font-bold text-yellow-800 mb-1">温馨提示</Text>
                <Text className="text-xs text-yellow-700 leading-relaxed">
                  • 缓存文件是系统临时生成的文件，可以安全清理
                  {'\n'}• 临时文件是程序运行时产生的临时数据，清理后不会影响系统功能
                  {'\n'}• 系统文件是运行必需的文件，不能删除
                  {'\n'}• 建议定期清理缓存和临时文件，释放存储空间
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Screen>
  );
}
