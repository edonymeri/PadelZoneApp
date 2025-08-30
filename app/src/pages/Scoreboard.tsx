// src/pages/Scoreboard.tsx
import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import type { CourtMatch, UUID } from "@/lib/types";
import { Monitor, MonitorX, Trophy, Users, ChevronLeft, ChevronRight } from "lucide-react";
import RoundNav from "@/components/scoreboard/RoundNav";
import LeaderboardTable from "@/components/scoreboard/LeaderboardTable";


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

export default function Scoreboard() {
  const { eventId } = useParams();
  const [meta, setMeta] = useState<EvMeta | null>(null);
  const [roundNum, setRoundNum] = useState<number>(1);
  const [courts, setCourts] = useState<CourtMatch[]>([]);
  const [players, setPlayers] = useState<Record<UUID, Player>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [recentEvents, setRecentEvents] = useState<EvMeta[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"recent" | "name" | "players" | "courts">("recent");
  const [tvMode, setTvMode] = useState<boolean>(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  
  // Round navigation state
  const [viewingRoundNum, setViewingRoundNum] = useState<number>(1);
  const [isViewingHistorical, setIsViewingHistorical] = useState<boolean>(false);
  const [historicalCourts, setHistoricalCourts] = useState<CourtMatch[]>([]);
  const [loadingHistorical, setLoadingHistorical] = useState<boolean>(false);
  const [allRounds, setAllRounds] = useState<{id: string, round_num: number}[]>([]);

  const isPointsMode = useMemo(() => (meta?.points_per_game ?? 0) > 0, [meta]);

  // ---------- When there's NO :eventId -> show recent events picker ----------
  useEffect(() => {
    if (eventId) return;
    (async () => {
      setLoading(true);
      setErrorMsg(null);

      const clubId = localStorage.getItem("clubId") || "";

      try {
        let rows: EvMeta[] = [];
        if (clubId) {
          // Try OR (club or null). If RLS / PostgREST blocks .or, fall back below.
          const { data, error } = await supabase
            .from("events")
            .select(
              "id,name,courts,round_minutes,points_per_game,ended_at,created_at,club_id"
            )
            .or(`club_id.eq.${clubId},club_id.is.null`)
            .order("created_at", { ascending: false })
            .limit(20);
          if (error) throw error;
          rows = (data || []) as EvMeta[];
        } else {
          // No club selected: just grab latest across all (RLS will still scope)
          const { data, error } = await supabase
            .from("events")
            .select(
              "id,name,courts,round_minutes,points_per_game,ended_at,created_at,club_id"
            )
            .order("created_at", { ascending: false })
            .limit(20);
          if (error) throw error;
          rows = (data || []) as EvMeta[];
        }

        // Fallback if OR failed / returned nothing but we DO have a clubId
        if (rows.length === 0 && clubId) {
          const combined: EvMeta[] = [];
          const { data: byClub } = await supabase
            .from("events")
            .select(
              "id,name,courts,round_minutes,points_per_game,ended_at,created_at,club_id"
            )
            .eq("club_id", clubId)
            .order("created_at", { ascending: false })
            .limit(20);
          if (byClub) combined.push(...(byClub as EvMeta[]));

          const { data: noClub } = await supabase
            .from("events")
            .select(
              "id,name,courts,round_minutes,points_per_game,ended_at,created_at,club_id"
            )
            .is("club_id", null)
            .order("created_at", { ascending: false })
            .limit(20);
          if (noClub) combined.push(...(noClub as EvMeta[]));

          rows = combined;
        }

        // Enhance events with statistics
        const enhancedEvents = await Promise.all(rows.map(async (event: any) => {
          try {
            // Get player count
            const { count: playerCount } = await supabase
              .from("event_players")
              .select("*", { count: "exact", head: true })
              .eq("event_id", event.id);
            
            // Get rounds count
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
              .limit(1);
            
            return {
              ...event,
              player_count: playerCount || 0,
              rounds_count: roundsCount || 0,
              last_activity: lastRound?.[0]?.created_at || null
            };
          } catch (e) {
            console.warn(`Failed to load stats for event ${event.id}:`, e);
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

  // ---------- Normal scoreboard when :eventId is present ----------
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

  // Load leaderboard when TV mode is enabled
  useEffect(() => {
    if (eventId && tvMode) {
      loadLeaderboard(eventId);
    }
  }, [eventId, tvMode]);

  // Update viewing round when current round changes
  useEffect(() => {
    if (!isViewingHistorical) {
      setViewingRoundNum(roundNum);
    }
  }, [roundNum, isViewingHistorical]);

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
      
      // Load leaderboard for TV mode
      if (tvMode) {
        await loadLeaderboard(eid);
      }
    }
  }

  async function loadLeaderboard(eid: string) {
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
      const playerStats = new Map<string, {
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
      }>();

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
  }

  // Load historical round data
  const loadHistoricalRound = async (eid: string, targetRoundNum: number) => {
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
        teamA: [m.team_a_player1, m.team_a_player2],
        teamB: [m.team_b_player1, m.team_b_player2],
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
  };

  // Handle round navigation
  const handleRoundChange = async (newRoundNum: number) => {
    console.log(`Navigating to round ${newRoundNum}, current round is ${roundNum}`);
    setViewingRoundNum(newRoundNum);
    const isHistorical = newRoundNum < roundNum;
    setIsViewingHistorical(isHistorical);
    
    if (isHistorical && eventId) {
      console.log(`Loading historical data for round ${newRoundNum}`);
      await loadHistoricalRound(eventId, newRoundNum);
    } else {
      // Back to current round - clear historical data
      console.log('Returning to current round');
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

  // ---------- Render ----------
  if (!eventId) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Scoreboard</h1>
            <p className="text-gray-600">
          Choose an event to view its live scoreboard.
        </p>
          </div>
  
        {loading ? (
            <div className="py-12 text-center text-gray-500">Loading events…</div>
        ) : errorMsg ? (
            <div className="py-12 text-center text-red-600">{errorMsg}</div>
        ) : recentEvents.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Events Found</h3>
                <p className="text-gray-600 mb-4">
                  No recent events found. Create your first event to get started.
                </p>
                <Link 
                  to="/events" 
                  className="inline-flex items-center px-4 py-2 rounded-lg text-white font-medium"
                  style={{ backgroundColor: '#0172fb' }}
                >
                  Create Event
            </Link>
              </div>
          </div>
        ) : (
          <div className="space-y-6">
              {/* Sort Controls */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700">Sort by:</span>
                  <select 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="recent">Most Recent</option>
                    <option value="name">Name</option>
                    <option value="players">Most Players</option>
                    <option value="courts">Most Courts</option>
                  </select>
                </div>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
                  <div className="text-3xl font-bold mb-1" style={{ color: '#0172fb' }}>
                    {recentEvents.length}
                  </div>
                  <div className="text-sm text-gray-600">Total Events</div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
                  <div className="text-3xl font-bold text-green-600 mb-1">
                    {recentEvents.filter(e => !e.ended_at).length}
                  </div>
                  <div className="text-sm text-gray-600">Active</div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
                  <div className="text-3xl font-bold text-amber-600 mb-1">
                    {recentEvents.reduce((sum, e) => sum + (e.player_count || 0), 0)}
                  </div>
                  <div className="text-sm text-gray-600">Total Players</div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-1">
                    {recentEvents.reduce((sum, e) => sum + (e.courts || 0), 0)}
                  </div>
                  <div className="text-sm text-gray-600">Total Courts</div>
                </div>
              </div>

            {(() => {
              const sortEvents = (events: EvMeta[]) => {
                switch (sortBy) {
                  case "name":
                    return events.sort((a, b) => a.name.localeCompare(b.name));
                  case "players":
                    return events.sort((a, b) => (b.player_count || 0) - (a.player_count || 0));
                  case "courts":
                    return events.sort((a, b) => (b.courts || 0) - (a.courts || 0));
                  case "recent":
                  default:
                    return events.sort(
                  (a, b) =>
                    new Date(b.created_at || 0).getTime() -
                    new Date(a.created_at || 0).getTime()
                );
                }
              };

              const active = sortEvents(recentEvents.filter((e) => !e.ended_at));
              const completed = sortEvents(recentEvents.filter((e) => !!e.ended_at));
  
              const Row = ({ e }: { e: typeof recentEvents[number] }) => {
                const isPoints = (e.points_per_game || 0) > 0;
                const ended = !!e.ended_at;
                const lastActivity = e.last_activity ? new Date(e.last_activity).toLocaleString() : null;
                
                return (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900 truncate">{e.name}</h3>
                          <span className="text-xs rounded-full border border-gray-300 px-2 py-1 text-gray-600 bg-gray-50">
                            {isPoints ? `${e.points_per_game} pts` : `${e.round_minutes} min`}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>
                            {e.courts} courts · {e.player_count || 0} players · {e.rounds_count || 0} rounds
                          </div>
                          <div>
                            Created: {e.created_at ? new Date(e.created_at).toLocaleString() : "—"}
                            {lastActivity && !ended && (
                              <span className="ml-2 text-green-600">
                                • Last activity: {lastActivity}
                              </span>
                            )}
                          </div>
                      </div>
                    </div>
                      <div className="flex items-center gap-4 ml-4">
                        <div className="text-right">
                          <div className="text-lg font-semibold text-gray-900">{e.player_count || 0}</div>
                          <div className="text-xs text-gray-500">players</div>
                    </div>
                      <div
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                          ended
                              ? "bg-red-100 text-red-700 border border-red-200"
                              : "bg-green-100 text-green-700 border border-green-200"
                        }`}
                      >
                        {ended ? "Completed" : "Active"}
                      </div>
                      <Link
                        to={`/scoreboard/${e.id}`}
                          className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors"
                      >
                          View Scoreboard
                      </Link>
                      </div>
                    </div>
                  </div>
                );
              };
  
              return (
                <>
                  <div>
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="h-3 w-3 rounded-full bg-green-500"></span>
                        <h2 className="text-lg font-semibold text-gray-900">Active Events</h2>
                        </div>
                      <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        {active.length}
                      </span>
                      </div>
                      {active.length === 0 ? (
                      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
                        <p className="text-gray-500">No active events.</p>
                        </div>
                      ) : (
                      <div className="space-y-4">{active.map((e) => <Row key={e.id} e={e} />)}</div>
                      )}
                    </div>

                  <div className="mt-8">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="h-3 w-3 rounded-full bg-red-500"></span>
                        <h2 className="text-lg font-semibold text-gray-900">Completed Events</h2>
                        </div>
                      <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        {completed.length}
                      </span>
                      </div>
                      {completed.length === 0 ? (
                      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
                        <p className="text-gray-500">No completed events yet.</p>
                        </div>
                      ) : (
                      <div className="space-y-4">{completed.map((e) => <Row key={e.id} e={e} />)}</div>
                      )}
                  </div>
                </>
              );
            })()}
          </div>
        )}
        </div>
      </div>
    );
  }
  

  return (
    <div className="min-h-screen bg-gray-50">
      <div className={tvMode ? "w-full min-h-screen px-6 py-4" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"}>
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-3xl font-bold text-gray-900 truncate mb-2">{meta?.name || "Event"}</h1>
              <div className="text-gray-600">
              {isPointsMode
                ? `${meta?.courts ?? "—"} courts · ${meta?.points_per_game} pts`
                : `${meta?.courts ?? "—"} courts · ${meta?.round_minutes} min`}
              {meta?.created_at ? ` · ${new Date(meta.created_at).toLocaleString()}` : ""}
            </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-gray-500">Players</div>
                <div className="text-2xl font-bold text-gray-900">{Object.keys(players).length}</div>
          </div>
          <div
                className={`px-4 py-2 rounded-full text-sm font-medium ${
              meta?.ended_at
                    ? "bg-red-100 text-red-700 border border-red-200"
                    : "bg-green-100 text-green-700 border border-green-200"
                }`}
              >
                {meta?.ended_at ? "Ended" : "Live"}
              </div>
              <button
                onClick={() => setTvMode(!tvMode)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  tvMode
                    ? "bg-blue-600 text-white shadow-lg"
                    : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {tvMode ? <MonitorX size={18} /> : <Monitor size={18} />}
                {tvMode ? "Exit TV Mode" : "TV Mode"}
              </button>
            </div>
          </div>
        </div>

        {tvMode ? (
          /* TV MODE LAYOUT */
          <div className="space-y-8">
            {/* Round Navigation and Title - Large for TV */}
            <RoundNav
              viewingRoundNum={viewingRoundNum}
              currentRoundNum={roundNum}
              loadingHistorical={loadingHistorical}
              isViewingHistorical={isViewingHistorical}
              matchCount={(isViewingHistorical ? historicalCourts : courts).length}
              allRounds={allRounds}
              onChange={handleRoundChange}
              variant="tv"
            />

            <div className="grid grid-cols-3 gap-8">
              {/* Court Cards - Left Side (2 columns) */}
              <div className="col-span-2">
                <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <Users className="text-blue-600" size={32} />
                  Current Matches
                </h2>
                <div className="grid grid-cols-2 gap-6">
                  {(isViewingHistorical ? historicalCourts : courts).slice(0, 4).map((ct) => {
                    const teamAScore = ct.scoreA ?? 0;
                    const teamBScore = ct.scoreB ?? 0;
                    const isWinnersCourt = ct.court_num === 1;
                    const hasScore = teamAScore > 0 || teamBScore > 0;
                    const teamAWinning = teamAScore > teamBScore;
                    const teamBWinning = teamBScore > teamAScore;
                    
                    return (
                      <div
                        key={ct.court_num}
                        className={`rounded-2xl shadow-lg border-2 p-6 transition-all duration-300 ${
                          isWinnersCourt 
                            ? "border-blue-400 bg-blue-50 shadow-blue-200/50" 
                            : "bg-white border-gray-200 hover:shadow-xl"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-2xl font-bold text-gray-900">
                            Court {ct.court_num}
                            {isWinnersCourt && (
                              <span className="ml-2 text-blue-600 text-lg">👑</span>
                            )}
                          </h3>
                          {hasScore && (
                            <div className={`text-sm px-3 py-1 rounded-full font-bold ${
                              teamAWinning 
                                ? "bg-green-100 text-green-800 border border-green-300"
                                : teamBWinning
                                ? "bg-blue-100 text-blue-800 border border-blue-300"
                                : "bg-gray-100 text-gray-800 border border-gray-300"
                            }`}>
                              {teamAWinning ? "Team A" : teamBWinning ? "Team B" : "Tied"}
                            </div>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-3 items-center gap-4 mb-6">
                          <div className="text-center">
                            <div className="font-bold text-lg text-gray-700 mb-2">Team A</div>
                            <div className="space-y-1">
                              <div className="text-lg font-semibold text-gray-900 truncate">
                                {players[ct.teamA[0]]?.full_name || 'Player 1'}
                              </div>
                              <div className="text-lg font-semibold text-gray-900 truncate">
                                {players[ct.teamA[1]]?.full_name || 'Player 2'}
                              </div>
                            </div>
                          </div>
                          <div className="text-center text-gray-400 text-3xl font-bold">VS</div>
                          <div className="text-center">
                            <div className="font-bold text-lg text-gray-700 mb-2">Team B</div>
                            <div className="space-y-1">
                              <div className="text-lg font-semibold text-gray-900 truncate">
                                {players[ct.teamB[0]]?.full_name || 'Player 1'}
                              </div>
                              <div className="text-lg font-semibold text-gray-900 truncate">
                                {players[ct.teamB[1]]?.full_name || 'Player 2'}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-5xl font-bold mb-2">
                            <span className={teamAWinning ? "text-green-600" : "text-gray-700"}>
                              {teamAScore}
                            </span>
                            <span className="text-gray-400 mx-3">:</span>
                            <span className={teamBWinning ? "text-blue-600" : "text-gray-700"}>
                              {teamBScore}
                            </span>
                          </div>
                          {!hasScore && (
                            <div className="text-lg text-gray-500 font-medium">
                              Starting soon...
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Leaderboard - Right Side (1 column) */}
              <div className="col-span-1">
                <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <Trophy className="text-yellow-600" size={32} />
                  Live Rankings
                </h2>
                <LeaderboardTable rows={leaderboard as any} />
              </div>
            </div>
          </div>
        ) : (
          /* NORMAL MODE LAYOUT */
          <>
            {/* Event Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
                <div className="text-3xl font-bold mb-1" style={{ color: '#0172fb' }}>
                  {meta?.courts || 0}
                </div>
                <div className="text-sm text-gray-600">Courts</div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
                <div className="text-3xl font-bold text-green-600 mb-1">{Object.keys(players).length}</div>
                <div className="text-sm text-gray-600">Players</div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
                <div className="text-3xl font-bold text-purple-600 mb-1">{roundNum}</div>
                <div className="text-sm text-gray-600">Current Round</div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
                <div className="text-3xl font-bold text-amber-600 mb-1">{courts.length}</div>
                <div className="text-sm text-gray-600">Active Matches</div>
          </div>
        </div>

            {/* Round Navigation and Title */}
            <RoundNav
              viewingRoundNum={viewingRoundNum}
              currentRoundNum={roundNum}
              loadingHistorical={loadingHistorical}
              isViewingHistorical={isViewingHistorical}
              matchCount={(isViewingHistorical ? historicalCourts : courts).length}
              allRounds={allRounds}
              onChange={handleRoundChange}
              variant="normal"
            />
          </>
        )}

        {/* Courts grid - Only show in normal mode */}
        {!tvMode && (
          <>
        {loading ? (
              <div className="py-16 text-center text-gray-500">Loading…</div>
        ) : errorMsg ? (
              <div className="py-16 text-center text-red-600">{errorMsg}</div>
            ) : (isViewingHistorical ? historicalCourts : courts).length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <p className="text-gray-500">No matches in this round yet.</p>
          </div>
        ) : (
              <div className="grid lg:grid-cols-2 gap-6">
            {(isViewingHistorical ? historicalCourts : courts).map((ct) => {
              const teamAScore = ct.scoreA ?? 0;
              const teamBScore = ct.scoreB ?? 0;
              const isWinnersCourt = ct.court_num === 1;
              const hasScore = teamAScore > 0 || teamBScore > 0;
              const teamAWinning = teamAScore > teamBScore;
              const teamBWinning = teamBScore > teamAScore;
              
              return (
              <div
                key={ct.court_num}
                  className={`rounded-xl shadow-sm border p-6 transition-all duration-200 ${
                    isWinnersCourt 
                      ? "border-blue-300 bg-blue-50" 
                      : "bg-white border-gray-200 hover:shadow-md"
                  }`}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-gray-900">
                  Court {ct.court_num}
                      {isWinnersCourt && (
                        <span className="ml-2 text-blue-600 text-sm">🏆 Winners Court</span>
                      )}
                    </h3>
                    {hasScore && (
                      <div className={`text-xs px-3 py-1 rounded-full font-medium ${
                        teamAWinning 
                          ? "bg-green-100 text-green-700 border border-green-200"
                          : teamBWinning
                          ? "bg-blue-100 text-blue-700 border border-blue-200"
                          : "bg-gray-100 text-gray-700 border border-gray-200"
                      }`}>
                        {teamAWinning ? "Team A Leading" : teamBWinning ? "Team B Leading" : "Tied"}
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-3 items-center gap-4 mb-6">
                    <div className="text-center">
                      <div className="font-medium text-sm text-gray-500 mb-2">Team A</div>
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {players[ct.teamA[0]]?.full_name || 'Player 1'}
                        </div>
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {players[ct.teamA[1]]?.full_name || 'Player 2'}
                        </div>
                      </div>
                </div>
                    <div className="text-center text-gray-400 text-xl font-bold">VS</div>
                    <div className="text-center">
                      <div className="font-medium text-sm text-gray-500 mb-2">Team B</div>
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {players[ct.teamB[0]]?.full_name || 'Player 1'}
                  </div>
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {players[ct.teamB[1]]?.full_name || 'Player 2'}
                  </div>
                </div>
                </div>
              </div>
                  
                  <div className="text-center">
                    <div className="text-6xl font-bold mb-2">
                      <span className={teamAWinning ? "text-green-600" : "text-gray-700"}>
                        {teamAScore}
                      </span>
                      <span className="text-gray-400 mx-4">:</span>
                      <span className={teamBWinning ? "text-blue-600" : "text-gray-700"}>
                        {teamBScore}
                      </span>
                    </div>
                    {!hasScore && (
                      <div className="text-sm text-gray-500">
                        Match not started
          </div>
                    )}
                  </div>
                </div>
              );
            })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
