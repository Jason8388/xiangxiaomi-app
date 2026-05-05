import { Pool } from 'pg';

// 解析 DATABASE_URL
function parseDatabaseUrl(url: string): {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
} {
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: parseInt(parsed.port) || 5432,
      database: parsed.pathname.slice(1),
      user: parsed.username,
      password: parsed.password,
    };
  } catch (error) {
    console.error('Failed to parse DATABASE_URL:', error);
    return {
      host: '172.36.0.169',
      port: 59833,
      database: 'postgres',
      user: 'postgres',
      password: 'postgres',
    };
  }
}

let dbConfig = {
  host: process.env.DB_HOST || '172.36.0.169',
  port: parseInt(process.env.DB_PORT || '59833'),
  database: process.env.DB_NAME || 'postgres',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
};

// 优先使用 DATABASE_URL
if (process.env.DATABASE_URL) {
  dbConfig = parseDatabaseUrl(process.env.DATABASE_URL);
}

// 数据库连接配置 - 优化超时设置
const pool = new Pool({
  ...dbConfig,
  max: 10,
  min: 1,
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 30000,  // 30秒连接超时
  query_timeout: 60000,           // 60秒查询超时
  keepAlive: true,
  keepAliveInitialDelayMillis: 30000,
  ssl: {
    rejectUnauthorized: false,
  },
});

// 允许设置是否使用数据库的标志（初始为false，只有数据库连接测试成功后才设置为true）
export let USE_DATABASE = false;

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
