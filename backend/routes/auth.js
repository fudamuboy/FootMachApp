const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const db = require('../db'); // Assuming db.js is in the parend folder of routes/
const router = express.Router();

const GOOGLE_CLIENT_ID = '606635332776-6u3e1ok8u2raq9motmai2oglchc9m666.apps.googleusercontent.com';
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key_here';

// Register User
router.post('/register', async (req, res) => {
  try {
    const { email, password, username, city, region, phoneNumber } = req.body;

    // Check if user exists
    console.log('Registering user:', email);
    const userCheck = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      console.log('User already exists:', email);
      return res.status(400).json({ message: 'User already registered' });
    }

    // Hash password
    console.log('Hashing password...');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Default avatar
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(username || 'User')}&background=random`;
    const avatarStyle = 'initials';
    const avatarSeed = username || email;

    // Insert user
    console.log('Inserting user into DB...');
    const newUser = await db.query(
      'INSERT INTO users (email, password_hash, username, city, region, phone_number, avatar_url, avatar_style, avatar_seed) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id, email, username, city, region, phone_number, avatar_url, avatar_style, avatar_seed',
      [email, passwordHash, username, city, region, phoneNumber, avatarUrl, avatarStyle, avatarSeed]
    );
    console.log('User inserted successfully, ID:', newUser.rows[0].id);

    // Create token
    console.log('Creating JWT token...');
    if (!JWT_SECRET) {
        console.error('CRITICAL: JWT_SECRET is missing!');
        throw new Error('JWT_SECRET is not defined');
    }
    const token = jwt.sign({ id: newUser.rows[0].id }, JWT_SECRET, { expiresIn: '7d' });
    console.log('Token created successfully');

    res.status(201).json({
      token,
      user: newUser.rows[0]
    });
  } catch (error) {
    console.error('--- REGISTRATION ERROR DETAIL ---');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    console.error('---------------------------------');
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login User
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = userResult.rows[0];

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Create token
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });

    // Remove password hash before sending user
    delete user.password_hash;

    res.json({
      token,
      user
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Get current user (me)
router.get('/me', require('../middleware/authMiddleware'), async (req, res) => {
  try {
    const userResult = await db.query(
      'SELECT id, email, username, city, region, phone_number, address, avatar_url, avatar_style, avatar_seed, position, preferred_foot, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(userResult.rows[0]);
  } catch (error) {
    console.error('Auth me error:', error);
    res.status(500).json({ message: 'Server error fetching user' });
  }
});

// Public profile — only safe fields, no email/phone
router.get('/user/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      'SELECT id, username, city, region, avatar_url, avatar_style, avatar_seed, position, preferred_foot FROM users WHERE id = $1',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Public profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update current user profile
router.put('/profile', require('../middleware/authMiddleware'), async (req, res) => {
  try {
     const { username, phone, email, address, position, preferred_foot, avatar_style, avatar_seed } = req.body;
     
     let updateQuery = 'UPDATE users SET ';
     const queryValues = [];
     let paramIdx = 1;
     
     if (username !== undefined) {
         updateQuery += `username = $${paramIdx}, `;
         queryValues.push(username);
         paramIdx++;
     }
     
     if (phone !== undefined) {
         updateQuery += `phone_number = $${paramIdx}, `;
         queryValues.push(phone);
         paramIdx++;
     }
     
     if (email !== undefined) {
         updateQuery += `email = $${paramIdx}, `;
         queryValues.push(email);
         paramIdx++;
     }

     if (address !== undefined) {
         updateQuery += `address = $${paramIdx}, `;
         queryValues.push(address);
         paramIdx++;
     }

     if (position !== undefined) {
         updateQuery += `position = $${paramIdx}, `;
         queryValues.push(position);
         paramIdx++;
     }

     if (preferred_foot !== undefined) {
         updateQuery += `preferred_foot = $${paramIdx}, `;
         queryValues.push(preferred_foot);
         paramIdx++;
     }

     if (avatar_style !== undefined) {
         updateQuery += `avatar_style = $${paramIdx}, `;
         queryValues.push(avatar_style);
         paramIdx++;
     }

     if (avatar_seed !== undefined) {
         updateQuery += `avatar_seed = $${paramIdx}, `;
         queryValues.push(avatar_seed);
         paramIdx++;
     }
     
     // Remove trailing comma and space
     updateQuery = updateQuery.slice(0, -2);
     
     updateQuery += ` WHERE id = $${paramIdx} RETURNING id, email, username, city, region, phone_number, address, avatar_url, avatar_style, avatar_seed, position, preferred_foot`;
     queryValues.push(req.user.id);
     
     const result = await db.query(updateQuery, queryValues);
     
     res.json(result.rows[0]);

  } catch(error) {
     console.error('Update profile error:', error);
     res.status(500).json({ message: 'Server error updating profile' });
  }
});

// Forgot password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Check if user exists
    const userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      // Returns 200 to prevent email enumeration attacks
      return res.status(200).json({ message: 'If this email exists, a reset link has been sent.' });
    }
    
    // Generate a random 6-digit code for simplicity, or utilize a crypto random hex. 
    // We will use a random hex string for security.
    const crypto = require('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour from now
    
    await db.query(`UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE email = $3`, [resetToken, resetTokenExpires, email]);
    
    // In a real app, send an email here.
    // We will simulate it by returning the token so the front-end can test it.
    console.log(`Password reset token for ${email}: ${resetToken}`);
    res.status(200).json({ 
      message: 'If this email exists, a reset link has been sent.',
      testToken: resetToken // Only keeping this for development purposes
    });
    
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
       return res.status(400).json({ message: 'Token and new password required' });
    }
    
    // Find user with this token and check if it has expired
    const userResult = await db.query('SELECT * FROM users WHERE reset_token = $1 AND reset_token_expires > CURRENT_TIMESTAMP', [token]);
    
    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);
    
    // Update user's password and clear the reset token
    await db.query(`UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2`, [passwordHash, userResult.rows[0].id]);
    
    res.status(200).json({ message: 'Password has been successfully reset' });
    
  } catch(error) {
     console.error('Reset password error:', error);
     res.status(500).json({ message: 'Server error' });
  }
});

// Google ID Token Verification
router.post('/google-verify', async (req, res) => {
  try {
    const { idToken } = req.body;
    
    if (!idToken) {
      return res.status(400).json({ message: 'ID Token required' });
    }

    const ticket = await client.verifyIdToken({
        idToken,
        audience: GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    const email = payload['email'];

    // Check if user exists with this email
    const userResult = await db.query('SELECT id, email, username FROM users WHERE email = $1', [email]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'No user found with this Google account' });
    }

    const user = userResult.rows[0];

    // Generate a temporary reset token for this session
    const crypto = require('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 600000); // 10 minutes (shorter for Google verification)
    
    await db.query(`UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3`, [resetToken, resetTokenExpires, user.id]);

    res.json({
      message: 'Google identity verified',
      email: user.email,
      resetToken: resetToken
    });

  } catch (error) {
    console.error('Google verify error:', error);
    res.status(401).json({ message: 'Invalid Google token' });
  }
});

module.exports = router;

