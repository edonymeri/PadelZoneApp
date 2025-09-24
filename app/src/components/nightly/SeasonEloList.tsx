// src/components/nightly/SeasonEloList.tsx
import { Link } from "react-router-dom";
import { MiniAvatar } from "./MiniAvatar";

type SeasonPlayer = { id: string; full_name: string; elo: number };

interface SeasonEloListProps {
  players: SeasonPlayer[];
  loading: boolean;
  error: string | null;
}

export function SeasonEloList({ players, loading, error }: SeasonEloListProps) {
  return (
    <div className="space-y-3">
      {loading ? (
        <div className="py-6 text-center text-gray-500">Loading…</div>
      ) : error ? (
        <div className="py-6 text-center text-red-600">{error}</div>
      ) : players.length === 0 ? (
        <div className="py-6 text-center text-gray-500">No players yet.</div>
      ) : (
        <div className="space-y-2">
          {players.slice(0, 10).map((p, idx) => (
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
          {players.length > 10 && (
            <div className="text-center text-sm text-gray-500 py-2">
              And {players.length - 10} more players...
            </div>
          )}
        </div>
      )}
    </div>
  );
}