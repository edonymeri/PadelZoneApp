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
}

export default function LeaderboardTable({ rows }: { rows: LeaderboardRow[] }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 max-h-[800px] overflow-hidden">
      {rows && rows.length > 0 ? (
        <div className="overflow-y-auto max-h-[800px]">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
              <tr>
                <th className="px-2 py-4 text-center text-xs font-bold text-gray-900">#</th>
                <th className="px-3 py-4 text-left text-xs font-bold text-gray-900">Player</th>
                <th className="px-2 py-4 text-center text-xs font-bold text-gray-900">Games</th>
                <th className="px-2 py-4 text-center text-xs font-bold text-gray-900">W</th>
                <th className="px-2 py-4 text-center text-xs font-bold text-gray-900">L</th>
                <th className="px-2 py-4 text-center text-xs font-bold text-gray-900">+/-</th>
                <th className="px-3 py-4 text-right text-xs font-bold text-gray-900">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((player, index) => (
                <tr key={player.player_id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-2 py-3 text-center">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mx-auto ${
                      index === 0 ? "bg-yellow-100 text-yellow-800" :
                      index === 1 ? "bg-gray-100 text-gray-700" :
                      index === 2 ? "bg-orange-100 text-orange-700" :
                      "bg-blue-50 text-blue-600"
                    }`}>
                      {index + 1}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="font-bold text-gray-900 text-sm leading-tight">
                      {player.full_name}
                    </div>
                  </td>
                  <td className="px-2 py-3 text-center">
                    <span className="text-base font-bold text-gray-700">
                      {player.games_played}
                    </span>
                  </td>
                  <td className="px-2 py-3 text-center">
                    <span className="text-base font-bold text-green-600">
                      {player.games_won}
                    </span>
                  </td>
                  <td className="px-2 py-3 text-center">
                    <span className="text-base font-bold text-red-600">
                      {player.games_lost}
                    </span>
                  </td>
                  <td className="px-2 py-3 text-center">
                    <span className={`text-base font-bold ${
                      player.goal_difference > 0 ? "text-green-600" :
                      player.goal_difference < 0 ? "text-red-600" :
                      "text-gray-600"
                    }`}>
                      {player.goal_difference > 0 ? "+" : ""}{player.goal_difference}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <div className="text-lg font-bold text-blue-600">
                      {Math.round(player.total_score * 10) / 10}
                    </div>
                  </td>
                </tr>
              ))}
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


