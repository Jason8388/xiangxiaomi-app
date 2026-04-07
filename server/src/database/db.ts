import { Pool } from 'pg';

// 数据库连接配置 - 优化超时和快速失败
const pool = new Pool({
  host: process.env.DB_HOST || '172.36.0.169',
  port: parseInt(process.env.DB_PORT || '59833'),
  database: process.env.DB_NAME || 'postgres',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 10,
  min: 1,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,  // 快速失败：5秒超时
  query_timeout: 10000,           // 查询超时：10秒
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
  ssl: {
    rejectUnauthorized: false,
  },
});

// 允许设置是否使用数据库的标志
export let USE_DATABASE = true;

// 关闭数据库连接的函数
export const closeDatabase = async () => {
  try {
    await pool.end();
    USE_DATABASE = false;
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error closing database:', error);
  }
};

// 导出前测试连接（异步，不阻塞启动）
pool.query('SELECT NOW()')
  .then(() => {
    console.log('Database connection test succeeded');
    USE_DATABASE = true;
  })
  .catch((err) => {
    console.error('Database connection test failed, will use memory storage:', err.message);
    USE_DATABASE = false;
  });

export default pool;
