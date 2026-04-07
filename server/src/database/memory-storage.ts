// 临时的内存用户存储（用于演示）
export const memoryUsers = {
  admin: {
    id: 1,
    username: 'admin',
    password: 'mc6668',
    name: '管理员',
    role: 'admin',
    position: '管理员',
    phone: '15392966668',
    department_id: 1,
    department_name: '五金事业部',
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
    name: '管理员',
    role: 'admin',
    position: '管理员',
    phone: '15392966668',
    department_id: 1,
    department_name: '五金事业部',
    is_disabled: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// 导出内存部门列表
export const memoryDepartments = [
  {
    id: 1,
    name: '五金事业部',
    code: 'HARDWARE',
    parent_id: null,
    sort_order: 1,
    is_disabled: false,
  },
  {
    id: 2,
    name: '项目部',
    code: 'PROJECT',
    parent_id: 1,
    sort_order: 10,
    is_disabled: false,
  },
  {
    id: 3,
    name: '运营部',
    code: 'OPERATION',
    parent_id: 1,
    sort_order: 20,
    is_disabled: false,
  },
  {
    id: 4,
    name: '销售部',
    code: 'SALES',
    parent_id: 1,
    sort_order: 30,
    is_disabled: false,
  },
  {
    id: 5,
    name: '生产部',
    code: 'PRODUCTION',
    parent_id: 1,
    sort_order: 40,
    is_disabled: false,
  },
  {
    id: 6,
    name: '技术服务一组',
    code: 'TS_GROUP_1',
    parent_id: 2,
    sort_order: 1,
    is_disabled: false,
  },
  {
    id: 7,
    name: '技术服务二组',
    code: 'TS_GROUP_2',
    parent_id: 2,
    sort_order: 2,
    is_disabled: false,
  },
  {
    id: 8,
    name: '技术服务三组',
    code: 'TS_GROUP_3',
    parent_id: 2,
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
