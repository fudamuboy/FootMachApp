const fs = require('fs');
const path = require('path');
const db = require('./db');

async function migrate() {
    try {
        console.log('Starting App Store compliance database migrations...');
        const sqlPath = path.join(__dirname, 'database_updates.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        await db.query(sql);
        console.log('✅ Migrations completed successfully.');
    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        process.exit();
    }
}

migrate();
