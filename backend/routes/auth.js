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
      'SELECT id, email, username, city, region, phone_number, address, avatar_url, avatar_style, avatar_seed, position, preferred_foot, secondary_position, skill_level, playing_style, favorite_team, bio, created_at, role, is_premium, premium_expires_at, premium_source, premium_plan, trust_score, activity_score, spam_score FROM users WHERE id = $1',
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = userResult.rows[0];
    
    // Override premium status for developers/admins
    if (user.role === 'developer' || user.role === 'admin') {
        user.is_premium = true;
        user.premium_source = 'developer';
        user.premium_plan = 'developer';
        user.premium_expires_at = null;
    }

    res.json(user);
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
     const { 
         // Original names
         username, phone, email, address, position, preferred_foot, 
         avatar_style, avatar_seed, bio, favorite_team, 
         secondary_position, skill_level, playing_style,
         // CamelCase variants requested by user
         displayName, favoriteTeam, preferredPosition, strongFoot, skillLevel, playingStyle
     } = req.body;
     
     const userId = req.user?.id;
     if (!userId) {
         console.error('[PROFILE_UPDATE] ❌ No user ID in request');
         return res.status(401).json({ message: 'Unauthorized' });
     }

     console.log(`[PROFILE_UPDATE] 👤 Updating profile for user ${userId}`);
     
     // Log payload safely (masking sensitive info)
     const safeBody = { ...req.body };
     if (safeBody.email) safeBody.email = '***@***.***';
     if (safeBody.phone) safeBody.phone = '*******' + (safeBody.phone.toString().slice(-3) || '');
     
     console.log(`[PROFILE_UPDATE] 📦 Payload:`, JSON.stringify(safeBody, null, 2));
     
     let updateQuery = 'UPDATE users SET ';
     const queryValues = [];
     let paramIdx = 1;
     
     // Helper to add to query if value is defined
     const addField = (colName, val) => {
         if (val !== undefined) {
             updateQuery += `${colName} = $${paramIdx}, `;
             queryValues.push(val);
             paramIdx++;
             return true;
         }
         return false;
     };

     // Mapping logic: prioritized names
     addField('username', username);
     addField('display_name', displayName);
     addField('phone_number', phone);
     addField('email', email);
     addField('address', address);
     
     // Football profile
     // Handle both old and new names
     addField('position', position || preferredPosition);
     addField('preferred_foot', preferred_foot || strongFoot);
     addField('secondary_position', secondary_position);
     addField('skill_level', skill_level || skillLevel);
     addField('playing_style', playing_style || playingStyle);
     
     // Other fields
     addField('bio', bio);
     addField('favorite_team', favorite_team || favoriteTeam);
     addField('avatar_style', avatar_style);
     addField('avatar_seed', avatar_seed);
     addField('updated_at', new Date());
     
     if (queryValues.length === 0) {
         console.warn(`[PROFILE_UPDATE] ⚠️ No fields provided for update for user ${userId}`);
         return res.status(400).json({ message: 'No fields provided for update' });
     }
     
     // Remove trailing comma and space
     updateQuery = updateQuery.slice(0, -2);
     
     updateQuery += ` WHERE id = $${paramIdx} RETURNING *`;
     queryValues.push(userId);
     
     console.log(`[PROFILE_UPDATE] 📝 Executing Query for ${userId}`);
     // Do not log the full query with values if it contains sensitive info, but for debugging we log the template
     // console.log(`[PROFILE_UPDATE] SQL Template: ${updateQuery}`);
     
     const result = await db.query(updateQuery, queryValues);
     
     if (result.rows.length === 0) {
         console.error(`[PROFILE_UPDATE] ❌ User ${userId} not found during update`);
         return res.status(404).json({ message: 'User not found' });
     }

     console.log(`[PROFILE_UPDATE] ✅ Profile updated successfully for ${userId}`);
     res.json(result.rows[0]);

  } catch(error) {
    console.error('❌ --- PROFILE UPDATE ERROR ---');
    console.error('User ID:', req.user?.id || 'N/A');
    console.error('Message:', error.message);
    if (error.code) console.error('SQL Code:', error.code);
    if (error.detail) console.error('SQL Detail:', error.detail);
    console.error('Stack:', error.stack);
    
    res.status(500).json({ 
        message: 'Server error updating profile',
        detail: error.message,
        errorCode: error.code
    });
  }
});

// Delete account
router.delete('/profile', require('../middleware/authMiddleware'), async (req, res) => {
  try {
    await db.query('DELETE FROM users WHERE id = $1', [req.user.id]);
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete profile error:', error);
    res.status(500).json({ message: 'Server error deleting profile' });
  }
});

const { sendResetEmail } = require('../utils/mailer');

