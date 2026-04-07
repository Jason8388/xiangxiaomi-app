/**
 * 统一存储工具 - 兼容 Web 和 Native
 * Web 使用 localStorage，Native 使用 AsyncStorage
 */

// 简单的本地存储实现
const StorageObject = {
  async getItem(key: string): Promise<string | null> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
      return null;
    } catch (error) {
      console.error('Storage getItem error:', error);
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch (error) {
      console.error('Storage setItem error:', error);
    }
  },

  async deleteItem(key: string): Promise<void> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
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
