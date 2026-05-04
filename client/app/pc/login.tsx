import React, { useState, useCallback } from 'react';
import '@/assets/styles/pc-global.css';
import { getApiBaseUrl } from '@/utils/api';

export default function PCLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      const response = await fetch(`${baseUrl}/api/v1/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
          device_id: 'pc-web-' + Date.now(),
          device_info: JSON.stringify({
            platform: 'web',
            userAgent: navigator.userAgent,
          }),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '登录失败');
      }

      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      if (data.session && data.session.session_id) {
        localStorage.setItem('session_id', data.session.session_id);
        localStorage.setItem('token', data.session.session_id);
      }

      window.alert('登录成功！欢迎回来！');

      setTimeout(() => {
        window.location.href = '/pc/dashboard';
      }, 500);
    } catch (err: any) {
      console.error('[PC登录] 错误:', err);
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
            <img src="/client/assets/images/icon.png" alt="项小秘" />
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

          <div className="pc-login-footer">
            <p className="pc-login-tips">
              默认账号：admin / admin123<br />
              演示账号：demo / demo123
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
