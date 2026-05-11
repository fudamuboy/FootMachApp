const db = require('../db');

async function testUpdate() {
  try {
    const userId = '3e86c0e5-7b56-4c4c-8f3b-8f3b8f3b8f3b'; // Just a dummy or real ID if known
    // Let's get a real ID first
    const user = await db.query('SELECT id FROM users LIMIT 1');
    if (user.rows.length === 0) {
      console.log('No users found');
      return;
    }
    const id = user.rows[0].id;
    console.log('Testing update for user:', id);
    
    const result = await db.query('UPDATE users SET display_name = $1 WHERE id = $2 RETURNING *', ['Test Name', id]);
    console.log('Update successful:', result.rows[0].display_name);
  } catch (error) {
    console.error('Update failed:', error.message);
  }
}

testUpdate().then(() => process.exit());
