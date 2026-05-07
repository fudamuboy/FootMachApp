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
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS favorite_team VARCHAR(255),
  ADD COLUMN IF NOT EXISTS secondary_position VARCHAR(50),
  ADD COLUMN IF NOT EXISTS skill_level VARCHAR(50),
  ADD COLUMN IF NOT EXISTS playing_style VARCHAR(50),
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS position VARCHAR(50),
  ADD COLUMN IF NOT EXISTS preferred_foot VARCHAR(50)
`)
  .then(() => { 
    console.log('OK: Profile v2 columns added to users'); 
    pool.end(); 
  })
  .catch(err => { 
    console.error('Error:', err.message); 
    pool.end(); 
  });
