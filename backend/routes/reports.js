const express = require('express');
const db = require('../db');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

// Report an item (user, announcement, chat)
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { reported_item_id, item_type, reason } = req.body;
        const reporter_id = req.user.id;

        if (!reported_item_id || !item_type || !reason) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const validTypes = ['user', 'announcement', 'chat'];
        if (!validTypes.includes(item_type)) {
            return res.status(400).json({ message: 'Invalid item type' });
        }

        const result = await db.query(
            'INSERT INTO reports (reporter_id, reported_item_id, item_type, reason) VALUES ($1, $2, $3, $4) RETURNING *',
            [reporter_id, reported_item_id, item_type, reason]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating report:', error);
        res.status(500).json({ message: 'Server error creating report' });
    }
});

// Admin ONLY: Get all reports
router.get('/', authMiddleware, async (req, res) => {
    try {
        // Simple admin check based on role in users table
        const userResult = await db.query('SELECT role FROM users WHERE id = $1', [req.user.id]);
        if (userResult.rows.length === 0 || userResult.rows[0].role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const result = await db.query('SELECT * FROM reports ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching reports:', error);
        res.status(500).json({ message: 'Server error fetching reports' });
    }
});

module.exports = router;
