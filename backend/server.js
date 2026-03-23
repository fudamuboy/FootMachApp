const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());

// Basic Route for testing
app.get('/', (req, res) => {
  res.send('Rakibim API is running!');
});

// Import Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/announcements', require('./routes/announcements'));
app.use('/api/chats', require('./routes/chats'));
app.use('/api/comments', require('./routes/comments'));

// Start server
app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
