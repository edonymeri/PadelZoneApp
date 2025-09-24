// src/components/scoreboard/ScoreboardLeaderboard.tsx
import { Trophy } from "lucide-react";
import LeaderboardTable from "./LeaderboardTable";

interface ScoreboardLeaderboardProps {
  leaderboard: any[];
  eventWinners: any;
  isEnded: boolean;
}

export default function ScoreboardLeaderboard({
  leaderboard,
  eventWinners,
  isEnded
}: ScoreboardLeaderboardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mt-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
        <Trophy className={`${isEnded ? 'text-yellow-600' : 'text-yellow-600'}`} size={28} />
        {isEnded ? 'Final Rankings' : 'Live Rankings'}
      </h2>
      
      {isEnded && eventWinners && (
        <div className="mb-6 p-4 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl border border-yellow-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
            🏆 Tournament Winners
          </h3>
          <div className="space-y-2 text-sm">
            {eventWinners.first && (
              <div className="flex items-center gap-2">
                <span className="font-semibold text-yellow-700">🥇 1st Place:</span>
                <span className="text-gray-900">{eventWinners.first}</span>
              </div>
            )}
            {eventWinners.second && (
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-600">🥈 2nd Place:</span>
                <span className="text-gray-900">{eventWinners.second}</span>
              </div>
            )}
            {eventWinners.third && (
              <div className="flex items-center gap-2">
                <span className="font-semibold text-amber-600">🥉 3rd Place:</span>
                <span className="text-gray-900">{eventWinners.third}</span>
              </div>
            )}
          </div>
        </div>
      )}
      
      <LeaderboardTable rows={leaderboard as any} />
    </div>
  );
}