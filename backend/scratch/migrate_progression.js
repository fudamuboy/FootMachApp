const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  await client.connect();
  
  console.log('Adding progression columns to users...');
  await client.query(`
    ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS xp_points INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS premium_expires_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS last_xp_update TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  `);
  
  console.log('✅ DB Migration for progression completed');
  await client.end();
}

run().catch(console.error);
