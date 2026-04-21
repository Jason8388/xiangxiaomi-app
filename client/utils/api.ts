/**
 * 统一 API Base URL 工具
 * 动态获取正确的后端地址
 */

/**
 * 获取 API Base URL
 * 
 * 问题：在沙箱环境中，前端和后端通过代理服务器共享端口
 * 前端服务器（5000）代理 /api 路径到后端（9091）
 * 
 * 解决方案：
 * - 本地开发：使用 http://localhost:9091
 * - 沙箱/生产：使用相对路径（由前端服务器代理）
 */
export function getApiBaseUrl(): string {
  // Web 环境
  if (typeof window !== 'undefined' && window.location) {
    const currentHost = window.location.hostname;
    
    // 本地开发检测（localhost/127.0.0.1）
    const isLocalDev = currentHost === 'localhost' || 
                       currentHost === '127.0.0.1' ||
                       currentHost.includes('.local');
    
    if (isLocalDev) {
      // 本地开发：直接使用 localhost:9091
      const envUrl = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;
      if (envUrl && !envUrl.startsWith('https://')) {
        console.log('[API] Local dev - using:', envUrl);
        return envUrl;
      }
      console.log('[API] Local dev - using localhost:9091');
      return 'http://localhost:9091';
    }
    
    // 沙箱/生产环境：使用环境变量中的完整URL
    const envUrl = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;
    if (envUrl) {
      console.log('[API] Production/Sandbox - using env URL:', envUrl);
      return envUrl;
    }
    
    console.log('[API] No env URL available, using relative path');
    return '';
  }
  
  // Native 环境
  const envUrl = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;
  if (envUrl) {
    return envUrl;
  }
  
  return 'http://localhost:9091';
}

/**
 * 构建完整的 API URL
 */
export function apiUrl(path: string): string {
  const base = getApiBaseUrl();
  if (!base) {
    return path.startsWith('/') ? path : '/' + path;
  }
  return `${base}${path.startsWith('/') ? path : '/' + path}`;
}
