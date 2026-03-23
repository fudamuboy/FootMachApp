require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'FootApp',
  password: process.env.DB_PASSWORD || 'nocap',
  port: process.env.DB_PORT || 5433,
});

pool.query(`ALTER TABLE announcements ADD COLUMN IF NOT EXISTS region VARCHAR(255)`)
  .then(() => { console.log('OK: region column added to announcements'); pool.end(); })
  .catch(err => { console.error('Error:', err.message); pool.end(); });
