const { Pool } = require('pg');

let pool;

if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: parseInt(process.env.DB_POOL_MAX || '4', 10),
    idleTimeoutMillis: 15000,
    connectionTimeoutMillis: 5000,
  });
} else {
  pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'inst_sons',
    max: parseInt(process.env.DB_POOL_MAX || '4', 10),
    idleTimeoutMillis: 15000,
    connectionTimeoutMillis: 5000,
  });
}

pool.on('error', (err) => {
  console.error('[Database Pool Error]:', err);
});

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
};
