import { Pool } from 'pg';

// 数据库连接配置 - 增加超时时间和重连机制
const pool = new Pool({
  host: process.env.DB_HOST || '172.36.0.169',
  port: parseInt(process.env.DB_PORT || '59833'),
  database: process.env.DB_NAME || 'postgres',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 10,
  min: 2,
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 60000,
  query_timeout: 60000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 30000,
  ssl: {
    rejectUnauthorized: false,
  },
});

// 连接错误处理
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
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
