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

// Health check for Render wake-up
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
