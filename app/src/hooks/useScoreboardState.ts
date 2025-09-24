// src/hooks/useScoreboardState.ts
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { determineEventWinners } from "@/lib/scoring";
import { calculateEventLeaderboard } from "@/lib/leaderboard";
import type { CourtMatch, UUID } from "@/lib/types";

type Player = { id: UUID; full_name: string; elo: number };

type EvMeta = {
  id: string;
  name: string;
  courts: number;
  round_minutes: number | null;
  points_per_game: number | null;
  ended_at?: string | null;
  created_at?: string | null;
  club_id?: string | null;
  player_count?: number;
  rounds_count?: number;
  last_activity?: string | null;
};

export function useScoreboardState() {
  const { eventId } = useParams();
  
  // Basic state
  const [meta, setMeta] = useState<EvMeta | null>(null);
  const [roundNum, setRoundNum] = useState<number>(1);
  const [courts, setCourts] = useState<CourtMatch[]>([]);
  const [players, setPlayers] = useState<Record<UUID, Player>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [recentEvents, setRecentEvents] = useState<EvMeta[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [eventWinners, setEventWinners] = useState<any>(null);
  
  // Round navigation state
  const [viewingRoundNum, setViewingRoundNum] = useState<number>(1);
  const [isViewingHistorical, setIsViewingHistorical] = useState<boolean>(false);
  const [historicalCourts, setHistoricalCourts] = useState<CourtMatch[]>([]);
  const [loadingHistorical, setLoadingHistorical] = useState<boolean>(false);
  const [allRounds, setAllRounds] = useState<{id: string, round_num: number}[]>([]);

  // Load latest round with matches
  const loadLatestRoundWithMatches = async (eid: string, cancelled: boolean = false) => {
    try {
      const { data: rounds, error: roundsErr } = await supabase
        .from("rounds")
        .select("*")
        .eq("event_id", eid)
        .order("round_num", { ascending: false })
        .limit(1);

      if (roundsErr || !rounds || rounds.length === 0) {
        console.warn("No rounds found for event:", eid);
        if (!cancelled) {
          setRoundNum(1);
          setCourts([]);
        }
        return;
      }

      const latestRound = rounds[0];
      if (!cancelled) setRoundNum(latestRound.round_num);

      const { data: matches, error: matchesErr } = await supabase
        .from("matches")
        .select("*")
        .eq("round_id", latestRound.id)
        .order("court_num");

      if (matchesErr) throw matchesErr;

      const courtMatches = (matches || []).map((m: any) => ({
        court_num: m.court_num as number,
        teamA: [m.team_a_player1, m.team_a_player2] as [string, string],
        teamB: [m.team_b_player1, m.team_b_player2] as [string, string],
        scoreA: m.score_a ?? undefined,
        scoreB: m.score_b ?? undefined,
      })) as CourtMatch[];

      if (!cancelled) setCourts(courtMatches);
    } catch (err) {
      console.error("Error loading latest round:", err);
      if (!cancelled) setCourts([]);
    }
  };

  // Load leaderboard
  const loadLeaderboard = async (eid: string) => {
    try {
      const lb = await calculateEventLeaderboard(eid);
      setLeaderboard(lb);

      // Check if event is ended and calculate winners
      if (meta?.ended_at) {
        const winners = determineEventWinners(lb);
        setEventWinners(winners);
      }
    } catch (err) {
      console.warn("Failed to load leaderboard:", err);
      setLeaderboard([]);
    }
  };

  // Load historical round data
  const loadHistoricalRound = async (eid: string, targetRoundNum: number) => {
    setLoadingHistorical(true);
    try {
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

      const historicalCourtMatches = (matches || []).map((m: any) => ({
        court_num: m.court_num as number,
        teamA: [m.team_a_player1, m.team_a_player2] as [string, string],
        teamB: [m.team_b_player1, m.team_b_player2] as [string, string],
        scoreA: m.score_a ?? undefined,
        scoreB: m.score_b ?? undefined,
      })) as CourtMatch[];

      setHistoricalCourts(historicalCourtMatches);
    } catch (err) {
      console.error("Failed to load historical round:", err);
      setHistoricalCourts([]);
    }
    setLoadingHistorical(false);
  };

  // Handle round navigation
  const handleRoundChange = async (newRoundNum: number) => {
    setViewingRoundNum(newRoundNum);
    const isHistorical = newRoundNum < roundNum;
    setIsViewingHistorical(isHistorical);
    
    if (isHistorical && eventId) {
      await loadHistoricalRound(eventId, newRoundNum);
    } else {
      setHistoricalCourts([]);
    }
  };

  // Load all available rounds for navigation
  const loadAllRounds = async (eid: string) => {
    try {
      const { data: rounds, error } = await supabase
        .from("rounds")
        .select("id, round_num")
        .eq("event_id", eid)
        .order("round_num", { ascending: true });

      if (error) throw error;
      setAllRounds(rounds || []);
    } catch (err) {
      console.warn("Failed to load rounds list:", err);
      setAllRounds([]);
    }
  };

  // Load recent events (when no eventId)
  useEffect(() => {
    if (eventId) return;
    
    (async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        const clubId = localStorage.getItem("clubId") || "";
        
        const { data: events, error: evErr } = await supabase
          .from("events")
          .select("id,name,courts,round_minutes,points_per_game,ended_at,created_at")
          .eq("club_id", clubId)
          .order("created_at", { ascending: false })
          .limit(20);

        if (evErr) throw evErr;

        // Enhance events with player counts and round counts
        const enhancedEvents = await Promise.all((events || []).map(async (event) => {
          try {
            // Get player count
            const { count: playerCount } = await supabase
              .from("event_players")
              .select("*", { count: "exact", head: true })
              .eq("event_id", event.id);

            // Get round count
            const { count: roundsCount } = await supabase
              .from("rounds")
              .select("*", { count: "exact", head: true })
              .eq("event_id", event.id);

            // Get last activity
            const { data: lastRound } = await supabase
              .from("rounds")
              .select("created_at")
              .eq("event_id", event.id)
              .order("created_at", { ascending: false })
              .limit(1)
              .single();

            return {
              ...event,
              player_count: playerCount || 0,
              rounds_count: roundsCount || 0,
              last_activity: lastRound?.created_at || null
            };
          } catch {
            return {
              ...event,
              player_count: 0,
              rounds_count: 0,
              last_activity: null
            };
          }
        }));
        
        setRecentEvents(enhancedEvents);
      } catch (err: any) {
        console.warn("Scoreboard recent events fetch error:", err?.message || err);
        setErrorMsg("Could not load recent events.");
      } finally {
        setLoading(false);
      }
    })();
  }, [eventId]);

  // Load event data when eventId is present
  useEffect(() => {
    if (!eventId) return;
    let cancelled = false;

    async function loadAll() {
      setLoading(true);
      setErrorMsg(null);
      try {
        // 1) Meta
        const { data: ev, error: evErr } = await supabase
          .from("events")
          .select("id,name,courts,round_minutes,points_per_game,ended_at,created_at")
          .eq("id", eventId)
          .single();
        if (evErr) throw evErr;
        if (!cancelled) setMeta(ev as EvMeta);

        // 2) Players
        const { data: eps, error: epErr } = await supabase
          .from("event_players")
          .select("players!inner(id,full_name,elo)")
          .eq("event_id", eventId);
        if (epErr) throw epErr;
        const pmap: Record<UUID, Player> = {};
        (eps || []).forEach((r: any) => (pmap[r.players.id] = r.players));
        if (!cancelled) setPlayers(pmap);

        // 3) Latest round with matches
        await loadLatestRoundWithMatches(eventId, cancelled);
        
        // 4) Load all rounds for navigation
        await loadAllRounds(eventId);
        
        // 5) Load leaderboard
        await loadLeaderboard(eventId);
      } catch (err: any) {
        console.error("Scoreboard data fetch error:", err);
        if (!cancelled) setErrorMsg("Could not load scoreboard data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadAll();
    return () => { cancelled = true; };
  }, [eventId, meta?.ended_at]);

  // Update viewing round when current round changes
  useEffect(() => {
    if (!isViewingHistorical) {
      setViewingRoundNum(roundNum);
    }
  }, [roundNum, isViewingHistorical]);

  return {
    // Basic state
    eventId,
    meta,
    roundNum,
    courts,
    players,
    loading,
    recentEvents,
    errorMsg,
    leaderboard,
    eventWinners,
    
    // Round navigation
    viewingRoundNum,
    isViewingHistorical,
    historicalCourts,
    loadingHistorical,
    allRounds,
    handleRoundChange,
    
    // Computed values
    isEnded: !!meta?.ended_at,
    playerCount: Object.keys(players).length,
    isPointsMode: (meta?.points_per_game ?? 0) > 0
  };
}