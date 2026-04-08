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
      WHERE ${timeFilter}
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
      return res.status(400).json({ message: 'Missing required fields' });
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

    res.status(201).json(newAnnouncement.rows[0]);
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({ message: 'Server error' });
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

    await db.query('DELETE FROM announcements WHERE id = $1', [id]);
    res.json({ message: 'Announcement deleted' });
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
