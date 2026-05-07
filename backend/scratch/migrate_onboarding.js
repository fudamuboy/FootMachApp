const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  await client.connect();
  
  console.log('Adding onboarding flag to users...');
  await client.query(`
    ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS has_seen_onboarding BOOLEAN DEFAULT FALSE
  `);
  
  console.log('✅ DB Migration for onboarding completed');
  await client.end();
}

run().catch(console.error);
