import React, { useState } from 'react';
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
import { getApiBaseUrl } from '@/utils/api';

interface QueryMaterial {
  id: number;
  material_name: string;
  material_code: string;
  material_model: string;
  unit: string;
  quantity: number;
  tags: string[];
  created_at: string;
}

export default function QueryMaterial() {
  const router = useSafeRouter();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [results, setResults] = useState<QueryMaterial[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchKeyword.trim()) {
      Alert.alert('提示', '请输入搜索关键词');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `${getApiBaseUrl()}/api/v1/query/materials?keyword=${encodeURIComponent(searchKeyword)}`
      );
      const data = await response.json();
      if (response.ok) {
        setResults(data);
      }
    } catch (error) {
      Alert.alert('错误', '查询失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <PageHeader title="物料查询" />

      <View style={styles.container}>
        {/* 搜索框 */}
        <View style={styles.searchContainer}>
          <FontAwesome6 name="magnifying-glass" size={16} color="#636E72" />
          <TextInput
            style={styles.searchInput}
            placeholder="输入物料名称、型号、编码、标签"
            value={searchKeyword}
            onChangeText={setSearchKeyword}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <Text style={styles.searchButtonText}>搜索</Text>
          </TouchableOpacity>
        </View>

        {/* 搜索提示 */}
        <View style={styles.tipContainer}>
          <FontAwesome6 name="circle-info" size={14} color="#F39C12" />
          <Text style={styles.tipText}>
            支持按物料名称、物料型号、物料编码、物料标签模糊搜索查询物料信息
          </Text>
        </View>

        {/* 搜索结果 */}
        {loading ? (
          <View style={styles.centerContainer}>
            <Text>查询中...</Text>
          </View>
        ) : results.length === 0 && searchKeyword ? (
          <View style={styles.centerContainer}>
            <FontAwesome6 name="box-open" size={48} color="#95A5A6" />
            <Text style={styles.emptyText}>未找到相关物料</Text>
          </View>
        ) : results.length === 0 ? (
          <View style={styles.centerContainer}>
            <FontAwesome6 name="box" size={48} color="#95A5A6" />
            <Text style={styles.emptyText}>请输入关键词进行搜索</Text>
          </View>
        ) : (
          <ScrollView style={styles.resultsContainer}>
            <Text style={styles.resultsTitle}>查询结果（{results.length}）</Text>
            {results.map((material) => (
              <TouchableOpacity
                key={material.id}
                style={styles.materialCard}
                onPress={() => router.push('/material-detail', { id: material.id })}
              >
                <View style={styles.materialHeader}>
                  <View style={styles.materialIcon}>
                    <FontAwesome6 name="box" size={24} color="#1E88E5" />
                  </View>
                  <View style={styles.materialInfo}>
                    <Text style={styles.materialName}>{material.material_name}</Text>
                    <Text style={styles.materialCode}>{material.material_code}</Text>
                  </View>
                </View>

                {/* 物料详情 */}
                <View style={styles.materialDetails}>
                  <View style={styles.detailItem}>
                    <FontAwesome6 name="cube" size={12} color="#636E72" />
                    <Text style={styles.detailLabel}>型号：</Text>
                    <Text style={styles.detailValue}>{material.material_model}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <FontAwesome6 name="scale-balanced" size={12} color="#636E72" />
                    <Text style={styles.detailLabel}>单位：</Text>
                    <Text style={styles.detailValue}>{material.unit}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <FontAwesome6 name="hashtag" size={12} color="#636E72" />
                    <Text style={styles.detailLabel}>库存：</Text>
                    <Text style={styles.detailValue}>{material.quantity}</Text>
                  </View>
                </View>

                {/* 标签 */}
                {material.tags.length > 0 && (
                  <View style={styles.tagsContainer}>
                    {material.tags.slice(0, 3).map((tag, index) => (
                      <View key={index} style={styles.tagBadge}>
                        <Text style={styles.tagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                )}

                <View style={styles.materialFooter}>
                  <Text style={styles.createdDate}>
                    创建于 {new Date(material.created_at).toLocaleDateString()}
                  </Text>
                  <FontAwesome6 name="chevron-right" size={16} color="#95A5A6" />
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(243, 156, 18, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 12,
    marginBottom: 16,
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    color: '#F39C12',
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
    marginTop: 12,
  },
  resultsContainer: {
    flex: 1,
  },
  resultsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#636E72',
    marginBottom: 12,
  },
  materialCard: {
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
  materialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  materialIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(30, 136, 229, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  materialInfo: {
    flex: 1,
  },
  materialName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 4,
  },
  materialCode: {
    fontSize: 13,
    color: '#95A5A6',
  },
  materialDetails: {
    backgroundColor: '#F5F7FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: '#636E72',
  },
  detailValue: {
    fontSize: 12,
    color: '#2D3436',
    fontWeight: '500',
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
  materialFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  createdDate: {
    fontSize: 12,
    color: '#95A5A6',
  },
});
