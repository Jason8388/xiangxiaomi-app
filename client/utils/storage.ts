// Web环境和原生环境的兼容性处理

// 在Web环境下，localStorage是同步的，但为了保持接口一致，我们使用Promise包装
const webStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      return Promise.resolve(localStorage.getItem(key));
    } catch (e) {
      return Promise.resolve(null);
    }
  },
  async setItem(key: string, value: string): Promise<void> {
    try {
      localStorage.setItem(key, value);
      return Promise.resolve();
    } catch (e) {
      return Promise.reject(e);
    }
  },
  async removeItem(key: string): Promise<void> {
    try {
      localStorage.removeItem(key);
      return Promise.resolve();
    } catch (e) {
      return Promise.reject(e);
    }
  },
  async clear(): Promise<void> {
    try {
      localStorage.clear();
      return Promise.resolve();
    } catch (e) {
      return Promise.reject(e);
    }
  },
};

// 在原生环境下使用AsyncStorage
import AsyncStorage from '@react-native-async-storage/async-storage';

const nativeStorage = {
  async getItem(key: string): Promise<string | null> {
    return await AsyncStorage.getItem(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    await AsyncStorage.setItem(key, value);
  },
  async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  },
  async clear(): Promise<void> {
    await AsyncStorage.clear();
  },
};

// 检测是否在Web环境
const isWebEnv = () => {
  try {
    return typeof window !== 'undefined' && typeof document !== 'undefined';
  } catch (e) {
    return false;
  }
};

export const storage = isWebEnv() ? webStorage : nativeStorage;

// ==================== API缓存工具 ====================

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expires: number;
}

// 内存缓存（进程级）
const memoryCache = new Map<string, CacheItem<any>>();

// 缓存有效期配置（毫秒）
const CACHE_TTL = {
  short: 30 * 1000,      // 30秒 - 频繁变化的数据
  medium: 2 * 60 * 1000, // 2分钟 - 一般数据
  long: 10 * 60 * 1000,  // 10分钟 - 相对稳定的数据
  static: 30 * 60 * 1000, // 30分钟 - 几乎不变的数据
};

/**
 * 带缓存的API请求
 * @param key 缓存键
 * @param fetchFn 实际API请求函数
 * @param ttl 缓存有效期，默认medium
 */
export async function cachedFetch<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: keyof typeof CACHE_TTL = 'medium'
): Promise<T> {
  const now = Date.now();
  
  // 检查内存缓存
  const cached = memoryCache.get(key);
  if (cached && now - cached.timestamp < cached.expires) {
    return cached.data as T;
  }
  
  // 尝试从持久化存储读取
  try {
    const stored = await storage.getItem(`cache:${key}`);
    if (stored) {
      const parsed: CacheItem<T> = JSON.parse(stored);
      if (now - parsed.timestamp < parsed.expires) {
        memoryCache.set(key, parsed);
        return parsed.data;
      }
    }
  } catch (e) {
    // 忽略存储错误
  }
  
  // 执行实际请求
  try {
    const data = await fetchFn();
    
    const cacheItem: CacheItem<T> = {
      data,
      timestamp: now,
      expires: CACHE_TTL[ttl],
    };
    
    // 保存到内存缓存
    memoryCache.set(key, cacheItem);
    
    // 异步保存到持久化存储
    storage.setItem(`cache:${key}`, JSON.stringify(cacheItem)).catch(() => {});
    
    return data;
  } catch (error) {
    // 请求失败时，尝试返回过期缓存（降级策略）
    if (cached) {
      return cached.data as T;
    }
    try {
      const stored = await storage.getItem(`cache:${key}`);
      if (stored) {
        return JSON.parse(stored).data;
      }
    } catch (e) {
      // 忽略
    }
    throw error;
  }
}

/**
 * 清除指定缓存
 */
export function clearCache(key?: string) {
  if (key) {
    memoryCache.delete(key);
    storage.removeItem(`cache:${key}`).catch(() => {});
  } else {
    memoryCache.clear();
    // 清除所有以cache:开头的键
    // 注意：AsyncStorage的clear会清除所有数据，这里只清理标记的数据
  }
}

/**
 * 批量清除缓存（按前缀）
 */
export async function clearCachePrefix(prefix: string) {
  // 清除内存缓存
  for (const key of memoryCache.keys()) {
    if (key.startsWith(prefix)) {
      memoryCache.delete(key);
    }
  }
  // 清除持久化缓存
  try {
    const keys = await storage.getItem('cache_keys');
    if (keys) {
      const keyList: string[] = JSON.parse(keys);
      for (const k of keyList) {
        if (k.startsWith(prefix)) {
          await storage.removeItem(`cache:${k}`);
        }
      }
    }
  } catch (e) {
    // 忽略
  }
}

/**
 * 预加载数据到缓存
 */
export async function preloadCache(
  items: Array<{ key: string; fetchFn: () => Promise<any>; ttl?: keyof typeof CACHE_TTL }>
) {
  await Promise.all(
    items.map(({ key, fetchFn, ttl }) =>
      cachedFetch(key, fetchFn, ttl).catch(() => {})
    )
  );
}
