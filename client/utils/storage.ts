/**
 * 统一存储工具 - 兼容 Web 和 Native
 * Web 使用 localStorage，Native 使用 AsyncStorage
 */

import { Platform } from 'react-native';

// 动态导入 AsyncStorage（仅 Native 端需要）
let AsyncStorage: any = null;

// 只在非 Web 环境下加载 AsyncStorage
if (Platform.OS !== 'web') {
  try {
    AsyncStorage = require('@react-native-async-storage/async-storage').default;
    console.log('[Storage] AsyncStorage loaded');
  } catch (error) {
    console.error('[Storage] Failed to load AsyncStorage:', error);
  }
} else {
  console.log('[Storage] Web platform detected, using localStorage');
}

// 统一的存储实现
const StorageObject = {
  async getItem(key: string): Promise<string | null> {
    try {
      // Web 端使用 localStorage
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
      // Native 端使用 AsyncStorage
      if (AsyncStorage) {
        return await AsyncStorage.getItem(key);
      }
      return null;
    } catch (error) {
      console.error('Storage getItem error:', error);
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      // Web 端使用 localStorage
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
      // Native 端使用 AsyncStorage
      else if (AsyncStorage) {
        await AsyncStorage.setItem(key, value);
      }
    } catch (error) {
      console.error('Storage setItem error:', error);
    }
  },

  async deleteItem(key: string): Promise<void> {
    try {
      // Web 端使用 localStorage
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
      // Native 端使用 AsyncStorage
      else if (AsyncStorage) {
        await AsyncStorage.removeItem(key);
      }
    } catch (error) {
      console.error('Storage deleteItem error:', error);
    }
  },
};

// 导出 Storage（防御性检查）
export const Storage = StorageObject;

// 兼容小写导出
export const storage = StorageObject;

console.log('[Storage] Module initialized, Storage:', !!StorageObject);

// 便捷方法
export const getSecureItem = (key: string): Promise<string | null> => Storage.getItem(key);
export const setSecureItem = (key: string, value: string): Promise<void> => Storage.setItem(key, value);
export const deleteSecureItem = (key: string): Promise<void> => Storage.deleteItem(key);

// 缓存相关（保留接口但不使用）
export async function getCache(key: string): Promise<{ data: any; timestamp: number } | null> {
  return null;
}

export async function setCache(key: string, data: any, duration?: number): Promise<void> {
  // 不使用缓存
}

export async function clearCache(key?: string): Promise<void> {
  // 不使用缓存
}

export async function cachedFetch(url: string, options?: RequestInit, duration?: number): Promise<Response> {
  // 直接请求，不使用缓存
  return fetch(url, options);
}
