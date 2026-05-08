const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { Pool } = require('pg');

const poolConfig = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL }
  : {
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT || 5432,
    };

// Force SSL for non-local
if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('localhost')) {
    poolConfig.ssl = { rejectUnauthorized: false };
}

const pool = new Pool(poolConfig);

async function migrate() {
  console.log('🚀 Starting Profile v3 Migration...');
  console.log(`📡 Connecting to: ${poolConfig.connectionString ? 'DATABASE_URL' : poolConfig.host}`);
  
  const queries = [
    // Ensure basic profile fields exist
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name VARCHAR(255)',
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT',
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS favorite_team VARCHAR(255)',
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20)',
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT',
    
    // Ensure football profile fields exist (original names)
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS position VARCHAR(50)',
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS secondary_position VARCHAR(50)',
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_foot VARCHAR(50)',
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS skill_level VARCHAR(50)',
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS playing_style VARCHAR(50)',
    
    // Ensure camelCase aliases requested by user exist as columns if preferred
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_position VARCHAR(50)',
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS strong_foot VARCHAR(50)',
    
    // Ensure avatar fields
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT',
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_style VARCHAR(50)',
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_seed VARCHAR(255)'
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

  console.log('\n🔍 Verifying columns in "users" table:');
  try {
      const res = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name IN (
            'display_name', 'favorite_team', 'phone_number', 'bio', 
            'position', 'preferred_position', 'preferred_foot', 'strong_foot', 
            'skill_level', 'playing_style', 'secondary_position', 'address'
        )
      `);
      console.table(res.rows);
  } catch (err) {
      console.error('❌ Verification failed:', err.message);
  }

  console.log('✅ Profile v3 Migration completed!');
  await pool.end();
}

migrate();
