const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());

// Log all requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Basic Route for testing
app.get('/', (req, res) => {
  res.send('Rakibim API is running!');
});

// Health check for Render wake-up (Root level)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// Health check for Render wake-up (API level)
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// AdMob app-ads.txt validation
app.get('/app-ads.txt', (req, res) => {
  res.sendFile(__dirname + '/app-ads.txt');
});

// Import Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/announcements', require('./routes/announcements'));
app.use('/api/chats', require('./routes/chats'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api/premium', require('./routes/premium'));

// Import DB to trigger connection
const db = require('./db');

// Test DB Connection
db.query('SELECT NOW()')
  .then(() => console.log('✅ Database connectivity verified'))
  .catch(err => console.error('❌ Database connectivity failed:', err.message));

// ── AUTO-MIGRATION ON STARTUP ──────────────────────────────────────
// Runs every startup — safe because all queries use IF NOT EXISTS
async function runAutoMigration() {
  console.log('🔄 [MIGRATION] Running auto-migration on startup...');
  const migrations = [
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user'",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS premium_expires_at TIMESTAMP WITH TIME ZONE",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS premium_source TEXT",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS premium_plan TEXT",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS trust_score INTEGER DEFAULT 100",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS activity_score INTEGER DEFAULT 0",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS spam_score INTEGER DEFAULT 0",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name VARCHAR(255)",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS position VARCHAR(50)",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS secondary_position VARCHAR(50)",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_foot VARCHAR(50)",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS skill_level VARCHAR(50)",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_style VARCHAR(50) DEFAULT 'initials'",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_seed VARCHAR(255)",
    "ALTER TABLE announcements ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active'",
    "UPDATE users SET role = 'user' WHERE role IS NULL",
    "UPDATE users SET is_premium = false WHERE is_premium IS NULL",
    "UPDATE users SET trust_score = 100 WHERE trust_score IS NULL",
    "UPDATE users SET spam_score = 0 WHERE spam_score IS NULL",
    "UPDATE announcements SET status = 'active' WHERE status IS NULL",
  ];
  let ok = 0, fail = 0;
  for (const sql of migrations) {
    try {
      await db.query(sql);
      ok++;
    } catch (err) {
      if (err.code !== '42701') { // ignore "column already exists"
        console.error('❌ [MIGRATION] Failed:', err.message);
        fail++;
      } else { ok++; }
    }
  }
  console.log(`✅ [MIGRATION] Done — ${ok} OK, ${fail} failed`);
}

runAutoMigration().catch(err => console.error('💥 [MIGRATION] Critical error:', err.message));

// ── HTTP ENDPOINT: trigger migration manually (no Shell needed) ────
app.get('/api/migrate', async (req, res) => {
  const secret = req.query.secret;
  if (secret !== (process.env.MIGRATION_SECRET || 'footmach2026')) {
    return res.status(403).json({ error: 'Forbidden — wrong secret' });
  }
  const results = [];
  const migrations = [
    { name: 'role',               sql: "ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user'" },
    { name: 'is_premium',         sql: "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false" },
    { name: 'premium_expires_at', sql: "ALTER TABLE users ADD COLUMN IF NOT EXISTS premium_expires_at TIMESTAMP WITH TIME ZONE" },
    { name: 'premium_source',     sql: "ALTER TABLE users ADD COLUMN IF NOT EXISTS premium_source TEXT" },
    { name: 'premium_plan',       sql: "ALTER TABLE users ADD COLUMN IF NOT EXISTS premium_plan TEXT" },
    { name: 'trust_score',        sql: "ALTER TABLE users ADD COLUMN IF NOT EXISTS trust_score INTEGER DEFAULT 100" },
    { name: 'activity_score',     sql: "ALTER TABLE users ADD COLUMN IF NOT EXISTS activity_score INTEGER DEFAULT 0" },
    { name: 'spam_score',         sql: "ALTER TABLE users ADD COLUMN IF NOT EXISTS spam_score INTEGER DEFAULT 0" },
    { name: 'display_name',       sql: "ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name VARCHAR(255)" },
    { name: 'position',           sql: "ALTER TABLE users ADD COLUMN IF NOT EXISTS position VARCHAR(50)" },
    { name: 'secondary_position', sql: "ALTER TABLE users ADD COLUMN IF NOT EXISTS secondary_position VARCHAR(50)" },
    { name: 'preferred_foot',     sql: "ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_foot VARCHAR(50)" },
    { name: 'skill_level',        sql: "ALTER TABLE users ADD COLUMN IF NOT EXISTS skill_level VARCHAR(50)" },
    { name: 'bio',                sql: "ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT" },
    { name: 'announcements.status', sql: "ALTER TABLE announcements ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active'" },
    { name: 'init_role',          sql: "UPDATE users SET role = 'user' WHERE role IS NULL" },
    { name: 'init_is_premium',    sql: "UPDATE users SET is_premium = false WHERE is_premium IS NULL" },
    { name: 'init_trust_score',   sql: "UPDATE users SET trust_score = 100 WHERE trust_score IS NULL" },
    { name: 'init_spam_score',    sql: "UPDATE users SET spam_score = 0 WHERE spam_score IS NULL" },
  ];
  for (const m of migrations) {
    try {
      await db.query(m.sql);
      results.push({ name: m.name, status: 'ok' });
    } catch (err) {
      results.push({ name: m.name, status: err.code === '42701' ? 'already_exists' : 'error', error: err.message });
    }
  }
  res.json({ success: true, timestamp: new Date(), results });
});

// Start server
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Server is running on port: ${port}`);
  console.log(`🔗 Local access: http://localhost:${port}`);
  console.log(`🌐 Network access: http://0.0.0.0:${port}`);
  console.log('📡 [SERVER] Listening and keeping event loop active.');
});

server.on('close', () => {
    console.log('⚠️ [SERVER] Event: Close detected!');
});

server.on('error', (err) => {
    console.error('❌ [SERVER] Event: Error detected!', err);
});

// --- STABILITY & ERROR HANDLING ---

// Error-handling middleware for Express
app.use((err, req, res, next) => {
    console.error('❌ Express Route Error:', err.message);
    if (err.stack) console.error(err.stack);
    res.status(500).json({ 
        message: 'Internal Server Error', 
        errorCode: 'SERVER_ERROR',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined 
    });
});

// Handle Uncaught Exceptions
process.on('uncaughtException', (err) => {
    console.error('💥 [CRITICAL] Uncaught Exception!');
    console.error('Message:', err.message);
    console.error('Stack:', err.stack);
    // Graceful shutdown
    process.exit(1);
});

// Handle Unhandled Rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('⚠️ [WARNING] Unhandled Rejection at:', promise);
    console.error('Reason:', reason);
});

// Handle Process Exit
process.on('exit', (code) => {
    console.log(`ℹ️ [PROCESS] Backend process exiting with code: ${code}`);
});

// Handle Termination Signals
process.on('SIGTERM', () => {
    console.log('🛑 [SIGTERM] Received. Shutting down gracefully...');
    server.close(() => {
        console.log('✅ [SERVER] Closed.');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('🛑 [SIGINT] Received (Ctrl+C). Shutting down gracefully...');
    server.close(() => {
        console.log('✅ [SERVER] Closed.');
        process.exit(0);
    });
});

// Handle DB connection loss
db.query('SELECT 1').catch(err => {
    console.error('❌ [DATABASE] Connection error during startup:', err.message);
});
