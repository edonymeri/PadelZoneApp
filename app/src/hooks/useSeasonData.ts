// src/hooks/useSeasonData.ts
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { calculateEventLeaderboard } from "@/lib/leaderboard";
import type { UUID } from "@/lib/types";

type PlayerRecord = { id: UUID; full_name: string; elo: number };

export function useSeasonData(eventId?: string) {
  const [players, setPlayers] = useState<Record<UUID, PlayerRecord>>({});
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [seasonStats, setSeasonStats] = useState<{
    totalEvents: number;
    totalPlayers: number;
    averageRounds: number;
  }>({ totalEvents: 0, totalPlayers: 0, averageRounds: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!eventId) {
      setIsLoading(false);
      return;
    }

    const loadSeasonData = async () => {
      setIsLoading(true);
      try {
        // Load players for this event
        const { data: playerData, error: playerError } = await supabase
          .from("event_players")
          .select(`
            player_id,
            players!inner (
              id,
              full_name,
              elo
            )
          `)
          .eq("event_id", eventId);

        if (playerError) {
          console.error("Failed to load players:", playerError);
        } else {
          const playersMap: Record<UUID, PlayerRecord> = {};
          (playerData || []).forEach((ep: any) => {
            const player = ep.players;
            playersMap[player.id] = {
              id: player.id,
              full_name: player.full_name,
              elo: player.elo || 1200
            };
          });
          setPlayers(playersMap);
        }

        // Load leaderboard
        const leaderboardData = await calculateEventLeaderboard(eventId);
        setLeaderboard(leaderboardData);

        // Load season stats
        const { data: eventData, error: eventError } = await supabase
          .from("events")
          .select("club_id")
          .eq("id", eventId)
          .single();

        if (!eventError && eventData) {
          const { data: seasonEvents, error: seasonError } = await supabase
            .from("events")
            .select("id, name")
            .eq("club_id", eventData.club_id)
            .like("name", "%nightly%");

          const { data: roundsData, error: roundsError } = await supabase
            .from("rounds")
            .select("event_id")
            .in("event_id", (seasonEvents || []).map(e => e.id));

          if (!seasonError && !roundsError) {
            const eventRoundCounts = (roundsData || []).reduce((acc: any, round: any) => {
              acc[round.event_id] = (acc[round.event_id] || 0) + 1;
              return acc;
            }, {});

            const totalRounds = Object.values(eventRoundCounts).reduce((sum: number, count: any) => sum + Number(count || 0), 0);
            const eventCount = seasonEvents?.length || 0;
            const averageRounds = eventCount > 0 ? Number(totalRounds) / Number(eventCount) : 0;

            setSeasonStats({
              totalEvents: eventCount,
              totalPlayers: Object.keys(players).length,
              averageRounds: Math.round(averageRounds * 10) / 10
            });
          }
        }

      } catch (error) {
        console.error("Failed to load season data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSeasonData();
  }, [eventId]);

  return {
    players,
    leaderboard,
    seasonStats,
    isLoading
  };
}