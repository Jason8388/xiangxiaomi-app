import { AuthProvider } from '@/contexts/AuthContext';
import { SessionProvider } from '@/contexts/SessionContext';
import { type ReactNode } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { WebOnlyColorSchemeUpdater } from './ColorSchemeUpdater';
import { Platform } from 'react-native';

function Provider({ children }: { children: ReactNode }) {
  return (
    <WebOnlyColorSchemeUpdater>
      {Platform.OS === 'web' ? (
        // Web 环境下不使用 SessionProvider
        <AuthProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            {children}
          </GestureHandlerRootView>
        </AuthProvider>
      ) : (
        // 原生环境下使用 SessionProvider
        <SessionProvider>
          <AuthProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              {children}
            </GestureHandlerRootView>
          </AuthProvider>
        </SessionProvider>
      )}
    </WebOnlyColorSchemeUpdater>
  );
}

export {
  Provider,
}
