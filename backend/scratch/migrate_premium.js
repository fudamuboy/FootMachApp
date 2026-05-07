const db = require('../db');

async function migrate() {
    try {
        console.log('Starting Premium Migration...');
        
        // Users Table
        console.log('Updating users table...');
        await db.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS premium_source VARCHAR(50),
            ADD COLUMN IF NOT EXISTS premium_plan VARCHAR(50),
            ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user',
            ADD COLUMN IF NOT EXISTS trust_score INTEGER DEFAULT 100,
            ADD COLUMN IF NOT EXISTS activity_score INTEGER DEFAULT 0,
            ADD COLUMN IF NOT EXISTS spam_score INTEGER DEFAULT 0;
        `);
        console.log('✅ users table updated successfully.');

        // Announcements Table
        console.log('Updating announcements table...');
        await db.query(`
            ALTER TABLE announcements 
            ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';
        `);
        console.log('✅ announcements table updated successfully.');

        console.log('🎉 Migration complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

migrate();