// Request OTP Code for Password Reset
router.post('/request-password-reset-code', async (req, res) => {
  try {
    const { email } = req.body;
    console.log(`[AUTH] 📧 Received reset request for: ${email}`);

    // Check SMTP config (safe logs)
    console.log("SMTP CONFIG CHECK:", {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_SECURE,
        userExists: !!process.env.SMTP_USER,
        passExists: !!process.env.SMTP_PASS,
        from: process.env.SMTP_FROM
    });
    
    const userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "Aucun compte n'existe avec cet e-mail." });
    }
    
    // Generate 6-digit numeric code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 600000); // 10 minutes
    
    if (otpCode) console.log(`[AUTH] Password reset code generated for ${email}`);
    
    // Hash the OTP code for security
    const salt = await bcrypt.genSalt(10);
    const hashedOtp = await bcrypt.hash(otpCode, salt);
    
    await db.query(`UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE email = $3`, [hashedOtp, expires, email]);
    
    try {
        console.log(`[AUTH] Sending email to: ${email}...`);
        await sendResetEmail(email, otpCode);
        console.log(`✅ OTP sent successfully to ${email}`);
    } catch (mailError) {
        console.error("❌ OTP EMAIL ERROR:", {
            name: mailError.name,
            code: mailError.code,
            command: mailError.command,
            response: mailError.response,
            responseCode: mailError.responseCode,
            message: mailError.message
        });
        
        // Distinguish between configuration errors, timeouts and sending errors
        if (mailError.code === 'EAUTH' || mailError.code === 'ECONNREFUSED' || mailError.code === 'SMTP_NOT_CONFIGURED') {
            return res.status(500).json({ 
                message: "Le service d'e-mail n'est pas configuré correctement sur le serveur.",
                errorCode: 'SMTP_CONFIG_ERROR'
            });
        }
        
        if (mailError.code === 'ETIMEDOUT' || mailError.message.includes('timeout')) {
            return res.status(500).json({ 
                message: "L'envoi de l'e-mail a expiré. Veuillez réessayer.",
                errorCode: 'EMAIL_SEND_TIMEOUT'
            });
        }

        return res.status(500).json({ 
            message: "Impossible d'envoyer le code pour le moment. Réessayez plus tard.",
            errorCode: 'EMAIL_SEND_FAILED'
        });
    }

    res.status(200).json({ message: 'A reset code has been sent to your email.' });
    
  } catch (error) {
    console.error('Request OTP error:', error);
    res.status(500).json({ message: 'Server error', errorCode: 'SERVER_ERROR' });
  }
});

// Alias for backward compatibility
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    console.log(`[AUTH] 📧 Received forgot-password request for: ${email}`);

    // Check SMTP config (safe logs)
    console.log("SMTP CONFIG CHECK:", {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_SECURE,
        userExists: !!process.env.SMTP_USER,
        passExists: !!process.env.SMTP_PASS,
        from: process.env.SMTP_FROM
    });

    const userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "Aucun compte n'existe avec cet e-mail." });
    }
    
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 600000); // 10 minutes
    const salt = await bcrypt.genSalt(10);
    const hashedOtp = await bcrypt.hash(otpCode, salt);
    
    await db.query(`UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE email = $3`, [hashedOtp, expires, email]);
    
    try {
        console.log(`[AUTH] Sending forgot-password OTP email to: ${email}...`);
        await sendResetEmail(email, otpCode);
        console.log(`✅ Forgot-password OTP sent successfully to ${email}`);
    } catch (mailError) {
        console.error("❌ OTP EMAIL ERROR:", {
            name: mailError.name,
            code: mailError.code,
            command: mailError.command,
            response: mailError.response,
            responseCode: mailError.responseCode,
            message: mailError.message
        });
        
        if (mailError.code === 'EAUTH' || mailError.code === 'ECONNREFUSED' || mailError.code === 'SMTP_NOT_CONFIGURED') {
            return res.status(500).json({ 
                message: "Le service d'e-mail n'est pas configuré correctement sur le serveur.",
                errorCode: 'SMTP_CONFIG_ERROR'
            });
        }

        if (mailError.code === 'ETIMEDOUT' || mailError.message.includes('timeout')) {
            return res.status(500).json({ 
                message: "L'envoi de l'e-mail a expiré. Veuillez réessayer.",
                errorCode: 'EMAIL_SEND_TIMEOUT'
            });
        }

        return res.status(500).json({ 
            message: "Impossible d'envoyer le code pour le moment. Réessayez plus tard.",
            errorCode: 'EMAIL_SEND_FAILED'
        });
    }

    res.status(200).json({ message: 'A reset code has been sent to your email.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error', errorCode: 'SERVER_ERROR' });
  }
});

// Reset Password with OTP Code
router.post('/reset-password-with-code', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    
    if (!email || !code || !newPassword) {
       return res.status(400).json({ message: 'Email, code and new password are required' });
    }

    // Find user
    const userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid email or code' });
    }
    
    const user = userResult.rows[0];

    // Check if code has expired
    if (!user.reset_token_expires || new Date() > user.reset_token_expires) {
      return res.status(400).json({ message: 'Code has expired' });
    }

    // Verify hashed OTP code
    const isMatch = await bcrypt.compare(code, user.reset_token);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);
    
    // Update user's password and clear the reset token
    await db.query(`UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2`, [passwordHash, user.id]);
    
    res.status(200).json({ message: 'Password has been successfully updated' });
    
  } catch(error) {
     console.error('Reset password OTP error:', error);
     res.status(500).json({ message: 'Server error' });
  }
});

// Alias for backward compatibility
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    // For the old endpoint, we might not have email. We need to find the user by token only.
    // However, since we hash tokens now, we can't search by token alone in a single query easily without email.
    // But since tokens are only 6 digits, collisions are possible.
    // For security, the new flow requires email.
    // We'll return 400 and ask to use the new flow if called without email.
    return res.status(400).json({ message: 'Please use the updated reset password flow.' });
  } catch (error) {
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
