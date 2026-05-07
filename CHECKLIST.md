# 生产环境部署前问题检查清单

## 一、构建产物检查

### 1.1 Server 构建产物
- [ ] server/dist/index.js 存在
- [ ] server/dist/client-dist/ 目录存在
- [ ] client-dist/index.html 存在
- [ ] client-dist/_expo/ 静态资源存在
- [ ] client-dist/assets/ 资源存在

### 1.2 静态资源完整性
- [ ] _expo/static/css/ 目录存在且有内容
- [ ] _expo/static/js/ 目录存在且有内容
- [ ] favicon.ico 存在
- [ ] assets/ 目录存在

---

## 二、路由配置检查

### 2.1 API 路由 (server/src/index.ts)
- [ ] /api/v1/* 所有路由正确注册
- [ ] 静态路由在动态路由之前定义
- [ ] /api/v1/health 健康检查端点存在

### 2.2 SPA 路由支持
- [ ] /pc/* 路由 fallback 到 index.html
- [ ] /_expo/* 静态资源路由
- [ ] /assets/* 静态资源路由
- [ ] /favicon.ico 静态资源路由

---

## 三、环境配置检查

### 3.1 生产环境变量
- [ ] NODE_ENV=production
- [ ] PORT 配置正确 (5000)
- [ ] 数据库连接或内存存储模式

### 3.2 跨域配置
- [ ] CORS 配置允许前端域名

---

## 四、功能测试检查

### 4.1 页面加载测试
- [ ] GET / 返回 200
- [ ] GET /pc/login 返回 200
- [ ] GET /pc/devices 返回 200
- [ ] GET /pc/employee-management 返回 200

### 4.2 静态资源测试
- [ ] GET /_expo/static/css/*.css 返回 200
- [ ] GET /_expo/static/js/*.js 返回 200
- [ ] GET /favicon.ico 返回 200

### 4.3 API 功能测试
- [ ] GET /api/v1/health 返回 200
- [ ] POST /api/v1/auth/login 正常响应
- [ ] GET /api/v1/devices 正常响应

---

## 五、认证流程检查

### 5.1 登录页面
- [ ] 页面可访问
- [ ] 表单渲染正常
- [ ] CSS 样式加载正常
- [ ] JavaScript 执行正常

### 5.2 登录功能
- [ ] 用户名/密码输入框可用
- [ ] 提交按钮响应
- [ ] 登录成功后跳转
- [ ] Token 存储正确

### 5.3 受保护页面
- [ ] 未登录访问 /pc/devices 重定向到登录页
- [ ] 登录后访问 /pc/devices 正常显示

---

## 六、已知问题回顾

### 问题修复验证
- [ ] API 地址不再使用 localhost
- [ ] APP 端不再使用 document.querySelectorAll
- [ ] 禁用用户 API 支持内存存储
- [ ] 用户列表包含禁用的用户
- [ ] PC 端静态资源路径正确

---

## 七、Coze 平台特定检查

### 7.1 部署配置
- [ ] .coze 文件 entrypoint 正确
- [ ] 构建脚本执行成功
- [ ] 运行脚本正确启动服务

### 7.2 FaaS 环境
- [ ] 服务监听正确端口
- [ ] 静态资源路径兼容 FaaS 环境
- [ ] 日志输出正常

---

## 八、性能与安全检查

### 8.1 性能
- [ ] 静态资源启用压缩
- [ ] 静态资源启用缓存
- [ ] API 响应时间合理

### 8.2 安全
- [ ] CORS 配置正确
- [ ] 敏感端点需要认证
- [ ] 错误信息不泄露敏感信息

---

## 九、用户体验检查

### 9.1 页面渲染
- [ ] 首次加载时间 < 3秒
- [ ] 页面无白屏/闪烁
- [ ] 动画流畅

### 9.2 交互响应
- [ ] 按钮点击有反馈
- [ ] 表单验证友好
- [ ] 错误提示清晰
