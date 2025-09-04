// src/components/scoreboard/LeaderboardTable.tsx
import { Trophy } from "lucide-react";

export interface LeaderboardRow {
  player_id: string;
  full_name: string;
  elo: number;
  total_score: number;
  games_played: number;
  games_won: number;
  games_lost: number;
  goal_difference: number;
  win_rate: number;
  prev_rank?: number; // for movement diff
  rank_change?: number; // calculated rank movement
}

interface LeaderboardTableProps {
  rows: LeaderboardRow[];
  compact?: boolean; // tighter padding (sidebar)
  largeScale?: boolean; // upscale for 4K
}

export default function LeaderboardTable({ rows, compact, largeScale }: LeaderboardTableProps) {
  const scale = largeScale ? {
    head: 'text-sm',
    cell: 'text-lg',
    points: 'text-2xl',
    badge: 'w-9 h-9 text-sm'
  } : compact ? {
    head: 'text-[10px]',
    cell: 'text-[11px]',
    points: 'text-sm',
    badge: 'w-6 h-6 text-[10px]'
  } : {
    head: 'text-xs',
    cell: 'text-base',
    points: 'text-lg',
    badge: 'w-7 h-7 text-xs'
  };

  return (
    <div className={`bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden`} style={{ height: compact ? 'auto' : largeScale ? '100%' : 'auto', maxHeight: compact ? '400px' : largeScale ? '100%' : '800px' }}>
      {rows && rows.length > 0 ? (
        <div className="overflow-y-auto h-full">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
              <tr>
                <th className={`px-2 ${compact ? 'py-2' : 'py-4'} text-center ${scale.head} font-bold text-gray-900`}>#</th>
                <th className={`px-3 ${compact ? 'py-2' : 'py-4'} text-left ${scale.head} font-bold text-gray-900`}>Player</th>
                <th className={`px-2 ${compact ? 'py-2' : 'py-4'} text-center ${scale.head} font-bold text-gray-900`}>Games</th>
                <th className={`px-2 ${compact ? 'py-2' : 'py-4'} text-center ${scale.head} font-bold text-gray-900`}>W</th>
                <th className={`px-2 ${compact ? 'py-2' : 'py-4'} text-center ${scale.head} font-bold text-gray-900`}>L</th>
                <th className={`px-2 ${compact ? 'py-2' : 'py-4'} text-center ${scale.head} font-bold text-gray-900`}>+/-</th>
                <th className={`px-3 ${compact ? 'py-2' : 'py-4'} text-right ${scale.head} font-bold text-gray-900`}>Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((player, index) => {
                const rank = index + 1;
                const moved = player.prev_rank && player.prev_rank !== rank;
                const direction = moved ? (player.prev_rank! > rank ? 'up' : 'down') : null;
                return (
                  <tr key={player.player_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-2 py-2 text-center">
                      <div className={`${scale.badge} rounded-full flex items-center justify-center font-bold mx-auto ${
                        rank === 1 ? "bg-yellow-100 text-yellow-800" :
                        rank === 2 ? "bg-gray-100 text-gray-700" :
                        rank === 3 ? "bg-orange-100 text-orange-700" :
                        "bg-blue-50 text-blue-600"
                      }`}>
                        {rank}
                      </div>
                      {moved && (
                        <div className={`mt-1 text-[10px] font-semibold ${direction==='up' ? 'text-green-600' : 'text-red-600'} flex items-center justify-center gap-0.5`}> 
                          {direction==='up' ? '▲' : '▼'}
                          {Math.abs(player.prev_rank! - rank)}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <div className={`font-bold text-gray-900 truncate ${scale.cell} leading-tight`}>{player.full_name}</div>
                      <div className="text-[10px] text-gray-400 font-medium">ELO {player.elo}</div>
                    </td>
                    <td className="px-2 py-2 text-center">
                      <span className={`${scale.cell} font-bold text-gray-700`}>{player.games_played}</span>
                    </td>
                    <td className="px-2 py-2 text-center">
                      <span className={`${scale.cell} font-bold text-green-600`}>{player.games_won}</span>
                    </td>
                    <td className="px-2 py-2 text-center">
                      <span className={`${scale.cell} font-bold text-red-600`}>{player.games_lost}</span>
                    </td>
                    <td className="px-2 py-2 text-center">
                      <span className={`${scale.cell} font-bold ${
                        player.goal_difference > 0 ? "text-green-600" :
                        player.goal_difference < 0 ? "text-red-600" :
                        "text-gray-600"
                      }`}>
                        {player.goal_difference > 0 ? "+" : ""}{player.goal_difference}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className={`${scale.points} font-bold text-blue-600`}>{Math.round(player.total_score * 10) / 10}</div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-8 text-center text-gray-500">
          <Trophy className="mx-auto mb-2" size={48} />
          <p className="text-lg">Leaderboard loading...</p>
        </div>
      )}
    </div>
  );
}


