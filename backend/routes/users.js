const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

// Get real user statistics and progression
router.get('/me/stats', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Matches Count
    const matchesResult = await db.query(
      "SELECT COUNT(*) FROM announcements WHERE user_id = $1 AND status = 'active'",
      [userId]
    );
    const matchesCount = parseInt(matchesResult.rows[0].count);

    const activeFutureMatchesResult = await db.query(
      "SELECT COUNT(*) FROM announcements WHERE user_id = $1 AND status = 'active' AND match_time >= CURRENT_TIMESTAMP",
      [userId]
    );
    const activeFutureMatchesCount = parseInt(activeFutureMatchesResult.rows[0].count);

    // 2. Rating & Reviews
    const reviewsResult = await db.query(
      'SELECT AVG(rating) as average_rating, COUNT(*) as reviews_count FROM reviews WHERE target_user_id = $1',
      [userId]
    );
    const rating = reviewsResult.rows[0].average_rating ? parseFloat(reviewsResult.rows[0].average_rating).toFixed(1) : null;
    const reviewsCount = parseInt(reviewsResult.rows[0].reviews_count);

    // 3. User Info (XP, Premium, etc.)
    const userResult = await db.query(
      `SELECT username, email, phone_number, city, region, position, preferred_foot, bio, favorite_team, 
       is_premium, premium_expires_at, xp_points, avatar_url, has_seen_onboarding,
       role, trust_score, activity_score, spam_score
       FROM users WHERE id = $1`,
      [userId]
    );
    
    if (userResult.rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
    }
    const user = userResult.rows[0];

    // 4. Level System
    let level = 'Beginner';
    let nextLevel = 'Amateur';
    let progressToNext = 0;
    
    if (matchesCount >= 51) {
        level = 'Elite';
        nextLevel = 'Legend';
        progressToNext = 100;
    } else if (matchesCount >= 26) {
        level = 'Pro';
        nextLevel = 'Elite';
        progressToNext = ((matchesCount - 26) / (51 - 26)) * 100;
    } else if (matchesCount >= 11) {
        level = 'Regular';
        nextLevel = 'Pro';
        progressToNext = ((matchesCount - 11) / (26 - 11)) * 100;
    } else if (matchesCount >= 3) {
        level = 'Amateur';
        nextLevel = 'Regular';
        progressToNext = ((matchesCount - 3) / (11 - 3)) * 100;
    } else {
        level = 'Beginner';
        nextLevel = 'Amateur';
        progressToNext = (matchesCount / 3) * 100;
    }

    // 5. Badge System
    const badges = [];
    if (matchesCount < 3) badges.push({ id: 'new_player', label: 'New Player', icon: 'shield' });
    if (matchesCount >= 10) badges.push({ id: 'active_player', label: 'Active Player', icon: 'zap' });
    if (matchesCount >= 25) badges.push({ id: 'top_organizer', label: 'Top Organizer', icon: 'award' });
    if (rating >= 4.5 && reviewsCount >= 5) badges.push({ id: 'fair_player', label: 'Fair Player', icon: 'heart' });
    
    // Calculate dynamic activity score
    const positiveReviewsResult = await db.query(
      'SELECT COUNT(*) FROM reviews WHERE target_user_id = $1 AND rating >= 4',
      [userId]
    );
    const positiveReviewsCount = parseInt(positiveReviewsResult.rows[0].count);

    const uniqueChatsResult = await db.query(
      `SELECT COUNT(DISTINCT CASE WHEN participant_1 = $1 THEN participant_2 ELSE participant_1 END) 
       FROM chats WHERE participant_1 = $1 OR participant_2 = $1`,
      [userId]
    );
    const uniqueChatPartners = parseInt(uniqueChatsResult.rows[0].count);

    const calculatedActivityScore = (matchesCount * 5) + (positiveReviewsCount * 10) + (uniqueChatPartners * 5);
    
    if (calculatedActivityScore !== user.activity_score) {
      await db.query('UPDATE users SET activity_score = $1 WHERE id = $2', [calculatedActivityScore, userId]);
      user.activity_score = calculatedActivityScore;
    }

    // Check Premium Status (handle expiration)
    let isPremium = user.is_premium;
    let premiumSource = user.premium_source;
    let premiumPlan = user.premium_plan;
    let premiumExpiresAt = user.premium_expires_at;
    
    if (user.role === 'developer' || user.role === 'admin') {
        isPremium = true;
        premiumSource = 'developer';
        premiumPlan = 'developer';
        premiumExpiresAt = null;
    } else {
        if (user.premium_expires_at && new Date() > new Date(user.premium_expires_at)) {
            isPremium = false;
            await db.query('UPDATE users SET is_premium = false, premium_source = NULL, premium_plan = NULL WHERE id = $1', [userId]);
            premiumSource = null;
            premiumPlan = null;
            premiumExpiresAt = null;
        }
    }
    
    if (isPremium) badges.push({ id: 'gold_member', label: 'Gold Member', icon: 'star' });

    // 6. Profile Completion
    const completionFields = [
      'username', 'email', 'phone_number', 'city', 'region', 
      'position', 'preferred_foot', 'bio', 'favorite_team', 'avatar_url'
    ];
    let filledCount = 0;
    completionFields.forEach(field => {
      if (user[field] && user[field].toString().trim() !== '') {
        filledCount++;
      }
    });
    const profileCompletion = Math.round((filledCount / completionFields.length) * 100);

    // 7. Premium Progress (Activity Score: 100 for 7 days)
    const premiumThreshold = 100;
    const premiumProgress = Math.min(100, Math.round((user.activity_score / premiumThreshold) * 100));
    const activityRemainingForPremium = Math.max(0, premiumThreshold - user.activity_score);

    // 8. Auto-Unlock Premium Milestone (for non-developers)
    if (!isPremium && user.role !== 'developer' && user.role !== 'admin' && user.activity_score >= premiumThreshold && user.spam_score < 50) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        await db.query(
            'UPDATE users SET is_premium = true, premium_expires_at = $1, premium_source = $2 WHERE id = $3',
            [expiresAt, 'earned', userId]
        );
        isPremium = true;
        premiumExpiresAt = expiresAt;
        premiumSource = 'earned';
        badges.push({ id: 'gold_member', label: 'Gold Member', icon: 'star' });
    }

    res.json({
      rating: rating,
      reviewsCount: reviewsCount,
      matchesCount: matchesCount,
      level: level,
      nextLevel: nextLevel,
      progressToNext: Math.min(100, Math.round(progressToNext)),
      xpPoints: user.xp_points || 0,
      isPremium: isPremium,
      premiumExpiresAt: premiumExpiresAt,
      premiumSource: premiumSource,
      premiumPlan: premiumPlan,
      role: user.role,
      activityScore: user.activity_score,
      spamScore: user.spam_score,
      trustScore: user.trust_score,
      premiumProgress: premiumProgress,
      activityRemainingForPremium: activityRemainingForPremium,
      activeFutureMatchesCount: activeFutureMatchesCount,
      badges: badges,
      hasSeenOnboarding: user.has_seen_onboarding,
      position: user.position || null,
      city: user.city || null,
      profileCompletion: profileCompletion
    });

  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark onboarding as seen
router.post('/mark-onboarding-seen', authMiddleware, async (req, res) => {
    try {
        await db.query('UPDATE users SET has_seen_onboarding = true WHERE id = $1', [req.user.id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: 'Error updating onboarding status' });
    }
});

module.exports = router;
