import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { CourtMatch } from "@/lib/types";

export function useHistoricalRounds(eventId: string | undefined) {
  const [viewingRoundNum, setViewingRoundNum] = useState<number>(1);
  const [isViewingHistorical, setIsViewingHistorical] = useState<boolean>(false);
  const [historicalCourts, setHistoricalCourts] = useState<CourtMatch[]>([]);
  const [loadingHistorical, setLoadingHistorical] = useState<boolean>(false);

  // Load historical round data
  const loadHistoricalRound = useCallback(async (eid: string, targetRoundNum: number) => {
    setLoadingHistorical(true);
    try {
      console.log(`Loading historical round ${targetRoundNum} for event ${eid}`);
      
      // Get the round ID for the target round number
      const { data: rounds, error: roundsError } = await supabase
        .from("rounds")
        .select("id, round_num")
        .eq("event_id", eid)
        .eq("round_num", targetRoundNum)
        .single();

      if (roundsError || !rounds) {
        console.warn("No round found for round number:", targetRoundNum);
        setHistoricalCourts([]);
        return;
      }

      // Get matches for this round
      const { data: matches, error: matchesError } = await supabase
        .from("matches")
        .select("*")
        .eq("round_id", rounds.id)
        .order("court_num");

      if (matchesError) {
        console.error("Error loading historical matches:", matchesError);
        setHistoricalCourts([]);
        return;
      }

      // Convert to CourtMatch format
      const historicalCourtMatches = (matches || []).map((m: any) => ({
        court_num: m.court_num,
        teamA: [m.team_a_player1, m.team_a_player2] as [string, string],
        teamB: [m.team_b_player1, m.team_b_player2] as [string, string],
        scoreA: m.score_a ?? undefined,
        scoreB: m.score_b ?? undefined,
      }));
      setHistoricalCourts(historicalCourtMatches);
      console.log(`Loaded ${historicalCourtMatches.length} historical matches for round ${targetRoundNum}`);
    } catch (err) {
      console.error("Failed to load historical round:", err);
      setHistoricalCourts([]);
    }
    setLoadingHistorical(false);
  }, []);

  // Handle round navigation
  const handleRoundChange = useCallback(async (newRoundNum: number, currentRoundNum: number) => {
    console.log(`Navigating to round ${newRoundNum}, current round is ${currentRoundNum}`);
    setViewingRoundNum(newRoundNum);
    const isHistorical = newRoundNum < currentRoundNum;
    setIsViewingHistorical(isHistorical);
    
    if (isHistorical && eventId) {
      console.log(`Loading historical data for round ${newRoundNum}`);
      await loadHistoricalRound(eventId, newRoundNum);
    } else {
      // Back to current round - clear historical data
      console.log('Returning to current round');
      setHistoricalCourts([]);
    }
  }, [eventId, loadHistoricalRound]);

  // Update viewing round when current round changes
  const updateViewingRound = useCallback((currentRoundNum: number) => {
    if (!isViewingHistorical) {
      setViewingRoundNum(currentRoundNum);
    }
  }, [isViewingHistorical]);

  return {
    viewingRoundNum,
    isViewingHistorical,
    historicalCourts,
    loadingHistorical,
    handleRoundChange,
    updateViewingRound,
  };
}
