// 临时的内存用户存储（用于演示）
export const memoryUsers = {
  admin: {
    id: 1,
    username: 'admin',
    password: 'admin123',
    name: '系统管理员',
    role: 'admin',
    is_disabled: false,
    created_at: new Date(),
    updated_at: new Date(),
  },
  user: {
    id: 2,
    username: 'user',
    password: 'user123',
    name: '普通用户',
    role: 'user',
    is_disabled: false,
    created_at: new Date(),
    updated_at: new Date(),
  },
};

export const memorySessions: any[] = [];

export function getUserByUsername(username: string) {
  const user = memoryUsers[username as keyof typeof memoryUsers];
  return user || null;
}

export function createSession(userId: number, sessionId: string, deviceId: string) {
  const session = {
    id: memorySessions.length + 1,
    user_id: userId,
    session_id: sessionId,
    device_id: deviceId,
    login_time: new Date(),
    last_active_time: new Date(),
    is_active: true,
  };
  memorySessions.push(session);
  return session;
}

export function getActiveSessionCount(userId: number) {
  return memorySessions.filter(
    s => s.user_id === userId && s.is_active
  ).length;
}

export function deactivateOldestSession(userId: number) {
  const oldestSession = memorySessions
    .filter(s => s.user_id === userId && s.is_active)
    .sort((a, b) => new Date(a.login_time).getTime() - new Date(b.login_time).getTime())[0];
  if (oldestSession) {
    oldestSession.is_active = false;
  }
}
