const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function migrate() {
  console.log('🚀 Starting Profile Migration v4...');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Add columns if they don't exist
    const columns = [
      ['display_name', 'VARCHAR(255)'],
      ['phone_number', 'VARCHAR(20)'],
      ['position', 'VARCHAR(50)'],
      ['secondary_position', 'VARCHAR(50)'],
      ['preferred_foot', 'VARCHAR(50)'],
      ['skill_level', 'VARCHAR(50)'],
      ['playing_style', 'VARCHAR(50)'],
      ['bio', 'TEXT'],
      ['favorite_team', 'VARCHAR(255)'],
      ['avatar_style', "VARCHAR(50) DEFAULT 'initials'"],
      ['avatar_seed', 'VARCHAR(255)'],
      ['has_seen_onboarding', 'BOOLEAN DEFAULT FALSE'],
      ['xp_points', 'INTEGER DEFAULT 0'],
      ['is_premium', 'BOOLEAN DEFAULT FALSE'],
      ['premium_expires_at', 'TIMESTAMP WITH TIME ZONE'],
      ['premium_source', 'VARCHAR(50)'],
      ['premium_plan', 'VARCHAR(50)'],
      ['trust_score', 'INTEGER DEFAULT 100'],
      ['activity_score', 'INTEGER DEFAULT 0'],
      ['spam_score', 'INTEGER DEFAULT 0']
    ];

    for (const [col, type] of columns) {
      const checkCol = await client.query(
        "SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = $1",
        [col]
      );
      if (checkCol.rows.length === 0) {
        console.log(`➕ Adding column: ${col} (${type})`);
        await client.query(`ALTER TABLE users ADD COLUMN ${col} ${type}`);
      } else {
        console.log(`✅ Column ${col} already exists.`);
      }
    }

    await client.query('COMMIT');
    console.log('🎉 Migration completed successfully!');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', e.message);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
