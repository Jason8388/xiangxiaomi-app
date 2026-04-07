import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { getApiBaseUrl } from '@/utils/api';
import { Screen } from '@/components/Screen';

interface Material {
  id: number;
  material_number: string;
  material_name: string;
  material_spec: string;
  material_unit: string;
  category?: string;
  stock_quantity: number;
  warning_stock?: number;
  supplier?: string;
  unit_price?: number;
  material_photo?: string;
  qr_code?: string;
  qr_code_id?: string;
  remarks?: string;
  tags?: string[];
}

export default function MaterialDetail() {
  const router = useSafeRouter();
  const { id } = useSafeSearchParams<{ id: number }>();
  const [material, setMaterial] = useState<Material | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchMaterialDetail();
    }
  }, [id]);

  const fetchMaterialDetail = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${getApiBaseUrl()}/api/v1/materials/${id}`
      );
      const data = await response.json();
      if (response.ok) {
        const m = data.data || data;
        // 字段兼容处理
        setMaterial({
          id: m.id,
          material_number: m.code || m.material_number || '',
          material_name: m.name || m.material_name || '',
          material_spec: m.spec || m.material_spec || '',
          material_unit: m.unit || m.material_unit || '',
          category: m.category || '',
          stock_quantity: m.current_stock ?? m.stock_quantity ?? 0,
          warning_stock: m.min_stock ?? m.warning_stock ?? 0,
          supplier: m.supplier || '',
          unit_price: m.price ?? m.unit_price ?? 0,
          material_photo: m.photo || m.material_photo || '',
          qr_code: m.qr_code || '',
          qr_code_id: m.qr_code_id || m.qrcode_id || '',
          remarks: m.remarks || m.note || '',
          tags: m.tags || [],
        });
      }
    } catch (error) {
      console.error('Fetch material detail error:', error);
      Alert.alert('错误', '获取物料详情失败');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Screen>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      </Screen>
    );
  }

  if (!material) {
    return (
      <Screen>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>物料不存在</Text>
        </View>
      </Screen>
    );
  }

  const isLowStock = material.stock_quantity <= (material.warning_stock || 0);

  return (
    <Screen>
      <ScrollView style={styles.container}>
        {/* 头部信息 */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Text style={styles.headerIconText}>
              {material.material_name?.charAt(0) || 'M'}
            </Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.materialName}>{material.material_name}</Text>
            <Text style={styles.materialCode}>{material.material_number}</Text>
          </View>
        </View>

        {/* 库存状态 */}
        <View style={[styles.stockCard, isLowStock && styles.stockWarning]}>
          <View style={styles.stockInfo}>
            <Text style={styles.stockLabel}>当前库存</Text>
            <Text style={[styles.stockValue, isLowStock && styles.stockValueWarning]}>
              {material.stock_quantity}
            </Text>
            <Text style={styles.stockUnit}>{material.material_unit}</Text>
          </View>
          {isLowStock && (
            <View style={styles.warningBadge}>
              <Text style={styles.warningText}>库存不足</Text>
            </View>
          )}
        </View>

        {/* 基本信息 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>基本信息</Text>
          <View style={styles.infoGrid}>
            <InfoItem label="物料编码" value={material.material_number || '-'} />
            <InfoItem label="物料名称" value={material.material_name || '-'} />
            <InfoItem label="规格型号" value={material.material_spec || '-'} />
            <InfoItem label="单位" value={material.material_unit || '-'} />
            <InfoItem label="分类" value={material.category || '-'} />
            <InfoItem label="单价" value={material.unit_price ? `¥${material.unit_price}` : '-'} />
          </View>
        </View>

        {/* 库存信息 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>库存信息</Text>
          <View style={styles.infoGrid}>
            <InfoItem label="当前库存" value={`${material.stock_quantity} ${material.material_unit}`} />
            <InfoItem label="预警库存" value={`${material.warning_stock || 0} ${material.material_unit}`} />
          </View>
        </View>

        {/* 供应商信息 */}
        {material.supplier && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>供应商信息</Text>
            <View style={styles.infoGrid}>
              <InfoItem label="供应商" value={material.supplier} />
            </View>
          </View>
        )}

        {/* 二维码信息 */}
        {material.qr_code_id && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>二维码信息</Text>
            <View style={styles.qrInfo}>
              <Text style={styles.qrLabel}>二维码ID:</Text>
              <Text style={styles.qrValue}>{material.qr_code_id}</Text>
            </View>
          </View>
        )}

        {/* 备注 */}
        {material.remarks && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>备注</Text>
            <Text style={styles.remarks}>{material.remarks}</Text>
          </View>
        )}

        {/* 标签 */}
        {material.tags && material.tags.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>标签</Text>
            <View style={styles.tags}>
              {material.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 底部操作 */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>返回列表</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Screen>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoItem}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#636E72',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginBottom: 12,
  },
  headerIcon: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerIconText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerInfo: {
    flex: 1,
  },
  materialName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D3436',
    marginBottom: 4,
  },
  materialCode: {
    fontSize: 14,
    color: '#636E72',
  },
  stockCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stockWarning: {
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  stockInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  stockLabel: {
    fontSize: 14,
    color: '#636E72',
    marginRight: 8,
  },
  stockValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2D3436',
  },
  stockValueWarning: {
    color: '#FF6B6B',
  },
  stockUnit: {
    fontSize: 14,
    color: '#636E72',
    marginLeft: 4,
  },
  warningBadge: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  warningText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 12,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  infoItem: {
    width: '50%',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: '#636E72',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: '#2D3436',
  },
  qrInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qrLabel: {
    fontSize: 14,
    color: '#636E72',
    marginRight: 8,
  },
  qrValue: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '600',
  },
  remarks: {
    fontSize: 14,
    color: '#2D3436',
    lineHeight: 22,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 12,
    color: '#4F46E5',
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
  },
  backButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
