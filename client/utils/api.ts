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
  console.log('[API] getApiBaseUrl called');

  // Web 环境
  if (typeof window !== 'undefined' && window.location) {
    const currentHost = window.location.hostname;
    const currentOrigin = window.location.origin;

    console.log('[API] Web environment detected');
    console.log('[API] currentHost:', currentHost);
    console.log('[API] currentOrigin:', currentOrigin);
    console.log('[API] EXPO_PUBLIC_BACKEND_BASE_URL:', process.env.EXPO_PUBLIC_BACKEND_BASE_URL);

    // 本地开发检测（localhost/127.0.0.1）
    const isLocalDev = currentHost === 'localhost' ||
                       currentHost === '127.0.0.1' ||
                       currentHost.includes('.local');

    if (isLocalDev) {
      // 本地开发：使用 localhost:9091
      console.log('[API] Local dev - using localhost:9091');
      return 'http://localhost:9091';
    }

    // 沙箱/生产环境：使用当前域名（由前端服务器代理）
    // 在沙箱环境中，前端和后端共享同一个域名，通过相对路径访问
    console.log('[API] Sandbox/Production - using current origin:', currentOrigin);
    return currentOrigin;
  }

  console.log('[API] Native environment detected');

  // Native 环境
  const envUrl = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;
  if (envUrl) {
    console.log('[API] Native - using env URL:', envUrl);
    return envUrl;
  }

  console.log('[API] Native - using fallback localhost:9091');
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
