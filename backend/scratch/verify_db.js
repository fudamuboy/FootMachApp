const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function check() {
  const res = await pool.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name = 'display_name'
  `);
  console.log('Result for display_name:', res.rows);
  
  const res2 = await pool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_name = 'reviews'
  `);
  console.log('Result for reviews table:', res2.rows);
  
  await pool.end();
}

check().catch(console.error);
