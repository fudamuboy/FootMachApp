const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  await client.connect();
  const res = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'reviews'
  `);
  console.log('Reviews table exists:', res.rows.length > 0);
  await client.end();
}

run().catch(console.error);
