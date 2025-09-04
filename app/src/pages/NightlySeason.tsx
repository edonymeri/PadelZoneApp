// src/pages/NightlySeason.tsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { calculateEventLeaderboard } from "@/lib/leaderboard";
import { supabase } from "@/lib/supabase";
import type { UUID } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/* ---------- Shared mini avatar (deterministic, non-blue palette) ---------- */
function colorForName(name?: string) {
  const palette = ["#F59E0B","#10B981","#EF4444","#8B5CF6","#F97316","#14B8A6","#A855F7","#EAB308","#22C55E","#EC4899"];
  if (!name) return palette[0];
  let h = 0; for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
}
function initials(name?: string) {
  if (!name) return "–";
  const parts = name.trim().split(/\s+/);
  const i1 = parts[0]?.[0] ?? "";
  const i2 = parts[1]?.[0] ?? "";
  const s = (i1 + i2).toUpperCase();
  return s || i1.toUpperCase() || "–";
}
function MiniAvatar({ name, size = 24 }: { name?: string; size?: number }) {
  const bg = colorForName(name);
  return (
    <div
      className="rounded-full grid place-content-center font-semibold"
      style={{ width: size, height: size, background: bg, color: "white", fontSize: Math.max(10, Math.floor(size*0.42)) }}
      title={name || ""}
      aria-hidden
    >
      {initials(name)}
    </div>
  );
}

/* ========================= Nightly Leaderboard ========================= */

type PlayerRecord = { id: UUID; full_name: string; elo: number };
type NightlyProps = {
  eventId: string;
  players: Record<UUID, PlayerRecord>; // from EventControl (roster map)
};

/**
 * Shows one table: Player | Won | Lost | ± | Score
 * - Score = SUM(round_points.points) per player for this event
 * - Won/Lost/± derived from matches in all rounds of this event
 * - Player name and avatar link to /player/:id
 */
export function Nightly({ eventId, players }: NightlyProps) {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // State for leaderboard data
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const data = await calculateEventLeaderboard(eventId);
        setLeaderboardData(data);
      } catch (e: any) {
        setErr(e.message || String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [eventId]);

  // Build rows for players present in the event roster
  const rows = useMemo(() => {
    const ids = Object.keys(players);
    const out = ids.map((pid) => {
      const name = players[pid]?.full_name || "—";
      const playerData = leaderboardData.find(p => p.player_id === pid);
      const score = playerData?.total_score ?? 0;
      const won = playerData?.games_won ?? 0;
      const lost = playerData?.games_lost ?? 0;
      const diff = playerData?.goal_difference ?? 0;
      const gamesPlayed = playerData?.games_played ?? 0;
      return { pid, name, score, gamesPlayed, won, lost, diff };
    });
    // sort by Score desc, then diff desc, then name
    out.sort((a, b) => (b.score - a.score) || (b.diff - a.diff) || a.name.localeCompare(b.name));
    return out;
  }, [players, leaderboardData]);

  return (
    <div className="overflow-x-auto">
      {loading ? (
        <div className="py-6 text-center text-gray-500">Loading…</div>
      ) : err ? (
        <div className="py-6 text-center text-red-600">{err}</div>
      ) : rows.length === 0 ? (
        <div className="py-6 text-center text-gray-500">No results yet.</div>
      ) : (
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-bold text-gray-900">Player</th>
              <th className="px-3 py-3 text-center text-sm font-bold text-gray-900">Games</th>
              <th className="px-3 py-3 text-center text-sm font-bold text-gray-900">Won</th>
              <th className="px-3 py-3 text-center text-sm font-bold text-gray-900">Lost</th>
              <th className="px-3 py-3 text-center text-sm font-bold text-gray-900">±</th>
              <th className="px-4 py-3 text-right text-sm font-bold text-gray-900">Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((r, index) => (
              <tr key={r.pid} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0 ? "bg-yellow-100 text-yellow-800" :
                      index === 1 ? "bg-gray-100 text-gray-700" :
                      index === 2 ? "bg-orange-100 text-orange-700" :
                      "bg-blue-50 text-blue-600"
                    }`}>
                      {index + 1}
                    </div>
                    <Link to={`/player/${r.pid}`} className="font-medium text-gray-900 hover:text-blue-600 transition-colors">
                      {r.name}
                    </Link>
                  </div>
                </td>
                <td className="px-3 py-3 text-center">
                  <span className="text-lg font-bold text-gray-700">
                    {r.gamesPlayed}
                  </span>
                </td>
                <td className="px-3 py-3 text-center">
                  <span className="text-lg font-bold text-green-600">
                    {r.won}
                  </span>
                </td>
                <td className="px-3 py-3 text-center">
                  <span className="text-lg font-bold text-red-600">
                    {r.lost}
                  </span>
                </td>
                <td className="px-3 py-3 text-center">
                  <span className={`text-lg font-bold ${
                    r.diff > 0 ? "text-green-600" :
                    r.diff < 0 ? "text-red-600" :
                    "text-gray-600"
                  }`}>
                    {r.diff >= 0 ? `+${r.diff}` : r.diff}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="text-xl font-bold text-blue-600">
                    {Math.round(r.score * 10) / 10}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

/* ============================== Season (ELO) ============================== */

type SeasonProps = { clubId: string };
type SeasonPlayer = { id: string; full_name: string; elo: number };

export function Season({ clubId }: SeasonProps) {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [list, setList] = useState<SeasonPlayer[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        if (!clubId) { setList([]); setLoading(false); return; }
        const { data, error } = await supabase
          .from("players")
          .select("id, full_name, elo")
          .eq("club_id", clubId)
          .order("elo", { ascending: false })
          .limit(1000);
        if (error) throw error;
        setList((data || []) as SeasonPlayer[]);
      } catch (e: any) {
        setErr(e.message || String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [clubId]);

  return (
    <div className="space-y-3">
      {loading ? (
        <div className="py-6 text-center text-gray-500">Loading…</div>
      ) : err ? (
        <div className="py-6 text-center text-red-600">{err}</div>
      ) : list.length === 0 ? (
        <div className="py-6 text-center text-gray-500">No players yet.</div>
      ) : (
        <div className="space-y-2">
          {list.slice(0, 10).map((p, idx) => (
            <div
              key={p.id}
              className="flex items-center justify-between bg-white rounded-lg border border-gray-200 px-4 py-3 hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  idx === 0 ? "bg-yellow-100 text-yellow-800" :
                  idx === 1 ? "bg-gray-100 text-gray-700" :
                  idx === 2 ? "bg-orange-100 text-orange-700" :
                  "bg-blue-50 text-blue-600"
                }`}>
                  {idx + 1}
                </div>
                <MiniAvatar name={p.full_name} />
                <Link to={`/player/${p.id}`} className="font-medium text-gray-900 hover:text-blue-600 transition-colors truncate">
                  {p.full_name}
                </Link>
              </div>
              <div className="text-lg font-bold text-blue-600">
                {Math.round(p.elo)}
              </div>
            </div>
          ))}
          {list.length > 10 && (
            <div className="text-center text-sm text-gray-500 py-2">
              And {list.length - 10} more players...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
