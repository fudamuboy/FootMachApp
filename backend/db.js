const { Pool } = require('pg');
require('dotenv').config();

const isLocal = process.env.DATABASE_URL?.includes('localhost') || (!process.env.DATABASE_URL && (process.env.DB_HOST === 'localhost' || !process.env.DB_HOST));

const poolConfig = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL }
  : {
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'FootApp',
      password: process.env.DB_PASSWORD || 'nocap',
      port: process.env.DB_PORT || 5433,
    };

// Force SSL for non-local environments (Render/Supabase)
if (!isLocal) {
  poolConfig.ssl = { rejectUnauthorized: false };
}

const pool = new Pool(poolConfig);

// Debug connection on startup
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected database error:', err.message);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};
