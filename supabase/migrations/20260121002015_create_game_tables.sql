/*
  # NBA Hangtime Web Game - Initial Database Schema

  1. New Tables
    - `player_profiles`
      - `id` (uuid, primary key) - Unique player identifier
      - `username` (text, unique) - Player's chosen username
      - `initials` (text) - 3-character initials for high scores
      - `created_at` (timestamptz) - When profile was created
      - `total_games` (integer) - Total games played
      - `total_wins` (integer) - Total games won
      - `total_points` (integer) - Career points scored

    - `high_scores`
      - `id` (uuid, primary key) - Score record identifier
      - `player_id` (uuid) - Reference to player_profiles
      - `initials` (text) - 3-character initials
      - `score` (integer) - Points scored in game
      - `opponent_score` (integer) - Opponent's score
      - `team_used` (text) - Team abbreviation used
      - `difficulty` (text) - Game difficulty level
      - `created_at` (timestamptz) - When score was recorded

    - `game_stats`
      - `id` (uuid, primary key) - Game stat record identifier
      - `player_id` (uuid) - Reference to player_profiles
      - `game_date` (timestamptz) - When game was played
      - `points` (integer) - Points scored
      - `rebounds` (integer) - Rebounds grabbed
      - `assists` (integer) - Assists made
      - `steals` (integer) - Steals made
      - `blocks` (integer) - Blocks made
      - `dunks` (integer) - Dunks performed
      - `three_pointers` (integer) - 3-pointers made
      - `on_fire_count` (integer) - Times caught on fire

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Add policies for public read access to high scores
*/

-- Player Profiles Table
CREATE TABLE IF NOT EXISTS player_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  initials text NOT NULL DEFAULT 'AAA' CHECK (char_length(initials) = 3),
  created_at timestamptz DEFAULT now(),
  total_games integer DEFAULT 0,
  total_wins integer DEFAULT 0,
  total_points integer DEFAULT 0
);

ALTER TABLE player_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players can view all profiles"
  ON player_profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Players can insert own profile"
  ON player_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Players can update own profile"
  ON player_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- High Scores Table
CREATE TABLE IF NOT EXISTS high_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid REFERENCES player_profiles(id) ON DELETE SET NULL,
  initials text NOT NULL DEFAULT 'AAA' CHECK (char_length(initials) = 3),
  score integer NOT NULL DEFAULT 0,
  opponent_score integer NOT NULL DEFAULT 0,
  team_used text NOT NULL,
  difficulty text NOT NULL DEFAULT 'medium',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE high_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view high scores"
  ON high_scores
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert high scores"
  ON high_scores
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = player_id OR player_id IS NULL);

-- Game Stats Table
CREATE TABLE IF NOT EXISTS game_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid REFERENCES player_profiles(id) ON DELETE CASCADE,
  game_date timestamptz DEFAULT now(),
  points integer DEFAULT 0,
  rebounds integer DEFAULT 0,
  assists integer DEFAULT 0,
  steals integer DEFAULT 0,
  blocks integer DEFAULT 0,
  dunks integer DEFAULT 0,
  three_pointers integer DEFAULT 0,
  on_fire_count integer DEFAULT 0
);

ALTER TABLE game_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players can view own stats"
  ON game_stats
  FOR SELECT
  TO authenticated
  USING (auth.uid() = player_id);

CREATE POLICY "Players can insert own stats"
  ON game_stats
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = player_id);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_high_scores_score ON high_scores(score DESC);
CREATE INDEX IF NOT EXISTS idx_high_scores_created ON high_scores(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_game_stats_player ON game_stats(player_id);
CREATE INDEX IF NOT EXISTS idx_game_stats_date ON game_stats(game_date DESC);
