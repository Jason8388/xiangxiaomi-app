import React, { useState, useCallback, useEffect } from 'react';
import { Platform } from 'react-native';
import '@/assets/styles/pc-global.css';
import { getApiBaseUrl } from '@/utils/api';
import { storage } from '@/utils/storage';
import { useSafeRouter } from '@/hooks/useSafeRouter';

export default function PCLogin() {
  const router = useSafeRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 检测平台并显示提示
  useEffect(() => {
    console.log('[PC登录] Platform.OS:', Platform.OS);
    console.log('[PC登录] window defined:', typeof window !== 'undefined');
    if (typeof window !== 'undefined') {
      console.log('[PC登录] location.href:', window.location.href);
    }
  }, []);

  const isWeb = typeof window !== 'undefined';

  const handleLogin = useCallback(async () => {
    if (!username.trim()) {
      setError('请输入用户名');
      return;
    }
    if (!password.trim()) {
      setError('请输入密码');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('[PC登录] 开始登录...');

      const baseUrl = getApiBaseUrl();
      console.log('[PC登录] API Base URL:', baseUrl);
      console.log('[PC登录] 发送请求:', `${baseUrl}/api/v1/users/login`);
      
      const isWeb = typeof window !== 'undefined';
      const deviceInfo = isWeb 
        ? JSON.stringify({
            platform: 'web',
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
          })
        : JSON.stringify({
            platform: Platform.OS,
            isReactNative: true,
          });
      
      const response = await fetch(`${baseUrl}/api/v1/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
          device_id: 'pc-web-' + Date.now(),
          device_info: deviceInfo,
        }),
      });

      console.log('[PC登录] 响应状态:', response.status);
      const data = await response.json();
      console.log('[PC登录] 响应数据:', data);

      if (!response.ok) {
        throw new Error(data.error || '登录失败');
      }

      try {
        if (data.user) {
          await storage.setItem('user', JSON.stringify(data.user));
          console.log('[PC登录] 用户信息已保存');
        }

        if (data.session && data.session.session_id) {
          await storage.setItem('session_id', data.session.session_id);
          await storage.setItem('token', data.session.session_id);
          console.log('[PC登录] 会话ID已保存');
        }
      } catch (storageError) {
        console.error('[PC登录] 存储错误:', storageError);
        // 存储失败不影响登录成功
      }

      if (isWeb) {
        window.alert('登录成功！欢迎回来！');
      } else {
        Alert.alert('登录成功', '欢迎回来！');
      }

      setTimeout(() => {
        router.replace('/pc/dashboard');
      }, 500);
    } catch (err: any) {
      console.error('[PC登录] 错误:', err);
      console.error('[PC登录] 错误消息:', err.message);
      console.error('[PC登录] 错误详情:', JSON.stringify(err));
      setError(err.message || '登录失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, [username, password]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      handleLogin();
    }
  };

  return (
    <div className="pc-login-container">
      <div className="pc-login-card">
        {/* 左侧品牌区域 */}
        <div className="pc-login-left">
          <div className="pc-login-logo">
            {/* 内联SVG图标，避免外部图片加载问题 */}
            <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ borderRadius: '12px' }}>
              <rect width="60" height="60" rx="12" fill="url(#gradient)" />
              <path d="M20 25h20M20 30h15M20 35h10" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
              <circle cx="40" cy="35" r="6" stroke="white" strokeWidth="2.5" fill="none"/>
              <defs>
                <linearGradient id="gradient" x1="0" y1="0" x2="60" y2="60" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#4F46E5"/>
                  <stop offset="1" stopColor="#7C3AED"/>
                </linearGradient>
              </defs>
            </svg>
            <div className="pc-login-logo-text">
              <span className="pc-login-logo-title">项小秘</span>
              <span className="pc-login-logo-subtitle">Xiang Xiao Mi</span>
            </div>
          </div>
          
          <h2 className="pc-login-tagline">让项目管理<br />更简单高效</h2>
          
          <p className="pc-login-description">
            一站式项目管理系统，集成客户管理、设备管理、合同管理等功能，助力企业数字化转型。
          </p>

          <div className="pc-login-features">
            <div className="pc-login-feature">
              <div className="pc-login-feature-icon">📊</div>
              <span>智能数据看板</span>
            </div>
            <div className="pc-login-feature">
              <div className="pc-login-feature-icon">🔒</div>
              <span>安全权限管理</span>
            </div>
            <div className="pc-login-feature">
              <div className="pc-login-feature-icon">📱</div>
              <span>移动端同步</span>
            </div>
          </div>
        </div>

        {/* 右侧登录表单 */}
        <div className="pc-login-right">
          <div className="pc-login-header">
            <h1 className="pc-login-title">欢迎回来</h1>
            <p className="pc-login-subtitle">请登录您的账户继续使用</p>
          </div>

          {error && (
            <div className="pc-login-error">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form className="pc-login-form" onSubmit={e => { e.preventDefault(); handleLogin(); }}>
            <div className="pc-form-item">
              <label className="pc-form-label">用户名</label>
              <div className="pc-form-input-wrapper">
                <span className="pc-form-input-icon">👤</span>
                <input
                  type="text"
                  className="pc-form-control has-icon"
                  placeholder="请输入用户名"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  onKeyPress={handleKeyPress}
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="pc-form-item">
              <label className="pc-form-label">密码</label>
              <div className="pc-form-input-wrapper">
                <span className="pc-form-input-icon">🔒</span>
                <input
                  type="password"
                  className="pc-form-control has-icon"
                  placeholder="请输入密码"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  autoComplete="current-password"
                />
              </div>
            </div>

            <div className="pc-login-options">
              <label className="pc-remember-label">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={e => setRemember(e.target.checked)}
                />
                <span>记住密码</span>
              </label>
              <a href="#" className="pc-forgot-link" onClick={e => {
                e.preventDefault();
                window.alert('请联系管理员重置密码');
              }}>
                忘记密码？
              </a>
            </div>

            <button
              type="submit"
              className="pc-btn-submit"
              disabled={loading}
            >
              {loading ? '登录中...' : '登 录'}
            </button>
          </form>

          
        </div>
      </div>
    </div>
  );
}
