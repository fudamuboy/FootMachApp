const db = require('../db');

async function completeMigration() {
    console.log('-------------------------------------------');
    console.log('🚀 STARTING COMPREHENSIVE DB MIGRATION');
    console.log('-------------------------------------------');

    // ── PRE-MIGRATION DIAGNOSTIC ──────────────────────────────
    console.log('\n📋 PRE-MIGRATION: Checking existing users columns...');
    try {
        const colCheck = await db.query(`
            SELECT column_name, data_type, column_default
            FROM information_schema.columns
            WHERE table_name = 'users'
            ORDER BY ordinal_position;
        `);
        const existingCols = colCheck.rows.map(r => r.column_name);
        console.log('📊 Existing columns:', existingCols.join(', '));

        const required = ['role', 'is_premium', 'spam_score', 'trust_score', 'activity_score',
                          'premium_expires_at', 'premium_source', 'premium_plan'];
        const missing = required.filter(c => !existingCols.includes(c));
        if (missing.length > 0) {
            console.log('⚠️  MISSING columns detected:', missing.join(', '));
        } else {
            console.log('✅ All required columns already exist — migration will be a no-op (safe).');
        }
    } catch (err) {
        console.warn('⚠️  Could not run pre-check:', err.message);
    }

    console.log('\n-------------------------------------------');

    const queries = [
        // ── Users Table — Profile Columns ────────────────────
        { name: 'display_name',       query: "ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name VARCHAR(255)" },
        { name: 'phone_number',        query: "ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20)" },
        { name: 'position',            query: "ALTER TABLE users ADD COLUMN IF NOT EXISTS position VARCHAR(50)" },
        { name: 'secondary_position',  query: "ALTER TABLE users ADD COLUMN IF NOT EXISTS secondary_position VARCHAR(50)" },
        { name: 'preferred_foot',      query: "ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_foot VARCHAR(50)" },
        { name: 'strong_foot',         query: "ALTER TABLE users ADD COLUMN IF NOT EXISTS strong_foot VARCHAR(50)" },
        { name: 'skill_level',         query: "ALTER TABLE users ADD COLUMN IF NOT EXISTS skill_level VARCHAR(50)" },
        { name: 'playing_style',       query: "ALTER TABLE users ADD COLUMN IF NOT EXISTS playing_style VARCHAR(50)" },
        { name: 'bio',                 query: "ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT" },
        { name: 'favorite_team',       query: "ALTER TABLE users ADD COLUMN IF NOT EXISTS favorite_team VARCHAR(255)" },
        { name: 'avatar_style',        query: "ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_style VARCHAR(50) DEFAULT 'initials'" },
        { name: 'avatar_seed',         query: "ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_seed VARCHAR(255)" },
        { name: 'updated_at',          query: "ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP" },

        // ── Users Table — Role & Premium Columns ─────────────
        { name: 'role',                query: "ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user'" },
        { name: 'is_premium',          query: "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false" },
        { name: 'premium_expires_at',  query: "ALTER TABLE users ADD COLUMN IF NOT EXISTS premium_expires_at TIMESTAMP WITH TIME ZONE" },
        { name: 'premium_source',      query: "ALTER TABLE users ADD COLUMN IF NOT EXISTS premium_source TEXT" },
        { name: 'premium_plan',        query: "ALTER TABLE users ADD COLUMN IF NOT EXISTS premium_plan TEXT" },

        // ── Users Table — Score Columns ───────────────────────
        { name: 'trust_score',         query: "ALTER TABLE users ADD COLUMN IF NOT EXISTS trust_score INTEGER DEFAULT 100" },
        { name: 'activity_score',      query: "ALTER TABLE users ADD COLUMN IF NOT EXISTS activity_score INTEGER DEFAULT 0" },
        { name: 'spam_score',          query: "ALTER TABLE users ADD COLUMN IF NOT EXISTS spam_score INTEGER DEFAULT 0" },

        // ── Announcements Table ───────────────────────────────
        { name: 'announcements.status', query: "ALTER TABLE announcements ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active'" },

        // ── Data Initialization ───────────────────────────────
        { name: 'Init null status',    query: "UPDATE announcements SET status = 'active' WHERE status IS NULL" },
        { name: 'Init null role',      query: "UPDATE users SET role = 'user' WHERE role IS NULL" },
        { name: 'Init null is_premium',query: "UPDATE users SET is_premium = false WHERE is_premium IS NULL" },
        { name: 'Init null trust_score',query: "UPDATE users SET trust_score = 100 WHERE trust_score IS NULL" },
        { name: 'Init null spam_score', query: "UPDATE users SET spam_score = 0 WHERE spam_score IS NULL" },
        { name: 'Init null activity_score', query: "UPDATE users SET activity_score = 0 WHERE activity_score IS NULL" },
    ];

    let successCount = 0;
    let errorCount = 0;

    for (const q of queries) {
        try {
            console.log(`⏳ Migrating: ${q.name}...`);
            await db.query(q.query);
            console.log(`✅ Success: ${q.name}`);
            successCount++;
        } catch (err) {
            if (err.code === '42701') { // column already exists
                console.log(`ℹ️  Already exists: ${q.name}`);
                successCount++;
            } else {
                console.error(`❌ Error migrating ${q.name}:`, err.message);
                errorCount++;
            }
        }
    }

    // ── POST-MIGRATION DIAGNOSTIC ─────────────────────────────
    console.log('\n-------------------------------------------');
    console.log('📋 POST-MIGRATION: Verifying critical columns...');
    try {
        const colCheck = await db.query(`
            SELECT column_name, data_type, column_default
            FROM information_schema.columns
            WHERE table_name = 'users'
              AND column_name IN ('role','is_premium','spam_score','trust_score','activity_score','premium_expires_at','premium_source','premium_plan')
            ORDER BY column_name;
        `);
        if (colCheck.rows.length === 0) {
            console.error('❌ CRITICAL: No premium/role columns found after migration!');
        } else {
            console.log('✅ Verified columns present in DB:');
            colCheck.rows.forEach(r => {
                console.log(`   • ${r.column_name} (${r.data_type}) — default: ${r.column_default || 'none'}`);
            });

            const verified = colCheck.rows.map(r => r.column_name);
            const required = ['role','is_premium','spam_score','trust_score','activity_score'];
            const stillMissing = required.filter(c => !verified.includes(c));
            if (stillMissing.length > 0) {
                console.error('❌ STILL MISSING after migration:', stillMissing.join(', '));
            } else {
                console.log('🎉 ALL CRITICAL COLUMNS ARE PRESENT!');
            }
        }
    } catch (err) {
        console.warn('⚠️  Could not run post-check:', err.message);
    }

    console.log('-------------------------------------------');
    console.log(`📊 Results: ${successCount} succeeded, ${errorCount} failed`);
    console.log('🎉 COMPREHENSIVE MIGRATION FINISHED!');
    console.log('-------------------------------------------');

    process.exit(errorCount > 0 ? 1 : 0);
}

completeMigration().catch(err => {
    console.error('💥 CRITICAL MIGRATION ERROR:', err.message);
    process.exit(1);
});
