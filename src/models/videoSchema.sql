DROP TABLE IF EXISTS video_plays;
DROP TABLE IF EXISTS videos;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS plays;
DROP TABLE IF EXISTS user_playbook;
DROP TABLE IF EXISTS user_stats;

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE plays (
  id SERIAL PRIMARY KEY,
  video_url VARCHAR(255) NOT NULL,
  formation VARCHAR(255),
  play_type VARCHAR(255),
  tags TEXT[],
  source VARCHAR(255),
  source_type VARCHAR(50) CHECK (source_type IN ('upload', 'link')),
  submitted_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  date_added TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_playbook (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  play_id INTEGER REFERENCES plays(id) ON DELETE CASCADE,
  saved_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_stats (
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  favorite_formation VARCHAR(255),
  favorite_play_type VARCHAR(255),
  PRIMARY KEY(user_id)
);

CREATE INDEX idx_user_playbook_user_id ON user_playbook(user_id);
CREATE INDEX idx_user_playbook_play_id ON user_playbook(play_id);
CREATE INDEX idx_plays_submitted_by ON plays(submitted_by);
CREATE INDEX idx_plays_tags ON plays USING GIN (tags);
CREATE INDEX idx_plays_source_type ON plays(source_type);

