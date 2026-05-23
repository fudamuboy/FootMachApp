const express = require('express');
const db = require('../db');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

// Block a user
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { blocked_id } = req.body;
        const blocker_id = req.user.id;

        if (!blocked_id) {
            return res.status(400).json({ message: 'Missing blocked_id' });
        }

        if (blocker_id === blocked_id) {
            return res.status(400).json({ message: 'You cannot block yourself' });
        }

        const result = await db.query(
            'INSERT INTO blocks (blocker_id, blocked_id) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING *',
            [blocker_id, blocked_id]
        );

        res.status(201).json({ message: 'User blocked successfully' });
    } catch (error) {
        console.error('Error blocking user:', error);
        res.status(500).json({ message: 'Server error blocking user' });
    }
});

// Unblock a user
router.delete('/:blockedId', authMiddleware, async (req, res) => {
    try {
        const blocker_id = req.user.id;
        const blocked_id = req.params.blockedId;

        await db.query(
            'DELETE FROM blocks WHERE blocker_id = $1 AND blocked_id = $2',
            [blocker_id, blocked_id]
        );

        res.status(200).json({ message: 'User unblocked successfully' });
    } catch (error) {
        console.error('Error unblocking user:', error);
        res.status(500).json({ message: 'Server error unblocking user' });
    }
});

// Get list of blocked users for the current user
router.get('/', authMiddleware, async (req, res) => {
    try {
        const blocker_id = req.user.id;

        const result = await db.query(
            'SELECT users.id, users.username, users.avatar_url FROM blocks JOIN users ON blocks.blocked_id = users.id WHERE blocks.blocker_id = $1',
            [blocker_id]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching blocked users:', error);
        res.status(500).json({ message: 'Server error fetching blocked users' });
    }
});

module.exports = router;
