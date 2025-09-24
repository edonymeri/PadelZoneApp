// src/hooks/useRoundManagement.ts
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { nextRound } from "@/lib/engine";
import { isWildcardRound, applyWildcardShuffle } from "@/utils/wildcardUtils";
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

export function useRoundManagement() {
  const [isAdvancing, setIsAdvancing] = useState(false);

  // Prepare the next round (with wildcard logic)
  const prepareAdvanceRound = async (
    eventId: string,
    meta: EventMeta,
    players: Record<UUID, Player>,
    history: RoundState[],
    roundNum: number,
    courts: CourtMatch[],
    setPendingNextRound: (round: RoundState | null) => void,
    setPendingIsWildcard: (isWildcard: boolean) => void
  ) => {
    if (!eventId || !meta) return;

    setIsAdvancing(true);
    try {
      // Check if this is a wildcard round
      const nextRoundNum = roundNum + 1;
      const shouldApplyWildcard = meta.wildcard_enabled && 
        isWildcardRound(nextRoundNum, meta);

      // Generate next round
      const currentRound = history[history.length - 1];
      const nextRoundState = nextRound(
        currentRound,
        { antiRepeatWindow: 3 },
        history
      );

      if (shouldApplyWildcard && meta.wildcard_intensity) {
        // Apply wildcard shuffle
        const shuffledState = applyWildcardShuffle(
          nextRoundState.courts,
          meta.wildcard_intensity
        );
        setPendingNextRound({ ...nextRoundState, courts: shuffledState });
        setPendingIsWildcard(true);
      } else {
        // Direct advancement
        await commitRound(eventId, nextRoundState, nextRoundNum);
        setPendingNextRound(null);
        setPendingIsWildcard(false);
      }

    } catch (error) {
      console.error("Failed to prepare advance round:", error);
      throw error;
    } finally {
      setIsAdvancing(false);
    }
  };

  // Commit a pending round
  const commitPendingRound = async (
    eventId: string,
    pendingRound: RoundState,
    roundNum: number,
    setPendingNextRound: (round: RoundState | null) => void,
    setPendingIsWildcard: (isWildcard: boolean) => void
  ) => {
    if (!pendingRound) return;

    try {
      await commitRound(eventId, pendingRound, roundNum + 1);
      setPendingNextRound(null);
      setPendingIsWildcard(false);
    } catch (error) {
      console.error("Failed to commit pending round:", error);
      throw error;
    }
  };

  // Commit a round to the database
  const commitRound = async (
    eventId: string,
    roundState: RoundState,
    newRoundNum: number
  ) => {
    try {
      // End current round
      const { error: endError } = await supabase
        .from("rounds")
        .update({ ended_at: new Date().toISOString() })
        .eq("event_id", eventId)
        .is("ended_at", null);

      if (endError) throw endError;

      // Create new round
      const { data: newRound, error: roundError } = await supabase
        .from("rounds")
        .insert({
          event_id: eventId,
          round_num: newRoundNum,
          started_at: new Date().toISOString()
        })
        .select("id")
        .single();

      if (roundError || !newRound) throw roundError;

      // Create new matches
      const matches = roundState.courts.map((court) => ({
        round_id: newRound.id,
        court_num: court.court_num,
        team_a_player_1: court.teamA[0],
        team_a_player_2: court.teamA[1],
        team_b_player_1: court.teamB[0],
        team_b_player_2: court.teamB[1],
        scoreA: 0,
        scoreB: 0
      }));

      const { error: matchesError } = await supabase
        .from("matches")
        .insert(matches);

      if (matchesError) throw matchesError;

      return newRound.id;

    } catch (error) {
      console.error("Failed to commit round:", error);
      throw error;
    }
  };

  // Undo the last round
  const undoLastRound = async (
    eventId: string,
    history: RoundState[],
    setHistory: (history: RoundState[]) => void,
    setRoundNum: (num: number) => void,
    setCourts: (courts: CourtMatch[]) => void,
    setRoundId: (id: string | null) => void
  ) => {
    if (history.length <= 1) return;

    try {
      const lastRound = history[history.length - 1];
      
      if (!lastRound || typeof lastRound !== 'object') {
        throw new Error('No valid last round found');
      }
      
      // TODO: Fix type mismatch - RoundState vs database record
      const roundId = (lastRound as any).id;
      if (!roundId) {
        console.warn('Cannot undo: round ID not found');
        return;
      }
      
      // Delete the last round's matches
      const { error: matchesError } = await supabase
        .from("matches")
        .delete()
        .eq("round_id", roundId);

      if (matchesError) throw matchesError;

      // Delete the last round
      const { error: roundError } = await supabase
        .from("rounds")
        .delete()
        .eq("id", roundId);

      if (roundError) throw roundError;

      // Reopen the previous round
      const previousRound = history[history.length - 2];
      const prevRoundId = (previousRound as any).id;
      
      if (prevRoundId) {
        const { error: reopenError } = await supabase
          .from("rounds")
          .update({ ended_at: null })
          .eq("id", prevRoundId);

        if (reopenError) throw reopenError;

        // Load previous round's matches
        const { data: prevMatches, error: prevMatchesError } = await supabase
          .from("matches")
          .select("*")
          .eq("round_id", prevRoundId)
          .order("court_num", { ascending: true });

        if (prevMatchesError) throw prevMatchesError;
        setCourts(prevMatches || []);
      }

    } catch (error) {
      console.error("Failed to undo last round:", error);
      throw error;
    }
  };

  // End the event
  const endEvent = async (eventId: string) => {
    try {
      // End current round
      const { error: endRoundError } = await supabase
        .from("rounds")
        .update({ ended_at: new Date().toISOString() })
        .eq("event_id", eventId)
        .is("ended_at", null);

      if (endRoundError) throw endRoundError;

      // Mark event as ended
      const { error: endEventError } = await supabase
        .from("events")
        .update({ ended_at: new Date().toISOString() })
        .eq("id", eventId);

      if (endEventError) throw endEventError;

    } catch (error) {
      console.error("Failed to end event:", error);
      throw error;
    }
  };

  // Export event data
  const exportEventJSON = async (
    eventId: string,
    meta: EventMeta,
    players: Record<UUID, Player>,
    history: RoundState[]
  ) => {
    try {
      const exportData = {
        event: meta,
        players,
        rounds: history,
        exportedAt: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json"
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${meta.name || "event"}-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error("Failed to export event:", error);
      throw error;
    }
  };

  return {
    isAdvancing,
    prepareAdvanceRound,
    commitPendingRound,
    undoLastRound,
    endEvent,
    exportEventJSON
  };
}