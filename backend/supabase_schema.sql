-- Active: extension uuid-ossp
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  username VARCHAR(255),
  city VARCHAR(255),
  region VARCHAR(255),
  phone_number VARCHAR(20),
  address TEXT,
  avatar_url TEXT,
  avatar_style VARCHAR(50) DEFAULT 'initials',
  avatar_seed VARCHAR(255),
  position VARCHAR(50),
  preferred_foot VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: announcements
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  team_name VARCHAR(255) NOT NULL,
  match_time TIMESTAMP WITH TIME ZONE NOT NULL,
  location VARCHAR(255) NOT NULL,
  city VARCHAR(255) NOT NULL,
  region VARCHAR(255),
  players_needed INTEGER DEFAULT 1,
  description TEXT,
  match_format VARCHAR(50),
  match_fee VARCHAR(50) DEFAULT 'free',
  skill_level VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: chats
CREATE TABLE IF NOT EXISTS chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_1 UUID REFERENCES users(id) ON DELETE CASCADE,
  participant_2 UUID REFERENCES users(id) ON DELETE CASCADE,
  last_message TEXT,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  city VARCHAR(255)
);

-- Table: messages
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: comments (including fair_play, punctuality, etc.)
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  announcement_id UUID REFERENCES announcements(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  team_name VARCHAR(255),
  city VARCHAR(255),
  fair_play INTEGER CHECK (fair_play >= 1 AND fair_play <= 5),
  punctuality INTEGER CHECK (punctuality >= 1 AND punctuality <= 5),
  level_of_play INTEGER CHECK (level_of_play >= 1 AND level_of_play <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
