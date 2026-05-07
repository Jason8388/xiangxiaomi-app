# 项目信息与问题修复历史

## 项目基本信息

### 项目类型
- **项目名称**: 项小秘 (XiangXiaoMi)
- **项目ID**: 7625520414093148200
- **技术栈**: Expo 54 + React Native + Express.js 全栈应用
- **功能模块**: 
  - PC端: 设备管理、员工管理、客户管理、合同管理、工单管理等
  - APP端: 移动端设备管理
- **部署环境**: 
  - 开发环境: dev.coze.site
  - 生产环境: coze.site

### 项目结构
```
/workspace/projects/
├── client/                    # React Native 前端
│   ├── app/                   # Expo Router 路由
│   │   ├── _layout.tsx       # 根布局
│   │   ├── index.tsx         # APP首页
│   │   └── pc/               # PC端页面
│   │       ├── login.tsx     # PC登录
│   │       ├── devices.tsx   # 设备管理
│   │       └── ...
│   ├── screens/              # 页面实现
│   └── dist/                 # Web构建产物
├── server/                   # Express.js 后端
│   ├── src/
│   │   ├── index.ts          # 服务入口
│   │   └── routes/           # API路由
│   └── dist/                 # 服务构建产物
└── .coze                     # 平台配置
```

### 关键配置
- **入口文件**: client/app/_layout.tsx
- **PC端登录**: client/app/pc/login.tsx
- **API前缀**: /api/v1
- **后端端口**: 9091 (开发) / 5000 (生产FaaS)

---

## 问题修复历史

### 问题1: API地址使用localhost导致下载失败
- **现象**: PC端下载功能无效，显示空白页
- **原因**: API地址硬编码为localhost，在生产环境无法访问
- **修复**: 使用`getApiBaseUrl()`工具函数动态获取API地址
- **涉及文件**: client/app/pc/devices.tsx, client/app/pc/device-history.tsx

### 问题2: APP端启动闪退
- **现象**: APP端启动时闪退
- **原因**: _layout.tsx中使用了document.querySelectorAll（浏览器API）
- **修复**: 改为`typeof document === 'undefined'`平台检查
- **涉及文件**: client/app/_layout.tsx

### 问题3: 账号禁用后启用无效
- **现象**: 禁用账号后重新启用不起作用
- **原因**: 获取用户列表时缺少include_disabled=true参数
- **修复**: 添加include_disabled=true参数到fetch请求
- **涉及文件**: client/app/pc/employee-management.tsx

### 问题4: 禁用API返回500错误
- **现象**: 禁用用户API在内存存储模式下返回500
- **原因**: 禁用API没有支持内存存储模式
- **修复**: 添加内存存储分支处理
- **涉及文件**: server/src/routes/users.ts

### 问题5: PC端404问题
- **现象**: 访问/pc/*路径返回404
- **原因**: 后端缺少静态文件支持和SPA fallback
- **修复**: 
  1. 添加/pc/*路由和SPA fallback
  2. 添加ES Module兼容的__dirname
- **涉及文件**: server/src/index.ts

### 问题6: 生产环境PC端404
- **现象**: 部署后生产环境/pc/login返回404
- **原因**: 
  1. client/dist未被复制到server/dist
  2. 静态资源路径引用错误
  3. 缺少/_expo等静态资源路由
- **修复**:
  1. 在构建时将client/dist复制到server/dist/client-dist/
  2. 使用path.join(__dirname, 'client-dist')引用静态资源
  3. 添加/_expo、/assets、/favicon.ico静态路由
- **涉及文件**: server/src/index.ts, .cozeproj/scripts/prod_build.sh

---

## 当前状态

### 已提交代码
- commit: 76a3bfa - fix: 添加静态资源路由支持 (_expo, assets, favicon)
- 所有静态资源路由已配置完成

### 待验证
- 生产环境PC端登录页面
- 生产环境API功能
- 完整的登录流程

---

## 关键API端点

### 认证相关
- POST /api/v1/auth/login - 用户登录
- POST /api/v1/auth/register - 用户注册
- POST /api/v1/auth/logout - 用户登出
- GET /api/v1/auth/current - 获取当前用户

### 设备管理
- GET /api/v1/devices - 获取设备列表
- POST /api/v1/devices - 创建设备
- PUT /api/v1/devices/:id - 更新设备
- DELETE /api/v1/devices/:id - 删除设备

### 员工管理
- GET /api/v1/users - 获取用户列表
- POST /api/v1/users - 创建用户
- PUT /api/v1/users/:id - 更新用户
- DELETE /api/v1/users/:id - 删除用户
- PUT /api/v1/users/:id/disable - 禁用用户
- PUT /api/v1/users/:id/enable - 启用用户

---

## 部署配置

### .coze文件配置
```toml
[project]
entrypoint = "client/app/_layout.tsx"
requires = ["nodejs-24"]

[deploy]
build = ["bash", ".cozeproj/scripts/prod_build.sh"]
run = ["bash", ".cozeproj/scripts/prod_run.sh"]
build_app_dir = "./client"
```

### 生产环境变量
- NODE_ENV=production
- PORT=5000 (FaaS自动设置)
