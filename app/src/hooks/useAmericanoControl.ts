/**
 * Americano Tournament Control Hook
 * 
 * Uses pre-generated hardcoded rounds stored in the database.
 * Player positions (1-8) are randomly assigned once and stay fixed.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import type { UUID, Player, CourtMatch, RoundState } from '@/lib/types';
import { generateAmericanoTournament, getAmericanoRound } from '@/lib/americano-engine';

export function useAmericanoControl(eventId?: string): any {
  const { toast } = useToast();

  // State
  const [meta, setMeta] = useState<{
    name: string;
    courts: number;
    format: string;
    ended_at?: string | null;
    americano_rounds?: RoundState[];
    americano_player_positions?: Record<UUID, number>;
    // Additional properties for UI compatibility
    court_names?: string[];
    round_minutes?: number;
    points_per_game?: number;
    max_rounds?: number;
    event_duration_hours?: number;
    wildcard_enabled?: boolean;
    wildcard_start_round?: number;
    wildcard_frequency?: number;
    wildcard_intensity?: 'mild' | 'medium' | 'mayhem';
    variant?: string | null;
  } | null>(null);
  
  const [players, setPlayers] = useState<Record<UUID, Player>>({});
  const [currentRoundNum, setCurrentRoundNum] = useState<number>(1);
  const [courts, setCourts] = useState<CourtMatch[]>([]);
  const [history, setHistory] = useState<RoundState[]>([]);
  const [nightlyCount, setNightlyCount] = useState<number>(0);
  
  // Loading flags
  const [initializing, setInitializing] = useState(true);
  const [loadingRound, setLoadingRound] = useState(false);
  
  // DB ids
  const [roundId, setRoundId] = useState<string | null>(null);
  
  // UI state
  const [padOpen, setPadOpen] = useState(false);
  const [padTarget, setPadTarget] = useState<{ courtNum: number; side: 'A' | 'B' } | null>(null);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [useKeypad, setUseKeypad] = useState(false);
  const [isPointsMode, setIsPointsMode] = useState(false);
  
  // Timer state
  const [now, setNow] = useState(new Date());
  const [pendingNextRound, setPendingNextRound] = useState<RoundState | null>(null);
  const [pendingIsWildcard, setPendingIsWildcard] = useState(false);
  
  // Flags
  const isEnded = !!meta?.ended_at;
  const shouldShowTimer = false;
  const hasRoundLimit = false;
  const hasTimeLimit = false;
  const timeText = '';
  const remainingMs = 0;
  
  // Check if this is the last round
  const allRounds = meta?.americano_rounds || [];
  const isLastRound = allRounds.length > 0 && currentRoundNum >= allRounds.length;
  
  // Computed values
  const courtStatuses = courts.map(court => ({
    courtNum: court.court_num,
    isComplete: court.scoreA !== undefined && court.scoreB !== undefined,
    isInProgress: court.scoreA !== undefined || court.scoreB !== undefined,
  }));
  
  const completionStats = {
    total: courts.length,
    complete: courtStatuses.filter(s => s.isComplete).length,
    inProgress: courtStatuses.filter(s => s.isInProgress && !s.isComplete).length,
  };

  // Initial load
  useEffect(() => {
    if (!eventId) return;
    
    (async () => {
      try {
        setInitializing(true);
        
        // Load event metadata
        const { data: ev, error: evErr } = await supabase
          .from("events")
          .select("id, name, courts, format, ended_at, americano_rounds, americano_player_positions, court_names, round_minutes, points_per_game, max_rounds, event_duration_hours, wildcard_enabled, wildcard_start_round, wildcard_frequency, wildcard_intensity, variant")
          .eq("id", eventId)
          .single();
        if (evErr) throw evErr;
        setMeta(ev);

        // Load players
        const { data: eps, error: epErr } = await supabase
          .from("event_players")
          .select("player_id, players!inner(id, full_name, elo)")
          .eq("event_id", eventId);
        if (epErr) throw epErr;

        const playerMap: Record<UUID, Player> = {};
        const playerIds: UUID[] = [];
        (eps || []).forEach((r: any) => {
          playerMap[r.players.id] = { id: r.players.id, full_name: r.players.full_name, elo: r.players.elo };
          playerIds.push(r.players.id);
        });
        setPlayers(playerMap);

        // Check if we need to generate Americano rounds
        if (!ev.americano_rounds || !ev.americano_player_positions) {
          await generateAndStoreAmericanoRounds(eventId, ev.courts, playerMap, playerIds);
          // Reload the event to get the generated rounds
          const { data: updatedEv } = await supabase
            .from("events")
            .select("americano_rounds, americano_player_positions")
            .eq("id", eventId)
            .single();
          setMeta(prev => prev ? { ...prev, ...updatedEv } : null);
          
          // Load current round with the updated meta
          await loadCurrentAmericanoRound(eventId, updatedEv);
        } else {
          await loadCurrentAmericanoRound(eventId, ev);
        }

      } catch (e: any) {
        console.error("Americano initialization error:", e);
        toast({ variant: "destructive", title: "Failed to load Americano event", description: e.message });
      } finally {
        setInitializing(false);
      }
    })();
  }, [eventId, toast]);

  /**
   * Generate and store Americano rounds in the database
   */
  async function generateAndStoreAmericanoRounds(
    eid: string,
    numCourts: number,
    playerMap: Record<UUID, Player>,
    playerIds: UUID[]
  ) {
    console.log(`🎾 Generating Americano rounds for event ${eid}`);
    
    // Create random position mapping (1-8)
    const positionMap: Record<UUID, number> = {};
    const shuffledPositions = [...Array(playerIds.length)].map((_, i) => i + 1).sort(() => Math.random() - 0.5);
    playerIds.forEach((playerId, index) => {
      positionMap[playerId] = shuffledPositions[index];
    });
    
    console.log(`🎾 Player position mapping:`, positionMap);
    
    // Generate all rounds
    const allRounds = generateAmericanoTournament(positionMap, numCourts);
    
    // Store in database
    const { error } = await supabase
      .from("events")
      .update({
        americano_rounds: allRounds,
        americano_player_positions: positionMap
      })
      .eq("id", eid);
    
    if (error) throw error;
    
    console.log(`🎾 Stored ${allRounds.length} Americano rounds in database`);
  }

  /**
   * Load the current Americano round
   */
  async function loadCurrentAmericanoRound(eid: string, eventMeta?: any) {
    // Get the latest round from database
    const { data: rounds, error: rErr } = await supabase
      .from("rounds")
      .select("id, round_num, started_at")
      .eq("event_id", eid)
      .order("round_num");
    if (rErr) throw rErr;

    let currentRound = 1;
    let currentRoundId = null;

    if (rounds && rounds.length > 0) {
      const latest = rounds[rounds.length - 1];
      currentRound = latest.round_num;
      currentRoundId = latest.id;
    } else {
      // Create first round
      const { data: round, error: createErr } = await supabase
        .from("rounds")
        .insert({ event_id: eid, round_num: 1 })
        .select()
        .single();
      if (createErr) throw createErr;
      currentRoundId = round.id;
    }

    setCurrentRoundNum(currentRound);
    setRoundId(currentRoundId);

    // Load matches for current round
    const { data: matches } = await supabase
      .from("matches")
      .select("*")
      .eq("round_id", currentRoundId)
      .order("court_num");

    if (matches && matches.length > 0) {
      // Use existing matches from database
      const courtMatches = matches.map((m: any) => ({
        court_num: m.court_num,
        teamA: [m.team_a_player1, m.team_a_player2] as [string, string],
        teamB: [m.team_b_player1, m.team_b_player2] as [string, string],
        scoreA: m.score_a ?? undefined,
        scoreB: m.score_b ?? undefined,
      })) as CourtMatch[];
      setCourts(courtMatches);
    } else {
      // Generate matches from stored rounds
      const allRounds = eventMeta?.americano_rounds || meta?.americano_rounds || [];
      console.log(`🎾 Loading round ${currentRound} from stored rounds:`, allRounds);
      const roundData = getAmericanoRound(currentRound, allRounds);
      if (roundData) {
        console.log(`🎾 Found round data:`, roundData);
        setCourts(roundData.courts);
        
        // Store matches in database
        const matchInserts = roundData.courts.map(ct => ({
          round_id: currentRoundId,
          court_num: ct.court_num,
          team_a_player1: ct.teamA[0],
          team_a_player2: ct.teamA[1],
          team_b_player1: ct.teamB[0],
          team_b_player2: ct.teamB[1],
        }));
        console.log(`🎾 Inserting matches:`, matchInserts);
        await supabase.from("matches").insert(matchInserts);
      } else {
        console.error('No round data found for round', currentRound, 'in rounds:', allRounds);
      }
    }

    // Build history from previous rounds
    const hist: RoundState[] = [];
    for (const r of (rounds || []).slice(0, -1)) {
      const { data: hMatches } = await supabase
        .from("matches")
        .select("*")
        .eq("round_id", r.id)
        .order("court_num");
      hist.push({
        roundNum: r.round_num,
        courts: (hMatches || []).map((m: any) => ({
          court_num: m.court_num,
          teamA: [m.team_a_player1, m.team_a_player2],
          teamB: [m.team_b_player1, m.team_b_player2],
          scoreA: m.score_a ?? undefined,
          scoreB: m.score_b ?? undefined,
        })),
      });
    }
    setHistory(hist);
  }

  /**
   * Advance to the next Americano round
   */
  const advanceAmericanoRound = useCallback(async (): Promise<boolean> => {
    if (!eventId || !roundId || loadingRound) return false;

    setLoadingRound(true);
    try {
      // Finish current round in DB
      await supabase.from("rounds").update({ finished: true }).eq("id", roundId);

      // Add current round to history
      setHistory(prev => [...prev, { roundNum: currentRoundNum, courts }]);

      // Get next round from stored rounds
      const allRounds = meta?.americano_rounds || [];
      const nextRoundNum = currentRoundNum + 1;
      const nextRoundData = getAmericanoRound(nextRoundNum, allRounds);

      if (!nextRoundData) {
        // This is the last round - complete the tournament
        console.log(`🎾 Tournament complete! Finished round ${currentRoundNum}`);
        
        // End the event
        await supabase.from("events").update({ ended_at: new Date().toISOString() }).eq("id", eventId);
        setMeta(prev => prev ? { ...prev, ended_at: new Date().toISOString() } : null);
        
        // Clear courts to show no more games
        setCourts([]);
        
        toast({ title: "Tournament Complete!", description: "All rounds have been played. Check the leaderboard for final results." });
        return true;
      }

      console.log(`🎾 Advancing to Americano Round ${nextRoundNum}:`, nextRoundData.courts);

      // Create next round in database
      const { data: round, error: rErr } = await supabase
        .from("rounds")
        .insert({ event_id: eventId, round_num: nextRoundNum })
        .select()
        .single();
      if (rErr) throw rErr;

      setRoundId(round.id);
      setCurrentRoundNum(nextRoundNum);

      // Insert matches
      const matchInserts = nextRoundData.courts.map(ct => ({
        round_id: round.id,
        court_num: ct.court_num,
        team_a_player1: ct.teamA[0],
        team_a_player2: ct.teamA[1],
        team_b_player1: ct.teamB[0],
        team_b_player2: ct.teamB[1],
      }));

      await supabase.from("matches").insert(matchInserts);
      setCourts(nextRoundData.courts);
      
      toast({ title: `Advanced to Round ${nextRoundNum}` });
      return true;
    } catch (error: any) {
      console.error("Failed to advance Americano round:", error);
      toast({ variant: "destructive", title: "Failed to advance round", description: error.message });
      return false;
    } finally {
      setLoadingRound(false);
    }
  }, [eventId, roundId, currentRoundNum, courts, meta, loadingRound, toast]);

  /**
   * Update match score
   */
  const updateScore = useCallback(async (courtNum: number, scoreA: number, scoreB: number) => {
    if (!roundId) return;

    await supabase
      .from("matches")
      .update({ score_a: scoreA, score_b: scoreB })
      .eq("round_id", roundId)
      .eq("court_num", courtNum);

    setCourts(prev => prev.map(court => 
      court.court_num === courtNum 
        ? { ...court, scoreA, scoreB }
        : court
    ));
  }, [roundId]);

  // Additional functions for compatibility
  const startTimer = useCallback(() => {
    if (!roundId) return;
    supabase.from("rounds").update({ started_at: new Date().toISOString() }).eq("id", roundId);
    setStartedAt(new Date().toISOString());
  }, [roundId]);

  const prepareAdvanceRound = useCallback(async () => {
    return { deferred: false };
  }, []);

  const commitPendingRound = useCallback(async () => {
    // Americano doesn't use pending rounds
  }, []);

  const undoLastRound = useCallback(async () => {
    if (!eventId || history.length === 0) return;
    
    const lastRound = history[history.length - 1];
    await supabase.from("rounds").delete().eq("event_id", eventId).eq("round_num", lastRound.roundNum);
    
    setHistory(prev => prev.slice(0, -1));
    setCurrentRoundNum(lastRound.roundNum - 1);
    setCourts(lastRound.courts);
  }, [eventId, history]);

  const endEvent = useCallback(async () => {
    if (!eventId) return;
    await supabase.from("events").update({ ended_at: new Date().toISOString() }).eq("id", eventId);
    setMeta(prev => prev ? { ...prev, ended_at: new Date().toISOString() } : null);
  }, [eventId]);

  const exportEventJSON = useCallback(() => {
    const data = {
      meta,
      players,
      rounds: history.concat([{ roundNum: currentRoundNum, courts }]),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `event-${eventId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [meta, players, history, currentRoundNum, courts, eventId]);

  return {
    // State
    meta,
    players,
    roundNum: currentRoundNum,
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
    shouldShowTimer,
    hasRoundLimit,
    hasTimeLimit,
    isEnded,
    timeText,
    remainingMs,
    courtStatuses,
    completionStats,
    
    // Actions
    advanceAmericanoRound,
    updateScore,
    startTimer,
    prepareAdvanceRound,
    commitPendingRound,
    undoLastRound,
    endEvent,
    exportEventJSON,
    setUseKeypad,
    setPadOpen,
    setPadTarget,
    
    // Computed
    canAdvance: !isEnded && !loadingRound,
    isLastRound,
  };
}