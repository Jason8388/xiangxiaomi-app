import express from "express";
import cors from "cors";
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

app.get('/api/v1/health', (req, res) => {
  console.log('Health check success');
  res.status(200).json({ status: 'ok' });
});


app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}/`);
});
