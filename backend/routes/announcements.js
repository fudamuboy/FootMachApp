const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

// Get announcements with optional filters (city, location, past)
router.get('/', async (req, res) => {
  try {
    const { city, location, past } = req.query;

    const timeFilter = past === 'true'
      ? `a.match_time < CURRENT_TIMESTAMP`
      : `a.match_time >= CURRENT_TIMESTAMP`;

    let query = `
      SELECT a.*, u.username, u.avatar_url, u.phone_number 
      FROM announcements a
      JOIN users u ON a.user_id = u.id
      WHERE ${timeFilter} AND a.status = 'active'
    `;
    const params = [];
    let paramIndex = 1;

    if (city) {
      query += ` AND a.city = $${paramIndex}`;
      params.push(city);
      paramIndex++;
    }

    if (location) {
      query += ` AND a.location ILIKE $${paramIndex}`;
      params.push(`%${location}%`);
      paramIndex++;
    }

    const order = past === 'true' ? 'DESC' : 'ASC';
    query += ` ORDER BY a.is_boosted DESC, a.match_time ${order}`;

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create announcement
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      team_name, match_time, location, city, region,
      players_needed, description,
      match_format, match_fee, skill_level
    } = req.body;
    const user_id = req.user.id;

    if (!team_name || !match_time || !location || !city) {
      return res.status(400).json({ errorCode: 'MISSING_FIELDS', message: 'Missing required fields' });
    }

    const FREE_ACTIVE_ANNOUNCEMENT_LIMIT = 10;
    
    const userStats = await db.query('SELECT role, is_premium, spam_score FROM users WHERE id = $1', [user_id]);
    const user = userStats.rows[0];
    
    if (user.spam_score > 100) {
        return res.status(403).json({ errorCode: 'ACCOUNT_RESTRICTED', message: 'Account restricted due to high spam score.' });
    }
    
    // 1. Check EXACT match_time duplicate (same date & time)
    if (!user.is_premium && user.role !== 'developer' && user.role !== 'admin') {
        const exactTimeCheck = await db.query(
            `SELECT COUNT(*) FROM announcements 
             WHERE user_id = $1 AND status = 'active' AND match_time = $2 AND match_time >= CURRENT_TIMESTAMP`,
            [user_id, match_time]
        );
        
        if (parseInt(exactTimeCheck.rows[0].count) > 0) {
            await db.query('UPDATE users SET spam_score = spam_score + 5 WHERE id = $1', [user_id]);
            return res.status(409).json({ errorCode: 'DUPLICATE_MATCH_TIME', message: 'Vous avez déjà une annonce active à cette date et cette heure.' });
        }
        
        // Anti-spam temporel : limiter à 3 annonces créées dans la dernière heure
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const recentCreationsCheck = await db.query(
            `SELECT COUNT(*) FROM announcements WHERE user_id = $1 AND created_at >= $2`,
            [user_id, oneHourAgo]
        );
        if (parseInt(recentCreationsCheck.rows[0].count) >= 3) {
             await db.query('UPDATE users SET spam_score = spam_score + 5 WHERE id = $1', [user_id]);
             return res.status(429).json({ errorCode: 'TEMPORAL_LIMIT_REACHED', message: 'Vous avez créé trop d\'annonces récemment. Veuillez patienter un peu.' });
        }
    }

    // 2. Check duplicate spam (same team_name, location, city today)
    const today = new Date();
    today.setHours(0,0,0,0);
    const duplicateCheck = await db.query(
        `SELECT COUNT(*) FROM announcements 
         WHERE user_id = $1 AND team_name = $2 AND location = $3 AND city = $4 AND created_at >= $5`,
        [user_id, team_name, location, city, today]
    );
    
    if (parseInt(duplicateCheck.rows[0].count) > 0) {
        // Increment spam score
        await db.query('UPDATE users SET spam_score = spam_score + 10 WHERE id = $1', [user_id]);
        return res.status(400).json({ errorCode: 'SPAM_DETECTED', message: 'Duplicate announcement detected.' });
    }
    
    // 2. Check active announcement limit for free users
    if (!user.is_premium && user.role !== 'developer' && user.role !== 'admin') {
        const activeCountRes = await db.query(
            `SELECT COUNT(*) FROM announcements WHERE user_id = $1 AND status = 'active' AND match_time >= CURRENT_TIMESTAMP`,
            [user_id]
        );
        if (parseInt(activeCountRes.rows[0].count) >= FREE_ACTIVE_ANNOUNCEMENT_LIMIT) {
            return res.status(403).json({ errorCode: 'FREE_LIMIT_REACHED', message: `Free users are limited to ${FREE_ACTIVE_ANNOUNCEMENT_LIMIT} active announcements.` });
        }
    }

    const newAnnouncement = await db.query(
      `INSERT INTO announcements 
        (user_id, team_name, match_time, location, city, region, players_needed, description, match_format, match_fee, skill_level)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [user_id, team_name, match_time, location, city, region || null,
       players_needed || 1, description || null,
       match_format || null, match_fee || 'free', skill_level || null]
    );

    const result = await newAnnouncement;
    
    // Award 50 XP for organizing a match
    try {
      await db.query(
        'UPDATE users SET xp_points = xp_points + 50, last_xp_update = CURRENT_TIMESTAMP WHERE id = $1',
        [user_id]
      );
      console.log(`[XP] Awarded 50 XP to user ${user_id} for organizing a match`);
    } catch (xpError) {
      console.error('Error awarding XP:', xpError);
    }

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({ errorCode: 'SERVER_ERROR', message: 'Server error' });
  }
});

// Delete announcement
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    const announcementResult = await db.query('SELECT * FROM announcements WHERE id = $1', [id]);

    if (announcementResult.rows.length === 0) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    if (announcementResult.rows[0].user_id !== user_id) {
      return res.status(403).json({ message: 'Not authorized to delete this announcement' });
    }

    await db.query("UPDATE announcements SET status = 'cancelled' WHERE id = $1", [id]);
    res.json({ message: 'Announcement cancelled' });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Boost announcement (Rewarded Ad Success Callback)
router.post('/:id/boost', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    const result = await db.query(
      'UPDATE announcements SET is_boosted = true WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Announcement not found or not authorized' });
    }

    res.json({ message: 'Announcement boosted successfully', announcement: result.rows[0] });
  } catch (error) {
    console.error('Error boosting announcement:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
