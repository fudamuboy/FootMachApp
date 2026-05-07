const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  await client.connect();
  const res = await client.query('SELECT email FROM users LIMIT 1');
  console.log('Existing user:', res.rows[0]?.email);
  await client.end();
}

run().catch(console.error);
