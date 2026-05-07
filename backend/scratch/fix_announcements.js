const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  await client.connect();
  console.log('Adding is_boosted column...');
  await client.query('ALTER TABLE announcements ADD COLUMN IF NOT EXISTS is_boosted BOOLEAN DEFAULT FALSE');
  console.log('✅ Column added successfully');
  await client.end();
}

run().catch(console.error);
