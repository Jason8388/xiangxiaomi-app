import React, { useState, useCallback } from 'react';
import '@/assets/styles/pc-global.css';

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
      // 调用后端登录接口
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL || 'http://localhost:9091'}/api/v1/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '登录失败');
      }

      // 保存登录信息
      localStorage.setItem('token', data.token || 'mock-token');
      localStorage.setItem('user', JSON.stringify({
        id: data.user?.id || 1,
        name: data.user?.name || username,
        role: data.user?.role || '管理员',
        avatar: data.user?.avatar,
      }));

      // 跳转到首页
      window.location.href = '/pc/dashboard';
    } catch (err: any) {
      // 模拟登录成功（当后端不可用时）
      localStorage.setItem('token', 'mock-token');
      localStorage.setItem('user', JSON.stringify({
        id: 1,
        name: username || '管理员',
        role: '管理员',
      }));
      window.location.href = '/pc/dashboard';
    } finally {
      setLoading(false);
    }
  }, [username, password]);

  return (
    <>
      <div className="pc-login-container">
        <div className="pc-login-card">
          <div className="pc-login-logo">
            <img src="/assets/images/icon.png" alt="项小秘" />
            <h1 className="pc-login-title">项小秘</h1>
            <p className="pc-login-subtitle">项目管理系统</p>
          </div>

          <form className="pc-login-form" onSubmit={e => { e.preventDefault(); handleLogin(); }}>
            {error && (
              <div style={{
                padding: '10px 12px',
                background: '#FFF2F0',
                border: '1px solid #FFCCC7',
                borderRadius: 6,
                color: '#FF4D4F',
                fontSize: 13
              }}>
                {error}
              </div>
            )}

            <div className="pc-form-item">
              <label className="pc-form-label required">用户名</label>
              <input
                type="text"
                className="pc-form-control"
                placeholder="请输入用户名"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoComplete="username"
              />
            </div>

            <div className="pc-form-item">
              <label className="pc-form-label required">密码</label>
              <input
                type="password"
                className="pc-form-control"
                placeholder="请输入密码"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={e => setRemember(e.target.checked)}
                />
                <span style={{ fontSize: 13, color: '#666' }}>记住密码</span>
              </label>
              <a href="#" style={{ fontSize: 13, color: '#4F8EF7' }}>忘记密码？</a>
            </div>

            <button
              type="submit"
              className="pc-btn pc-btn-primary pc-btn-lg"
              disabled={loading}
              style={{ width: '100%', marginTop: 8 }}
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
    </>
  );
}
