require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'FootApp',
  password: process.env.DB_PASSWORD || 'nocap',
  port: process.env.DB_PORT || 5433,
});

pool.query(`
  ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255),
  ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP WITH TIME ZONE
`)
  .then(() => { 
    console.log('OK: Auth reset columns added to users'); 
    pool.end(); 
  })
  .catch(err => { 
    console.error('Error:', err.message); 
    pool.end(); 
  });
