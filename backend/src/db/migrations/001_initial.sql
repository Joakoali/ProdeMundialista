CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  avatar_color VARCHAR(7) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id VARCHAR(50) UNIQUE NOT NULL,
  home_team VARCHAR(100) NOT NULL,
  away_team VARCHAR(100) NOT NULL,
  kickoff_at TIMESTAMP NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'scheduled',
  home_score INT,
  away_score INT,
  home_scorers JSONB DEFAULT '[]',
  away_scorers JSONB DEFAULT '[]',
  stage VARCHAR(50) NOT NULL DEFAULT 'GROUP_STAGE',
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  predicted_home INT NOT NULL,
  predicted_away INT NOT NULL,
  predicted_scorers JSONB DEFAULT '[]',
  points_earned INT,
  locked_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, match_id)
);

CREATE INDEX IF NOT EXISTS idx_predictions_user_id ON predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_predictions_match_id ON predictions(match_id);
CREATE INDEX IF NOT EXISTS idx_matches_kickoff ON matches(kickoff_at);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
