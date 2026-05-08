const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function testStats(userId) {
    try {
        console.log(`🔍 Testing stats for user: ${userId}`);

        // 1. Matches Count
        const matchesResult = await pool.query(
            "SELECT COUNT(*) FROM announcements WHERE user_id = $1 AND status = 'active'",
            [userId]
        );
        const matchesCount = parseInt(matchesResult.rows[0].count);
        console.log('Matches count:', matchesCount);

        const activeFutureMatchesResult = await pool.query(
            "SELECT COUNT(*) FROM announcements WHERE user_id = $1 AND status = 'active' AND match_time >= CURRENT_TIMESTAMP",
            [userId]
        );
        const activeFutureMatchesCount = parseInt(activeFutureMatchesResult.rows[0].count);
        console.log('Active future matches:', activeFutureMatchesCount);

        // 2. Rating & Reviews
        const reviewsResult = await pool.query(
            'SELECT AVG(rating) as average_rating, COUNT(*) as reviews_count FROM reviews WHERE target_user_id = $1',
            [userId]
        );
        const rating = reviewsResult.rows[0].average_rating ? parseFloat(reviewsResult.rows[0].average_rating).toFixed(1) : null;
        const reviewsCount = parseInt(reviewsResult.rows[0].reviews_count);
        console.log('Rating:', rating, 'Reviews:', reviewsCount);

        // 3. User Info
        const userResult = await pool.query(
            `SELECT username, email, phone_number, city, region, position, preferred_foot, bio, favorite_team, 
             is_premium, premium_expires_at, premium_source, premium_plan, xp_points, avatar_url, has_seen_onboarding,
             role, trust_score, activity_score, spam_score
             FROM users WHERE id = $1`,
            [userId]
        );
        const user = userResult.rows[0];
        console.log('User found:', !!user);

        // 4. Activity Score Calculation
        const positiveReviewsResult = await pool.query(
            'SELECT COUNT(*) FROM reviews WHERE target_user_id = $1 AND rating >= 4',
            [userId]
        );
        const positiveReviewsCount = parseInt(positiveReviewsResult.rows[0].count);

        const uniqueChatsResult = await pool.query(
            `SELECT COUNT(DISTINCT CASE WHEN participant_1 = $1 THEN participant_2 ELSE participant_1 END) 
             FROM chats WHERE participant_1 = $1 OR participant_2 = $1`,
            [userId]
        );
        const uniqueChatPartners = parseInt(uniqueChatsResult.rows[0].count);

        const calculatedActivityScore = (matchesCount * 5) + (positiveReviewsCount * 10) + (uniqueChatPartners * 5);
        console.log('Calculated Activity Score:', calculatedActivityScore);

        console.log('✅ Test completed successfully!');
    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
        if (error.stack) console.error(error.stack);
    } finally {
        await pool.end();
    }
}

testStats('2519bb13-3114-4a0d-b7a7-1011ff190670');
