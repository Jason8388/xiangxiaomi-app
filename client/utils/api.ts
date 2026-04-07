/**
 * 统一 API Base URL 工具
 * 动态获取正确的后端地址
 */

/**
 * 获取 API Base URL
 * 优先级：
 * 1. 环境变量 EXPO_PUBLIC_BACKEND_BASE_URL
 * 2. Web 环境回退到 localhost:9091
 * 3. Native 环境使用 localhost:9091
 */
export function getApiBaseUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;
  
  if (envUrl) {
    return envUrl;
  }
  
  // Web 环境回退
  if (typeof window !== 'undefined' && window.location) {
    return 'http://localhost:9091';
  }
  
  // 默认回退
  return 'http://localhost:9091';
}

/**
 * 构建完整的 API URL
 * @param path API 路径，例如 /api/v1/users
 */
export function apiUrl(path: string): string {
  return `${getApiBaseUrl()}${path.startsWith('/') ? path : '/' + path}`;
}
