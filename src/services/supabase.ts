import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface PlayerProfile {
  id: string;
  username: string;
  initials: string;
  created_at: string;
  total_games: number;
  total_wins: number;
  total_points: number;
}

export interface HighScore {
  id: string;
  player_id: string | null;
  initials: string;
  score: number;
  opponent_score: number;
  team_used: string;
  difficulty: string;
  created_at: string;
}

export interface GameStats {
  id: string;
  player_id: string;
  game_date: string;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  dunks: number;
  three_pointers: number;
  on_fire_count: number;
}

export async function getHighScores(limit = 10): Promise<HighScore[]> {
  const { data, error } = await supabase
    .from('high_scores')
    .select('*')
    .order('score', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching high scores:', error);
    return [];
  }

  return data || [];
}

export async function submitHighScore(
  initials: string,
  score: number,
  opponentScore: number,
  teamUsed: string,
  difficulty: string,
  playerId?: string
): Promise<boolean> {
  const { error } = await supabase.from('high_scores').insert({
    player_id: playerId || null,
    initials: initials.toUpperCase().substring(0, 3),
    score,
    opponent_score: opponentScore,
    team_used: teamUsed,
    difficulty,
  });

  if (error) {
    console.error('Error submitting high score:', error);
    return false;
  }

  return true;
}

export async function getPlayerProfile(playerId: string): Promise<PlayerProfile | null> {
  const { data, error } = await supabase
    .from('player_profiles')
    .select('*')
    .eq('id', playerId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching player profile:', error);
    return null;
  }

  return data;
}

export async function updatePlayerStats(
  playerId: string,
  won: boolean,
  points: number
): Promise<boolean> {
  const profile = await getPlayerProfile(playerId);
  if (!profile) return false;

  const { error } = await supabase
    .from('player_profiles')
    .update({
      total_games: profile.total_games + 1,
      total_wins: profile.total_wins + (won ? 1 : 0),
      total_points: profile.total_points + points,
    })
    .eq('id', playerId);

  if (error) {
    console.error('Error updating player stats:', error);
    return false;
  }

  return true;
}

export async function saveGameStats(stats: Omit<GameStats, 'id' | 'game_date'>): Promise<boolean> {
  const { error } = await supabase.from('game_stats').insert(stats);

  if (error) {
    console.error('Error saving game stats:', error);
    return false;
  }

  return true;
}

export async function getPlayerGameHistory(playerId: string, limit = 20): Promise<GameStats[]> {
  const { data, error } = await supabase
    .from('game_stats')
    .select('*')
    .eq('player_id', playerId)
    .order('game_date', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching game history:', error);
    return [];
  }

  return data || [];
}
