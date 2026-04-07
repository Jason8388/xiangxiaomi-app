import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Screen } from '@/components/Screen';
import { PageHeader } from '@/components/PageHeader';
import { FontAwesome6 } from '@expo/vector-icons';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { getApiBaseUrl } from '@/utils/api';

export default function QueryScan() {
  const router = useSafeRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <Screen>
        <PageHeader title="扫码查询" />
        <View style={styles.centerContainer}>
          <FontAwesome6 name="camera" size={64} color="#636E72" />
          <Text style={styles.permissionTitle}>需要相机权限</Text>
          <Text style={styles.permissionText}>
            请授予相机权限以扫描二维码
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>授予权限</Text>
          </TouchableOpacity>
        </View>
      </Screen>
    );
  }

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned) return;

    setScanned(true);

    try {
      // 解析二维码内容，判断是物料还是设备
      // 假设二维码格式为: "type:id" 或 "type=xxx&id=xxx"
      const params = new URLSearchParams(data);

      if (data.startsWith('material:') || params.has('material_id')) {
        // 物料二维码
        const materialId = data.replace('material:', '') || params.get('material_id');
        router.push('/material-detail', { id: parseInt(materialId || '0') });
      } else if (data.startsWith('device:') || params.has('device_id')) {
        // 设备二维码
        const deviceId = data.replace('device:', '') || params.get('device_id');
        router.push('/device-detail', { id: parseInt(deviceId || '0') });
      } else {
        // 尝试从后端查询
        const response = await fetch(
          `${getApiBaseUrl()}/api/v1/qrcode/resolve`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ qrcode: data }),
          }
        );

        if (response.ok) {
          const result = await response.json();
          if (result.type === 'material') {
            router.push('/material-detail', { id: result.id });
          } else if (result.type === 'device') {
            router.push('/device-detail', { id: result.id });
          } else {
            Alert.alert('提示', '无法识别此二维码类型');
          }
        } else {
          Alert.alert('错误', '无法识别此二维码');
        }
      }
    } catch (error) {
      Alert.alert('错误', '解析二维码失败');
    }

    // 2秒后允许重新扫描
    setTimeout(() => {
      setScanned(false);
    }, 2000);
  };

  return (
    <Screen>
      <PageHeader title="扫码查询" />

      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
        />

        {/* 扫描框 */}
        <View style={styles.scanOverlay}>
          <View style={styles.scanCornerContainer}>
            <View style={[styles.scanCorner, styles.topLeft]} />
            <View style={[styles.scanCorner, styles.topRight]} />
          </View>
          <View style={styles.scanCornerContainer}>
            <View style={[styles.scanCorner, styles.bottomLeft]} />
            <View style={[styles.scanCorner, styles.bottomRight]} />
          </View>
          <View style={styles.scanLine} />
        </View>

        {/* 提示信息 */}
        <View style={styles.tipContainer}>
          <FontAwesome6 name="qrcode" size={24} color="#FFFFFF" />
          <Text style={styles.tipText}>
            {scanned ? '识别中...' : '将二维码放入框内即可自动扫描'}
          </Text>
        </View>
      </View>

      {/* 支持的二维码类型 */}
      <View style={styles.supportContainer}>
        <Text style={styles.supportTitle}>支持的二维码类型：</Text>
        <View style={styles.supportList}>
          <View style={styles.supportItem}>
            <FontAwesome6 name="box" size={16} color="#1E88E5" />
            <Text style={styles.supportText}>物料二维码</Text>
          </View>
          <View style={styles.supportItem}>
            <FontAwesome6 name="microchip" size={16} color="#2ECC71" />
            <Text style={styles.supportText}>设备二维码</Text>
          </View>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3436',
    marginTop: 16,
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 14,
    color: '#636E72',
    textAlign: 'center',
    marginBottom: 24,
  },
  permissionButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    backgroundColor: '#1E88E5',
    borderRadius: 8,
  },
  permissionButtonText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  cameraContainer: {
    flex: 1,
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
  camera: {
    flex: 1,
  },
  scanOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanCornerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 250,
    marginBottom: 0,
  },
  scanCorner: {
    width: 40,
    height: 40,
    borderColor: '#FFFFFF',
    borderWidth: 3,
  },
  topLeft: {
    borderTopLeftRadius: 8,
    borderBottomWidth: 0,
    borderRightWidth: 0,
  },
  topRight: {
    borderTopRightRadius: 8,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
  },
  bottomLeft: {
    borderBottomLeftRadius: 8,
    borderTopWidth: 0,
    borderRightWidth: 0,
  },
  bottomRight: {
    borderBottomRightRadius: 8,
    borderTopWidth: 0,
    borderLeftWidth: 0,
  },
  scanLine: {
    width: 250,
    height: 2,
    backgroundColor: '#1E88E5',
    marginTop: 0,
    shadowColor: '#1E88E5',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
  },
  tipContainer: {
    position: 'absolute',
    bottom: 80,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
  },
  tipText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  supportContainer: {
    padding: 16,
  },
  supportTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 12,
  },
  supportList: {
    flexDirection: 'row',
    gap: 16,
  },
  supportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F5F7FA',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  supportText: {
    fontSize: 13,
    color: '#636E72',
  },
});
