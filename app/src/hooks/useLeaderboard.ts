import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export interface LeaderboardRow {
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
}

export function useLeaderboard(eventId: string | undefined, tvMode: boolean) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);

  const loadLeaderboard = useCallback(async (eid: string) => {
    try {
      console.log("Loading leaderboard for event:", eid);
      
      // Get scoring data and match results
      const [scoresResult, matchesResult] = await Promise.all([
        // Get round points
        supabase
          .from("round_points")
          .select(`
            player_id,
            points,
            court_num,
            promoted,
            defended_c1,
            players!inner(full_name, elo)
          `)
          .eq("event_id", eid),
        
        // Get match results to calculate wins/losses
        supabase
          .from("matches")
          .select(`
            team_a_player1,
            team_a_player2,
            team_b_player1,
            team_b_player2,
            score_a,
            score_b,
            round_id,
            rounds!inner(event_id)
          `)
          .eq("rounds.event_id", eid)
          .not("score_a", "is", null)
          .not("score_b", "is", null)
      ]);

      if (scoresResult.error) throw scoresResult.error;
      if (matchesResult.error) throw matchesResult.error;

      console.log("Raw scores data:", scoresResult.data);
      console.log("Raw matches data:", matchesResult.data);

      // Calculate detailed stats per player
      const playerStats = new Map<string, LeaderboardRow>();

      // Process scoring data
      (scoresResult.data || []).forEach((score: any) => {
        const playerId = score.player_id;
        if (playerStats.has(playerId)) {
          const existing = playerStats.get(playerId)!;
          existing.total_score += score.points;
          existing.games_played += 1;
        } else {
          playerStats.set(playerId, {
            player_id: playerId,
            full_name: score.players.full_name,
            elo: score.players.elo,
            total_score: score.points,
            games_played: 1,
            games_won: 0,
            games_lost: 0,
            goals_for: 0,
            goals_against: 0,
            goal_difference: 0,
          });
        }
      });

      // Process match results for wins/losses and goal difference
      (matchesResult.data || []).forEach((match: any) => {
        const teamAWon = match.score_a > match.score_b;
        const scoreA = match.score_a || 0;
        const scoreB = match.score_b || 0;
        
        // Team A players
        [match.team_a_player1, match.team_a_player2].forEach(playerId => {
          if (playerStats.has(playerId)) {
            const player = playerStats.get(playerId)!;
            player.goals_for += scoreA;
            player.goals_against += scoreB;
            if (teamAWon) {
              player.games_won += 1;
            } else {
              player.games_lost += 1;
            }
          }
        });

        // Team B players
        [match.team_b_player1, match.team_b_player2].forEach(playerId => {
          if (playerStats.has(playerId)) {
            const player = playerStats.get(playerId)!;
            player.goals_for += scoreB;
            player.goals_against += scoreA;
            if (!teamAWon) {
              player.games_won += 1;
            } else {
              player.games_lost += 1;
            }
          }
        });
      });

      // Calculate goal difference
      playerStats.forEach(player => {
        player.goal_difference = player.goals_for - player.goals_against;
      });

      // Convert to array and sort by total score
      const leaderboardData = Array.from(playerStats.values())
        .sort((a, b) => b.total_score - a.total_score)
        .slice(0, 10);

      console.log("Final leaderboard data:", leaderboardData);
      setLeaderboard(leaderboardData);
    } catch (err) {
      console.warn("Failed to load leaderboard:", err);
      setLeaderboard([]);
    }
  }, []);

  useEffect(() => {
    if (eventId && tvMode) {
      loadLeaderboard(eventId);
    }
  }, [eventId, tvMode, loadLeaderboard]);

  return {
    leaderboard,
    loadLeaderboard,
  };
}
