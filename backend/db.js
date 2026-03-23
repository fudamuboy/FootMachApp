const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'FootApp', // Updating to user's specified FootApp DB
  password: process.env.DB_PASSWORD || 'nocap',
  port: process.env.DB_PORT || 5433, // DB port is 5433
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};
