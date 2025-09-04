// src/lib/leaderboard.ts
import { supabase } from "./supabase";

export interface LeaderboardPlayer {
  player_id: string;
  full_name: string;
  elo: number;
  total_score: number;
  games_played: number;
  games_won: number;
  games_lost: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  win_rate: number;
  position?: number;
  position_change?: number;
}

/**
 * Calculates leaderboard for an event based on finished rounds only
 */
export async function calculateEventLeaderboard(eventId: string): Promise<LeaderboardPlayer[]> {
  // Fetch event players
  const { data: eventPlayers, error: epErr } = await supabase
    .from('event_players')
    .select('players(id, full_name, elo)')
    .eq('event_id', eventId);
  if (epErr) throw epErr;

  // Fetch points from round_points
  const { data: pointsData, error: pErr } = await supabase
    .from('round_points')
    .select('player_id, points')
    .eq('event_id', eventId);
  if (pErr) throw pErr;

  // Fetch completed matches with scores for W/L + goal diff (only from finished rounds)
  const { data: matchesData, error: mErr } = await supabase
    .from('matches')
    .select('team_a_player1, team_a_player2, team_b_player1, team_b_player2, score_a, score_b, rounds!inner(event_id, finished)')
    .eq('rounds.event_id', eventId)
    .eq('rounds.finished', true)
    .not('score_a', 'is', null)
    .not('score_b', 'is', null);
  if (mErr) throw mErr;

  // Initialize stats
  const stats = new Map<string, LeaderboardPlayer>();
  (eventPlayers || []).forEach((ep: any) => {
    const p = ep.players;
    stats.set(p.id, {
      player_id: p.id,
      full_name: p.full_name,
      elo: p.elo,
      total_score: 0,
      games_played: 0,
      games_won: 0,
      games_lost: 0,
      goals_for: 0,
      goals_against: 0,
      goal_difference: 0,
      win_rate: 0,
    });
  });

  // Aggregate points
  (pointsData || []).forEach((rp: any) => {
    const row = stats.get(rp.player_id);
    if (row) row.total_score += rp.points;
  });

  // Aggregate matches
  (matchesData || []).forEach((m: any) => {
    if (m.score_a == null || m.score_b == null) return;
    const aWon = m.score_a > m.score_b;
    const sA = m.score_a || 0;
    const sB = m.score_b || 0;
    [m.team_a_player1, m.team_a_player2].forEach((pid: string) => {
      const row = stats.get(pid); if (!row) return;
      row.games_played += 1; row.goals_for += sA; row.goals_against += sB; if (aWon) row.games_won += 1; else row.games_lost += 1;
    });
    [m.team_b_player1, m.team_b_player2].forEach((pid: string) => {
      const row = stats.get(pid); if (!row) return;
      row.games_played += 1; row.goals_for += sB; row.goals_against += sA; if (!aWon) row.games_won += 1; else row.games_lost += 1;
    });
  });

  // Calculate derived fields
  stats.forEach((row) => {
    row.goal_difference = row.goals_for - row.goals_against;
    row.win_rate = row.games_played > 0 ? row.games_won / row.games_played : 0;
  });

  // Sort by proper tiebreaker rules
  const ordered = Array.from(stats.values())
    .sort((a, b) => {
      // Primary: Total score (points)
      if (b.total_score !== a.total_score) {
        return b.total_score - a.total_score;
      }
      
      // Tiebreaker 1: Games won
      if (b.games_won !== a.games_won) {
        return b.games_won - a.games_won;
      }
      
      // Tiebreaker 2: Goal difference (games scored - games conceded)
      if (b.goal_difference !== a.goal_difference) {
        return b.goal_difference - a.goal_difference;
      }
      
      // Tiebreaker 3: Games played (fewer is better - consistent activity)
      if (a.games_played !== b.games_played) {
        return a.games_played - b.games_played;
      }
      
      // Final: ELO rating
      return (b.elo || 0) - (a.elo || 0);
    });

  // Add positions
  return ordered.map((r, idx) => ({ 
    ...r, 
    position: idx + 1,
    position_change: 0 // Could be calculated from previous leaderboard state
  }));
}
