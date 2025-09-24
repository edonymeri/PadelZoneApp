// src/components/nightly/LeaderboardTable.tsx
import { useMemo } from "react";
import { Link } from "react-router-dom";
import type { UUID } from "@/lib/types";

type PlayerRecord = { id: UUID; full_name: string; elo: number };

interface LeaderboardTableProps {
  eventId: string;
  players: Record<UUID, PlayerRecord>;
  leaderboardData: any[];
  loading: boolean;
  error: string | null;
}

export function LeaderboardTable({ 
  players, 
  leaderboardData, 
  loading, 
  error 
}: LeaderboardTableProps) {
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
      ) : error ? (
        <div className="py-6 text-center text-red-600">{error}</div>
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