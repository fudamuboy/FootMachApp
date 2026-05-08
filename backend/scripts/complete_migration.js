const db = require('../db');

async function completeMigration() {
    console.log('-------------------------------------------');
    console.log('🚀 STARTING COMPREHENSIVE DB MIGRATION');
    console.log('-------------------------------------------');

    const queries = [
        // 1. Users Table Columns
        { name: 'display_name', query: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name VARCHAR(255)' },
        { name: 'phone_number', query: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20)' },
        { name: 'position', query: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS position VARCHAR(50)' },
        { name: 'secondary_position', query: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS secondary_position VARCHAR(50)' },
        { name: 'preferred_foot', query: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_foot VARCHAR(50)' },
        { name: 'strong_foot', query: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS strong_foot VARCHAR(50)' },
        { name: 'skill_level', query: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS skill_level VARCHAR(50)' },
        { name: 'playing_style', query: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS playing_style VARCHAR(50)' },
        { name: 'bio', query: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT' },
        { name: 'favorite_team', query: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS favorite_team VARCHAR(255)' },
        { name: 'avatar_style', query: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_style VARCHAR(50) DEFAULT \'initials\'' },
        { name: 'avatar_seed', query: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_seed VARCHAR(255)' },
        { name: 'updated_at', query: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP' },

        // 2. Announcements Table Columns
        { name: 'announcements.status', query: 'ALTER TABLE announcements ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT \'active\'' },
        
        // 3. Data Cleanup/Initialization
        { name: 'Initialize null status', query: 'UPDATE announcements SET status = \'active\' WHERE status IS NULL' }
    ];

    for (const q of queries) {
        try {
            console.log(`⏳ Migrating: ${q.name}...`);
            await db.query(q.query);
            console.log(`✅ Success: ${q.name}`);
        } catch (err) {
            if (err.code === '42701') {
                console.log(`ℹ️ Info: ${q.name} already exists.`);
            } else {
                console.error(`❌ Error migrating ${q.name}:`, err.message);
            }
        }
    }

    console.log('-------------------------------------------');
    console.log('🎉 COMPREHENSIVE MIGRATION FINISHED!');
    console.log('-------------------------------------------');
    process.exit(0);
}

completeMigration().catch(err => {
    console.error('💥 CRITICAL MIGRATION ERROR:', err.message);
    process.exit(1);
});
