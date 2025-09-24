// src/hooks/useScoring.ts
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { roundPointsForPlayer } from "@/lib/scoring";
import { updateEloTeamVsTeam } from "@/lib/elo";
import { ClubSettingsService } from "@/services/api/clubSettingsService";
import type { ScoringConfig, EloConfig } from "@/lib/clubSettings";
import { DEFAULT_SCORING_CONFIG } from "@/lib/clubSettings";
import type { UUID } from "@/lib/types";

type Player = { id: UUID; full_name: string; elo: number };

export function useScoring(clubId?: string, eventFormat?: string) {
  // Configuration state
  const [scoringConfig, setScoringConfig] = useState<ScoringConfig | null>(null);
  const [eloConfig, setEloConfig] = useState<EloConfig | null>(null);

  // Load configurations when club changes
  useEffect(() => {
    if (clubId) {
      const loadConfigs = async () => {
        try {
          const [scoring, elo] = await Promise.all([
            ClubSettingsService.getScoringConfig(clubId),
            ClubSettingsService.getEloConfig(clubId)
          ]);
          setScoringConfig(scoring);
          setEloConfig(elo);
        } catch (error) {
          console.error('Failed to load scoring/elo configs:', error);
          setScoringConfig(DEFAULT_SCORING_CONFIG);
        }
      };
      loadConfigs();
    }
  }, [clubId]);

  // Set score for a court
  const setScore = async (
    courtNum: number, 
    scoreA?: number, 
    scoreB?: number,
    roundId?: string,
    eventId?: string,
    players?: Record<UUID, Player>
  ) => {
    if (!roundId || scoreA === undefined || scoreB === undefined) return;

    try {
      // Update match score
      const { error: matchError } = await supabase
        .from("matches")
        .update({ 
          scoreA, 
          scoreB,
          updated_at: new Date().toISOString()
        })
        .eq("round_id", roundId)
        .eq("court_num", courtNum);

      if (matchError) throw matchError;

      // Calculate and update round points if we have scoring config
      if (eventId && players && scoringConfig) {
        await updateRoundPoints(eventId, roundId, courtNum, scoreA, scoreB, players);
      }

    } catch (error) {
      console.error("Failed to set score:", error);
      throw error;
    }
  };

  // Update round points based on scoring configuration
  const updateRoundPoints = async (
    eventId: string,
    roundId: string,
    courtNum: number,
    scoreA: number,
    scoreB: number,
    players: Record<UUID, Player>
  ) => {
    try {
      // Get match details
      const { data: matchData, error: matchError } = await supabase
        .from("matches")
        .select("*")
        .eq("round_id", roundId)
        .eq("court_num", courtNum)
        .single();

      if (matchError || !matchData) return;

      const { team_a_player_1, team_a_player_2, team_b_player_1, team_b_player_2 } = matchData;
      
      // Calculate basic points for each player (simplified for now)
      const isTeamAWin = scoreA > scoreB;
      const playerPoints = [
        { playerId: team_a_player_1, points: isTeamAWin ? scoreA : 0 },
        { playerId: team_a_player_2, points: isTeamAWin ? scoreA : 0 },
        { playerId: team_b_player_1, points: !isTeamAWin ? scoreB : 0 },
        { playerId: team_b_player_2, points: !isTeamAWin ? scoreB : 0 }
      ].filter(p => p.playerId); // Filter out null players

      // Update round_points table
      for (const { playerId, points } of playerPoints) {
        const { error: pointsError } = await supabase
          .from("round_points")
          .upsert({
            event_id: eventId,
            round_id: roundId,
            player_id: playerId,
            points: points
          }, {
            onConflict: "event_id,round_id,player_id"
          });

        if (pointsError) {
          console.error("Failed to update round points:", pointsError);
        }
      }

      // Update ELO ratings if configured
      if (eloConfig && eventFormat) {
        await updatePlayerElos(
          [team_a_player_1, team_a_player_2].filter(Boolean),
          [team_b_player_1, team_b_player_2].filter(Boolean),
          scoreA,
          scoreB,
          players,
          eventFormat
        );
      }

    } catch (error) {
      console.error("Failed to update round points:", error);
    }
  };

  // Update ELO ratings based on match result
  const updatePlayerElos = async (
    teamA: UUID[],
    teamB: UUID[],
    scoreA: number,
    scoreB: number,
    players: Record<UUID, Player>,
    format: string
  ) => {
    try {
      if (!eloConfig) return;

      // Update ELO ratings based on match result (simplified for now)
      const isTeamAWin = scoreA > scoreB;
      const eloChange = 20; // Basic ELO change
      
      // Update ELO in database
      const updates = [
        ...teamA.map(id => ({ id, eloChange: isTeamAWin ? eloChange : -eloChange })),
        ...teamB.map(id => ({ id, eloChange: !isTeamAWin ? eloChange : -eloChange }))
      ];

      for (const update of updates) {
        const currentElo = players[update.id]?.elo || 1200;
        const newElo = Math.max(100, currentElo + update.eloChange);
        
        const { error } = await supabase
          .from("players")
          .update({ elo: newElo })
          .eq("id", update.id);

        if (error) {
          console.error("Failed to update player ELO:", error);
        }
      }

    } catch (error) {
      console.error("Failed to update ELO ratings:", error);
    }
  };

  return {
    // Configuration
    scoringConfig,
    eloConfig,
    
    // Actions
    setScore,
    updateRoundPoints,
    updatePlayerElos
  };
}