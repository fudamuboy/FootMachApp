const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  await client.connect();
  
  console.log('Adding is_premium column to users...');
  await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE');
  
  console.log('Creating reviews table...');
  await client.query(`
    CREATE TABLE IF NOT EXISTS reviews (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      reviewer_id UUID REFERENCES users(id) ON DELETE CASCADE,
      target_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      rating INTEGER CHECK (rating >= 1 AND rating <= 5),
      comment TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  console.log('✅ DB Migration completed');
  await client.end();
}

run().catch(console.error);
