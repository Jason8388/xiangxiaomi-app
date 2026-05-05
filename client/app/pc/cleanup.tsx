import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Screen from '@/components/Screen';
import { FontAwesome6 } from '@expo/vector-icons';

export default function PCCleanup() {
  const [cleaning, setCleaning] = useState(false);
  const [results, setResults] = useState<{ type: string; size: string; cleaned: boolean }[]>([]);

  const handleCleanup = async () => {
    setCleaning(true);
    // 模拟清理操作
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setResults([
      { type: '图片缓存', size: '25.6 MB', cleaned: true },
      { type: '临时文件', size: '12.3 MB', cleaned: true },
      { type: '日志文件', size: '8.1 MB', cleaned: true },
      { type: '离线数据', size: '5.2 MB', cleaned: true },
    ]);
    setCleaning(false);
  };

  const totalSize = results.reduce((acc, r) => acc + parseFloat(r.size), 0);

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>系统清理</Text>
          <Text style={styles.subtitle}>清理缓存文件，释放存储空间</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <FontAwesome6 name="broom" size={48} color="#3498DB" />
          </View>
          <Text style={styles.totalSize}>{totalSize.toFixed(1)} MB</Text>
          <Text style={styles.totalLabel}>可清理空间</Text>
          
          <TouchableOpacity 
            style={[styles.cleanButton, cleaning && styles.cleanButtonDisabled]}
            onPress={handleCleanup}
            disabled={cleaning}
          >
            {cleaning ? (
              <Text style={styles.cleanButtonText}>清理中...</Text>
            ) : (
              <Text style={styles.cleanButtonText}>开始清理</Text>
            )}
          </TouchableOpacity>
        </View>

        {results.length > 0 && (
          <View style={styles.resultsCard}>
            <Text style={styles.resultsTitle}>清理结果</Text>
            {results.map((item, index) => (
              <View key={index} style={styles.resultItem}>
                <View style={styles.resultLeft}>
                  <FontAwesome6 name="check-circle" size={16} color="#27AE60" />
                  <Text style={styles.resultType}>{item.type}</Text>
                </View>
                <Text style={styles.resultSize}>{item.size}</Text>
              </View>
            ))}
            <View style={styles.resultTotal}>
              <Text style={styles.resultTotalText}>已释放空间</Text>
              <Text style={styles.resultTotalSize}>{totalSize.toFixed(1)} MB</Text>
            </View>
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6FA', padding: 16 },
  header: { marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#2C3E50', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#7F8C8D' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 24, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8, elevation: 2 },
  iconContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#EBF5FB', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  totalSize: { fontSize: 36, fontWeight: 'bold', color: '#3498DB', marginBottom: 4 },
  totalLabel: { fontSize: 14, color: '#7F8C8D', marginBottom: 20 },
  cleanButton: { backgroundColor: '#3498DB', paddingHorizontal: 48, paddingVertical: 12, borderRadius: 24 },
  cleanButtonDisabled: { backgroundColor: '#BDC3C7' },
  cleanButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  resultsCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginTop: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8, elevation: 2 },
  resultsTitle: { fontSize: 16, fontWeight: '600', color: '#2C3E50', marginBottom: 12 },
  resultItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  resultLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  resultType: { fontSize: 14, color: '#2C3E50' },
  resultSize: { fontSize: 14, color: '#27AE60', fontWeight: '500' },
  resultTotal: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  resultTotalText: { fontSize: 14, fontWeight: '600', color: '#2C3E50' },
  resultTotalSize: { fontSize: 16, fontWeight: 'bold', color: '#27AE60' },
});
