const db = require('../db');

async function testNormalization() {
    console.log('🧪 Starting Profile Normalization Test...');
    
    // 1. Get a test user ID
    const userRes = await db.query('SELECT id FROM users LIMIT 1');
    if (userRes.rows.length === 0) {
        console.error('❌ No users found in DB');
        return;
    }
    const userId = userRes.rows[0].id;
    console.log(`👤 Using User ID: ${userId}`);

    // Helper to simulate the update logic in auth.js
    async function simulateUpdate(payload) {
        console.log(`\n📦 Testing Payload:`, JSON.stringify(payload));
        
        const { 
            position, preferredPosition, preferred_position,
            secondary_position, secondaryPosition,
            preferred_foot, strongFoot, strong_foot, foot,
            skill_level, skillLevel,
            playing_style, playingStyle
        } = payload;

        let updateQuery = 'UPDATE users SET ';
        const queryValues = [];
        let paramIdx = 1;
        
        const addField = (colName, val) => {
            if (val !== undefined) {
                updateQuery += `${colName} = $${paramIdx}, `;
                queryValues.push(val);
                paramIdx++;
                return true;
            }
            return false;
        };

        const finalPosition = (position || preferredPosition || preferred_position)?.toString().trim().toLowerCase() || undefined;
        if (finalPosition !== undefined) {
            addField('position', finalPosition);
            addField('preferred_position', finalPosition);
        }

        const finalFoot = (preferred_foot || strongFoot || strong_foot || foot)?.toString().trim().toLowerCase() || undefined;
        if (finalFoot !== undefined) {
            addField('preferred_foot', finalFoot);
            addField('strong_foot', finalFoot);
        }

        const finalSecondary = (secondary_position || secondaryPosition)?.toString().trim().toLowerCase() || undefined;
        if (finalSecondary !== undefined) {
            addField('secondary_position', finalSecondary);
        }

        const finalSkill = (skill_level || skillLevel)?.toString().trim().toLowerCase() || undefined;
        if (finalSkill !== undefined) {
            addField('skill_level', finalSkill);
        }

        const finalStyle = (playing_style || playingStyle)?.toString().trim().toLowerCase() || undefined;
        if (finalStyle !== undefined) {
            addField('playing_style', finalStyle);
        }

        updateQuery = updateQuery.slice(0, -2);
        updateQuery += ` WHERE id = $${paramIdx} RETURNING *`;
        queryValues.push(userId);

        try {
            const result = await db.query(updateQuery, queryValues);
            const row = result.rows[0];
            console.log('✅ Result Row (Subset):', {
                position: row.position,
                preferred_position: row.preferred_position,
                preferred_foot: row.preferred_foot,
                strong_foot: row.strong_foot,
                secondary_position: row.secondary_position,
                skill_level: row.skill_level,
                playing_style: row.playing_style
            });
        } catch (err) {
            console.error('❌ SQL Error:', err.message);
            if (err.detail) console.error('Detail:', err.detail);
        }
    }

    // Test Case 1: Mixed Case & CamelCase
    await simulateUpdate({
        preferredPosition: "CAM",
        strongFoot: "RIGHT",
        skillLevel: "Advanced",
        playingStyle: "Defender"
    });

    // Test Case 2: Snake Case & Lowercase (Standard)
    await simulateUpdate({
        position: "st",
        preferred_foot: "left",
        skill_level: "pro",
        playing_style: "attacker"
    });

    // Test Case 3: Mixed sources
    await simulateUpdate({
        preferred_position: "LW",
        foot: "Both",
        secondary_position: "RW"
    });

    console.log('\n🏁 Test finished.');
    process.exit(0);
}

testNormalization().catch(err => {
    console.error(err);
    process.exit(1);
});
