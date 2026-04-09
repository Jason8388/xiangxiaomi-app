import React, { useEffect } from 'react';
import { useSafeRouter } from '@/hooks/useSafeRouter';

export default function PCIndex() {
  const router = useSafeRouter();

  useEffect(() => {
    // 检查用户是否已登录
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    if (token) {
      // 已登录，跳转到工作台
      router.replace('/pc/dashboard');
    } else {
      // 未登录，跳转到登录页
      router.replace('/pc/login');
    }
  }, []);

  // 返回空页面，等待重定向
  return null;
}
