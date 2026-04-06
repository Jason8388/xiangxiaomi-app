import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { PageHeader } from '@/components/PageHeader';
import { FontAwesome6 } from '@expo/vector-icons';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

interface MaterialDetail {
  material_id: number;
  material_name: string;
  material_number: string;
  material_spec?: string;
  material_image?: string;
  remarks?: string;
}

interface StandardMaterialList {
  id: number;
  name: string;
  list_number: string;
  description?: string;
  publisher: string;
  publish_date: string;
  materials: MaterialDetail[];
}

export default function StandardMaterialListDetail() {
  const router = useSafeRouter();
  const { id } = useSafeSearchParams<{ id: number }>();
  const [listData, setListData] = useState<StandardMaterialList | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      loadListDetail();
    }
  }, [id]);

  const loadListDetail = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/standard-material-lists/${id}`
      );
      const data = await response.json();
      if (response.ok) {
        setListData(data);
      }
    } catch (error) {
      console.error('Fetch list detail error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!listData) return;

    try {
      Alert.alert('提示', '正在生成下载文件，请稍候...');

      if (Platform.OS === 'web') {
        const response = await fetch(
          `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/standard-material-lists/${listData.id}/download`
        );
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `标准物料单_${listData.name}_${new Date().getTime()}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const response = await fetch(
          `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/standard-material-lists/${listData.id}/download`
        );
        const data = await response.text();
        const fileUri = `${(FileSystem as any).documentDirectory}标准物料单_${listData.name}_${Date.now()}.xlsx`;
        await (FileSystem as any).writeAsStringAsync(fileUri, data, {
          encoding: (FileSystem as any).EncodingType.Base64,
        });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri);
        }
      }
    } catch (error: any) {
      Alert.alert('错误', error.message);
    }
  };

  if (loading) {
    return (
      <Screen>
        <PageHeader title="标准物料单详情" />
        <View style={styles.centerContainer}>
          <Text>加载中...</Text>
        </View>
      </Screen>
    );
  }

  if (!listData) {
    return (
      <Screen>
        <PageHeader title="标准物料单详情" />
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>未找到数据</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <PageHeader title="标准物料单详情" />

      <ScrollView style={styles.container}>
        {/* 基本信息 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FontAwesome6 name="file-lines" size={18} color="#1E88E5" />
            <Text style={styles.sectionTitle}>基本信息</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>清单名称:</Text>
            <Text style={styles.infoValue}>{listData.name}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>清单编号:</Text>
            <View style={styles.numberBadge}>
              <Text style={styles.numberText}>{listData.list_number}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>发布人:</Text>
            <Text style={styles.infoValue}>{listData.publisher}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>发布日期:</Text>
            <Text style={styles.infoValue}>
              {new Date(listData.publish_date).toLocaleDateString()}
            </Text>
          </View>

          {listData.description && (
            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>清单说明:</Text>
              <Text style={styles.infoText}>{listData.description}</Text>
            </View>
          )}
        </View>

        {/* 物料明细 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FontAwesome6 name="box-open" size={18} color="#1E88E5" />
            <Text style={styles.sectionTitle}>物料明细 ({listData.materials.length}项)</Text>
          </View>

          {listData.materials.map((item) => (
            <View key={item.material_id} style={styles.materialCard}>
              <View style={styles.materialHeader}>
                <View style={styles.materialInfo}>
                  <Text style={styles.materialName}>{item.material_name}</Text>
                  <View style={styles.materialNumber}>
                    <FontAwesome6 name="barcode" size={12} color="#636E72" />
                    <Text style={styles.materialNumberText}>{item.material_number}</Text>
                  </View>
                </View>
                {item.material_image && (
                  <Image source={{ uri: item.material_image }} style={styles.materialImage} />
                )}
              </View>

              {item.material_spec && (
                <View style={styles.materialRow}>
                  <FontAwesome6 name="tag" size={12} color="#95A5A6" />
                  <Text style={styles.materialRowText}>型号: {item.material_spec}</Text>
                </View>
              )}

              {item.remarks && (
                <View style={styles.materialRow}>
                  <FontAwesome6 name="comment" size={12} color="#95A5A6" />
                  <Text style={styles.materialRowText}>备注: {item.remarks}</Text>
                </View>
              )}
            </View>
          ))}

          {listData.materials.length === 0 && (
            <View style={styles.centerContainer}>
              <Text style={styles.emptyText}>暂无物料明细</Text>
            </View>
          )}
        </View>

        {/* 操作按钮 */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleDownload}>
            <FontAwesome6 name="download" size={18} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>下载清单</Text>
          </TouchableOpacity>
        </View>
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
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3436',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#636E72',
    width: 80,
  },
  infoValue: {
    fontSize: 14,
    color: '#2D3436',
    flex: 1,
  },
  infoBlock: {
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#2D3436',
    lineHeight: 20,
    marginTop: 4,
  },
  numberBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(30, 136, 229, 0.1)',
  },
  numberText: {
    fontSize: 13,
    color: '#1E88E5',
    fontWeight: '600',
  },
  materialCard: {
    backgroundColor: '#F5F7FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  materialHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  materialInfo: {
    flex: 1,
  },
  materialName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 4,
  },
  materialNumber: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  materialNumberText: {
    fontSize: 12,
    color: '#636E72',
  },
  materialImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#E0E0E0',
  },
  materialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  materialRowText: {
    fontSize: 13,
    color: '#636E72',
  },
  actions: {
    padding: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#1E88E5',
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
