import { Pool } from 'pg';

// 数据库连接配置
const pool = new Pool({
  host: process.env.DB_HOST || '172.36.0.169',
  port: parseInt(process.env.DB_PORT || '59833'),
  database: process.env.DB_NAME || 'postgres',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 20,
  min: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 120000,
  query_timeout: 120000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});

// 测试数据库连接
pool.on('connect', () => {
  console.log('Database connected');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  // 不要退出进程，让连接池自动重连
});

// 导出前测试连接
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection test failed:', err);
  } else {
    console.log('Database connection test succeeded');
  }
});

export default pool;
