require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'FootApp',
  password: process.env.DB_PASSWORD || 'nocap',
  port: process.env.DB_PORT || 5433,
});

const createTables = async () => {
  const queryText = `
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      username VARCHAR(255),
      city VARCHAR(255),
      region VARCHAR(255),
      phone_number VARCHAR(20),
      avatar_url TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS announcements (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      team_name VARCHAR(255) NOT NULL,
      match_time TIMESTAMP WITH TIME ZONE NOT NULL,
      location VARCHAR(255) NOT NULL,
      city VARCHAR(255) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS chats (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      participant_1 UUID REFERENCES users(id) ON DELETE CASCADE,
      participant_2 UUID REFERENCES users(id) ON DELETE CASCADE,
      last_message TEXT,
      last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      city VARCHAR(255)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
      sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS comments (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      announcement_id UUID REFERENCES announcements(id) ON DELETE CASCADE,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      rating INTEGER CHECK (rating >= 1 AND rating <= 5),
      comment TEXT,
      team_name VARCHAR(255),
      city VARCHAR(255),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    console.log('Creating tables...');
    await pool.query(queryText);
    console.log('Tables created successfully!');
  } catch (err) {
    console.error('Error creating tables:', err.stack);
  } finally {
    pool.end();
  }
};

createTables();
