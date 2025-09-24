import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
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

export function useScoreboard(eventId: string | undefined) {
  const [meta, setMeta] = useState<EvMeta | null>(null);
  const [roundNum, setRoundNum] = useState<number>(1);
  const [courts, setCourts] = useState<CourtMatch[]>([]);
  const [players, setPlayers] = useState<Record<UUID, Player>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [allRounds, setAllRounds] = useState<{id: string, round_num: number}[]>([]);

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

        // 3) Latest round *with* matches
        await loadLatestRoundWithMatches(eventId, cancelled);
        
        // 4) Load all rounds for navigation
        await loadAllRounds(eventId);
      } catch (err: any) {
        console.warn("Scoreboard load error:", err?.message || err);
        if (!cancelled) setErrorMsg("Could not load event.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadAll();
    const t = setInterval(() => loadLatestRoundWithMatches(eventId, cancelled), 5000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [eventId]);

  async function loadLatestRoundWithMatches(eid: string, cancelledFlag = false) {
    const { data: all, error } = await supabase
      .from("rounds")
      .select("id, round_num")
      .eq("event_id", eid)
      .order("round_num", { ascending: false });
    if (error || !all || all.length === 0) return;

    let chosen = all[0];
    let ms: any[] = [];
    for (const rr of all) {
      const { data: m2 } = await supabase
        .from("matches")
        .select("*")
        .eq("round_id", rr.id)
        .order("court_num");
      if (m2 && m2.length > 0) {
        chosen = rr;
        ms = m2;
        break;
      }
    }

    if (!cancelledFlag) {
      setRoundNum(chosen.round_num);
      setCourts(
        (ms || []).map((m: any) => ({
          court_num: m.court_num,
          teamA: [m.team_a_player1, m.team_a_player2],
          teamB: [m.team_b_player1, m.team_b_player2],
          scoreA: m.score_a ?? undefined,
          scoreB: m.score_b ?? undefined,
        }))
      );
    }
  }

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

  return {
    meta,
    roundNum,
    courts,
    players,
    loading,
    errorMsg,
    allRounds,
  };
}



