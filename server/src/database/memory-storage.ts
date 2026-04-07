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

// 导出内存用户列表（数组格式）
export const memoryUsersList = [
  {
    id: 1,
    username: 'admin',
    name: '系统管理员',
    role: 'admin',
    position: '管理员',
    department_id: 1,
    department_name: '技术部',
    is_disabled: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    username: 'user',
    name: '张三',
    role: 'staff',
    position: '工程师',
    department_id: 1,
    department_name: '技术部',
    is_disabled: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 3,
    username: 'lisi',
    name: '李四',
    role: 'staff',
    position: '销售',
    department_id: 2,
    department_name: '销售部',
    is_disabled: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 4,
    username: 'wangwu',
    name: '王五',
    role: 'staff',
    position: '经理',
    department_id: 3,
    department_name: '市场部',
    is_disabled: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// 导出内存部门列表
export const memoryDepartments = [
  {
    id: 1,
    name: '技术部',
    code: 'TECH',
    parent_id: null,
    sort_order: 1,
    is_disabled: false,
  },
  {
    id: 2,
    name: '销售部',
    code: 'SALES',
    parent_id: null,
    sort_order: 2,
    is_disabled: false,
  },
  {
    id: 3,
    name: '市场部',
    code: 'MARKETING',
    parent_id: null,
    sort_order: 3,
    is_disabled: false,
  },
];

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
