const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('localhost') 
    ? { rejectUnauthorized: false } 
    : false
});

async function runMigration() {
  console.log('🚀 Starting Render PostgreSQL Migration...');
  
  const queries = [
    // 0. Enable extensions
    'CREATE EXTENSION IF NOT EXISTS "uuid-ossp"',
    'CREATE EXTENSION IF NOT EXISTS "pgcrypto"',

    // 1. Ensure essential columns exist in users table
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name VARCHAR(255)',
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT',
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS favorite_team VARCHAR(255)',
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(50)',
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT',
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS city VARCHAR(255)',
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS region VARCHAR(255)',
    
    // 2. Ensure football profile columns exist
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS position VARCHAR(50)',
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_position VARCHAR(50)',
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS secondary_position VARCHAR(50)',
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_foot VARCHAR(50)',
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS strong_foot VARCHAR(50)',
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS skill_level VARCHAR(50)',
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS playing_style VARCHAR(50)',
    
    // 3. Ensure stats and social columns exist
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS xp_points INTEGER DEFAULT 0',
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS trust_score INTEGER DEFAULT 100',
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS activity_score INTEGER DEFAULT 0',
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS spam_score INTEGER DEFAULT 0',
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS has_seen_onboarding BOOLEAN DEFAULT FALSE',
    
    // 4. Create reviews table if missing
    `CREATE TABLE IF NOT EXISTS reviews (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      reviewer_id UUID REFERENCES users(id) ON DELETE CASCADE,
      target_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      rating INTEGER CHECK (rating >= 1 AND rating <= 5),
      comment TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`,
    
    // 5. Ensure updated_at exists
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP'
  ];

  for (const query of queries) {
    try {
      console.log(`📝 Executing: ${query.substring(0, 50)}...`);
      await pool.query(query);
    } catch (err) {
      console.error(`❌ Error executing query: ${query}`);
      console.error(`Error message: ${err.message}`);
    }
  }

  console.log('✅ Migration completed successfully!');
  await pool.end();
}

runMigration().catch(err => {
  console.error('💥 Migration failed!', err);
  process.exit(1);
});
