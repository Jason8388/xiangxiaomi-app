/**
 * 统一存储工具 - 兼容 Web 和 Native
 * Web 使用 AsyncStorage，Native 使用 SecureStore
 */
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const USE_ASYNC_STORAGE = Platform.OS === 'web';

export const Storage = {
  async getItem(key: string): Promise<string | null> {
    if (USE_ASYNC_STORAGE) {
      return AsyncStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
  },

  async setItem(key: string, value: string): Promise<void> {
    if (USE_ASYNC_STORAGE) {
      return AsyncStorage.setItem(key, value);
    }
    return SecureStore.setItemAsync(key, value);
  },

  async deleteItem(key: string): Promise<void> {
    if (USE_ASYNC_STORAGE) {
      return AsyncStorage.removeItem(key);
    }
    return SecureStore.deleteItemAsync(key);
  },
};

// 便捷方法
export const getSecureItem = (key: string) => Storage.getItem(key);
export const setSecureItem = (key: string, value: string) => Storage.setItem(key, value);
export const deleteSecureItem = (key: string) => Storage.deleteItem(key);
