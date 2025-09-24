// src/hooks/useEventState.ts
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { CourtMatch, RoundState, UUID } from "@/lib/types";

type Player = { id: UUID; full_name: string; elo: number };

interface EventMeta {
  name: string; 
  courts: number; 
  court_names?: string[];
  round_minutes: number; 
  points_per_game?: number; 
  max_rounds?: number;
  event_duration_hours?: number;
  wildcard_enabled?: boolean;
  wildcard_start_round?: number;
  wildcard_frequency?: number;
  wildcard_intensity?: 'mild' | 'medium' | 'mayhem';
  format?: string;
  variant?: string | null;
  ended_at?: string | null;
  club_id?: string;
}

export function useEventState(eventId?: string) {
  // Core event state
  const [meta, setMeta] = useState<EventMeta | null>(null);
  const [players, setPlayers] = useState<Record<UUID, Player>>({});
  const [roundNum, setRoundNum] = useState<number>(1);
  const [courts, setCourts] = useState<CourtMatch[]>([]);
  const [history, setHistory] = useState<RoundState[]>([]);
  const [nightlyCount, setNightlyCount] = useState<number>(0);
  
  // Wildcard / deferred advancement
  const [pendingNextRound, setPendingNextRound] = useState<RoundState | null>(null);
  const [pendingIsWildcard, setPendingIsWildcard] = useState(false);

  // Loading flags
  const [initializing, setInitializing] = useState(true);
  const [loadingRound, setLoadingRound] = useState(false);

  // DB ids
  const [roundId, setRoundId] = useState<string | null>(null);

  // Derived states
  const isPointsMode = (meta?.points_per_game ?? 0) > 0;
  const isEnded = !!meta?.ended_at;
  const hasRoundLimit = isPointsMode && (meta?.max_rounds ?? 0) > 0;
  const hasTimeLimit = isPointsMode && (meta?.event_duration_hours ?? 0) > 0;
  const derivedIsTimeMode = !isPointsMode && (meta?.round_minutes ?? 0) > 0;
  const shouldShowTimer = derivedIsTimeMode || (isPointsMode && hasTimeLimit);

  // Load initial event data
  useEffect(() => {
    if (!eventId) {
      setInitializing(false);
      return;
    }

    const loadEventData = async () => {
      setInitializing(true);
      try {
        // Load event metadata
        const { data: eventData, error: eventError } = await supabase
          .from("events")
          .select("*")
          .eq("id", eventId)
          .single();

        if (eventError || !eventData) {
          console.error("Failed to load event:", eventError);
          setMeta(null);
          return;
        }

        setMeta(eventData);

        // Load players
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
          const playersMap: Record<UUID, Player> = {};
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

        // Load rounds and current state
        const { data: roundsData, error: roundsError } = await supabase
          .from("rounds")
          .select("*")
          .eq("event_id", eventId)
          .order("round_num", { ascending: true });

        if (roundsError) {
          console.error("Failed to load rounds:", roundsError);
        } else {
          const rounds = roundsData || [];
          setHistory(rounds);
          
          // Find current round
          const currentRound = rounds.find(r => !r.ended_at) || rounds[rounds.length - 1];
          if (currentRound) {
            setRoundNum(currentRound.round_num);
            setRoundId(currentRound.id);
            
            // Load current round courts
            const { data: courtsData, error: courtsError } = await supabase
              .from("matches")
              .select("*")
              .eq("round_id", currentRound.id)
              .order("court_num", { ascending: true });

            if (courtsError) {
              console.error("Failed to load courts:", courtsError);
            } else {
              setCourts(courtsData || []);
            }
          }
        }

        // Load nightly count if this is a nightly
        if (eventData.name?.toLowerCase().includes('nightly')) {
          const { count } = await supabase
            .from("events")
            .select("*", { count: "exact", head: true })
            .eq("club_id", eventData.club_id)
            .like("name", "%nightly%");
          
          setNightlyCount(count || 0);
        }

      } catch (error) {
        console.error("Failed to load event data:", error);
      } finally {
        setInitializing(false);
      }
    };

    loadEventData();
  }, [eventId]);

  return {
    // State
    meta,
    setMeta,
    players,
    setPlayers,
    roundNum,
    setRoundNum,
    courts,
    setCourts,
    history,
    setHistory,
    nightlyCount,
    setNightlyCount,
    pendingNextRound,
    setPendingNextRound,
    pendingIsWildcard,
    setPendingIsWildcard,
    initializing,
    setInitializing,
    loadingRound,
    setLoadingRound,
    roundId,
    setRoundId,

    // Derived states
    isPointsMode,
    isEnded,
    hasRoundLimit,
    hasTimeLimit,
    derivedIsTimeMode,
    shouldShowTimer
  };
}