import { useEffect } from 'react';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { storage } from '@/utils/storage';

export default function PCIndex() {
  const router = useSafeRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const token = await storage.getItem('token');

      if (token) {
        router.replace('/pc/dashboard');
      } else {
        router.replace('/pc/login');
      }
    };

    checkAuth();
  }, [router]);

  return null;
}
