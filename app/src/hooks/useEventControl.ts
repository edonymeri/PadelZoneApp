// src/hooks/useEventControl.ts
import { useState, useEffect, useMemo } from "react";

import { supabase } from "@/lib/supabase";
import { nextRound } from "@/lib/engine";
import { roundPointsForPlayer } from "@/lib/scoring";
import { updateEloTeamVsTeam } from "@/lib/elo";
import { useToast } from "@/components/ui/use-toast";
import { isWildcardRound, applyWildcardShuffle } from "@/utils/wildcardUtils";
import type { CourtMatch, RoundState, UUID } from "@/lib/types";

type Player = { id: UUID; full_name: string; elo: number };

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

export function useEventControl(eventId?: string) {
  const { toast } = useToast();

  // State
  const [meta, setMeta] = useState<{ 
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
    ended_at?: string | null 
  } | null>(null);
  const [players, setPlayers] = useState<Record<UUID, Player>>({});
  const [roundNum, setRoundNum] = useState<number>(1);
  const [courts, setCourts] = useState<CourtMatch[]>([]);
  const [history, setHistory] = useState<RoundState[]>([]);
  const [nightlyCount, setNightlyCount] = useState<number>(0);
  // Wildcard / deferred advancement
  const [pendingNextRound, setPendingNextRound] = useState<RoundState | null>(null);
  const [pendingIsWildcard, setPendingIsWildcard] = useState(false);

  // loading flags
  const [initializing, setInitializing] = useState(true);
  const [loadingRound, setLoadingRound] = useState(false);

  // keypad
  const [padOpen, setPadOpen] = useState(false);
  const [padTarget, setPadTarget] = useState<{ court: number; side: "A" | "B"; value: number }>({ court: 1, side: "A", value: 0 });

  // timer
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [now, setNow] = useState<number>(Date.now());

  // DB ids
  const [roundId, setRoundId] = useState<string | null>(null);

  // desktop vs mobile
  const [useKeypad, setUseKeypad] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return window.matchMedia?.("(pointer: coarse)").matches || "ontouchstart" in window;
  });

  // flags
  const isPointsMode = (meta?.points_per_game ?? 0) > 0;
  // time mode currently unused in UI, omit to reduce lint noise
  // const isTimeMode = !isPointsMode && (meta?.round_minutes ?? 0) > 0;
  const isEnded = !!meta?.ended_at;
  
  // Enhanced points mode flags
  const hasRoundLimit = isPointsMode && (meta?.max_rounds ?? 0) > 0;
  const hasTimeLimit = isPointsMode && (meta?.event_duration_hours ?? 0) > 0;
  const derivedIsTimeMode = !isPointsMode && (meta?.round_minutes ?? 0) > 0;
  const shouldShowTimer = derivedIsTimeMode || (isPointsMode && hasTimeLimit);

  // Timer logic
  useEffect(() => {
    if (!shouldShowTimer || !startedAt) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [shouldShowTimer, startedAt]);

  const elapsed = startedAt ? Math.floor((now - new Date(startedAt).getTime()) / 1000) : 0;
  
  // Calculate remaining time based on mode
  let remainingMs = 0;
  let timeText = "";
  
  if (derivedIsTimeMode) {
    const roundMinutes = meta?.round_minutes || 12;
    const totalSeconds = roundMinutes * 60;
    remainingMs = Math.max(0, totalSeconds - elapsed) * 1000;
    const minutes = Math.floor(remainingMs / 60000);
    const seconds = Math.floor((remainingMs % 60000) / 1000);
    timeText = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  } else if (isPointsMode && hasTimeLimit) {
    const eventHours = meta?.event_duration_hours || 3;
    const totalSeconds = eventHours * 3600;
    remainingMs = Math.max(0, totalSeconds - elapsed) * 1000;
    const hours = Math.floor(remainingMs / 3600000);
    const minutes = Math.floor((remainingMs % 3600000) / 60000);
    const seconds = Math.floor((remainingMs % 60000) / 1000);
    timeText = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  // Debounced score update
  const debouncedSetScore = useMemo(() => {
    let t: any;
    return (courtNum: number, scoreA?: number, scoreB?: number) => {
      clearTimeout(t);
      t = setTimeout(async () => {
        if (!roundId) return;

        const updates: any = {};
        if (scoreA !== undefined) updates.score_a = scoreA;
        if (scoreB !== undefined) updates.score_b = scoreB;

        const { error } = await supabase
          .from("matches")
          .update(updates)
          .eq("round_id", roundId)
          .eq("court_num", courtNum);

        if (error) {
          console.error("Failed to update score:", error);
          toast({ variant: "destructive", title: "Failed to update score", description: error.message });
        }
      }, 400);
    };
  }, [roundId, toast]);

  // Memoized court status calculation
  const courtStatuses = useMemo(() => {
    return courts.map(court => ({
      courtNum: court.court_num,
      isComplete: court.scoreA !== undefined && court.scoreB !== undefined,
      hasScore: court.scoreA !== undefined || court.scoreB !== undefined
    }));
  }, [courts]);

  // Memoized completion stats
  const completionStats = useMemo(() => {
    const completed = courts.filter(ct => ct.scoreA !== undefined && ct.scoreB !== undefined).length;
    const total = courts.length;
    return {
      completed,
      total,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  }, [courts]);

  // Helper functions
  function toCourtMatch(m: any): CourtMatch {
    return {
      court_num: m.court_num as number,
      teamA: [m.team_a_player1 as UUID, m.team_a_player2 as UUID],
      teamB: [m.team_b_player1 as UUID, m.team_b_player2 as UUID],
      scoreA: m.score_a ?? undefined,
      scoreB: m.score_b ?? undefined,
    };
  }

  // Actions
  const setScore = (courtNum: number, scoreA?: number, scoreB?: number) => {
    let A = scoreA, B = scoreB;
    
    // Auto-calculate complementary score in points mode
    if (isPointsMode && meta?.points_per_game) {
      const total = meta.points_per_game;
      if (A != null && Number.isNaN(A)) A = undefined;
      if (B != null && Number.isNaN(B)) B = undefined;
      if (A != null && B == null) { 
        A = clamp(A, 0, total); 
        B = total - A; 
      }
      else if (B != null && A == null) { 
        B = clamp(B, 0, total); 
        A = total - B; 
      }
      else if (A != null && B != null) { 
        A = clamp(A, 0, total); 
        B = clamp(total - A, 0, total); 
      }
    }

    setCourts(prev => prev.map(ct => {
      if (ct.court_num !== courtNum) return ct;
      const updated = { ...ct };
      if (A !== undefined) updated.scoreA = A;
      if (B !== undefined) updated.scoreB = B;
      return updated;
    }));

    debouncedSetScore(courtNum, A, B);
  };

  const startTimer = () => {
    setStartedAt(new Date().toISOString());
  };

  const endRoundAndAdvance = async () => {
    console.warn("endRoundAndAdvance is deprecated; use prepareAdvanceRound/commitPendingRound for wildcard support.");
    await prepareAdvanceRound();
  };

  /**
   * Prepare advancing the round. Finishes current round (scores/elo/points), computes next round.
   * If the next is a wildcard round, it defers DB persistence until commitPendingRound is called.
   * Returns whether advancement was deferred (wildcard) and the prepared next round (if deferred).
   */
  const prepareAdvanceRound = async (): Promise<{ deferred: boolean; next?: RoundState | null }> => {
    if (!eventId || !roundId || loadingRound) return { deferred: false };

    const incomplete = courts.filter(ct => ct.scoreA === undefined || ct.scoreB === undefined);
    if (incomplete.length > 0) {
      toast({ variant: "destructive", title: "Please enter all scores before advancing" });
      return { deferred: false };
    }

    setLoadingRound(true);
    try {
      // Finish current round in DB & calculate scores/elo
      await supabase.from("rounds").update({ finished: true }).eq("id", roundId);
      await calculateRoundPoints();
      await updateEloRatings();

      // Add current round to local history BEFORE moving on
      setHistory(prev => [...prev, { roundNum, courts }]);

      // Check if Americano tournament is complete before generating next round
      if (meta?.format === 'americano') {
        const { isAmericanoComplete } = await import("@/lib/engine");
        const allPlayers = Object.keys(players);
        const updatedHistory = [...history, { roundNum, courts }];
        
        const isComplete = isAmericanoComplete(
          updatedHistory,
          allPlayers,
          (meta.variant as any) || 'individual'
        );
        
        if (isComplete) {
          toast({ 
            title: "Tournament Complete!", 
            description: "All players have partnered with each other. The Americano tournament is finished.",
            duration: 5000 
          });
          // Don't generate a new round, tournament is complete
          setLoadingRound(false);
          return { deferred: false };
        }
      }

      // Compute the next round pairings
      let nextState: RoundState;
      
      if (meta?.format === 'americano') {
        // Use Americano pairing algorithm
        const { nextAmericanoRound } = await import("@/lib/engine");
        const allPlayers = Object.keys(players);
        
        nextState = nextAmericanoRound(
          roundNum,
          meta.courts,
          allPlayers,
          history,
          {
            format: 'americano',
            variant: (meta.variant as any) || 'individual',
            antiRepeatWindow: 3,
            restBalancing: true
          }
        );
      } else {
        // Use existing Winners Court algorithm
        nextState = nextRound(
          { roundNum, courts },
          { antiRepeatWindow: 3 },
          history
        );
      }

      // Only apply wildcard logic for Winner's Court format
      const willBeWildcard = meta && meta.format === 'winners-court' && isWildcardRound(nextState.roundNum, meta as any);
      if (willBeWildcard) {
        const intensity = meta!.wildcard_intensity || 'medium';
        nextState = { ...nextState, courts: applyWildcardShuffle(nextState.courts, intensity) };
        setPendingNextRound(nextState);
        setPendingIsWildcard(true);
        // Do NOT persist yet – UI will show preview/modal
        setLoadingRound(false);
        return { deferred: true, next: nextState };
      }

      // Persist immediately for normal rounds
      await persistNextRound(nextState);
      toast({ title: "Round advanced" });
      return { deferred: false };
    } catch (error: any) {
      console.error("Failed to prepare next round:", error);
      toast({ variant: "destructive", title: "Failed to advance round", description: error.message });
      return { deferred: false };
    } finally {
      setLoadingRound(false);
    }
  };

  /** Persist a prepared next round (used after wildcard reveal) */
  const commitPendingRound = async () => {
    if (!eventId || !pendingNextRound) return;
    setLoadingRound(true);
    try {
      await persistNextRound(pendingNextRound);
      toast({ title: pendingIsWildcard ? "Wildcard round started" : "Round advanced" });
    } catch (e: any) {
      console.error("Failed committing pending round", e);
      toast({ variant: "destructive", title: "Failed to start next round", description: e.message });
    } finally {
      setPendingNextRound(null);
      setPendingIsWildcard(false);
      setLoadingRound(false);
    }
  };

  /** Internal helper to insert next round + matches & update local state */
  async function persistNextRound(state: RoundState) {
    const { data: newRound, error: newRoundErr } = await supabase
      .from("rounds")
      .insert({ event_id: eventId, round_num: state.roundNum })
      .select()
      .single();
    if (newRoundErr) throw newRoundErr;

    const matchInserts = state.courts.map(ct => ({
      round_id: newRound.id,
      court_num: ct.court_num,
      team_a_player1: ct.teamA[0],
      team_a_player2: ct.teamA[1],
      team_b_player1: ct.teamB[0],
      team_b_player2: ct.teamB[1],
    }));
    await supabase.from("matches").insert(matchInserts);

    setRoundNum(state.roundNum);
    setRoundId(newRound.id);
    setCourts(state.courts);
    setStartedAt(null);
  }

  const calculateRoundPoints = async () => {
    if (!eventId || !roundId) return;

    const pointsToInsert: any[] = [];

    for (const court of courts) {
      if (court.scoreA === undefined || court.scoreB === undefined) continue;

      const aWon = court.scoreA > court.scoreB;
      const bWon = court.scoreB > court.scoreA;
      const diff = Math.abs(court.scoreA - court.scoreB);

      for (const playerId of court.teamA) {
        const points = roundPointsForPlayer({
          won: aWon,
          court: court.court_num,
          pointDiff: diff,
          defendedC1: meta?.format === 'winners-court' && court.court_num === 1 && aWon && roundNum > 4,
          promoted: false,
        });

        pointsToInsert.push({
          event_id: eventId,
          round_id: roundId,
          player_id: playerId,
          points,
          court_num: court.court_num,
        });
      }

      for (const playerId of court.teamB) {
        const points = roundPointsForPlayer({
          won: bWon,
          court: court.court_num,
          pointDiff: diff,
          defendedC1: meta?.format === 'winners-court' && court.court_num === 1 && bWon && roundNum > 4,
          promoted: false,
        });

        pointsToInsert.push({
          event_id: eventId,
          round_id: roundId,
          player_id: playerId,
          points,
          court_num: court.court_num,
        });
      }
    }

    if (pointsToInsert.length > 0) {
      await supabase.from("round_points").insert(pointsToInsert);
    }
  };

  const updateEloRatings = async () => {
    if (!eventId || !roundId) return;

    const eloUpdates: any[] = [];

    for (const court of courts) {
      if (court.scoreA === undefined || court.scoreB === undefined) continue;

      const teamAElo = (players[court.teamA[0]]?.elo || 1000 + players[court.teamA[1]]?.elo || 1000) / 2;
      const teamBElo = (players[court.teamB[0]]?.elo || 1000 + players[court.teamB[1]]?.elo || 1000) / 2;
      const aWon = court.scoreA > court.scoreB;

      const deltaA = updateEloTeamVsTeam(teamAElo, teamBElo, aWon);

      for (const playerId of [...court.teamA, ...court.teamB]) {
        const isTeamA = court.teamA.includes(playerId);
        const delta = isTeamA ? deltaA : -deltaA;
        const oldElo = players[playerId]?.elo || 1000;
        const newElo = Math.max(0, oldElo + delta);

        eloUpdates.push({
          event_id: eventId,
          round_id: roundId,
          player_id: playerId,
          elo_before: oldElo,
          elo_after: newElo,
          delta,
        });

        setPlayers(prev => ({
          ...prev,
          [playerId]: { ...prev[playerId], elo: newElo }
        }));
      }
    }

    if (eloUpdates.length > 0) {
      await supabase.from("elo_history").insert(eloUpdates);
      
      for (const update of eloUpdates) {
        await supabase
          .from("players")
          .update({ elo: update.elo_after })
          .eq("id", update.player_id);
      }
    }
  };

  const undoLastRound = async () => {
    toast({ title: "Undo functionality", description: "Would undo the last round" });
  };

  const endEvent = async () => {
    if (!eventId) return;
    await supabase.from("events").update({ ended_at: new Date().toISOString() }).eq("id", eventId);
    setMeta(prev => prev ? { ...prev, ended_at: new Date().toISOString() } : null);
    toast({ title: "Event ended" });
  };

  const exportEventJSON = () => {
    const data = { meta, players, rounds: history, currentRound: { roundNum, courts } };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${meta?.name || "event"}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  // Initial load
  useEffect(() => {
    if (!eventId) return;
    (async () => {
      try {
        const { data: ev, error: evErr } = await supabase
          .from("events")
          .select("name,courts,court_names,round_minutes,points_per_game,max_rounds,event_duration_hours,wildcard_enabled,wildcard_start_round,wildcard_frequency,wildcard_intensity,format,variant,ended_at,club_id,public_code")
          .eq("id", eventId)
          .single();
        if (evErr) throw evErr;

        setMeta({
          name: ev.name,
          courts: ev.courts,
          court_names: ev.court_names,
          round_minutes: ev.round_minutes,
          points_per_game: ev.points_per_game ?? 0,
          max_rounds: ev.max_rounds ?? 0,
          event_duration_hours: ev.event_duration_hours ?? 0,
          wildcard_enabled: ev.wildcard_enabled ?? false,
          wildcard_start_round: ev.wildcard_start_round ?? 5,
          wildcard_frequency: ev.wildcard_frequency ?? 3,
          wildcard_intensity: ev.wildcard_intensity ?? 'medium',
          format: ev.format ?? 'winners-court',
          variant: ev.variant ?? null,
          ended_at: ev.ended_at ?? null,
        });

        const { data: eps, error: epErr } = await supabase
          .from("event_players")
          .select("player_id, players!inner(id, full_name, elo)")
          .eq("event_id", eventId);
        if (epErr) throw epErr;

        const map: Record<UUID, Player> = {};
        (eps || []).forEach((r: any) => {
          map[r.players.id] = { id: r.players.id, full_name: r.players.full_name, elo: r.players.elo };
        });
        setPlayers(map);

        // Ensure there is a round, then load the newest
        const { data: rounds, error: rErr } = await supabase
          .from("rounds")
          .select("id, round_num, started_at")
          .eq("event_id", eventId)
          .order("round_num");
        if (rErr) throw rErr;

        if (!rounds || rounds.length === 0) {
          await seedRound1(eventId, ev.courts as number, map, (ev.points_per_game ?? 0) > 0, ev.round_minutes);
        }
        await loadLatestRound(eventId, (ev.points_per_game ?? 0) > 0);

        // nightly points count (for empty-state)
        const { count } = await supabase
          .from("round_points")
          .select("*", { count: "exact", head: true })
          .eq("event_id", eventId);
        setNightlyCount(count || 0);
      } catch (e: any) {
        alert(e?.message || String(e));
      } finally {
        setInitializing(false);
      }
    })();
  }, [eventId]);

  async function seedRound1(eid: string, numCourts: number, playerMap: Record<UUID, Player>, isPointsMode: boolean, roundMinutes?: number) {
    const playerList = Object.values(playerMap);
    if (playerList.length < numCourts * 4) {
      alert(`Need at least ${numCourts * 4} players for ${numCourts} courts.`);
      return;
    }

    const { data: round, error: rErr } = await supabase
      .from("rounds")
      .insert({ event_id: eid, round_num: 1 })
      .select()
      .single();
    if (rErr) throw rErr;

    setRoundId(round.id);
    setRoundNum(1);

    let initialCourts: CourtMatch[];
    
    if (meta?.format === 'americano') {
      // Use Americano seeding for round 1
      const { nextAmericanoRound } = await import("@/lib/engine");
      const allPlayerIds = playerList.map(p => p.id);
      
      const round1State = nextAmericanoRound(
        0, // Starting from round 0 to get round 1
        numCourts,
        allPlayerIds,
        [], // No previous rounds
        {
          format: 'americano',
          variant: (meta.variant as any) || 'individual',
          antiRepeatWindow: 3,
          restBalancing: true
        }
      );
      
      initialCourts = round1State.courts;
    } else {
      // shuffle players for initial pairings (existing Winners Court logic)
      const shuffled = [...playerList].sort(() => Math.random() - 0.5);
      initialCourts = [];

      for (let c = 1; c <= numCourts; c++) {
        const idx = (c - 1) * 4;
        initialCourts.push({
          court_num: c,
          teamA: [shuffled[idx].id, shuffled[idx + 1].id],
          teamB: [shuffled[idx + 2].id, shuffled[idx + 3].id],
        });
      }
    }

    const matchInserts = initialCourts.map(ct => ({
      round_id: round.id,
      court_num: ct.court_num,
      team_a_player1: ct.teamA[0],
      team_a_player2: ct.teamA[1],
      team_b_player1: ct.teamB[0],
      team_b_player2: ct.teamB[1],
    }));

    await supabase.from("matches").insert(matchInserts);
    setCourts(initialCourts);
  }

  async function loadLatestRound(eid: string, isPointsMode: boolean) {
    const { data: rounds, error: rErr } = await supabase
      .from("rounds")
      .select("id, round_num, started_at")
      .eq("event_id", eid)
      .order("round_num");
    if (rErr) throw rErr;

    if (!rounds || rounds.length === 0) {
      await seedRound1(eid, meta?.courts || 2, players, isPointsMode, meta?.round_minutes);
      return;
    }

    const latest = rounds[rounds.length - 1];
    setRoundNum(latest.round_num);
    setRoundId(latest.id);
    setStartedAt(latest.started_at);

    const { data: matches } = await supabase
      .from("matches")
      .select("*")
      .eq("round_id", latest.id)
      .order("court_num");

    const courtMatches = (matches || []).map(toCourtMatch);
    setCourts(courtMatches);

    // Build history
    const hist: RoundState[] = [];
    for (const r of rounds.slice(0, -1)) {
      const { data: hMatches } = await supabase
        .from("matches")
        .select("*")
        .eq("round_id", r.id)
        .order("court_num");
      hist.push({
        roundNum: r.round_num,
        courts: (hMatches || []).map(toCourtMatch),
      });
    }
    setHistory(hist);
  }

  return {
    // State
    meta,
    players,
    roundNum,
    courts,
    history,
    nightlyCount,
    initializing,
    loadingRound,
  pendingNextRound,
  pendingIsWildcard,
    padOpen,
    padTarget,
    startedAt,
    now,
    roundId,
    useKeypad,
    isPointsMode,
  // isTimeMode,
    shouldShowTimer,
    hasRoundLimit,
    hasTimeLimit,
    isEnded,
    timeText,
    remainingMs,

    // Memoized values
    courtStatuses,
    completionStats,

    // Actions
    setScore,
    startTimer,
    endRoundAndAdvance,
  prepareAdvanceRound,
  commitPendingRound,
    undoLastRound,
    endEvent,
    exportEventJSON,
    setUseKeypad,
    setPadOpen,
    setPadTarget,
  };
}
