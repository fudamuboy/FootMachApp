const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

// Get comments (all or filtered by city)
router.get('/', async (req, res) => {
  try {
    const { city } = req.query;
    let query = `
      SELECT c.*, u.username, u.avatar_url 
      FROM comments c
      JOIN users u ON c.user_id = u.id
    `;
    const params = [];

    if (city) {
      query += ` WHERE c.city = $1`;
      params.push(city);
    }

    query += ` ORDER BY c.created_at DESC`;

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching all comments:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get comments for a specific announcement
router.get('/announcement/:announcementId', async (req, res) => {
  try {
    const { announcementId } = req.params;

    const query = `
      SELECT c.*, u.username, u.avatar_url 
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.announcement_id = $1
      ORDER BY c.created_at DESC
    `;
    const result = await db.query(query, [announcementId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a comment / rating
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      announcement_id, rating, comment, team_name, city,
      fair_play, punctuality, level_of_play
    } = req.body;
    const user_id = req.user.id;

    if (!announcement_id || !comment) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Compute overall rating: if sub-ratings are provided, average them;
    // otherwise use the provided rating directly.
    let overallRating = rating;
    if (fair_play && punctuality && level_of_play) {
      overallRating = Math.round((fair_play + punctuality + level_of_play) / 3);
    }

    if (!overallRating || overallRating < 1 || overallRating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const newComment = await db.query(
      `INSERT INTO comments 
        (announcement_id, user_id, rating, comment, team_name, city, fair_play, punctuality, level_of_play)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [announcement_id, user_id, overallRating, comment, team_name, city,
       fair_play || null, punctuality || null, level_of_play || null]
    );

    res.status(201).json(newComment.rows[0]);
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
