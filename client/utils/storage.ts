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
