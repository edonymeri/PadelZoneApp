// src/components/event/EventWinners.tsx
import { Trophy, Medal, Star } from "lucide-react";

export interface EventWinner {
  player_id: string;
  full_name: string;
  total_points: number;
  games_won: number;
  games_played: number;
  win_rate: number;
}

export interface EventWinners {
  champion?: EventWinner;
  mostGamesWon?: EventWinner;
  bestWinRate?: EventWinner;
}

export default function EventWinners({ winners }: { winners: EventWinners }) {
  if (!winners.champion && !winners.mostGamesWon && !winners.bestWinRate) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-center mb-3">
        <Trophy className="text-white mr-2" size={24} />
        <h3 className="text-white font-bold text-lg">🏆 Event Winners</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Champion */}
        {winners.champion && (
          <div className="bg-white/20 rounded-lg p-3">
            <div className="flex items-center mb-2">
              <Trophy className="text-yellow-200 mr-2" size={20} />
              <span className="text-white font-bold text-sm">Champion</span>
            </div>
            <div className="text-white text-sm">
              <div className="font-semibold">{winners.champion.full_name}</div>
              <div className="text-xs opacity-90">
                {winners.champion.total_points} points • {winners.champion.games_won}W-{winners.champion.games_played - winners.champion.games_won}L
              </div>
            </div>
          </div>
        )}

        {/* Most Games Won */}
        {winners.mostGamesWon && (
          <div className="bg-white/20 rounded-lg p-3">
            <div className="flex items-center mb-2">
              <Star className="text-yellow-200 mr-2" size={20} />
              <span className="text-white font-bold text-sm">Most Wins</span>
            </div>
            <div className="text-white text-sm">
              <div className="font-semibold">{winners.mostGamesWon.full_name}</div>
              <div className="text-xs opacity-90">
                {winners.mostGamesWon.games_won} wins • {Math.round(winners.mostGamesWon.win_rate)}% win rate
              </div>
            </div>
          </div>
        )}

        {/* Best Win Rate */}
        {winners.bestWinRate && (
          <div className="bg-white/20 rounded-lg p-3">
            <div className="flex items-center mb-2">
              <Medal className="text-yellow-200 mr-2" size={20} />
              <span className="text-white font-bold text-sm">Best Win Rate</span>
            </div>
            <div className="text-white text-sm">
              <div className="font-semibold">{winners.bestWinRate.full_name}</div>
              <div className="text-xs opacity-90">
                {winners.bestWinRate.games_won}W-{winners.bestWinRate.games_played - winners.bestWinRate.games_won}L 
                • {Math.round(winners.bestWinRate.win_rate)}% win rate
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
