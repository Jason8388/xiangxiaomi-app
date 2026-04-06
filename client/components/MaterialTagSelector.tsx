import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';

// 系统默认标签
const DEFAULT_TAGS = [
  '常用物料',
  '高价值物料',
  '标品备件',
  '视觉类',
  '电气类',
  '工具类',
  '夹爪末端类',
  '传感器类',
  '阀门类',
  '集成物料',
  '辅材耗材',
  '加工件',
  '磨具治具',
  '其它',
];

interface MaterialTagSelectorProps {
  visible: boolean;
  selectedTags: string[];
  onConfirm: (tags: string[]) => void;
  onClose: () => void;
}

export default function MaterialTagSelector({
  visible,
  selectedTags,
  onConfirm,
  onClose,
}: MaterialTagSelectorProps) {
  const [tempSelectedTags, setTempSelectedTags] = useState<string[]>(selectedTags);
  const [customTag, setCustomTag] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  // 处理标签选择
  const handleToggleTag = (tag: string) => {
    if (tempSelectedTags.includes(tag)) {
      // 取消选择
      setTempSelectedTags(tempSelectedTags.filter((t) => t !== tag));
    } else {
      // 选择标签，检查是否超过10个
      if (tempSelectedTags.length >= 10) {
        Alert.alert('提示', '最多只能选择10个标签');
        return;
      }
      setTempSelectedTags([...tempSelectedTags, tag]);
    }
  };

  // 添加自定义标签
  const handleAddCustomTag = () => {
    if (!customTag.trim()) {
      Alert.alert('提示', '请输入标签名称');
      return;
    }

    const trimmedTag = customTag.trim();

    // 检查是否已存在
    if (tempSelectedTags.includes(trimmedTag)) {
      Alert.alert('提示', '该标签已选择');
      return;
    }

    // 检查是否超过10个
    if (tempSelectedTags.length >= 10) {
      Alert.alert('提示', '最多只能选择10个标签');
      return;
    }

    setTempSelectedTags([...tempSelectedTags, trimmedTag]);
    setCustomTag('');
    setShowCustomInput(false);
  };

  // 确认选择
  const handleConfirm = () => {
    onConfirm(tempSelectedTags);
    onClose();
  };

  // 取消选择
  const handleCancel = () => {
    setTempSelectedTags(selectedTags);
    setShowCustomInput(false);
    setCustomTag('');
    onClose();
  };

  // 显示所有可用标签（默认标签 + 自定义标签）
  const allTags = [...DEFAULT_TAGS];
  tempSelectedTags.forEach((tag) => {
    if (!DEFAULT_TAGS.includes(tag) && !allTags.includes(tag)) {
      allTags.push(tag);
    }
  });

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleCancel}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>选择物料标签</Text>
            <TouchableOpacity onPress={handleCancel}>
              <FontAwesome6 name="xmark" size={20} color="#636E72" />
            </TouchableOpacity>
          </View>

          <View style={styles.selectedCount}>
            <Text style={styles.countText}>
              已选择 {tempSelectedTags.length}/10 个标签
            </Text>
          </View>

          <ScrollView style={styles.modalBody}>
            {/* 自定义标签输入 */}
            {showCustomInput ? (
              <View style={styles.customInputContainer}>
                <TextInput
                  style={styles.customInput}
                  placeholder="请输入自定义标签名称"
                  value={customTag}
                  onChangeText={setCustomTag}
                  autoFocus
                  onSubmitEditing={handleAddCustomTag}
                />
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={handleAddCustomTag}
                >
                  <FontAwesome6 name="plus" size={16} color="#1E88E5" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelInputButton}
                  onPress={() => {
                    setShowCustomInput(false);
                    setCustomTag('');
                  }}
                >
                  <FontAwesome6 name="xmark" size={16} color="#E74C3C" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.addCustomButton}
                onPress={() => setShowCustomInput(true)}
              >
                <FontAwesome6 name="plus" size={14} color="#1E88E5" />
                <Text style={styles.addCustomButtonText}>添加自定义标签</Text>
              </TouchableOpacity>
            )}

            {/* 标签列表 */}
            <View style={styles.tagList}>
              {allTags.map((tag) => {
                const isSelected = tempSelectedTags.includes(tag);
                const isDefault = DEFAULT_TAGS.includes(tag);

                return (
                  <TouchableOpacity
                    key={tag}
                    style={[
                      styles.tagItem,
                      isSelected && styles.tagItemSelected,
                      !isDefault && styles.tagItemCustom,
                    ]}
                    onPress={() => handleToggleTag(tag)}
                  >
                    <View style={styles.tagContent}>
                      <Text style={[styles.tagName, isSelected && styles.tagNameSelected]}>
                        {tag}
                      </Text>
                      {!isDefault && (
                        <FontAwesome6 name="user-pen" size={12} color="#95A5A6" />
                      )}
                    </View>
                    {isSelected && (
                      <FontAwesome6 name="circle-check" size={18} color="#1E88E5" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={handleCancel}
            >
              <Text style={styles.cancelButtonText}>取消</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.confirmButton]}
              onPress={handleConfirm}
            >
              <Text style={styles.confirmButtonText}>确认</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3436',
  },
  selectedCount: {
    padding: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F5F7FA',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  countText: {
    fontSize: 13,
    color: '#636E72',
  },
  modalBody: {
    padding: 16,
    maxHeight: 400,
  },
  customInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    backgroundColor: '#F5F7FA',
    borderRadius: 8,
    padding: 8,
  },
  customInput: {
    flex: 1,
    fontSize: 14,
    padding: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: 'rgba(30, 136, 229, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelInputButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCustomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(30, 136, 229, 0.1)',
    marginBottom: 16,
  },
  addCustomButtonText: {
    fontSize: 14,
    color: '#1E88E5',
    fontWeight: '500',
  },
  tagList: {
    gap: 8,
  },
  tagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F5F7FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  tagItemSelected: {
    backgroundColor: 'rgba(30, 136, 229, 0.1)',
    borderColor: '#1E88E5',
  },
  tagItemCustom: {
    backgroundColor: '#FFF9E6',
    borderColor: '#F1C40F',
  },
  tagContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tagName: {
    fontSize: 14,
    color: '#2D3436',
  },
  tagNameSelected: {
    fontWeight: '600',
    color: '#1E88E5',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5F7FA',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#636E72',
  },
  confirmButton: {
    backgroundColor: '#1E88E5',
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
});
