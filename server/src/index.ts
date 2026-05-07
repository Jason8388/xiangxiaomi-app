import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// ES Module 兼容 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载环境变量
dotenv.config();

import userRoutes from "./routes/users";
import customerRoutes from "./routes/customers";
import contractRoutes from "./routes/contracts";
import deviceRoutes from "./routes/devices";
import warehouseRoutes from "./routes/warehouses";
import workOrderRoutes from "./routes/workOrders";
import knowledgeRoutes from "./routes/knowledge";
import materialRoutes from "./routes/materials";
import fileRoutes from "./routes/files";
import mediaRoutes from "./routes/media";
import appVersionRoutes from "./routes/app-version";
import sessionRoutes from "./routes/sessions";
import dbBackupRoutes from "./routes/db-backup";
import versionReleaseRoutes from "./routes/version-release";
import versionRollbackRoutes from "./routes/version-rollback";
import departmentRoutes from "./routes/departments";
import reminderRoutes from "./routes/reminders";
import workOrderReminderRoutes from "./routes/workOrderReminders";
import organizationRoutes from "./routes/organization";
import meetingMinutesRoutes from "./routes/meeting-minutes";
import afterSalesRoutes from "./routes/afterSales";
import materialNotificationsRoutes from "./routes/materialNotifications";
import materialRequirementsRoutes from "./routes/materialRequirements";
import minutesRoutes from "./routes/minutes";
import qrcodeRoutes from "./routes/qrcode";
import queryRoutes from "./routes/query";
import reportsRoutes from "./routes/reports";
import standardMaterialListsRoutes from "./routes/standardMaterialLists";
import uploadRoutes from "./routes/upload";
import exportRoutes from "./routes/export";
import permissionRoutes from "./routes/permissions";
import logRoutes from "./routes/logs";
import systemCleanupRoutes from "./routes/system-cleanup";

const app = express();
const port = process.env.PORT || 9091;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/contracts', contractRoutes);
app.use('/api/v1/devices', deviceRoutes);
app.use('/api/v1/warehouses', warehouseRoutes);
app.use('/api/v1/work-orders', workOrderRoutes);
app.use('/api/v1/knowledge', knowledgeRoutes);
app.use('/api/v1/materials', materialRoutes);
app.use('/api/v1/files', fileRoutes);
app.use('/api/v1/media', mediaRoutes);
app.use('/api/v1/app-version', appVersionRoutes);
app.use('/api/v1/sessions', sessionRoutes);
app.use('/api/v1/db-backup', dbBackupRoutes);
app.use('/api/v1/version-release', versionReleaseRoutes);
app.use('/api/v1/version-rollback', versionRollbackRoutes);
app.use('/api/v1/departments', departmentRoutes);
app.use('/api/v1/reminders', reminderRoutes);
app.use('/api/v1/work-order-reminders', workOrderReminderRoutes);
app.use('/api/v1/organization', organizationRoutes);
app.use('/api/v1/meeting-minutes', meetingMinutesRoutes);
app.use('/api/v1/after-sales', afterSalesRoutes);
app.use('/api/v1/material-notifications', materialNotificationsRoutes);
app.use('/api/v1/material-requirements', materialRequirementsRoutes);
app.use('/api/v1/minutes', minutesRoutes);
app.use('/api/v1/qrcode', qrcodeRoutes);
app.use('/api/v1/query', queryRoutes);
app.use('/api/v1/reports', reportsRoutes);
app.use('/api/v1/standard-material-lists', standardMaterialListsRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/export', exportRoutes);
app.use('/api/v1/permissions', permissionRoutes);
app.use('/api/v1/logs', logRoutes);
app.use('/api/v1/system-cleanup', systemCleanupRoutes);

// 根路由
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'API Server is running' });
});

// Health check
app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================
// PC端 Web 静态资源托管 (SPA路由支持)
// ============================================
// 静态资源在构建时已复制到 server/dist/client-dist/
const clientDistPath = path.join(__dirname, 'client-dist');

// 静态资源托管
app.use('/_expo', express.static(path.join(clientDistPath, '_expo')));
app.use('/assets', express.static(path.join(clientDistPath, 'assets')));
app.use('/favicon.ico', express.static(path.join(clientDistPath, 'favicon.ico')));

// 静态资源托管（处理 /pc/* 的静态文件请求）
app.use('/pc', express.static(clientDistPath));

// PC端 SPA 路由 fallback - 所有 /pc/* 请求返回 index.html
app.get('/pc/*', (req, res) => {
  const indexPath = path.join(clientDistPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('PC端 index.html not found:', indexPath);
      res.status(404).send('PC端页面未构建，请先执行 npm run build:web');
    }
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Health check: http://localhost:${port}/api/v1/health`);
});

export default app;
