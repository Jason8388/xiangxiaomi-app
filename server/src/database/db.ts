import { Pool } from 'pg';

// 数据库连接配置
// 注意：这些参数应该从环境变量或配置文件中读取
// 如果数据库连接失败，请检查这些参数是否正确
const pool = new Pool({
  host: process.env.DB_HOST || '172.36.0.169',
  port: parseInt(process.env.DB_PORT || '59833'),
  database: process.env.DB_NAME || 'postgres',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// 测试数据库连接
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export default pool;
