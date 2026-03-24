const { Pool } = require('pg');
require('dotenv').config();

const pool = process.env.DATABASE_URL
  ? new Pool({ 
      connectionString: process.env.DATABASE_URL,
      // For some providers (like Render or Railway), we might need ssl: { rejectUnauthorized: false }
      // but let's try standard first as it's cleaner.
    })
  : new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'FootApp',
      password: process.env.DB_PASSWORD || 'nocap',
      port: process.env.DB_PORT || 5433,
    });

module.exports = {
  query: (text, params) => pool.query(text, params),
};
