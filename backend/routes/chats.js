const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

// Get all chats for a user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const user_id = req.user.id;
    const query = `
      SELECT c.*,
             u1.username AS participant_1_username, 
             u1.avatar_url AS participant_1_avatar,
             u1.avatar_style AS participant_1_avatar_style,
             u1.avatar_seed AS participant_1_avatar_seed,
             u2.username AS participant_2_username, 
             u2.avatar_url AS participant_2_avatar,
             u2.avatar_style AS participant_2_avatar_style,
             u2.avatar_seed AS participant_2_avatar_seed,
             (SELECT COUNT(*) FROM messages m 
              WHERE m.chat_id = c.id 
                AND m.sender_id != $1 
                AND m.is_read = FALSE) AS unread_count
      FROM chats c
      LEFT JOIN users u1 ON c.participant_1 = u1.id
      LEFT JOIN users u2 ON c.participant_2 = u2.id
      WHERE c.participant_1 = $1 OR c.participant_2 = $1
      ORDER BY c.last_updated DESC
    `;
    const result = await db.query(query, [user_id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching chats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create or get chat between two users
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { participant_2, city } = req.body;
    const participant_1 = req.user.id;

    if (participant_1 === participant_2) {
        return res.status(400).json({ message: "Cannot chat with yourself."});
    }

    // Check if chat already exists
    const checkQuery = `
      SELECT id FROM chats 
      WHERE (participant_1 = $1 AND participant_2 = $2) 
         OR (participant_1 = $2 AND participant_2 = $1)
    `;
    const checkResult = await db.query(checkQuery, [participant_1, participant_2]);

    if (checkResult.rows.length > 0) {
      return res.json(checkResult.rows[0]);
    }

    // Create new chat
    const insertQuery = `
      INSERT INTO chats (participant_1, participant_2, city) 
      VALUES ($1, $2, $3) RETURNING id
    `;
    const newChat = await db.query(insertQuery, [participant_1, participant_2, city]);
    res.status(201).json(newChat.rows[0]);
  } catch (error) {
    console.error('Error creating chat:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get messages for a specific chat
router.get('/:chatId/messages', authMiddleware, async (req, res) => {
  try {
    const { chatId } = req.params;
    
    const query = `
      SELECT m.*, u.username as sender_username 
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.chat_id = $1
      ORDER BY m.created_at ASC
    `;
    const result = await db.query(query, [chatId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send a message
router.post('/:chatId/messages', authMiddleware, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { content } = req.body;
    const sender_id = req.user.id;

    if (!content) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    // Insert message
    const insertMsgQuery = `
      INSERT INTO messages (chat_id, sender_id, content) 
      VALUES ($1, $2, $3) RETURNING *
    `;
    const newMessage = await db.query(insertMsgQuery, [chatId, sender_id, content]);

    // Update last_message and last_updated in chats table
    await db.query(
      'UPDATE chats SET last_message = $1, last_updated = CURRENT_TIMESTAMP WHERE id = $2',
      [content, chatId]
    );

    res.status(201).json(newMessage.rows[0]);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark messages as read
router.put('/:chatId/messages/mark-read', authMiddleware, async (req, res) => {
  try {
    const { chatId } = req.params;
    const user_id = req.user.id;

    // Update all messages in this chat that are not read and were NOT sent by the current user
    const updateQuery = `
      UPDATE messages 
      SET is_read = TRUE 
      WHERE chat_id = $1 AND sender_id != $2 AND is_read = FALSE
      RETURNING id
    `;
    
    const result = await db.query(updateQuery, [chatId, user_id]);
    res.json({ updated_count: result.rowCount });
  } catch (error) {
    console.error('Error marking messages read:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get unread messages count
router.get('/unread-count', authMiddleware, async (req, res) => {
  try {
    const user_id = req.user.id;
    const query = `
      SELECT COUNT(m.id) as unread_count
      FROM messages m
      JOIN chats c ON m.chat_id = c.id
      WHERE (c.participant_1 = $1 OR c.participant_2 = $1)
        AND m.sender_id != $1
        AND m.is_read = FALSE
    `;
    const result = await db.query(query, [user_id]);
    res.json({ count: parseInt(result.rows[0].unread_count) || 0 });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
