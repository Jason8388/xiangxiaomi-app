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

app.get('/api/v1/health', (req, res) => {
  console.log('Health check success');
  res.status(200).json({ status: 'ok' });
});


app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}/`);
});
