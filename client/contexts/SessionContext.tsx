import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { getSecureItem, deleteSecureItem } from '@/utils/storage';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { Alert, Platform } from 'react-native';
import Constants from 'expo-constants';

interface Session {
  id: number;
  session_id: string;
  device_id: string;
  device_info?: string;
  login_time: string;
  last_active_time: string;
}

interface SessionContextType {
  session: Session | null;
  isAuthenticated: boolean;
  checkSession: () => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useSafeRouter();
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isCheckingRef = useRef(false);
  const hasShownAlertRef = useRef(false);

  // 获取设备信息
  const getDeviceInfo = () => {
    return JSON.stringify({
      platform: Platform.OS,
      version: Platform.Version,
      model: Constants.deviceName,
      deviceId: Constants.deviceId,
    });
  };

  // 检查会话状态
  const checkSession = async (showAlertOnError = true) => {
    // 防止重复检查
    if (isCheckingRef.current) {
      return;
    }

    // Web 环境下跳过会话检查（expo-secure-store 不支持）
    if (Platform.OS === 'web') {
      setIsAuthenticated(false);
      setSession(null);
      return;
    }

    try {
      const sessionId = await getSecureItem('session_id');
      if (!sessionId) {
        setIsAuthenticated(false);
        setSession(null);
        return;
      }

      isCheckingRef.current = true;
      setIsLoading(true);
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/sessions/check/${sessionId}`
      );

      const data = await response.json();

      if (data.is_valid) {
        setSession(data.session);
        setIsAuthenticated(true);
        hasShownAlertRef.current = false;
      } else {
        // 会话失效
        setSession(null);
        setIsAuthenticated(false);

        // 只在第一次检测到失效时显示提示
        if (showAlertOnError && !hasShownAlertRef.current) {
          hasShownAlertRef.current = true;
          Alert.alert(
            '登录失效',
            data.message || '当前账号已在其他设备登录，请重新登录',
            [
              {
                text: '确定',
                onPress: () => {
                  // 清除本地数据并跳转登录页
                  deleteSecureItem('user');
                  deleteSecureItem('session_id');
                  router.replace('/');
                },
              },
            ],
            { cancelable: false } // 不可取消，必须确定
          );
        }
      }
    } catch (error) {
      console.error('Check session error:', error);
      // 网络错误不强制登出，保持当前状态
    } finally {
      setIsLoading(false);
      isCheckingRef.current = false;
    }
  };

  // 登出
  const logout = async () => {
    const sessionId = await getSecureItem('session_id');

    try {
      // 调用后端注销接口
      if (sessionId) {
        await fetch(
          `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/sessions/logout/${sessionId}`,
          {
            method: 'POST',
          }
        );
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // 清除本地数据
      deleteSecureItem('user');
      deleteSecureItem('session_id');
      setSession(null);
      setIsAuthenticated(false);

      // 停止会话检查
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }

      // 跳转登录页
      router.replace('/');
    }
  };

  // 初始化时检查会话
  useEffect(() => {
    const initSession = async () => {
      await checkSession(false);
    };

    initSession();

    // 启动定期检查（每30秒）
    checkIntervalRef.current = setInterval(() => {
      checkSession(true);
    }, 30000);

    // 清理定时器
    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, []);

  const value = {
    session,
    isAuthenticated,
    checkSession,
    logout,
    isLoading,
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}
