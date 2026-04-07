/**
 * 统一存储工具 - 兼容 Web 和 Native
 * Web 使用 localStorage，Native 使用 AsyncStorage
 */
import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

// Native 存储实现
let nativeStorage: any = null;
async function getNativeStorage() {
  if (isWeb) return null;
  if (nativeStorage) return nativeStorage;
  try {
    // 动态导入避免 Web 打包问题
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const AsyncStorage = require('@react-native-async-storage/async-storage');
    nativeStorage = AsyncStorage.default || AsyncStorage;
    return nativeStorage;
  } catch (error) {
    console.error('Failed to load AsyncStorage:', error);
    return null;
  }
}

// 安全获取 localStorage
function getLocalStorage(): Storage | null {
  if (!isWeb) return null;
  if (typeof window === 'undefined') return null;
  if (!window.localStorage) return null;
  return window.localStorage;
}

// 存储工具
export const Storage = {
  async getItem(key: string): Promise<string | null> {
    const ls = getLocalStorage();
    if (ls) {
      try {
        return ls.getItem(key);
      } catch (error) {
        console.error('localStorage getItem error:', error);
        return null;
      }
    }
    
    const store = await getNativeStorage();
    if (!store) return null;
    try {
      return await store.getItem(key);
    } catch (error) {
      console.error('AsyncStorage getItem error:', error);
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    const ls = getLocalStorage();
    if (ls) {
      try {
        ls.setItem(key, value);
        return;
      } catch (error) {
        console.error('localStorage setItem error:', error);
      }
    }
    
    const store = await getNativeStorage();
    if (!store) return;
    try {
      await store.setItem(key, value);
    } catch (error) {
      console.error('AsyncStorage setItem error:', error);
    }
  },

  async deleteItem(key: string): Promise<void> {
    const ls = getLocalStorage();
    if (ls) {
      try {
        ls.removeItem(key);
        return;
      } catch (error) {
        console.error('localStorage removeItem error:', error);
      }
    }
    
    const store = await getNativeStorage();
    if (!store) return;
    try {
      await store.removeItem(key);
    } catch (error) {
      console.error('AsyncStorage removeItem error:', error);
    }
  },
};

// 便捷方法
export const getSecureItem = (key: string) => Storage.getItem(key);
export const setSecureItem = (key: string, value: string) => Storage.setItem(key, value);
export const deleteSecureItem = (key: string) => Storage.deleteItem(key);
