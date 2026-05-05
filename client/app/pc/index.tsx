import React, { useEffect } from 'react';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { storage } from '@/utils/storage';

export default function PCIndex() {
  const router = useSafeRouter();

  useEffect(() => {
    // 检查用户是否已登录
    const checkAuth = async () => {
      const token = await storage.getItem('token');

      if (token) {
        // 已登录，跳转到工作台
        router.replace('/pc/dashboard');
      } else {
        // 未登录，跳转到登录页
        router.replace('/pc/login');
      }
    };

    checkAuth();
  }, [router]);

  // 返回空页面，等待重定向
  return null;
}
