/**
 * 统一存储工具 - 兼容 Web 和 Native
 * Web 使用 localStorage，Native 使用 AsyncStorage
 */

// Web 存储实现
function getWebStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  if (!window.localStorage) return null;
  return window.localStorage;
}

// 存储工具 - Web
const WebStorage = {
  async getItem(key: string): Promise<string | null> {
    const ls = getWebStorage();
    if (ls) {
      try {
        return ls.getItem(key);
      } catch (error) {
        console.error('localStorage getItem error:', error);
        return null;
      }
    }
    return null;
  },

  async setItem(key: string, value: string): Promise<void> {
    const ls = getWebStorage();
    if (ls) {
      try {
        ls.setItem(key, value);
        return;
      } catch (error) {
        console.error('localStorage setItem error:', error);
      }
    }
  },

  async deleteItem(key: string): Promise<void> {
    const ls = getWebStorage();
    if (ls) {
      try {
        ls.removeItem(key);
        return;
      } catch (error) {
        console.error('localStorage removeItem error:', error);
      }
    }
  },
};

// 导出 Storage（优先使用 Web）
export const Storage = WebStorage;

// 便捷方法
export const getSecureItem = (key: string) => Storage.getItem(key);
export const setSecureItem = (key: string, value: string) => Storage.setItem(key, value);
export const deleteSecureItem = (key: string) => Storage.deleteItem(key);

// 缓存相关
const cachePrefix = 'app_cache_';
const cacheTimestampPrefix = 'app_cache_ts_';
const defaultCacheDuration = 5 * 60 * 1000; // 5分钟

// 获取缓存
export async function getCache(key: string): Promise<{ data: any; timestamp: number } | null> {
  try {
    const data = await Storage.getItem(cachePrefix + key);
    const timestamp = await Storage.getItem(cacheTimestampPrefix + key);
    if (data && timestamp) {
      return { data: JSON.parse(data), timestamp: parseInt(timestamp, 10) };
    }
  } catch (error) {
    console.error('getCache error:', error);
  }
  return null;
}

// 设置缓存
export async function setCache(key: string, data: any, duration: number = defaultCacheDuration): Promise<void> {
  try {
    await Storage.setItem(cachePrefix + key, JSON.stringify(data));
    await Storage.setItem(cacheTimestampPrefix + key, Date.now().toString());
  } catch (error) {
    console.error('setCache error:', error);
  }
}

// 清除缓存
export async function clearCache(key?: string): Promise<void> {
  try {
    if (key) {
      await Storage.deleteItem(cachePrefix + key);
      await Storage.deleteItem(cacheTimestampPrefix + key);
    } else {
      // 清除所有缓存
      const keys = await Storage.getItem('cache_keys');
      if (keys) {
        const keyList: string[] = JSON.parse(keys);
        for (const k of keyList) {
          await Storage.deleteItem(cachePrefix + k);
          await Storage.deleteItem(cacheTimestampPrefix + k);
        }
        await Storage.deleteItem('cache_keys');
      }
    }
  } catch (error) {
    console.error('clearCache error:', error);
  }
}

// 缓存读取（带缓存）
export async function cachedFetch(url: string, options?: RequestInit, duration: number = defaultCacheDuration): Promise<Response> {
  const cacheKey = btoa(url).replace(/[^a-z0-9]/gi, '_');
  
  // 尝试从缓存获取
  const cached = await getCache(cacheKey);
  if (cached && (Date.now() - cached.timestamp < duration)) {
    // 返回缓存的响应
    return new Response(JSON.stringify(cached.data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  // 执行实际请求
  const response = await fetch(url, options);
  if (response.ok) {
    const data = await response.json();
    await setCache(cacheKey, data, duration);
  }
  
  return response;
}
